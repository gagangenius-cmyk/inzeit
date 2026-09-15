'use client';

import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

function compareUnknown(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  const aText = String(a);
  const bText = String(b);
  const aNum = Number(aText);
  const bNum = Number(bText);
  if (aText.trim() !== '' && bText.trim() !== '' && Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
  return aText.localeCompare(bText, undefined, { sensitivity: 'base' });
}

/**
 * Generic click-to-sort hook for hand-rolled (ad-hoc) tables that map over a
 * typed array, as opposed to the positional-array `DataTable` in
 * `./data-table.tsx`. Give it the list plus a `key => sortable value`
 * accessor per column; it returns the sorted list and the header-click
 * handler/state to wire into `<SortableTh>`.
 *
 * const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(leads, {
 *   name: (l) => `${l.fname} ${l.lname}`,
 *   createdAt: (l) => l.created,
 * });
 */
export function useSortableData<T, K extends string>(
  items: T[],
  accessors: Record<K, (item: T) => unknown>,
  initialKey: K | null = null,
  initialDirection: SortDirection = 'asc',
) {
  const [sortKey, setSortKey] = useState<K | null>(initialKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    const accessor = accessors[sortKey];
    const withIndex = items.map((item, index) => ({ item, index }));
    withIndex.sort((a, b) => {
      const cmp = compareUnknown(accessor(a.item), accessor(b.item));
      if (cmp !== 0) return sortDirection === 'asc' ? cmp : -cmp;
      return a.index - b.index; // stable sort
    });
    return withIndex.map((entry) => entry.item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sortKey, sortDirection]);

  const toggleSort = (key: K) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return { sorted, sortKey, sortDirection, toggleSort };
}

interface SortableThProps<K extends string> {
  label: string;
  sortKey: K;
  activeKey: K | null;
  direction: SortDirection;
  onSort: (key: K) => void;
  className?: string;
}

/**
 * Drop-in replacement for a plain `<th>` that adds a click-to-sort caret.
 * Defaults to the "Tailwind UI gray table" header className used across
 * most of this app's hand-rolled tables - pass `className` to override for
 * pages using a different header style.
 */
export function SortableTh<K extends string>({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
}: SortableThProps<K>) {
  const isActive = activeKey === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`cursor-pointer select-none hover:text-gray-700 ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive
          ? (direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
          : <ChevronsUpDown size={12} className="opacity-30" />}
      </span>
    </th>
  );
}
