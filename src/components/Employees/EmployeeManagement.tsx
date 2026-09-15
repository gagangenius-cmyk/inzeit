'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Shield
} from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
  cemail: string
  mobile: string
  cmobile: string
  photo?: string
  dob: string
  roleId: number
  vendor_id: number
  branchId: number
  regionId: number
  username: string
  status: number
  ppNo: string
  visaExp: string
  department: number
  EID: string
  doj: string
  dol: string
  nationality: string
  wfh: number
  role?: {
    id: number
    name: string
    type: string
  }
  branch?: {
    id: number
    name: string
  }
  region?: {
    id: number
    name: string
  }
}

interface EmployeeFormData {
  name: string
  email: string
  cemail: string
  mobile: string
  cmobile: string
  photo?: string
  dob: string
  role: number
  vendor_id: number
  branch: number
  region: number
  username: string
  status: number
  ppNo: string
  visaExp: string
  department: number
  EID: string
  doj: string
  nationality: string
  wfh: number
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    cemail: '',
    mobile: '',
    cmobile: '',
    photo: '',
    dob: '',
    role: 0,
    vendor_id: 0,
    branch: 0,
    region: 0,
    username: '',
    status: 1,
    ppNo: '',
    visaExp: '',
    department: 0,
    EID: '',
    doj: '',
    nationality: '',
    wfh: 0
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEmployee = async () => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowCreateForm(false)
        resetForm()
        fetchEmployees()
      }
    } catch (error) {
      console.error('Error creating employee:', error)
    }
  }

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return

    try {
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setEditingEmployee(null)
        fetchEmployees()
      }
    } catch (error) {
      console.error('Error updating employee:', error)
    }
  }

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchEmployees()
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      cemail: '',
      mobile: '',
      cmobile: '',
      photo: '',
      dob: '',
      role: 0,
      vendor_id: 0,
      branch: 0,
      region: 0,
      username: '',
      status: 1,
      ppNo: '',
      visaExp: '',
      department: 0,
      EID: '',
      doj: '',
      nationality: '',
      wfh: 0
    })
  }

  const getStatusBadge = (status: number) => {
    return status === 1 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-red-100 text-red-800">Inactive</Badge>
  }

  const getRoleBadge = (roleType: string) => {
    const roleColors: Record<string, string> = {
      'SA': 'bg-purple-100 text-purple-800',
      'DGM': 'bg-blue-100 text-blue-800',
      'GM': 'bg-indigo-100 text-indigo-800',
      'RM': 'bg-green-100 text-green-800',
      'DS': 'bg-orange-100 text-orange-800',
      'TC': 'bg-red-100 text-red-800'
    }
    const color = roleColors[roleType] || 'bg-gray-100 text-gray-800'
    return <Badge className={color}>{roleType || 'Unknown'}</Badge>
  }

  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.mobile?.includes(searchTerm)
  )

  const activeEmployees = filteredEmployees.filter(emp => emp.status === 1).length
  const inactiveEmployees = filteredEmployees.length - activeEmployees

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
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage staff and user accounts</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900">{filteredEmployees.length}</p>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-green-600">Active: {activeEmployees}</span>
              <span className="text-red-600">Inactive: {inactiveEmployees}</span>
            </div>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Employee
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
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
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                            {employee.name?.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{employee.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          {employee.email}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          {employee.mobile}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(employee.role?.type || '')}
                      <div className="text-xs text-gray-500 mt-1">
                        {employee.role?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Building className="h-3 w-3" />
                          {employee.branch?.name || 'Not Assigned'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          {employee.region?.name || 'Not Assigned'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(employee.status)}
                      {employee.wfh === 1 && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          WFH
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEmployee(employee)
                            setFormData({
                              name: employee.name,
                              email: employee.email,
                              cemail: employee.cemail,
                              mobile: employee.mobile,
                              cmobile: employee.cmobile,
                              photo: employee.photo,
                              dob: employee.dob,
                              role: employee.roleId,
                              vendor_id: employee.vendor_id,
                              branch: employee.branchId,
                              region: employee.regionId,
                              username: employee.username,
                              status: employee.status,
                              ppNo: employee.ppNo,
                              visaExp: employee.visaExp,
                              department: employee.department,
                              EID: employee.EID,
                              doj: employee.doj,
                              nationality: employee.nationality,
                              wfh: employee.wfh
                            })
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id)}
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
      {(showCreateForm || editingEmployee) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {editingEmployee ? 'Edit Employee' : 'Create Employee'}
              </h3>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Email</label>
                  <input
                    type="email"
                    value={formData.cemail}
                    onChange={(e) => setFormData({ ...formData, cemail: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Mobile</label>
                  <input
                    type="tel"
                    value={formData.cmobile}
                    onChange={(e) => setFormData({ ...formData, cmobile: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <SearchableSelect
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={0}>Select Role</option>
                    {/* Add role options here */}
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch</label>
                  <SearchableSelect
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={0}>Select Branch</option>
                    {/* Add branch options here */}
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Region</label>
                  <SearchableSelect
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={0}>Select Region</option>
                    {/* Add region options here */}
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationality</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passport Number</label>
                  <input
                    type="text"
                    value={formData.ppNo}
                    onChange={(e) => setFormData({ ...formData, ppNo: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Visa Expiry</label>
                  <input
                    type="date"
                    value={formData.visaExp}
                    onChange={(e) => setFormData({ ...formData, visaExp: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">EID</label>
                  <input
                    type="text"
                    value={formData.EID}
                    onChange={(e) => setFormData({ ...formData, EID: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Joining</label>
                  <input
                    type="date"
                    value={formData.doj}
                    onChange={(e) => setFormData({ ...formData, doj: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <SearchableSelect
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </SearchableSelect>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">WFH</label>
                  <SearchableSelect
                    value={formData.wfh}
                    onChange={(e) => setFormData({ ...formData, wfh: parseInt(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={0}>Office</option>
                    <option value={1}>Work From Home</option>
                  </SearchableSelect>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingEmployee(null)
                  resetForm()
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
                className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
              >
                {editingEmployee ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
