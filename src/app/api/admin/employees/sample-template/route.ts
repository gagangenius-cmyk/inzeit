import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  const ws = XLSX.utils.json_to_sheet([
    {
      Name: 'John Doe',
      Email: 'john.doe@example.com',
      'Company Email': 'john.doe@dm-consultants.com',
      Mobile: '971500000000',
      'Company Mobile': '971500000001',
      Username: 'john.doe',
      Password: 'ChangeMe@123',
      'Employee ID': 'EMP001',
      Department: 'Sales',
      'Role ID': '',
      'Branch ID': '',
      'Region ID': '',
      Status: 'Active',
      'Date of Birth': '1990-01-15',
      'Date of Joining': '2026-08-01',
      Nationality: 'UAE',
      Gender: 'Male',
      'Passport No': 'P1234567',
      'Visa Expiry': '2028-08-01',
      Address: 'Dubai, UAE',
      'Work Location': 'Onshore',
      'Work Country': 'UAE',
      'Work City': 'Dubai',
      'Work Site': 'Head Office',
      'Employment Type': 'Full-time',
    },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="employee-sample-template.xlsx"',
    },
  });
}
