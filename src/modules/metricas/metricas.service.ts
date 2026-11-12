import { Calificacion } from '@/modules/calificaciones';
import { Asesor } from '@/modules/asesores';

export interface ResumenMetricas {
  totalCalificaciones: number;
  promedioRayos: number;
  porcentajeSatisfaccion: number; // Calificaciones de 4 y 5 rayos
  distribucionRayos: Record<number, number>; // { 1: 0, 2: 1, 3: 5, 4: 10, 5: 20 }
}

export interface MetricasAsesor {
  asesor: Asesor;
  total: number;
  promedio: number;
  satisfaccion: number;
  ultimasCalificaciones: Calificacion[];
}

export class MetricasService {
  calcularResumenGeneral(calificaciones: Calificacion[]): ResumenMetricas {
    const total = calificaciones.length;

    const distribucion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (total === 0) {
      return {
        totalCalificaciones: 0,
        promedioRayos: 5.0,
        porcentajeSatisfaccion: 100,
        distribucionRayos: distribucion,
      };
    }

    let sumaRayos = 0;
    let positivos = 0;

    for (const c of calificaciones) {
      sumaRayos += c.estrellas;
      distribucion[c.estrellas] = (distribucion[c.estrellas] || 0) + 1;
      if (c.estrellas >= 4) {
        positivos++;
      }
    }

    return {
      totalCalificaciones: total,
      promedioRayos: Number((sumaRayos / total).toFixed(1)),
      porcentajeSatisfaccion: Math.round((positivos / total) * 100),
      distribucionRayos: distribucion,
    };
  }

  agruparPorAsesor(asesores: Asesor[], calificaciones: Calificacion[]): MetricasAsesor[] {
    return asesores.map((asesor) => {
      const delAsesor = calificaciones.filter((c) => c.asesorId === asesor.id);
      const total = delAsesor.length;
      const suma = delAsesor.reduce((acc, curr) => acc + curr.estrellas, 0);
      const positivos = delAsesor.filter((c) => c.estrellas >= 4).length;

      return {
        asesor,
        total,
        promedio: total > 0 ? Number((suma / total).toFixed(1)) : 5.0,
        satisfaccion: total > 0 ? Math.round((positivos / total) * 100) : 100,
        ultimasCalificaciones: delAsesor.slice(0, 5),
      };
    });
  }
}

export const metricasService = new MetricasService();

