'use client'

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
  Settings,
  Languages,
  FileDown
} from 'lucide-react'

interface ContractData {
  id: string
  templateId: string
  templateName: string
  clientInfo: {
    name: string
    email: string
    phone: string
    address: string
    passportNumber: string
    nationality: string
    dateOfBirth: string
  }
  businessInfo: {
    companyName: string
    businessAddress: string
    businessPhone: string
    businessEmail: string
    registrationNumber: string
    businessType: string
  }
  serviceInfo: {
    serviceType: string
    serviceDescription: string
    serviceFee: string
    currency: string
    paymentTerms: string
    duration: string
    startDate: string
    endDate: string
  }
  termsAndConditions: {
    confidentiality: boolean
    termination: boolean
    liability: boolean
    governingLaw: string
    disputeResolution: string
  }
  customClauses: Array<{
    id: string
    title: string
    content: string
    required: boolean
  }>
  status: 'draft' | 'ready' | 'generated'
  generatedAt?: string
  pdfUrl?: string
}

interface ContractTemplate {
  id: string
  name: string
  description: string
  category: string
  language: string[]
  country: string
  sections: Array<{
    id: string
    title: string
    type: 'client' | 'business' | 'service' | 'terms' | 'custom'
    required: boolean
    order: number
  }>
}

export default function ContractGeneratorPage() {
  const [contracts, setContracts] = useState<ContractData[]>([])
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [currentContract, setCurrentContract] = useState<ContractData | null>(null)
  const [activeTab, setActiveTab] = useState('template')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      setTemplates([])
      setContracts([])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setCurrentContract({
      id: Date.now().toString(),
      templateId: template.id,
      templateName: template.name,
      clientInfo: {
        name: '',
        email: '',
        phone: '',
        address: '',
        passportNumber: '',
        nationality: '',
        dateOfBirth: ''
      },
      businessInfo: {
        companyName: '',
        businessAddress: '',
        businessPhone: '',
        businessEmail: '',
        registrationNumber: '',
        businessType: ''
      },
      serviceInfo: {
        serviceType: '',
        serviceDescription: '',
        serviceFee: '',
        currency: 'CAD',
        paymentTerms: '',
        duration: '',
        startDate: '',
        endDate: ''
      },
      termsAndConditions: {
        confidentiality: true,
        termination: true,
        liability: true,
        governingLaw: 'Canadian Law',
        disputeResolution: 'Arbitration'
      },
      customClauses: [],
      status: 'draft'
    })
    setActiveTab('editor')
  }

  const handleContractUpdate = (field: string, value: any) => {
    if (!currentContract) return

    const updatedContract = { ...currentContract }
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      const parentValue = updatedContract[parent as keyof ContractData]
      
      // Only spread if the parent value is an object
      if (parentValue && typeof parentValue === 'object' && !Array.isArray(parentValue)) {
        updatedContract[parent as keyof ContractData] = {
          ...(parentValue as any),
          [child]: value
        } as any
      } else {
        // Handle case where parent is not an object
        console.warn(`Cannot set nested property on non-object field: ${parent}`)
      }
    } else {
      updatedContract[field as keyof ContractData] = value
    }

    setCurrentContract(updatedContract)
  }

  const handleGeneratePDF = async () => {
    if (!currentContract || !selectedTemplate) return

    setIsGenerating(true)
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const updatedContract = {
        ...currentContract,
        status: 'generated' as const,
        generatedAt: new Date().toISOString(),
        pdfUrl: `/contracts/generated/${selectedTemplate.id}-${currentContract.id}.pdf`
      }

      setCurrentContract(updatedContract)
      setContracts([...contracts, updatedContract])
      setActiveTab('preview')
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!currentContract?.pdfUrl) return
    window.toast.info(`Downloading PDF: ${currentContract.pdfUrl}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case 'ready':
        return <Badge className="bg-blue-100 text-blue-800">Ready</Badge>
      case 'generated':
        return <Badge className="bg-green-100 text-green-800">Generated</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
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
            <h1 className="text-3xl font-bold text-gray-900">Contract Generator</h1>
            <p className="text-gray-600">Generate custom contracts with PDF output</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Export All
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('template')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'template'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 mr-2 inline" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'editor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Edit className="h-4 w-4 mr-2 inline" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="h-4 w-4 mr-2 inline" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 mr-2 inline" />
              History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'template' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-100 text-blue-800">{template.category}</Badge>
                      <Badge className="bg-green-100 text-green-800">{template.language.join(', ')}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-sm text-gray-500 mb-4">
                    <span className="font-medium text-gray-900">{template.country}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Sections:</span> {template.sections.length}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Required:</span> {template.sections.filter(s => s.required).length}
                    </div>
                  </div>
                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleTemplateSelect(template)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                    <Button size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'editor' && currentContract && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Client Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={currentContract.clientInfo.name}
                          onChange={(e) => handleContractUpdate('clientInfo.name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={currentContract.clientInfo.email}
                          onChange={(e) => handleContractUpdate('clientInfo.email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={currentContract.clientInfo.phone}
                          onChange={(e) => handleContractUpdate('clientInfo.phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <textarea
                          value={currentContract.clientInfo.address}
                          onChange={(e) => handleContractUpdate('clientInfo.address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Service Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                        <input
                          type="text"
                          value={currentContract.serviceInfo.serviceType}
                          onChange={(e) => handleContractUpdate('serviceInfo.serviceType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={currentContract.serviceInfo.serviceDescription}
                          onChange={(e) => handleContractUpdate('serviceInfo.serviceDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Fee</label>
                        <input
                          type="text"
                          value={currentContract.serviceInfo.serviceFee}
                          onChange={(e) => handleContractUpdate('serviceInfo.serviceFee', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900">{currentContract.templateName}</h2>
                      <p className="text-sm text-gray-500">Contract Preview</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Client Information</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Name:</strong> {currentContract.clientInfo.name || 'Not specified'}</p>
                          <p><strong>Email:</strong> {currentContract.clientInfo.email || 'Not specified'}</p>
                          <p><strong>Phone:</strong> {currentContract.clientInfo.phone || 'Not specified'}</p>
                          <p><strong>Address:</strong> {currentContract.clientInfo.address || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900">Service Information</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Service Type:</strong> {currentContract.serviceInfo.serviceType || 'Not specified'}</p>
                          <p><strong>Description:</strong> {currentContract.serviceInfo.serviceDescription || 'Not specified'}</p>
                          <p><strong>Fee:</strong> {currentContract.serviceInfo.serviceFee || 'Not specified'} {currentContract.serviceInfo.currency}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={() => setActiveTab('preview')}>
                      <Eye className="h-4 w-4 mr-2" />
                      Full Preview
                    </Button>
                    <Button onClick={handleGeneratePDF} disabled={isGenerating}>
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4 mr-2" />
                          Generate PDF
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'preview' && currentContract && (
          <Card>
            <CardHeader>
              <CardTitle>Contract Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-200 rounded-lg p-8 bg-white">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">{currentContract.templateName}</h1>
                    <p className="text-gray-600">Contract Agreement</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Parties</h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-800">Client Information</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Name:</strong> {currentContract.clientInfo.name}</p>
                            <p><strong>Email:</strong> {currentContract.clientInfo.email}</p>
                            <p><strong>Phone:</strong> {currentContract.clientInfo.phone}</p>
                            <p><strong>Address:</strong> {currentContract.clientInfo.address}</p>
                            <p><strong>Passport Number:</strong> {currentContract.clientInfo.passportNumber}</p>
                            <p><strong>Nationality:</strong> {currentContract.clientInfo.nationality}</p>
                            <p><strong>Date of Birth:</strong> {currentContract.clientInfo.dateOfBirth}</p>
                          </div>
                        </div>
                        
                        {currentContract.businessInfo.companyName && (
                          <div>
                            <h3 className="font-medium text-gray-800">Business Information</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Company Name:</strong> {currentContract.businessInfo.companyName}</p>
                              <p><strong>Business Address:</strong> {currentContract.businessInfo.businessAddress}</p>
                              <p><strong>Business Phone:</strong> {currentContract.businessInfo.businessPhone}</p>
                              <p><strong>Business Email:</strong> {currentContract.businessInfo.businessEmail}</p>
                              <p><strong>Registration Number:</strong> {currentContract.businessInfo.registrationNumber}</p>
                              <p><strong>Business Type:</strong> {currentContract.businessInfo.businessType}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Service Details</h2>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Service Type:</strong> {currentContract.serviceInfo.serviceType}</p>
                        <p><strong>Description:</strong> {currentContract.serviceInfo.serviceDescription}</p>
                        <p><strong>Service Fee:</strong> {currentContract.serviceInfo.serviceFee} {currentContract.serviceInfo.currency}</p>
                        <p><strong>Payment Terms:</strong> {currentContract.serviceInfo.paymentTerms}</p>
                        <p><strong>Duration:</strong> {currentContract.serviceInfo.duration}</p>
                        <p><strong>Start Date:</strong> {currentContract.serviceInfo.startDate}</p>
                        <p><strong>End Date:</strong> {currentContract.serviceInfo.endDate}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Terms and Conditions</h2>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Confidentiality:</strong> {currentContract.termsAndConditions.confidentiality ? 'Applicable' : 'Not Applicable'}</p>
                        <p><strong>Termination:</strong> {currentContract.termsAndConditions.termination ? 'Applicable' : 'Not Applicable'}</p>
                        <p><strong>Liability:</strong> {currentContract.termsAndConditions.liability ? 'Applicable' : 'Not Applicable'}</p>
                        <p><strong>Governing Law:</strong> {currentContract.termsAndConditions.governingLaw}</p>
                        <p><strong>Dispute Resolution:</strong> {currentContract.termsAndConditions.disputeResolution}</p>
                      </div>
                    </div>
                    
                    {currentContract.customClauses.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Custom Clauses</h2>
                        <div className="space-y-3">
                          {currentContract.customClauses.map((clause) => (
                            <div key={clause.id} className="border-l-4 border-blue-500 pl-4">
                              <h3 className="font-medium text-gray-800">{clause.title}</h3>
                              <p className="text-sm text-gray-600">{clause.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>Contract Generation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{contract.templateName}</h3>
                      <p className="text-sm text-gray-500">Client: {contract.clientInfo.name}</p>
                      <p className="text-sm text-gray-500">Generated: {contract.generatedAt ? new Date(contract.generatedAt).toLocaleString() : 'Not generated'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(contract.status)}
                      {contract.pdfUrl && (
                        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

