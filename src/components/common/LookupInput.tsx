"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

// Renders its dropdown via a portal anchored to the input's screen position, so it
// is never clipped by a scrolling ancestor (e.g. a modal body with overflow-y-auto),
// which is especially important on mobile where the on-screen keyboard shrinks the
// visible viewport.
export default function LookupInput<T extends { id: string }>({
  value, placeholder, disabled, className, matches, totalCount, renderItem, onChange, onPick,
}: {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  className: string;
  matches: T[];
  totalCount?: number;
  renderItem: (item: T) => React.ReactNode;
  onChange: (val: string) => void;
  onPick: (item: T) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  function openDropdown() {
    const r = inputRef.current?.getBoundingClientRect();
    if (r) setRect({ top: r.bottom, left: r.left, width: Math.max(r.width, 220) });
    setOpen(true);
  }

  const showDropdown = open && matches.length > 0 && rect;

  return (
    <>
      <input
        ref={inputRef}
        className={className}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); openDropdown(); }}
        onFocus={openDropdown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {showDropdown && createPortal(
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
          style={{ top: rect.top + 4, left: rect.left, width: rect.width }}
        >
          {matches.map(m => (
            <button type="button" key={m.id} onMouseDown={() => { onPick(m); setOpen(false); }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
              {renderItem(m)}
            </button>
          ))}
          {totalCount != null && totalCount > matches.length && (
            <p className="px-3 py-1.5 text-[11px] text-gray-400 border-t border-gray-100">
              แสดง {matches.length} จากทั้งหมด {totalCount.toLocaleString("th-TH")} รายการ — พิมพ์เพื่อค้นหาให้ตรงมากขึ้น
            </p>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
