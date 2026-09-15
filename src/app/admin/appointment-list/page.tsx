'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/useDebounce'
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Appointment {
  id: number
  leadId: number
  leadName: string
  date: string
  time: string
  type: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'pending'
  counselorId: number
  counselorName: string
  branch: string
  region: string
  notes: string
  remarks: string
  createdAt: string
  crossBranch: boolean
}

export default function AppointmentListPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [crossBranchOnly, setCrossBranchOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editingRemark, setEditingRemark] = useState(false)
  const [remarkDraft, setRemarkDraft] = useState('')
  const [savingRemark, setSavingRemark] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const debouncedSearchTerm = useDebounce(searchTerm, 350)

  useEffect(() => {
    setLoading(true)
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearchTerm, statusFilter, crossBranchOnly])

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      })
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm)
      if (statusFilter) params.set('status', statusFilter)
      if (crossBranchOnly) params.set('crossBranchOnly', '1')

      const response = await fetch(`/api/appointments?${params}`)
      if (response.ok) {
        const data = await response.json()
        const mapped = (data.appointments || []).map((a: any): Appointment => {
          let status: Appointment['status'] = 'scheduled'
          if (Number(a.done) === 1) status = 'completed'
          else if (Number(a.not_done) === 1) status = 'cancelled'
          else if (Number(a.booked) === 1) status = 'confirmed'

          return {
            id: Number(a.id),
            leadId: Number(a.leadid || 0),
            leadName: `${a.fname || ''} ${a.lname || ''}`.trim() || (a.leadid ? `Lead #${a.leadid}` : 'Walk-in'),
            date: a.date || '',
            time: String(a.appointtime || '').slice(0, 5),
            type: 'Consultation',
            status,
            counselorId: Number(a.counsilorid || 0),
            counselorName: a.counselorName || (a.counsilorid ? `Counselor #${a.counsilorid}` : 'Unassigned'),
            branch: a.branchName || (a.branch ? `Branch #${a.branch}` : ''),
            region: a.regionName || (a.region ? `Region #${a.region}` : ''),
            notes: a.screenshot || '',
            remarks: a.remarks || '',
            createdAt: '',
            crossBranch: Number(a.cross_branch || 0) === 1
          }
        })
        setAppointments(mapped)
        setPagination((prev) => ({ ...prev, total: data.pagination?.total ?? 0, pages: data.pagination?.pages ?? 0 }))
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleView = (appointment: Appointment) => {
    if (expandedId === appointment.id) {
      setExpandedId(null)
      setEditingRemark(false)
      return
    }
    setExpandedId(appointment.id)
    setEditingRemark(false)
    setRemarkDraft(appointment.remarks || '')
  }

  const startEditRemark = (appointment: Appointment) => {
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
      if (!res.ok) throw new Error('Failed to save remark')
      setEditingRemark(false)
      await fetchAppointments()
    } catch (error) {
      console.error('Error saving appointment remark:', error)
      window.toast.error('Failed to save remark. Please try again.')
    } finally {
      setSavingRemark(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case 'rescheduled':
        return <Badge className="bg-yellow-100 text-yellow-800">Rescheduled</Badge>
      case 'pending':
        return <Badge className="bg-purple-100 text-purple-800">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  // search/status/crossBranchOnly are now applied server-side (see
  // fetchAppointments) — only the date range stays client-side over the
  // fetched page, since the backend only supports an exact-date match today.
  const filteredAppointments = appointments.filter(appointment => {
    const matchesDate = (!dateFrom || appointment.date >= dateFrom) && (!dateTo || appointment.date <= dateTo)
    return matchesDate
  })

  const { sorted: sortedAppointments, sortKey: appointmentSortKey, sortDirection: appointmentSortDirection, toggleSort: toggleAppointmentSort } = useSortableData(
    filteredAppointments,
    {
      dateTime: (a) => `${a.date} ${a.time}`,
      lead: (a) => a.leadName,
      counselor: (a) => a.counselorName,
      type: (a) => a.type,
      status: (a) => a.status,
      location: (a) => `${a.branch || ''} ${a.region || ''}`,
    },
  )

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointment List</h1>
            <p className="text-gray-600">View and manage all appointments</p>
          </div>
          <Button onClick={() => window.location.href = '/appointments'}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })) }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
              <SearchableSelect
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })) }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="pending">Pending</option>
              </SearchableSelect>
              <div className="flex items-center gap-2">
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
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo('') }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <Button
                variant={crossBranchOnly ? 'default' : 'outline'}
                onClick={() => { setCrossBranchOnly((prev) => !prev); setPagination((prev) => ({ ...prev, page: 1 })) }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Cross-Branch Only
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card>
          <CardContent className="p-3">
            <SortButtonRow
              options={[
                ['dateTime', 'Date & Time'],
                ['lead', 'Lead'],
                ['counselor', 'Counselor'],
                ['type', 'Type'],
                ['status', 'Status'],
                ['location', 'Location'],
              ] as const}
              activeKey={appointmentSortKey}
              direction={appointmentSortDirection}
              onSort={toggleAppointmentSort}
            />

            <RecordList
              isEmpty={sortedAppointments.length === 0}
              emptyIcon={Calendar}
              emptyTitle="No appointments found"
              emptyDescription="Try changing filters or search terms."
            >
              {sortedAppointments.map((appointment) => (
                <div key={appointment.id}>
                  <RecordCard
                    avatar={getStatusIcon(appointment.status)}
                    avatarColorClass="from-blue-600 to-cyan-400"
                    title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{appointment.leadName}</span>}
                    titleBadges={
                      <>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">ID: {appointment.leadId}</span>
                        {getStatusBadge(appointment.status)}
                        {appointment.crossBranch && <Badge className="bg-teal-100 text-teal-800">Cross-Branch</Badge>}
                      </>
                    }
                    metaItems={[
                      { icon: Calendar, text: new Date(appointment.date).toLocaleDateString() },
                      { icon: Clock, text: appointment.time || '—' },
                      { icon: Users, text: `${appointment.counselorName} (ID: ${appointment.counselorId})` },
                    ]}
                    stats={[
                      { label: 'Type', value: appointment.type },
                      { label: 'Location', value: appointment.branch || '—', sub: appointment.region || undefined },
                    ]}
                    actions={[
                      { key: 'view', icon: Eye, label: 'View details and remarks', onClick: () => toggleView(appointment), colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                      { key: 'remark', icon: MessageSquare, label: 'Add / edit remark', onClick: () => startEditRemark(appointment), colorClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                      { key: 'edit', icon: Edit, label: 'Edit', colorClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                      { key: 'delete', icon: Trash2, label: 'Delete', colorClass: 'bg-red-50 text-red-700 hover:bg-red-100' },
                    ]}
                  />
                  {expandedId === appointment.id && (
                    <div className="-mt-1 rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 p-4">
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
                  )}
                </div>
              ))}
            </RecordList>

            <div className="flex items-center justify-between px-1 py-4 border-t border-gray-200 mt-3">
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
    </>
  )
}
