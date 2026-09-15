import { NextRequest, NextResponse } from 'next/server'
import { Appointments, CrmcForumLeads, CrmEmployee } from '@/models'
import { verifyToken } from '@/lib/auth'
import { isCeo } from '@/lib/roleChecks'
import { notifyUser } from '@/lib/notify'
import { ensureAppointmentRemarksColumn } from '@/lib/ensureAppointmentRemarksColumn'

// Lets the counselor/BM a cross-branch appointment was handed to confirm
// they're actually taking it, and notifies whoever assigned it once they do.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
      || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const currentUser = token ? verifyToken(token) : null
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication is required' }, { status: 401 })
    }
    await ensureAppointmentRemarksColumn()

    const { id } = await params
    const appointment = await Appointments.findByPk(id)
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const data = (appointment as any)

    if (!data.cross_branch) {
      return NextResponse.json({ error: 'This appointment does not require acknowledgement' }, { status: 400 })
    }

    // Only the person it was actually assigned to (or the CEO, as an
    // override) can confirm they're taking it - not the assigner, not
    // anyone else who happens to have access to this branch.
    const isAssignee = Number(data.counsilorid) === Number(currentUser.id)
    if (!isAssignee && !isCeo(currentUser)) {
      return NextResponse.json({ error: 'Only the assigned counselor/branch manager can acknowledge this appointment' }, { status: 403 })
    }

    // Idempotent: re-clicking (or a retried request) after it's already
    // acknowledged shouldn't re-notify the assigner a second time.
    if (!data.acknowledged) {
      await appointment.update({ acknowledged: 1, acknowledged_at: new Date() } as any)

      if (data.assigned_by) {
        const [lead, assignee] = await Promise.all([
          data.leadid ? CrmcForumLeads.findByPk(data.leadid) : Promise.resolve(null),
          CrmEmployee.findByPk(data.counsilorid),
        ]).catch(() => [null, null] as const)
        const leadName = lead ? `${(lead as any).fname || ''} ${(lead as any).lname || ''}`.trim() : ''
        const assigneeName = assignee ? (assignee as any).name : 'The assigned counselor'

        await notifyUser({
          userId: data.assigned_by,
          type: 'appointment_acknowledged',
          title: 'Cross-branch appointment acknowledged',
          message: `${assigneeName} confirmed they will attend the appointment${leadName ? ` for ${leadName}` : ''} on ${data.date} at ${String(data.appointtime).slice(0, 5)}.`,
          priority: 'medium',
          link: '/admin/appointments',
          relatedId: appointment.getDataValue('id'),
          relatedType: 'appointment',
        })
      }
    }

    const updated = await Appointments.findByPk(id, {
      include: [
        { association: 'lead', attributes: ['id', 'fname', 'lname', 'phone', 'email'] },
        { association: 'counselor', attributes: ['id', 'name'] },
      ],
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error acknowledging appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
