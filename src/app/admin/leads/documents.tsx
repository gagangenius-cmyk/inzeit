'use client';

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrmcForumLeads } from '@/models';

interface DocumentWizardProps {
  leadId: number;
  onDocumentsUploaded: (documentIds: number[]) => void;
}

interface UploadedDocument {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  created: string;
  updated: string;
  status: string;
  url: string;
}

export default function DocumentWizard({ leadId, onDocumentsUploaded }: DocumentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [documentData, setDocumentData] = useState({
    leadId: leadId,
    documents: [] as File[],
    categories: [] as string[],
    descriptions: [] as string[],
    tags: [] as string[],
    sendEmail: false,
    emailRecipient: ''
  });

  const [leads, setLeads] = useState<CrmcForumLeads[]>([]);
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [existingDocuments, setExistingDocuments] = useState<UploadedDocument[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Load lead data
        setLead(null);

    // Load existing documents
    const databaseDocuments: UploadedDocument[] = []
    setExistingDocuments([]);
    setLoading(false);
  }, [leadId]);

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (field: string, value: any) => {
    setDocumentData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocumentData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files],
      categories: [...prev.categories, ...Array(files.length).fill('')],
      descriptions: [...prev.descriptions, ...Array(files.length).fill('')],
      tags: [...prev.tags, ...Array(files.length).fill('')]
    }));
  };

  const removeFile = (index: number) => {
    setDocumentData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
      categories: prev.categories.filter((_, i) => i !== index),
      descriptions: prev.descriptions.filter((_, i) => i !== index),
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleDocumentChange = (index: number, field: string, value: string) => {
    const newCategories = [...documentData.categories];
    const newDescriptions = [...documentData.descriptions];
    const newTags = [...documentData.tags];

    if (field === 'category') {
      newCategories[index] = value;
    } else if (field === 'description') {
      newDescriptions[index] = value;
    } else if (field === 'tags') {
      newTags[index] = value;
    }

    setDocumentData(prev => ({
      ...prev,
      categories: newCategories,
      descriptions: newDescriptions,
      tags: newTags
    }));
  };

  const uploadDocuments = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Add files to FormData
      documentData.documents.forEach((file, index) => {
        formData.append(`file_${index}`, file);
        formData.append(`category_${index}`, documentData.categories[index]);
        formData.append(`description_${index}`, documentData.descriptions[index]);
        formData.append(`tags_${index}`, documentData.tags[index]);
      });

      formData.append('leadId', documentData.leadId.toString());
      formData.append('sendEmail', documentData.sendEmail.toString());
      formData.append('emailRecipient', documentData.emailRecipient);

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const response = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onDocumentsUploaded(result.documentIds);
        setCurrentStep(3); // Success step
      } else {
        throw new Error('Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      window.toast.error('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const renderStep = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={stepVariants}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <motion.h2
                className="text-2xl font-bold text-gray-900"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Step 1: Upload Documents
              </motion.h2>

              {/* Lead Information */}
              {lead && (
                <motion.div
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Client Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {lead.fname} {lead.lname}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {lead.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {lead.phone}
                    </div>
                    <div>
                      <span className="font-medium">Country:</span> {lead.nationality}
                    </div>
                    <div>
                      <span className="font-medium">Program:</span> {lead.service_interest}
                    </div>
                    <div>
                      <span className="font-medium">Source:</span> {lead.market_source}
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                className="bg-white rounded-lg shadow p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Documents (Multiple files allowed)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Click to upload or drag and drop
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        PDF, DOC, DOCX, JPG, PNG up to 10MB each
                      </span>
                    </label>
                  </div>
                </div>

                {documentData.documents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Selected Files</h3>
                    {documentData.documents.map((file, index) => (
                      <motion.div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <svg className="w-8 h-8 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-800"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <SearchableSelect
                              value={documentData.categories[index]}
                              onChange={(e) => handleDocumentChange(index, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select category</option>
                              <option value="passport">Passport</option>
                              <option value="education">Education</option>
                              <option value="experience">Experience</option>
                              <option value="ielts">IELTS</option>
                              <option value="medical">Medical</option>
                              <option value="pcc">PCC</option>
                              <option value="other">Other</option>
                            </SearchableSelect>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={documentData.descriptions[index]}
                              onChange={(e) => handleDocumentChange(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Brief description"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                            <input
                              type="text"
                              value={documentData.tags[index]}
                              onChange={(e) => handleDocumentChange(index, 'tags', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="tag1, tag2"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleNext}
                  disabled={documentData.documents.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  whileHover={{ scale: documentData.documents.length > 0 ? 1.05 : 1 }}
                  whileTap={{ scale: documentData.documents.length > 0 ? 0.95 : 1 }}
                >
                  Next Step
                </motion.button>
              </motion.div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <motion.h2
                className="text-2xl font-bold text-gray-900"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Step 2: Upload Options
              </motion.h2>
              <motion.div
                className="bg-white rounded-lg shadow p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Summary</h3>
                    <div className="space-y-2">
                      {documentData.documents.map((file, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{file.name}</span>
                          <span className="text-gray-500">{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-medium border-t pt-2">
                        <span>Total Files:</span>
                        <span>{documentData.documents.length}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Options</h3>
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={documentData.sendEmail}
                            onChange={(e) => handleInputChange('sendEmail', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Send email notification</span>
                        </label>
                      </motion.div>
                      {documentData.sendEmail && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Recipient</label>
                          <input
                            type="email"
                            value={documentData.emailRecipient}
                            onChange={(e) => handleInputChange('emailRecipient', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Recipient email"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
              <div className="flex justify-between">
                <motion.button
                  onClick={handlePrevious}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Previous
                </motion.button>
                <motion.button
                  onClick={uploadDocuments}
                  disabled={isUploading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  whileHover={{ scale: !isUploading ? 1.05 : 1 }}
                  whileTap={{ scale: !isUploading ? 0.95 : 1 }}
                >
                  {isUploading ? 'Uploading...' : 'Upload Documents'}
                </motion.button>
              </div>

              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-2">{uploadProgress}% Complete</p>
                </motion.div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <motion.div
                className="bg-green-50 border border-green-200 rounded-lg p-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-green-800">
                    <motion.svg
                      className="w-16 h-16 mx-auto mb-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">Documents Uploaded Successfully!</h3>
                  <p className="text-green-700 mb-4">
                    {documentData.documents.length} documents uploaded
                  </p>
                  <p className="text-green-700 mb-4">
                    Your documents have been uploaded and are being processed.
                  </p>
                </motion.div>
                <motion.div
                  className="flex justify-center space-x-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    onClick={() => setCurrentStep(1)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Upload More
                  </motion.button>
                  <motion.button
                    onClick={() => window.close()}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Close
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <motion.h1
              className="text-3xl font-bold text-gray-900"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Document Upload
            </motion.h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Lead ID: #{leadId}</span>
              <motion.button
                onClick={() => window.close()}
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1, rotate: 90 }}
                transition={{ type: "spring" }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex space-x-2">
                {[1, 2, 3].map((step) => (
                  <motion.div
                    key={step}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                      }`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring" }}
                  >
                    {step}
                  </motion.div>
                ))}
              </div>
              <motion.div
                className="text-sm text-gray-600"
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Step {currentStep} of 3
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg p-6">
            {renderStep()}
          </div>

          {/* Existing Documents */}
          {existingDocuments.length > 0 && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Uploaded Documents</h3>
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload Date
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
                    {existingDocuments.map((doc: any, index) => (
                      <motion.tr
                        key={doc.id}
                        className="hover:bg-gray-50"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doc.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatFileSize(doc.size)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{doc.uploadDate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                            doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {doc.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <motion.button
                            className="text-blue-600 hover:text-blue-800 mr-2"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            View
                          </motion.button>
                          <motion.button
                            className="text-gray-600 hover:text-gray-800 mr-2"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            Download
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}



