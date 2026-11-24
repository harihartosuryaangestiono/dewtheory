'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';

interface VirtualTableProps<T> {
  items: T[];
  rowHeight?: number;
  containerHeight?: number;
  renderHeader: () => React.ReactNode;
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function VirtualTable<T>({
  items,
  rowHeight = 54,
  containerHeight = 620,
  renderHeader,
  renderRow,
  emptyMessage = 'Tidak ada data ditemukan.',
  className = '',
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const total = items.length;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const overscan = 12;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(total, Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, i) => ({
      item,
      actualIndex: startIndex + i,
    }));
  }, [items, startIndex, endIndex]);

  const topOffset = startIndex * rowHeight;
  const bottomOffset = Math.max(0, (total - endIndex) * rowHeight);

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm ${className}`}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ maxHeight: `${containerHeight}px`, overflowY: 'auto' }}
        className="w-full overflow-x-auto relative"
      >
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/95 backdrop-blur text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800 shadow-sm">
            {renderHeader()}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {total === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              <>
                {topOffset > 0 && (
                  <tr style={{ height: `${topOffset}px` }} aria-hidden="true">
                    <td colSpan={10} className="p-0 border-0" />
                  </tr>
                )}
                {visibleItems.map(({ item, actualIndex }) => (
                  <React.Fragment key={actualIndex}>
                    {renderRow(item, actualIndex)}
                  </React.Fragment>
                ))}
                {bottomOffset > 0 && (
                  <tr style={{ height: `${bottomOffset}px` }} aria-hidden="true">
                    <td colSpan={10} className="p-0 border-0" />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      {total > 0 && (
        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Menampilkan baris {startIndex + 1}&ndash;{endIndex} dari total {total.toLocaleString('id-ID')} creator (virtualized window)</span>
          <span className="font-semibold text-teal-600 dark:text-teal-400">🚀 60 FPS Virtualized</span>
        </div>
      )}
    </div>
  );
}
