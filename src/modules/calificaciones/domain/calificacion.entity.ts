export type Estrellas = 1 | 2 | 3 | 4 | 5;

export interface Calificacion {
  id: string;
  asesorId: string;
  estrellas: Estrellas;
  comentario?: string | null;
  deviceId?: string | null;
  createdAt: string;
}

export interface SubmitCalificacionDTO {
  asesorId: string;
  estrellas: number;
  comentario?: string;
  deviceId?: string;
}

export class CalificacionDomainRules {
  static readonly MIN_ESTRELLAS = 1;
  static readonly MAX_ESTRELLAS = 5;
  static readonly MAX_COMENTARIO_LENGTH = 500;

  static isValidEstrellas(value: number): value is Estrellas {
    return (
      Number.isInteger(value) &&
      value >= this.MIN_ESTRELLAS &&
      value <= this.MAX_ESTRELLAS
    );
  }

  static sanitizeComentario(comentario?: string): string | null {
    if (!comentario) return null;
    const trimmed = comentario.trim();
    if (trimmed.length === 0) return null;
    return trimmed.slice(0, this.MAX_COMENTARIO_LENGTH);
  }
}

