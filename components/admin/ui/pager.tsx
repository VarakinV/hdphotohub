import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pager({
  page,
  totalPages,
  totalItems,
  perPage,
  onPerPageChange,
  onPrev,
  onNext,
  itemName = 'items',
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPerPageChange?: (n: number) => void;
  onPrev: () => void;
  onNext: () => void;
  itemName?: string;
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3.5 text-[12.5px] text-muted-foreground">
      <div className="flex flex-wrap items-center gap-4">
        <span>
          Showing {from}–{to} of {totalItems} {itemName}
        </span>
        {onPerPageChange && (
          <span className="flex items-center gap-1.5">
            <label htmlFor="pager-per-page">Rows:</label>
            <select
              id="pager-per-page"
              className="field w-auto py-1"
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-card text-foreground disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-1">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border bg-card text-foreground disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
