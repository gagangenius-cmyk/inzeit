'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import EmployeePicker, { type EmployeeResult } from '@/components/admin/EmployeePicker'
import { Phone, CheckSquare, Calendar, Send } from 'lucide-react'

type AssignmentType = 'call' | 'task' | 'appointment'

const TYPE_OPTIONS: Array<{ value: AssignmentType; label: string; icon: typeof Phone }> = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'task', label: 'Task', icon: CheckSquare },
  { value: 'appointment', label: 'Appointment', icon: Calendar },
]

export default function OpsAssignPage() {
  const router = useRouter()
  const [type, setType] = useState<AssignmentType>('task')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [leadId, setLeadId] = useState('')
  const [assignee, setAssignee] = useState<EmployeeResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setTitle('')
    setNotes('')
    setDueAt('')
    setLeadId('')
    setAssignee(null)
  }

  const handleSubmit = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!assignee) {
      setError('Please choose who this is assigned to')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/ops-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          notes: notes.trim() || null,
          assignedTo: assignee.id,
          dueAt: dueAt || null,
          leadId: leadId || null,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create assignment')
      }
      window.toast?.success(`${TYPE_OPTIONS.find((t) => t.value === type)?.label} assigned to ${assignee.name}`)
      resetForm()
      router.push('/admin/ops-my-assignments')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assign Call / Task / Appointment</h1>
        <p className="text-gray-600">Assign a follow-up call, task, or appointment to a team member.</p>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((option) => {
                const Icon = option.icon
                const active = type === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-md border px-3 py-3 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'call'
                  ? 'e.g. Call client about missing documents'
                  : type === 'appointment'
                  ? 'e.g. Visa consultation appointment'
                  : 'e.g. Follow up on pending payment'
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Assign To</label>
            {assignee ? (
              <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-gray-900">{assignee.name}</span>
                  <span className="ml-2 text-xs text-gray-500">{assignee.roleName || 'No role'}</span>
                </span>
                <button type="button" onClick={() => setAssignee(null)} className="text-xs font-semibold text-blue-600 hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <EmployeePicker placeholder="Search employee by name or email…" onSelect={setAssignee} />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Due Date/Time (optional)</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Lead ID (optional)</label>
              <input
                type="number"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                placeholder="Link to a lead/case"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push('/admin/ops-my-assignments')}>
              View My Assignments
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
