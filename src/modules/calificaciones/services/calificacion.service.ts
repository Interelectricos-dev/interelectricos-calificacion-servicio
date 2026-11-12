import { ICalificacionRepository } from '../domain/calificacion.repository';
import { CalificacionDomainRules, Calificacion, SubmitCalificacionDTO } from '../domain/calificacion.entity';
import { DeviceRateLimiterService, RateLimitStatus } from './rate-limiter.service';

export interface SubmitRatingRequest {
  asesorId: string;
  estrellas: number;
  comentario?: string;
  bypassCooldown?: boolean;
}

export interface SubmitRatingResult {
  success: boolean;
  calificacion?: Calificacion;
  error?: string;
  remainingMinutes?: number;
}

export class CalificacionService {
  constructor(
    private readonly repository: ICalificacionRepository,
    private readonly rateLimiter: DeviceRateLimiterService
  ) {}

  /**
   * Consulta el estado de cooldown del dispositivo para el asesor
   */
  canDeviceRate(asesorId: string): RateLimitStatus {
    return this.rateLimiter.checkCooldown(asesorId);
  }

  /**
   * Restablece el cooldown (útil para pruebas y modo demo)
   */
  resetCooldown(asesorId?: string): void {
    this.rateLimiter.clearCooldown(asesorId);
  }

  /**
   * Procesa y registra la calificación de un cliente
   */
  async submitRating(request: SubmitRatingRequest): Promise<SubmitRatingResult> {
    const { asesorId, estrellas, comentario, bypassCooldown } = request;

    if (!asesorId || asesorId.trim() === '') {
      return { success: false, error: 'Debe especificarse el asesor a calificar.' };
    }

    // 1. Validar estrellas según reglas de dominio
    if (!CalificacionDomainRules.isValidEstrellas(estrellas)) {
      return {
        success: false,
        error: `La calificación debe ser un número entero entre ${CalificacionDomainRules.MIN_ESTRELLAS} y ${CalificacionDomainRules.MAX_ESTRELLAS} estrellas.`,
      };
    }

    // 2. Validar cooldown / rate-limit por dispositivo
    if (!bypassCooldown) {
      const cooldownStatus = this.rateLimiter.checkCooldown(asesorId);
      if (!cooldownStatus.canRate) {
        return {
          success: false,
          error: 'Tu opinión para este asesor ya fue registrada hoy. ¡Muchas gracias!',
          remainingMinutes: cooldownStatus.remainingMinutes,
        };
      }
    }

    // 3. Sanitizar comentario
    const cleanComentario = CalificacionDomainRules.sanitizeComentario(comentario) || undefined;
    const deviceId = this.rateLimiter.getOrCreateDeviceId();

    const dto: SubmitCalificacionDTO = {
      asesorId,
      estrellas,
      comentario: cleanComentario,
      deviceId,
    };

    try {
      // 4. Guardar calificación
      const saved = await this.repository.save(dto);

      // 5. Registrar el cooldown para este dispositivo y asesor
      this.rateLimiter.recordRating(asesorId);

      return {
        success: true,
        calificacion: saved,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado al guardar la calificación.';
      return {
        success: false,
        error: message,
      };
    }
  }

  async getCalificacionesByAsesor(asesorId: string): Promise<Calificacion[]> {
    return this.repository.findByAsesorId(asesorId);
  }

  async getAllCalificaciones(): Promise<Calificacion[]> {
    return this.repository.findAll();
  }
}

