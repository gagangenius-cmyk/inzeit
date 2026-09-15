'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo, isFinanceOrAccounts, isBranchManagerOrCeo } from '@/lib/roleChecks';
import { Receipt } from 'lucide-react';

interface SalesRow {
  id: number; name: string; client: string;
  counselorId: number | null; counselor: string;
  branchId: number | null; branch: string;
  status: string; date: string;
  currencyCode: string;
  totalFeeLocal: number; paidLocal: number; balanceLocal: number;
  totalFeeAed: number; paidAed: number; balanceAed: number;
  receiptCount: number; receiptTotalLocal: number; receiptTotalAed: number;
  latestReceiptDate: string | null; receiptNumbers: string;
}

interface Summary { opportunities: number; won: number; totalAed: number; collectedAed: number; balanceAed: number; }
interface FilterOptions { branches: { id: number; name: string }[]; counselors: { id: number; name: string }[]; }

interface ExchangeRate { id: number; currency_code: string; rate_to_aed: number; status: number; }
interface BranchMapping { id: number; branch_id: number; exchange_rate_id: number; branch?: { id: number; name: string }; }

const STATUS_COLOR: Record<string, string> = {
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  prospect: 'bg-gray-100 text-gray-600',
  qualified: 'bg-blue-100 text-blue-700',
  negotiation: 'bg-yellow-100 text-yellow-700',
  quotation_sent: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-600',
};

const fmtAed = (v: number) => `AED ${Number(v || 0).toLocaleString('en', { maximumFractionDigits: 0 })}`;

const emptyFilters = { dateFrom: '', dateTo: '', branchId: '', counselorId: '', search: '' };

export default function SalesReportPage() {
  const { user } = useAuth();

  const fullAccess = !!user && (user.permissions?.includes('all') || isCeo(user as any) || isFinanceOrAccounts(user as any));
  const branchLocked = !!user && !fullAccess && isBranchManagerOrCeo(user as any);
  const canManageRates = fullAccess;
  const canSeeCounselorFilter = fullAccess || branchLocked;
  const canSeeBranchFilter = fullAccess;

  const [filters, setFilters] = useState(emptyFilters);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [rows, setRows] = useState<SalesRow[]>([]);
  const { sorted: sortedRows, sortKey: salesSortKey, sortDirection: salesSortDirection, toggleSort: toggleSalesSort } = useSortableData(
    rows,
    {
      client: (r) => r.client,
      counselor: (r) => r.counselor,
      branch: (r) => r.branch,
      total: (r) => r.totalFeeAed,
      collected: (r) => r.paidAed,
      balance: (r) => r.balanceAed,
      receipts: (r) => r.receiptCount,
      receiptTotal: (r) => r.receiptTotalAed,
      status: (r) => r.status,
      date: (r) => r.date,
    },
  );
  const [summary, setSummary] = useState<Summary | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ branches: [], counselors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRatesPanel, setShowRatesPanel] = useState(false);
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.branchId && { branchId: filters.branchId }),
        ...(filters.counselorId && { counselorId: filters.counselorId }),
        ...(filters.search && { search: filters.search }),
      });
      const res = await fetch(`/api/admin/accounts/sales-report?${params}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to load sales report');
      setRows(result.data);
      setSummary(result.summary);
      setFilterOptions(result.filters);
      setPagination((p) => ({ ...p, total: result.pagination.total, totalPages: result.pagination.totalPages }));
    } catch (e: any) {
      setError(e.message || 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters.dateFrom, filters.dateTo, filters.branchId, filters.counselorId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Debounced search, same pattern as the Currency page.
  useEffect(() => {
    const t = setTimeout(() => {
      if (pagination.page === 1) fetchReport();
      else setPagination((p) => ({ ...p, page: 1 }));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleDownloadExcel = async () => {
    setExporting(true);
    setError('');
    try {
      const exportLimit = 200;
      const baseParams = {
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.branchId && { branchId: filters.branchId }),
        ...(filters.counselorId && { counselorId: filters.counselorId }),
        ...(filters.search && { search: filters.search }),
      };

      const allRows: SalesRow[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const params = new URLSearchParams({ ...baseParams, page: String(page), limit: String(exportLimit) });
        const res = await fetch(`/api/admin/accounts/sales-report?${params}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to load sales report');
        allRows.push(...result.data);
        totalPages = result.pagination.totalPages || 1;
        page += 1;
      } while (page <= totalPages);

      const XLSX = await import('xlsx');
      const sheetRows = allRows.map((r) => ({
        'Client': r.client,
        'Opportunity': r.name,
        'Counselor': r.counselor,
        'Branch': r.branch,
        'Currency': r.currencyCode,
        'Total (Local)': r.totalFeeLocal,
        'Paid (Local)': r.paidLocal,
        'Balance (Local)': r.balanceLocal,
        'Total (AED)': r.totalFeeAed,
        'Collected (AED)': r.paidAed,
        'Balance (AED)': r.balanceAed,
        'Receipts': r.receiptCount,
        'Receipt Total (AED)': r.receiptTotalAed,
        'Latest Receipt Date': r.latestReceiptDate || '',
        'Receipt Numbers': r.receiptNumbers || '',
        'Status': r.status,
        'Date': r.date,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

      if (summary) {
        const summaryWs = XLSX.utils.json_to_sheet([
          { Metric: 'Opportunities', Value: summary.opportunities },
          { Metric: 'Won', Value: summary.won },
          { Metric: 'Total (AED)', Value: summary.totalAed },
          { Metric: 'Collected (AED)', Value: summary.collectedAed },
          { Metric: 'Balance (AED)', Value: summary.balanceAed },
        ]);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      }

      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `sales-report-${stamp}.xlsx`);
    } catch (e: any) {
      setError(e.message || 'Failed to export sales report');
    } finally {
      setExporting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-gray-600 mt-1">
            {fullAccess
              ? 'Complete sales report, normalized to AED'
              : branchLocked
                ? 'Sales report for your branch, normalized to AED'
                : 'Your own won sales, normalized to AED'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadExcel}
            disabled={exporting || rows.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting…' : 'Download Excel'}
          </button>
          {canManageRates && (
            <button
              onClick={() => setShowRatesPanel(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Manage Exchange Rates
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-xs font-medium text-gray-500 uppercase">Total Sales</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{fmtAed(summary.totalAed)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-xs font-medium text-gray-500 uppercase">Collected</div>
            <div className="text-xl font-bold text-green-700 mt-1">{fmtAed(summary.collectedAed)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-xs font-medium text-gray-500 uppercase">Balance</div>
            <div className="text-xl font-bold text-red-600 mt-1">{fmtAed(summary.balanceAed)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-xs font-medium text-gray-500 uppercase">Won Sales</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{summary.won}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search client, counselor, opportunity..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>From</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span>To</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {canSeeBranchFilter && (
            <SearchableSelect
              value={filters.branchId}
              onChange={(e) => updateFilter('branchId', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {filterOptions.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </SearchableSelect>
          )}
          {canSeeCounselorFilter && (
            <SearchableSelect
              value={filters.counselorId}
              onChange={(e) => updateFilter('counselorId', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Counselors</option>
              {filterOptions.counselors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SearchableSelect>
          )}
          {(filters.dateFrom || filters.dateTo || filters.branchId || filters.counselorId || filters.search) && (
            <button
              onClick={() => { setFilters(emptyFilters); setPagination((p) => ({ ...p, page: 1 })); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="p-4">
            <SortButtonRow
              options={[
                ['client', 'Client / Opportunity'],
                ['counselor', 'Counselor'],
                ['branch', 'Branch'],
                ['total', 'Total (AED)'],
                ['collected', 'Collected (AED)'],
                ['balance', 'Balance (AED)'],
                ['receipts', 'Receipts'],
                ['receiptTotal', 'Receipt Total (AED)'],
                ['status', 'Status'],
                ['date', 'Date'],
              ] as const}
              activeKey={salesSortKey}
              direction={salesSortDirection}
              onSort={toggleSalesSort}
            />
            <RecordList isEmpty={sortedRows.length === 0} emptyIcon={Receipt} emptyTitle="No won sales found">
              {sortedRows.map((r) => {
                const isExpanded = expandedSaleId === r.id;
                return (
                  <RecordCard
                    key={r.id}
                    avatar={<span className="text-sm font-semibold">{isExpanded ? '-' : '+'}</span>}
                    avatarColorClass="from-blue-600 to-cyan-400"
                    title={
                      <button type="button" onClick={() => setExpandedSaleId((current) => current === r.id ? null : r.id)} aria-expanded={isExpanded} className="min-w-0 break-words text-left text-base font-bold text-gray-950" title="Show receipt brief">
                        {r.client}
                      </button>
                    }
                    titleBadges={<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>}
                    metaItems={[{ icon: Receipt, text: r.name, key: 'opp' }]}
                    stats={[
                      { label: 'Counselor', value: r.counselor },
                      { label: 'Branch', value: r.branch },
                      { label: 'Total', value: fmtAed(r.totalFeeAed) },
                      { label: 'Collected', value: <span className="text-green-700">{fmtAed(r.paidAed)}</span> },
                      { label: 'Balance', value: <span className="text-red-600">{fmtAed(r.balanceAed)}</span> },
                      { label: 'Receipts', value: r.receiptCount },
                      { label: 'Receipt Total', value: <span className="text-blue-700">{fmtAed(r.receiptTotalAed)}</span> },
                      { label: 'Date', value: r.date },
                    ]}
                    extra={isExpanded ? (
                      <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-blue-50/40 p-3 text-sm md:grid-cols-4">
                        <div>
                          <div className="text-xs font-medium uppercase text-gray-500">Receipts Made</div>
                          <div className="mt-1 font-semibold text-gray-900">{r.receiptCount}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium uppercase text-gray-500">Receipt Total</div>
                          <div className="mt-1 font-semibold text-blue-700">{fmtAed(r.receiptTotalAed)}</div>
                          {r.currencyCode !== 'AED' && (
                            <div className="text-xs text-gray-500">{r.currencyCode} {Number(r.receiptTotalLocal || 0).toLocaleString('en', { maximumFractionDigits: 2 })}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-medium uppercase text-gray-500">Latest Receipt</div>
                          <div className="mt-1 font-semibold text-gray-900">{r.latestReceiptDate || 'No receipt yet'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium uppercase text-gray-500">Receipt Numbers</div>
                          <div className="mt-1 truncate font-medium text-gray-700" title={r.receiptNumbers || undefined}>
                            {r.receiptNumbers || 'No receipt numbers'}
                          </div>
                        </div>
                      </div>
                    ) : undefined}
                  />
                );
              })}
            </RecordList>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            Show
            <SearchableSelect
              value={pagination.limit}
              onChange={(e) => setPagination((p) => ({ ...p, limit: Number(e.target.value), page: 1 }))}
              className="border border-gray-300 rounded px-2 py-1"
            >
              {[25, 50, 100, 200].map((v) => <option key={v} value={v}>{v}</option>)}
            </SearchableSelect>
            entries &mdash; {pagination.total} total
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >Next</button>
          </div>
        </div>
      </div>

      {showRatesPanel && (
        <ExchangeRatesPanel
          branches={filterOptions.branches}
          onClose={() => setShowRatesPanel(false)}
        />
      )}
    </div>
  );
}

function ExchangeRatesPanel({ branches, onClose }: { branches: { id: number; name: string }[]; onClose: () => void }) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [mappings, setMappings] = useState<BranchMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newRate, setNewRate] = useState({ currency_code: '', rate_to_aed: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/accounts/exchange-rates');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setRates(result.rates);
      setMappings(result.mappings);
    } catch (e: any) {
      setError(e.message || 'Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const mappingByBranch = useMemo(() => {
    const map = new Map<number, number>();
    mappings.forEach((m) => map.set(m.branch_id, m.exchange_rate_id));
    return map;
  }, [mappings]);

  const handleAddRate = async () => {
    if (!newRate.currency_code.trim() || !newRate.rate_to_aed) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/accounts/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency_code: newRate.currency_code.trim(), rate_to_aed: Number(newRate.rate_to_aed) }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to add rate');
      setNewRate({ currency_code: '', rate_to_aed: '' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRateChange = async (id: number, rate_to_aed: number) => {
    setBusy(true);
    try {
      await fetch('/api/admin/accounts/exchange-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rate_to_aed }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRate = async (id: number) => {
    if (!confirm('Delete this exchange rate?')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/accounts/exchange-rates?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete rate');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleMapChange = async (branchId: number, exchangeRateId: string) => {
    setBusy(true);
    try {
      if (!exchangeRateId) {
        await fetch(`/api/admin/accounts/exchange-rates/map?branchId=${branchId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/admin/accounts/exchange-rates/map', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch_id: branchId, exchange_rate_id: Number(exchangeRateId) }),
        });
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Currency Exchange Rates</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Rates (to AED)</h4>
              <div className="space-y-2">
                {rates.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-sm">
                    <span className="w-16 font-mono font-medium text-gray-900">{r.currency_code}</span>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      defaultValue={r.rate_to_aed}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val > 0 && val !== Number(r.rate_to_aed)) handleRateChange(r.id, val);
                      }}
                      disabled={busy}
                      className="w-32 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-xs">1 {r.currency_code} = this many AED</span>
                    {r.currency_code !== 'AED' && (
                      <button
                        onClick={() => handleDeleteRate(r.id)}
                        disabled={busy}
                        className="ml-auto text-red-600 hover:text-red-800 text-xs"
                      >Delete</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <input
                  type="text"
                  placeholder="Currency code (e.g. QAR)"
                  value={newRate.currency_code}
                  onChange={(e) => setNewRate((v) => ({ ...v, currency_code: e.target.value.toUpperCase() }))}
                  maxLength={10}
                  className="w-40 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="Rate to AED"
                  value={newRate.rate_to_aed}
                  onChange={(e) => setNewRate((v) => ({ ...v, rate_to_aed: e.target.value }))}
                  className="w-32 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddRate}
                  disabled={busy}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >Add Rate</button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Branch Mapping</h4>
              <p className="text-xs text-gray-400 mb-2">Branches with no mapping default to AED (rate 1).</p>
              <div className="space-y-2">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 text-gray-800">{b.name}</span>
                    <SearchableSelect
                      value={mappingByBranch.get(b.id) || ''}
                      onChange={(e) => handleMapChange(b.id, e.target.value)}
                      className="w-48 border border-gray-300 rounded px-2 py-1.5 text-sm"
                    >
                      <option value="">AED (default)</option>
                      {rates.filter((r) => r.currency_code !== 'AED').map((r) => (
                        <option key={r.id} value={r.id}>{r.currency_code} ({Number(r.rate_to_aed)})</option>
                      ))}
                    </SearchableSelect>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  );
}
