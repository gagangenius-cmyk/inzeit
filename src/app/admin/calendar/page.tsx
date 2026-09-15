'use client';

import { useState, useEffect } from 'react';
import CalendarView from '@/components/calendar/CalendarView';

export default function CalendarPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-2">Manage your schedule and create events with reference images</p>
      </div>
      <CalendarView />
    </div>
  );
}
