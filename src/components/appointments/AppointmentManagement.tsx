'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Phone,
  Mail
} from 'lucide-react'

interface Appointment {
  id: number
  date: string
  appointtime: string
  counsilorid: number
  booked: number
  done: number
  not_done: number
  region: number
  branch: number
  screenshot: string
  second_done: number
  second_meet_date: string
  lead?: {
    id: number
    fname: string
    lname: string
    phone: string
    email: string
  }
  counselor?: {
    id: number
    name: string
  }
}

interface AppointmentFormData {
  leadId: number
  date: string
  appointtime: string
  counsilorid: number
  branch: number
  region: number
  notes?: string
}

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [formData, setFormData] = useState<AppointmentFormData>({
    leadId: 0,
    date: '',
    appointtime: '',
    counsilorid: 0,
    branch: 0,
    region: 0,
    notes: ''
  })

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAppointment = async () => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({
          leadId: 0,
          date: '',
          appointtime: '',
          counsilorid: 0,
          branch: 0,
          region: 0,
          notes: ''
        })
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
    }
  }

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return

    try {
      const response = await fetch(`/api/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setEditingAppointment(null)
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  const handleDeleteAppointment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  const getStatusBadge = (appointment: Appointment) => {
    if (appointment.done === 1) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    } else if (appointment.not_done === 1) {
      return <Badge className="bg-red-100 text-red-800">Not Done</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const filteredAppointments = appointments.filter(appointment =>
    appointment.lead?.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.lead?.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.lead?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.lead?.phone?.includes(searchTerm)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage and schedule appointments</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Counselor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(appointment.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.appointtime}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.lead?.fname} {appointment.lead?.lname}
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3" />
                          {appointment.lead?.phone}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3" />
                          {appointment.lead?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.counselor?.name || 'Not Assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAppointment(appointment)
                            setFormData({
                              leadId: appointment.lead?.id || 0,
                              date: appointment.date,
                              appointtime: appointment.appointtime,
                              counsilorid: appointment.counsilorid,
                              branch: appointment.branch,
                              region: appointment.region
                            })
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingAppointment) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {editingAppointment ? 'Edit Appointment' : 'Create Appointment'}
              </h3>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead</label>
                <SearchableSelect
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value={0}>Select Lead</option>
                  {/* Add lead options here */}
                </SearchableSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  value={formData.appointtime}
                  onChange={(e) => setFormData({ ...formData, appointtime: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Counselor</label>
                <SearchableSelect
                  value={formData.counsilorid}
                  onChange={(e) => setFormData({ ...formData, counsilorid: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value={0}>Select Counselor</option>
                  {/* Add counselor options here */}
                </SearchableSelect>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingAppointment(null)
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={editingAppointment ? handleUpdateAppointment : handleCreateAppointment}
                className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
              >
                {editingAppointment ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
