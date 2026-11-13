import React from 'react';
import { Asesor } from '@/modules/asesores';
import { FiltrosAnalitica } from '@/modules/metricas/services/analitica.service';
import { Calendar, Users, Filter, RotateCcw } from 'lucide-react';

interface DashboardFiltersBarProps {
  filtros: FiltrosAnalitica;
  onChange: (nuevosFiltros: FiltrosAnalitica) => void;
  aniosDisponibles: number[];
  asesores: Asesor[];
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function DashboardFiltersBar({
  filtros,
  onChange,
  aniosDisponibles,
  asesores,
}: DashboardFiltersBarProps) {
  const isFiltered =
    filtros.year !== 'todos' ||
    filtros.month !== 'todos' ||
    filtros.asesorId !== 'todos' ||
    filtros.estrellas !== 'todos';

  const handleReset = () => {
    onChange({
      year: 'todos',
      month: 'todos',
      asesorId: 'todos',
      estrellas: 'todos',
    });
  };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-6 font-sans">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Filtros Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
          {/* 1. Año */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex flex-col w-full min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Año</span>
              <select
                value={filtros.year}
                onChange={(e) =>
                  onChange({
                    ...filtros,
                    year: e.target.value === 'todos' ? 'todos' : parseInt(e.target.value, 10),
                  })
                }
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
              >
                <option value="todos">Todos los años</option>
                {aniosDisponibles.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Mes */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex flex-col w-full min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mes</span>
              <select
                value={filtros.month}
                onChange={(e) =>
                  onChange({
                    ...filtros,
                    month: e.target.value === 'todos' ? 'todos' : parseInt(e.target.value, 10),
                  })
                }
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
              >
                <option value="todos">Todos los meses</option>
                {MESES.map((nombreMes, idx) => (
                  <option key={idx} value={idx}>
                    {nombreMes}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Asesor */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex flex-col w-full min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asesor</span>
              <select
                value={filtros.asesorId}
                onChange={(e) =>
                  onChange({
                    ...filtros,
                    asesorId: e.target.value,
                  })
                }
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
              >
                <option value="todos">Todos los asesores</option>
                {asesores.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Calificación */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex flex-col w-full min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rayos</span>
              <select
                value={filtros.estrellas}
                onChange={(e) =>
                  onChange({
                    ...filtros,
                    estrellas: e.target.value === 'todos' ? 'todos' : parseInt(e.target.value, 10),
                  })
                }
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
              >
                <option value="todos">Todas (1 a 5)</option>
                <option value="5">⚡ 5 Rayos</option>
                <option value="4">⚡ 4 Rayos</option>
                <option value="3">⚡ 3 Rayos</option>
                <option value="2">⚡ 2 Rayos</option>
                <option value="1">⚡ 1 Rayo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botón de Limpiar Filtros */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Restablecer Filtros</span>
          </button>
        )}
      </div>
    </div>
  );
}

