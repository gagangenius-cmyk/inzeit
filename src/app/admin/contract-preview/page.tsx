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
  Printer,
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
  Settings,
  PenTool,
  Signature,
  Mail,
  Phone,
  Calendar,
  MapPin,
  DollarSign,
  Building,
  User,
  Shield,
  Activity,
  Timer,
  Award,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw
} from 'lucide-react'

interface ContractPreview {
  id: string
  contractNumber: string
  templateId: string
  templateName: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  businessName?: string
  businessAddress?: string
  serviceType: string
  serviceDescription: string
  serviceFee: number
  currency: string
  paymentTerms: string
  startDate: string
  endDate: string
  language: 'english' | 'arabic' | 'bilingual'
  status: 'draft' | 'ready' | 'signed' | 'expired'
  createdAt: string
  updatedAt: string
  signedAt?: string
  signedBy?: string
  pdfUrl?: string
  previewUrl?: string
  content: {
    english?: string
    arabic?: string
  }
  clauses: Array<{
    id: string
    title: string
    content: string
    type: 'standard' | 'custom' | 'legal'
    required: boolean
  }>
  signatures: Array<{
    id: string
    party: string
    name: string
    email: string
    status: 'pending' | 'signed' | 'declined'
    signedAt?: string
    signatureUrl?: string
  }>
}

export default function ContractPreviewPage() {
  const [contracts, setContracts] = useState<ContractPreview[]>([])
  const [selectedContract, setSelectedContract] = useState<ContractPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'preview'>('list')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchContracts()
  }, [searchTerm, statusFilter, languageFilter])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const databaseContracts: ContractPreview[] = []
      // Apply filters
      let filteredContracts: any[] = []

      if (searchTerm) {
        filteredContracts = filteredContracts.filter(contract =>
          contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.templateName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (statusFilter !== 'all') {
        filteredContracts = filteredContracts.filter(contract => contract.status === statusFilter)
      }

      if (languageFilter !== 'all') {
        filteredContracts = filteredContracts.filter(contract => contract.language === languageFilter)
      }

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
      case 'draft':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Draft</Badge>
      case 'ready':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>Ready</Badge>
      case 'signed':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Signed</Badge>
      case 'expired':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Expired</Badge>
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

  const handlePreview = (contract: ContractPreview) => {
    setSelectedContract(contract)
    setViewMode('preview')
    setCurrentPage(1)
    setTotalPages(3) // Mock total pages
  }

  const handleDownload = (contract: ContractPreview) => {
    window.toast.info(`Downloading contract: ${contract.contractNumber}`)
  }

  const handlePrint = (contract: ContractPreview) => {
    window.toast.info(`Printing contract: ${contract.contractNumber}`)
  }

  const handleSign = (contract: ContractPreview) => {
    window.toast.info(`Initiating signing process for: ${contract.contractNumber}`)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50))
  }

  const handleZoomReset = () => {
    setZoomLevel(100)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
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

  if (viewMode === 'preview' && selectedContract) {
    return (
      <>
        <div className="space-y-6">
          {/* Preview Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setViewMode('list')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedContract.contractNumber}</h1>
                <p className="text-gray-600">{selectedContract.templateName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{zoomLevel}%</span>
                <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleZoomReset}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={() => handlePrint(selectedContract)}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={() => handleDownload(selectedContract)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              {selectedContract.status !== 'signed' && (
                <Button onClick={() => handleSign(selectedContract)}>
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign Contract
                </Button>
              )}
            </div>
          </div>

          {/* Contract Preview */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(selectedContract.status)}
                  {getLanguageBadge(selectedContract.language)}
                </div>
              </div>
            </div>

            <div className="p-6" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
              <div className="max-w-4xl mx-auto">
                {/* Contract Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">SERVICE AGREEMENT</h1>
                  <p className="text-gray-600">Contract Number: {selectedContract.contractNumber}</p>
                  <p className="text-gray-600">Date: {new Date(selectedContract.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Parties */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">PARTIES</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">CLIENT</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Name:</strong> {selectedContract.clientName}</p>
                        <p><strong>Address:</strong> {selectedContract.clientAddress}</p>
                        <p><strong>Phone:</strong> {selectedContract.clientPhone}</p>
                        <p><strong>Email:</strong> {selectedContract.clientEmail}</p>
                      </div>
                    </div>
                    {selectedContract.businessName && (
                      <div>
                        <h3 className="font-medium text-gray-800 mb-2">BUSINESS</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Name:</strong> {selectedContract.businessName}</p>
                          <p><strong>Address:</strong> {selectedContract.businessAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">SERVICES</h2>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>Service Type:</strong> {selectedContract.serviceType}</p>
                    <p><strong>Description:</strong> {selectedContract.serviceDescription}</p>
                    <p><strong>Service Fee:</strong> {formatCurrency(selectedContract.serviceFee, selectedContract.currency)}</p>
                    <p><strong>Payment Terms:</strong> {selectedContract.paymentTerms}</p>
                    <p><strong>Duration:</strong> {new Date(selectedContract.startDate).toLocaleDateString()} - {new Date(selectedContract.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">AGREEMENT TERMS</h2>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedContract.content.english}
                  </div>
                  {selectedContract.content.arabic && (
                    <div className="text-sm text-gray-600 whitespace-pre-wrap mt-4 text-right" dir="rtl">
                      {selectedContract.content.arabic}
                    </div>
                  )}
                </div>

                {/* Clauses */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">CLAUSES</h2>
                  <div className="space-y-4">
                    {selectedContract.clauses.map((clause) => (
                      <div key={clause.id} className="border-l-4 border-blue-500 pl-4">
                        <h3 className="font-medium text-gray-800">{clause.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{clause.content}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className="bg-gray-100 text-gray-800 text-xs">{clause.type}</Badge>
                          {clause.required && <span className="text-xs text-red-500">Required</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signatures */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">SIGNATURES</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedContract.signatures.map((signature) => (
                      <div key={signature.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-800">{signature.party}</h3>
                          {getStatusBadge(signature.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Name:</strong> {signature.name}</p>
                          <p><strong>Email:</strong> {signature.email}</p>
                          {signature.signedAt && (
                            <p><strong>Signed:</strong> {new Date(signature.signedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                        {signature.signatureUrl && (
                          <div className="mt-3">
                            <img src={signature.signatureUrl} alt="Signature" className="h-12" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Contract Preview</h1>
            <p className="text-gray-600">Preview and manage contract documents</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Contract
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 md:flex-row md:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contracts..."
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
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="signed">Signed</option>
                <option value="expired">Expired</option>
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

              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Card key={contract.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{contract.contractNumber}</CardTitle>
                      <p className="text-sm text-gray-500">{contract.templateName} - {contract.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(contract.status)}
                    {getLanguageBadge(contract.language)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Service Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Type:</strong> {contract.serviceType}</p>
                      <p><strong>Fee:</strong> {formatCurrency(contract.serviceFee, contract.currency)}</p>
                      <p><strong>Duration:</strong> {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Client Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Name:</strong> {contract.clientName}</p>
                      <p><strong>Email:</strong> {contract.clientEmail}</p>
                      <p><strong>Phone:</strong> {contract.clientPhone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Status Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}</p>
                      <p><strong>Updated:</strong> {new Date(contract.updatedAt).toLocaleDateString()}</p>
                      {contract.signedAt && (
                        <p><strong>Signed:</strong> {new Date(contract.signedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Clauses:</span> {contract.clauses.length}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Signatures:</span> {contract.signatures.filter(s => s.status === 'signed').length}/{contract.signatures.length}
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
                      {contract.status !== 'signed' && (
                        <Button size="sm" onClick={() => handleSign(contract)}>
                          <PenTool className="h-4 w-4 mr-2" />
                          Sign
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {contracts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No contracts found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}



