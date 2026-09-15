import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type User } from '@/lib/auth';
import { HRJoiningExitService } from '@/services/hr-joining-exit-service';

type Context = { params: Promise<{ path: string[] }> };
const bodyOf = async (request: NextRequest) => request.json().catch(() => ({})) as Promise<Record<string, unknown>>;
const currentUser = (request: NextRequest): User | null => {
  const token = request.cookies.get('auth-token')?.value || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return token ? verifyToken(token) : null;
};
// Gate on actual granted permissions, not a role-name-string guess — the
// previous role()-based isDos/isDosOrManager matched 'branch manager' and
// 'director of sales', but modulePermissions.ts's rolePermissionMatrix gives
// both of those roles zero hr.* permissions (hrModule: 'No Access'), so this
// let a Branch Manager/DOS terminate employees and approve/reject exits with
// no HR permission at all. It also silently excluded Super Admin, whose
// normalized type is 'super admin' and matched none of the listed strings.
const hasPermission = (user: User | null, perms: string[]) => Boolean(
  user && (user.permissions?.includes('all') || perms.some((p) => user.permissions?.includes(p)))
);
const isHr = (user: User | null) => hasPermission(user, ['hr.view', 'hr.create', 'hr.update', 'hr.delete', 'hr.payroll', 'hr.eosb', 'hr.config']);
const isDos = (user: User | null) => hasPermission(user, ['admin.access']);
const isDosOrManager = (user: User | null) => hasPermission(user, ['hr.update', 'hr.delete', 'admin.access']);
const forbidden = () => NextResponse.json({ error: 'You are not authorized for this HR workflow action' }, { status: 403 });
const missing = () => NextResponse.json({ error: 'Record not found' }, { status: 404 });

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const user = currentUser(request); if (!user) return forbidden();
    const path = (await params).path;
    const url = new URL(request.url);
    if (path.join('/') === 'recruitment/candidates') {
      if (!isHr(user)) return forbidden();
      const status = url.searchParams.get('status') || undefined;
      const applied_position = url.searchParams.get('applied_position') || undefined;
      return NextResponse.json({ candidates: await HRJoiningExitService.listCandidates({ status, applied_position }) });
    }
    if (path[0] === 'recruitment' && path[1] === 'candidates' && path[2]) { if (!isHr(user)) return forbidden(); const candidate = await HRJoiningExitService.getCandidate(path[2]); return candidate ? NextResponse.json({ candidate }) : missing(); }
    if (path.join('/') === 'recruitment/pipeline') { if (!isHr(user)) return forbidden(); return NextResponse.json(await HRJoiningExitService.pipeline()); }
    if (path.join('/') === 'exit/requests') {
      if (!isHr(user)) return forbidden();
      const status = url.searchParams.get('status') || undefined;
      const exit_type = url.searchParams.get('exit_type') || undefined;
      return NextResponse.json({ requests: await HRJoiningExitService.listExits({ status, exit_type }) });
    }
    if (path[0] === 'exit' && path[1] === 'requests' && path[2]) { if (!isHr(user)) return forbidden(); const exitRequest = await HRJoiningExitService.getExit(path[2]); return exitRequest ? NextResponse.json({ request: exitRequest }) : missing(); }
    // An employee may see their own final-settlement (F&F/EOSB) summary; anyone else needs HR access.
    if (path[0] === 'exit' && path[1] === 'fnf' && path[2]) { if (!isHr(user) && String(user.id) !== String(path[2])) return forbidden(); const fnf = await HRJoiningExitService.getFnfSummary(path[2]); return fnf ? NextResponse.json({ fnf }) : missing(); }
    // Self-service: any authenticated employee may check their own resignation status.
    if (path.join('/') === 'exit/my-status') { const exitRequest = await HRJoiningExitService.getMyLatestExit(String(user.id)); return NextResponse.json({ request: exitRequest }); }
    return NextResponse.json({ error: 'Unknown HR workflow endpoint' }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load HR workflow' }, { status: 500 }); }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const path = (await params).path; const body = await bodyOf(request); const user = currentUser(request);
    const joined = path.join('/');
    if (joined === 'recruitment/candidates') { if (!user || !isHr(user)) return forbidden(); const full_name = String(body.full_name || '').trim(), email = String(body.email || '').trim(), applied_position = String(body.applied_position || '').trim(); if (!full_name || !email || !applied_position) return NextResponse.json({ error: 'full_name, email and applied_position are required' }, { status: 400 }); return NextResponse.json({ candidate: await HRJoiningExitService.createCandidate({ full_name, email, applied_position, phone: body.phone ? String(body.phone) : undefined, source: body.source ? String(body.source) : undefined, applied_date: body.applied_date ? String(body.applied_date) : undefined, created_by: String(user.id) }) }, { status: 201 }); }
    if (path[0] === 'recruitment' && path[1] === 'candidates' && path[2] && path[3] === 'offer') { if (!user || !isHr(user)) return forbidden(); const candidate = await HRJoiningExitService.submitOffer(path[2], body); return candidate ? NextResponse.json({ candidate, message: 'Offer submitted to Director of Sales for approval' }) : missing(); }
    if (path[0] === 'recruitment' && path[1] === 'candidates' && path[2] && path[3] === 'accept') { const candidate = await HRJoiningExitService.acceptOffer(path[2], String(body.token || '')); return candidate ? NextResponse.json({ candidate, message: 'Offer accepted' }) : NextResponse.json({ error: 'Invalid offer acceptance link' }, { status: 400 }); }
    if (path[0] === 'recruitment' && path[1] === 'onboard' && path[2]) { if (!user || !isHr(user)) return forbidden(); const candidate = await HRJoiningExitService.onboardCandidate(path[2], body); return candidate ? NextResponse.json({ candidate, message: 'Candidate onboarded and welcome notification queued' }) : missing(); }
    // A resignation is always self-filed — employee_id must be the submitter's
    // own id, never a client-supplied one, or any logged-in user could submit
    // a fabricated resignation attributed to a colleague.
    if (joined === 'exit/resign') { if (!user) return forbidden(); const employee_id = String(user.id); const reason = String(body.reason_category || body.reason || '').trim(); if (!reason) return NextResponse.json({ error: 'reason is required' }, { status: 400 }); return NextResponse.json({ request: await HRJoiningExitService.createExit({ employee_id, submitted_by: String(user.id), reason, requested_lwd: body.requested_lwd ? String(body.requested_lwd) : undefined, notice_period_days: body.notice_period_days ? Number(body.notice_period_days) : undefined, reason_category: body.reason_category ? String(body.reason_category) : undefined, additional_comments: body.additional_comments ? String(body.additional_comments) : undefined, branch_snapshot: body.branch_snapshot ? String(body.branch_snapshot) : undefined, notes: body.notes ? String(body.notes) : undefined }, 'Resignation') }, { status: 201 }); }
    if (path[0] === 'exit' && path[1] === 'terminate' && path[2]) { if (!user || !isDosOrManager(user)) return forbidden(); const reason = String(body.reason || '').trim(); if (!reason) return NextResponse.json({ error: 'reason is required' }, { status: 400 }); return NextResponse.json({ request: await HRJoiningExitService.createExit({ employee_id: path[2], submitted_by: String(user.id), reason, requested_lwd: body.requested_lwd ? String(body.requested_lwd) : undefined, notes: body.notes ? String(body.notes) : undefined }, 'Termination') }, { status: 201 }); }
    if (path[0] === 'exit' && path[1] === 'interview' && path[2]) { if (!user || !isHr(user)) return forbidden(); const exitRequestId = String(path[2] || body.exit_request_id || ''); if (!exitRequestId) return NextResponse.json({ error: 'exit_request_id is required' }, { status: 400 }); const result = await HRJoiningExitService.completeExit(exitRequestId, body.exit_interview_id ? String(body.exit_interview_id) : undefined); return result ? NextResponse.json({ request: result, message: 'Exit completed and F&F notification queued' }) : missing(); }
    return NextResponse.json({ error: 'Unknown HR workflow endpoint' }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to process HR workflow' }, { status: 400 }); }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = currentUser(request); const path = (await params).path; const body = await bodyOf(request); if (!user) return forbidden();
    if (path[0] === 'recruitment' && path[1] === 'candidates' && path[2] && path[3] === 'status') { if (!isHr(user)) return forbidden(); const candidate = await HRJoiningExitService.updateCandidateStatus(path[2], body); return candidate ? NextResponse.json({ candidate }) : missing(); }
    if (path[0] === 'recruitment' && path[1] === 'candidates' && path[2] && path[3] === 'offer' && path[4] === 'approve') { if (!isDos(user)) return forbidden(); const result = await HRJoiningExitService.approveOffer(path[2], String(user.id)); return result ? NextResponse.json({ ...result, message: 'Offer approved and candidate notification queued' }) : missing(); }
    if (path[0] === 'exit' && path[1] && (path[2] === 'approve' || path[2] === 'reject')) { if (!isDosOrManager(user)) return forbidden(); const exitRequest = await HRJoiningExitService.reviewExit(path[1], path[2] === 'approve', String(user.id), body.approved_lwd ? String(body.approved_lwd) : undefined, body.notes ? String(body.notes) : undefined); return exitRequest ? NextResponse.json({ request: exitRequest }) : missing(); }
    // Self-service: an employee may withdraw their own resignation before HR acknowledges it.
    if (path[0] === 'exit' && path[1] && path[2] === 'withdraw') {
      try {
        const exitRequest = await HRJoiningExitService.withdrawExit(path[1], String(user.id));
        return exitRequest ? NextResponse.json({ request: exitRequest }) : missing();
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to withdraw resignation' }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Unknown HR workflow endpoint' }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update HR workflow' }, { status: 400 }); }
}
