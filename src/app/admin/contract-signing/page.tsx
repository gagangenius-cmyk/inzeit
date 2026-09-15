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
  RotateCw,
  Send,
  Lock,
  Unlock,
  Smartphone,
  Tablet,
  Monitor,
  Stamp,
  Key,
  Fingerprint,
  Camera,
  UploadCloud,
  History,
  Bell,
  AlertTriangle,
  Info,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react'

interface ContractSigning {
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
  status: 'draft' | 'pending_signatures' | 'partially_signed' | 'signed' | 'expired' | 'cancelled'
  createdAt: string
  updatedAt: string
  expiresAt?: string
  signedAt?: string
  pdfUrl?: string
  previewUrl?: string
  signingMethod: 'electronic' | 'digital' | 'wet_ink' | 'hybrid'
  authenticationRequired: boolean
  twoFactorEnabled: boolean
  auditTrail: boolean
  remindersEnabled: boolean
  signatories: Array<{
    id: string
    name: string
    email: string
    phone: string
    role: string
    order: number
    status: 'pending' | 'viewed' | 'signed' | 'declined' | 'bypassed'
    signedAt?: string
    signatureUrl?: string
    signatureType: 'typed' | 'drawn' | 'uploaded' | 'digital_certificate'
    ipAddress?: string
    device?: string
    location?: string
    authenticationMethod: 'email' | 'sms' | 'knowledge_based' | 'digital_certificate'
  }>
  signingFields: Array<{
    id: string
    type: 'signature' | 'initial' | 'date' | 'title' | 'company' | 'text'
    signatoryId: string
    page: number
    x: number
    y: number
    width: number
    height: number
    required: boolean
    label: string
    value?: string
  }>
  auditLog: Array<{
    id: string
    action: string
    timestamp: string
    userId: string
    userName: string
    details: string
    ipAddress: string
    device: string
    location: string
  }>
}

export default function ContractSigningPage() {
  const [contracts, setContracts] = useState<ContractSigning[]>([])
  const [selectedContract, setSelectedContract] = useState<ContractSigning | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'signing'>('list')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [signingMode, setSigningMode] = useState<'preview' | 'sign'>('preview')

  useEffect(() => {
    fetchContracts()
  }, [searchTerm, statusFilter, methodFilter])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const databaseContracts: ContractSigning[] = []
      // Apply filters
      let filteredContracts: any[] = []

      if (searchTerm) {
        filteredContracts = filteredContracts.filter(contract =>
          contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.contractTitle.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (statusFilter !== 'all') {
        filteredContracts = filteredContracts.filter(contract => contract.status === statusFilter)
      }

      if (methodFilter !== 'all') {
        filteredContracts = filteredContracts.filter(contract => contract.signingMethod === methodFilter)
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
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Draft</Badge>
      case 'pending_signatures':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending Signatures</Badge>
      case 'partially_signed':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>Partially Signed</Badge>
      case 'signed':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Signed</Badge>
      case 'expired':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Expired</Badge>
      case 'cancelled':
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Cancelled</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const getSigningMethodBadge = (method: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (method) {
      case 'electronic':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>Electronic</Badge>
      case 'digital':
        return <Badge className={`${baseClasses} bg-purple-100 text-purple-800`}>Digital Certificate</Badge>
      case 'wet_ink':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Wet Ink</Badge>
      case 'hybrid':
        return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}>Hybrid</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const getSignatoryStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (status) {
      case 'pending':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</Badge>
      case 'viewed':
        return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>Viewed</Badge>
      case 'signed':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Signed</Badge>
      case 'declined':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Declined</Badge>
      case 'bypassed':
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Bypassed</Badge>
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</Badge>
    }
  }

  const handleViewDetails = (contract: ContractSigning) => {
    setSelectedContract(contract)
    setViewMode('details')
  }

  const handleSendReminder = (contract: ContractSigning) => {
    window.toast.info(`Sending reminder for contract: ${contract.contractNumber}`)
  }

  const handleDownload = (contract: ContractSigning) => {
    window.toast.info(`Downloading contract: ${contract.contractNumber}`)
  }

  const handlePrint = (contract: ContractSigning) => {
    window.toast.info(`Printing contract: ${contract.contractNumber}`)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return 'Yesterday'
    return `${Math.floor(diffInHours / 24)} days ago`
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

  if (viewMode === 'details' && selectedContract) {
    return (
      <>
        <div className="space-y-6">
          {/* Details Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setViewMode('list')}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedContract.contractNumber}</h1>
                <p className="text-gray-600">{selectedContract.contractTitle}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(selectedContract.status)}
              {getSigningMethodBadge(selectedContract.signingMethod)}
            </div>
          </div>

          {/* Contract Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Contract Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Details</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Contract Type:</strong> {selectedContract.contractType}</p>
                        <p><strong>Service Type:</strong> {selectedContract.serviceType}</p>
                        <p><strong>Service Fee:</strong> {formatCurrency(selectedContract.serviceFee, selectedContract.currency)}</p>
                        <p><strong>Language:</strong> {selectedContract.language}</p>
                        <p><strong>Created:</strong> {new Date(selectedContract.createdAt).toLocaleDateString()}</p>
                        {selectedContract.signedAt && (
                          <p><strong>Signed:</strong> {new Date(selectedContract.signedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Client Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Name:</strong> {selectedContract.clientName}</p>
                        <p><strong>Email:</strong> {selectedContract.clientEmail}</p>
                        <p><strong>Phone:</strong> {selectedContract.clientPhone}</p>
                        {selectedContract.companyName && (
                          <p><strong>Company:</strong> {selectedContract.companyName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signatories */}
              <Card>
                <CardHeader>
                  <CardTitle>Signatories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedContract.signatories.map((signatory) => (
                      <div key={signatory.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{signatory.name}</h4>
                              <p className="text-sm text-gray-500">{signatory.role} (Order: {signatory.order})</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getSignatoryStatusBadge(signatory.status)}
                            {signatory.status === 'signed' && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {signatory.signatureType}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Email:</strong> {signatory.email}</p>
                            <p><strong>Phone:</strong> {signatory.phone}</p>
                            <p><strong>Auth Method:</strong> {signatory.authenticationMethod}</p>
                          </div>
                          <div>
                            {signatory.signedAt && (
                              <p><strong>Signed:</strong> {new Date(signatory.signedAt).toLocaleString()}</p>
                            )}
                            {signatory.ipAddress && (
                              <p><strong>IP Address:</strong> {signatory.ipAddress}</p>
                            )}
                            {signatory.device && (
                              <p><strong>Device:</strong> {signatory.device}</p>
                            )}
                            {signatory.location && (
                              <p><strong>Location:</strong> {signatory.location}</p>
                            )}
                          </div>
                        </div>
                        {signatory.signatureUrl && (
                          <div className="mt-3">
                            <img src={signatory.signatureUrl} alt="Signature" className="h-16 border border-gray-200 rounded" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Signing Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Signing Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedContract.signingFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${field.required ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm font-medium">{field.label}</span>
                          <Badge className="bg-gray-100 text-gray-800 text-xs">{field.type}</Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Page {field.page} • Position: ({field.x}, {field.y})
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Authentication Required</span>
                      {selectedContract.authenticationRequired ? (
                        <Lock className="h-4 w-4 text-green-500" />
                      ) : (
                        <Unlock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Two-Factor Authentication</span>
                      {selectedContract.twoFactorEnabled ? (
                        <Shield className="h-4 w-4 text-green-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Audit Trail</span>
                      {selectedContract.auditTrail ? (
                        <History className="h-4 w-4 text-green-500" />
                      ) : (
                        <History className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reminders Enabled</span>
                      {selectedContract.remindersEnabled ? (
                        <Bell className="h-4 w-4 text-green-500" />
                      ) : (
                        <Bell className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => handleDownload(selectedContract)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Contract
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => handlePrint(selectedContract)}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Contract
                    </Button>
                    {selectedContract.status === 'pending_signatures' && (
                      <Button variant="outline" className="w-full" onClick={() => handleSendReminder(selectedContract)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reminder
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Audit Log */}
              <Card>
                <CardHeader>
                  <CardTitle>Audit Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedContract.auditLog.map((log) => (
                      <div key={log.id} className="border-l-4 border-blue-500 pl-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{log.action}</span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(log.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{log.details}</p>
                        <p className="text-xs text-gray-500">by {log.userName} • {log.device} • {log.location}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
            <h1 className="text-3xl font-bold text-gray-900">Contract Signing</h1>
            <p className="text-gray-600">Manage electronic signatures and document signing workflows</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Contract
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Signing Request
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
                <option value="pending_signatures">Pending Signatures</option>
                <option value="partially_signed">Partially Signed</option>
                <option value="signed">Signed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </SearchableSelect>

              <SearchableSelect
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="electronic">Electronic</option>
                <option value="digital">Digital Certificate</option>
                <option value="wet_ink">Wet Ink</option>
                <option value="hybrid">Hybrid</option>
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
                      <p className="text-sm text-gray-500">{contract.contractTitle} - {contract.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(contract.status)}
                    {getSigningMethodBadge(contract.signingMethod)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Signing Progress</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Total Signatories:</strong> {contract.signatories.length}</p>
                      <p><strong>Signed:</strong> {contract.signatories.filter(s => s.status === 'signed').length}</p>
                      <p><strong>Pending:</strong> {contract.signatories.filter(s => s.status === 'pending').length}</p>
                      <p><strong>Created:</strong> {new Date(contract.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Security Features</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Authentication:</strong> {contract.authenticationRequired ? 'Required' : 'Not Required'}</p>
                      <p><strong>2FA:</strong> {contract.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                      <p><strong>Audit Trail:</strong> {contract.auditTrail ? 'Enabled' : 'Disabled'}</p>
                      <p><strong>Reminders:</strong> {contract.remindersEnabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Signing Fields:</span> {contract.signingFields.length}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Audit Entries:</span> {contract.auditLog.length}
                      <span className="mx-2">•</span>
                      <span className="font-medium">Expires:</span> {contract.expiresAt ? new Date(contract.expiresAt).toLocaleDateString() : 'No expiry'}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(contract)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(contract)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {contract.status === 'pending_signatures' && (
                        <Button size="sm" onClick={() => handleSendReminder(contract)}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reminder
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



