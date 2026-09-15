'use client';

import { useState, useEffect } from 'react';
import { useSortableData } from '@/components/ui/sortable-th';
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList';
import {
  FolderOpen, FileText, Users, Calendar, Download, Eye, 
  Search, Filter, Plus, Star, Share2, Clock, ChevronRight,
  BarChart3, TrendingUp, DollarSign, UserCheck
} from 'lucide-react';

interface Report {
  id: number;
  name: string;
  description: string;
  folder: string;
  createdBy: string;
  createdOn: string;
  subscribed: boolean;
  type?: string;
  category?: string;
}

export default function ReportsPanel() {
  const [activeCategory, setActiveCategory] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const loadSavedReports = async () => {
      try {
        const response = await fetch('/api/admin/reports?action=getSavedReports');
        if (!response.ok) throw new Error('Failed to load saved reports');
        const result = await response.json();
        setReports((result.reports || result.data || []).map((report: any, index: number) => ({
          id: Number(report.id || index + 1),
          name: report.name || report.title || 'Saved Report',
          description: report.description || '',
          folder: report.folder || 'Reports',
          createdBy: report.createdBy || report.created_by || '',
          createdOn: report.createdOn || report.createdAt || '',
          subscribed: Boolean(report.subscribed),
          type: report.type,
          category: report.category,
        })));
      } catch (error) {
        console.error('Error loading saved reports:', error);
        setReports([]);
      }
    };

    loadSavedReports();
  }, []);

  const categories = [
    { id: 'recent', name: 'Recent', icon: Clock },
    { id: 'createdByMe', name: 'Created by Me', icon: UserCheck },
    { id: 'private', name: 'Private Reports', icon: FileText },
    { id: 'public', name: 'Public Reports', icon: Users },
    { id: 'all', name: 'All Reports', icon: BarChart3 },
    { id: 'allFolders', name: 'All Folders', icon: FolderOpen },
    { id: 'myFolders', name: 'Created by Me', icon: UserCheck },
    { id: 'shared', name: 'Shared with Me', icon: Share2 },
    { id: 'favorites', name: 'All Favorites', icon: Star }
  ];

  const folders = [
    { id: 'all', name: 'All Folders' },
    { id: 'ceo', name: 'CEO' },
    { id: 'india', name: 'India Branch Manager' },
    { id: 'branch', name: 'Branch Manager Reports' },
    { id: 'finance', name: 'Finance' },
    { id: 'operations', name: 'Operations' }
  ];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || report.folder.includes(selectedFolder);
    return matchesSearch && matchesFolder;
  });

  const { sorted: sortedReports, sortKey: reportSortKey, sortDirection: reportSortDirection, toggleSort: toggleReportSort } = useSortableData(
    filteredReports,
    {
      name: (r) => r.name,
      description: (r) => r.description,
      folder: (r) => r.folder,
      createdBy: (r) => r.createdBy,
      createdOn: (r) => r.createdOn,
      subscribed: (r) => r.subscribed,
    },
  );

  const toggleSubscription = (reportId: number) => {
    setReports(reports.map(report => 
      report.id === reportId 
        ? { ...report, subscribed: !report.subscribed }
        : report
    ));
  };

  const getReportIcon = (type?: string) => {
    switch(type) {
      case 'financial': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'branch': return <Users className="w-4 h-4 text-blue-600" />;
      case 'leads': return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'program': return <FileText className="w-4 h-4 text-orange-600" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-[60vh] bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-[60vh]">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reports</h2>
            
            {/* Categories */}
            <div className="space-y-1 mb-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {category.name}
                    {activeCategory === category.id && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Folders Section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Folders</h3>
              <div className="space-y-1">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedFolder === folder.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4 mr-3" />
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <button className="w-full flex items-center px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4 mr-3" />
                New Report
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredReports.length} reports found
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>

                {/* Filter Button */}
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>

                {/* Export Button */}
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <SortButtonRow
                options={[
                  ['name', 'Report Name'],
                  ['description', 'Description'],
                  ['folder', 'Folder'],
                  ['createdBy', 'Created By'],
                  ['createdOn', 'Created On'],
                  ['subscribed', 'Subscribed'],
                ] as const}
                activeKey={reportSortKey}
                direction={reportSortDirection}
                onSort={toggleReportSort}
              />
              <RecordList isEmpty={false}>
                {sortedReports.map((report) => (
                  <RecordCard
                    key={report.id}
                    avatar={getReportIcon(report.type)}
                    avatarColorClass="from-gray-600 to-gray-400"
                    title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{report.name}</span>}
                    titleBadges={report.type ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{report.type}</span> : undefined}
                    metaItems={[{ icon: FolderOpen, text: report.folder, key: 'folder' }]}
                    stats={[
                      { label: 'Description', value: report.description || '—' },
                      { label: 'Created By', value: report.createdBy || '—' },
                      { label: 'Created On', value: report.createdOn || '—' },
                    ]}
                    extra={
                      <button
                        onClick={() => toggleSubscription(report.id)}
                        className={`mt-2 flex w-fit items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          report.subscribed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <Star className={`w-3 h-3 mr-1 ${report.subscribed ? 'fill-current' : ''}`} />
                        {report.subscribed ? 'Subscribed' : 'Subscribe'}
                      </button>
                    }
                    actions={[
                      { key: 'view', icon: Eye, label: 'View', onClick: () => {} },
                      { key: 'download', icon: Download, label: 'Download', onClick: () => {} },
                      { key: 'share', icon: Share2, label: 'Share', onClick: () => {} },
                    ]}
                  />
                ))}
              </RecordList>

              {filteredReports.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-400 w-12 h-12 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
