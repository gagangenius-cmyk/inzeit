'use client';

import { useState, useEffect } from 'react';
import PerformanceAnalytics from '@/components/analytics/PerformanceAnalytics';

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-gray-600 mt-2">Comprehensive analysis of counselor performance and efficiency metrics</p>
      </div>
      <PerformanceAnalytics />
    </div>
  );
}
