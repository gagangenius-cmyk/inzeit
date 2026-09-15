import * as React from "react"

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({ isOpen: false, setIsOpen: () => {} });

const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className={`relative ${className || ''}`} ref={containerRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({ className, children }) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <svg className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);

  return <span>{value || placeholder}</span>;
};

const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  const { isOpen } = React.useContext(SelectContext);
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 mt-1 min-w-[8rem] max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
      {children}
    </div>
  );
};

const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(SelectContext);

  return (
    <div
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
      onClick={() => {
        onValueChange?.(value);
        setIsOpen(false);
      }}
    >
      {selectedValue === value && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
      <span className="ml-4">{children}</span>
    </div>
  );
};

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};
