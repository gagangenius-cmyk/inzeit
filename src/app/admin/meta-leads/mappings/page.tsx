'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect, useCallback } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { Plus, Trash2, Edit2, Check, X, Info, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';

interface Mapping {
  id: number;
  scope_type: 'GLOBAL' | 'CAMPAIGN' | 'FORM';
  campaign_id: string | null;
  form_id: string | null;
  meta_field_key: string;
  crm_field_key: string;
  fallback_value: string | null;
  transform_type: string | null;
  is_enabled: number;
  sort_order: number;
}

const SCOPE_COLORS: Record<string, string> = {
  GLOBAL: 'bg-blue-100 text-blue-800',
  CAMPAIGN: 'bg-purple-100 text-purple-800',
  FORM: 'bg-green-100 text-green-800',
};

const CRM_FIELDS = [
  'lastName','email','phone','AgeRange','ImmigrationType','Branch',
  'ResidentCountry','UTMSource','Education','DestinationCountry','LeadSource','roundrobin',
];

const TRANSFORMS = ['','uppercase','lowercase','trim','phone_e164'];

type ScopeType = 'GLOBAL' | 'CAMPAIGN' | 'FORM';

const emptyForm: {
  scope_type: ScopeType;
  campaign_id: string;
  form_id: string;
  meta_field_key: string;
  crm_field_key: string;
  fallback_value: string;
  transform_type: string;
  is_enabled: number;
  sort_order: number;
} = {
  scope_type: 'GLOBAL',
  campaign_id: '',
  form_id: '',
  meta_field_key: '',
  crm_field_key: '',
  fallback_value: '',
  transform_type: '',
  is_enabled: 1,
  sort_order: 0,
};

export default function MetaMappingsPage() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [rows, setRows]       = useState<Mapping[]>([]);
  const { sorted: sortedRows, sortKey: mappingSortKey, sortDirection: mappingSortDirection, toggleSort: toggleMappingSort } = useSortableData(
    rows,
    {
      scope: (m) => m.scope_type,
      metaField: (m) => m.meta_field_key,
      crmField: (m) => m.crm_field_key,
      fallback: (m) => m.fallback_value,
      transform: (m) => m.transform_type,
      status: (m) => (m.is_enabled ? 'Enabled' : 'Disabled'),
    },
  );
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId]   = useState<number | null>(null);
  const [form, setForm]       = useState<typeof emptyForm>({ ...emptyForm });
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [scopeFilter, setScope] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = scopeFilter ? `?scope=${scopeFilter}` : '';
    try {
      const res = await fetch(`/api/admin/meta-leads/mappings${params}`);
      const data = await res.json();
      setRows(data.data ?? []);
    } finally { setLoading(false); }
  }, [scopeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.meta_field_key.trim() || !form.crm_field_key.trim()) {
      setMsg('Meta field key and CRM field key are required'); return;
    }
    setSaving(true); setMsg('');
    try {
      const url = editId ? `/api/admin/meta-leads/mappings/${editId}` : '/api/admin/meta-leads/mappings';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          campaign_id: form.campaign_id || null,
          form_id: form.form_id || null,
          fallback_value: form.fallback_value || null,
          transform_type: form.transform_type || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setMsg(d.error || 'Failed to save'); return; }
      setMsg(editId ? 'Mapping updated.' : 'Mapping added.');
      setShowAdd(false); setEditId(null); setForm({ ...emptyForm });
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this mapping?')) return;
    await fetch(`/api/admin/meta-leads/mappings/${id}`, { method: 'DELETE' });
    load();
  };

  const startEdit = (m: Mapping) => {
    setForm({
      scope_type: m.scope_type,
      campaign_id: m.campaign_id || '',
      form_id: m.form_id || '',
      meta_field_key: m.meta_field_key,
      crm_field_key: m.crm_field_key,
      fallback_value: m.fallback_value || '',
      transform_type: m.transform_type || '',
      is_enabled: m.is_enabled,
      sort_order: m.sort_order,
    });
    setEditId(m.id);
    setShowAdd(true);
  };

  const cancelForm = () => { setShowAdd(false); setEditId(null); setForm({ ...emptyForm }); setMsg(''); };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Field Mappings</h1>
          <p className="text-sm text-gray-500">Map Meta lead form fields to CRM payload fields.</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditId(null); setForm({ ...emptyForm }); }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Mapping
        </button>
      </div>

      {/* Priority info */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Priority: <strong>Form</strong> &gt; <strong>Campaign</strong> &gt; <strong>Global</strong>. Form and campaign mappings override global defaults for the same CRM field.</span>
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-2 text-sm ${msg.includes('Failed') || msg.includes('required') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg}</div>
      )}

      {/* Add/Edit form */}
      {showAdd && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <h3 className="font-medium text-gray-900">{editId ? 'Edit Mapping' : 'Add Mapping'}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Scope</label>
              <SearchableSelect value={form.scope_type} onChange={e => setForm(p => ({ ...p, scope_type: e.target.value as ScopeType }))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="GLOBAL">Global</option>
                <option value="CAMPAIGN">Campaign</option>
                <option value="FORM">Form</option>
              </SearchableSelect>
            </div>
            {(form.scope_type as string) === 'CAMPAIGN' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Campaign ID</label>
                <input value={form.campaign_id} onChange={e => setForm(p => ({ ...p, campaign_id: e.target.value }))}
                  placeholder="Meta campaign ID"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            {(form.scope_type as string) === 'FORM' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Form ID</label>
                <input value={form.form_id} onChange={e => setForm(p => ({ ...p, form_id: e.target.value }))}
                  placeholder="Meta form ID"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Meta Field Key *</label>
              <input value={form.meta_field_key} onChange={e => setForm(p => ({ ...p, meta_field_key: e.target.value }))}
                placeholder="e.g. email, phone_number, custom_q_label"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">CRM Field Key *</label>
              <SearchableSelect value={form.crm_field_key} onChange={e => setForm(p => ({ ...p, crm_field_key: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">Select CRM field</option>
                {CRM_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                <option value="__custom__">Custom field name</option>
              </SearchableSelect>
              {form.crm_field_key === '__custom__' && (
                <input value="" onChange={e => setForm(p => ({ ...p, crm_field_key: e.target.value }))}
                  placeholder="Enter custom field name"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500" />
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Fallback Value</label>
              <input value={form.fallback_value} onChange={e => setForm(p => ({ ...p, fallback_value: e.target.value }))}
                placeholder="Used when Meta field is empty"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Transform</label>
              <SearchableSelect value={form.transform_type} onChange={e => setForm(p => ({ ...p, transform_type: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500">
                {TRANSFORMS.map(t => <option key={t} value={t}>{t || 'None'}</option>)}
              </SearchableSelect>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="is_enabled" checked={form.is_enabled === 1}
                onChange={e => setForm(p => ({ ...p, is_enabled: e.target.checked ? 1 : 0 }))}
                className="rounded" />
              <label htmlFor="is_enabled" className="text-sm text-gray-700">Enabled</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              <Check className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={cancelForm}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scope filter */}
      <div className="flex gap-2">
        {['', 'GLOBAL', 'CAMPAIGN', 'FORM'].map(s => (
          <button key={s} onClick={() => setScope(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${scopeFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <SortButtonRow
          options={[
            ['scope', 'Scope'],
            ['metaField', 'Meta Field'],
            ['crmField', 'CRM Field'],
            ['fallback', 'Fallback'],
            ['transform', 'Transform'],
            ['status', 'Status'],
          ] as const}
          activeKey={mappingSortKey}
          direction={mappingSortDirection}
          onSort={toggleMappingSort}
        />
        <RecordList
          loading={loading}
          isEmpty={!loading && sortedRows.length === 0}
          emptyIcon={ArrowLeftRight}
          emptyTitle="No mappings. Add one above."
        >
          {sortedRows.map(m => (
            <RecordCard
              key={m.id}
              avatar={<ArrowLeftRight className="h-4 w-4" />}
              avatarColorClass="from-blue-600 to-cyan-400"
              title={<span className="min-w-0 break-words font-mono text-sm font-bold text-gray-950">{m.meta_field_key} → <span className="text-blue-700">{m.crm_field_key}</span></span>}
              titleBadges={
                <>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SCOPE_COLORS[m.scope_type]}`}>{m.scope_type}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${m.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </>
              }
              stats={[
                { label: 'Scope Ref', value: m.campaign_id || m.form_id || '—' },
                { label: 'Fallback', value: m.fallback_value || '—' },
                { label: 'Transform', value: m.transform_type || '—' },
              ]}
              actions={[
                { key: 'edit', icon: Edit2, label: 'Edit', onClick: () => startEdit(m) },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDelete(m.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
              ]}
            />
          ))}
        </RecordList>
      </div>
    </div>
  );
}
