'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, Mail, MapPin, Calendar, DollarSign, 
  Clock, User, Building, Flag, MoreHorizontal,
  Eye, Edit, Trash2, Target
} from 'lucide-react';

interface Lead {
  id: number;
  fname: string;
  mname: string;
  lname: string;
  email: string;
  phone: string;
  mobile: string;
  nationality: string;
  address: string;
  dob: string;
  gender: string;
  id_number: string;
  id_expiry: string;
  country_interest: string;
  country_interest_label?: string;
  service_interest: string;
  service_interest_label?: string;
  market_source: string;
  market_source_label?: string;
  appointment: string;
  followup: string;
  folowuptime: string;
  followupstat: number;
  enquiry: string;
  convet: string;
  priority: string;
  status: string;
  regdate: string;
  assignTo: number;
  branch: number;
  region: number;
  payTotal: number;
  paidYet: number;
  payBalance: number;
  lead_remark: string;
  created: string;
  lead_quality: string;
  dmEmployeeByASSIGNTo?: { id: number; name: string };
  dmEmployeeByCoUNSILOR?: { id: number; name: string };
  dmBranch?: { id: number; name: string };
}

interface LeadKanbanProps {
  leads: Lead[];
  onLeadSelect?: (lead: Lead) => void;
  onConvertToOpportunity?: (leadId: number) => void;
  onEditLead?: (lead: Lead) => void;
  onDeleteLead?: (leadId: number) => void;
  onStatusChange?: (leadId: number, newStatus: string) => void;
}

const kanbanColumns = [
  { id: 'untouched', title: 'Untouched', color: 'bg-slate-50 border-slate-200' },
  { id: 'New', title: 'New', color: 'bg-blue-50 border-blue-200' },
  { id: 'Prospect', title: 'Prospect/Interested', color: 'bg-blue-50 border-blue-200' },
  { id: 'Not Interested', title: 'Not Interested', color: 'bg-gray-50 border-gray-200' },
  { id: 'DNQ', title: 'DNQ', color: 'bg-red-50 border-red-200' },
  { id: 'Not_answered', title: 'Not Answered', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'Could Not Connect', title: 'Could Not Connect/Wrong Number', color: 'bg-orange-50 border-orange-200' },
  { id: 'Call Back', title: 'Call Back', color: 'bg-purple-50 border-purple-200' },
  { id: 'Abroad Lead', title: 'Abroad Lead', color: 'bg-green-50 border-green-200' }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'bg-red-100 text-red-800 border-red-200';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getQualityColor = (quality: string) => {
  switch (quality) {
    case 'Hot': return 'bg-red-100 text-red-800 border-red-200';
    case 'Warm': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Cold': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function LeadKanban({ 
  leads, 
  onLeadSelect, 
  onConvertToOpportunity, 
  onEditLead, 
  onDeleteLead,
  onStatusChange 
}: LeadKanbanProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Group leads by status
  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => {
      const matchesStatus = lead.status === status;
      const matchesSearch = searchTerm === '' || 
        lead.fname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || !onStatusChange) return;

    const { draggableId, destination } = result;
    const leadId = parseInt(draggableId);
    const destinationColumnIndex = parseInt(destination.droppableId);
    const newStatus = kanbanColumns[destinationColumnIndex].id;

    onStatusChange(leadId, newStatus);
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">
            {lead.fname} {lead.mname} {lead.lname}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs ${getQualityColor(lead.lead_quality || 'Unknown')}`}>
              {lead.lead_quality || 'No Quality'}
            </Badge>
            <Badge className={`text-xs ${getPriorityColor(lead.priority)}`}>
              {lead.priority}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onLeadSelect && onLeadSelect(lead)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEditLead && onEditLead(lead)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDeleteLead && onDeleteLead(lead.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
          <span>{lead.phone}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
          <span className="truncate">{lead.address}</span>
        </div>
      </div>

      {/* Interest */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{lead.country_interest_label || lead.country_interest}</div>
          <div className="text-gray-600">{lead.service_interest_label || lead.service_interest}</div>
          <div className="text-xs text-gray-500 mt-1">Source: {lead.market_source_label || lead.market_source}</div>
        </div>
      </div>

      {/* Assignment */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {lead.dmEmployeeByASSIGNTo ? (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{lead.dmEmployeeByASSIGNTo.name}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500">Unassigned</span>
            )}
          </div>
          {lead.dmBranch && (
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-600">{lead.dmBranch.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Financial */}
      {lead.payBalance > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="h-3 w-3 mr-1" />
              <span>Balance: ${lead.payBalance.toLocaleString()}</span>
            </div>
            {onConvertToOpportunity && (
              <Button
                size="sm"
                onClick={() => onConvertToOpportunity(lead.id)}
                className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
              >
                <Target className="h-3 w-3 mr-1" />
                Convert
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Appointment */}
      {lead.appointment && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-blue-600">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{new Date(lead.appointment).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search leads in Kanban view..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kanbanColumns.map((column, columnIndex) => (
            <div key={column.id} className={`rounded-lg border ${column.color} min-h-[600px]`}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {getLeadsByStatus(column.id).length}
                  </Badge>
                </div>
              </div>
              
              <Droppable droppableId={columnIndex.toString()}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-4 min-h-[500px] ${
                      snapshot.isDraggingOver ? 'bg-gray-50' : ''
                    }`}
                  >
                    {getLeadsByStatus(column.id).map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`${snapshot.isDragging ? 'opacity-75' : ''}`}
                          >
                            <LeadCard lead={lead} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
