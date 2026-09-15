'use client';

import { useState, useEffect } from 'react';
import AgreementGenerator from '@/components/agreement/AgreementGenerator';

export default function AgreementsPage() {
  return (
    <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Agreement Generator</h1>
            <p className="text-gray-600 mt-2">Create and manage agreements with PDF export capabilities</p>
          </div>
          <AgreementGenerator />
        </div>
  );
}
