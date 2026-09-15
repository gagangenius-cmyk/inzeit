'use client';

import AppointmentScheduler from '@/components/appointments/AppointmentScheduler';

export default function AppointmentsManagement() {
  const handleAppointmentSelect = (appointment: any) => {
    console.log('Selected appointment:', appointment);
    // Handle appointment selection - could open a modal or navigate to appointment details
  };

  return (
    <div className="p-6">
      <AppointmentScheduler onAppointmentSelect={handleAppointmentSelect} />
    </div>
  );
}