'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { useSortableData } from '@/components/ui/sortable-th'
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import EmployeePicker from '@/components/admin/EmployeePicker'
import {
  CheckSquare,
  Square,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  X
} from 'lucide-react'

interface Task {
  id: number
  title: string
  description: string
  assignedTo: number
  assignedToName: string
  assignedBy: number
  assignedByName: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  dueDate: string
  createdAt: string
  completedAt?: string
  category: string
  leadId?: number
  leadName?: string
}

interface DmTaskRecord {
  id: number
  task: string | null
  dob: string | null
  date_created: string | null
  stage: number
  asignTo: number
  asignBy: number
  status: string
  doc: string | null
  notf: number
  created: string
}

export default function AllTaskListPage() {
  const { hasPermission } = useAuth()
  const canReassign = hasPermission('operations.task_reassign') || hasPermission('operations.manage')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [reassigningTaskId, setReassigningTaskId] = useState<number | null>(null)
  const [reassignError, setReassignError] = useState<string | null>(null)

  const handleReassign = async (taskId: number, employee: { id: number; name: string }) => {
    setReassignError(null)
    try {
      const response = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, asignTo: employee.id }),
      })
      if (!response.ok) throw new Error('Failed to reassign task')
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assignedTo: employee.id, assignedToName: employee.name } : t)))
      setReassigningTaskId(null)
    } catch (error) {
      setReassignError(error instanceof Error ? error.message : 'Failed to reassign task')
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin/tasks?limit=100')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const result = await response.json()
      setTasks((result.data || []).map(mapTaskRecord))
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const mapTaskStatus = (status: string): Task['status'] => {
    if (status === '1' || status === 'completed') return 'completed'
    if (status === '2' || status === 'in_progress') return 'in_progress'
    if (status === '3' || status === 'cancelled') return 'cancelled'
    return 'pending'
  }

  const mapTaskRecord = (record: DmTaskRecord): Task => {
    const dueDate = record.dob || record.date_created || record.created || new Date().toISOString()
    const createdAt = record.date_created || record.created || new Date().toISOString()
    return {
      id: record.id,
      title: record.task || `Task #${record.id}`,
      description: record.doc ? `Document: ${record.doc}` : '',
      assignedTo: record.asignTo || 0,
      assignedToName: record.asignTo ? `Employee #${record.asignTo}` : 'Unassigned',
      assignedBy: record.asignBy || 0,
      assignedByName: record.asignBy ? `Employee #${record.asignBy}` : 'System',
      priority: record.notf ? 'high' : 'medium',
      status: mapTaskStatus(record.status),
      dueDate,
      createdAt,
      completedAt: mapTaskStatus(record.status) === 'completed' ? dueDate : undefined,
      category: record.stage ? `Stage ${record.stage}` : 'General',
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'cancelled':
        return <Square className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.assignedToName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.leadName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || task.status === statusFilter
    const matchesPriority = !priorityFilter || task.priority === priorityFilter
    const matchesAssigned = !assignedFilter || 
      (assignedFilter === 'me' && task.assignedToName === 'Current User') ||
      (assignedFilter !== 'me' && task.assignedToName?.toLowerCase().includes(assignedFilter.toLowerCase()))
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssigned
  })

  const { sorted: sortedTasks, sortKey: taskSortKey, sortDirection: taskSortDirection, toggleSort: toggleTaskSort } = useSortableData(
    filteredTasks,
    {
      task: (t) => t.title,
      assignedTo: (t) => t.assignedToName,
      priority: (t) => t.priority,
      status: (t) => t.status,
      dueDate: (t) => t.dueDate,
      lead: (t) => t.leadName,
    },
  )

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
    urgent: tasks.filter(t => t.priority === 'urgent').length
  }

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
            <h1 className="text-3xl font-bold text-gray-900">All Tasks</h1>
            <p className="text-gray-600">View and manage all tasks across the organization</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        {reassignError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{reassignError}</div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                <p className="text-sm text-gray-500">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{taskStats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{taskStats.cancelled}</p>
                <p className="text-sm text-gray-500">Cancelled</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{taskStats.urgent}</p>
                <p className="text-sm text-gray-500">Urgent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
              <SearchableSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </SearchableSelect>
              <SearchableSelect
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </SearchableSelect>
              <SearchableSelect
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Assigned</option>
                <option value="me">My Tasks</option>
              </SearchableSelect>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardContent className="p-4">
            <SortButtonRow
              options={[
                ['task', 'Task'],
                ['assignedTo', 'Assigned To'],
                ['priority', 'Priority'],
                ['status', 'Status'],
                ['dueDate', 'Due Date'],
                ['lead', 'Lead'],
              ] as const}
              activeKey={taskSortKey}
              direction={taskSortDirection}
              onSort={toggleTaskSort}
            />
            <RecordList isEmpty={filteredTasks.length === 0} emptyIcon={AlertCircle} emptyTitle="No tasks found">
              {sortedTasks.map((task) => (
                <RecordCard
                  key={task.id}
                  avatar={getStatusIcon(task.status)}
                  avatarColorClass="from-blue-600 to-cyan-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{task.title}</span>}
                  titleBadges={
                    <>
                      {getPriorityBadge(task.priority)}
                      {getStatusBadge(task.status)}
                    </>
                  }
                  metaItems={task.description ? [{ icon: AlertCircle, text: task.description, key: 'desc' }] : undefined}
                  stats={[
                    { label: 'Category', value: task.category },
                    { label: 'Assigned To', value: task.assignedToName, sub: `by ${task.assignedByName}` },
                    { label: 'Due Date', value: new Date(task.dueDate).toLocaleDateString(), sub: task.completedAt ? `Completed: ${new Date(task.completedAt).toLocaleDateString()}` : undefined },
                    ...(task.leadName ? [{ label: 'Lead', value: task.leadName, sub: `ID: ${task.leadId}` }] : []),
                  ]}
                  extra={reassigningTaskId === task.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-56">
                        <EmployeePicker
                          placeholder="Reassign to…"
                          onSelect={(employee) => handleReassign(task.id, employee)}
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setReassigningTaskId(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : undefined}
                  actions={reassigningTaskId === task.id ? [] : [
                    { key: 'reassign', icon: Edit, label: 'Reassign task', onClick: () => setReassigningTaskId(task.id), hidden: !canReassign },
                    { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => {}, colorClass: 'bg-red-50 text-red-700 hover:bg-red-100' },
                  ]}
                />
              ))}
            </RecordList>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
