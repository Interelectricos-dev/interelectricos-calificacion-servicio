export interface Asesor {
  id: string;
  codigoSlug: string;
  nombre: string;
  cargo?: string | null;
  activo: boolean;
  createdAt: string;
}

export interface CreateAsesorDTO {
  codigoSlug: string;
  nombre: string;
  cargo?: string;
  activo?: boolean;
}

