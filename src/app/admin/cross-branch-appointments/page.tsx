'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isCeo } from '@/lib/roleChecks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/useDebounce'
import {
  Calendar,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Users2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface CrossBranchAppointment {
  id: number
  leadId: number
  leadName: string
  date: string
  time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  counselorId: number
  counselorName: string
  branch: string
  region: string
  assignedBranch: string
  assignedByName: string
  acknowledged: boolean
  acknowledgedAt: string | null
  remarks: string
}

// Read-only monitoring view for appointments one branch has handed off to
// another (appointments.cross_branch = 1) — the regular Appointment List
// page already has a "Cross-Branch Only" toggle buried in its filters; this
// page is the dedicated landing spot for that same data, surfaced next to
// "Appointments" in the sidebar, with the handoff-specific columns
// (Assigned By / Acknowledged) that a generic appointment list doesn't need.
//
// Visibility is intentionally company-wide: CEO, branch manager, FOE, and
// counselor all see every cross-branch handoff here (via the API's
// crossBranchOnly override), not just ones tied to their own branch/id -
// this page exists specifically so any role can track who still owes an
// acknowledgement.
export default function CrossBranchAppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<CrossBranchAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingRemark, setEditingRemark] = useState(false)
  const [remarkDraft, setRemarkDraft] = useState('')
  const [savingRemark, setSavingRemark] = useState(false)
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const debouncedSearchTerm = useDebounce(searchTerm, 350)

  useEffect(() => {
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearchTerm, statusFilter])

  // `loading` only ever gates the very first load (see the early-return
  // below) - re-fetches after a remark save / acknowledge use `refreshing`
  // instead, so those actions don't blank out the whole page (header,
  // filters, expanded row) behind a full-screen spinner every time.
  const fetchAppointments = async () => {
    setRefreshing(true)
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        crossBranchOnly: '1',
      })
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
      // Backend's status vocabulary spells this "no-show" (hyphen); this
      // page's filter uses "no_show" (underscore) to match its own status
      // union type below — translate at the boundary rather than changing
      // either vocabulary.
      if (statusFilter) params.set('status', statusFilter === 'no_show' ? 'no-show' : statusFilter)

      const response = await fetch(`/api/appointments?${params}`)
      if (response.ok) {
        const data = await response.json()
        const mapped = (data.appointments || [])
          .filter((a: any) => Number(a.cross_branch || 0) === 1)
          .map((a: any): CrossBranchAppointment => {
            // Mirrors AppointmentScheduler's getAppointmentStatus so a handoff
            // shows the same status here as everywhere else in the app.
            // meeting_status is the source of truth once set - it's the only
            // thing that distinguishes No-show/Rescheduled from a plain
            // Cancelled/Scheduled row, since those pairs share the same
            // booked/done/not_done flag combination.
            let status: CrossBranchAppointment['status'] = 'scheduled'
            if (a.meeting_status === 'no_show') status = 'no_show'
            else if (a.meeting_status === 'rescheduled') status = 'rescheduled'
            else if (Number(a.done) === 1) status = 'completed'
            else if (Number(a.not_done) === 1) status = 'cancelled'
            else if (Number(a.booked) === 1) status = 'confirmed'

            return {
              id: Number(a.id),
              leadId: Number(a.leadid || 0),
              leadName: `${a.fname || ''} ${a.lname || ''}`.trim() || (a.leadid ? `Lead #${a.leadid}` : 'Walk-in'),
              date: a.date || '',
              time: String(a.appointtime || '').slice(0, 5),
              status,
              counselorId: Number(a.counsilorid || 0),
              counselorName: a.counselorName || (a.counsilorid ? `Counselor #${a.counsilorid}` : 'Unassigned'),
              branch: a.branchName || (a.branch ? `Branch #${a.branch}` : ''),
              region: a.regionName || (a.region ? `Region #${a.region}` : ''),
              assignedBranch: a.assignedBranchName || (a.assigned_branch ? `Branch #${a.assigned_branch}` : ''),
              assignedByName: a.assignedByName || (a.assigned_by ? `Employee #${a.assigned_by}` : 'Unknown'),
              acknowledged: Number(a.acknowledged || 0) === 1,
              acknowledgedAt: a.acknowledged_at || null,
              remarks: a.remarks || '',
            }
          })
        setAppointments(mapped)
        setPagination((prev) => ({ ...prev, total: data.pagination?.total ?? 0, pages: data.pagination?.pages ?? 0 }))
      }
    } catch (error) {
      console.error('Error fetching cross-branch appointments:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const toggleView = (appointment: CrossBranchAppointment) => {
    if (expandedId === appointment.id) {
      setExpandedId(null)
      setEditingRemark(false)
      return
    }
    setExpandedId(appointment.id)
    setEditingRemark(false)
    setRemarkDraft(appointment.remarks || '')
  }

  const startEditRemark = (appointment: CrossBranchAppointment) => {
    setExpandedId(appointment.id)
    setEditingRemark(true)
    setRemarkDraft(appointment.remarks || '')
  }

  const saveRemark = async (id: number) => {
    try {
      setSavingRemark(true)
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: remarkDraft }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to save remark')
      }
      setEditingRemark(false)
      await fetchAppointments()
    } catch (error) {
      console.error('Error saving appointment remark:', error)
      window.toast.error(error instanceof Error ? error.message : 'Failed to save remark. Please try again.')
    } finally {
      setSavingRemark(false)
    }
  }

  // Only the counselor it was actually handed to (or the CEO, as an
  // override) can acknowledge - matches /api/appointments/[id]/acknowledge's
  // own authorization, so this button never renders somewhere it would just
  // 403.
  const canAcknowledge = (appointment: CrossBranchAppointment) =>
    !appointment.acknowledged && !!user && (
      Number(appointment.counselorId) === Number((user as any).id) || isCeo(user as any)
    )

  const handleAcknowledge = async (appointment: CrossBranchAppointment) => {
    if (acknowledgingId) return
    setAcknowledgingId(appointment.id)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/acknowledge`, { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to acknowledge')
      }
      window.toast.success('Appointment acknowledged')
      await fetchAppointments()
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : 'Failed to acknowledge appointment')
    } finally {
      setAcknowledgingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-slate-100 text-slate-700">Scheduled</Badge>
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-teal-100 text-teal-800">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case 'no_show':
        return <Badge className="bg-orange-100 text-orange-800">No-show</Badge>
      case 'rescheduled':
        return <Badge className="bg-amber-100 text-amber-800">Rescheduled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-teal-500" />
      case 'cancelled':
      case 'no_show':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'rescheduled':
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      default:
        return <Clock className="h-4 w-4 text-slate-500" />
    }
  }

  // search/status are now applied server-side (see fetchAppointments) — only
  // the date range stays client-side over the fetched page, since the
  // backend only supports an exact-date match today.
  const filteredAppointments = appointments.filter(appointment => {
    const matchesDate = (!dateFrom || appointment.date >= dateFrom) && (!dateTo || appointment.date <= dateTo)
    return matchesDate
  })

  const hasActiveFilters = Boolean(searchTerm || statusFilter || dateFrom || dateTo)
  const clearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  // Reflects only the currently loaded page now that this list is paginated
  // server-side, not every unacknowledged handoff company-wide.
  const pendingAckCount = appointments.filter((a) => !a.acknowledged).length

  const { sorted: sortedAppointments, sortKey: appointmentSortKey, sortDirection: appointmentSortDirection, toggleSort: toggleAppointmentSort } = useSortableData(
    filteredAppointments,
    {
      dateTime: (a) => `${a.date} ${a.time}`,
      lead: (a) => a.leadName,
      counselor: (a) => a.counselorName,
      assignedBy: (a) => a.assignedByName,
      status: (a) => a.status,
      location: (a) => `${a.branch || ''} ${a.assignedBranch || ''}`,
    },
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--cmg-blue-soft)] text-[var(--cmg-blue)]">
            <Users2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cross-Branch Appointments</h1>
            <p className="text-gray-600 text-sm">
              Appointments handed off from one branch to another
              {appointments.length > 0 && (
                <span className="text-gray-400">
                  {' '}· {appointments.length} total
                  {pendingAckCount > 0 && (
                    <span className="text-amber-600"> · {pendingAckCount} awaiting acknowledgement</span>
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAppointments()} disabled={refreshing} className="self-start sm:self-auto">
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by lead, counselor, or assigned by..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })) }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            <SearchableSelect
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })) }}
              className="w-full lg:w-48"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No-show</option>
              <option value="rescheduled">Rescheduled</option>
            </SearchableSelect>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                aria-label="Date from"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                aria-label="Date to"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Clear all filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardContent className="p-4">
          <div>
            <SortButtonRow
              options={[
                ['dateTime', 'Date & Time'],
                ['lead', 'Lead'],
                ['counselor', 'Counselor'],
                ['assignedBy', 'Assigned By'],
                ['status', 'Status'],
                ['location', 'Location'],
              ] as const}
              activeKey={appointmentSortKey}
              direction={appointmentSortDirection}
              onSort={toggleAppointmentSort}
            />
            <RecordList isEmpty={false}>
              {sortedAppointments.map((appointment) => {
                const isExpanded = expandedId === appointment.id;
                return (
                  <RecordCard
                    key={appointment.id}
                    avatar={getStatusIcon(appointment.status)}
                    avatarColorClass="from-blue-600 to-cyan-400"
                    title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{appointment.leadName}</span>}
                    titleBadges={
                      <>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">ID: {appointment.leadId}</span>
                        {getStatusBadge(appointment.status)}
                        {appointment.acknowledged ? (
                          <Badge className="bg-green-100 text-green-800">
                            {appointment.acknowledgedAt ? new Date(appointment.acknowledgedAt).toLocaleDateString() : 'Acknowledged'}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Pending Ack.</Badge>
                        )}
                      </>
                    }
                    stats={[
                      { label: 'Date & Time', value: `${new Date(appointment.date).toLocaleDateString()} ${appointment.time}` },
                      { label: 'Counselor', value: appointment.counselorName, sub: `ID: ${appointment.counselorId}` },
                      { label: 'Assigned By', value: appointment.assignedByName },
                      { label: 'Location', value: appointment.branch, sub: appointment.assignedBranch ? `→ ${appointment.assignedBranch}` : undefined },
                    ]}
                    extra={isExpanded ? (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Remarks</div>
                        {editingRemark ? (
                          <div className="space-y-2 max-w-lg">
                            <textarea
                              value={remarkDraft}
                              onChange={(e) => setRemarkDraft(e.target.value)}
                              placeholder="Add a remark for this appointment..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" disabled={savingRemark} onClick={() => saveRemark(appointment.id)}>
                                {savingRemark ? 'Saving...' : 'Save'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingRemark(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                              {appointment.remarks || 'No remarks added yet.'}
                            </div>
                            <button
                              onClick={() => startEditRemark(appointment)}
                              className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                            >
                              {appointment.remarks ? 'Edit' : 'Add remark'}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : undefined}
                    actions={[
                      { key: 'ack', icon: ShieldCheck, label: 'Acknowledge this appointment', onClick: () => handleAcknowledge(appointment), disabled: acknowledgingId === appointment.id, colorClass: 'bg-green-50 text-green-700 hover:bg-green-100', hidden: !canAcknowledge(appointment) },
                      { key: 'view', icon: Eye, label: 'View details and remarks', onClick: () => toggleView(appointment) },
                      { key: 'remark', icon: MessageSquare, label: 'Add / edit remark', onClick: () => startEditRemark(appointment) },
                    ]}
                  />
                );
              })}
            </RecordList>

            {filteredAppointments.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {appointments.length === 0 ? 'No cross-branch appointments found' : 'No appointments match your filters'}
                </p>
                {appointments.length > 0 && hasActiveFilters && (
                  <button onClick={clearAllFilters} className="mt-2 text-sm text-blue-600 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {Math.max(pagination.pages, 1)} — {pagination.total} appointments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.pages || prev.page, prev.page + 1) }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
