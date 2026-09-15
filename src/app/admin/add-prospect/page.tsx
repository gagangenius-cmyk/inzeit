'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Calendar,
  FileText,
  Upload,
  Save,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Target,
  TrendingUp,
  Activity,
  MessageSquare,
  FileUp,
  Database
} from 'lucide-react'

interface Prospect {
  id: number
  agreementNumber: string
  date: string
  oldNew: 'old' | 'new'
  noc: string
  counselorId: number
  counselorName: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  documents: Array<{
    id: number
    name: string
    uploadDate: string
    url: string
    type: string
  }>
  remarks: Array<{
    id: number
    date: string
    remark: string
    employeeId: number
    employeeName: string
  }>
  createdAt: string
  updatedAt: string
}

export default function AddProspectPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    agreementNumber: '',
    oldNew: 'new',
    noc: '',
    remark: '',
    document: null as File | null
  })

  useEffect(() => {
    fetchProspects()
  }, [searchTerm, statusFilter])

  const fetchProspects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/admin/prospects?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch prospects')
      }

      const result = await response.json()
      setProspects(result.data || [])
    } catch (error) {
      console.error('Error fetching prospects:', error)
      setProspects([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (status) {
      case 'completed':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Completed</Badge>
      case 'in_progress':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>In Progress</Badge>
      case 'pending':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</Badge>
      case 'cancelled':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Cancelled</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const getOldNewBadge = (oldNew: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (oldNew) {
      case 'new':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>New</Badge>
      case 'old':
        return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}>Old</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        document: e.target.files![0]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Create FormData for file upload
      const formDataToSubmit = new FormData()
      formDataToSubmit.append('agreementNumber', formData.agreementNumber)
      formDataToSubmit.append('oldNew', formData.oldNew)
      formDataToSubmit.append('noc', formData.noc)
      formDataToSubmit.append('remark', formData.remark)
      if (formData.document) {
        formDataToSubmit.append('document', formData.document)
      }
      
      // Real API call to add prospect
      const response = await fetch('/api/admin/prospects', {
        method: 'POST',
        body: formDataToSubmit
      })
      
      if (!response.ok) {
        throw new Error('Failed to add prospect')
      }
      
      const result = await response.json()
      console.log('Prospect added:', result)
      
      // Show success message
      window.toast.success('Prospect added successfully!')
      
      // Reset form
      setFormData({
        agreementNumber: '',
        oldNew: 'new',
        noc: '',
        remark: '',
        document: null
      })
      setShowAddForm(false)
      
      // Refresh prospects list
      fetchProspects()
    } catch (error) {
      console.error('Error adding prospect:', error)
      window.toast.error('Error adding prospect. Please try again.')
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Add Prospect</h1>
            <p className="text-gray-600">Manage and track new prospects and leads</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Prospect
            </Button>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Prospects</p>
                  <p className="text-2xl font-bold text-gray-900">{prospects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prospects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prospects.filter(p => p.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prospects.reduce((sum, p) => sum + p.documents.length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search prospects..."
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
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </SearchableSelect>

              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Prospect Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Prospect</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agreement Number
                    </label>
                    <input
                      type="text"
                      name="agreementNumber"
                      value={formData.agreementNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="AG-2024-XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <SearchableSelect
                      name="oldNew"
                      value={formData.oldNew}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="new">New</option>
                      <option value="old">Old</option>
                    </SearchableSelect>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NOC Code
                    </label>
                    <input
                      type="text"
                      name="noc"
                      value={formData.noc}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2173"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document
                    </label>
                    <input
                      type="file"
                      name="document"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    name="remark"
                    value={formData.remark}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any additional remarks..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    Add Prospect
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Prospects List */}
        <div className="space-y-4">
          {prospects.map((prospect) => (
            <Card key={prospect.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg text-blue-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{prospect.agreementNumber}</CardTitle>
                      <p className="text-sm text-gray-500">
                        NOC: {prospect.noc} • Counselor: {prospect.counselorName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getOldNewBadge(prospect.oldNew)}
                    {getStatusBadge(prospect.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Prospect Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Date:</strong> {new Date(prospect.date).toLocaleDateString()}</p>
                      <p><strong>Agreement:</strong> {prospect.agreementNumber}</p>
                      <p><strong>NOC:</strong> {prospect.noc}</p>
                      <p><strong>Counselor:</strong> {prospect.counselorName}</p>
                      <p><strong>Status:</strong> {getStatusBadge(prospect.status)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Documents</h4>
                    <div className="space-y-2">
                      {prospect.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-900">{doc.name}</span>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Remarks</h4>
                    <div className="space-y-2">
                      {prospect.remarks.slice(0, 3).map((remark) => (
                        <div key={remark.id} className="p-2 bg-gray-50 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              {new Date(remark.date).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500">{remark.employeeName}</span>
                          </div>
                          <p className="text-sm text-gray-700">{remark.remark}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Created:</span> {new Date(prospect.createdAt).toLocaleDateString()}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Updated:</span> {new Date(prospect.updatedAt).toLocaleDateString()}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Documents:</span> {prospect.documents.length}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Remarks:</span> {prospect.remarks.length}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Remark
                      </Button>
                      <Button size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {prospects.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No prospects found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
