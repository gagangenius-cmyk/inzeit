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
  Save,
  Globe,
  Languages,
  Search,
  Filter,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart,
  PieChart,
  BookOpen,
  FileDown,
  Upload,
  Settings
} from 'lucide-react'

interface ContractContent {
  id: string
  title: string
  description: string
  category: 'header' | 'terms' | 'conditions' | 'clauses' | 'signatures' | 'footer'
  language: 'english' | 'arabic' | 'bilingual'
  content: {
    english?: string
    arabic?: string
  }
  variables: Array<{
    name: string
    type: string
    required: boolean
    defaultValue?: string
  }>
  usageCount: number
  lastUpdated: string
  status: 'active' | 'draft' | 'archived'
  contracts: string[]
}

export default function ContractContentPage() {
  const [contents, setContents] = useState<ContractContent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedContent, setSelectedContent] = useState<ContractContent | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchContents()
  }, [searchTerm, categoryFilter, languageFilter, statusFilter])

  const fetchContents = async () => {
    setLoading(true)
    try {
      const databaseContents: ContractContent[] = []
      // Apply filters
      let filteredContents: any[] = []

      if (searchTerm) {
        filteredContents = filteredContents.filter(content =>
          content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          content.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (categoryFilter !== 'all') {
        filteredContents = filteredContents.filter(content => content.category === categoryFilter)
      }

      if (languageFilter !== 'all') {
        filteredContents = filteredContents.filter(content => content.language === languageFilter)
      }

      if (statusFilter !== 'all') {
        filteredContents = filteredContents.filter(content => content.status === statusFilter)
      }

      setContents(filteredContents)
    } catch (error) {
      console.error('Error fetching contents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryBadge = (category: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (category) {
      case 'header':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>Header</Badge>
      case 'terms':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Terms</Badge>
      case 'conditions':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Conditions</Badge>
      case 'clauses':
        return <Badge className={`${baseClasses} bg-purple-100 text-purple-800`}>Clauses</Badge>
      case 'signatures':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Signatures</Badge>
      case 'footer':
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Footer</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const getLanguageBadge = (language: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (language) {
      case 'english':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>English</Badge>
      case 'arabic':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Arabic</Badge>
      case 'bilingual':
        return <Badge className={`${baseClasses} bg-purple-100 text-purple-800`}>Bilingual</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (status) {
      case 'active':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Active</Badge>
      case 'draft':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Draft</Badge>
      case 'archived':
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Archived</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const handleEdit = (content: ContractContent) => {
    setSelectedContent(content)
    setIsEditing(true)
  }

  const handleSave = () => {
    window.toast.info('Saving content...')
    setIsEditing(false)
    setSelectedContent(null)
  }

  const handlePreview = (content: ContractContent) => {
    window.toast.info(`Previewing content: ${content.title}`)
  }

  const handleDuplicate = (content: ContractContent) => {
    window.toast.info(`Duplicating content: ${content.title}`)
  }

  const handleDelete = (content: ContractContent) => {
    window.toast.info(`Deleting content: ${content.title}`)
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
            <h1 className="text-3xl font-bold text-gray-900">Contract Content Management</h1>
            <p className="text-gray-600">Manage bilingual contract content and templates</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Content
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Content
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Content</p>
                  <p className="text-2xl font-bold text-gray-900">{contents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Languages className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Bilingual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contents.filter(c => c.language === 'bilingual').length}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {contents.reduce((sum, c) => sum + c.usageCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contents.filter(c => c.status === 'active').length}
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
                  placeholder="Search content..."
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
                <option value="header">Header</option>
                <option value="terms">Terms</option>
                <option value="conditions">Conditions</option>
                <option value="clauses">Clauses</option>
                <option value="signatures">Signatures</option>
                <option value="footer">Footer</option>
              </SearchableSelect>

              <SearchableSelect
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Languages</option>
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
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </SearchableSelect>

              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content List */}
        <div className="space-y-4">
          {contents.map((content) => (
            <Card key={content.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                      <p className="text-sm text-gray-500">{content.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getCategoryBadge(content.category)}
                    {getLanguageBadge(content.language)}
                    {getStatusBadge(content.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Content Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Variables:</strong> {content.variables.length}</p>
                      <p><strong>Usage:</strong> {content.usageCount} times</p>
                      <p><strong>Contracts:</strong> {content.contracts.length}</p>
                      <p><strong>Updated:</strong> {new Date(content.lastUpdated).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Languages</h4>
                    <div className="space-y-1">
                      {content.content.english && (
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800 text-xs">English</Badge>
                          <span className="text-sm text-gray-600">Available</span>
                        </div>
                      )}
                      {content.content.arabic && (
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-red-100 text-red-800 text-xs">Arabic</Badge>
                          <span className="text-sm text-gray-600">Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Variables</h4>
                    <div className="text-sm text-gray-600">
                      {content.variables.slice(0, 3).map((variable, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="font-medium">{variable.name}</span>
                          <Badge className="bg-gray-100 text-gray-800 text-xs">{variable.type}</Badge>
                          {variable.required && <span className="text-red-500">*</span>}
                        </div>
                      ))}
                      {content.variables.length > 3 && (
                        <p className="text-xs text-gray-500">+{content.variables.length - 3} more</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Used in contracts:</span> {content.contracts.join(', ')}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(content)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDuplicate(content)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(content)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(content)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {contents.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No contract content found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}



