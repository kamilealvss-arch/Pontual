import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Video, 
  CheckCircle2, 
  FileCheck, 
  Sparkles,
  ExternalLink,
  Plus,
  X
} from 'lucide-react';
import { Employee, Shift } from '../types';
import { calculateShiftDurationHours } from '../utils/dateUtils';

interface EmployeeCalendarViewProps {
  employee: Employee;
  shifts: Shift[];
  onShiftClick: (shift: Shift) => void;
  onRequestTimeOff: () => void;
  onSendJustification: () => void;
  isLightTheme?: boolean;
}

type ViewMode = 'Diário' | 'Semanal' | 'Mensal';

// Funções auxiliares de data
function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export const EmployeeCalendarView: React.FC<EmployeeCalendarViewProps> = ({
  employee,
  shifts,
  onShiftClick,
  onRequestTimeOff,
  onSendJustification,
  isLightTheme = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('Semanal');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 21)); // Default 21 Sep 2026
  const [popoverShift, setPopoverShift] = useState<Shift | null>(null);

  const empShifts = useMemo(() => {
    return shifts.filter(s => s.employeeId === employee.id && s.status === 'published');
  }, [shifts, employee.id]);

  const todayStr = formatDateToYYYYMMDD(new Date(2026, 8, 21));

  // Navegação
  const handlePrev = () => {
    if (viewMode === 'Mensal') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'Semanal') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'Mensal') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'Semanal') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 21));
  };

  // Título dinâmico do cabeçalho
  const titleText = useMemo(() => {
    if (viewMode === 'Mensal') {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'Semanal') {
      const weekStart = startOfWeekMonday(currentDate);
      const weekEnd = addDays(weekStart, 6);
      const startStr = weekStart.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      const endStr = weekEnd.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startStr} – ${endStr}`;
    }
    return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [viewMode, currentDate]);

  // Células do calendário mensal
  const monthCells = useMemo(() => {
    if (viewMode !== 'Mensal') return [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDay = firstDayOfMonth.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const totalDays = lastDayOfMonth.getDate();
    const cells = [];

    for (let i = 0; i < startDay; i++) {
      cells.push(null);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateString: dayStr,
        shifts: empShifts.filter(s => s.date === dayStr),
      });
    }

    return cells;
  }, [viewMode, currentDate, empShifts]);

  // Dias da semana atual
  const weekDays = useMemo(() => {
    if (viewMode !== 'Semanal') return [];
    const start = startOfWeekMonday(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      const dayStr = formatDateToYYYYMMDD(day);
      return {
        date: day,
        dateString: dayStr,
        dayNumber: day.getDate(),
        dayNameShort: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i],
        shifts: empShifts.filter(s => s.date === dayStr),
      };
    });
  }, [viewMode, currentDate, empShifts]);

  // Turnos do dia na visualização diária
  const dayShifts = useMemo(() => {
    if (viewMode !== 'Diário') return [];
    const dayStr = formatDateToYYYYMMDD(currentDate);
    return empShifts.filter(s => s.date === dayStr);
  }, [viewMode, currentDate, empShifts]);

  // Paleta pastel refinada para os blocos de eventos no estilo da imagem de referência
  const getEventCardStyle = (shift: Shift, idx: number) => {
    if (!isLightTheme) {
      if (shift.type === 'meeting') {
        return 'bg-[#4A1525] border border-[#96183C]/40 text-white shadow-lg hover:bg-[#5C192E]';
      }
      return 'bg-[#2D1B14] border border-[#F89847]/20 text-white shadow-lg hover:bg-[#3D251C]';
    }

    const palettes = [
      // Amarelo pálido (#faf0ac)
      'bg-[#faf0ac]/85 hover:bg-[#faf0ac] border border-amber-200/80 text-slate-900 shadow-xs shadow-amber-200/30',
      // Rosa / Vinho pálido
      'bg-[#ffe4e6]/85 hover:bg-[#ffe4e6] border border-rose-200/80 text-slate-900 shadow-xs shadow-rose-200/30',
      // Pêssego / Laranja pálido (#f89642 suave)
      'bg-[#ffedd5]/85 hover:bg-[#ffedd5] border border-orange-200/80 text-slate-900 shadow-xs shadow-orange-200/30',
      // Amarelo suave
      'bg-[#fef9c3]/85 hover:bg-[#fef9c3] border border-yellow-200/80 text-slate-900 shadow-xs shadow-yellow-200/30',
    ];

    if (shift.type === 'meeting') return palettes[1];
    return palettes[idx % palettes.length];
  };

  return (
    <div
      className={`rounded-[32px] min-h-[840px] p-5 sm:p-7 font-sans transition-all duration-300 relative ${
        isLightTheme
          ? 'text-slate-800 border border-white/60 shadow-2xl shadow-orange-950/5 backdrop-blur-xl'
          : 'bg-[#0f1115] text-white border border-white/5 shadow-2xl'
      }`}
      style={
        isLightTheme
          ? {
              background:
                'linear-gradient(135deg, rgba(248, 150, 66, 0.40) 0%, rgba(251, 146, 60, 0.30) 35%, rgba(250, 240, 172, 0.70) 75%, rgba(254, 240, 138, 0.60) 100%), radial-gradient(ellipse at 15% 10%, rgba(248, 150, 66, 0.45) 0%, transparent 60%), radial-gradient(ellipse at 85% 90%, rgba(250, 240, 172, 0.90) 0%, transparent 65%), #fffbf2',
            }
          : {}
      }
    >
      {/* 1. Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
        
        {/* Title, Hoje and Date Navigator */}
        <div className="flex flex-wrap items-center gap-3.5">
          <h2 className={`text-xl sm:text-2xl font-black capitalize tracking-tight ${
            isLightTheme ? 'text-slate-900' : 'text-white'
          }`}>
            {titleText}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-5 py-2 rounded-full font-bold text-xs text-white shadow-lg bg-[#96183C] hover:bg-[#801433] active:scale-95 transition-all shadow-[#96183C]/30 cursor-pointer"
            >
              Hoje
            </button>
            <div className={`flex items-center gap-0.5 p-1 rounded-full border transition-colors ${
              isLightTheme ? 'bg-white/60 border-black/5 text-slate-700 shadow-2xs backdrop-blur-xs' : 'bg-[#1a1d24] border-white/5 text-white/70'
            }`}>
              <button 
                onClick={handlePrev} 
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isLightTheme ? 'hover:bg-black/5 text-slate-700 hover:text-slate-900' : 'hover:bg-white/10 text-white/60 hover:text-white'
                }`}
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button 
                onClick={handleNext} 
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isLightTheme ? 'hover:bg-black/5 text-slate-700 hover:text-slate-900' : 'hover:bg-white/10 text-white/60 hover:text-white'
                }`}
                title="Próximo"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* View Toggles & Actions */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onRequestTimeOff}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer ${
                isLightTheme
                  ? 'bg-white/80 hover:bg-white backdrop-blur-md border border-amber-300/70 text-amber-950 shadow-slate-200/50 hover:shadow-md'
                  : 'bg-[#1a1d24] hover:bg-[#2D1B14] text-[#F89847] border border-[#F89847]/20 hover:border-[#F89847]/50'
              }`}
            >
              <span className="text-[14px]">🏖️</span>
              <span>Pedir Folga / Troca</span>
            </button>

            <button
              type="button"
              onClick={onSendJustification}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer ${
                isLightTheme
                  ? 'bg-white/80 hover:bg-white backdrop-blur-md border border-rose-300/70 text-[#96183C] shadow-slate-200/50 hover:shadow-md'
                  : 'bg-[#1a1d24] hover:bg-white/5 text-white/80 hover:text-white border border-white/5 hover:border-[#96183C]/50'
              }`}
            >
              <span className="text-[14px]">📄</span>
              <span>Justificar Falta</span>
            </button>
          </div>

          {/* View Switcher Pill */}
          <div className={`flex items-center p-1 rounded-2xl border transition-colors ${
            isLightTheme ? 'bg-black/5 border-black/5 backdrop-blur-xs' : 'bg-[#1a1d24] border-white/5'
          }`}>
            {(['Mensal', 'Semanal', 'Diário'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  viewMode === mode
                    ? isLightTheme
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-white text-[#0f1115] shadow-sm'
                    : isLightTheme
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-white/50 hover:text-white'
                }`}
              >
                {mode === 'Mensal' ? 'Mês' : mode === 'Semanal' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Days of the Week Bar (matching reference UI) */}
      {viewMode === 'Semanal' && (
        <div className="grid grid-cols-[48px_1fr] gap-3 mb-5">
          {/* Left GMT Pill */}
          <div className={`flex items-center justify-center rounded-2xl p-2 font-mono text-[11px] font-bold tracking-wider uppercase border ${
            isLightTheme 
              ? 'bg-white/60 backdrop-blur-md border-white/60 text-slate-500 shadow-2xs' 
              : 'bg-[#1a1d24] border-white/5 text-white/50'
          }`}>
            <span className="rotate-[-90deg] whitespace-nowrap">GMT-3</span>
          </div>

          {/* 7 Floating Day Cards */}
          <div className="grid grid-cols-7 gap-2.5">
            {weekDays.map((d) => {
              const isToday = d.dateString === todayStr;
              return (
                <div
                  key={d.dateString}
                  onClick={() => {
                    setCurrentDate(d.date);
                  }}
                  className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl transition-all cursor-pointer ${
                    isToday
                      ? isLightTheme
                        ? 'bg-gradient-to-b from-[#e55934] to-[#f89642] text-white shadow-lg shadow-orange-500/25 border border-orange-300/40 transform hover:scale-[1.02]'
                        : 'bg-gradient-to-br from-[#96183C] to-[#F89847] text-white shadow-lg shadow-[#96183C]/20 border border-white/10'
                      : isLightTheme
                        ? 'bg-white/70 hover:bg-white/85 backdrop-blur-md border border-white/80 text-slate-800 shadow-sm hover:shadow-md hover:scale-[1.01]'
                        : 'bg-[#1a1d24] text-white/70 border border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    isToday ? 'opacity-90' : isLightTheme ? 'text-slate-500' : 'opacity-80'
                  }`}>
                    {d.dayNameShort}
                  </span>
                  <span className={`text-2xl font-black tracking-tight ${
                    isToday ? 'text-white' : isLightTheme ? 'text-slate-900' : 'text-white'
                  }`}>
                    {d.dayNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Time Grid Area (Semanal) */}
      {viewMode === 'Semanal' && (
        <div
          className={`rounded-3xl p-4 sm:p-6 border transition-all relative ${
            isLightTheme
              ? 'bg-white/95 backdrop-blur-md border-white/80 shadow-md'
              : 'bg-[#111318]/90 border-white/5 shadow-inner'
          }`}
        >
          <div className="grid grid-cols-[48px_1fr] gap-3">
            
            {/* Timeline Left Column */}
            <div className="space-y-12 pt-2 text-right pr-2">
              {['8 am', '9 am', '10 am', '12 am', '13 pm', '14:00', '16:00'].map((t) => (
                <div key={t} className={`text-[11px] font-mono font-medium h-5 ${
                  isLightTheme ? 'text-slate-400' : 'text-white/30'
                }`}>
                  {t}
                </div>
              ))}
            </div>

            {/* 7 Days Grid with Event Cards */}
            <div className="grid grid-cols-7 gap-2.5 relative">
              {/* Subtle Horizontal Divider Lines in Background */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-40">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`border-b h-[68px] ${
                      isLightTheme ? 'border-slate-100' : 'border-white/5'
                    }`}
                  />
                ))}
              </div>

              {weekDays.map((d) => (
                <div key={d.dateString} className="flex flex-col gap-2.5 pt-1 relative z-10 min-h-[460px]">
                  {d.shifts.map((s, idx) => {
                    const isMeeting = s.type === 'meeting';
                    const cardStyle = getEventCardStyle(s, idx);

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setPopoverShift(s);
                        }}
                        className={`relative p-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${cardStyle}`}
                      >
                        {/* Title */}
                        <div className="font-extrabold text-xs leading-tight mb-1 truncate">
                          {s.title || 'Atendimento Geral'}
                        </div>

                        {/* Time & Meeting Icon */}
                        <div className={`text-[10px] font-mono mb-3 flex items-center justify-between font-semibold ${
                          isLightTheme ? 'text-slate-600' : 'text-white/70'
                        }`}>
                          <span>{s.startTime} - {s.endTime}</span>
                          {isMeeting && <Video className={`w-3.5 h-3.5 ${isLightTheme ? 'text-rose-600' : 'text-[#F89847]'}`} />}
                        </div>

                        {/* Avatars Stack (matching reference image) */}
                        <div className="flex items-center gap-1.5 mt-auto pt-1">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            <img
                              src={employee.avatar}
                              alt={employee.name}
                              className={`inline-block h-5 w-5 rounded-full object-cover ring-2 ${
                                isLightTheme ? 'ring-white/80' : 'ring-black/40'
                              }`}
                            />
                            {isMeeting && (
                              <img
                                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
                                alt="Beatriz"
                                className={`inline-block h-5 w-5 rounded-full object-cover ring-2 ${
                                  isLightTheme ? 'ring-white/80' : 'ring-black/40'
                                }`}
                              />
                            )}
                          </div>
                          <span className={`text-[10px] font-bold ${
                            isLightTheme ? 'text-slate-800' : 'text-white/90'
                          }`}>
                            {employee.name.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* --- VISÃO MENSAL --- */}
      {viewMode === 'Mensal' && (
        <div
          className={`rounded-3xl p-5 border transition-all ${
            isLightTheme
              ? 'bg-white/95 backdrop-blur-md border-white/80 shadow-md'
              : 'bg-[#111318]/90 border-white/5'
          }`}
        >
          <div className="grid grid-cols-7 gap-2.5">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day, i) => (
              <div
                key={i}
                className={`text-center text-[10px] font-extrabold mb-2 font-mono uppercase tracking-wider ${
                  isLightTheme ? 'text-slate-500' : 'text-white/40'
                }`}
              >
                {day}
              </div>
            ))}
            
            {monthCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div 
                    key={`empty-${idx}`} 
                    className={`min-h-[105px] rounded-2xl ${
                      isLightTheme ? 'bg-slate-50/40 border border-dashed border-slate-200/50' : 'bg-white/[0.02]'
                    }`} 
                  />
                );
              }
              const isToday = cell.dateString === todayStr;
              return (
                <div
                  key={cell.dateString}
                  className={`min-h-[105px] p-2.5 rounded-2xl flex flex-col gap-1.5 transition-all ${
                    isToday
                      ? isLightTheme
                        ? 'bg-gradient-to-br from-rose-50 to-orange-50/90 border border-orange-300 ring-1 ring-orange-200 shadow-sm'
                        : 'bg-gradient-to-br from-[#96183C]/20 to-[#F89847]/20 border border-[#F89847]/30'
                      : isLightTheme
                        ? 'bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
                        : 'bg-[#1a1d24] border border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`text-xs font-black px-1 ${
                    isToday 
                      ? isLightTheme ? 'text-orange-600' : 'text-[#F89847]' 
                      : isLightTheme ? 'text-slate-700' : 'text-white/60'
                  }`}>
                    {cell.dayNumber}
                  </div>
                  <div className="space-y-1">
                    {cell.shifts.map((s, sIdx) => {
                      const cardStyle = getEventCardStyle(s, sIdx);
                      return (
                        <div
                          key={s.id}
                          onClick={() => setPopoverShift(s)}
                          className={`px-2 py-1.5 rounded-xl border cursor-pointer text-left transition-all ${cardStyle}`}
                        >
                          <div className="text-[9px] font-mono font-bold opacity-90">
                            {s.startTime}
                          </div>
                          <div className="text-[10px] font-bold truncate">
                            {s.title || 'Turno'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- VISÃO DIÁRIA --- */}
      {viewMode === 'Diário' && (
        <div
          className={`max-w-3xl mx-auto rounded-3xl p-6 border space-y-6 ${
            isLightTheme
              ? 'bg-white/95 backdrop-blur-md border-white/80 shadow-md'
              : 'bg-[#111318]/90 border-white/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className={`text-2xl font-black ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <span className={`px-3.5 py-1 rounded-full text-xs font-bold border ${
              isLightTheme 
                ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-2xs' 
                : 'bg-[#2D1B14] text-[#F89847] border border-[#F89847]/20'
            }`}>
              {dayShifts.length} turno(s)
            </span>
          </div>

          <div className="space-y-3">
            {dayShifts.length === 0 ? (
              <div className={`text-center py-12 italic font-mono rounded-2xl border ${
                isLightTheme 
                  ? 'text-slate-400 bg-slate-50/50 border-slate-200' 
                  : 'text-white/40 bg-[#1a1d24] border-white/5'
              }`}>
                Nenhum turno agendado para este dia.
              </div>
            ) : (
              dayShifts.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => setPopoverShift(s)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isLightTheme
                      ? 'bg-[#faf0ac]/30 hover:bg-[#faf0ac]/60 border-amber-200/60 shadow-sm'
                      : 'bg-[#2D1B14] hover:bg-[#3D251C] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      isLightTheme 
                        ? 'bg-white border-amber-200 text-orange-600 shadow-2xs' 
                        : 'bg-black/40 border-white/10 text-[#F89847]'
                    }`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-extrabold mb-0.5 ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                        {s.title || 'Turno'}
                      </h4>
                      <div className={`text-xs font-mono font-bold ${isLightTheme ? 'text-orange-600' : 'text-[#F89847]'}`}>
                        {s.startTime} às {s.endTime}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                       isLightTheme ? 'bg-white border-amber-200' : 'bg-black/40 border-white/5'
                     }`}>
                        <img src={employee.avatar} className="w-5 h-5 rounded-full" alt="Avatar"/>
                        <span className={`text-xs font-bold ${isLightTheme ? 'text-slate-700' : 'text-white/80'}`}>
                          {employee.name.split(' ')[0]}
                        </span>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. Pop-up de Detalhes Flutuante (estilo image_0.png) */}
      {popoverShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`rounded-3xl p-6 shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-200 ${
              isLightTheme
                ? 'bg-white/95 backdrop-blur-xl border border-white/90 text-slate-800'
                : 'bg-[#18181F] border border-white/10 text-white'
            }`}
          >
            {/* Botão Fechar */}
            <button
              onClick={() => setPopoverShift(null)}
              className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${
                isLightTheme
                  ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                  : 'hover:bg-white/10 text-white/40 hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Título do Evento */}
            <h3 className={`text-lg font-black leading-snug mb-3 pr-6 ${
              isLightTheme ? 'text-slate-900' : 'text-white'
            }`}>
              {popoverShift.title || 'Atendimento Geral'}
            </h3>

            {/* Caixa de Detalhes do Turno */}
            <div
              className={`space-y-1.5 text-xs p-4 rounded-2xl mb-4 border ${
                isLightTheme
                  ? 'bg-[#faf0ac]/40 border-amber-200/70 text-slate-700'
                  : 'bg-white/5 border-white/10 text-slate-300'
              }`}
            >
              <div className="font-bold uppercase text-[10px] tracking-wider text-orange-600 font-mono">
                Detalhes do Turno:
              </div>
              <div className={`font-extrabold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                {popoverShift.title || 'Atendimento Geral.'}
              </div>
              <div>{employee.name}.</div>
              <div className="font-mono font-bold text-orange-600">
                {popoverShift.startTime} - {popoverShift.endTime}
              </div>
            </div>

            {/* Participantes e Data */}
            <div className="space-y-2.5 mb-5">
              <div className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                isLightTheme ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Colaborador & Data:
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={employee.avatar}
                  alt={employee.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-orange-400/40"
                />
                <div>
                  <div className={`text-xs font-bold leading-tight ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>
                    {employee.name}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                    {popoverShift.date} • {employee.role}
                  </div>
                </div>
              </div>
            </div>

            {/* Ações do Popover */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const s = popoverShift;
                  setPopoverShift(null);
                  onShiftClick(s);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#96183C] to-[#F89847] text-white text-xs font-bold shadow-md shadow-[#96183C]/20 hover:brightness-105 active:scale-95 transition-all text-center cursor-pointer"
              >
                Abrir Detalhes Completos
              </button>
              <button
                type="button"
                onClick={() => setPopoverShift(null)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  isLightTheme
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'border-white/10 text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


