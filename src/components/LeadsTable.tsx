
'use client'

import { useState } from 'react'
import { Lead } from '@/types/lead'

interface LeadsTableProps {
  leads: Lead[]
  onEdit?: (lead: Lead) => void
  onDelete?: (id: number) => void
}

export default function LeadsTable({ leads, onEdit, onDelete }: LeadsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<number[]>([])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(lead => lead.id))
    } else {
      setSelectedLeads([])
    }
  }

  const handleSelectLead = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, id])
    } else {
      setSelectedLeads(selectedLeads.filter(leadId => leadId !== id))
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
              <input
                type="checkbox"
                className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                onChange={(e) => handleSelectAll(e.target.checked)}
                checked={selectedLeads.length === leads.length}
              />
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Lead Information
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Service
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned To
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50">
              <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:left-6"
                  checked={selectedLeads.includes(lead.id)}
                  onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                />
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {lead.fname} {lead.lname}
                </div>
                <div className="text-sm text-gray-500">
                  ID: {lead.id}
                </div>
                <div className="text-sm text-gray-500">
                  Reg: {new Date(lead.regdate).toLocaleDateString()}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm text-gray-900">{lead.email}</div>
                <div className="text-sm text-gray-500">{lead.phone}</div>
                <div className="text-sm text-gray-500">{lead.mobile}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm text-gray-900">{lead.service_interest_label || lead.service_interest}</div>
                <div className="text-sm text-gray-500">{lead.country_interest_label || lead.country_interest}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm text-gray-900">
                  {lead.dmEmployeeByASSIGNTo?.name || 'Unassigned'}
                </div>
                <div className="text-sm text-gray-500">
                  {lead.dmBranch?.name || 'No Branch'}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(lead.status)}`}>
                  {lead.status || 'No Status'}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPriorityColor(lead.priority)}`}>
                  {lead.priority}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <button
                  onClick={() => onEdit?.(lead)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(lead.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {leads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No leads found</p>
        </div>
      )}
    </div>
  )
}
