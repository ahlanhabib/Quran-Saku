/**
 * @author Habib Ismail Al Qadri
 * @app Quran Saku
 */
import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Info,
  ArrowLeft,
} from "lucide-react";

interface KalenderViewProps {
  addToast: (
    title: string,
    body: string,
    type: "success" | "info" | "warning" | "notification",
  ) => void;
  onBack?: () => void;
}

export const KalenderView: React.FC<KalenderViewProps> = ({
  addToast,
  onBack,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Record<string, { summary: string }>>(
    {},
  );

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/holidays.json",
        );
        if (res.ok) {
          const data = await res.json();
          // The API sometimes adds 'info' key at the end, so we can ignore it
          delete data.info;
          setHolidays(data);
        }
      } catch {
        // fail silently if offline
      }
    };
    fetchHolidays();
  }, []);

  const getHijriDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat("id-ID-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      return "";
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();

    const days = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday:
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear(),
      });
    }

    // Next month filler days (to complete the grid)
    const totalCurrentDays = days.length;
    const remainingCells = 42 - totalCurrentDays; // 6 rows of 7
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
    addToast("Kembali ke Hari Ini", "Menampilkan kalender bulan ini.", "info");
  };

  const days = generateCalendarDays();
  const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const currentMonthName = currentDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const currentHijriMonthName = getHijriDate(currentDate)
    .split(" ")
    .slice(1)
    .join(" ");

  // Get current month holidays
  const currentMonthHolidays = useMemo(() => {
    const list: Array<{
      date: string;
      dateObj: Date;
      summary: string;
      isCuti: boolean;
    }> = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12
    const prefix = `${year}-${String(month).padStart(2, "0")}`;

    for (const [key, val] of Object.entries(holidays) as [
      string,
      { summary: string },
    ][]) {
      if (key.startsWith(prefix)) {
        list.push({
          date: key,
          dateObj: new Date(key),
          summary: val.summary,
          isCuti: val.summary.toLowerCase().includes("cuti bersama"),
        });
      }
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, currentDate]);

  return (
    <div className="flex flex-col h-full bg-[#FDFBF7] relative max-w-2xl mx-auto w-full pb-32 sm:pb-36">
      <div className="sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-xl border-b border-slate-200/60 z-20 px-5 py-4 flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:scale-105 rounded-full cursor-pointer transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-[#0F4C3A]" />
          </button>
        )}
        <div>
          <h3 className="font-bold text-[#0F4C3A] text-lg leading-tight">
            Kalender Hijriah
          </h3>
          <p className="text-[11px] font-bold text-emerald-700/70 uppercase tracking-widest mt-0.5">
            Penanggalan Islam & Libur
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full py-8 px-4">
        <div className="bg-white border w-full border-slate-100 rounded-[32px] shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#0F4C3A] text-white p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800/50 rounded-full blur-3xl -mr-10 -mt-10"></div>

            <div className="flex items-center justify-between w-full relative z-10 mb-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col items-center">
                <h4 className="font-serif font-bold text-xl">
                  {currentMonthName}
                </h4>
                <span className="text-xs text-emerald-200 font-medium">
                  {currentHijriMonthName}
                </span>
              </div>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={jumpToToday}
              className="relative z-10 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Hari Ini
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 sm:p-6 bg-[#FAFAFA]">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className={`text-center text-[10px] font-bold uppercase tracking-wider ${day === "Min" ? "text-red-500" : "text-slate-400"}`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {days.map((dayObj, i) => {
                const isFriday = dayObj.date.getDay() === 5;
                const isSunday = dayObj.date.getDay() === 0;

                const dStr = `${dayObj.date.getFullYear()}-${String(dayObj.date.getMonth() + 1).padStart(2, "0")}-${String(dayObj.date.getDate()).padStart(2, "0")}`;
                const dayHolidayInfo = holidays[dStr];
                const isHoliday = !!dayHolidayInfo;
                const isCuti =
                  isHoliday &&
                  dayHolidayInfo.summary.toLowerCase().includes("cuti");

                return (
                  <div
                    key={i}
                    className={`
                      aspect-square rounded-2xl flex flex-col justify-center items-center relative border 
                      ${dayObj.isCurrentMonth ? "bg-white" : "bg-transparent border-transparent opacity-40"}
                      ${dayObj.isToday ? "border-amber-300 bg-amber-50 shadow-sm ring-1 ring-amber-300" : "border-slate-100"}
                      ${isHoliday ? (isCuti ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200") : ""}
                      ${dayObj.isCurrentMonth && !dayObj.isToday ? "hover:border-emerald-200 hover:shadow-sm transition-all" : ""}
                   `}
                    title={isHoliday ? dayHolidayInfo.summary : undefined}
                  >
                    <span
                      className={`
                         text-sm sm:text-base font-bold 
                         ${dayObj.isToday ? "text-amber-800" : isSunday || (isHoliday && !isCuti) ? "text-red-500" : isCuti ? "text-amber-600" : "text-slate-700"}
                      `}
                    >
                      {dayObj.date.getDate()}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-semibold mt-0.5 ${dayObj.isToday ? "text-amber-600" : isFriday && dayObj.isCurrentMonth ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      {getHijriDate(dayObj.date).split(" ")[0]}{" "}
                      {/* Just the Hijri day number */}
                    </span>

                    {/* Jumat marker */}
                    {isFriday && dayObj.isCurrentMonth && !isHoliday && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    )}
                    {/* Holiday marker */}
                    {isHoliday && dayObj.isCurrentMonth && (
                      <div
                        className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isCuti ? "bg-amber-400" : "bg-red-500"}`}
                      ></div>
                    )}
                    {/* Fasting (Puasa) marker */}
                    {(dayObj.date.getDay() === 1 || dayObj.date.getDay() === 4) && dayObj.isCurrentMonth && (
                      <div title="Puasa Sunnah Senin Kamis" className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    )}
                    {(["13", "14", "15"].includes(getHijriDate(dayObj.date).split(" ")[0])) && dayObj.isCurrentMonth && (
                      <div title="Puasa Ayyamul Bidh" className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Banner & Holidays List */}
          <div className="bg-white border-t border-slate-100 flex flex-col divide-y divide-slate-100">
            <div className="p-4 flex flex-wrap items-center justify-center gap-4 gap-y-2 text-[10px] font-semibold text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>{" "}
                Jumat (Sunnah Al-Kahfi)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div> Hari
                Libur Nasional
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div> Cuti
                Bersama
              </div>
              <div className="flex flex-col gap-2 w-full text-center sm:text-left mt-2 border-t pt-3">
                <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div> Puasa Senin Kamis
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Puasa Ayyamul Bidh
                  </div>
                </div>
              </div>
            </div>

            {currentMonthHolidays.length > 0 && (
              <div className="p-4 sm:p-6 bg-slate-50 flex flex-col gap-3">
                <h5 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4" /> Daftar Libur Bulan Ini
                </h5>
                <div className="flex flex-col gap-2">
                  {currentMonthHolidays.map((h, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex items-center gap-3 ${h.isCuti ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"}`}
                    >
                      <div
                        className={`w-10 h-10 shrink-0 flex flex-col justify-center items-center rounded-lg bg-white shadow-sm font-bold leading-none ${h.isCuti ? "text-amber-600" : "text-red-500"}`}
                      >
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {h.dateObj.toLocaleDateString("id-ID", {
                            weekday: "short",
                          })}
                        </span>
                        <span className="text-sm">{h.dateObj.getDate()}</span>
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-bold ${h.isCuti ? "text-amber-800" : "text-red-700"}`}
                        >
                          {h.summary}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {h.isCuti ? "Cuti Bersama" : "Libur Nasional"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
