import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check, Lock } from 'lucide-react';

interface DateRangeCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onSelectRange: (start: string, end: string, days: number) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toDateStr = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

/**
 * Returns tomorrow's local YYYY-MM-DD date string.
 * Today and all past dates are blocked — booking starts from the next day ("अगला दिन").
 */
export const getMinBookableDateStr = (): string => {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return toLocalDateStr(tomorrow);
};

export const isBookableDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  return dateStr >= getMinBookableDateStr();
};

export const calculateDaysBetween = (start: string, end: string): number => {
  if (!start) return 0;
  if (!end) return 1;
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 1;
};

export const DateRangeCalendarModal: React.FC<DateRangeCalendarModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onSelectRange
}) => {
  const minBookableDate = getMinBookableDateStr();
  const minDateObj = new Date(minBookableDate + 'T00:00:00');

  const getInitialRef = () => {
    if (startDate && startDate >= minBookableDate) {
      return new Date(startDate + 'T00:00:00');
    }
    return minDateObj;
  };

  const [viewYear, setViewYear] = useState(getInitialRef().getFullYear());
  const [viewMonth, setViewMonth] = useState(getInitialRef().getMonth());
  const [tempStart, setTempStart] = useState(
    startDate && startDate >= minBookableDate ? startDate : ''
  );
  const [tempEnd, setTempEnd] = useState(
    endDate && endDate >= minBookableDate ? endDate : ''
  );

  useEffect(() => {
    if (!isOpen) return;
    const minStr = getMinBookableDateStr();
    const minObj = new Date(minStr + 'T00:00:00');
    const ref = startDate && startDate >= minStr ? new Date(startDate + 'T00:00:00') : minObj;
    setViewYear(ref.getFullYear());
    setViewMonth(ref.getMonth());
    setTempStart(startDate && startDate >= minStr ? startDate : '');
    setTempEnd(endDate && endDate >= minStr ? endDate : '');
  }, [isOpen, startDate, endDate]);

  if (!isOpen) return null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const isAtMinMonth =
    viewYear < minDateObj.getFullYear() ||
    (viewYear === minDateObj.getFullYear() && viewMonth <= minDateObj.getMonth());

  const handlePrevMonth = () => {
    if (isAtMinMonth) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayTouch = (dateStr: string) => {
    if (dateStr < minBookableDate) return;
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd('');
    } else {
      if (dateStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
    }
  };

  const effectiveEnd = tempEnd || tempStart;
  const totalDays = tempStart ? calculateDaysBetween(tempStart, effectiveEnd) : 0;

  const handleConfirm = () => {
    if (!tempStart || tempStart < minBookableDate) return;
    onSelectRange(tempStart, effectiveEnd, totalDays);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0e1525] border border-amber-400/40 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#080d18] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                तारीख चुनें (कब से कब तक चाहिए)
              </h3>
              <p className="text-[11px] text-amber-300 mt-0.5">
                पिछली व आज की तारीख बंद है · कल ({minBookableDate}) से आगे चुनें
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Range Banner */}
        <div className="px-5 py-3 bg-[#0a101d] border-b border-slate-800/80 grid grid-cols-3 gap-2 text-xs text-center">
          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">कब से (From)</span>
            <span className="font-mono font-bold text-amber-300 tabular-nums">
              {tempStart || 'चुनें'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">कब तक (To)</span>
            <span className="font-mono font-bold text-amber-300 tabular-nums">
              {effectiveEnd || 'चुनें'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30">
            <span className="text-[10px] text-amber-300 block">कुल दिन</span>
            <span className="font-mono font-extrabold text-white tabular-nums">
              {totalDays > 0 ? `${totalDays} दिन` : '—'}
            </span>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <button
            type="button"
            disabled={isAtMinMonth}
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
            title={isAtMinMonth ? 'पिछला महीना उपलब्ध नहीं है' : 'Previous Month'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white tracking-tight">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-2">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayWeekday }).map((_, idx) => (
              <div key={`empty_${idx}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isDisabled = dateStr < minBookableDate;
              const isStart = !isDisabled && dateStr === tempStart;
              const isEnd = !isDisabled && dateStr === effectiveEnd;
              const isInRange =
                !isDisabled && Boolean(tempStart && effectiveEnd && dateStr > tempStart && dateStr < effectiveEnd);

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDayTouch(dateStr)}
                  title={isDisabled ? 'आज व पिछली तारीख की बुकिंग बंद है' : `Select ${dateStr}`}
                  className={`h-11 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center tabular-nums ${
                    isDisabled
                      ? 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed line-through opacity-40'
                      : isStart || isEnd
                      ? 'bg-amber-400 text-slate-950 shadow-lg ring-2 ring-amber-300 cursor-pointer'
                      : isInRange
                      ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 cursor-pointer'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-800 cursor-pointer'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>आज और पुरानी तारीख लॉक हैं — केवल कल ({minBookableDate}) से बुकिंग होगी</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-[#080d18] border-t border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setTempStart('');
              setTempEnd('');
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!tempStart}
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow"
          >
            <Check className="w-4 h-4" />
            <span>
              {tempStart
                ? `कन्फर्म करें (${totalDays} दिन)`
                : 'कल से आगे की तारीख चुनें'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
