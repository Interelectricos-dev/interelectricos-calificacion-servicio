import { SupabaseAsesorRepository } from './infrastructure/supabase-asesor.repository';
import { AsesorService } from './services/asesor.service';

export * from './domain/asesor.entity';
export * from './domain/asesor.repository';
export * from './services/asesor.service';

// Instancia única (Singleton) por defecto para el servicio de Asesores
const defaultAsesorRepository = new SupabaseAsesorRepository();
export const asesorService = new AsesorService(defaultAsesorRepository);

