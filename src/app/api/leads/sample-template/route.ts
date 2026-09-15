import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  const ws = XLSX.utils.json_to_sheet([
    { Name: 'John Doe', Phone: '971500000000', Email: 'john.doe@example.com', Source: 'Referral', Country: 'Canada' },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="leads-sample-template.xlsx"',
    },
  });
}
