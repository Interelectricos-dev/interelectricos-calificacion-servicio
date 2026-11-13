'use client';

import React, { useEffect, useState, useTransition, useMemo } from 'react';
import { Asesor, asesorService } from '@/modules/asesores';
import { Calificacion, calificacionService } from '@/modules/calificaciones';
import {
  analiticaService,
  FiltrosAnalitica,
  ResultadoAnalitica,
} from '@/modules/metricas/services/analitica.service';
import { adminAuthService } from '@/modules/auth/auth.service';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { KpiCardsGrid } from '@/components/admin/dashboard/KpiCardsGrid';
import { DashboardFiltersBar } from '@/components/admin/dashboard/DashboardFiltersBar';
import { RatingDistributionChart } from '@/components/admin/dashboard/RatingDistributionChart';
import { BehaviorTrends } from '@/components/admin/dashboard/BehaviorTrends';
import { AdvisorLeaderboard } from '@/components/admin/dashboard/AdvisorLeaderboard';
import { isSupabaseConfigured } from '@/config/env';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [, startTransition] = useTransition();

  // Filtros dimensionales y temporales
  const [filtros, setFiltros] = useState<FiltrosAnalitica>({
    year: 'todos',
    month: 'todos',
    asesorId: 'todos',
    estrellas: 'todos',
  });

  const isDbLive = isSupabaseConfigured();

  // Verificar sesión administrativa
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

  // Filtrado y cómputo de métricas en memoria (0ms lag)
  const calificacionesFiltradas = useMemo(() => {
    return analiticaService.filtrarCalificaciones(calificaciones, filtros);
  }, [calificaciones, filtros]);

  const resultadoAnalitica: ResultadoAnalitica = useMemo(() => {
    return analiticaService.calcularAnaliticaCompleta(
      calificacionesFiltradas,
      calificaciones,
      asesores
    );
  }, [calificacionesFiltradas, calificaciones, asesores]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Header Administrativo Unificado */}
      <AdminHeader
        onLogout={handleLogout}
        isDbLive={isDbLive}
        totalAsesores={asesores.length}
        totalCalificaciones={calificaciones.length}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Título de la Sección Ejecutiva */}
        <div className="mb-5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Ejecutivo de Calidad
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analítica de satisfacción, rendimiento de asesores y tendencias de atención en mostrador.
          </p>
        </div>

        {/* Barra de Filtros por Año, Mes, Asesor y Calificación */}
        <DashboardFiltersBar
          filtros={filtros}
          onChange={setFiltros}
          aniosDisponibles={resultadoAnalitica.aniosDisponibles}
          asesores={asesores}
        />

        {/* Cuadrícula de 4 Tarjetas de Métricas Clave (KPIs) */}
        <KpiCardsGrid
          totalCalificaciones={resultadoAnalitica.totalCalificaciones}
          promedioGeneral={resultadoAnalitica.promedioGeneral}
          csatPorcentaje={resultadoAnalitica.csatPorcentaje}
          tasaConComentario={resultadoAnalitica.tendencias.tasaConComentario}
        />

        {/* Sección Central: Distribución de Rayos y Tendencias de Comportamiento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <RatingDistributionChart
            distribucion={resultadoAnalitica.distribucion}
            totalCalificaciones={resultadoAnalitica.totalCalificaciones}
          />
          <BehaviorTrends tendencias={resultadoAnalitica.tendencias} />
        </div>

        {/* Sección Inferior: Cuadro de Honor / Ranking de Desempeño */}
        <AdvisorLeaderboard ranking={resultadoAnalitica.ranking} />
      </main>
    </div>
  );
}
