'use client';

import { useState, useEffect } from 'react';
import CounselorActivityLogs from '@/components/counselor/CounselorActivityLogs';

export default function CounselorLogsPage() {
  return (
    <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Counselor Activity Logs</h1>
            <p className="text-gray-600 mt-2">Monitor and track all counselor activities and performance</p>
          </div>
          <CounselorActivityLogs />
        </div>
  );
}
