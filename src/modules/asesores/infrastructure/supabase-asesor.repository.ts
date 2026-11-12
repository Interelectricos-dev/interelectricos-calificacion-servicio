import { IAsesorRepository } from '../domain/asesor.repository';
import { Asesor, CreateAsesorDTO } from '../domain/asesor.entity';
import { getSupabaseClient } from '@/lib/supabase/client';

// Mock de fallback para pruebas antes de configurar Supabase
// Lista vacía para producción
const MOCK_ASESORES: Asesor[] = [];

export class SupabaseAsesorRepository implements IAsesorRepository {
  async findBySlug(slug: string): Promise<Asesor | null> {
    const supabase = getSupabaseClient();
    const cleanSlug = slug.toLowerCase().trim();

    if (!supabase) {
      // Modo Mock Fallback
      const found = MOCK_ASESORES.find(
        (a) => a.codigoSlug.toLowerCase() === cleanSlug && a.activo
      );
      return found || null;
    }

    const { data, error } = await supabase
      .from('asesores')
      .select('*')
      .eq('codigo_slug', cleanSlug)
      .eq('activo', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return this.mapToDomain(data);
  }

  async findById(id: string): Promise<Asesor | null> {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const found = MOCK_ASESORES.find((a) => a.id === id);
      return found || null;
    }

    const { data, error } = await supabase
      .from('asesores')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  async findAll(includeInactive = false): Promise<Asesor[]> {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return includeInactive
        ? MOCK_ASESORES
        : MOCK_ASESORES.filter((a) => a.activo);
    }

    let query = supabase.from('asesores').select('*').order('nombre', { ascending: true });
    if (!includeInactive) {
      query = query.eq('activo', true);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map(this.mapToDomain);
  }

  async create(dto: CreateAsesorDTO): Promise<Asesor> {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const newMock: Asesor = {
        id: crypto.randomUUID(),
        codigoSlug: dto.codigoSlug,
        nombre: dto.nombre,
        cargo: dto.cargo || 'Asesor Comercial',
        activo: dto.activo ?? true,
        createdAt: new Date().toISOString(),
      };
      MOCK_ASESORES.push(newMock);
      return newMock;
    }

    const { data, error } = await supabase
      .from('asesores')
      .insert({
        codigo_slug: dto.codigoSlug.toLowerCase().trim(),
        nombre: dto.nombre.trim(),
        cargo: dto.cargo?.trim() || 'Asesor Comercial',
        activo: dto.activo ?? true,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al registrar el asesor: ${error?.message || 'Error desconocido'}`);
    }

    return this.mapToDomain(data);
  }

  async updateActivo(id: string, activo: boolean): Promise<Asesor> {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const index = MOCK_ASESORES.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Asesor no encontrado');
      MOCK_ASESORES[index] = { ...MOCK_ASESORES[index], activo };
      return MOCK_ASESORES[index];
    }

    const { data, error } = await supabase
      .from('asesores')
      .update({ activo })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al actualizar estado del asesor: ${error?.message || 'Error desconocido'}`);
    }

    return this.mapToDomain(data);
  }

  async update(id: string, updateData: { nombre: string; cargo?: string }): Promise<Asesor> {
    const supabase = getSupabaseClient();

    if (!supabase) {
      const index = MOCK_ASESORES.findIndex((a) => a.id === id);
      if (index === -1) throw new Error('Asesor no encontrado');
      MOCK_ASESORES[index] = {
        ...MOCK_ASESORES[index],
        nombre: updateData.nombre.trim(),
        cargo: updateData.cargo?.trim() || 'Asesor Comercial',
      };
      return MOCK_ASESORES[index];
    }

    const { data, error } = await supabase
      .from('asesores')
      .update({
        nombre: updateData.nombre.trim(),
        cargo: updateData.cargo?.trim() || 'Asesor Comercial',
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`Error al actualizar el asesor: ${error?.message || 'Error desconocido'}`);
    }

    return this.mapToDomain(data);
  }

  // Mapper para desacoplar el esquema SQL snake_case del modelo de dominio camelCase
  private mapToDomain(row: Record<string, unknown>): Asesor {
    return {
      id: String(row.id),
      codigoSlug: String(row.codigo_slug),
      nombre: String(row.nombre),
      cargo: row.cargo ? String(row.cargo) : null,
      activo: Boolean(row.activo),
      createdAt: String(row.created_at || new Date().toISOString()),
    };
  }
}

