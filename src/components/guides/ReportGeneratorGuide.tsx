'use client';

import { useState } from 'react';
import {
  FileText, Download, BarChart3, Calendar, Users, Target,
  ChevronRight, CheckCircle, AlertCircle, Info, Settings,
  ArrowRight, ExternalLink, BookOpen, Play, Save, Eye
} from 'lucide-react';

export default function ReportGeneratorGuide() {
  const [activeStep, setActiveStep] = useState(1);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const steps = [
    {
      id: 1,
      title: 'Access Report Generator',
      description: 'Navigate to the report generator interface',
      icon: <ExternalLink className="w-5 h-5" />,
      path: '/admin/reports/generator',
      action: 'Navigate to URL'
    },
    {
      id: 2,
      title: 'Configure Report',
      description: 'Set up report parameters and sections',
      icon: <Settings className="w-5 h-5" />,
      path: '/admin/reports/generator',
      action: 'Configure report'
    },
    {
      id: 3,
      title: 'Generate Report',
      description: 'Create comprehensive performance report',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/admin/reports/generator',
      action: 'Generate report'
    },
    {
      id: 4,
      title: 'Export Data',
      description: 'Download reports in multiple formats',
      icon: <Download className="w-5 h-5" />,
      path: '/admin/reports/generator',
      action: 'Export report'
    },
    {
      id: 5,
      title: 'Save Templates',
      description: 'Create reusable report configurations',
      icon: <Save className="w-5 h-5" />,
      path: '/admin/reports/generator',
      action: 'Save template'
    },
    {
      id: 6,
      title: 'API Integration',
      description: 'Use API for programmatic report generation',
      icon: <Users className="w-5 h-5" />,
      path: '/api/reports/generate',
      action: 'API integration'
    }
  ];

  const formatCode = (code: string) => {
    return code.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  const apiExamples = [
    {
      title: 'Generate Report via API',
      code: `POST /api/reports/generate
Content-Type: application/json

{
  "config": {
    "name": "Weekly Performance Report",
    "description": "Comprehensive weekly performance analysis",
    "period": "weekly",
    "startDate": "2024-01-01",
    "endDate": "2024-01-07",
    "counselors": [1, 2, 3, 4],
    "includeCharts": true,
    "includeDetails": true,
    "includeTrends": true,
    "format": "pdf",
    "sections": {
      "summary": true,
      "performance": true,
      "activities": true,
      "revenue": true,
      "issues": true,
      "trends": true,
      "recommendations": true
    }
  }
}`,
      description: 'Generate a comprehensive weekly performance report'
    },
    {
      title: 'Get Report Templates',
      code: `GET /api/reports/generate?action=templates`,
      description: 'Retrieve available report templates'
    },
    {
      title: 'Generate Preview',
      code: `GET /api/reports/generate?action=preview`,
      description: 'Generate preview data for report configuration'
    }
  ];

  const exportFormats = [
    {
      format: 'PDF',
      description: 'Professional formatted report with charts and visualizations',
      useCase: 'Executive summaries, board reports, client presentations',
      filename: 'weekly-performance-report-2024-01-07.pdf'
    },
    {
      format: 'Excel',
      description: 'Spreadsheet with multiple sheets and calculated columns',
      useCase: 'Data analysis, custom calculations, pivot tables',
      filename: 'weekly-performance-report-2024-01-07.xlsx'
    },
    {
      format: 'CSV',
      description: 'Comma-separated values for data analysis',
      useCase: 'Data import, statistical analysis, database import',
      filename: 'weekly-performance-report-2024-01-07.csv'
    },
    {
      format: 'JSON',
      description: 'Structured data format for API integration',
      useCase: 'API consumption, data integration, machine learning',
      filename: 'weekly-performance-report-2024-01-07.json'
    }
  ];

  const reportSections = [
    {
      name: 'Executive Summary',
      description: 'Key metrics and overview statistics',
      includes: ['Total activities', 'Average conversion rate', 'Total revenue', 'Response times']
    },
    {
      name: 'Performance Metrics',
      description: 'Detailed counselor performance analysis',
      includes: ['Individual counselor metrics', 'Conversion rates', 'Response times', 'Efficiency scores']
    },
    {
      name: 'Activity Tracking',
      description: 'Comprehensive activity logs and details',
      includes: ['Activity timeline', 'Action types', 'Outcomes', 'Duration tracking']
    },
    {
      name: 'Revenue Analysis',
      description: 'Revenue tracking and breakdown',
      includes: ['Revenue by counselor', 'Revenue by source', 'Revenue trends', 'Revenue projections']
    },
    {
      name: 'Issues & Alerts',
      description: 'Performance issues and recommendations',
      includes: ['Performance issues', 'Workload alerts', 'Failed tasks', 'Risk assessment']
    },
    {
      name: 'Trend Analysis',
      description: 'Performance trends over time',
      includes: ['Daily trends', 'Weekly patterns', 'Monthly comparisons', 'Yearly overview']
    },
    {
      name: 'Recommendations',
      description: 'Actionable insights and improvements',
      includes: ['Performance improvements', 'Workload optimization', 'Training needs', 'Process improvements']
    }
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getStepIcon = (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    return step?.icon || <Info className="w-5 h-5" />;
  };

  const getStepColor = (stepId: number) => {
    if (stepId < activeStep) return 'text-green-600 bg-green-100';
    if (stepId === activeStep) return 'text-blue-600 bg-blue-100';
    return 'text-gray-400 bg-gray-100';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Report Generator Guide</h1>
            <p className="text-gray-600 mt-1">Complete guide to creating and exporting performance reports</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveStep(1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Guide
            </button>
            <button
              onClick={() => window.open('/admin/reports/generator', '_blank')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Generator
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(step.id)}`}>
                  {getStepIcon(step.id)}
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">{step.title}</h3>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-400 mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Access Report Generator */}
          {activeStep === 1 && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mr-4">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Step 1: Access Report Generator</h3>
                  <p className="text-blue-700">Navigate to the report generator interface</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">How to Access:</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <span>Navigate to <code className="bg-gray-100 px-2 py-1 rounded">/admin/reports/generator</code></span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <span>Or use the "Open Generator" button above</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <span>Ensure you're logged in with appropriate permissions</span>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">What You'll See:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Report configuration panel</li>
                    <li>Live preview section</li>
                    <li>Export options</li>
                    <li>Template management</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Configure Report */}
          {activeStep === 2 && (
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center mr-4">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900">Step 2: Configure Report</h3>
                  <p className="text-yellow-700">Set up report parameters and sections</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Configuration Options:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <strong>Report Name:</strong> Customizable report title</li>
                    <li>• <strong>Period:</strong> Daily, weekly, monthly, quarterly, yearly, or custom</li>
                    <li>• <strong>Date Range:</strong> Select start and end dates</li>
                    <li>• <strong>Counselors:</strong> Choose specific counselors or all</li>
                    <li>• <strong>Sections:</strong> Include/exclude report sections</li>
                    <li>• <strong>Format:</strong> PDF, Excel, CSV, or JSON</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Best Practices:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Use descriptive report names</li>
                    <li>• Choose appropriate time periods</li>
                    <li>• Include relevant sections for your audience</li>
                    <li>• Select counselors based on reporting needs</li>
                    <li>• Choose format based on intended use</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Generate Report */}
          {activeStep === 3 && (
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mr-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Step 3: Generate Report</h3>
                  <p className="text-green-700">Create comprehensive performance report</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Generation Process:</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <span>Click "Generate Report" button</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <span>System processes data and calculations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <span>Report is generated and ready for preview</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <span>Preview appears in real-time</span>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">What's Included:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Data Analysis:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Performance metrics calculation</li>
                        <li>• Trend analysis</li>
                        <li>• Issue detection</li>
                        <li>• Recommendation generation</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Visual Elements:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Color-coded performance indicators</li>
                        <li>• Progress bars and charts</li>
                        <li>• Status icons and badges</li>
                        <li>• Interactive sections</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Export Data */}
          {activeStep === 4 && (
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mr-4">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Step 4: Export Data</h3>
                  <p className="text-purple-700">Download reports in multiple formats</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Export Formats:</h4>
                  <div className="space-y-3">
                    {exportFormats.map((format, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{format.format}</h5>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {format.filename}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{format.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          <strong>Best for:</strong> {format.useCase}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Export Process:</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <span>Click "Export Report" dropdown</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <span>Select desired format</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <span>File downloads automatically</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <span>File is saved to your downloads</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Save Templates */}
          {activeStep === 5 && (
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center mr-4">
                  <Save className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Step 5: Save Templates</h3>
                  <p className="text-orange-700">Create reusable report configurations</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Template Benefits:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <strong>Time Savings:</strong> Quick setup for recurring reports</li>
                    <li>• <strong>Consistency:</strong> Standardized report formats</li>
                    <li>• <strong>Efficiency:</strong> One-click report generation</li>
                    <li> <strong>Collaboration:</strong> Share templates with team</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">How to Save:</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <span>Configure your report settings</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <span>Click "Save Config" button</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <span>Enter template name and description</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <span>Template is saved for future use</span>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Template Management:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Load saved templates quickly</li>
                    <li>• Edit existing templates</li>
                    <li>• Delete unwanted templates</li>
                    <li>• Share templates with team members</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: API Integration */}
          {activeStep === 6 && (
            <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-indigo-900">Step 6: API Integration</h3>
                  <p className="text-indigo-700">Use API for programmatic report generation</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">API Endpoints:</h4>
                  <div className="space-y-3">
                    {apiExamples.map((example, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">{example.title}</h5>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                          <code>{formatCode(example.code)}</code>
                        </pre>
                        <p className="text-sm text-gray-600 mt-2">{example.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Integration Examples:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <strong>Automated Reporting:</strong> Schedule regular report generation</li>
                    <li>• <strong>Dashboard Integration:</strong> Embed reports in dashboards</li>
                    <li>• <strong>Email Notifications:</strong> Send reports via email</li>
                    <li>• <strong>Third-party Systems:</strong> Integrate with external tools</li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Response Format:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <code>{formatCode(`{
  "success": true,
  "data": { ... },
  "generatedAt": "2024-01-07T10:30:00.000Z",
  "fileUrl": "/downloads/report.pdf"
}`)}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Sections Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Sections Overview</h3>
          <div className="space-y-4">
            {reportSections.map((section, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection(section.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-600 mr-3" />
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">{section.name}</h4>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedSection === section.name ? 'rotate-90' : ''
                  }`} />
                </button>
                
                {expandedSection === section.name && (
                  <div className="px-4 pb-4">
                    <div className="text-sm text-gray-700">
                      <p className="font-medium text-gray-900 mb-2">This section includes:</p>
                      <ul className="space-y-1 ml-4">
                        {section.includes.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => window.open('/admin/reports/generator', '_blank')}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Generator
            </button>
            
            <button
              onClick={() => setActiveStep(1)}
              className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Guide
            </button>
            
            <button
              onClick={() => window.open('/api/reports/generate?action=templates', '_blank')}
              className="flex items-center justify-center px-4 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)]"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              View Templates
            </button>
            
            <button
              onClick={() => window.open('/api/reports/generate?action=preview', '_blank')}
              className="flex items-center justify-center px-4 py-3 bg-[var(--cmg-blue)] text-white rounded-lg hover:bg-[var(--cmg-blue-dark)]"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview API
            </button>
          </div>
        </div>

        {/* Tips & Best Practices */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Tips & Best Practices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">📊 Report Design</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Use clear, descriptive names</li>
                <li>• Include executive summary for stakeholders</li>
                <li>• Add visual elements for better readability</li>
                <li>• Use consistent formatting throughout</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">📈 Data Quality</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Choose appropriate time periods</li>
                <li>• Include relevant counselors only</li>
                <li>• Validate data before generation</li>
                <li>• Review preview before export</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">📤 Export Management</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Choose format based on use case</li>
                <li>• Organize downloaded files properly</li>
                <li>• Version control important reports</li>
                <li>• Share with relevant stakeholders</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-900 mb-2">🔄 Automation</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Save templates for recurring reports</li>
                <li>• Use API for automated generation</li>
                <li>• Schedule regular report generation</li>
                <li>• Integrate with notification systems</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
