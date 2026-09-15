'use client';

import { useState } from 'react';
import { Lead } from '@/types/lead';

interface KanbanDragDropProps {
  leads: Lead[];
  onStatusChange?: (leadId: number, newStatus: string) => void;
}

const kanbanColumns = [
  { id: 'Prospect', title: 'Prospect', color: 'bg-blue-50 border-blue-400' },
  { id: 'Not Interested', title: 'Not Interested', color: 'bg-gray-50 border-gray-400' },
  { id: 'DNQ', title: 'DNQ', color: 'bg-red-50 border-red-400' },
  { id: 'Not_answered', title: 'Not Answered', color: 'bg-yellow-50 border-yellow-400' },
  { id: 'Could Not Connect', title: 'Could Not Connect', color: 'bg-orange-50 border-orange-400' },
  { id: 'Call Back', title: 'Call Back', color: 'bg-purple-50 border-purple-400' },
  { id: 'Abroad Lead', title: 'Abroad Lead', color: 'bg-green-50 border-green-400' }
];

export default function KanbanDragDrop({ leads, onStatusChange }: KanbanDragDropProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    console.log('🎯 Simple Drag Start:', lead.id, lead.fname, lead.status);
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      leadId: lead.id,
      fromStatus: lead.status,
      leadName: `${lead.fname} ${lead.lname}`
    }));
  };

  const handleDragEnd = () => {
    console.log('🎯 Simple Drag End');
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (columnId: string) => {
    console.log('🎯 Simple Drag Enter:', columnId);
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    console.log('🎯 Simple Drag Leave');
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    console.log('🎯 Simple Drop:', toStatus);
    
    try {
      const dragData = e.dataTransfer.getData('text/plain');
      console.log('🎯 Simple Drag Data:', dragData);
      
      if (dragData && draggedLead) {
        const { leadId, fromStatus } = JSON.parse(dragData);
        console.log('🎯 Simple Parsed:', { leadId, fromStatus, toStatus });
        
        if (fromStatus !== toStatus && onStatusChange) {
          console.log('🎯 Simple Calling Status Change:', leadId, toStatus);
          onStatusChange(leadId, toStatus);
        }
      }
    } catch (error) {
      console.error('🎯 Simple Drop Error:', error);
    }
    
    setDragOverColumn(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Simple Kanban Drag & Drop Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kanbanColumns.map((column) => (
          <div
            key={column.id}
            className={`border-2 ${column.color} rounded-lg p-4 min-h-[400px] ${
              dragOverColumn === column.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <h3 className="font-bold mb-3">{column.title}</h3>
            <div className="text-sm text-gray-600 mb-3">
              {getLeadsByStatus(column.id).length} leads
            </div>
            
            {dragOverColumn === column.id && (
              <div className="bg-blue-100 text-blue-800 p-2 rounded mb-3 text-sm">
                Drop here!
              </div>
            )}
            
            <div className="space-y-2">
              {getLeadsByStatus(column.id).map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white p-3 rounded border cursor-move hover:shadow-md ${
                    draggedLead?.id === lead.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="font-medium">{lead.fname} {lead.lname}</div>
                  <div className="text-sm text-gray-600">{lead.email}</div>
                  <div className="text-xs text-gray-500">{lead.phone}</div>
                </div>
              ))}
            </div>
            
            {getLeadsByStatus(column.id).length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <div className="text-sm">No leads</div>
                <div className="text-xs">Drag leads here</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
