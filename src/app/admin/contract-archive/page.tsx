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
  Search,
  Trash2,
  Upload,
  Settings,
  Archive,
  Calendar,
  RefreshCw,
  Database,
  HardDrive,
  ShieldCheck,
  SortAsc,
  SortDesc,
  Grid,
  List,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  Presentation
} from 'lucide-react'

interface ArchivedContract {
  id: string
  contractNumber: string
  contractTitle: string
  contractType: string
  clientName: string
  clientEmail: string
  clientPhone: string
  companyName?: string
  serviceType: string
  serviceFee: number
  currency: string
  language: 'english' | 'arabic' | 'bilingual'
  status: 'archived' | 'expired' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  archivedAt: string
  expiresAt?: string
  signedAt?: string
  pdfUrl?: string
  previewUrl?: string
  fileSize: number
  fileFormat: string
  pageCount: number
  archiveReason: string
  retentionPeriod: string
  deleteDate?: string
  accessLevel: 'public' | 'restricted' | 'confidential'
  tags: string[]
  category: string
  subcategory: string
  version: string
  relatedContracts: string[]
  attachments: Array<{
    id: string
    name: string
    type: string
    size: number
    url: string
    uploadedAt: string
  }>
  metadata: {
    documentId: string
    checksum: string
    encryption: boolean
    compression: boolean
    backup: boolean
    lastAccessed?: string
    accessCount: number
    downloadCount: number
  }
  compliance: {
    gdprCompliant: boolean
    dataRetention: boolean
    auditTrail: boolean
    encryptionRequired: boolean
    accessLog: boolean
  }
}

export default function ContractArchivePage() {
  const [contracts, setContracts] = useState<ArchivedContract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accessFilter, setAccessFilter] = useState('all')
  const [sortBy, setSortBy] = useState('archivedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  useEffect(() => {
    fetchContracts()
  }, [searchTerm, statusFilter, categoryFilter, accessFilter, sortBy, sortOrder])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const databaseContracts: ArchivedContract[] = []
      // Apply filters
      let filteredContracts: any[] = []

      if (searchTerm) {
        filteredContracts = filteredContracts.filter(contract =>
          contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.contractTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }

      if (statusFilter !== 'all') {
        filteredContracts = filteredContracts.filter(contract => contract.status === statusFilter)
      }

      if (categoryFilter !== 'all') {
        filteredContracts = filteredContracts.filter(contract => contract.category === categoryFilter)
      }

      if (accessFilter !== 'all') {
        filteredContracts = filteredContracts.filter(contract => contract.accessLevel === accessFilter)
      }

      // Apply sorting
      filteredContracts.sort((a, b) => {
        const aValue = a[sortBy as keyof ArchivedContract]
        const bValue = b[sortBy as keyof ArchivedContract]

        if (aValue === undefined || bValue === undefined) return 0

        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1

        return sortOrder === 'asc' ? comparison : -comparison
      })

      setContracts(filteredContracts)
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (status) {
      case 'archived':
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Archived</Badge>
      case 'expired':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Expired</Badge>
      case 'completed':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Completed</Badge>
      case 'cancelled':
        return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}>Cancelled</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const getAccessLevelBadge = (level: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (level) {
      case 'public':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Public</Badge>
      case 'restricted':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Restricted</Badge>
      case 'confidential':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Confidential</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const getFileIcon = (format: string) => {
    switch (format.toUpperCase()) {
      case 'PDF':
        return <FileText className="h-5 w-5" />
      case 'DOC':
      case 'DOCX':
        return <FileText className="h-5 w-5" />
      case 'XLS':
      case 'XLSX':
        return <FileSpreadsheet className="h-5 w-5" />
      case 'PPT':
      case 'PPTX':
        return <Presentation className="h-5 w-5" />
      case 'JPG':
      case 'JPEG':
      case 'PNG':
      case 'GIF':
      case 'SVG':
        return <FileImage className="h-5 w-5" />
      case 'MP4':
        return <FileVideo className="h-5 w-5" />
      case 'MP3':
      case 'WAV':
        return <FileAudio className="h-5 w-5" />
      case 'ZIP':
      case 'RAR':
      case '7Z':
        return <Archive className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const handleSelectContract = (contractId: string) => {
    setSelectedContracts(prev =>
      prev.includes(contractId)
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    )
  }

  const handleSelectAll = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([])
    } else {
      setSelectedContracts(contracts.map(c => c.id))
    }
  }

  const handleBulkAction = (action: string) => {
    window.toast.warning(`Performing ${action} on ${selectedContracts.length} contracts`)
  }

  const handleDownload = (contract: ArchivedContract) => {
    window.toast.info(`Downloading contract: ${contract.contractNumber}`)
  }

  const handlePreview = (contract: ArchivedContract) => {
    window.toast.info(`Previewing contract: ${contract.contractNumber}`)
  }

  const handleRestore = (contract: ArchivedContract) => {
    window.toast.info(`Restoring contract: ${contract.contractNumber}`)
  }

  const handleDelete = (contract: ArchivedContract) => {
    window.toast.info(`Deleting contract: ${contract.contractNumber}`)
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
            <h1 className="text-3xl font-bold text-gray-900">Contract Archive</h1>
            <p className="text-gray-600">Manage archived contracts and document retention</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Storage Info
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Archive Settings
            </Button>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Archive Contract
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Archive className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Archived</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <HardDrive className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatFileSize(contracts.reduce((sum, c) => sum + c.fileSize, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Retention Period</p>
                  <p className="text-2xl font-bold text-gray-900">5.2 Years</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShieldCheck className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Compliance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">98.5%</p>
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
                  placeholder="Search archived contracts..."
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
                <option value="archived">Archived</option>
                <option value="expired">Expired</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </SearchableSelect>

              <SearchableSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Business Immigration">Business Immigration</option>
                <option value="Student Visa">Student Visa</option>
                <option value="Work Permit">Work Permit</option>
                <option value="Family Sponsorship">Family Sponsorship</option>
              </SearchableSelect>

              <SearchableSelect
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Access Levels</option>
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
                <option value="confidential">Confidential</option>
              </SearchableSelect>

              <SearchableSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="archivedAt">Archive Date</option>
                <option value="contractNumber">Contract Number</option>
                <option value="clientName">Client Name</option>
                <option value="serviceFee">Service Fee</option>
                <option value="fileSize">File Size</option>
              </SearchableSelect>

              <Button variant="outline" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>

              <Button variant="outline" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedContracts.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {selectedContracts.length} contracts selected
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedContracts.length === contracts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('download')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('restore')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contracts List/Grid */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedContracts.includes(contract.id)}
                        onChange={() => handleSelectContract(contract.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg text-blue-600">
                        {getFileIcon(contract.fileFormat)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{contract.contractNumber}</CardTitle>
                        <p className="text-sm text-gray-500">{contract.contractTitle} - {contract.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(contract.status)}
                      {getAccessLevelBadge(contract.accessLevel)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Contract Details</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Type:</strong> {contract.contractType}</p>
                        <p><strong>Service:</strong> {contract.serviceType}</p>
                        <p><strong>Fee:</strong> {formatCurrency(contract.serviceFee, contract.currency)}</p>
                        <p><strong>Language:</strong> {contract.language}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Archive Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Archived:</strong> {new Date(contract.archivedAt).toLocaleDateString()}</p>
                        <p><strong>Reason:</strong> {contract.archiveReason}</p>
                        <p><strong>Retention:</strong> {contract.retentionPeriod}</p>
                        {contract.deleteDate && (
                          <p><strong>Delete:</strong> {new Date(contract.deleteDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">File Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Format:</strong> {contract.fileFormat}</p>
                        <p><strong>Size:</strong> {formatFileSize(contract.fileSize)}</p>
                        <p><strong>Pages:</strong> {contract.pageCount}</p>
                        <p><strong>Version:</strong> {contract.version}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Security & Compliance</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Encryption:</strong> {contract.metadata.encryption ? 'Yes' : 'No'}</p>
                        <p><strong>Backup:</strong> {contract.metadata.backup ? 'Yes' : 'No'}</p>
                        <p><strong>Access Count:</strong> {contract.metadata.accessCount}</p>
                        <p><strong>Download Count:</strong> {contract.metadata.downloadCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Tags:</span> {contract.tags.join(', ')}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Attachments:</span> {contract.attachments.length}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Last Accessed:</span> {contract.metadata.lastAccessed ? new Date(contract.metadata.lastAccessed).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handlePreview(contract)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(contract)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleRestore(contract)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(contract)}>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedContracts.includes(contract.id)}
                        onChange={() => handleSelectContract(contract.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg text-blue-600">
                        {getFileIcon(contract.fileFormat)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(contract.status)}
                      {getAccessLevelBadge(contract.accessLevel)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{contract.contractNumber}</h3>
                      <p className="text-sm text-gray-500">{contract.clientName}</p>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Type:</strong> {contract.contractType}</p>
                      <p><strong>Archived:</strong> {new Date(contract.archivedAt).toLocaleDateString()}</p>
                      <p><strong>Size:</strong> {formatFileSize(contract.fileSize)}</p>
                      <p><strong>Retention:</strong> {contract.retentionPeriod}</p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {contract.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-800 text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contract.tags.length > 3 && (
                        <Badge className="bg-gray-100 text-gray-800 text-xs">
                          +{contract.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(contract)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(contract)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {contracts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No archived contracts found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}



