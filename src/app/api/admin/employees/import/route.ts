import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { HRService } from '@/services/hr-service';
import { requireAuth, isAuthError } from '@/lib/apiAuth';

const departmentMap: Record<string, number> = {
  sales: 1,
  operations: 2,
  admin: 3,
};

const getCell = (row: Record<string, unknown>, names: string[]) => {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
};

const excelDate = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const numberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const statusValue = (value: unknown) => {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return 1;
  if (['active', '1', 'yes', 'enabled'].includes(text)) return 1;
  if (['inactive', '0', 'no', 'disabled'].includes(text)) return 0;
  return 1;
};

const departmentValue = (value: unknown) => {
  const numeric = numberOrNull(value);
  if (numeric !== null) return numeric;
  return departmentMap[String(value || '').trim().toLowerCase()] || null;
};

const normalizeChoice = <T extends readonly string[]>(value: unknown, choices: T, fallback: T[number]) => {
  const text = String(value || '').trim().toLowerCase();
  return choices.find((choice) => choice.toLowerCase() === text) || fallback;
};

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['employees.manage', 'hr.create']);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    if (!body?.fileData) {
      return NextResponse.json({ error: 'Excel file data is required' }, { status: 400 });
    }

    const workbook = XLSX.read(body.fileData, { type: 'base64', cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    const created: Array<{ id?: number; name?: string }> = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const name = String(getCell(row, ['Name', 'name', 'Employee Name', 'Employee'])).trim();
      if (!name) {
        errors.push({ row: rowNumber, error: 'Name is required' });
        continue;
      }

      try {
        const workLocation = normalizeChoice(
          getCell(row, ['Work Location', 'work_location']),
          ['Onshore', 'Offshore', 'Remote-UAE', 'GCC-Branch'] as const,
          'Onshore'
        );
        const employmentType = normalizeChoice(
          getCell(row, ['Employment Type', 'employment_type']),
          ['Full-time', 'Contract', 'Freelance', 'Part-time'] as const,
          'Full-time'
        );
        const employee = await HRService.createEmployee({
          name,
          email: String(getCell(row, ['Email', 'email']) || '').trim() || null,
          cemail: String(getCell(row, ['Company Email', 'CompanyEmail', 'cemail']) || '').trim() || null,
          mobile: String(getCell(row, ['Mobile', 'mobile', 'Phone']) || '').trim() || null,
          cmobile: String(getCell(row, ['Company Mobile', 'CompanyMobile', 'cmobile']) || '').trim() || null,
          username: String(getCell(row, ['Username', 'username']) || '').trim() || null,
          password: String(getCell(row, ['Password', 'password']) || '').trim() || null,
          EID: String(getCell(row, ['Employee ID', 'EmployeeID', 'EID']) || '').trim() || null,
          department: departmentValue(getCell(row, ['Department', 'department', 'Department ID', 'DepartmentID'])),
          role: numberOrNull(getCell(row, ['Role ID', 'RoleID', 'Role', 'role'])),
          branch: numberOrNull(getCell(row, ['Branch ID', 'BranchID', 'Branch', 'branch'])),
          region: numberOrNull(getCell(row, ['Region ID', 'RegionID', 'Region', 'region'])),
          status: statusValue(getCell(row, ['Status', 'status'])),
          dob: excelDate(getCell(row, ['Date of Birth', 'DOB', 'dob'])),
          doj: excelDate(getCell(row, ['Date of Joining', 'DOJ', 'doj'])),
          nationality: String(getCell(row, ['Nationality', 'nationality']) || '').trim() || null,
          gender: String(getCell(row, ['Gender', 'gender']) || '').trim() || null,
          ppNo: String(getCell(row, ['Passport No', 'Passport Number', 'ppNo']) || '').trim() || null,
          visaExp: excelDate(getCell(row, ['Visa Expiry', 'Visa Exp', 'visaExp'])),
          address: String(getCell(row, ['Address', 'address']) || '').trim() || null,
          work_location: workLocation,
          work_country: String(getCell(row, ['Work Country', 'work_country']) || '').trim() || null,
          work_city: String(getCell(row, ['Work City', 'work_city']) || '').trim() || null,
          work_site: String(getCell(row, ['Work Site', 'work_site']) || '').trim() || null,
          employment_type: employmentType,
          wfh: workLocation === 'Onshore' ? 0 : 1,
        });
        created.push(employee as { id?: number; name?: string });
      } catch (error) {
        errors.push({ row: rowNumber, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      failed: errors.length,
      errors,
      message: `${created.length} employee${created.length === 1 ? '' : 's'} imported${errors.length ? `, ${errors.length} failed` : ''}.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import employees';
    console.error('Employee import error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
