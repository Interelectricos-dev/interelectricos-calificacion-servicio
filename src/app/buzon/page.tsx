'use client';

import React, { useEffect, useState, useTransition, useMemo } from 'react';
import { Asesor, asesorService } from '@/modules/asesores';
import { Calificacion, calificacionService } from '@/modules/calificaciones';
import { adminAuthService } from '@/modules/auth/auth.service';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { isSupabaseConfigured } from '@/config/env';
import {
  MessageSquare,
  Download,
  Search,
  Filter,
  Zap,
  Users,
  Calendar,
  RotateCcw,
} from 'lucide-react';

function getInitials(name?: string | null): string {
  if (!name) return 'AS';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function BuzonPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [filterAsesorId, setFilterAsesorId] = useState<string>('todos');
  const [filterRayos, setFilterRayos] = useState<'todos' | '5' | '4' | '3' | '2' | '1'>('todos');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  const [, startTransition] = useTransition();

  const isDbLive = isSupabaseConfigured();

  useEffect(() => {
    setIsAuthenticated(adminAuthService.isAuthenticated());
  }, []);

  const loadData = () => {
    startTransition(async () => {
      const [asesoresData, calificacionesData] = await Promise.all([
        asesorService.getAllAsesores(true),
        calificacionService.getAllCalificaciones(),
      ]);
      setAsesores(asesoresData);
      setCalificaciones(calificacionesData);
    });
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    adminAuthService.logout();
    setIsAuthenticated(false);
  };

  const isFiltered =
    search.trim() !== '' ||
    filterAsesorId !== 'todos' ||
    filterRayos !== 'todos' ||
    fechaDesde !== '' ||
    fechaHasta !== '';

  const handleResetFilters = () => {
    setSearch('');
    setFilterAsesorId('todos');
    setFilterRayos('todos');
    setFechaDesde('');
    setFechaHasta('');
  };

  const filteredCalificaciones = useMemo(() => {
    return calificaciones.filter((c) => {
      const asesor = asesores.find((a) => a.id === c.asesorId);
      const asesorNombre = asesor ? asesor.nombre.toLowerCase() : '';
      const textoComentario = (c.comentario || '').toLowerCase();
      const q = search.toLowerCase();

      // 1. Búsqueda por texto
      const matchesSearch = asesorNombre.includes(q) || textoComentario.includes(q);
      if (!matchesSearch) return false;

      // 2. Filtro por Asesor
      if (filterAsesorId !== 'todos' && c.asesorId !== filterAsesorId) {
        return false;
      }

      // 3. Filtro por Nivel de Rayos
      if (filterRayos !== 'todos' && c.estrellas !== parseInt(filterRayos, 10)) {
        return false;
      }

      // 4. Rango de Fechas (Desde - Hasta)
      const fechaRegistro = new Date(c.createdAt);
      if (fechaDesde) {
        const dDesde = new Date(`${fechaDesde}T00:00:00`);
        if (fechaRegistro < dDesde) return false;
      }

      if (fechaHasta) {
        const dHasta = new Date(`${fechaHasta}T23:59:59`);
        if (fechaRegistro > dHasta) return false;
      }

      return true;
    });
  }, [calificaciones, asesores, search, filterAsesorId, filterRayos, fechaDesde, fechaHasta]);

  const handleExportCSV = () => {
    if (filteredCalificaciones.length === 0) {
      alert('No hay calificaciones en el filtro actual para exportar.');
      return;
    }

    const headers = ['ID', 'Fecha y Hora', 'Asesor', 'Rayos', 'Comentario', 'Device ID'];
    const rows = filteredCalificaciones.map((c) => {
      const asesor = asesores.find((a) => a.id === c.asesorId);
      return [
        c.id,
        new Date(c.createdAt).toLocaleString('es-CO'),
        asesor ? asesor.nombre : 'Desconocido',
        c.estrellas,
        `"${(c.comentario || '').replace(/"/g, '""')}"`,
        c.deviceId || '',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `calificaciones_interelectricos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isAuthenticated === null) return <div className="min-h-screen bg-slate-950" />;
  if (!isAuthenticated) return <AdminLoginForm onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <AdminHeader
        onLogout={handleLogout}
        isDbLive={isDbLive}
        totalAsesores={asesores.length}
        totalCalificaciones={calificaciones.length}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Cabecera y Botón Exportar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Buzón de Opiniones de Clientes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Registro histórico y cualitativo de evaluaciones recibidas en mostrador en tiempo real.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-[#f2e205]" />
            <span>Exportar CSV ({filteredCalificaciones.length})</span>
          </button>
        </div>

        {/* Panel Completo de Filtros: Búsqueda, Asesor, Rayos y Fechas (Desde - Hasta) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs mb-6 flex flex-col gap-3">
          {/* Fila 1: Buscador y Selects */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
            {/* Buscador */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por texto de opinión o nombre de asesor..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f2e205] focus:border-slate-900 transition"
              />
            </div>

            {/* Select Asesor */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full lg:w-64">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex flex-col w-full min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Asesor</span>
                <select
                  value={filterAsesorId}
                  onChange={(e) => setFilterAsesorId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer truncate"
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

            {/* Select Calificación (Rayos) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full lg:w-52">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex flex-col w-full min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Calificación</span>
                <select
                  value={filterRayos}
                  onChange={(e) => setFilterRayos(e.target.value as 'todos' | '5' | '4' | '3' | '2' | '1')}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer truncate"
                >
                  <option value="todos">Todas las valoraciones</option>
                  <option value="5">⚡ 5 Rayos (Excelente)</option>
                  <option value="4">⚡ 4 Rayos (Muy bueno)</option>
                  <option value="3">⚡ 3 Rayos (Bueno)</option>
                  <option value="2">⚡ 2 Rayos (Regular)</option>
                  <option value="1">⚡ 1 Rayo (Malo)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fila 2: Rango de Fechas (Desde - Hasta) y Botón de Limpiar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Rango de Fecha:</span>
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-medium text-slate-400">Desde:</span>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-medium text-slate-400">Hasta:</span>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Restablecer Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Listado de Opiniones */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
          {filteredCalificaciones.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700">No se encontraron opiniones</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {isFiltered
                  ? 'No hay registros que coincidan con los criterios de búsqueda, asesor o fechas seleccionadas.'
                  : 'Las opiniones enviadas por los clientes aparecerán aquí en tiempo real.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {filteredCalificaciones.map((c) => {
                const asesor = asesores.find((a) => a.id === c.asesorId);
                return (
                  <div key={c.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-950 text-[#f2e205] flex items-center justify-center font-black text-xs shrink-0">
                          {getInitials(asesor?.nombre)}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900 block leading-tight">
                            {asesor ? asesor.nombre : 'Asesor Desconocido'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(c.createdAt).toLocaleString('es-CO', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1 self-start sm:self-auto bg-amber-50/80 px-2.5 py-1 rounded-full border border-amber-200/70">
                        {Array.from({ length: c.estrellas }).map((_, i) => (
                          <Zap key={i} className="w-3.5 h-3.5 fill-[#f2e205] text-slate-900" />
                        ))}
                        <span className="text-xs font-bold ml-1 text-slate-900">{c.estrellas}.0</span>
                      </div>
                    </div>

                    {c.comentario ? (
                      <p className="text-xs sm:text-sm text-slate-700 bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-200/60 leading-relaxed">
                        &ldquo;{c.comentario}&rdquo;
                      </p>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        (Sin comentario de texto)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
