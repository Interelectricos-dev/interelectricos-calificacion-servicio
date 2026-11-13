import React from 'react';
import {
  Zap,
  MessageSquare,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';

interface KpiCardsGridProps {
  totalCalificaciones: number;
  promedioGeneral: number;
  csatPorcentaje: number;
  tasaConComentario: number;
}

export function KpiCardsGrid({
  totalCalificaciones,
  promedioGeneral,
  csatPorcentaje,
  tasaConComentario,
}: KpiCardsGridProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8 font-sans">
      {/* KPI 1: Promedio de Rayos */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            Promedio de Servicio
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Zap className="w-4 h-4 fill-[#f2e205] text-slate-900" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {totalCalificaciones > 0 ? promedioGeneral.toFixed(1) : '0.0'}
          </span>
          <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">Escala de 1 a 5 rayos</p>
      </div>

      {/* KPI 2: Total Atenciones */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            Total Evaluaciones
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {totalCalificaciones}
          </span>
          <span className="text-xs text-slate-400 font-medium">respuestas</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">En el periodo filtrado</p>
      </div>

      {/* KPI 3: Satisfacción CSAT */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            Satisfacción CSAT
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
            {totalCalificaciones > 0 ? `${csatPorcentaje}%` : '0%'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">Votos positivos (4 y 5 rayos)</p>
      </div>

      {/* KPI 4: Tasa con Comentarios */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            Tasa de Sugerencias
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
            {totalCalificaciones > 0 ? `${tasaConComentario}%` : '0%'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">Clientes que dejaron texto</p>
      </div>
    </section>
  );
}

