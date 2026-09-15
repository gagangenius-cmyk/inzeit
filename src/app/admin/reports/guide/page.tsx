'use client';

import { useState, useEffect } from 'react';
import ReportGeneratorGuide from '@/components/guides/ReportGeneratorGuide';

export default function ReportGuidePage() {
  return (
    <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Report Generator Guide</h1>
            <p className="text-gray-600 mt-2">Complete guide to creating and exporting performance reports</p>
          </div>
          <ReportGeneratorGuide />
        </div>
  );
}
