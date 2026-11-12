import { ENV } from '@/config/env';

export interface RateLimitStatus {
  canRate: boolean;
  remainingMinutes?: number;
  lastRatedAt?: Date;
}

export class DeviceRateLimiterService {
  private readonly storagePrefix = 'ie_rating_cd_';
  private readonly deviceKey = 'ie_device_fingerprint';

  /**
   * Obtiene o genera un identificador anónimo único persistente para este navegador/dispositivo.
   */
  getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') {
      return 'server_render_device';
    }

    try {
      let deviceId = localStorage.getItem(this.deviceKey);
      if (!deviceId) {
        // Generar un UUID o timestamp + random
        deviceId = 'dev_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
        localStorage.setItem(this.deviceKey, deviceId);
      }
      return deviceId;
    } catch {
      // Fallback si cookies/localStorage están deshabilitadas
      return 'anonymous_fallback_' + Date.now();
    }
  }

  /**
   * Verifica si el usuario puede calificar al asesor indicado.
   */
  checkCooldown(asesorId: string): RateLimitStatus {
    if (typeof window === 'undefined') {
      return { canRate: true };
    }

    try {
      const stored = localStorage.getItem(this.storagePrefix + asesorId);
      if (!stored) {
        return { canRate: true };
      }

      const lastTimestamp = parseInt(stored, 10);
      if (isNaN(lastTimestamp)) {
        return { canRate: true };
      }

      const now = Date.now();
      const elapsedMs = now - lastTimestamp;
      const cooldownMs = ENV.ratingCooldownHours * 60 * 60 * 1000;

      if (elapsedMs < cooldownMs) {
        const remainingMs = cooldownMs - elapsedMs;
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
        return {
          canRate: false,
          remainingMinutes,
          lastRatedAt: new Date(lastTimestamp),
        };
      }

      return { canRate: true };
    } catch {
      return { canRate: true };
    }
  }

  /**
   * Registra que el usuario acaba de calificar a este asesor, iniciando el cooldown.
   */
  recordRating(asesorId: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.storagePrefix + asesorId, Date.now().toString());
    } catch (e) {
      console.warn('No se pudo guardar cooldown en localStorage:', e);
    }
  }

  /**
   * Limpia el cooldown para pruebas o reset manual
   */
  clearCooldown(asesorId?: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (asesorId) {
        localStorage.removeItem(this.storagePrefix + asesorId);
      } else {
        // Limpiar todos los cooldowns de Intereléctricos
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.storagePrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('Error al limpiar cooldown:', e);
    }
  }
}

