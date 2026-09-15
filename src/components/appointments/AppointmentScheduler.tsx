'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData, SortableTh } from '@/components/ui/sortable-th';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, Users, Plus, Search, Filter,
  Edit, Trash2, Eye, CheckCircle, XCircle,
  MapPin, Phone, Mail, User, Bell, Download,
  UserX, RotateCcw, Upload, FileCheck, ShieldCheck, ShieldAlert, Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isCeo, isFoeOrBranchManagerOrCeo } from '@/lib/roleChecks';
import { uploadFileToBlob } from '@/lib/uploadToBlob';
import { useDebounce } from '@/hooks/useDebounce';

interface Appointment {
  id: number;
  leadId: number;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  date: string;
  time: string;
  endTime: string;
  type: 'Consultation' | 'Document Review' | 'Interview Prep' | 'Visa Processing' | 'Follow-up';
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'No-show';
  counsilorId: number;
  counsilorName: string;
  branch: string;
  region: string;
  location: string;
  notes: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  screenshotUrl: string;
  // FOE verification of the "meeting done" proof document — null means no
  // one has reviewed it yet, 1 = confirmed genuine, 0 = rejected.
  meetingVerified: number | null;
  verifiedByName: string;
  foeRemark: string;
  crossBranch: boolean;
  assignedBranchName: string;
  assignedByName: string;
  acknowledged: boolean;
}

interface AppointmentSchedulerProps {
  onAppointmentSelect?: (appointment: Appointment) => void;
  showActions?: boolean;
}

interface ApiAppointment {
  id: number;
  leadid: number | null;
  date: string | null;
  appointtime: string;
  counsilorid: number | null;
  booked: number | null;
  done: number | null;
  not_done: number | null;
  region: number | null;
  branch: number | null;
  screenshot?: string | null;
  meeting_status?: string | null;
  meeting_verified?: number | null;
  verified_by?: number | null;
  verified_at?: string | null;
  foe_remark?: string | null;
  fname?: string | null;
  lname?: string | null;
  leadEmail?: string | null;
  leadPhone?: string | null;
  leadMobile?: string | null;
  counselorName?: string | null;
  branchName?: string | null;
  regionName?: string | null;
  verifiedByName?: string | null;
  cross_branch?: number | null;
  assigned_branch?: number | null;
  assigned_by?: number | null;
  acknowledged?: number | null;
  acknowledged_at?: string | null;
  assignedBranchName?: string | null;
  assignedByName?: string | null;
}

interface AppointmentForm {
  leadid: string;
  date: string;
  appointtime: string;
  counsilorid: string;
  branch: string;
  region: string;
  booked: boolean;
}

const emptyAppointmentForm = (): AppointmentForm => ({
  leadid: '',
  date: new Date().toISOString().split('T')[0],
  appointtime: '09:00',
  counsilorid: '',
  branch: '',
  region: '',
  booked: true
});

function mapAppointment(appointment: ApiAppointment): Appointment {
  const status = getAppointmentStatus(appointment);
  const time = String(appointment.appointtime || '00:00').slice(0, 5);
  const clientName = `${appointment.fname || ''} ${appointment.lname || ''}`.trim();

  return {
    id: Number(appointment.id),
    leadId: Number(appointment.leadid || 0),
    leadName: clientName || (appointment.leadid ? `Lead #${appointment.leadid}` : 'Walk-in Client'),
    leadEmail: appointment.leadEmail || '',
    leadPhone: appointment.leadPhone || appointment.leadMobile || '',
    date: appointment.date || '',
    time,
    endTime: time,
    type: 'Consultation',
    status,
    counsilorId: Number(appointment.counsilorid || 0),
    counsilorName: appointment.counselorName || (appointment.counsilorid ? `Counselor #${appointment.counsilorid}` : 'Unassigned'),
    branch: appointment.branchName || (appointment.branch ? `Branch #${appointment.branch}` : 'No branch'),
    region: appointment.regionName || (appointment.region ? `Region #${appointment.region}` : 'No region'),
    location: appointment.branchName || 'Office',
    notes: '',
    reminderSent: Number(appointment.booked || 0) === 1,
    createdAt: '',
    updatedAt: '',
    screenshotUrl: appointment.screenshot || '',
    meetingVerified: appointment.meeting_verified === null || appointment.meeting_verified === undefined
      ? null
      : Number(appointment.meeting_verified),
    verifiedByName: appointment.verifiedByName || '',
    foeRemark: appointment.foe_remark || '',
    crossBranch: Number(appointment.cross_branch || 0) === 1,
    assignedBranchName: appointment.assignedBranchName || '',
    assignedByName: appointment.assignedByName || '',
    acknowledged: Number(appointment.acknowledged || 0) === 1,
  };
}

function getAppointmentStatus(appointment: ApiAppointment): Appointment['status'] {
  // meeting_status is the source of truth once set (it's the only thing that
  // distinguishes No-show/Rescheduled from a plain Cancelled/Scheduled row,
  // since those share the same booked/done/not_done flag combination).
  if (appointment.meeting_status === 'no_show') return 'No-show';
  if (appointment.meeting_status === 'rescheduled') return 'Rescheduled';
  if (appointment.meeting_status === 'meeting_done') return 'Completed';
  if (Number(appointment.done || 0) === 1) return 'Completed';
  if (Number(appointment.not_done || 0) === 1) return 'Cancelled';
  if (Number(appointment.booked || 0) === 1) return 'Confirmed';
  return 'Scheduled';
}

export default function AppointmentScheduler({ onAppointmentSelect, showActions = true }: AppointmentSchedulerProps) {
  const { user } = useAuth();
  const canVerifyMeetings = isFoeOrBranchManagerOrCeo(user as any);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    type: '',
    counsilor: '',
    branch: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<AppointmentForm>(emptyAppointmentForm);

  // View / Edit / Delete state
  const [viewingAppt, setViewingAppt] = useState<Appointment | null>(null);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState<AppointmentForm>(emptyAppointmentForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Meeting-done proof upload — "Mark Done" opens this instead of firing
  // immediately, since a document is required so a FOE can later verify the
  // meeting actually happened.
  const [markingDoneAppt, setMarkingDoneAppt] = useState<Appointment | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [verifyRemark, setVerifyRemark] = useState('');

  // Lets a FOE/Branch Manager/CEO jump straight to meetings a counselor
  // marked done that still need a verify/reject decision, instead of
  // scanning every row.
  const [pendingVerificationOnly, setPendingVerificationOnly] = useState(false);
  const [crossBranchOnly, setCrossBranchOnly] = useState(false);
  const [counselorOptions, setCounselorOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 0 });
  const debouncedSearchTerm = useDebounce(searchTerm, 350);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: String(pagination.page), limit: String(pagination.limit) });
      if (filters.date) params.set('date', filters.date);
      if (filters.status) params.set('status', filters.status);
      if (filters.counsilor) params.set('counselorId', filters.counsilor);
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
      if (crossBranchOnly) params.set('crossBranchOnly', '1');

      const response = await fetch(`/api/appointments?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load appointments');
      }

      setAppointments((data.appointments || []).map(mapAppointment));
      setPagination((prev) => ({ ...prev, total: data.pagination?.total ?? 0, pages: data.pagination?.pages ?? 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters.date, filters.status, filters.counsilor, debouncedSearchTerm, crossBranchOnly]);

  // Counselor filter dropdown - previously hardcoded to 3 fake names
  // (Sarah Wilson/Mike Johnson/Lisa Chen) that never matched real data.
  // Branch Manager sees their own branch's counselors; CEO sees everyone.
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({ status: '1', limit: '200' });
        if (!isCeo(user as any) && (user as any)?.branch) params.set('branch', String((user as any).branch));
        const res = await fetch(`/api/employees?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        const employees: Array<{ id: number; name: string }> = data.employees || [];
        setCounselorOptions(employees.map((e) => ({ id: e.id, name: e.name })));
      } catch (error) {
        console.error('Error loading counselor filter options:', error);
      }
    })();
  }, [user]);

  const openEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setEditForm({
      leadid: String(appt.leadId || ''),
      date: appt.date,
      appointtime: appt.time,
      counsilorid: String(appt.counsilorId || ''),
      branch: '',
      region: '',
      booked: appt.reminderSent,
    });
    setActionError('');
  };

  const statusToFlags = (status: string) => {
    if (status === 'Completed') return { done: 1, not_done: 0, booked: 1, meeting_status: 'meeting_done' };
    if (status === 'Cancelled') return { done: 0, not_done: 1, booked: 0, meeting_status: null };
    if (status === 'Confirmed') return { done: 0, not_done: 0, booked: 1, meeting_status: null };
    if (status === 'No-show')   return { done: 0, not_done: 1, booked: 0, meeting_status: 'no_show' };
    if (status === 'Rescheduled') return { done: 0, not_done: 0, booked: 0, meeting_status: 'rescheduled' };
    return { done: 0, not_done: 0, booked: 0, meeting_status: null }; // Scheduled
  };

  const handleSave = async () => {
    if (!editingAppt) return;
    setActionBusy(true);
    setActionError('');
    try {
      const res = await fetch(`/api/appointments/${editingAppt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadid: editForm.leadid ? Number(editForm.leadid) : null,
          date: editForm.date,
          appointtime: editForm.appointtime,
          counsilorid: editForm.counsilorid ? Number(editForm.counsilorid) : null,
          branch: editForm.branch ? Number(editForm.branch) : null,
          region: editForm.region ? Number(editForm.region) : null,
          booked: editForm.booked ? 1 : 0,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Save failed'); }
      setEditingAppt(null);
      await fetchAppointments();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAcknowledge = async (appt: Appointment) => {
    if (acknowledgingId) return;
    setAcknowledgingId(appt.id);
    try {
      const res = await fetch(`/api/appointments/${appt.id}/acknowledge`, { method: 'POST' });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Failed to acknowledge'); }
      window.toast.success('Appointment acknowledged');
      await fetchAppointments();
    } catch (e) {
      window.toast.error(e instanceof Error ? e.message : 'Failed to acknowledge appointment');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleStatusChange = async (appt: Appointment, newStatus: string) => {
    setActionBusy(true);
    setActionError('');
    try {
      const flags = statusToFlags(newStatus);
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flags),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Update failed'); }
      setViewingAppt(null);
      await fetchAppointments();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setActionBusy(false);
    }
  };

  // "Reschedule" needs a new date/time, not just the status flag flip that
  // handleStatusChange does for every other status — otherwise the appointment
  // gets relabeled "Rescheduled" while its actual date/time silently stays the same.
  const openReschedule = (appt: Appointment) => {
    setReschedulingAppt(appt);
    setRescheduleDate(appt.date);
    setRescheduleTime(appt.time);
    setActionError('');
  };

  const handleRescheduleSave = async () => {
    if (!reschedulingAppt) return;
    if (!rescheduleDate || !rescheduleTime) {
      setActionError('Please select a new date and time');
      return;
    }
    setActionBusy(true);
    setActionError('');
    try {
      const res = await fetch(`/api/appointments/${reschedulingAppt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...statusToFlags('Rescheduled'),
          date: rescheduleDate,
          appointtime: rescheduleTime,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Reschedule failed'); }
      setReschedulingAppt(null);
      setViewingAppt(null);
      await fetchAppointments();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to reschedule');
    } finally {
      setActionBusy(false);
    }
  };

  // Meeting Done requires a proof document (so a FOE can verify the meeting
  // actually happened) — this uploads it and marks the appointment done in
  // one step, resetting any prior verification since the proof changed.
  const handleConfirmMarkDone = async () => {
    if (!markingDoneAppt || !proofFile) return;
    setUploadingProof(true);
    setActionError('');
    try {
      const blob = await uploadFileToBlob(proofFile, `appointments/${markingDoneAppt.id}-${proofFile.name}`);
      const flags = statusToFlags('Completed');
      const res = await fetch(`/api/appointments/${markingDoneAppt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...flags,
          screenshot: blob.url,
          meeting_verified: null,
          verified_by: null,
          verified_at: null,
          foe_remark: null,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Update failed'); }
      setMarkingDoneAppt(null);
      setProofFile(null);
      setViewingAppt(null);
      await fetchAppointments();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to upload document and mark meeting done');
    } finally {
      setUploadingProof(false);
    }
  };

  // FOE (or Branch Manager/CEO) confirms or rejects that the uploaded proof
  // actually shows the meeting happened.
  const handleVerifyMeeting = async (appt: Appointment, verified: boolean) => {
    setActionBusy(true);
    setActionError('');
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_verified: verified ? 1 : 0,
          verified_by: user?.id || null,
          verified_at: new Date().toISOString(),
          foe_remark: verifyRemark || null,
        }),
      });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Update failed'); }
      setVerifyRemark('');
      setViewingAppt(null);
      await fetchAppointments();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to record verification');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionBusy(true);
    setActionError('');
    try {
      const res = await fetch(`/api/appointments/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Delete failed'); }
      setDeleteId(null);
      await fetchAppointments();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setActionBusy(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!formData.date || !formData.appointtime) {
      setError('Date and time are required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          booked: formData.booked ? 1 : 0
        })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment');
      }

      setShowCreateModal(false);
      setFormData(emptyAppointmentForm());
      await fetchAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  const needsVerification = (appointment: Appointment) => appointment.status === 'Completed' && appointment.meetingVerified === null;
  const pendingVerificationCount = appointments.filter(needsVerification).length;
  const crossBranchCount = appointments.filter(a => a.crossBranch).length;

  // date/status/counsilor/search/crossBranch are now applied server-side
  // (see fetchAppointments); type/branch/pendingVerificationOnly have no
  // backend equivalent today, so they still narrow the fetched page here.
  const filteredAppointments = appointments.filter(appointment => {
    const matchesType = !filters.type || appointment.type === filters.type;
    const matchesBranch = !filters.branch || appointment.branch.includes(filters.branch);
    const matchesVerification = !pendingVerificationOnly || needsVerification(appointment);

    return matchesType && matchesBranch && matchesVerification;
  });

  const { sorted: sortedAppointments, sortKey: appointmentSortKey, sortDirection: appointmentSortDirection, toggleSort: toggleAppointmentSort } = useSortableData(
    filteredAppointments,
    {
      details: (a) => `${a.date} ${a.time}`,
      client: (a) => a.leadName,
      counselor: (a) => a.counsilorName,
      status: (a) => a.status,
      location: (a) => `${a.branch || ''} ${a.region || ''}`,
    },
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-purple-100 text-purple-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800';
      case 'No-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Consultation': return 'bg-indigo-100 text-indigo-800';
      case 'Document Review': return 'bg-teal-100 text-teal-800';
      case 'Interview Prep': return 'bg-orange-100 text-orange-800';
      case 'Visa Processing': return 'bg-pink-100 text-pink-800';
      case 'Follow-up': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeRemaining = (date: string, time: string) => {
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();

    if (diffMs < 0) return 'Past';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'Soon';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointment Scheduler</h1>
          <p className="text-gray-600 mt-2">Manage and schedule client appointments</p>
        </div>

        {showActions && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule New Appointment
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <input
            type="date"
            value={filters.date}
            onChange={(e) => { setFilters({...filters, date: e.target.value}); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <SearchableSelect
            value={filters.status}
            onChange={(e) => { setFilters({...filters, status: e.target.value}); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="No-show">No-show</option>
          </SearchableSelect>

          <SearchableSelect
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="Consultation">Consultation</option>
            <option value="Document Review">Document Review</option>
            <option value="Interview Prep">Interview Prep</option>
            <option value="Visa Processing">Visa Processing</option>
            <option value="Follow-up">Follow-up</option>
          </SearchableSelect>

          <SearchableSelect
            value={filters.counsilor}
            onChange={(e) => { setFilters({...filters, counsilor: e.target.value}); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Counselors</option>
            {counselorOptions.map((option) => (
              <option key={option.id} value={String(option.id)}>{option.name}</option>
            ))}
          </SearchableSelect>

          <div className="flex items-center space-x-2">
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments Summary */}
      <div className={`grid grid-cols-1 md:grid-cols-4 ${canVerifyMeetings ? 'lg:grid-cols-5' : ''} gap-6`}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => a.status === 'Confirmed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => {
                  const apptDate = new Date(a.date);
                  const today = new Date();
                  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return apptDate >= today && apptDate <= weekFromNow;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reminders Needed</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointments.filter(a => !a.reminderSent && a.status === 'Scheduled').length}
              </p>
            </div>
          </div>
        </div>

        {canVerifyMeetings && (
          <button
            type="button"
            onClick={() => setPendingVerificationOnly(prev => !prev)}
            className={`text-left bg-white rounded-lg shadow p-6 border-2 transition-colors ${pendingVerificationOnly ? 'border-amber-400' : 'border-transparent hover:border-amber-200'}`}
          >
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-2xl font-bold text-gray-900">{pendingVerificationCount}</p>
              </div>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() => { setCrossBranchOnly(prev => !prev); setPagination((prev) => ({ ...prev, page: 1 })); }}
          className={`text-left bg-white rounded-lg shadow p-6 border-2 transition-colors ${crossBranchOnly ? 'border-teal-400' : 'border-transparent hover:border-teal-200'}`}
        >
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Building2 className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cross-Branch</p>
              <p className="text-2xl font-bold text-gray-900">{crossBranchCount}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableTh label="Appointment Details" sortKey="details" activeKey={appointmentSortKey} direction={appointmentSortDirection} onSort={toggleAppointmentSort} />
                <SortableTh label="Client" sortKey="client" activeKey={appointmentSortKey} direction={appointmentSortDirection} onSort={toggleAppointmentSort} />
                <SortableTh label="Counselor" sortKey="counselor" activeKey={appointmentSortKey} direction={appointmentSortDirection} onSort={toggleAppointmentSort} />
                <SortableTh label="Status & Type" sortKey="status" activeKey={appointmentSortKey} direction={appointmentSortDirection} onSort={toggleAppointmentSort} />
                <SortableTh label="Location" sortKey="location" activeKey={appointmentSortKey} direction={appointmentSortDirection} onSort={toggleAppointmentSort} />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                    </div>
                    <div className="text-sm text-gray-500">
                      Duration: {appointment.endTime}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {getTimeRemaining(appointment.date, appointment.time)} remaining
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {appointment.leadId ? (
                      <Link
                        href={`/admin/leads/${appointment.leadId}/edit`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {appointment.leadName}
                      </Link>
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{appointment.leadName}</div>
                    )}
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Mail className="w-4 h-4 mr-1" />
                      {appointment.leadEmail}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-1" />
                      {appointment.leadPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{appointment.counsilorName}</div>
                    <div className="text-sm text-gray-500">{appointment.branch}</div>
                    <div className="text-sm text-gray-500">{appointment.region}</div>
                    {appointment.crossBranch && (
                      <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${appointment.acknowledged ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        Cross-Branch{appointment.acknowledged ? ' ✓' : ' · Pending ack.'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
                        {appointment.type}
                      </span>
                      {appointment.status === 'Completed' && (
                        appointment.meetingVerified === 1 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        ) : appointment.meetingVerified === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                            <ShieldAlert className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                            <ShieldAlert className="w-3 h-3" /> Awaiting Verification
                          </span>
                        )
                      )}
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        {appointment.reminderSent ? (
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1 text-red-500" />
                        )}
                        Reminder {appointment.reminderSent ? 'sent' : 'pending'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {appointment.location}
                    </div>
                    {appointment.notes && (
                      <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                        {appointment.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        title="View"
                        onClick={() => { setViewingAppt(appointment); setActionError(''); setReschedulingAppt(null); }}
                        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => openEdit(appointment)}
                        className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {isCeo(user as any) && (
                        <button
                          title="Delete"
                          onClick={() => { setDeleteId(appointment.id); setActionError(''); }}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {Math.max(pagination.pages, 1)} — {pagination.total} appointments
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.pages || prev.page, prev.page + 1) }))}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Schedule New Appointment</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead ID</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.leadid}
                    onChange={(e) => setFormData({ ...formData, leadid: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Counselor ID</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.counsilorid}
                    onChange={(e) => setFormData({ ...formData, counsilorid: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.appointtime}
                    onChange={(e) => setFormData({ ...formData, appointtime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch ID</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region ID</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.booked}
                    onChange={(e) => setFormData({ ...formData, booked: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Mark appointment as booked
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAppointment}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Appointment Modal ───────────────────────────────────── */}
      {viewingAppt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setViewingAppt(null); setReschedulingAppt(null); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Appointment #{viewingAppt.id}</h2>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(viewingAppt.status)}`}>{viewingAppt.status}</span>
              </div>
              <button onClick={() => { setViewingAppt(null); setReschedulingAppt(null); }} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-medium">{new Date(viewingAppt.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <Clock className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                <span>{viewingAppt.time}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Client</p>
                  <p className="font-medium text-gray-900">{viewingAppt.leadName}</p>
                  {viewingAppt.leadEmail && <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{viewingAppt.leadEmail}</p>}
                  {viewingAppt.leadPhone && <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{viewingAppt.leadPhone}</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Counsellor</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1"><User className="w-3.5 h-3.5 text-gray-400" />{viewingAppt.counsilorName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{viewingAppt.location}</p>
                  <p className="text-sm text-gray-500">{viewingAppt.region}</p>
                </div>
              </div>
              {viewingAppt.crossBranch && (
                <div className={`rounded-lg p-3 text-sm border ${viewingAppt.acknowledged ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <span className={`font-medium text-xs uppercase block mb-1 ${viewingAppt.acknowledged ? 'text-green-700' : 'text-amber-700'}`}>Cross-Branch Assignment</span>
                  <p className="text-gray-700">
                    Assigned to <span className="font-medium">{viewingAppt.counsilorName}</span> in {viewingAppt.assignedBranchName || 'another branch'}
                    {viewingAppt.assignedByName ? ` by ${viewingAppt.assignedByName}` : ''}.
                  </p>
                  {viewingAppt.acknowledged ? (
                    <p className="text-green-700 flex items-center gap-1 mt-1"><ShieldCheck className="w-3.5 h-3.5" /> Acknowledged</p>
                  ) : (
                    <p className="text-amber-700 flex items-center gap-1 mt-1"><ShieldAlert className="w-3.5 h-3.5" /> Awaiting acknowledgement</p>
                  )}
                </div>
              )}
              {viewingAppt.notes && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  <span className="font-medium text-gray-500 text-xs uppercase block mb-1">Notes</span>
                  {viewingAppt.notes}
                </div>
              )}
              {viewingAppt.status === 'Completed' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                  <span className="font-medium text-purple-700 text-xs uppercase block mb-1">Meeting Proof</span>
                  {viewingAppt.screenshotUrl ? (
                    <a href={viewingAppt.screenshotUrl} target="_blank" rel="noopener noreferrer"
                      className="text-purple-700 underline flex items-center gap-1 mb-2">
                      <FileCheck className="w-3.5 h-3.5" /> View uploaded document
                    </a>
                  ) : (
                    <p className="text-gray-500 mb-2">No document was uploaded.</p>
                  )}
                  {viewingAppt.meetingVerified === 1 && (
                    <p className="text-green-700 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Verified by {viewingAppt.verifiedByName || 'FOE'}</p>
                  )}
                  {viewingAppt.meetingVerified === 0 && (
                    <p className="text-red-700 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Rejected by {viewingAppt.verifiedByName || 'FOE'}{viewingAppt.foeRemark ? ` — ${viewingAppt.foeRemark}` : ''}</p>
                  )}
                  {viewingAppt.meetingVerified === null && (
                    <p className="text-amber-700 text-xs">Pending FOE verification</p>
                  )}
                  {canVerifyMeetings && viewingAppt.meetingVerified === null && (
                    <div className="mt-2 space-y-2">
                      <input type="text" placeholder="Remark (optional)" value={verifyRemark}
                        onChange={(e) => setVerifyRemark(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs" />
                      <div className="flex gap-2">
                        <button onClick={() => handleVerifyMeeting(viewingAppt, true)} disabled={actionBusy}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-60">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verify Meeting
                        </button>
                        <button onClick={() => handleVerifyMeeting(viewingAppt, false)} disabled={actionBusy}
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-60">
                          <ShieldAlert className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2 flex-wrap">
                {viewingAppt.crossBranch && !viewingAppt.acknowledged && user && Number(viewingAppt.counsilorId) === Number(user.id) && (
                  <button onClick={() => handleAcknowledge(viewingAppt)} disabled={acknowledgingId === viewingAppt.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-60">
                    <ShieldCheck className="w-3.5 h-3.5" /> {acknowledgingId === viewingAppt.id ? 'Acknowledging…' : 'Acknowledge'}
                  </button>
                )}
                {viewingAppt.status !== 'Completed' && (
                  <button onClick={() => { setProofFile(null); setMarkingDoneAppt(viewingAppt); }} disabled={actionBusy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60">
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Done
                  </button>
                )}
                {viewingAppt.status !== 'Confirmed' && viewingAppt.status !== 'Completed' && (
                  <button onClick={() => handleStatusChange(viewingAppt, 'Confirmed')} disabled={actionBusy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                    <CheckCircle className="w-3.5 h-3.5" /> Confirm
                  </button>
                )}
                {viewingAppt.status !== 'Completed' && reschedulingAppt?.id === viewingAppt.id ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                    <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm" />
                    <button onClick={handleRescheduleSave} disabled={actionBusy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--cmg-blue)] text-white rounded-lg text-sm hover:bg-[var(--cmg-blue-dark)] disabled:opacity-60">
                      <CheckCircle className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={() => setReschedulingAppt(null)} disabled={actionBusy}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                ) : viewingAppt.status !== 'Rescheduled' && viewingAppt.status !== 'Completed' && (
                  <button onClick={() => openReschedule(viewingAppt)} disabled={actionBusy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200 disabled:opacity-60">
                    <RotateCcw className="w-3.5 h-3.5" /> Reschedule
                  </button>
                )}
                {viewingAppt.status !== 'No-show' && viewingAppt.status !== 'Completed' && (
                  <button onClick={() => handleStatusChange(viewingAppt, 'No-show')} disabled={actionBusy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-60">
                    <UserX className="w-3.5 h-3.5" /> No Show
                  </button>
                )}
                {viewingAppt.status !== 'Cancelled' && viewingAppt.status !== 'Completed' && (
                  <button onClick={() => handleStatusChange(viewingAppt, 'Cancelled')} disabled={actionBusy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 disabled:opacity-60">
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setViewingAppt(null); setReschedulingAppt(null); openEdit(viewingAppt); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => { setViewingAppt(null); setReschedulingAppt(null); }} className="px-3 py-1.5 text-gray-500 rounded-lg text-sm hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Meeting Done (proof upload) Modal ──────────────────── */}
      {markingDoneAppt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !uploadingProof && setMarkingDoneAppt(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Mark Meeting Done</h2>
              <button onClick={() => !uploadingProof && setMarkingDoneAppt(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-gray-600">Upload the counselling sheet (or other proof, e.g. a screenshot or signed note) confirming this meeting took place, so a FOE can verify it.</p>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 text-gray-500 text-sm">
                <Upload className="w-4 h-4" />
                {proofFile ? proofFile.name : 'Choose counselling sheet'}
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
              </label>
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setMarkingDoneAppt(null)} disabled={uploadingProof}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                Cancel
              </button>
              <button onClick={handleConfirmMarkDone} disabled={!proofFile || uploadingProof}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
                {uploadingProof ? 'Uploading…' : 'Upload & Mark Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Appointment Modal ───────────────────────────────────── */}
      {editingAppt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Edit Appointment #{editingAppt.id}</h2>
              <button onClick={() => setEditingAppt(null)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {actionError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{actionError}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
                  <input type="time" value={editForm.appointtime} onChange={e => setEditForm({...editForm, appointtime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead ID</label>
                  <input type="number" min="1" value={editForm.leadid} onChange={e => setEditForm({...editForm, leadid: e.target.value})}
                    placeholder={editingAppt.leadName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Counsellor ID</label>
                  <input type="number" min="1" value={editForm.counsilorid} onChange={e => setEditForm({...editForm, counsilorid: e.target.value})}
                    placeholder={editingAppt.counsilorName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch ID</label>
                  <input type="number" min="0" value={editForm.branch} onChange={e => setEditForm({...editForm, branch: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region ID</label>
                  <input type="number" min="1" value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editForm.booked} onChange={e => setEditForm({...editForm, booked: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Mark as booked / confirmed
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setEditingAppt(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={actionBusy || !editForm.date || !editForm.appointtime}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm">
                {actionBusy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Appointment</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete appointment <span className="font-semibold">#{deleteId}</span>? This cannot be undone.
            </p>
            {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setDeleteId(null); setActionError(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={actionBusy}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 text-sm">
                {actionBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
