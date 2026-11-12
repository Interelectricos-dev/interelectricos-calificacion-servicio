import { Calificacion, SubmitCalificacionDTO } from './calificacion.entity';

export interface ICalificacionRepository {
  save(dto: SubmitCalificacionDTO): Promise<Calificacion>;
  findByAsesorId(asesorId: string): Promise<Calificacion[]>;
  findAll(): Promise<Calificacion[]>;
}

