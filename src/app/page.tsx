'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Asesor, asesorService } from '@/modules/asesores';
import { Calificacion, calificacionService } from '@/modules/calificaciones';
import { metricasService, ResumenMetricas, MetricasAsesor } from '@/modules/metricas/metricas.service';
import { adminAuthService } from '@/modules/auth/auth.service';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { CreateAsesorModal } from '@/components/admin/CreateAsesorModal';
import { QuickQrModal } from '@/components/admin/QuickQrModal';
import { isSupabaseConfigured, ENV } from '@/config/env';
import {
  Zap,
  QrCode,
  Users,
  LogOut,
  UserPlus,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Download,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [activeTab, setActiveTab] = useState<'asesores' | 'comentarios'>('asesores');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [qrModalAsesor, setQrModalAsesor] = useState<Asesor | null>(null);
  const [, startTransition] = useTransition();

  const isDbLive = isSupabaseConfigured();

  // Verificar sesión
  useEffect(() => {
    setIsAuthenticated(adminAuthService.isAuthenticated());
  }, []);

  // Cargar datos
  const loadData = () => {
    startTransition(async () => {
      const [asesoresData, calificacionesData] = await Promise.all([
        asesorService.getAllAsesores(true), // Incluir inactivos para auditoría
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

  const handleExportCSV = () => {
    if (calificaciones.length === 0) {
      alert('No hay calificaciones registradas para exportar.');
      return;
    }

    const headers = ['ID', 'Fecha', 'Asesor', 'Rayos', 'Comentario', 'Device ID'];
    const rows = calificaciones.map((c) => {
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

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  // Cálculos de métricas
  const metricasGenerales: ResumenMetricas = metricasService.calcularResumenGeneral(calificaciones);
  const metricasAsesores: MetricasAsesor[] = metricasService.agruparPorAsesor(asesores, calificaciones);
  const asesoresActivosCount = asesores.filter((a) => a.activo).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar Administrativa */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-interelectricos.png"
              alt={ENV.companyName}
              className="h-9 w-auto object-contain"
            />
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <span className="hidden sm:inline-block text-xs uppercase tracking-wider font-extrabold text-slate-500">
              Panel Administrativo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isDbLive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDbLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isDbLive ? 'Supabase Activo' : 'Modo Demo Local'}</span>
            </span>

            <Link
              href="/admin/qr"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Imprimir Fichas QR</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 print:hidden">
        {/* KPI Cards / Métricas Clave */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Promedio de Rayos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Promedio General</span>
              <div className="w-8 h-8 rounded-xl bg-yellow-50 text-[#111827] flex items-center justify-center">
                <Zap className="w-4 h-4 fill-[#f2e205] text-slate-900" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {metricasGenerales.promedioRayos}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Nivel de servicio global</p>
          </div>

          {/* Card 2: Total Calificaciones */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Atenciones Calificadas</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {metricasGenerales.totalCalificaciones}
              </span>
              <span className="text-xs text-slate-400 font-medium">votos</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Respuestas de clientes</p>
          </div>

          {/* Card 3: Satisfacción */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Satisfacción CSAT</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 tracking-tight">
                {metricasGenerales.porcentajeSatisfaccion}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Votos de 4 y 5 rayos</p>
          </div>

          {/* Card 4: Asesores */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Asesores Activos</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {asesoresActivosCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">de {asesores.length} total</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Puestos habilitados</p>
          </div>
        </section>

        {/* Barra de Pestañas y Acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('asesores')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'asesores'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gestión de Asesores ({asesores.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('comentarios')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'comentarios'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Buzón de Opiniones ({calificaciones.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'asesores' ? (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-[#f2e205] hover:bg-[#dfd003] active:scale-[0.99] text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Agregar Asesor</span>
              </button>
            ) : (
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Download className="w-4 h-4 text-[#f2e205]" />
                <span>Exportar CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Contenido Pestaña 1: Asesores */}
        {activeTab === 'asesores' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Asesor</th>
                    <th className="py-3.5 px-6">Código Slug (QR)</th>
                    <th className="py-3.5 px-6 text-center">Calificación</th>
                    <th className="py-3.5 px-6 text-center">Estado</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metricasAsesores.map(({ asesor, promedio, total }) => (
                    <tr
                      key={asesor.id}
                      className={`hover:bg-slate-50/80 transition ${!asesor.activo ? 'opacity-60 bg-slate-50/40' : ''}`}
                    >
                      {/* Nombre y Cargo */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm tracking-wide ${
                              asesor.activo
                                ? 'bg-slate-900 text-[#f2e205]'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {asesor.nombre.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 block">{asesor.nombre}</span>
                            <span className="text-[11px] text-slate-400">{asesor.cargo || 'Asesor Comercial'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Slug QR */}
                      <td className="py-4 px-6 font-mono text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                          {asesor.codigoSlug}
                        </span>
                      </td>

                      {/* Calificación */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 border border-yellow-200/60 font-bold text-slate-900">
                          <Zap className="w-3.5 h-3.5 fill-[#f2e205] text-slate-900" />
                          <span>{promedio}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({total} votos)</span>
                        </div>
                      </td>

                      {/* Estado: Activo o De Baja */}
                      <td className="py-4 px-6 text-center">
                        {asesor.activo ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            <XCircle className="w-3 h-3" />
                            <span>De Baja</span>
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ver QR */}
                          <button
                            onClick={() => setQrModalAsesor(asesor)}
                            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
                            title="Ver Código QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Probar Formulario */}
                          <Link
                            href={`/calificar?asesor=${encodeURIComponent(asesor.codigoSlug)}`}
                            target="_blank"
                            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                            title="Probar vista del cliente"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Botón Dar de baja / Reactivar */}
                          <button
                            onClick={() => handleToggleStatus(asesor)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
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
          </div>
        )}

        {/* Contenido Pestaña 2: Comentarios */}
        {activeTab === 'comentarios' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            {calificaciones.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">Aún no hay calificaciones registradas.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Las opiniones enviadas por los clientes aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {calificaciones.map((c) => {
                  const asesor = asesores.find((a) => a.id === c.asesorId);
                  return (
                    <div key={c.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {asesor ? asesor.nombre : 'Asesor'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            • {new Date(c.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-0.5 rounded-full border border-yellow-200/80">
                          {Array.from({ length: c.estrellas }).map((_, i) => (
                            <Zap key={i} className="w-3.5 h-3.5 fill-[#f2e205] text-slate-900" />
                          ))}
                          <span className="text-xs font-bold ml-1 text-slate-900">{c.estrellas}.0</span>
                        </div>
                      </div>

                      {c.comentario ? (
                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
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
        )}
      </main>

      {/* Modales */}
      <CreateAsesorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadData}
      />

      <QuickQrModal
        asesor={qrModalAsesor}
        onClose={() => setQrModalAsesor(null)}
      />
    </div>
  );
}
