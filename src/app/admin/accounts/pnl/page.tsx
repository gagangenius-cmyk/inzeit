'use client';

import { useState, useEffect, useCallback } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { RecordCard, RecordList } from '@/components/shared/ResponsiveRecordList';
import { Receipt } from 'lucide-react';

interface PnlSummary {
  grossRevenue: number; netRevenue: number; totalExpenses: number;
  opProfit: number; ctProvision: number; netProfit: number; marginPercent: number;
}
interface ExpenseLine { groupName: string; code: string | null; name: string | null; amount: number; vat: number; total: number; }
interface BranchOption { id: number; name: string; }

const fmtAed = (v: number) => `AED ${Number(v || 0).toLocaleString('en', { maximumFractionDigits: 0 })}`;

// toISOString() converts to UTC first, which rolls the date back a day in
// timezones ahead of UTC - use local getters so "this month" matches the
// viewer's own calendar month.
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function currentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { dateFrom: isoDate(from), dateTo: isoDate(to) };
}

export default function PnlPage() {
  const [branchId, setBranchId] = useState('');
  const [range, setRange] = useState(currentMonthRange());
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [summary, setSummary] = useState<PnlSummary | null>(null);
  const [expenseLines, setExpenseLines] = useState<ExpenseLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/lead-filter-options')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => { if (json?.branches) setBranches(json.branches.map((b: any) => ({ id: Number(b.value), name: b.label }))); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ dateFrom: range.dateFrom, dateTo: range.dateTo });
      if (branchId) params.set('branchId', branchId);
      const res = await fetch(`/api/admin/accounts/pnl?${params}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to load P&L');
      setSummary(result.summary);
      setExpenseLines(result.expenseLines);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [branchId, range]);

  useEffect(() => { load(); }, [load]);

  const groupedExpenses = expenseLines.reduce<Record<string, ExpenseLine[]>>((acc, line) => {
    (acc[line.groupName] ||= []).push(line);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profit &amp; Loss</h1>
        <p className="text-gray-600 mt-1">Revenue, expenses, and provisional Corporate Tax, in AED</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>From</span>
            <input type="date" value={range.dateFrom} onChange={(e) => setRange((r) => ({ ...r, dateFrom: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <span>To</span>
            <input type="date" value={range.dateTo} onChange={(e) => setRange((r) => ({ ...r, dateTo: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={() => setRange(currentMonthRange())} className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
            This Month
          </button>
          <SearchableSelect value={branchId} onChange={(e) => setBranchId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </SearchableSelect>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-xs font-medium text-gray-500 uppercase">Gross Revenue</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{fmtAed(summary.grossRevenue)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-xs font-medium text-gray-500 uppercase">Net Revenue</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{fmtAed(summary.netRevenue)}</div>
              <div className="text-xs text-gray-400 mt-0.5">excl. VAT/GST</div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-xs font-medium text-gray-500 uppercase">Total Expenses</div>
              <div className="text-xl font-bold text-red-600 mt-1">{fmtAed(summary.totalExpenses)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-xs font-medium text-gray-500 uppercase">Op. Profit</div>
              <div className={`text-xl font-bold mt-1 ${summary.opProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmtAed(summary.opProfit)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-xs font-medium text-gray-500 uppercase">CT Provision (9%)</div>
              <div className="text-xl font-bold text-orange-600 mt-1">{fmtAed(summary.ctProvision)}</div>
              <div className="text-xs text-gray-400 mt-0.5">UAE branches only, pro-rated Small Business Relief — confirm with a tax advisor</div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-xs font-medium text-gray-500 uppercase">Net Profit</div>
              <div className={`text-xl font-bold mt-1 ${summary.netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmtAed(summary.netProfit)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="text-xs font-medium text-gray-500 uppercase">Margin</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{summary.marginPercent}%</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Expenses by Account Group</h3>
            </div>
            {Object.keys(groupedExpenses).length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">No expenses in this period</div>
            ) : (
              Object.entries(groupedExpenses).map(([groupName, lines]) => (
                <div key={groupName} className="border-b border-gray-100 p-3 last:border-0">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{groupName}</div>
                  <RecordList isEmpty={false}>
                    {lines.map((line, i) => (
                      <RecordCard
                        key={i}
                        avatar={<Receipt className="h-4 w-4" />}
                        avatarColorClass="from-slate-600 to-gray-400"
                        title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{line.name || 'Uncategorized'}</span>}
                        titleBadges={line.code ? <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-600">{line.code}</span> : undefined}
                        stats={[
                          { label: 'Amount', value: fmtAed(line.amount) },
                          { label: 'VAT', value: <span className="text-orange-600">{fmtAed(line.vat)}</span> },
                          { label: 'Total', value: <span className="font-bold">{fmtAed(line.total)}</span> },
                        ]}
                      />
                    ))}
                  </RecordList>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
