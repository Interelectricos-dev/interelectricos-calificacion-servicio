'use client';

import React, { useEffect, useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { Asesor, asesorService } from '@/modules/asesores';
import { Calificacion, calificacionService } from '@/modules/calificaciones';
import { metricasService } from '@/modules/metricas/metricas.service';
import { adminAuthService } from '@/modules/auth/auth.service';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CreateAsesorModal } from '@/components/admin/CreateAsesorModal';
import { EditAsesorModal } from '@/components/admin/EditAsesorModal';
import { QuickQrModal } from '@/components/admin/QuickQrModal';
import { isSupabaseConfigured } from '@/config/env';
import {
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Pencil,
  QrCode,
  ExternalLink,
  Search,
  Filter,
  Zap,
} from 'lucide-react';

function getInitials(name?: string | null): string {
  if (!name) return 'AS';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AsesoresPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAsesor, setEditingAsesor] = useState<Asesor | null>(null);
  const [qrModalAsesor, setQrModalAsesor] = useState<Asesor | null>(null);
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

  const handleToggleStatus = async (asesor: Asesor) => {
    const nuevoEstado = !asesor.activo;
    const confirmMessage = nuevoEstado
      ? `¿Deseas reactivar al asesor ${asesor.nombre}?`
      : `¿Estás seguro de dar de baja a ${asesor.nombre}? No podrá recibir nuevas calificaciones pero su histórico se mantendrá intacto.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      await asesorService.toggleAsesorStatus(asesor.id, nuevoEstado);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar asesor');
    }
  };

  const metricasAsesores = useMemo(() => {
    return metricasService.agruparPorAsesor(asesores, calificaciones);
  }, [asesores, calificaciones]);

  const filteredAsesores = useMemo(() => {
    return metricasAsesores.filter(({ asesor }) => {
      const q = search.toLowerCase();
      const matchesSearch =
        asesor.nombre.toLowerCase().includes(q) ||
        (asesor.cargo && asesor.cargo.toLowerCase().includes(q)) ||
        asesor.codigoSlug.toLowerCase().includes(q);

      const matchesStatus =
        filterEstado === 'todos'
          ? true
          : filterEstado === 'activos'
          ? asesor.activo
          : !asesor.activo;

      return matchesSearch && matchesStatus;
    });
  }, [metricasAsesores, search, filterEstado]);

  if (isAuthenticated === null) return <div className="min-h-screen bg-slate-950" />;
  if (!isAuthenticated) return <AdminLoginForm onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className={`min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans ${qrModalAsesor ? 'modal-qr-active' : ''}`}>
      <AdminHeader
        onLogout={handleLogout}
        isDbLive={isDbLive}
        totalAsesores={asesores.length}
        totalCalificaciones={calificaciones.length}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 print-hide-when-modal">
        {/* Cabecera y Botón Nuevo Asesor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestión de Asesores de Mostrador
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Administra el personal habilitado, códigos QR únicos y estado operativo.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#f2e205] hover:bg-[#e5d604] active:scale-95 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Asesor</span>
          </button>
        </div>

        {/* Barra de Búsqueda y Filtro de Estado */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs mb-5 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, cargo o código slug..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f2e205] focus:border-slate-900 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Estado:</span>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as 'todos' | 'activos' | 'inactivos')}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos ({asesores.length})</option>
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo dados de baja</option>
            </select>
          </div>
        </div>

        {/* Tabla de Asesores */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {filteredAsesores.length === 0 ? (
            <div className="py-16 text-center text-slate-400 px-4">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700">No se encontraron asesores</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {search || filterEstado !== 'todos'
                  ? 'No hay colaboradores que coincidan con la búsqueda o filtro aplicado.'
                  : 'Comienza agregando al primer asesor de mostrador.'}
              </p>
            </div>
          ) : (
            <>
              {/* Escritorio */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Asesor</th>
                      <th className="py-3.5 px-6">Código QR (Slug)</th>
                      <th className="py-3.5 px-6 text-center">Calificación</th>
                      <th className="py-3.5 px-6 text-center">Estado</th>
                      <th className="py-3.5 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAsesores.map(({ asesor, promedio, total }) => (
                      <tr
                        key={asesor.id}
                        className={`hover:bg-slate-50/70 transition ${!asesor.activo ? 'opacity-60 bg-slate-50/30' : ''}`}
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs tracking-wide shrink-0 ${
                                asesor.activo
                                  ? 'bg-slate-950 text-[#f2e205]'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {getInitials(asesor.nombre)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-sm text-slate-900 block truncate">
                                {asesor.nombre}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {asesor.cargo || 'Asesor Comercial'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-6 font-mono text-slate-500">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200/60">
                            {asesor.codigoSlug}
                          </span>
                        </td>

                        <td className="py-3.5 px-6 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/80 border border-amber-200/60 font-bold text-slate-900">
                            <Zap className="w-3.5 h-3.5 fill-[#f2e205] text-slate-900" />
                            <span>{promedio > 0 ? promedio : '-'}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({total} {total === 1 ? 'voto' : 'votos'})
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-6 text-center">
                          {asesor.activo ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Activo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                              <XCircle className="w-3 h-3" />
                              <span>De Baja</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingAsesor(asesor)}
                              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                              title="Editar Asesor"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setQrModalAsesor(asesor)}
                              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                              title="Ver Código QR"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/calificar?asesor=${encodeURIComponent(asesor.codigoSlug)}&mode=test`}
                              target="_blank"
                              className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                              title="Probar Formulario Móvil (Modo Test)"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              onClick={() => handleToggleStatus(asesor)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                                asesor.activo
                                  ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                                  : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                              }`}
                            >
                              {asesor.activo ? 'Dar de baja' : 'Reactivar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Móvil */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredAsesores.map(({ asesor, promedio, total }) => (
                  <div
                    key={asesor.id}
                    className={`p-4 flex flex-col gap-3 ${!asesor.activo ? 'opacity-65 bg-slate-50/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            asesor.activo
                              ? 'bg-slate-950 text-[#f2e205]'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {getInitials(asesor.nombre)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-slate-900 block truncate">{asesor.nombre}</span>
                          <span className="text-xs text-slate-400 block truncate">{asesor.cargo || 'Asesor Comercial'}</span>
                        </div>
                      </div>

                      {asesor.activo ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                          <XCircle className="w-3 h-3" />
                          <span>De Baja</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Zap className="w-3.5 h-3.5 fill-[#f2e205] text-slate-900" />
                        <span>{promedio > 0 ? `${promedio} / 5.0` : 'Sin votos'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({total})</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        /{asesor.codigoSlug}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setEditingAsesor(asesor)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => setQrModalAsesor(asesor)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <QrCode className="w-3.5 h-3.5 text-slate-900" />
                        <span>QR</span>
                      </button>

                      <Link
                        href={`/calificar?asesor=${encodeURIComponent(asesor.codigoSlug)}&mode=test`}
                        target="_blank"
                        className="py-2 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center justify-center transition"
                        title="Probar vista cliente (Modo Test)"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleToggleStatus(asesor)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition ${
                          asesor.activo
                            ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {asesor.activo ? 'Baja' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modales */}
      <CreateAsesorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadData}
      />

      <EditAsesorModal
        asesor={editingAsesor}
        isOpen={Boolean(editingAsesor)}
        onClose={() => setEditingAsesor(null)}
        onUpdated={loadData}
      />

      <QuickQrModal
        asesor={qrModalAsesor}
        onClose={() => setQrModalAsesor(null)}
      />
    </div>
  );
}

