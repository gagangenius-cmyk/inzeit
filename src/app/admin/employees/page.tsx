'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { Drawer } from '@/components/ui/drawer';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useState, useEffect } from 'react';
import { CrmEmployeeAttributes } from '@/models';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionBar from '@/components/admin/BulkActionBar';
import EmployeeDocumentsPanel from '@/components/admin/EmployeeDocumentsPanel';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo } from '@/lib/roleChecks';
import { Eye, Pencil, Trash2, Building2, Loader2 } from 'lucide-react';

type EmployeeRow = CrmEmployeeAttributes & {
  roleName?: string | null;
  branchName?: string | null;
  regionName?: string | null;
  departmentName?: string | null;
};

type RoleOption = { id: number; name: string; type: string };
type BranchOption = { id: number; name: string };
type RegionOption = { id: number; name: string };

// crm_department has no seeded rows, so department is tracked here as a
// small fixed id->label enum rather than a real FK lookup. Keep this in
// sync with scripts/seed-employees.js's DEPT map if you add another id.
const DEPARTMENT_LABELS: Record<number, string> = { 1: 'Sales', 2: 'Operations', 3: 'Admin', 4: 'HR', 5: 'Accounts' };
const departmentLabel = (id: number | null | undefined) => DEPARTMENT_LABELS[Number(id)] || 'Admin';

export default function EmployeesManagement() {
  const { user } = useAuth();
  const canDelete = isCeo(user as any);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    department: '',
    status: ''
  });
  const { selectedIds, toggleOne, toggleAll, clear, isSelected, allSelected } = useBulkSelection(employees);
  const [bulkBusy, setBulkBusy] = useState(false);
  const { sorted: sortedEmployees, sortKey: employeeSortKey, sortDirection: employeeSortDirection, toggleSort: toggleEmployeeSort } = useSortableData(
    employees,
    {
      name: (e) => e.name,
      email: (e) => e.email,
      mobile: (e) => e.mobile,
      department: (e) => departmentLabel(e.department),
      role: (e) => [e.roleName, e.branchName, e.regionName].filter(Boolean).join(' / '),
      status: (e) => e.status,
      workMode: (e) => e.wfh,
    },
  );

  useEffect(() => {
    fetchEmployees();
  }, [pagination.page, pagination.limit, filters.department, filters.status]);

  useEffect(() => {
    fetchRoles();
    fetchBranches();
    fetchRegions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles?limit=100&status=1');
      const result = await response.json();
      if (response.ok) {
        setRoles((result.data || []).map((r: any) => ({ id: r.id, name: r.name, type: r.type })));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/admin/branches?limit=200&status=1');
      const result = await response.json();
      if (response.ok) {
        setBranches((result.data || []).map((b: any) => ({ id: b.id, name: b.branch })));
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/admin/regions?limit=200&status=1');
      const result = await response.json();
      if (response.ok) {
        setRegions((result.data || []).map((r: any) => ({ id: r.id, name: r.name })));
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchEmployees();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.department && { department: filters.department }),
        ...(filters.status !== '' && { status: filters.status })
      });

      const response = await fetch(`/api/admin/employees?${params}`);
      const result = await response.json();

      if (response.ok) {
        setEmployees(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }));
      } else {
        console.error('Failed to fetch employees:', result.error);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployee = (employee: CrmEmployeeAttributes) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleEditEmployee = (employee: CrmEmployeeAttributes) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      const response = await fetch(`/api/admin/employees?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchEmployees();
      } else {
        const result = await response.json();
        window.toast.error('Failed to delete employee: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      window.toast.error('Failed to delete employee');
    }
  };

  const handleAddEmployee = async (data: Partial<CrmEmployeeAttributes>) => {
    try {
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setShowAddModal(false);
        fetchEmployees();
      } else {
        const result = await response.json();
        window.toast.error('Error adding employee: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      window.toast.error('Error adding employee');
    }
  };

  const handleUpdateEmployee = async (data: Partial<CrmEmployeeAttributes>) => {
    if (!selectedEmployee) return;
    try {
      const response = await fetch('/api/admin/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedEmployee.id, ...data }),
      });
      if (response.ok) {
        setShowEditModal(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        const result = await response.json();
        window.toast.error('Error updating employee: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      window.toast.error('Error updating employee');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleFilterChange = (filterType: 'department' | 'status', value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchEmployees();
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getWorkModeColor = (wfh: number) => {
    return wfh === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  const runBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    setBulkBusy(true);
    try {
      const res = await fetch('/api/admin/employees/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds], action }),
      });
      if (!res.ok) {
        const result = await res.json();
        window.toast.error('Bulk action failed: ' + (result.error || 'Unknown error'));
        return;
      }
      clear();
      fetchEmployees();
    } finally {
      setBulkBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees Management</h1>
          <p className="text-gray-600 mt-2">Manage and track all employees</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchEmployees}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Employee
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search employees by name, email, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <SearchableSelect
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            <option value="1">Sales</option>
            <option value="2">Operations</option>
            <option value="3">Admin</option>
            <option value="4">HR</option>
            <option value="5">Accounts</option>
          </SearchableSelect>
          <SearchableSelect
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </SearchableSelect>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Select all
        </div>
        <SortButtonRow
          options={[
            ['name', 'Employee'],
            ['email', 'Email'],
            ['mobile', 'Mobile'],
            ['department', 'Department'],
            ['role', 'Role / Branch'],
            ['status', 'Status'],
            ['workMode', 'Work Mode'],
          ] as const}
          activeKey={employeeSortKey}
          direction={employeeSortDirection}
          onSort={toggleEmployeeSort}
        />
        <RecordList isEmpty={false}>
          {sortedEmployees.map((employee) => (
            <RecordCard
              key={employee.id}
              avatar={
                <input
                  type="checkbox"
                  checked={isSelected(employee.id)}
                  onChange={(e) => toggleOne(employee.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              }
              avatarColorClass="from-gray-100 to-gray-100"
              title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{employee.name}</span>}
              titleBadges={
                <>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">ID: {employee.EID}</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                    {employee.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getWorkModeColor(employee.wfh)}`}>
                    {employee.wfh === 1 ? 'Remote' : 'Office'}
                  </span>
                </>
              }
              metaItems={[
                { icon: Building2, text: `${employee.email || '—'} · ${employee.mobile || '—'}`, key: 'contact' },
              ]}
              stats={[
                { label: 'Department', value: departmentLabel(employee.department) },
                { label: 'Role', value: employee.roleName || 'Unassigned' },
                { label: 'Branch / Region', value: [employee.branchName, employee.regionName].filter(Boolean).join(' / ') || '—' },
              ]}
              actions={[
                { key: 'view', icon: Eye, label: 'View', onClick: () => handleViewEmployee(employee) },
                { key: 'edit', icon: Pencil, label: 'Edit', onClick: () => handleEditEmployee(employee) },
                { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDeleteEmployee(employee.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100', hidden: !canDelete },
              ]}
            />
          ))}
        </RecordList>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        busy={bulkBusy}
        onActivate={() => runBulkAction('activate')}
        onDeactivate={() => runBulkAction('deactivate')}
        onDelete={() => runBulkAction('delete')}
        onClear={clear}
        entityLabel="employee"
        deleteConfirmMessage={`Deactivate ${selectedIds.size} employee(s)? This marks them inactive and stamps a leave date — it does not permanently delete their record.`}
      />

      {/* Pagination Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show</span>
            <SearchableSelect
              value={pagination.limit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </SearchableSelect>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => handlePageChange(1)} disabled={pagination.page === 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">First</button>
            <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) pageNum = i + 1;
                else if (pagination.page <= 3) pageNum = i + 1;
                else if (pagination.page >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                else pageNum = pagination.page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded-md ${pageNum === pagination.page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Last</button>
          </div>
        </div>
      </div>

      {/* Employee Details Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-bold text-gray-900">Employee Details</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Personal Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedEmployee.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedEmployee.email}</p>
                    <p><span className="font-medium">Mobile:</span> {selectedEmployee.mobile}</p>
                    <p><span className="font-medium">Gender:</span> {selectedEmployee.gender}</p>
                    <p><span className="font-medium">Nationality:</span> {selectedEmployee.nationality}</p>
                    {selectedEmployee.dob && (
                      <p><span className="font-medium">DOB:</span> {new Date(selectedEmployee.dob).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Work Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Employee ID:</span> {selectedEmployee.EID}</p>
                    <p><span className="font-medium">Username:</span> {selectedEmployee.username}</p>
                    <p><span className="font-medium">Role / Designation:</span> {selectedEmployee.roleName || 'Unassigned'}</p>
                    <p><span className="font-medium">Branch:</span> {selectedEmployee.branchName || 'N/A'}</p>
                    <p><span className="font-medium">Region:</span> {selectedEmployee.regionName || 'N/A'}</p>
                    <p><span className="font-medium">Department:</span> {departmentLabel(selectedEmployee.department)}</p>
                    <p><span className="font-medium">Status:</span> {selectedEmployee.status === 1 ? 'Active' : 'Inactive'}</p>
                    <p><span className="font-medium">Work Mode:</span> {selectedEmployee.wfh === 1 ? 'Remote' : 'Office'}</p>
                    {selectedEmployee.doj && (
                      <p><span className="font-medium">Date of Joining:</span> {new Date(selectedEmployee.doj).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Additional Information</h4>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Passport No:</span> {selectedEmployee.ppNo || 'N/A'}</p>
                    {selectedEmployee.visaExp && (
                      <p><span className="font-medium">Visa Expiry:</span> {new Date(selectedEmployee.visaExp).toLocaleDateString()}</p>
                    )}
                    <p><span className="font-medium">Religion:</span> {selectedEmployee.religion}</p>
                    <p><span className="font-medium">Lab Experience:</span> {selectedEmployee.labexp || 'N/A'}</p>
                    <p><span className="font-medium">Emergency Contact:</span> {selectedEmployee.em_local_name}</p>
                    <p><span className="font-medium">Emergency Number:</span> {selectedEmployee.em_local_number}</p>
                  </div>
                </div>
              </div>
              {selectedEmployee.address && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700">Office Address</h4>
                  <p className="mt-1">{selectedEmployee.address}</p>
                </div>
              )}
              {selectedEmployee.remark && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700">Remarks</h4>
                  <p className="mt-1">{selectedEmployee.remark}</p>
                </div>
              )}
              <EmployeeDocumentsPanel employeeId={selectedEmployee.id} />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => { setShowModal(false); handleEditEmployee(selectedEmployee); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Drawer */}
      <EmployeeFormDrawer
        open={showAddModal}
        title="Add New Employee"
        roles={roles}
        branches={branches}
        regions={regions}
        onSubmit={handleAddEmployee}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Employee Drawer */}
      <EmployeeFormDrawer
        open={showEditModal}
        title="Edit Employee"
        initialData={selectedEmployee}
        roles={roles}
        branches={branches}
        regions={regions}
        onSubmit={handleUpdateEmployee}
        onClose={() => { setShowEditModal(false); setSelectedEmployee(null); }}
      />
    </div>
  );
}

interface EmployeeFormModalProps {
  open: boolean;
  title: string;
  initialData?: EmployeeRow | null;
  roles: RoleOption[];
  branches: BranchOption[];
  regions: RegionOption[];
  onSubmit: (data: Partial<CrmEmployeeAttributes>) => void;
  onClose: () => void;
}

const employeeInputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';

function buildEmployeeFormData(initialData?: EmployeeRow | null) {
  return {
    name: initialData?.name || '',
    email: initialData?.email || '',
    mobile: initialData?.mobile || '',
    EID: initialData?.EID || '',
    username: initialData?.username || '',
    department: initialData?.department ?? 1,
    branch: initialData?.branch ?? null,
    region: initialData?.region ?? null,
    role: initialData?.role ?? null,
    gender: initialData?.gender || 'Male',
    nationality: initialData?.nationality || '',
    religion: initialData?.religion || '',
    status: initialData?.status ?? 1,
    wfh: initialData?.wfh ?? 0,
    employment_type: initialData?.employment_type || 'Full-time',
    work_location: initialData?.work_location || '',
    dob: initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
    doj: initialData?.doj ? new Date(initialData.doj).toISOString().split('T')[0] : '',
    ppNo: initialData?.ppNo || '',
    address: initialData?.address || '',
    remark: initialData?.remark || '',
    em_local_name: initialData?.em_local_name || '',
    em_local_number: initialData?.em_local_number || '',
  };
}

// Right-side Drawer used for both Add and Edit — mirrors AddThirdPartyPaymentDrawer's
// pattern (always mounted, `open` toggles visibility, form state resets from
// `initialData` whenever it opens) so the drawer's slide in/out animation plays
// correctly instead of the form popping open/closed with the old conditionally
// mounted modal.
function EmployeeFormDrawer({ open, title, initialData, roles, branches, regions, onSubmit, onClose }: EmployeeFormModalProps) {
  const [formData, setFormData] = useState(() => buildEmployeeFormData(initialData));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormData(buildEmployeeFormData(initialData));
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload: Partial<CrmEmployeeAttributes> = {
        ...formData,
        dob: formData.dob ? new Date(formData.dob) : null,
        doj: formData.doj ? new Date(formData.doj) : null,
      };
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (label: string, key: keyof typeof formData, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && ' *'}</label>
      <input
        type={type}
        required={required}
        value={(formData[key] as string) || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
        className={employeeInputClass}
      />
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description={initialData ? 'Update this employee’s profile, role, and access.' : 'Create a new employee profile and assign their role, branch, and region.'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('Full Name', 'name', 'text', true)}
          {field('Email', 'email', 'email')}
          {field('Mobile', 'mobile', 'tel')}
          {field('Employee ID (EID)', 'EID')}
          {field('Username', 'username')}
          {field('Passport No', 'ppNo')}
          {field('Date of Birth', 'dob', 'date')}
          {field('Date of Joining', 'doj', 'date')}
          {field('Nationality', 'nationality')}
          {field('Religion', 'religion')}
          {field('Work Location', 'work_location')}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Department *</label>
            <SearchableSelect
              required
              value={formData.department ?? 1}
              onChange={(e) => setFormData(prev => ({ ...prev, department: parseInt(e.target.value) }))}
              className={employeeInputClass}
            >
              <option value={1}>Sales</option>
              <option value={2}>Operations</option>
              <option value={3}>Admin</option>
              <option value={4}>HR</option>
              <option value={5}>Accounts</option>
            </SearchableSelect>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role / Designation *</label>
            <SearchableSelect
              required
              value={formData.role ?? ''}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value ? parseInt(e.target.value) : null }))}
              className={employeeInputClass}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </SearchableSelect>
            <p className="mt-1.5 text-xs text-gray-500">Permissions and module access are applied automatically from this role.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch *</label>
            <SearchableSelect
              required
              value={formData.branch ?? ''}
              onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value ? parseInt(e.target.value) : null }))}
              className={employeeInputClass}
            >
              <option value="">Select a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </SearchableSelect>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Region *</label>
            <SearchableSelect
              required
              value={formData.region ?? ''}
              onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value ? parseInt(e.target.value) : null }))}
              className={employeeInputClass}
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </SearchableSelect>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
            <SearchableSelect
              required
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              className={employeeInputClass}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </SearchableSelect>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status *</label>
            <SearchableSelect
              required
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: parseInt(e.target.value) }))}
              className={employeeInputClass}
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </SearchableSelect>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Mode *</label>
            <SearchableSelect
              required
              value={formData.wfh}
              onChange={(e) => setFormData(prev => ({ ...prev, wfh: parseInt(e.target.value) }))}
              className={employeeInputClass}
            >
              <option value={0}>Office</option>
              <option value={1}>Remote</option>
            </SearchableSelect>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment Type</label>
            <SearchableSelect
              value={formData.employment_type}
              onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value }))}
              className={employeeInputClass}
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </SearchableSelect>
          </div>

          <div className="md:col-span-2">
            {field('Office Address', 'address')}
          </div>
          <div>
            {field('Emergency Contact Name', 'em_local_name')}
          </div>
          <div>
            {field('Emergency Contact Number', 'em_local_number', 'tel')}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
            <textarea
              rows={3}
              value={formData.remark || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              className={employeeInputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving…' : initialData ? 'Update Employee' : 'Add Employee'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
