'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useCallback, useEffect } from 'react'
import { uploadFileToBlob } from '@/lib/uploadToBlob'

interface DocumentFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'completed' | 'error'
  progress: number
  url?: string
  error?: string
  uploadedAt?: Date
  category: string
  description?: string
  required: boolean
}

interface DocumentCategory {
  id: string
  name: string
  description: string
  required: boolean
  acceptedTypes: string[]
  maxFileSize: number // in MB
  maxFiles: number
}

interface DocumentUploadProps {
  opportunityId?: string
  clientId?: string
  onDocumentsChange?: (documents: DocumentFile[]) => void
  showProgress?: boolean
  allowMultiple?: boolean
  categories?: DocumentCategory[]
}

// SVG Icons
const CloudArrowUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const defaultCategories: DocumentCategory[] = [
  {
    id: 'passport',
    name: 'Passport',
    description: 'Clear copy of passport bio page',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize: 5,
    maxFiles: 1
  },
  {
    id: 'photograph',
    name: 'Photograph',
    description: 'Recent passport-sized photograph',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png'],
    maxFileSize: 2,
    maxFiles: 1
  },
  {
    id: 'education',
    name: 'Education Documents',
    description: 'Academic certificates and transcripts',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize: 10,
    maxFiles: 5
  },
  {
    id: 'experience',
    name: 'Experience Letters',
    description: 'Work experience certificates',
    required: false,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize: 10,
    maxFiles: 5
  },
  {
    id: 'ielts',
    name: 'IELTS Certificate',
    description: 'English language proficiency test result',
    required: false,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize: 5,
    maxFiles: 1
  },
  {
    id: 'bank_statement',
    name: 'Bank Statement',
    description: 'Recent bank statement for financial proof',
    required: false,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    maxFileSize: 5,
    maxFiles: 3
  },
  {
    id: 'other',
    name: 'Other Documents',
    description: 'Any additional supporting documents',
    required: false,
    acceptedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxFileSize: 10,
    maxFiles: 10
  }
]

export default function DocumentUpload({
  opportunityId,
  clientId,
  onDocumentsChange,
  showProgress = true,
  allowMultiple = true,
  categories = defaultCategories
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '')
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!opportunityId) return

    const loadDocuments = async () => {
      try {
        const response = await fetch(`/api/opportunity-documents?opportunityId=${encodeURIComponent(opportunityId)}`)
        if (!response.ok) return
        const existingDocuments = await response.json()
        const mappedDocuments: DocumentFile[] = existingDocuments.map((doc: any) => ({
          id: String(doc.id),
          name: doc.documentName || doc.fileName,
          size: Number(doc.fileSize || 0),
          type: doc.mimeType || '',
          status: doc.status === 'rejected' ? 'error' : 'completed',
          progress: 100,
          url: doc.filePath,
          uploadedAt: doc.uploadDate ? new Date(doc.uploadDate) : undefined,
          category: doc.category || doc.documentType || 'other',
          description: doc.notes || '',
          required: Boolean(doc.required)
        }))
        setDocuments(mappedDocuments)
        onDocumentsChange?.(mappedDocuments)
      } catch (error) {
        console.error('Failed to load opportunity documents:', error)
      }
    }

    loadDocuments()
  }, [opportunityId, onDocumentsChange])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File, category: DocumentCategory): string | null => {
    // Check file type
    if (!category.acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted types: ${category.acceptedTypes.map(type => type.split('/')[1]).join(', ')}`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > category.maxFileSize) {
      return `File size exceeds limit. Maximum size: ${category.maxFileSize}MB`
    }

    // Check max files limit
    const categoryDocs = documents.filter(doc => doc.category === category.id)
    if (categoryDocs.length >= category.maxFiles) {
      return `Maximum files limit reached. Maximum: ${category.maxFiles} files`
    }

    return null
  }

  const uploadFile = useCallback(async (file: File, category: DocumentCategory) => {
    const validationError = validateFile(file, category)
    if (validationError) {
      const errorDoc: DocumentFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'error',
        progress: 0,
        error: validationError,
        category: category.id,
        required: category.required
      }
      setDocuments(prev => [...prev, errorDoc])
      return
    }

    const newDoc: DocumentFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      category: category.id,
      required: category.required
    }

    setDocuments(prev => [...prev, newDoc])
    setUploading(true)

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const blob = await uploadFileToBlob(
        file,
        `opportunity-documents/${opportunityId || 'unassigned'}/${category.id}/${Date.now()}_${safeName}`,
        (percentage) => {
          setDocuments(prev => prev.map(doc =>
            doc.id === newDoc.id
              ? { ...doc, progress: Math.min(90, Math.round(percentage)) }
              : doc
          ))
        },
      )

      const response = await fetch('/api/opportunity-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opportunityId || null,
          documentType: category.id,
          documentName: file.name,
          fileName: safeName,
          filePath: blob.url,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          category: category.id,
          status: 'uploaded',
          required: category.required,
          uploadedBy: 1,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Upload failed')
      }

      const savedDocument = await response.json()

      const uploadedDoc: DocumentFile = {
        ...newDoc,
        id: String(savedDocument.id || newDoc.id),
        status: 'completed',
        progress: 100,
        url: savedDocument.filePath || '',
        uploadedAt: savedDocument.uploadDate ? new Date(savedDocument.uploadDate) : new Date()
      }

      setDocuments(prev => {
        const next = prev.map(doc => doc.id === newDoc.id ? uploadedDoc : doc)
        onDocumentsChange?.(next)
        return next
      })

    } catch (error: any) {
      setDocuments(prev => prev.map(doc => 
        doc.id === newDoc.id 
          ? { ...doc, status: 'error', error: error.message || 'Upload failed. Please try again.' }
          : doc
      ))
    } finally {
      setUploading(false)
    }
  }, [opportunityId, clientId, documents])

  const handleFiles = useCallback((files: FileList) => {
    const category = categories.find(cat => cat.id === selectedCategory)
    if (!category) return

    Array.from(files).forEach(file => {
      uploadFile(file, category)
    })
  }, [selectedCategory, categories, uploadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const retryUpload = (doc: DocumentFile) => {
    // Find the original file and retry upload
    // In a real implementation, you'd need to store the file reference
    setDocuments(prev => prev.map(d => 
      d.id === doc.id 
        ? { ...d, status: 'uploading', progress: 0, error: undefined }
        : d
    ))
  }

  const getDocumentIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <DocumentIcon className="h-8 w-8 text-green-500" />
    } else if (type === 'application/pdf') {
      return <DocumentIcon className="h-8 w-8 text-red-500" />
    } else {
      return <DocumentIcon className="h-8 w-8 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'uploading':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return null
    }
  }

  const getCategoryDocuments = (categoryId: string) => {
    return documents.filter(doc => doc.category === categoryId)
  }

  const isCategoryComplete = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category || !category.required) return true
    
    const categoryDocs = getCategoryDocuments(categoryId)
    return categoryDocs.some(doc => doc.status === 'completed')
  }

  const getOverallProgress = () => {
    if (documents.length === 0) return 0
    const completedDocs = documents.filter(doc => doc.status === 'completed').length
    return (completedDocs / documents.length) * 100
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      {showProgress && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Document Upload Progress</h3>
            <span className="text-sm text-gray-500">
              {documents.filter(doc => doc.status === 'completed').length} / {documents.length} uploaded
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getOverallProgress()}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Document Category
          </label>
          <SearchableSelect
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} {category.required && '*'}
              </option>
            ))}
          </SearchableSelect>
          {categories.find(cat => cat.id === selectedCategory)?.description && (
            <p className="mt-1 text-sm text-gray-500">
              {categories.find(cat => cat.id === selectedCategory)?.description}
            </p>
          )}
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Drop files here or click to upload
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                {categories.find(cat => cat.id === selectedCategory)?.acceptedTypes.map(type => type.split('/')[1]).join(', ')} up to {categories.find(cat => cat.id === selectedCategory)?.maxFileSize}MB
              </span>
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              multiple={allowMultiple}
              accept={categories.find(cat => cat.id === selectedCategory)?.acceptedTypes.join(',')}
              onChange={handleFileInput}
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      {/* Document Categories */}
      <div className="space-y-4">
        {categories.map(category => {
          const categoryDocs = getCategoryDocuments(category.id)
          const isComplete = isCategoryComplete(category.id)

          return (
            <div key={category.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h4 className="text-lg font-medium text-gray-900">
                    {category.name}
                    {category.required && <span className="text-red-500 ml-1">*</span>}
                  </h4>
                  {isComplete && (
                    <CheckCircleIcon className="ml-2 h-5 w-5 text-green-500" />
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {categoryDocs.length} / {category.maxFiles} files
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{category.description}</p>

              {categoryDocs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm">No documents uploaded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getDocumentIcon(doc.type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(doc.size)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {doc.status === 'uploading' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${doc.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{doc.progress}%</span>
                          </div>
                        )}

                        {doc.status === 'error' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-red-500">{doc.error}</span>
                            <button
                              onClick={() => retryUpload(doc)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Retry
                            </button>
                          </div>
                        )}

                        {doc.status === 'completed' && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-green-500">Uploaded</span>
                            <button
                              onClick={() => window.open(doc.url, '_blank')}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </button>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          {getStatusIcon(doc.status)}
                          <button
                            onClick={() => removeDocument(doc.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Required Documents Summary */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Required Documents</h4>
        <div className="space-y-1">
          {categories.filter(cat => cat.required).map(category => {
            const isComplete = isCategoryComplete(category.id)
            return (
              <div key={category.id} className="flex items-center justify-between">
                <span className="text-sm text-yellow-700">{category.name}</span>
                {isComplete ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
