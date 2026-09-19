import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Clock, Trash2, CalendarDays } from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string YYYY-MM-DD or full ISO
  time?: string; // Optional time string e.g. "14:30" or "02:30 PM"
  type?: string;
  isCustom?: boolean;
}

interface MinimalCalendarProps {
  events?: CalendarEvent[];
  onSelectDate?: (date: Date) => void;
  onAddEvent?: (dateStr: string) => void;
  onDeleteEvent?: (eventId: string) => void;
  className?: string;
}

export default function MinimalCalendar({
  events = [],
  onSelectDate,
  onAddEvent,
  onDeleteEvent,
  className = ''
}: MinimalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isMonthEventsOpen, setIsMonthEventsOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
    onSelectDate?.(today);
  };

  // Calendar matrix calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  // Map events by YYYY-MM-DD for fast lookup
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!ev.date) return acc;
    const d = new Date(ev.date);
    if (isNaN(d.getTime())) return acc;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDayEvents = eventsByDate[selectedDateKey] || [];

  // All events in the currently viewed month, excluding exams (CAT, FAT, QUIZ, LAB, REVIEW)
  const monthNonExamEvents = events
    .filter(ev => {
      if (!ev.date) return false;
      const d = new Date(ev.date);
      if (isNaN(d.getTime())) return false;
      // Must match currently viewed year and month
      if (d.getFullYear() !== year || d.getMonth() !== month) return false;
      // Must be custom user event or non-exam
      const typeUpper = (ev.type || '').toUpperCase();
      const titleUpper = (ev.title || '').toUpperCase();
      const isExam = 
        !ev.isCustom && (
          ['CAT', 'FAT', 'QUIZ', 'LAB', 'REVIEW'].includes(typeUpper) ||
          titleUpper.includes('CAT') ||
          titleUpper.includes('FAT') ||
          titleUpper.includes('QUIZ')
        );
      return !isExam;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className={`flex flex-col bg-white dark:bg-black border-2 border-black dark:border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,1)] ${className}`}>
      {/* Header Bar */}
      <div className="p-4 border-b-2 border-black dark:border-white flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
        <div>
          <h3 className="font-mono text-sm font-bold tracking-widest uppercase text-black dark:text-white flex items-center gap-2">
            <span>{monthNames[month]}</span>
            <span className="text-zinc-500 dark:text-zinc-400">{year}</span>
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="px-2 py-1 font-mono text-[9px] font-bold tracking-widest uppercase border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            title="Jump to current date"
          >
            TODAY
          </button>
          <button
            onClick={prevMonth}
            className="p-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-mono text-[9px] font-bold tracking-widest text-center py-2">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 bg-white dark:bg-black">
        {/* Previous Month Overflow */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => {
          const dayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
          return (
            <div
              key={`prev-${i}`}
              className="h-10 sm:h-12 border-b border-r border-zinc-200 dark:border-zinc-800 p-1 flex items-center justify-center font-mono text-xs text-zinc-300 dark:text-zinc-700 select-none"
            >
              <span>{dayNum}</span>
            </div>
          );
        })}

        {/* Current Month Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayDate = new Date(year, month, dayNum);
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const dayEvents = eventsByDate[dateKey] || [];
          const hasExam = dayEvents.length > 0;
          const isToday = isCurrentMonth && dayNum === todayDate;
          const isSelected = isSameDay(dayDate, selectedDate);

          return (
            <button
              key={`day-${dayNum}`}
              onClick={() => {
                setSelectedDate(dayDate);
                onSelectDate?.(dayDate);
              }}
              className={`h-10 sm:h-12 border-b border-r border-zinc-200 dark:border-zinc-800 p-1 flex flex-col items-center justify-center relative transition-colors group focus:outline-none ${
                isSelected
                  ? 'bg-zinc-100 dark:bg-zinc-900'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-950'
              }`}
            >
              {/* Event Circular Badge or Standard Number */}
              {hasExam ? (
                <div className="w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-mono text-xs font-bold shadow-sm">
                  {dayNum}
                </div>
              ) : (
                <span
                  className={`font-mono text-xs ${
                    isToday
                      ? 'font-bold text-black dark:text-white border-b-2 border-black dark:border-white pb-0.5'
                      : 'text-black dark:text-white group-hover:font-bold'
                  }`}
                >
                  {dayNum}
                </span>
              )}

              {/* Indicator Dot for multiple events */}
              {hasExam && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((_, idx) => (
                    <span
                      key={idx}
                      className="w-1 h-1 rounded-full bg-black dark:bg-white opacity-70"
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}

        {/* Next Month Overflow to complete the grid */}
        {(() => {
          const totalCells = firstDayOfMonth + daysInMonth;
          const remainingCells = (7 - (totalCells % 7)) % 7;
          return Array.from({ length: remainingCells }).map((_, i) => (
            <div
              key={`next-${i}`}
              className="h-10 sm:h-12 border-b border-r border-zinc-200 dark:border-zinc-800 p-1 flex items-center justify-center font-mono text-xs text-zinc-300 dark:text-zinc-700 select-none"
            >
              <span>{i + 1}</span>
            </div>
          ));
        })()}
      </div>

      {/* Selected Day Event Drawer / Detail Footer */}
      <div className="p-3 border-t border-black dark:border-white bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400">
            {selectedDate.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          {onAddEvent && (
            <button
              onClick={() => onAddEvent(selectedDateKey)}
              className="font-mono text-[9px] uppercase font-bold tracking-widest text-black dark:text-white hover:underline"
            >
              [+ ADD EVENT]
            </button>
          )}
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest py-1">
            No milestones on this day
          </div>
        ) : (
          <div className="space-y-1.5 pt-1">
            {selectedDayEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between border border-black dark:border-white p-2 bg-white dark:bg-black font-mono text-[10px] group"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  {ev.type && (
                    <span className="px-1.5 py-0.5 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-[9px] shrink-0">
                      {ev.type}
                    </span>
                  )}
                  <span className="font-bold text-black dark:text-white uppercase truncate">
                    {ev.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ev.time ? (
                    <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-black dark:text-white bg-zinc-100 dark:bg-zinc-900 border border-black dark:border-white px-1.5 py-0.5">
                      <Clock className="w-3 h-3" />
                      {ev.time}
                    </span>
                  ) : (
                    <span className="text-zinc-500 dark:text-zinc-400 uppercase text-[9px]">
                      ALL DAY
                    </span>
                  )}
                  {ev.isCustom && onDeleteEvent && (
                    <button
                      onClick={() => onDeleteEvent(ev.id)}
                      className="p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Month Events Dropdown (Excluding Exams) */}
      <div className="border-t-2 border-black dark:border-white bg-white dark:bg-black">
        <button
          type="button"
          onClick={() => setIsMonthEventsOpen(!isMonthEventsOpen)}
          className="w-full p-3 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-black dark:text-white" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">
              {monthNames[month]} Events ({monthNonExamEvents.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Excluding Exams
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-black dark:text-white transition-transform duration-150 ${isMonthEventsOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isMonthEventsOpen && (
          <div className="p-3 border-t border-black dark:border-white bg-zinc-50 dark:bg-zinc-950 space-y-2 max-h-56 overflow-y-auto">
            {monthNonExamEvents.length === 0 ? (
              <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest py-3 text-center">
                No non-exam events scheduled for {monthNames[month]}
              </div>
            ) : (
              <div className="space-y-1.5">
                {monthNonExamEvents.map(ev => {
                  const evDate = new Date(ev.date);
                  const isDateSelected = isSameDay(evDate, selectedDate);
                  return (
                    <div
                      key={ev.id}
                      className={`flex items-center justify-between border p-2 bg-white dark:bg-black font-mono text-[10px] transition-colors ${
                        isDateSelected 
                          ? 'border-black dark:border-white shadow-sm ring-1 ring-black dark:ring-white' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(evDate);
                          onSelectDate?.(evDate);
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left mr-2 focus:outline-none"
                      >
                        <span className="px-1.5 py-0.5 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-[9px] shrink-0">
                          {evDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="font-bold text-black dark:text-white uppercase truncate">
                          {ev.title}
                        </span>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {ev.time ? (
                          <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-black dark:text-white bg-zinc-100 dark:bg-zinc-900 border border-black dark:border-white px-1.5 py-0.5">
                            <Clock className="w-3 h-3" />
                            {ev.time}
                          </span>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400 uppercase text-[9px]">
                            ALL DAY
                          </span>
                        )}
                        {ev.isCustom && onDeleteEvent && (
                          <button
                            type="button"
                            onClick={() => onDeleteEvent(ev.id)}
                            className="p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
