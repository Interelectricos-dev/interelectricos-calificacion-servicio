# Manual de Usuario | Sistema de Calificación de Atención en Mostrador
**Intereléctricos**  
*Documento de Operación y Administración de Servicio al Cliente*

---

## 1. Introducción y Propósito

El **Sistema de Calificación de Atención en Mostrador** es una solución corporativa concebida para capturar de forma inmediata, transparente y sin fricción la percepción del cliente presencial en los puntos de venta de Intereléctricos.

A través de fichas físicas con códigos QR ubicadas en cada puesto de atención, el cliente evalúa con su propio teléfono celular el nivel de servicio recibido mediante una escala cuantitativa de 1 a 5 niveles ("Rayos de Energía") y comentarios cualitativos opcionales. 

Este manual guía a administradores, supervisores de sede y líderes de calidad en la operación diaria del sistema.

---

## 2. Flujo de Calificación del Cliente (Punto de Venta)

El proceso del cliente ha sido diseñado para completarse en menos de 20 segundos sin requerir descarga de aplicaciones ni creación de cuentas:

1. **Escaneo del Código QR:**
   Al culminar la atención en el mostrador, el cliente enfoca la cámara de su teléfono móvil hacia la ficha del asesor.
2. **Despliegue del Formulario Móvil:**
   El navegador del cliente carga la interfaz institucional con el nombre, cargo y avatar del asesor evaluado.
3. **Selección de Rayos:**
   El cliente pulsa la cantidad de rayos correspondiente a su experiencia:
   * **1 Rayo:** Malo
   * **2 Rayos:** Regular
   * **3 Rayos:** Bueno
   * **4 Rayos:** Muy bueno
   * **5 Rayos:** ¡Excelente!
4. **Comentario Opcional:**
   Dispone de un campo de texto abierto (máximo 500 caracteres) para detallar observaciones sobre la agilidad, despacho técnico o trato recibido.
5. **Confirmación y Bloqueo Temporal:**
   Al presionar **Enviar Calificación**, el sistema registra los datos de manera inmediata y activa una ventana de protección (*Cooldown*) de 3 horas para evitar calificaciones duplicadas accidentales hacia el mismo asesor.

---

## 3. Acceso al Panel Administrativo

El panel de gestión y analítica se encuentra restringido mediante credenciales institucionales.

1. **Ingreso:** Acceda a la raíz del sitio web (`/`).
2. **Autenticación:** Ingrese el PIN numérico o contraseña administrativa configurada para la empresa.
3. **Persistencia de Sesión:** Una vez autenticado, la sesión permanece activa en el navegador del equipo de trabajo. Para cerrar la sesión de forma segura al finalizar el turno, pulse el botón **Salir** ubicado en la esquina superior derecha del encabezado.

---

## 4. Indicadores Clave de Rendimiento (Métricas Ejecutivas)

En la parte superior del panel se despliegan en tiempo real cuatro tarjetas consolidadas:

* **Promedio General:** Media aritmética de todas las calificaciones registradas (rango de 1.0 a 5.0).
* **Atenciones Calificadas:** Volumen total acumulado de evaluaciones recibidas de clientes.
* **Satisfacción CSAT (%):** Porcentaje de clientes satisfechos, calculado sobre la proporción de valoraciones de 4 y 5 rayos respecto al total.
* **Asesores Activos:** Número de asesores habilitados operativamente frente al total histórico de la base de datos.

---

## 5. Gestión de Asesores de Mostrador

Desde la pestaña **Asesores**, el supervisor puede gestionar el equipo de trabajo:

### 5.1. Registrar un Nuevo Asesor
1. Presione el botón **+ Nuevo Asesor** en la parte superior derecha.
2. Complete el nombre completo (ej. *Carlos Méndez*) y cargo (ej. *Asesor Comercial*, *Especialista Técnico*).
3. El sistema autogenerará el identificador único (`codigo_slug`) que vinculará su código QR de forma inmutable.
4. Presione **Crear Asesor**. El nuevo colaborador quedará habilitado inmediatamente.

### 5.2. Modificar Nombre o Cargo
1. En la fila del asesor correspondiente, haga clic en el botón con el ícono de **Lápiz (Editar)**.
2. Actualice los datos requeridos en el modal.
3. Presione **Guardar Cambios**.  
   *Nota técnica:* El código QR del asesor no se altera al modificar su nombre, por lo que las fichas impresas físicas continúan operando sin interrupción.

### 5.3. Retiro Operativo y Reactivación (Soft Delete)
Cuando un colaborador finaliza su vinculación o cambia de área, no debe borrarse su historial:
* Para deshabilitarlo, presione el botón **Dar de baja**. Su código QR dejará de admitir nuevas calificaciones, pero todas sus estadísticas y comentarios pasados se conservarán para auditorías.
* Para reincorporarlo, presione **Reactivar**.

### 5.4. Búsqueda y Filtrado
Utilice la barra de búsqueda superior para localizar asesores por nombre o código slug, y el selector desplegable contiguo para filtrar por estado (*Todos los estados*, *Solo activos*, *Solo dados de baja*).

---

## 6. Buzón de Opiniones y Auditoría

Desde la pestaña **Buzón**, la gerencia puede consultar el detalle cualitativo de las opiniones:

1. **Visualización de Reseñas:** Cada tarjeta presenta el nombre del asesor evaluado, la fecha y hora exacta en zona horaria de Colombia, la calificación en rayos y la cita textual dejada por el cliente.
2. **Filtrado por Satisfacción:** Permite segregar opiniones por estrellas (ej. ver únicamente valoraciones de 1 o 2 rayos para planes de mejora inmediata, o 5 rayos para programas de reconocimiento).
3. **Exportación a CSV:**
   * Haga clic en el botón **Exportar CSV**.
   * Se descargará automáticamente un archivo compatible con Microsoft Excel y Google Sheets conteniendo: ID, Fecha/Hora, Asesor, Rayos, Comentario y Hash de Dispositivo (`device_id`).

---

## 7. Centro de Fichas QR para Impresión

Desde la pestaña **Fichas QR**, el supervisor genera el material gráfico que se colocará en los puestos de mostrador:

1. **Selección de Asesores:**
   Haga clic en el menú desplegable **Seleccionar Asesores**. Puede elegir la opción **Seleccionar Todos** o marcar únicamente a los colaboradores que requieran renovación de ficha.
2. **Selección del Formato de Hoja:**
   * **1 Ficha por Hoja (Grande centrada):** Recomendado para impresión estándar en hoja carta; genera una ficha de 145 mm × 145 mm con marco punteado de corte.
   * **2 Fichas por Hoja (Horizontal lado a lado):** Formato apaisado para optimizar papel (125 mm × 125 mm cada una).
   * **4 Fichas por Hoja (2x2):** Formato compacto (88 mm × 88 mm) idóneo para stickers o adhesivos pequeños.
3. **Impresión:**
   Presione **Imprimir Fichas**. Se abrirá el cuadro de diálogo de su navegador conectado a las impresoras de la empresa o con opción de *Guardar como PDF*.
4. **Instalación Física:**
   Recorte por la línea punteada exterior y coloque la ficha en el acrílico o soporte sobre el mostrador de atención.

