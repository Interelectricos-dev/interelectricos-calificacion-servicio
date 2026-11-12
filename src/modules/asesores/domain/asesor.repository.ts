import { Asesor, CreateAsesorDTO } from './asesor.entity';

export interface IAsesorRepository {
  findBySlug(slug: string): Promise<Asesor | null>;
  findById(id: string): Promise<Asesor | null>;
  findAll(includeInactive?: boolean): Promise<Asesor[]>;
  create(data: CreateAsesorDTO): Promise<Asesor>;
  updateActivo(id: string, activo: boolean): Promise<Asesor>;
}

