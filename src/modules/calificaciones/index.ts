import { SupabaseCalificacionRepository } from './infrastructure/supabase-calificacion.repository';
import { DeviceRateLimiterService } from './services/rate-limiter.service';
import { CalificacionService } from './services/calificacion.service';

export * from './domain/calificacion.entity';
export * from './domain/calificacion.repository';
export * from './services/rate-limiter.service';
export * from './services/calificacion.service';

const defaultCalificacionRepository = new SupabaseCalificacionRepository();
export const deviceRateLimiterService = new DeviceRateLimiterService();
export const calificacionService = new CalificacionService(
  defaultCalificacionRepository,
  deviceRateLimiterService
);

