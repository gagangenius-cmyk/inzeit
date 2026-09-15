'use client';

import { useState, useEffect } from 'react';
import LeadReassignmentManager from '@/components/reassignment/LeadReassignmentManager';

export default function ReassignmentPage() {
  return (
    <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Lead Reassignment System</h1>
            <p className="text-gray-600 mt-2">Automatic lead reassignment based on time and activity rules</p>
          </div>
          <LeadReassignmentManager />
        </div>
  );
}
