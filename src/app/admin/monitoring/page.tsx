'use client';

import { useState, useEffect } from 'react';
import ActivityMonitor from '@/components/monitoring/ActivityMonitor';

export default function MonitoringPage() {
  return (
    <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Activity Monitoring</h1>
            <p className="text-gray-600 mt-2">Real-time monitoring of counselor activities and performance metrics</p>
          </div>
          <ActivityMonitor />
        </div>
  );
}
