'use client';

import { useEffect, useMemo, useState } from 'react';

type RoleOption = {
  id: number;
  name: string;
  type: string;
  hierarchy: number;
  status: number;
};

type PermissionRow = {
  id: number;
  permission_key: string;
  module: string;
  action: string;
  label: string;
  granted: boolean;
};

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRoleId != null) {
      fetchPermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await fetch('/api/admin/roles?limit=100&status=1');
      const result = await response.json();
      if (response.ok) {
        const list: RoleOption[] = (result.data || []).sort((a: RoleOption, b: RoleOption) => a.hierarchy - b.hierarchy);
        setRoles(list);
        if (list.length && selectedRoleId == null) {
          setSelectedRoleId(list[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchPermissions = async (roleId: number) => {
    try {
      setLoadingPermissions(true);
      setMessage(null);
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`);
      const result = await response.json();
      if (response.ok) {
        setPermissions(result.permissions || []);
        setChecked(new Set(result.permissions.filter((p: PermissionRow) => p.granted).map((p: PermissionRow) => p.permission_key)));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load permissions' });
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      setMessage({ type: 'error', text: 'Failed to load permissions' });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionRow[]>();
    for (const permission of permissions) {
      if (!map.has(permission.module)) map.set(permission.module, []);
      map.get(permission.module)!.push(permission);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const togglePermission = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleModule = (module: string, allChecked: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev);
      const keys = permissions.filter((p) => p.module === module).map((p) => p.permission_key);
      if (allChecked) {
        keys.forEach((key) => next.delete(key));
      } else {
        keys.forEach((key) => next.add(key));
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (selectedRoleId == null) return;
    try {
      setSaving(true);
      setMessage(null);
      const response = await fetch(`/api/admin/roles/${selectedRoleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionKeys: Array.from(checked) }),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: `Saved ${result.grantedCount} permissions for this role.` });
        fetchPermissions(selectedRoleId);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save permissions' });
      }
    } catch (error) {
      console.error('Error saving role permissions:', error);
      setMessage({ type: 'error', text: 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((role) => role.id === selectedRoleId) || null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-slate-500">User Roles & Permissions</p>
        <h1 className="text-3xl font-bold text-slate-950">Role Access Matrix</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Pick a role and check the permissions it should have. Changes apply immediately to
          every employee assigned that role/designation the next time they log in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Roles</p>
          </div>
          {loadingRoles ? (
            <div className="p-4 text-sm text-slate-500">Loading roles…</div>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
              {roles.map((role) => (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                      role.id === selectedRoleId ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {role.name}
                    <span className="ml-2 font-mono text-xs text-slate-400">{role.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          {!selectedRole ? (
            <div className="p-6 text-sm text-slate-500">Select a role to view its permissions.</div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{selectedRole.name}</h2>
                  <p className="text-xs text-slate-500">type: {selectedRole.type} &middot; hierarchy: {selectedRole.hierarchy}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || loadingPermissions}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>

              {message && (
                <div className={`mx-6 mt-4 rounded-md px-3 py-2 text-sm ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {message.text}
                </div>
              )}

              {loadingPermissions ? (
                <div className="p-6 text-sm text-slate-500">Loading permissions…</div>
              ) : (
                <div className="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-4">
                  {grouped.map(([module, items]) => {
                    const allChecked = items.every((item) => checked.has(item.permission_key));
                    return (
                      <div key={module}>
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{module}</h3>
                          <button
                            type="button"
                            onClick={() => toggleModule(module, allChecked)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            {allChecked ? 'Clear all' : 'Select all'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {items.map((item) => (
                            <label key={item.permission_key} className="flex items-start gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked.has(item.permission_key)}
                                onChange={() => togglePermission(item.permission_key)}
                                className="mt-0.5"
                              />
                              <span>
                                <span className="block text-slate-800">{item.label}</span>
                                <span className="block font-mono text-xs text-slate-400">{item.permission_key}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
