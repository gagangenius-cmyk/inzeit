'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead } from '@/types/lead';
import { useAuth } from '@/contexts/AuthContext';
import { isFinanceOrAccounts, isCeo } from '@/lib/roleChecks';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { BANK_PAYMENT_OPTIONS, CARD_PAYMENT_OPTIONS } from '@/lib/paymentOptions';
import { uploadFileToBlob } from '@/lib/uploadToBlob';
import { printEvaluationReport } from '@/lib/evaluationReportTemplate';
import { calculateEvaluationReportTotal, EVALUATION_REPORT_MAX_DISCOUNT_INR } from '@/lib/evaluationReportDefaults';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle, User, Mail, Phone, Globe, Briefcase,
  Target, FileText, DollarSign, FolderOpen, Receipt, ClipboardCheck, Upload, Loader2,
  AlertCircle, Save, Printer,
} from 'lucide-react';

interface EvaluationReportWizardProps {
  leadId: number;
  initialStage?: string;
}

interface FlowStage {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'current' | 'completed';
}

const STAGE_IDS = ['prospect', 'quotation', 'payment', 'documents', 'accounts', 'evaluation-report'];

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const DOCUMENT_CHECKLIST = [
  { key: 'passport', label: 'Passport' },
  { key: 'resume', label: 'Resume / CV' },
  { key: 'certificates', label: 'Educational Certificates' },
  { key: 'other', label: 'Other Supporting Document' },
];

export default function EvaluationReportWizard({ leadId, initialStage }: EvaluationReportWizardProps) {
  const resolvedInitialStage = initialStage && STAGE_IDS.includes(initialStage) ? initialStage : 'prospect';
  const { user } = useAuth();
  const [activeStage, setActiveStage] = useState<string>(resolvedInitialStage);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notHyderabad, setNotHyderabad] = useState(false);

  const [stages, setStages] = useState<FlowStage[]>(() => {
    const base: FlowStage[] = [
      { id: 'prospect', name: 'Prospect', description: 'Client details', icon: Target, status: 'pending' },
      { id: 'quotation', name: 'Quotation', description: 'Evaluation fee', icon: FileText, status: 'pending' },
      { id: 'payment', name: 'Payment', description: 'Collect payment', icon: DollarSign, status: 'pending' },
      { id: 'documents', name: 'Documents', description: 'Upload supporting documents', icon: FolderOpen, status: 'pending' },
      { id: 'accounts', name: 'Accounts', description: 'Verify documents', icon: Receipt, status: 'pending' },
      { id: 'evaluation-report', name: 'Evaluation Report', description: 'Generate PDF', icon: ClipboardCheck, status: 'pending' },
    ];
    const targetIndex = base.findIndex((s) => s.id === resolvedInitialStage);
    return base.map((s, idx) => ({
      ...s,
      status: idx < targetIndex ? 'completed' : idx === targetIndex ? 'current' : 'pending',
    }));
  });

  const [discount, setDiscount] = useState(0);
  const quotationTotal = calculateEvaluationReportTotal(discount);

  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    proofOfPayment: null as File | null,
  });
  const [receipt, setReceipt] = useState<any>(null);
  const [savingPayment, setSavingPayment] = useState(false);

  const [eligibilitySummary, setEligibilitySummary] = useState('');
  const [existingReport, setExistingReport] = useState<any>(null);
  const [completing, setCompleting] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/leads/${leadId}`);
        if (!res.ok) throw new Error('Failed to fetch lead');
        const leadData = await res.json();
        setLead(leadData);
        if (!isCeo(user) && String(leadData?.dmBranch?.abbrv || '').trim().toUpperCase() !== 'HYD') {
          setNotHyderabad(true);
        }
      } catch (error) {
        console.error('Error fetching lead:', error);
        window.toast.error('Failed to load lead');
      } finally {
        setLoading(false);
      }
    })();
  }, [leadId]);

  // Resume support: if this lead already has a generated Evaluation Report,
  // hydrate it so the final stage offers reprint instead of re-finalizing.
  useEffect(() => {
    if (notHyderabad || !leadId) return;
    fetch(`/api/evaluation-reports?leadId=${leadId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setExistingReport(json.data);
          setEligibilitySummary(json.data.eligibilitySummary || '');
        }
      })
      .catch(() => {});
  }, [leadId, notHyderabad]);

  const applyStageProgress = (stageId: string) => {
    const targetIndex = STAGE_IDS.indexOf(stageId);
    if (targetIndex < 0) return;
    setStages((prev) => prev.map((s, idx) => ({
      ...s,
      status: idx < targetIndex ? 'completed' : idx === targetIndex ? 'current' : 'pending',
    })));
    setActiveStage(stageId);
  };

  const goNext = () => {
    const idx = STAGE_IDS.indexOf(activeStage);
    if (idx < STAGE_IDS.length - 1) applyStageProgress(STAGE_IDS[idx + 1]);
  };
  const goPrevious = () => {
    const idx = STAGE_IDS.indexOf(activeStage);
    if (idx > 0) setActiveStage(STAGE_IDS[idx - 1]);
  };

  const handleStageClick = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage || stage.status === 'pending') return;
    setActiveStage(stageId);
  };

  const submitPayment = async () => {
    if (!paymentData.proofOfPayment) {
      window.toast.warning('Upload proof of payment before creating the receipt.');
      return;
    }
    setSavingPayment(true);
    try {
      const safeName = paymentData.proofOfPayment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await uploadFileToBlob(
        paymentData.proofOfPayment,
        `evaluation-report/lead-${leadId}/payment-proof/${Date.now()}_${safeName}`,
      );

      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          // No opportunityId — this is the invariant that keeps this flow
          // from ever creating an agreement or making the lead eligible to
          // appear as a Client. See /api/receipts and /api/admin/clients.
          paymentData: {
            paymentStructure: 'full',
            paymentMethod: paymentData.paymentMethod,
            transactionId: paymentData.transactionId || undefined,
            paymentDate: paymentData.paymentDate,
            paidAmount: quotationTotal.netPayable,
            totalAmount: quotationTotal.netPayable,
            amount: quotationTotal.netPayable,
            proofOfPaymentUrl: blob.url,
          },
          receiptData: {
            description: `Evaluation report fee for ${lead?.fname || ''} ${lead?.lname || ''}`.trim(),
            receiptType: 'evaluation_report',
            taxAmount: 0,
            discountAmount: quotationTotal.discount,
            notes: '',
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create receipt');
      setReceipt(json.data?.receipt || null);
      window.toast.success(`Receipt ${json.data?.receipt?.receiptNumber || ''} created successfully!`);
    } catch (error) {
      console.error('Error saving payment:', error);
      window.toast.error(error instanceof Error ? error.message : 'Failed to save payment');
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cmg-blue)] mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading evaluation report flow...</p>
        </div>
      </div>
    );
  }

  if (notHyderabad) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="mx-auto mb-3 text-amber-500" size={40} />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Hyderabad-Branch Leads Only</h1>
          <p className="text-gray-600 mb-4">The Evaluation Report flow is only available for leads assigned to the Hyderabad branch.</p>
          <button
            onClick={() => window.location.href = '/admin/leads'}
            className="px-4 py-2 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)]"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  const renderStageContent = () => {
    switch (activeStage) {
      case 'prospect':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Details</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center text-gray-700"><User className="mr-2 text-gray-400" size={16} /><span>{lead?.fname} {lead?.lname}</span></div>
                <div className="flex items-center text-gray-700"><Mail className="mr-2 text-gray-400" size={16} /><span className="truncate">{lead?.email}</span></div>
                <div className="flex items-center text-gray-700"><Phone className="mr-2 text-gray-400" size={16} /><span>{lead?.phone || lead?.mobile}</span></div>
                <div className="flex items-center text-gray-700"><Globe className="mr-2 text-gray-400" size={16} /><span>{lead?.country_interest_label || lead?.country_interest}</span></div>
                <div className="flex items-center text-gray-700"><Briefcase className="mr-2 text-gray-400" size={16} /><span>{lead?.service_interest_label || lead?.service_interest}</span></div>
                <div className="flex items-start text-gray-700 sm:col-span-2"><span className="mr-2 text-gray-400">Address:</span><span>{lead?.address || 'Not on file'}</span></div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={goNext} className="px-6 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] flex items-center font-medium">
                Next: Quotation <ChevronRight className="ml-2" size={20} />
              </button>
            </div>
          </div>
        );

      case 'quotation':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Fee</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation Fee (INR)</label>
                  <input type="number" value={quotationTotal.fee} readOnly className="w-full p-3 border rounded-lg bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount (INR, up to {EVALUATION_REPORT_MAX_DISCOUNT_INR})</label>
                  <input
                    type="number"
                    min={0}
                    max={EVALUATION_REPORT_MAX_DISCOUNT_INR}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Net Payable (INR)</label>
                  <input type="number" value={quotationTotal.netPayable} readOnly className="w-full p-3 border rounded-lg bg-gray-50 font-semibold" />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={goPrevious} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium">
                <ChevronLeft className="mr-2" size={20} /> Back
              </button>
              <button onClick={goNext} className="px-6 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] flex items-center font-medium">
                Next: Payment <ChevronRight className="ml-2" size={20} />
              </button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Payable (INR)</label>
                  <input type="number" value={quotationTotal.netPayable} readOnly className="w-full p-3 border rounded-lg bg-gray-50 font-semibold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <SearchableSelect
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    disabled={!!receipt}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <optgroup label="Bank">
                      {BANK_PAYMENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </optgroup>
                    <optgroup label="Card / POS">
                      {CARD_PAYMENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </optgroup>
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                  <input
                    type="text" value={paymentData.transactionId} disabled={!!receipt}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Enter transaction reference"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                  <input
                    type="date" value={paymentData.paymentDate} disabled={!!receipt}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Payment <span className="text-red-500">*</span></label>
                  {paymentData.proofOfPayment instanceof File ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm text-green-800 truncate flex-1">{paymentData.proofOfPayment.name}</span>
                      {!receipt && (
                        <button type="button" onClick={() => setPaymentData({ ...paymentData, proofOfPayment: null })} className="text-red-500 hover:text-red-700 text-xs shrink-0">
                          Remove
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${receipt ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 cursor-pointer hover:border-teal-400 hover:bg-teal-50'}`}>
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Choose file</span>
                      <input
                        type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" disabled={!!receipt}
                        onChange={(e) => setPaymentData({ ...paymentData, proofOfPayment: e.target.files?.[0] || null })}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {receipt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="font-semibold text-green-800">Receipt Created: {receipt.receiptNumber || receipt.paymentNumber}</div>
                <div className="text-sm text-green-700">Amount: INR {Number(receipt.paidAmount || receipt.amount || 0).toLocaleString()}</div>
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={goPrevious} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium">
                <ChevronLeft className="mr-2" size={20} /> Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={submitPayment}
                  disabled={savingPayment || !!receipt || !paymentData.proofOfPayment}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center font-medium"
                >
                  <Save className="mr-2" size={20} /> {savingPayment ? 'Saving…' : receipt ? 'Receipt Created' : 'Save & Create Receipt'}
                </button>
                <button
                  onClick={goNext}
                  disabled={!receipt}
                  title={!receipt ? 'Save & Create Receipt before continuing' : undefined}
                  className="px-6 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
                >
                  Next: Documents <ChevronRight className="ml-2" size={20} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <DocumentsStage leadId={leadId} uploadedBy={user?.id} onNext={goNext} onPrevious={goPrevious} />
        );

      case 'accounts':
        return (
          <AccountsStage leadId={leadId} canVerify={isFinanceOrAccounts(user as any)} onNext={goNext} onPrevious={goPrevious} />
        );

      case 'evaluation-report':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Eligibility Assessment</h3>
              <textarea
                value={eligibilitySummary}
                onChange={(e) => setEligibilitySummary(e.target.value)}
                disabled={!!existingReport}
                rows={8}
                className="w-full p-3 border rounded-lg disabled:bg-gray-50"
                placeholder="Write the counselor's eligibility assessment / recommendation here..."
              />
            </div>

            {existingReport && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                An Evaluation Report was already generated for this lead on {new Date(existingReport.generatedAt).toLocaleDateString()}. You can reprint it below.
              </div>
            )}

            <div className="flex justify-between">
              <button onClick={goPrevious} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium">
                <ChevronLeft className="mr-2" size={20} /> Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setPrinting(true);
                    try {
                      printEvaluationReport({
                        reportDate: new Date().toLocaleDateString('en-GB'),
                        clientName: `${lead?.fname || ''} ${lead?.lname || ''}`.trim(),
                        clientAddress: lead?.address || '',
                        clientPhoneEmail: [lead?.phone || lead?.mobile, lead?.email].filter(Boolean).join(' / '),
                        destinationCountry: lead?.country_interest_label || lead?.country_interest || '',
                        programOfInterest: lead?.service_interest_label || lead?.service_interest || '',
                        eligibilitySummary,
                        feePaid: String(quotationTotal.fee),
                        discountApplied: String(existingReport?.discountApplied ?? quotationTotal.discount),
                        netPayable: String(receipt?.paidAmount ?? existingReport?.feePaid ?? quotationTotal.netPayable),
                        receiptNumber: receipt?.receiptNumber || existingReport?.receiptNumber || '',
                        generatedBy: user?.name || '',
                      });
                    } finally {
                      setPrinting(false);
                    }
                  }}
                  disabled={printing || !eligibilitySummary.trim()}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 flex items-center font-medium"
                >
                  <Printer className="mr-2" size={20} /> {printing ? 'Opening…' : 'Generate PDF'}
                </button>
                {!existingReport && (
                  <button
                    onClick={async () => {
                      if (!eligibilitySummary.trim()) {
                        window.toast.warning('Write an eligibility summary before completing.');
                        return;
                      }
                      if (!receipt) {
                        window.toast.warning('Create the payment receipt before completing.');
                        return;
                      }
                      setCompleting(true);
                      try {
                        const res = await fetch('/api/evaluation-reports', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            leadId,
                            eligibilitySummary,
                            feePaid: Number(receipt.paidAmount ?? receipt.amount ?? quotationTotal.netPayable),
                            discountApplied: quotationTotal.discount,
                            receiptNumber: receipt.receiptNumber || receipt.paymentNumber || '',
                          }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error || 'Failed to complete evaluation report');
                        setExistingReport(json);
                        window.toast.success('Evaluation Report completed.');
                      } catch (error) {
                        console.error('Error completing evaluation report:', error);
                        window.toast.error(error instanceof Error ? error.message : 'Failed to complete evaluation report');
                      } finally {
                        setCompleting(false);
                      }
                    }}
                    disabled={completing || !receipt}
                    className="px-6 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] disabled:bg-gray-400 flex items-center font-medium"
                  >
                    <CheckCircle className="mr-2" size={20} /> {completing ? 'Completing…' : 'Complete'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="bg-white">
        <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Generate Evaluation Report</h1>
                <p className="text-gray-600 mt-1">Hyderabad branch — immigration eligibility assessment (does not create an agreement or convert this lead to a client)</p>
              </div>
              <button
                onClick={() => window.history.back()}
                className="self-start sm:self-auto px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
              >
                <ChevronLeft className="mr-1" size={20} />
                Back to Leads
              </button>
            </div>

            {lead && (
              <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <User className="mr-2 text-[var(--cmg-blue)]" size={18} />
                  <span className="font-semibold text-gray-900">{lead.fname} {lead.lname}</span>
                  <span className="px-2 py-1 text-xs bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)] rounded">ID: #{lead.id}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex max-w-full flex-wrap items-center gap-2">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isActive = stage.id === activeStage;
                const isLocked = stage.status === 'pending';
                return (
                  <div key={stage.id} className="flex flex-none items-center">
                    <button
                      onClick={() => handleStageClick(stage.id)}
                      disabled={isLocked}
                      title={isLocked ? 'Complete the earlier stages first' : undefined}
                      className={`flex flex-none items-center whitespace-nowrap px-3 py-2 sm:px-4 rounded-lg transition-all ${
                        isActive
                          ? 'bg-[var(--cmg-blue)] text-white shadow-md'
                          : stage.status === 'completed'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Icon size={16} className="mr-2 flex-shrink-0" />
                      <span className="text-xs font-medium sm:text-sm">{stage.name}</span>
                      {stage.status === 'completed' && <CheckCircle size={14} className="ml-2 flex-shrink-0" />}
                    </button>
                    {index < stages.length - 1 && (
                      <ChevronRight size={16} className={`mx-1 hidden flex-shrink-0 2xl:block ${stage.status === 'completed' ? 'text-green-600' : 'text-gray-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 min-h-[60vh]">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activeStage} initial="hidden" animate="visible" exit="exit" variants={stepVariants} transition={{ duration: 0.3 }}>
                {renderStageContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsStage({ leadId, uploadedBy, onNext, onPrevious }: { leadId: number; uploadedBy?: number; onNext: () => void; onPrevious: () => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const loadDocuments = () => {
    fetch(`/api/evaluation-report-documents?leadId=${leadId}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setDocuments(json.data || []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDocuments(); }, [leadId]);

  const handleUpload = async (key: string, label: string, file: File) => {
    setUploading((p) => ({ ...p, [key]: true }));
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await uploadFileToBlob(file, `evaluation-report-documents/lead-${leadId}/${key}/${Date.now()}_${safeName}`);
      const res = await fetch('/api/evaluation-report-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          documentLabel: label,
          fileUrl: blob.url,
          fileName: safeName,
          uploadedBy: uploadedBy || 1,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed for ${file.name}`);
      }
      window.toast.success(`${label} uploaded.`);
      loadDocuments();
    } catch (error) {
      console.error('Error uploading evaluation report document:', error);
      window.toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading((p) => ({ ...p, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h3>
        <div className="space-y-3">
          {DOCUMENT_CHECKLIST.map(({ key, label }) => {
            const uploaded = documents.filter((d) => d.documentLabel === label);
            return (
              <div key={key} className="flex flex-wrap items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{label}</div>
                  {uploaded.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {uploaded.map((d) => (
                        <div key={d.id} className="flex items-center gap-1">
                          <CheckCircle size={12} className="text-green-600" /> {d.fileName}
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            d.status === 'verified' ? 'bg-green-100 text-green-700' : d.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>{d.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-teal-400 hover:bg-teal-50 text-sm text-gray-600">
                  {uploading[key] ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading[key] ? 'Uploading…' : 'Upload'}
                  <input
                    type="file" className="hidden" disabled={uploading[key]}
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(key, label, file); e.target.value = ''; }}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onPrevious} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium">
          <ChevronLeft className="mr-2" size={20} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={loading || documents.length === 0}
          title={documents.length === 0 ? 'Upload at least one document before continuing' : undefined}
          className="px-6 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center font-medium"
        >
          Next: Accounts <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}

function AccountsStage({ leadId, canVerify, onNext, onPrevious }: { leadId: number; canVerify: boolean; onNext: () => void; onPrevious: () => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [acting, setActing] = useState<Record<number, boolean>>({});

  const loadDocuments = () => {
    setLoading(true);
    fetch(`/api/evaluation-report-documents?leadId=${leadId}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setDocuments(json.data || []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDocuments(); }, [leadId]);

  const act = async (id: number, status: 'verified' | 'rejected') => {
    const reviewNote = notes[id]?.trim();
    if (status === 'rejected' && !reviewNote) {
      window.toast.warning('A review note is required when rejecting a document.');
      return;
    }
    setActing((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/evaluation-report-documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update document');
      }
      loadDocuments();
    } catch (error) {
      console.error('Error verifying document:', error);
      window.toast.error(error instanceof Error ? error.message : 'Failed to update document');
    } finally {
      setActing((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {canVerify ? 'Verify Uploaded Documents' : 'Document Review Status'}
        </h3>
        {loading ? (
          <div className="text-gray-500 text-sm flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : documents.length === 0 ? (
          <div className="text-gray-500 text-sm">No documents uploaded yet.</div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-800">{doc.documentLabel}</div>
                    <div className="text-xs text-gray-500">{doc.fileName}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    doc.status === 'verified' ? 'bg-green-100 text-green-700' : doc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{doc.status}</span>
                </div>
                {doc.reviewNote && <p className="text-xs text-gray-500 mt-1">Note: {doc.reviewNote}</p>}
                {canVerify && doc.status !== 'verified' && doc.status !== 'rejected' && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="text" placeholder="Review note (required for reject)"
                      value={notes[doc.id] || ''}
                      onChange={(e) => setNotes((p) => ({ ...p, [doc.id]: e.target.value }))}
                      className="flex-1 min-w-[200px] px-2 py-1.5 border rounded text-sm"
                    />
                    <button
                      onClick={() => act(doc.id, 'verified')}
                      disabled={acting[doc.id]}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-60 flex items-center gap-1"
                    >
                      <CheckCircle size={14} /> Verify
                    </button>
                    <button
                      onClick={() => act(doc.id, 'rejected')}
                      disabled={acting[doc.id]}
                      className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-60 flex items-center gap-1"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!canVerify && (
          <p className="text-xs text-gray-500 mt-3">Awaiting review by Accounts/Finance.</p>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={onPrevious} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center font-medium">
          <ChevronLeft className="mr-2" size={20} /> Back
        </button>
        <button onClick={onNext} className="px-6 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)] flex items-center font-medium">
          Next: Evaluation Report <ChevronRight className="ml-2" size={20} />
        </button>
      </div>
    </div>
  );
}
