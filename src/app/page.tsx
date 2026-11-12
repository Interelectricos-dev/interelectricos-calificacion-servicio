'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Asesor, asesorService } from '@/modules/asesores';
import { Calificacion, calificacionService } from '@/modules/calificaciones';
import { metricasService, ResumenMetricas, MetricasAsesor } from '@/modules/metricas/metricas.service';
import { adminAuthService } from '@/modules/auth/auth.service';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { CreateAsesorModal } from '@/components/admin/CreateAsesorModal';
import { EditAsesorModal } from '@/components/admin/EditAsesorModal';
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
  Pencil,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [activeTab, setActiveTab] = useState<'asesores' | 'comentarios'>('asesores');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAsesor, setEditingAsesor] = useState<Asesor | null>(null);
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
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Administrativa Ejecutiva */}
      <header className="bg-slate-950 text-white sticky top-0 z-30 shadow-md border-b border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo e Identidad */}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-interelectricos.png"
                alt={ENV.companyName}
                className="h-8 w-auto object-contain brightness-0 invert"
              />
              <div className="hidden md:block h-5 w-px bg-slate-800" />
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-bold tracking-tight text-white leading-none">
                  Gestión de Calidad
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  Atención en Mostrador
                </span>
              </div>
            </div>

            {/* Navegación de Vistas (Tabs) para Pantallas Medianas y Grandes */}
            <nav className="hidden sm:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('asesores')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'asesores'
                    ? 'bg-[#f2e205] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Asesores</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'asesores' ? 'bg-slate-950/15 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {asesores.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('comentarios')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'comentarios'
                    ? 'bg-[#f2e205] text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Buzón</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'comentarios' ? 'bg-slate-950/15 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {calificaciones.length}
                </span>
              </button>
            </nav>

            {/* Acciones del Header */}
            <div className="flex items-center gap-2">
              {/* Badge de Conexión */}
              <span
                className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                  isDbLive
                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                    : 'bg-amber-950/50 text-amber-300 border-amber-800/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isDbLive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span>{isDbLive ? 'Supabase Conectado' : 'Modo Demo'}</span>
              </span>

              {/* Enlace Fichas QR */}
              <Link
                href="/admin/qr"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 active:scale-95 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 flex items-center gap-1.5 transition"
              >
                <QrCode className="w-3.5 h-3.5 text-[#f2e205]" />
                <span className="hidden sm:inline">Fichas QR</span>
              </Link>

              {/* Botón Salir */}
              <button
                onClick={handleLogout}
                className="p-2 sm:px-3 sm:py-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          {/* Navegación móvil inferior (aparece en pantallas pequeñas) */}
          <div className="flex sm:hidden items-center justify-around py-2 border-t border-slate-850 gap-2">
            <button
              onClick={() => setActiveTab('asesores')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'asesores'
                  ? 'bg-[#f2e205] text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Asesores ({asesores.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('comentarios')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'comentarios'
                  ? 'bg-[#f2e205] text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Buzón ({calificaciones.length})</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 print:hidden">
        {/* KPI Cards / Métricas Clave */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
          {/* Card 1: Promedio de Rayos */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Promedio General</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Zap className="w-4 h-4 fill-[#f2e205] text-slate-900" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {metricasGenerales.totalCalificaciones > 0 ? metricasGenerales.promedioRayos : '0.0'}
              </span>
              <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Nivel de servicio global</p>
          </div>

          {/* Card 2: Total Calificaciones */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Atenciones</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {metricasGenerales.totalCalificaciones}
              </span>
              <span className="text-xs text-slate-400 font-medium">calificaciones</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Clientes evaluados</p>
          </div>

          {/* Card 3: Satisfacción */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Satisfacción CSAT</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                {metricasGenerales.totalCalificaciones > 0 ? `${metricasGenerales.porcentajeSatisfaccion}%` : '0%'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Votos positivos (4 y 5 rayos)</p>
          </div>

          {/* Card 4: Asesores */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">Asesores Activos</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {asesoresActivosCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">de {asesores.length} total</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Puestos habilitados</p>
          </div>
        </section>

        {/* Barra de Título de Sección y Botón de Acción Principal */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'asesores' ? 'Equipo de Mostrador' : 'Buzón de Opiniones'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'asesores'
                ? 'Monitorea el desempeño individual, códigos QR y estado de cada asesor.'
                : 'Historial detallado de comentarios y valoraciones recibidas en tiempo real.'}
            </p>
          </div>

          <div>
            {activeTab === 'asesores' ? (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#f2e205] hover:bg-[#e5d604] active:scale-95 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Asesor</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            ) : (
              <button
                onClick={handleExportCSV}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#f2e205]" />
                <span className="hidden sm:inline">Exportar CSV</span>
                <span className="sm:hidden">Exportar</span>
              </button>
            )}
          </div>
        </div>

        {/* Contenido Pestaña 1: Asesores */}
        {activeTab === 'asesores' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {asesores.length === 0 ? (
              <div className="py-16 text-center text-slate-400 px-4">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-700">No hay asesores registrados aún</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Agrega al primer asesor para generar automáticamente su código QR y comenzar a registrar calificaciones.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-[#f2e205] hover:bg-[#e5d604] text-slate-950 text-xs font-black rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Agregar Primer Asesor</span>
                </button>
              </div>
            ) : (
              <>
                {/* Vista en Tabla para Escritorio / Pantallas Medianas (hidden en móviles) */}
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
                      {metricasAsesores.map(({ asesor, promedio, total }) => (
                        <tr
                          key={asesor.id}
                          className={`hover:bg-slate-50/70 transition ${!asesor.activo ? 'opacity-60 bg-slate-50/30' : ''}`}
                        >
                          {/* Asesor y Cargo */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs tracking-wide shrink-0 ${
                                  asesor.activo
                                    ? 'bg-slate-950 text-[#f2e205]'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {asesor.nombre.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-sm text-slate-900 block truncate">{asesor.nombre}</span>
                                <span className="text-[11px] text-slate-400 truncate block">{asesor.cargo || 'Asesor Comercial'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Slug QR */}
                          <td className="py-3.5 px-6 font-mono text-slate-500">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200/60">
                              {asesor.codigoSlug}
                            </span>
                          </td>

                          {/* Calificación */}
                          <td className="py-3.5 px-6 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/80 border border-amber-200/60 font-bold text-slate-900">
                              <Zap className="w-3.5 h-3.5 fill-[#f2e205] text-slate-900" />
                              <span>{promedio > 0 ? promedio : '-'}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({total} {total === 1 ? 'voto' : 'votos'})
                              </span>
                            </div>
                          </td>

                          {/* Estado */}
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

                          {/* Acciones */}
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
                                href={`/calificar?asesor=${encodeURIComponent(asesor.codigoSlug)}`}
                                target="_blank"
                                className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                                title="Abrir Formulario Móvil"
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

                {/* Vista en Tarjetas Móviles (visible solo en móviles y tablets estrechas) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {metricasAsesores.map(({ asesor, promedio, total }) => (
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
                            {asesor.nombre.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-slate-900 block truncate">{asesor.nombre}</span>
                            <span className="text-xs text-slate-400 block truncate">{asesor.cargo || 'Asesor Comercial'}</span>
                          </div>
                        </div>

                        {/* Estado */}
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

                      {/* Métricas y Slug en Móvil */}
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

                      {/* Botonera de Acciones en Móvil */}
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
                          href={`/calificar?asesor=${encodeURIComponent(asesor.codigoSlug)}`}
                          target="_blank"
                          className="py-2 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center justify-center transition"
                          title="Probar vista cliente"
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
        )}

        {/* Contenido Pestaña 2: Comentarios */}
        {activeTab === 'comentarios' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
            {calificaciones.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-700">Aún no hay calificaciones registradas</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Las opiniones enviadas por los clientes desde sus dispositivos móviles aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {calificaciones.map((c) => {
                  const asesor = asesores.find((a) => a.id === c.asesorId);
                  return (
                    <div key={c.id} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-950 text-[#f2e205] flex items-center justify-center font-black text-xs shrink-0">
                            {asesor ? asesor.nombre.substring(0, 2).toUpperCase() : 'AS'}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-slate-900 block leading-tight">
                              {asesor ? asesor.nombre : 'Asesor Desconocido'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(c.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
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
        )}
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
