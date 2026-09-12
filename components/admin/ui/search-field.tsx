import { Search } from 'lucide-react';

export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  ariaLabel = 'Search',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-[220px] flex-1 items-center gap-2 rounded-[10px] border border-border bg-card px-3 py-2 text-faint ${
        className || ''
      }`}
    >
      <Search className="h-4 w-4 shrink-0" />
      <input
        type="text"
        value={value}
        aria-label={ariaLabel}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-none bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-faint"
      />
    </div>
  );
}
