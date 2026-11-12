import { ICalificacionRepository } from '../domain/calificacion.repository';
import { Calificacion, SubmitCalificacionDTO, Estrellas } from '../domain/calificacion.entity';
import { getSupabaseClient } from '@/lib/supabase/client';

const IN_MEMORY_CALIFICACIONES: Calificacion[] = [];

export class SupabaseCalificacionRepository implements ICalificacionRepository {
  async save(dto: SubmitCalificacionDTO): Promise<Calificacion> {
    const supabase = getSupabaseClient();

    if (!supabase) {
      // Modo Mock Fallback para pruebas sin conexión
      const newCalificacion: Calificacion = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'mock_' + Date.now(),
        asesorId: dto.asesorId,
        estrellas: dto.estrellas as Estrellas,
        comentario: dto.comentario || null,
        deviceId: dto.deviceId || null,
        createdAt: new Date().toISOString(),
      };
      IN_MEMORY_CALIFICACIONES.push(newCalificacion);
      console.log('✅ [DEMO/MOCK] Calificación guardada en memoria:', newCalificacion);
      return newCalificacion;
    }

    const { data, error } = await supabase
      .from('calificaciones')
      .insert({
        asesor_id: dto.asesorId,
        estrellas: dto.estrellas,
        comentario: dto.comentario || null,
        device_id: dto.deviceId || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al registrar calificación: ${error?.message || 'Error en la base de datos'}`);
    }

    return this.mapToDomain(data);
  }

  async findByAsesorId(asesorId: string): Promise<Calificacion[]> {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return IN_MEMORY_CALIFICACIONES.filter((c) => c.asesorId === asesorId);
    }

    const { data, error } = await supabase
      .from('calificaciones')
      .select('*')
      .eq('asesor_id', asesorId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(this.mapToDomain);
  }

  async findAll(): Promise<Calificacion[]> {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return IN_MEMORY_CALIFICACIONES;
    }

    const { data, error } = await supabase
      .from('calificaciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(this.mapToDomain);
  }

  private mapToDomain(row: Record<string, unknown>): Calificacion {
    return {
      id: String(row.id),
      asesorId: String(row.asesor_id),
      estrellas: Number(row.estrellas) as Estrellas,
      comentario: row.comentario ? String(row.comentario) : null,
      deviceId: row.device_id ? String(row.device_id) : null,
      createdAt: String(row.created_at || new Date().toISOString()),
    };
  }
}

