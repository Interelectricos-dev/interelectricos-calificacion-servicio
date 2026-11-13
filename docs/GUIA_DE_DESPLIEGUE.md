# Guía de Despliegue y Configuración de Entorno
**Intereléctricos | Sistema de Calificación de Servicio al Cliente**

---

## 1. Variables de Entorno Requeridas

La aplicación centraliza la validación de sus parámetros en `src/config/env.ts`.

| Variable | Tipo | Requerida | Propósito y Ejemplo |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL | Sí | Dirección base del proyecto Supabase (ej. `https://xyz.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | String | Sí | Llave pública anónima o publicable (`sb_publishable_...`). |
| `NEXT_PUBLIC_ADMIN_PIN` | String | Sí | Credencial o PIN de acceso al panel administrativo (ej. `1234` o alfanumérico). |
| `NEXT_PUBLIC_COMPANY_NAME` | String | No | Nombre institucional desplegado en títulos y pies (Default: `Intereléctricos`). |
| `NEXT_PUBLIC_RATING_COOLDOWN_HOURS` | Número | No | Horas de enfriamiento por asesor en un mismo dispositivo (Default: `3`). |

---

## 2. Puesta en Marcha Local (Desarrollo)

### Prerrequisitos
* Node.js LTS (v20 o superior).
* Gestor de paquetes `pnpm` (`npm install -g pnpm`).

### Procedimiento
1. Clonar el repositorio oficial:
   ```bash
   git clone https://github.com/Interelectricos-dev/interelectricos-calificacion-servicio.git
   cd interelectricos-calificacion-servicio
   ```
2. Instalar dependencias del proyecto:
   ```bash
   pnpm install
   ```
3. Configurar archivo de variables de entorno:
   Crear el archivo `.env.local` en la raíz del proyecto con las claves correspondientes.
4. Iniciar el servidor local de desarrollo:
   ```bash
   pnpm dev
   ```
   Acceder a `http://localhost:3000`.

5. Compilación y chequeo estricto de tipos:
   ```bash
   pnpm build
   ```

---

## 3. Despliegue en Producción (Vercel)

El proyecto está optimizado para su despliegue en la infraestructura Edge y Serverless de Vercel.

### 3.1. Enlace con GitHub
1. En el panel de Vercel, importe el repositorio `Interelectricos-dev/interelectricos-calificacion-servicio`.
2. Framework Preset: **Next.js**.
3. Build Command: `next build` (o comando por defecto).
4. Output Directory: `.next`.

### 3.2. Carga de Variables de Entorno en Vercel
En la sección **Settings** > **Environment Variables** del proyecto en Vercel, agregue:
* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `NEXT_PUBLIC_ADMIN_PIN`
* `NEXT_PUBLIC_COMPANY_NAME`

### 3.3. Integración Directa con Supabase (Opcional)
Si utiliza la integración de Vercel Marketplace con Supabase, las variables de URL y llave anónima se vincularán de forma automática. Solo restará agregar manualmente `NEXT_PUBLIC_ADMIN_PIN`.

---

## 4. Inicialización de Base de Datos en Supabase

1. Ingrese a la consola de administración del proyecto en [Supabase](https://supabase.com/).
2. Diríjase a la sección **SQL Editor**.
3. Pegue y ejecute el contenido completo del archivo [`supabase/schema.sql`](../supabase/schema.sql).
4. Verifique en **Table Editor** que las tablas `asesores` y `calificaciones` hayan sido creadas con sus respectivas políticas RLS activas.

