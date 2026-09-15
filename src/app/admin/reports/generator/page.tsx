'use client';

import { useState, useEffect } from 'react';
import PerformanceReportGenerator from '@/components/reports/PerformanceReportGenerator';

export default function ReportGeneratorPage() {
  return (
    <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Performance Report Generator</h1>
            <p className="text-gray-600 mt-2">Generate comprehensive performance reports with detailed analytics and export options</p>
          </div>
          <PerformanceReportGenerator />
        </div>
  );
}
