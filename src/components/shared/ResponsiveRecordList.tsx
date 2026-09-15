'use client';

import { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

// Shared card-list layout replacing the `overflow-x-auto` wide-table pattern
// used across most admin list pages — modeled directly on the Leads tab's
// card design (src/components/leads/LeadManagement.tsx), which never needs a
// horizontal scrollbar because every field reflows instead of sitting in a
// fixed-width column. Each admin page supplies its own field mapping/actions;
// this only owns the shared visual language (card shell, stat-box grid,
// action buttons, loading/empty states) so 60+ pages don't reinvent it.

export interface RecordStat {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}

export interface RecordMetaItem {
  icon: LucideIcon;
  text: ReactNode;
  key?: string;
}

export interface RecordAction {
  key: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  /** Tailwind classes for the button's background/text/hover, e.g. 'bg-blue-50 text-blue-700 hover:bg-blue-100'. */
  colorClass?: string;
  hidden?: boolean;
  disabled?: boolean;
}

export interface RecordCardProps {
  /** Small badge/icon rendered in the leading avatar slot — usually initials or a LucideIcon. */
  avatar?: ReactNode;
  avatarColorClass?: string;
  title: ReactNode;
  titleBadges?: ReactNode;
  metaItems?: RecordMetaItem[];
  stats?: RecordStat[];
  /** Free-form content appended below stats — progress bars, remark boxes, payment summaries, etc. */
  extra?: ReactNode;
  actions?: RecordAction[];
  className?: string;
}

export function RecordCard({
  avatar,
  avatarColorClass = 'from-blue-600 to-cyan-400',
  title,
  titleBadges,
  metaItems,
  stats,
  extra,
  actions,
  className,
}: RecordCardProps) {
  return (
    <article className={`min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md lg:p-4 ${className || ''}`}>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 gap-3">
          {avatar !== undefined && (
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${avatarColorClass} text-sm font-black text-white shadow-sm`}>
              {avatar}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {title}
              {titleBadges}
            </div>

            {metaItems && metaItems.length > 0 && (
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 xl:grid-cols-3">
                {metaItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key ?? index} className="flex min-w-0 items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="truncate">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {stats && stats.length > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat, index) => (
                  <div key={index} className="min-w-0 rounded-md bg-gray-50 p-2">
                    <div className="font-semibold uppercase text-gray-400">{stat.label}</div>
                    <div className="mt-0.5 truncate font-semibold text-gray-900">{stat.value}</div>
                    {stat.sub && <div className="truncate text-gray-600">{stat.sub}</div>}
                  </div>
                ))}
              </div>
            )}

            {extra}
          </div>
        </div>

        {actions && actions.some((a) => !a.hidden) && (
          <div className="flex flex-wrap items-center gap-1.5 xl:max-w-[220px] xl:justify-end">
            {actions.filter((a) => !a.hidden).map((action) => {
              const Icon = action.icon;
              const cls = `inline-flex h-9 w-9 items-center justify-center rounded-md ${action.colorClass || 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${action.disabled ? 'pointer-events-none opacity-40' : ''}`;
              if (action.href && !action.disabled) {
                return (
                  <a key={action.key} href={action.href} target={action.target} rel={action.target === '_blank' ? 'noopener noreferrer' : undefined} title={action.label} className={cls}>
                    <Icon className="h-4 w-4" />
                  </a>
                );
              }
              return (
                <button key={action.key} type="button" onClick={action.onClick} title={action.label} disabled={action.disabled} className={cls}>
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

export function SortButtonRow<K extends string>({
  options,
  activeKey,
  direction,
  onSort,
}: {
  options: ReadonlyArray<readonly [K, string]>;
  activeKey: K | null;
  direction: 'asc' | 'desc';
  onSort: (key: K) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
      {options.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onSort(key)}
          className={`rounded-md border px-2.5 py-1.5 hover:bg-gray-50 ${activeKey === key ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white'}`}
        >
          {label}{activeKey === key ? (direction === 'asc' ? ' ↑' : ' ↓') : ''}
        </button>
      ))}
    </div>
  );
}

export interface RecordListProps {
  loading?: boolean;
  isEmpty?: boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  children: ReactNode;
}

/** Wraps a list of RecordCards with shared loading-skeleton and empty states. Never needs horizontal scroll — cards stack and reflow instead of sitting in fixed-width table columns. */
export function RecordList({
  loading,
  isEmpty,
  emptyIcon: EmptyIcon,
  emptyTitle = 'No records found',
  emptyDescription = 'Try changing filters or search terms.',
  children,
}: RecordListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-gray-200" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="h-3 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-center">
        <div>
          {EmptyIcon && <EmptyIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />}
          <h3 className="text-sm font-bold text-gray-900">{emptyTitle}</h3>
          <p className="mt-1 text-sm text-gray-500">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return <div className="grid grid-cols-1 gap-3">{children}</div>;
}
