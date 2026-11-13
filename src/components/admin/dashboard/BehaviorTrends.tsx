import React from 'react';
import { TendenciasComportamiento } from '@/modules/metricas/services/analitica.service';
import { CalendarDays, Clock, MessageSquareText } from 'lucide-react';

interface BehaviorTrendsProps {
  tendencias: TendenciasComportamiento;
}

export function BehaviorTrends({ tendencias }: BehaviorTrendsProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between font-sans">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
          Comportamiento y Tendencias
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Patrones de interacción detectados en los mostradores.
        </p>

        <div className="flex flex-col gap-4">
          {/* 1. Día más activo */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Día con Mayor Afluencia
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {tendencias.diaMasActivo.dia}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {tendencias.diaMasActivo.total} evaluaciones registradas
              </p>
            </div>
          </div>

          {/* 2. Franja Horaria Pico */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Franja Horaria Pico
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {tendencias.franjaPico.franja}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mayor concentración de calificaciones en mostrador
              </p>
            </div>
          </div>

          {/* 3. Compromiso Cualitativo */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <MessageSquareText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Compromiso Cualitativo
              </span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">
                {tendencias.tasaConComentario}% con comentarios
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Proporción de clientes que aportaron retroalimentación escrita
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        Basado en registros en tiempo real
      </div>
    </div>
  );
}

