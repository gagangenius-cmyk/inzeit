'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// Best-effort extraction of a sortable primitive from an arbitrary table cell
// (which is often a ReactNode - a badge, a multi-line div, a button - not a
// plain string). Falls back to '' for anything it can't read text out of,
// which sorts those rows to one end rather than throwing.
function extractSortableText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractSortableText).join(' ');
  if (typeof node === 'object' && 'props' in (node as any)) {
    return extractSortableText((node as any).props?.children);
  }
  return '';
}

function compareValues(a: ReactNode, b: ReactNode): number {
  const aText = extractSortableText(a).trim();
  const bText = extractSortableText(b).trim();
  if (!aText && !bText) return 0;
  if (!aText) return 1;
  if (!bText) return -1;

  // Numeric-aware compare (strips currency symbols/commas) so "$1,200" sorts
  // as 1200, not lexicographically before "$900".
  const isNumericLike = (text: string) => text.replace(/[^0-9.,$%-]/g, '').length === text.length;
  const aNum = Number(aText.replace(/[^0-9.-]/g, ''));
  const bNum = Number(bText.replace(/[^0-9.-]/g, ''));
  if (Number.isFinite(aNum) && Number.isFinite(bNum) && isNumericLike(aText) && isNumericLike(bText)) {
    return aNum - bNum;
  }
  return aText.localeCompare(bText, undefined, { sensitivity: 'base' });
}

interface DataTableProps {
  headers: string[];
  rows: ReactNode[][];
  className?: string;
  // Column indexes that should NOT be sortable (e.g. an "Action" column of
  // buttons) - defaults to none excluded, since extractSortableText degrades
  // gracefully even for non-text cells.
  unsortableColumns?: number[];
}

/**
 * Generic table with click-to-sort column headers. Sorting is done
 * client-side against the already-rendered `rows`, so it's a drop-in
 * replacement for the DataTable previously copy-pasted (identically, with no
 * sorting) into HRModuleSuite.tsx, PROWorksModuleSuite.tsx, and
 * PROWorksDashboard.tsx - no caller needs to change how it builds rows.
 */
export function DataTable({ headers, rows, className = '', unsortableColumns = [] }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedRows = useMemo(() => {
    if (sortColumn === null) return rows;
    const withIndex = rows.map((row, index) => ({ row, index }));
    withIndex.sort((a, b) => {
      const cmp = compareValues(a.row[sortColumn], b.row[sortColumn]);
      if (cmp !== 0) return sortDirection === 'asc' ? cmp : -cmp;
      return a.index - b.index; // stable sort
    });
    return withIndex.map((entry) => entry.row);
  }, [rows, sortColumn, sortDirection]);

  const toggleSort = (columnIndex: number) => {
    if (unsortableColumns.includes(columnIndex)) return;
    if (sortColumn === columnIndex) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 bg-white ${className}`}>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header, columnIndex) => {
              const sortable = !unsortableColumns.includes(columnIndex);
              const isActive = sortColumn === columnIndex;
              return (
                <th
                  key={header}
                  onClick={sortable ? () => toggleSort(columnIndex) : undefined}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 ${sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {header}
                    {sortable && (
                      isActive
                        ? (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
                        : <ChevronsUpDown size={12} className="opacity-30" />
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-sm text-slate-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
