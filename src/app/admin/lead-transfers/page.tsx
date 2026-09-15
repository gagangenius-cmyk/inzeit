'use client';

import { useState, useEffect } from 'react';
import LeadTransferManager from '@/components/transfer/LeadTransferManager';

export default function LeadTransfersPage() {
  return (
    <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Lead Transfer Requests</h1>
            <p className="text-gray-600 mt-1">Counselor requests for lead transfers to branch managers with approval workflow</p>
          </div>
          <LeadTransferManager />
        </div>
  );
}
