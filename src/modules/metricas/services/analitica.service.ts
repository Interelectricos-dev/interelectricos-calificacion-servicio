import { Calificacion } from '@/modules/calificaciones';
import { Asesor } from '@/modules/asesores';

export interface FiltrosAnalitica {
  year?: number | 'todos';
  month?: number | 'todos'; // 0 = Enero, 11 = Diciembre
  asesorId?: string | 'todos';
  estrellas?: number | 'todos';
}

export interface DistribucionNivel {
  estrellas: number;
  conteo: number;
  porcentaje: number;
}

export interface RankingAsesor {
  asesor: Asesor;
  totalVotos: number;
  promedio: number;
  csat: number;
  conComentarios: number;
  posicion: number;
}

export interface TendenciasComportamiento {
  diaMasActivo: { dia: string; total: number };
  franjaPico: { franja: string; total: number };
  tasaConComentario: number; // Porcentaje de calificaciones que incluyeron texto
}

export interface ResultadoAnalitica {
  totalCalificaciones: number;
  promedioGeneral: number;
  csatPorcentaje: number;
  distribucion: DistribucionNivel[];
  ranking: RankingAsesor[];
  tendencias: TendenciasComportamiento;
  aniosDisponibles: number[];
}

export class AnaliticaService {
  private readonly diasSemana = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];

  /**
   * Extrae los años únicos presentes en los registros de calificaciones
   */
  obtenerAniosDisponibles(calificaciones: Calificacion[]): number[] {
    const aniosSet = new Set<number>();

    for (const c of calificaciones) {
      if (c.createdAt) {
        const year = new Date(c.createdAt).getFullYear();
        if (!isNaN(year)) {
          aniosSet.add(year);
        }
      }
    }

    if (aniosSet.size === 0) {
      aniosSet.add(2026);
    }

    return Array.from(aniosSet).sort((a, b) => b - a);
  }

  /**
   * Filtra las calificaciones según los criterios dimensionales y temporales
   */
  filtrarCalificaciones(
    calificaciones: Calificacion[],
    filtros: FiltrosAnalitica
  ): Calificacion[] {
    return calificaciones.filter((c) => {
      const fecha = new Date(c.createdAt);

      // Filtro de Año
      if (filtros.year && filtros.year !== 'todos') {
        if (fecha.getFullYear() !== filtros.year) return false;
      }

      // Filtro de Mes
      if (filtros.month !== undefined && filtros.month !== 'todos') {
        if (fecha.getMonth() !== filtros.month) return false;
      }

      // Filtro de Asesor
      if (filtros.asesorId && filtros.asesorId !== 'todos') {
        if (c.asesorId !== filtros.asesorId) return false;
      }

      // Filtro de Estrellas/Rayos
      if (filtros.estrellas && filtros.estrellas !== 'todos') {
        if (c.estrellas !== filtros.estrellas) return false;
      }

      return true;
    });
  }

  /**
   * Procesa y calcula todos los indicadores analíticos para el conjunto filtrado
   */
  calcularAnaliticaCompleta(
    calificacionesFiltradas: Calificacion[],
    todasLasCalificaciones: Calificacion[],
    asesores: Asesor[]
  ): ResultadoAnalitica {
    const total = calificacionesFiltradas.length;
    const aniosDisponibles = this.obtenerAniosDisponibles(todasLasCalificaciones);

    // Estado Cero (Sin datos en el filtro aplicado)
    if (total === 0) {
      return {
        totalCalificaciones: 0,
        promedioGeneral: 0,
        csatPorcentaje: 0,
        distribucion: [5, 4, 3, 2, 1].map((s) => ({
          estrellas: s,
          conteo: 0,
          porcentaje: 0,
        })),
        ranking: [],
        tendencias: {
          diaMasActivo: { dia: 'Sin registros', total: 0 },
          franjaPico: { franja: 'Sin registros', total: 0 },
          tasaConComentario: 0,
        },
        aniosDisponibles,
      };
    }

    let sumaRayos = 0;
    let votosPositivos = 0; // 4 y 5 rayos (CSAT)
    let totalComentarios = 0;

    const distribucionMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const diasMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const franjasMap: Record<string, number> = {
      'Mañana (8:00 AM - 11:59 AM)': 0,
      'Mediodía (12:00 PM - 2:59 PM)': 0,
      'Tarde (3:00 PM - 6:00 PM)': 0,
      'Otros Horarios': 0,
    };

    for (const c of calificacionesFiltradas) {
      sumaRayos += c.estrellas;
      distribucionMap[c.estrellas] = (distribucionMap[c.estrellas] || 0) + 1;

      if (c.estrellas >= 4) {
        votosPositivos++;
      }

      if (c.comentario && c.comentario.trim().length > 0) {
        totalComentarios++;
      }

      // Análisis temporal
      const fecha = new Date(c.createdAt);
      const dia = fecha.getDay();
      diasMap[dia] = (diasMap[dia] || 0) + 1;

      const hora = fecha.getHours();
      if (hora >= 8 && hora < 12) {
        franjasMap['Mañana (8:00 AM - 11:59 AM)']++;
      } else if (hora >= 12 && hora < 15) {
        franjasMap['Mediodía (12:00 PM - 2:59 PM)']++;
      } else if (hora >= 15 && hora <= 18) {
        franjasMap['Tarde (3:00 PM - 6:00 PM)']++;
      } else {
        franjasMap['Otros Horarios']++;
      }
    }

    // 1. Distribución porcentual
    const distribucion: DistribucionNivel[] = [5, 4, 3, 2, 1].map((s) => ({
      estrellas: s,
      conteo: distribucionMap[s] || 0,
      porcentaje: Math.round(((distribucionMap[s] || 0) / total) * 100),
    }));

    // 2. Ranking de Asesores
    const rankingPrevio: Omit<RankingAsesor, 'posicion'>[] = asesores
      .map((asesor) => {
        const votosAsesor = calificacionesFiltradas.filter((c) => c.asesorId === asesor.id);
        const subTotal = votosAsesor.length;
        if (subTotal === 0) {
          return {
            asesor,
            totalVotos: 0,
            promedio: 0,
            csat: 0,
            conComentarios: 0,
          };
        }

        const subSuma = votosAsesor.reduce((acc, curr) => acc + curr.estrellas, 0);
        const subPositivos = votosAsesor.filter((c) => c.estrellas >= 4).length;
        const subComentarios = votosAsesor.filter(
          (c) => c.comentario && c.comentario.trim().length > 0
        ).length;

        return {
          asesor,
          totalVotos: subTotal,
          promedio: Number((subSuma / subTotal).toFixed(1)),
          csat: Math.round((subPositivos / subTotal) * 100),
          conComentarios: subComentarios,
        };
      })
      // Filtrar asesores que tengan al menos 1 voto en el periodo filtrado
      .filter((r) => r.totalVotos > 0)
      // Ordenar: primero por promedio descendente, luego por total de votos
      .sort((a, b) => {
        if (b.promedio !== a.promedio) return b.promedio - a.promedio;
        return b.totalVotos - a.totalVotos;
      });

    const ranking: RankingAsesor[] = rankingPrevio.map((item, idx) => ({
      ...item,
      posicion: idx + 1,
    }));

    // 3. Tendencias de Comportamiento
    let mejorDiaIndex = 1; // Default Lunes
    let maxVotosDia = -1;
    for (let d = 0; d < 7; d++) {
      if (diasMap[d] > maxVotosDia) {
        maxVotosDia = diasMap[d];
        mejorDiaIndex = d;
      }
    }

    let mejorFranja = 'Mañana (8:00 AM - 11:59 AM)';
    let maxVotosFranja = -1;
    for (const [franja, count] of Object.entries(franjasMap)) {
      if (count > maxVotosFranja) {
        maxVotosFranja = count;
        mejorFranja = franja;
      }
    }

    return {
      totalCalificaciones: total,
      promedioGeneral: Number((sumaRayos / total).toFixed(1)),
      csatPorcentaje: Math.round((votosPositivos / total) * 100),
      distribucion,
      ranking,
      tendencias: {
        diaMasActivo: {
          dia: this.diasSemana[mejorDiaIndex],
          total: maxVotosDia,
        },
        franjaPico: {
          franja: mejorFranja,
          total: maxVotosFranja,
        },
        tasaConComentario: Math.round((totalComentarios / total) * 100),
      },
      aniosDisponibles,
    };
  }
}

export const analiticaService = new AnaliticaService();
