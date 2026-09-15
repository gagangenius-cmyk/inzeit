'use client'

import { SearchableSelect } from '@/components/ui/searchable-select';
import { useState, useEffect } from 'react'
import { useSortableData } from '@/components/ui/sortable-th'
import { RecordCard, RecordList, SortButtonRow } from '@/components/shared/ResponsiveRecordList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MapPin,
  Users,
  Phone,
  Mail
} from 'lucide-react'

interface Branch {
  id: number
  name: string
  branch: string
  code: string
  address: string
  city: string
  state: string
  country: string
  phone: string
  email: string
  managerId: number
  managerName: string
  regionId: number
  regionName: string
  status: number
  createdAt: string
  employeeCount: number
}

export default function BranchListPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches')
      if (response.ok) {
        const data = await response.json()
        setBranches(data.branches)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: number) => {
    return status === 1 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-red-100 text-red-800">Inactive</Badge>
  }

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          branch.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          branch.managerName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRegion = !regionFilter || branch.regionId === parseInt(regionFilter)
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && branch.status === 1) ||
      (statusFilter === 'inactive' && branch.status === 0)
    
    return matchesSearch && matchesRegion && matchesStatus
  })

  const { sorted: sortedBranches, sortKey: branchSortKey, sortDirection: branchSortDirection, toggleSort: toggleBranchSort } = useSortableData(
    filteredBranches,
    {
      branch: (b) => b.branch,
      location: (b) => `${b.city || ''} ${b.state || ''}`,
      manager: (b) => b.managerName,
      region: (b) => b.regionName,
      employees: (b) => b.employeeCount,
      status: (b) => b.status,
    },
  )

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
            <h1 className="text-3xl font-bold text-gray-900">Branch List</h1>
            <p className="text-gray-600">Manage branch locations and information</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Branches</p>
                  <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Active Branches</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {branches.filter(b => b.status === 1).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Regions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(branches.map(b => b.regionId)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {branches.reduce((sum, b) => sum + b.employeeCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
              <SearchableSelect
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Regions</option>
                <option value="1">North</option>
                <option value="2">South</option>
                <option value="3">East</option>
                <option value="4">West</option>
              </SearchableSelect>
              <SearchableSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SearchableSelect>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Branches List */}
        <Card>
          <CardContent className="p-4">
            <SortButtonRow
              options={[
                ['branch', 'Branch'],
                ['location', 'Location'],
                ['manager', 'Manager'],
                ['region', 'Region'],
                ['employees', 'Employees'],
                ['status', 'Status'],
              ] as const}
              activeKey={branchSortKey}
              direction={branchSortDirection}
              onSort={toggleBranchSort}
            />
            <RecordList isEmpty={filteredBranches.length === 0} emptyIcon={Building} emptyTitle="No branches found">
              {sortedBranches.map((branch) => (
                <RecordCard
                  key={branch.id}
                  avatar={<Building className="h-4 w-4" />}
                  avatarColorClass="from-blue-600 to-cyan-400"
                  title={<span className="min-w-0 break-words text-base font-bold text-gray-950">{branch.branch}</span>}
                  titleBadges={
                    <>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{branch.code}</span>
                      {getStatusBadge(branch.status)}
                    </>
                  }
                  metaItems={[
                    { icon: MapPin, text: `${branch.address ? branch.address + ' — ' : ''}${branch.city || ''}${branch.city && branch.state ? ', ' : ''}${branch.state || ''}`, key: 'location' },
                    { icon: Mail, text: branch.email || '—', key: 'email' },
                  ]}
                  stats={[
                    { label: 'Manager', value: branch.managerName || '—' },
                    { label: 'Region', value: branch.regionName || '—' },
                    { label: 'Employees', value: branch.employeeCount },
                  ]}
                  actions={[
                    { key: 'edit', icon: Edit, label: 'Edit', onClick: () => {} },
                    { key: 'delete', icon: Trash2, label: 'Delete', onClick: () => {}, colorClass: 'bg-red-50 text-red-700 hover:bg-red-100' },
                  ]}
                />
              ))}
            </RecordList>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
