'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Globe,
  Building,
  GraduationCap,
  Briefcase,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart,
  PieChart
} from 'lucide-react'

interface ContractTemplate {
  id: string
  name: string
  description: string
  category: 'visa' | 'business' | 'education' | 'other'
  type: 'english' | 'arabic' | 'bilingual'
  country: string
  language: string[]
  status: 'active' | 'inactive' | 'draft'
  lastUpdated: string
  usageCount: number
  features: string[]
  previewUrl?: string
  downloadUrl?: string
}

export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const databaseTemplates: ContractTemplate[] = []
      // Apply filters
      let filteredTemplates: any[] = []

      if (searchTerm) {
        filteredTemplates = filteredTemplates.filter(template =>
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (categoryFilter !== 'all') {
        filteredTemplates = filteredTemplates.filter(template => template.category === categoryFilter)
      }

      if (typeFilter !== 'all') {
        filteredTemplates = filteredTemplates.filter(template => template.type === typeFilter)
      }

      if (statusFilter !== 'all') {
        filteredTemplates = filteredTemplates.filter(template => template.status === statusFilter)
      }

      setTemplates(filteredTemplates)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'visa':
        return <Badge className="bg-blue-100 text-blue-800">Visa</Badge>
      case 'business':
        return <Badge className="bg-purple-100 text-purple-800">Business</Badge>
      case 'education':
        return <Badge className="bg-green-100 text-green-800">Education</Badge>
      case 'other':
        return <Badge className="bg-gray-100 text-gray-800">Other</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">All</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'english':
        return <Badge className="bg-blue-100 text-blue-800">English</Badge>
      case 'arabic':
        return <Badge className="bg-red-100 text-red-800">Arabic</Badge>
      case 'bilingual':
        return <Badge className="bg-purple-100 text-purple-800">Bilingual</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">All</Badge>
    }
  }

  const getTemplateStats = () => {
    const activeCount = templates.filter(t => t.status === 'active').length
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0)
    const byCategory = templates.reduce((acc, template) => {
      const category = template.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalTemplates: templates.length,
      activeTemplates: activeCount,
      totalUsage: totalUsage,
      byCategory
    }
  }

  const stats = getTemplateStats()

  const handlePreview = (templateId: string) => {
    window.toast.info(`Previewing template ${templateId}`)
  }

  const handleDownload = (templateId: string) => {
    window.toast.info(`Downloading template ${templateId}`)
  }

  const handleEdit = (templateId: string) => {
    window.toast.info(`Editing template ${templateId}`)
  }

  const handleDelete = (templateId: string) => {
    window.toast.info(`Deleting template ${templateId}`)
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
            <h1 className="text-3xl font-bold text-gray-900">Contract Templates</h1>
            <p className="text-gray-600">Manage contract templates for PDF generation</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTemplates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Active Templates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeTemplates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsage.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Countries</p>
                  <div className="text-2xl font-bold text-gray-900">
                    {new Set(templates.map(t => t.country)).size}
                  </div>
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
                  placeholder="Search contract templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>

              <SearchableSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="visa">Visa</option>
                <option value="business">Business</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </SearchableSelect>

              <SearchableSelect
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="english">English</option>
                <option value="arabic">Arabic</option>
                <option value="bilingual">Bilingual</option>
              </SearchableSelect>

              <SearchableSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </SearchableSelect>

              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(template.status)}
                    {getCategoryBadge(template.category)}
                    {getTypeBadge(template.type)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-900">{template.country}</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium text-gray-900">{template.language.join(', ')}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Used {template.usageCount} times
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {template.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800">
                        {feature}
                      </Badge>
                    ))}
                    {template.features.length > 3 && (
                      <Badge className="bg-gray-100 text-gray-800">
                        +{template.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handlePreview(template.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(template.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No contract templates found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}



