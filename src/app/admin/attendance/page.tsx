'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Retired: attendance is now tracked exclusively in crm_hr_attendance_records via
// /admin/hr/attendance-management (this page's old crm_employee_attendance table was
// migrated into it - see migrations/20260729_hr_attendance_consolidation.sql - and is kept
// only as a historical archive). Any bookmark/link to this route lands here and forwards on.
export default function AttendanceManagement() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/hr/attendance-management');
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center text-slate-500">
      Redirecting to Attendance Management…
    </div>
  );
}
