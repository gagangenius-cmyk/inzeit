'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { CrmClients, CrmClientsAttributes, CrmcForumLeadsContracts, CrmcForumLeadsContractsAttributes } from '@/models';

interface ClientContractWizardProps {
  clientId: number;
  onContractGenerated: (contractId: number) => void;
}

export default function ClientContractWizard({ clientId, onContractGenerated }: ClientContractWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [contractData, setContractData] = useState({
    clientId: clientId,
    contractType: 'individual',
    serviceType: '',
    programType: '',
    duration: '12',
    startDate: '',
    endDate: '',
    totalAmount: '',
    paymentTerms: 'full',
    specialTerms: '',
    counselorId: 1,
    branchId: 1,
    regionId: 1,
  });

  const [contracts, setContracts] = useState<CrmcForumLeadsContractsAttributes[]>([]);
  const [client, setClient] = useState<CrmClientsAttributes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing contracts for this client
    // The instruction's `databaseClient` line seems to be a syntax error.
    // Assuming the intent was to add a mock client and keep the mock contracts.
        setClient(null);

    const databaseContracts: CrmcForumLeadsContractsAttributes[] = []
    setContracts([]);
    setLoading(false);
  }, [clientId]);

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (field: string, value: any) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const generateContract = async () => {
    try {
      // In a real implementation, this would call an API to generate contract
      const response = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (response.ok) {
        const result = await response.json();
        onContractGenerated(result.contractId);
        setCurrentStep(4); // Success step
      } else {
        throw new Error('Failed to generate contract');
      }
    } catch (error) {
      console.error('Error generating contract:', error);
      window.toast.error('Failed to generate contract. Please try again.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 1: Contract Type Selection</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contract Type</label>
                  <SearchableSelect
                    value={contractData.contractType}
                    onChange={(e) => handleInputChange('contractType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select contract type</option>
                    <option value="individual">Individual</option>
                    <option value="family">Family</option>
                    <option value="student">Student</option>
                    <option value="business">Business</option>
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                  <SearchableSelect
                    value={contractData.serviceType}
                    onChange={(e) => handleInputChange('serviceType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select service type</option>
                    <option value="immigration">Immigration</option>
                    <option value="education">Education</option>
                    <option value="business">Business Setup</option>
                    <option value="training">Training</option>
                  </SearchableSelect>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program Type</label>
                  <SearchableSelect
                    value={contractData.programType}
                    onChange={(e) => handleInputChange('programType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select program</option>
                    <option value="express">Express Entry</option>
                    <option value="regular">Regular</option>
                    <option value="provincial">Provincial Nomination</option>
                    <option value="federal">Federal Skilled Worker</option>
                    <option value="study">Study Permit</option>
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (months)</label>
                  <input
                    type="number"
                    value={contractData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    min="1"
                    max="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 2: Financial Details</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount ($)</label>
                  <input
                    type="number"
                    value={contractData.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                  <SearchableSelect
                    value={contractData.paymentTerms}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full">Full Payment</option>
                    <option value="installment">Installment</option>
                    <option value="milestone">Milestone</option>
                  </SearchableSelect>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Terms</label>
                  <textarea
                    value={contractData.specialTerms}
                    onChange={(e) => handleInputChange('specialTerms', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter any special terms and conditions..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 3: Contract Details</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={contractData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={contractData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Counselor</label>
                  <SearchableSelect
                    value={contractData.counselorId}
                    onChange={(e) => handleInputChange('counselorId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select counselor</option>
                    <option value="1">Counselor 1</option>
                    <option value="2">Counselor 2</option>
                    <option value="3">Counselor 3</option>
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <SearchableSelect
                    value={contractData.branchId}
                    onChange={(e) => handleInputChange('branchId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select branch</option>
                    <option value="1">Dubai Main</option>
                    <option value="2">Abu Dhabi</option>
                    <option value="3">Sharjah</option>
                  </SearchableSelect>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Contract
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <div className="mb-4">
                <div className="text-green-800">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Contract Generated Successfully!</h3>
                <p className="text-green-700 mb-4">
                  Contract ID: #{Math.floor(Math.random() * 10000)}
                </p>
                <p className="text-green-700 mb-4">
                  Your contract has been generated and is ready for review.
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Print Contract
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="text-center text-gray-500">
              <div className="mb-8">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <p className="text-xl font-medium text-gray-600 mb-4">Contract wizard not available</p>
              <p className="text-gray-500">Please select a client to generate a contract.</p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Client Contract Generation Wizard</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Client ID: #{clientId}</span>
              <button
                onClick={() => window.close()}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                      }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                Step {currentStep} of 4
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg p-6">
            {renderStep()}
          </div>

          {/* Existing Contracts */}
          {contracts.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Existing Contracts</h3>
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contract ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contract
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{contract.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <a
                              href={`/uploads/contracts/${contract.contract}`}
                              target="_blank"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {contract.contract}
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${contract.verify === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {contract.verify === 1 ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {contract.verify_date?.toLocaleDateString() || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => window.open(`/uploads/contracts/${contract.contract}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            View
                          </button>
                          <button
                            onClick={() => window.open(`/uploads/contracts/${contract.unsigned_contract}`, '_blank')}
                            className="text-gray-600 hover:text-gray-800 mr-2"
                          >
                            View Unsigned
                          </button>
                          <button
                            onClick={() => window.open(`/uploads/contracts/${contract.ar_contract}`, '_blank')}
                            className="text-gray-600 hover:text-gray-800 mr-2"
                          >
                            View Arabic
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



