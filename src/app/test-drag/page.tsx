'use client';

import { useState } from 'react';
import { Lead } from '@/types/lead';

export default function TestDragPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Kanban Drag & Drop Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Drag & Drop</h2>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Test Lead Cards */}
            {['Prospect', 'Not Interested', 'Call Back'].map((status, index) => (
              <div 
                key={status}
                draggable
                onDragStart={(e) => {
                  addLog(`Drag Start: ${status}`);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', JSON.stringify({ 
                    leadId: index + 1, 
                    fromStatus: status 
                  }));
                }}
                onDragEnd={() => addLog(`Drag End: ${status}`)}
                onDragOver={(e) => {
                  e.preventDefault();
                  addLog(`Drag Over: ${status}`);
                }}
                onDragLeave={() => addLog(`Drag Leave: ${status}`)}
                onDrop={(e) => {
                  e.preventDefault();
                  const dragData = e.dataTransfer.getData('text/plain');
                  if (dragData) {
                    const { leadId, fromStatus } = JSON.parse(dragData);
                    addLog(`Drop: ${fromStatus} → ${status} (Lead ${leadId})`);
                  }
                }}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{status}</h3>
                <p className="text-sm text-gray-600">Test Lead {index + 1}</p>
                <p className="text-xs text-gray-500">Drag this card to another column</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
