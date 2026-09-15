import { useMemo, useState, useCallback, useEffect } from 'react';

export function useBulkSelection<T extends { id: number }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Drop selections for rows that scrolled out of the current page/filter so
  // stale ids can't be sent to a bulk action against rows no longer visible.
  useEffect(() => {
    const visibleIds = new Set(items.map((item) => item.id));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const toggleOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(items.map((item) => item.id)) : new Set());
  }, [items]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id: number) => selectedIds.has(id), [selectedIds]);

  const allSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  return { selectedIds, toggleOne, toggleAll, clear, isSelected, allSelected };
}
