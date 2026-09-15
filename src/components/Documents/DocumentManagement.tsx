'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Folder,
  File
} from 'lucide-react'

interface Document {
  id: number
  leadId: number
  doc_type: string
  doc_name: string
  file_path: string
  status: number
  created: string
  created_by: number
  remarks?: string
  lead?: {
    id: number
    fname: string
    lname: string
    email: string
  }
}

interface DocumentFormData {
  leadId: number
  doc_type: string
  doc_name: string
  file_path: string
  remarks: string
  documentType: 'additional' | 'operations'
}

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [additionalDocuments, setAdditionalDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<DocumentFormData>({
    leadId: 0,
    doc_type: '',
    doc_name: '',
    file_path: '',
    remarks: '',
    documentType: 'additional'
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setAdditionalDocuments(data.additionalDocuments)
        setDocuments(data.operationsDocuments)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFormData({ ...formData, doc_name: selectedFile.name })
    }
  }

  const handleUploadDocument = async () => {
    if (!file) {
      window.toast.warning('Please select a file to upload')
      return
    }

    setUploading(true)
    try {
      // Create a simple file upload simulation
      // In a real app, you would upload to a file storage service
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      formDataToSend.append('leadId', formData.leadId.toString())
      formDataToSend.append('doc_type', formData.doc_type)
      formDataToSend.append('doc_name', formData.doc_name)
      formDataToSend.append('remarks', formData.remarks)
      formDataToSend.append('documentType', formData.documentType)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          documentType: formData.documentType
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setShowCreateForm(false)
        resetForm()
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error uploading document:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (id: number, type: 'additional' | 'operations') => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      leadId: 0,
      doc_type: '',
      doc_name: '',
      file_path: '',
      remarks: '',
      documentType: 'additional'
    })
    setFile(null)
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 1:
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 2:
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0:
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 1:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 2:
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredAdditionalDocs = additionalDocuments.filter(doc =>
    doc.lead?.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.lead?.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.doc_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.doc_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOperationsDocs = documents.filter(doc =>
    doc.lead?.fname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.lead?.lname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.doc_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.doc_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage client documents and files</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
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
                placeholder="Search documents..."
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

      {/* Additional Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Folder className="h-5 w-5 mr-2" />
            Additional Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdditionalDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.doc_name}
                          </div>
                          {doc.remarks && (
                            <div className="text-xs text-gray-500">
                              {doc.remarks}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doc.lead?.fname} {doc.lead?.lname}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doc.lead?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">{doc.doc_type}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(doc.created).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(doc.created).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id, 'additional')}
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

      {/* Operations Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Operations Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOperationsDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(doc.status)}
                        <div className="ml-2">
                          <div className="text-sm font-medium text-gray-900">
                            {doc.doc_name}
                          </div>
                          {doc.remarks && (
                            <div className="text-xs text-gray-500">
                              {doc.remarks}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {doc.lead?.fname} {doc.lead?.lname}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doc.lead?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">{doc.doc_type}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(doc.created).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(doc.created).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id, 'operations')}
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

      {/* Upload Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Upload Document
              </h3>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Document Type</label>
                <SearchableSelect
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value as 'additional' | 'operations' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="additional">Additional Document</option>
                  <option value="operations">Operations Document</option>
                </SearchableSelect>
              </div>
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
                <label className="block text-sm font-medium text-gray-700">Document Type</label>
                <input
                  type="text"
                  value={formData.doc_type}
                  onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Passport, Visa, Educational Certificate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">File</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  rows={3}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Add any remarks about this document..."
                />
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  resetForm()
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadDocument}
                disabled={uploading}
                className="mt-3 sm:mt-0 sm:ml-3 sm:w-auto"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
