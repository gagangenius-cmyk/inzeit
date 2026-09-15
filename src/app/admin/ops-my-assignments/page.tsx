'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { RecordCard, RecordList } from '@/components/shared/ResponsiveRecordList'
import { Phone, CheckSquare, Calendar, Plus, Loader2, Trash2, ListChecks, PlayCircle, MessageSquare, X } from 'lucide-react'

type AssignmentType = 'call' | 'task' | 'appointment'
type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

interface AssignmentRecord {
  id: number
  type: AssignmentType
  title: string
  notes: string | null
  outcome_remark: string | null
  due_at: string | null
  status: AssignmentStatus
  lead_id: number | null
  assignedToEmployee?: { id: number; name: string; email: string } | null
  assignedByEmployee?: { id: number; name: string; email: string } | null
  lead?: { id: number; fname: string; lname: string } | null
}

const STATUS_OPTIONS: Array<{ value: AssignmentStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const TYPE_META: Record<AssignmentType, { label: string; icon: typeof Phone }> = {
  call: { label: 'Call', icon: Phone },
  task: { label: 'Task', icon: CheckSquare },
  appointment: { label: 'Appointment', icon: Calendar },
}

const statusBadge = (status: AssignmentStatus) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    case 'in_progress':
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
    default:
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
  }
}

export default function OpsMyAssignmentsPage() {
  const { user, hasPermission } = useAuth()
  const canManage = hasPermission('operations.manage')
  const [scope, setScope] = useState<'mine' | 'assignedByMe' | 'all'>('mine')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [remarkModal, setRemarkModal] = useState<AssignmentRecord | null>(null)
  const [remarkText, setRemarkText] = useState('')
  const [remarkStatus, setRemarkStatus] = useState<AssignmentStatus>('pending')
  const [savingRemark, setSavingRemark] = useState(false)

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ scope, limit: '200' })
      if (typeFilter) params.set('type', typeFilter)
      if (statusFilter) params.set('status', statusFilter)
      const response = await fetch(`/api/admin/ops-assignments?${params.toString()}`)
      const result = await response.json()
      setAssignments(result.data || [])
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [scope, typeFilter, statusFilter])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const updateStatus = async (id: number, status: AssignmentStatus) => {
    setBusyId(id)
    try {
      const response = await fetch(`/api/admin/ops-assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to update')
      setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    } catch (error) {
      window.toast?.error(error instanceof Error ? error.message : 'Failed to update assignment')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this assignment?')) return
    setBusyId(id)
    try {
      const response = await fetch(`/api/admin/ops-assignments/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to delete')
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    } catch (error) {
      window.toast?.error(error instanceof Error ? error.message : 'Failed to delete assignment')
    } finally {
      setBusyId(null)
    }
  }

  const openRemarkModal = (assignment: AssignmentRecord) => {
    setRemarkModal(assignment)
    setRemarkStatus(assignment.status)
    setRemarkText('')
  }

  const submitRemark = async () => {
    if (!remarkModal) return
    if (!remarkText.trim()) {
      window.toast?.error('Enter a remark before saving')
      return
    }
    setSavingRemark(true)
    try {
      const response = await fetch(`/api/admin/ops-assignments/${remarkModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: remarkStatus, remark: remarkText.trim() }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to save remark')
      setAssignments((prev) => prev.map((a) => (a.id === remarkModal.id ? { ...a, ...result.data } : a)))
      setRemarkModal(null)
      window.toast?.success('Remark saved')
    } catch (error) {
      window.toast?.error(error instanceof Error ? error.message : 'Failed to save remark')
    } finally {
      setSavingRemark(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600">Calls, tasks, and appointments assigned to and by you.</p>
        </div>
        <Link href="/admin/ops-assign">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Assign New
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <div className="flex rounded-md bg-gray-100 p-1">
            {(
              [
                ['mine', 'Assigned to Me'],
                ['assignedByMe', 'Assigned by Me'],
                ...(canManage ? ([['all', 'All']] as const) : []),
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  scope === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <SearchableSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium"
          >
            <option value="">Type: All</option>
            <option value="call">Call</option>
            <option value="task">Task</option>
            <option value="appointment">Appointment</option>
          </SearchableSelect>
          <SearchableSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium"
          >
            <option value="">Status: All</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </SearchableSelect>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading assignments…
            </div>
          ) : (
            <RecordList isEmpty={assignments.length === 0} emptyIcon={ListChecks} emptyTitle="No assignments found">
              {assignments.map((assignment) => {
                const meta = TYPE_META[assignment.type]
                const Icon = meta.icon
                const isMine = user?.id === assignment.assignedToEmployee?.id
                const canDelete = canManage || user?.id === assignment.assignedByEmployee?.id
                return (
                  <RecordCard
                    key={assignment.id}
                    avatar={<Icon className="h-4 w-4" />}
                    avatarColorClass="from-blue-600 to-cyan-400"
                    title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{assignment.title}</span>}
                    titleBadges={
                      <>
                        <Badge className="bg-gray-100 text-gray-700">{meta.label}</Badge>
                        {statusBadge(assignment.status)}
                      </>
                    }
                    metaItems={[
                      ...(assignment.notes ? [{ icon: CheckSquare, text: assignment.notes, key: 'notes' }] : []),
                      ...(assignment.outcome_remark ? [{ icon: MessageSquare, text: assignment.outcome_remark, key: 'outcome' }] : []),
                    ]}
                    stats={[
                      { label: 'Assigned To', value: assignment.assignedToEmployee?.name || 'Unknown' },
                      { label: 'Assigned By', value: assignment.assignedByEmployee?.name || 'Unknown' },
                      { label: 'Due', value: assignment.due_at ? new Date(assignment.due_at).toLocaleString() : 'No due date' },
                      ...(assignment.lead
                        ? [{ label: 'Lead', value: `${assignment.lead.fname} ${assignment.lead.lname}`.trim(), sub: `ID: ${assignment.lead.id}` }]
                        : []),
                    ]}
                    actions={[
                      ...(isMine && assignment.status === 'pending'
                        ? [{ key: 'start', icon: PlayCircle, label: 'Start', onClick: () => updateStatus(assignment.id, 'in_progress'), colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100' }]
                        : []),
                      ...(isMine && assignment.status !== 'completed' && assignment.status !== 'cancelled'
                        ? [{ key: 'complete', icon: CheckSquare, label: 'Mark completed', onClick: () => updateStatus(assignment.id, 'completed'), colorClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' }]
                        : []),
                      ...(isMine
                        ? [{ key: 'remark', icon: MessageSquare, label: 'Add Remark', onClick: () => openRemarkModal(assignment), colorClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100' }]
                        : []),
                      ...(canDelete
                        ? [{ key: 'delete', icon: Trash2, label: 'Delete', onClick: () => handleDelete(assignment.id), colorClass: 'bg-red-50 text-red-700 hover:bg-red-100' }]
                        : []),
                    ].map((action) => ({ ...action, disabled: busyId === assignment.id }))}
                  />
                )
              })}
            </RecordList>
          )}
        </CardContent>
      </Card>

      {remarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-bold text-gray-900">Add Remark</h2>
              <button onClick={() => setRemarkModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <p className="text-sm text-gray-500">{remarkModal.title}</p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={remarkStatus}
                  onChange={(e) => setRemarkStatus(e.target.value as AssignmentStatus)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Remark *</label>
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  rows={3}
                  placeholder="e.g. Not reachable, client didn't respond, callback requested for tomorrow…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
              {remarkModal.outcome_remark && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-gray-500">Previous remarks</p>
                  <div className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    {remarkModal.outcome_remark}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <button onClick={() => setRemarkModal(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={submitRemark}
                disabled={savingRemark}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingRemark && <Loader2 className="h-4 w-4 animate-spin" />}
                {savingRemark ? 'Saving…' : 'Save Remark'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
