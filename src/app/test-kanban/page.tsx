'use client';

import { useState } from 'react';
import KanbanDragDrop from '@/components/leads/KanbanDragDrop';
import { Lead } from '@/types/lead';

const databaseLeads: Lead[] = []

export default function TestKanbanPage() {
  const [leads, setLeads] = useState<Lead[]>(databaseLeads);

  const handleStatusChange = (leadId: number, newStatus: string) => {
    console.log('🔄 Status Change:', leadId, newStatus);
    
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, status: newStatus }
          : lead
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Simple Kanban Drag & Drop Test
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Leads:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leads.map(lead => (
              <div key={lead.id} className="border p-3 rounded">
                <div className="font-medium">{lead.fname} {lead.lname}</div>
                <div className="text-sm text-gray-600">Status: {lead.status}</div>
                <div className="text-xs text-gray-500">ID: {lead.id}</div>
              </div>
            ))}
          </div>
        </div>

        <KanbanDragDrop leads={leads} onStatusChange={handleStatusChange} />
        
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Drag any lead card from one column to another</li>
            <li>Watch the browser console (F12) for debug messages</li>
            <li>The lead should move to the new column</li>
            <li>The status should update in the Current Leads section above</li>
          </ol>
          
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Expected Console Output:</h3>
            <code className="text-sm text-blue-600">
              🎯 Simple Drag Start: lead-id lead-name current-status<br/>
              🎯 Simple Drag Enter: Not Interested<br/>
              🎯 Simple Drop: Not Interested<br/>
              🎯 Simple Calling Status Change: lead-id Not Interested<br/>
              🔄 Status Change: lead-id Not Interested
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}


