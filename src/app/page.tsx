'use client';

import React, { useEffect, useState, useTransition, useMemo } from 'react';
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
  ExternalLink,
  TrendingUp,
  Pencil,
  Search,
  Filter,
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

  // Estados de Búsqueda y Filtro para Asesores
  const [searchAsesor, setSearchAsesor] = useState('');
  const [filterEstadoAsesor, setFilterEstadoAsesor] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  // Estados de Búsqueda y Filtro para Buzón
  const [searchComentario, setSearchComentario] = useState('');
  const [filterRayosComentario, setFilterRayosComentario] = useState<'todos' | '5' | '4' | '3' | '2' | '1'>('todos');

  const isDbLive = isSupabaseConfigured();

  // Verificar sesión
  useEffect(() => {
    setIsAuthenticated(adminAuthService.isAuthenticated());
  }, []);

  // Cargar datos
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

  // Cálculos de métricas
  const metricasGenerales: ResumenMetricas = useMemo(
    () => metricasService.calcularResumenGeneral(calificaciones),
    [calificaciones]
  );
  const metricasAsesores: MetricasAsesor[] = useMemo(
    () => metricasService.agruparPorAsesor(asesores, calificaciones),
    [asesores, calificaciones]
  );
  const asesoresActivosCount = useMemo(
    () => asesores.filter((a) => a.activo).length,
    [asesores]
  );

  // Filtrado de Asesores por búsqueda y estado
  const filteredMetricasAsesores = useMemo(() => {
    return metricasAsesores.filter(({ asesor }) => {
      const matchesSearch =
        asesor.nombre.toLowerCase().includes(searchAsesor.toLowerCase()) ||
        (asesor.cargo && asesor.cargo.toLowerCase().includes(searchAsesor.toLowerCase())) ||
        asesor.codigoSlug.toLowerCase().includes(searchAsesor.toLowerCase());

      const matchesStatus =
        filterEstadoAsesor === 'todos'
          ? true
          : filterEstadoAsesor === 'activos'
          ? asesor.activo
          : !asesor.activo;

      return matchesSearch && matchesStatus;
    });
  }, [metricasAsesores, searchAsesor, filterEstadoAsesor]);

  // Filtrado de Comentarios del Buzón por búsqueda y estrellas
  const filteredCalificaciones = useMemo(() => {
    return calificaciones.filter((c) => {
      const asesor = asesores.find((a) => a.id === c.asesorId);
      const asesorNombre = asesor ? asesor.nombre.toLowerCase() : '';
      const textoComentario = (c.comentario || '').toLowerCase();
      const query = searchComentario.toLowerCase();

      const matchesSearch =
        asesorNombre.includes(query) || textoComentario.includes(query);

      const matchesEstrellas =
        filterRayosComentario === 'todos'
          ? true
          : c.estrellas === parseInt(filterRayosComentario, 10);

      return matchesSearch && matchesEstrellas;
    });
  }, [calificaciones, asesores, searchComentario, filterRayosComentario]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Administrativa Ejecutiva */}
      <header className="bg-slate-950 text-white sticky top-0 z-30 shadow-md border-b border-slate-800 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo e Identidad (Contenedor blanco nítido para que el logo destaque perfecto) */}
            <div className="flex items-center gap-3">
              <div className="bg-white px-2 py-1 rounded-lg flex items-center justify-center shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/logo-interelectricos.png"
                  alt={ENV.companyName}
                  className="h-6 w-auto object-contain"
                />
              </div>
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

            {/* Menú de 3 Opciones Pegadas y Más Grandes (Asesores, Buzón, Fichas QR) */}
            <nav className="hidden sm:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('asesores')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'asesores'
                    ? 'bg-[#f2e205] text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Asesores</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'asesores' ? 'bg-slate-950/15 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {asesores.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('comentarios')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'comentarios'
                    ? 'bg-[#f2e205] text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Buzón</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'comentarios' ? 'bg-slate-950/15 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {calificaciones.length}
                </span>
              </button>

              <Link
                href="/admin/qr"
                className="px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#f2e205]" />
                <span>Fichas QR</span>
              </Link>
            </nav>

            {/* Acciones Derecha (Punto verde Supabase simple y Salir) */}
            <div className="flex items-center gap-3">
              {/* Indicador Simple de Supabase */}
              <div
                className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-medium"
                title={isDbLive ? 'Supabase conectado' : 'Modo demostración'}
              >
                <span className={`w-2 h-2 rounded-full ${isDbLive ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50' : 'bg-amber-400'}`} />
                <span>Supabase</span>
              </div>

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

          {/* Menú Móvil Inferior con las 3 opciones pegadas */}
          <div className="flex sm:hidden items-center justify-around py-2 border-t border-slate-850 gap-1">
            <button
              onClick={() => setActiveTab('asesores')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'asesores'
                  ? 'bg-[#f2e205] text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Asesores ({asesores.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('comentarios')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'comentarios'
                  ? 'bg-[#f2e205] text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Buzón ({calificaciones.length})</span>
            </button>
            <Link
              href="/admin/qr"
              className="flex-1 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-[#f2e205]" />
              <span>Fichas QR</span>
            </Link>
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

        {/* Barra de Título de Sección, Búsqueda, Filtro y Botón Principal */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between gap-4">
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

          {/* Barra de Búsqueda y Combo Select de Filtrado */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5">
            {/* Input de Búsqueda */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={activeTab === 'asesores' ? searchAsesor : searchComentario}
                onChange={(e) =>
                  activeTab === 'asesores'
                    ? setSearchAsesor(e.target.value)
                    : setSearchComentario(e.target.value)
                }
                placeholder={
                  activeTab === 'asesores'
                    ? 'Buscar asesor por nombre, cargo o código...'
                    : 'Buscar en comentarios o por nombre de asesor...'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f2e205] focus:border-slate-900 transition"
              />
            </div>

            {/* Select de Filtrado */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Filtrar:</span>
                {activeTab === 'asesores' ? (
                  <select
                    value={filterEstadoAsesor}
                    onChange={(e) =>
                      setFilterEstadoAsesor(e.target.value as 'todos' | 'activos' | 'inactivos')
                    }
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activos">Solo activos</option>
                    <option value="inactivos">Solo dados de baja</option>
                  </select>
                ) : (
                  <select
                    value={filterRayosComentario}
                    onChange={(e) =>
                      setFilterRayosComentario(e.target.value as 'todos' | '5' | '4' | '3' | '2' | '1')
                    }
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="todos">Todas las calificaciones</option>
                    <option value="5">⚡ 5 Rayos (Excelente)</option>
                    <option value="4">⚡ 4 Rayos (Muy bueno)</option>
                    <option value="3">⚡ 3 Rayos (Bueno)</option>
                    <option value="2">⚡ 2 Rayos (Regular)</option>
                    <option value="1">⚡ 1 Rayo (Malo)</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Pestaña 1: Asesores */}
        {activeTab === 'asesores' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {filteredMetricasAsesores.length === 0 ? (
              <div className="py-16 text-center text-slate-400 px-4">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-700">No se encontraron asesores</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchAsesor || filterEstadoAsesor !== 'todos'
                    ? 'No hay asesores que coincidan con la búsqueda o el filtro seleccionado.'
                    : 'Agrega al primer asesor para generar su código QR y registrar calificaciones.'}
                </p>
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
                      {filteredMetricasAsesores.map(({ asesor, promedio, total }) => (
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

                {/* Vista en Tarjetas Móviles (visible solo en móviles y tablets estrechas) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredMetricasAsesores.map(({ asesor, promedio, total }) => (
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
        )}

        {/* Contenido Pestaña 2: Comentarios */}
        {activeTab === 'comentarios' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
            {filteredCalificaciones.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-slate-700">No se encontraron opiniones</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchComentario || filterRayosComentario !== 'todos'
                    ? 'No hay registros que coincidan con la búsqueda o el filtro de calificación.'
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
