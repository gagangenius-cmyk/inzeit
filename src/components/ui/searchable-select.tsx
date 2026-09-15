'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SearchableSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
};

type SearchableSelectProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange' | 'children'
> & {
  value?: string | number | null;
  defaultValue?: string | number | null;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
};

function textFromChildren(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (React.isValidElement<{ children?: React.ReactNode }>(child)) return textFromChildren(child.props.children);
      return '';
    })
    .join('')
    .trim();
}

function optionsFromChildren(children: React.ReactNode, group?: string): SearchableSelectOption[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return [];

    const element = child as React.ReactElement<{
      value?: string | number;
      disabled?: boolean;
      label?: string;
      children?: React.ReactNode;
    }>;
    const type = typeof element.type === 'string' ? element.type.toLowerCase() : '';

    if (type === 'optgroup') {
      const groupLabel = String(element.props.label || '');
      return optionsFromChildren(element.props.children, groupLabel);
    }

    if (type !== 'option') return [];

    const label = textFromChildren(element.props.children);
    return [{
      value: element.props.value == null ? label : String(element.props.value),
      label,
      disabled: Boolean(element.props.disabled),
      group,
    }];
  });
}

export function SearchableSelect({
  value,
  defaultValue,
  name,
  required,
  disabled,
  children,
  className,
  onChange,
  ...props
}: SearchableSelectProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const hiddenInputRef = React.useRef<HTMLInputElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [internalValue, setInternalValue] = React.useState(defaultValue == null ? '' : String(defaultValue));

  const options = React.useMemo(() => optionsFromChildren(children), [children]);
  const selectedValue = value == null ? internalValue : String(value);
  const selectedOption = options.find((option) => option.value === selectedValue);
  const enabledOptions = options.filter((option) => !option.disabled);
  const filteredOptions = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => {
      return `${option.group || ''} ${option.label} ${option.value}`.toLowerCase().includes(normalized);
    });
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const emitChange = (nextValue: string) => {
    if (value == null) setInternalValue(nextValue);
    const event = {
      target: { value: nextValue, name },
      currentTarget: { value: nextValue, name },
      preventDefault: () => undefined,
      stopPropagation: () => undefined,
    } as unknown as React.ChangeEvent<HTMLSelectElement>;
    onChange?.(event);
    hiddenInputRef.current?.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const selectOption = (option: SearchableSelectOption) => {
    if (option.disabled) return;
    emitChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if ((event.key === 'Enter' || event.key === ' ') && !open) {
      event.preventDefault();
      setOpen(true);
    }
    if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const currentIndex = enabledOptions.findIndex((option) => option.value === selectedValue);
      const next = enabledOptions[Math.min(currentIndex + 1, enabledOptions.length - 1)] || enabledOptions[0];
      if (next) selectOption(next);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = enabledOptions.findIndex((option) => option.value === selectedValue);
      const next = enabledOptions[Math.max(currentIndex - 1, 0)] || enabledOptions[0];
      if (next) selectOption(next);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={handleKeyDown}
      {...props}
    >
      {name && (
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          value={selectedValue}
          data-required={required ? 'true' : undefined}
        />
      )}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-required={required ? 'true' : undefined}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
          className
        )}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selectedOption && 'text-gray-500')}>
          {selectedOption?.label || 'Select option'}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-500 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-[9999] mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div role="listbox" className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const previous = filteredOptions[index - 1];
                const showGroup = option.group && option.group !== previous?.group;
                return (
                  <React.Fragment key={`${option.group || ''}-${option.value}-${index}`}>
                    {showGroup && (
                      <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {option.group}
                      </div>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={option.value === selectedValue}
                      disabled={option.disabled}
                      onClick={() => selectOption(option)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition',
                        option.value === selectedValue ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-50',
                        option.disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent'
                      )}
                    >
                      <Check className={cn('h-4 w-4 shrink-0', option.value === selectedValue ? 'opacity-100' : 'opacity-0')} />
                      <span className="min-w-0 flex-1 truncate">{option.label || option.value}</span>
                    </button>
                  </React.Fragment>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-sm text-gray-500">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
