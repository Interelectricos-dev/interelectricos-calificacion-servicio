-- ====================================================================
-- INTERELÉCTRICOS - ESQUEMA DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- ====================================================================

-- 1. Tabla de Asesores (Simplificada: solo nombre, cargo y slug)
CREATE TABLE IF NOT EXISTS asesores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_slug VARCHAR(50) UNIQUE NOT NULL,      -- Slug para el QR (ej: "carlos-mendez" o "asesor-01")
    nombre VARCHAR(120) NOT NULL,
    cargo VARCHAR(100) DEFAULT 'Asesor Comercial',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Calificaciones
CREATE TABLE IF NOT EXISTS calificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asesor_id UUID REFERENCES asesores(id) ON DELETE CASCADE NOT NULL,
    estrellas INT CHECK (estrellas >= 1 AND estrellas <= 5) NOT NULL,
    comentario TEXT,
    device_id VARCHAR(100),                      -- Identificador anónimo para control de cooldown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_calificaciones_asesor_id ON calificaciones(asesor_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_created_at ON calificaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asesores_codigo_slug ON asesores(codigo_slug);

-- 4. Seguridad a nivel de fila (Row Level Security - RLS)
ALTER TABLE asesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

-- Asesores: Permitir lectura pública de asesores activos
CREATE POLICY "Permitir lectura de asesores activos" 
ON asesores FOR SELECT USING (true);

-- Asesores: Permitir insertar nuevos asesores desde el panel
CREATE POLICY "Permitir crear asesores" 
ON asesores FOR INSERT WITH CHECK (true);

-- Asesores: Permitir dar de baja / reactivar asesores
CREATE POLICY "Permitir actualizar estado de asesores" 
ON asesores FOR UPDATE USING (true);

-- Calificaciones: Permitir que los clientes inserten su calificación
CREATE POLICY "Permitir insertar calificaciones" 
ON calificaciones FOR INSERT WITH CHECK (true);

-- Calificaciones: Permitir lectura para métricas y buzón de opiniones
CREATE POLICY "Permitir lectura de calificaciones" 
ON calificaciones FOR SELECT USING (true);

-- 5. Datos Iniciales de Prueba (Semilla / Seed)
INSERT INTO asesores (codigo_slug, nombre, cargo, activo)
VALUES 
    ('carlos-mendez', 'Carlos Méndez', 'Asesor Técnico Comercial', true),
    ('valentina-gomez', 'Valentina Gómez', 'Especialista en Material Eléctrico', true),
    ('asesor-01', 'Juan Pablo Restrepo', 'Atención al Cliente', true)
ON CONFLICT (codigo_slug) DO NOTHING;
