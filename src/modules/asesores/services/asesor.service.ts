import { IAsesorRepository } from '../domain/asesor.repository';
import { Asesor } from '../domain/asesor.entity';

export class AsesorService {
  constructor(private readonly asesorRepository: IAsesorRepository) {}

  /**
   * Obtiene la información del asesor para mostrarla en la pantalla de calificación por su slug o ID del QR.
   */
  async getAsesorForRating(identifier: string): Promise<Asesor | null> {
    if (!identifier || identifier.trim() === '') {
      return null;
    }

    const cleanIdentifier = identifier.trim();

    // Intentar buscar por slug primero (ej: "carlos-mendez" o "asesor-01")
    const asesor = await this.asesorRepository.findBySlug(cleanIdentifier);
    if (asesor) {
      return asesor;
    }

    // Si parece un UUID, intentar buscar por ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanIdentifier);
    if (isUuid) {
      return this.asesorRepository.findById(cleanIdentifier);
    }

    return null;
  }

  async getAllAsesores(includeInactive = false): Promise<Asesor[]> {
    return this.asesorRepository.findAll(includeInactive);
  }

  /**
   * Crea un nuevo asesor generando automáticamente un slug limpio único
   */
  async createAsesor(data: { nombre: string; cargo?: string }): Promise<Asesor> {
    const trimmedNombre = data.nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre del asesor es obligatorio.');
    }

    // Generar slug base (ej. "Carlos Andrés Gómez" -> "carlos-andres-gomez")
    let slug = trimmedNombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Verificar si el slug ya existe
    const existing = await this.asesorRepository.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Math.floor(10 + Math.random() * 90)}`;
    }

    return this.asesorRepository.create({
      nombre: trimmedNombre,
      codigoSlug: slug,
      cargo: data.cargo?.trim() || 'Asesor Comercial',
      activo: true,
    });
  }

  /**
   * Da de baja o reactiva a un asesor (Soft Delete para mantener trazabilidad histórica)
   */
  async toggleAsesorStatus(id: string, activo: boolean): Promise<Asesor> {
    return this.asesorRepository.updateActivo(id, activo);
  }
}

