import React from 'react';
import { DistribucionNivel } from '@/modules/metricas/services/analitica.service';
import { Zap } from 'lucide-react';

interface RatingDistributionChartProps {
  distribucion: DistribucionNivel[];
  totalCalificaciones: number;
}

export function RatingDistributionChart({
  distribucion,
  totalCalificaciones,
}: RatingDistributionChartProps) {
  // Paleta corporativa sobria según nivel
  const getBarColor = (estrellas: number) => {
    switch (estrellas) {
      case 5:
        return 'bg-[#f2e205]'; // Amarillo eléctrico principal
      case 4:
        return 'bg-amber-400';
      case 3:
        return 'bg-slate-400';
      case 2:
        return 'bg-orange-400';
      case 1:
        return 'bg-rose-500';
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between font-sans">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Distribución de Calificaciones
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            {totalCalificaciones} total
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Proporción de valoraciones recibidas de 1 a 5 rayos.
        </p>

        {/* Barras de distribución */}
        <div className="flex flex-col gap-3">
          {distribucion.map(({ estrellas, conteo, porcentaje }) => (
            <div key={estrellas} className="flex items-center gap-3">
              {/* Etiqueta de Rayos */}
              <div className="flex items-center gap-1 w-14 shrink-0 text-xs font-bold text-slate-700">
                <span>{estrellas}</span>
                <Zap className="w-3.5 h-3.5 fill-[#f2e205] text-slate-900" />
              </div>

              {/* Barra de Progreso CSS Nativa (Ultra-rápida, 0ms overhead) */}
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                    estrellas
                  )}`}
                  style={{ width: `${totalCalificaciones > 0 ? porcentaje : 0}%` }}
                />
              </div>

              {/* Conteo y Porcentaje */}
              <div className="w-20 text-right shrink-0">
                <span className="text-xs font-bold text-slate-900">{porcentaje}%</span>
                <span className="text-[10px] text-slate-400 ml-1">({conteo})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Zona positiva: 4 y 5 rayos</span>
        <span className="font-semibold text-slate-600">Alta fidelidad</span>
      </div>
    </div>
  );
}

