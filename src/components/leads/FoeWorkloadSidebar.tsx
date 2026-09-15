'use client'

import { useEffect, useState } from 'react'
import { PanelRightClose, Users, X } from 'lucide-react'
import { isFoeOrCeo } from '@/lib/roleChecks'

export interface CounselorWorkload {
  id: string
  name: string
  assignedLeads: number
  capacity: number // daily/weekly lead capacity, used to compute the progress bar
}

interface FoeWorkloadSidebarProps {
  counselors?: CounselorWorkload[]
  unassignedLeads?: number
  // Pass the signed-in user (session.user) so the panel can self-gate to
  // FOE/CEO. Omit it (e.g. in a demo/storybook context) and it always renders.
  currentUser?: { type?: string | null; roleName?: string | null } | null
  // Controlled open state — pass both to let a host header drive the toggle
  // (e.g. a bell-style icon button next to the rest of the top bar) instead
  // of the panel's own floating trigger. Omit both for the standalone/demo
  // behavior: the panel manages its own open state internally.
  open?: boolean
  onOpenChange?: (open: boolean) => void
  // Hides the panel's own floating trigger button — used together with
  // open/onOpenChange when a host header already renders its own button.
  hideTrigger?: boolean
  // Controlled date-range filter for the counts below — same controlled/
  // uncontrolled split as open/onOpenChange. The panel only renders the
  // buttons; the host (DashboardLayout) owns refetching `counselors` from
  // the server per period. Omit both to fall back to internal, unwired state
  // (the buttons still render in standalone/demo mode, they just don't
  // change the placeholder numbers).
  period?: WorkloadPeriod
  onPeriodChange?: (period: WorkloadPeriod) => void
}

export type WorkloadPeriod = 'all' | 'today' | 'yesterday' | 'week' | 'month'

const PERIOD_OPTIONS: { value: WorkloadPeriod; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

// Placeholder data — shown only when no `counselors`/`unassignedLeads` props
// are passed in (e.g. dropped into a layout standalone, before it's wired to
// a real endpoint such as /api/admin/counselor-workload).
const PLACEHOLDER_COUNSELORS: CounselorWorkload[] = [
  { id: '1', name: 'John Doe', assignedLeads: 14, capacity: 20 },
  { id: '2', name: 'Priya Sharma', assignedLeads: 18, capacity: 20 },
  { id: '3', name: 'Michael Chen', assignedLeads: 9, capacity: 20 },
  { id: '4', name: 'Aisha Khan', assignedLeads: 20, capacity: 20 },
  { id: '5', name: 'David Miller', assignedLeads: 5, capacity: 15 },
  { id: '6', name: 'Sara Ahmed', assignedLeads: 12, capacity: 20 },
]

const PLACEHOLDER_UNASSIGNED = 7

const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-blue-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function getLoadStyles(percent: number) {
  if (percent >= 100) {
    return {
      bar: 'bg-red-500',
      badge: 'bg-red-50 text-red-700 ring-1 ring-red-200',
      label: 'text-red-600',
    }
  }
  if (percent >= 75) {
    return {
      bar: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
      label: 'text-amber-600',
    }
  }
  return {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    label: 'text-slate-500',
  }
}

export default function FoeWorkloadSidebar({
  counselors = PLACEHOLDER_COUNSELORS,
  unassignedLeads = PLACEHOLDER_UNASSIGNED,
  currentUser,
  open,
  onOpenChange,
  hideTrigger = false,
  period,
  onPeriodChange,
}: FoeWorkloadSidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setIsOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const [internalPeriod, setInternalPeriod] = useState<WorkloadPeriod>('all')
  const isPeriodControlled = period !== undefined
  const activePeriod = isPeriodControlled ? period : internalPeriod

  const setActivePeriod = (next: WorkloadPeriod) => {
    if (!isPeriodControlled) setInternalPeriod(next)
    onPeriodChange?.(next)
  }

  // Close on Escape for keyboard users
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // FOE and CEO only - self-gates so any layout can mount this unconditionally
  // once it's wired to the session. currentUser undefined (no session passed
  // in yet) still renders, so the placeholder-data demo keeps working. Runs
  // after the hooks above so hook call order stays fixed across renders.
  if (currentUser !== undefined && currentUser !== null && !isFoeOrCeo(currentUser)) {
    return null
  }

  const totalAssigned = counselors.reduce((sum, c) => sum + c.assignedLeads, 0)
  const atCapacityCount = counselors.filter((c) => c.assignedLeads >= c.capacity).length

  return (
    <>
      {/* Floating toggle button (standalone mode only) */}
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="foe-workload-sidebar"
          aria-label="Toggle counselor workload panel"
          className="fixed right-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 ring-1 ring-slate-800 transition-transform hover:scale-105 hover:bg-slate-800 active:scale-95"
        >
          {isOpen ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <Users className="h-5 w-5" />
          )}

          {!isOpen && unassignedLeads > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white">
              {unassignedLeads > 99 ? '99+' : unassignedLeads}
            </span>
          )}
        </button>
      )}

      {/* Backdrop (mobile) */}
      <div
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar */}
      <aside
        id="foe-workload-sidebar"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md transform flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Lead Distribution
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Counselor Workload · {PERIOD_OPTIONS.find((o) => o.value === activePeriod)?.label}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close panel"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Period filter */}
        <div className="flex flex-nowrap gap-1.5 overflow-x-auto border-b border-slate-200 px-5 py-3">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setActivePeriod(option.value)}
              aria-pressed={activePeriod === option.value}
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                activePeriod === option.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Unassigned
            </p>
            <p className="text-lg font-semibold text-red-600">{unassignedLeads}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Assigned
            </p>
            <p className="text-lg font-semibold text-slate-900">{totalAssigned}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              At Capacity
            </p>
            <p className="text-lg font-semibold text-amber-600">{atCapacityCount}</p>
          </div>
        </div>

        {/* Counselor list */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {counselors.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-400">
              No counselors found.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {counselors.map((counselor, index) => {
                const percent = Math.min(
                  100,
                  Math.round((counselor.assignedLeads / counselor.capacity) * 100)
                )
                const styles = getLoadStyles(percent)

                return (
                  <li
                    key={counselor.id}
                    className="rounded-lg border border-transparent px-2.5 py-2.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(
                          index
                        )}`}
                      >
                        {getInitials(counselor.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {counselor.name}
                          </p>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badge}`}
                          >
                            {counselor.assignedLeads} Leads
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all ${styles.bar}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className={`w-8 shrink-0 text-right text-[11px] font-medium ${styles.label}`}>
                            {percent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-3">
          <p className="text-center text-[11px] text-slate-400">
            Updated in real time as leads are assigned
          </p>
        </div>
      </aside>
    </>
  )
}
