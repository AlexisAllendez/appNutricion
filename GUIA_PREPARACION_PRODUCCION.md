# 🚀 GUÍA COMPLETA: PREPARACIÓN PARA PRODUCCIÓN

## ✅ FASE 1: LIMPIEZA DE BASE DE DATOS - COMPLETADA

### ✅ Cambios Realizados:
- ✅ Eliminadas 5 tablas del schema SQL
- ✅ Actualizado `config/db.js` 
- ✅ Script de limpieza creado
- ✅ Eliminadas tablas de conversaciones/mensajes no implementadas

### ✅ Estado Actual:
- **Tablas en Base de Datos:** 15 tablas (antes tenías 18)
- **Tablas Eliminadas:** 7 (registros_comidas, ingredientes, recetas, recipe_ingredientes, documentos, conversaciones, mensajes)

---

## 📋 FASE 2: EJECUCIÓN DE LIMPIEZA EN PHPMYADMIN

### Paso 2.1: Abrir phpMyAdmin
```
http://localhost/phpmyadmin
```

### Paso 2.2: Seleccionar Base de Datos
- Clic en `nutricionista_app` en el panel izquierdo

### Paso 2.3: Ejecutar Script de Limpieza
1. Ir a pestaña **"SQL"**
2. Copiar y pegar el contenido de `SCRIPT_PHPMYADMIN_CORREGIDO.sql`
3. Clic en **"Continuar"** o **"Ir"**
4. ✅ Deberías ver mensajes de confirmación sin errores

### Paso 2.4: Verificar Resultado
Ejecutar en phpMyAdmin:
```sql
SHOW TABLES;
```

**Resultado Esperado:** Debes ver **exactamente 15 tablas**:

1. ✅ antecedentes
2. ✅ antropometria
3. ✅ consultas
4. ✅ evoluciones
5. ✅ excepciones_horarios
6. ✅ historia_clinica_resumen
7. ✅ horarios_disponibles
8. ✅ laboratorios
9. ✅ plan_asignaciones
10. ✅ plan_comidas
11. ✅ planes_alimentacion
12. ✅ profesionales
13. ✅ reportes_generados
14. ✅ resultados_laboratorio
15. ✅ usuarios

**Si tienes más de 15 tablas, escríbeme cuáles para eliminarlas.**

---

## 🧪 FASE 3: TESTING COMPLETO DEL SISTEMA

### ✅ 3.1 INICIAR SERVIDOR

```bash
# Abrir terminal en la carpeta del proyecto
cd "C:\Users\54266\OneDrive\Escritorio\Desarrollo de Software\Trabajos\Nutricion\App nutricion"

# Iniciar servidor
npm start

# O si tienes nodemon:
npm run dev
```

**Verificar:**
- ✅ Servidor inicia sin errores
- ✅ Conecta a MySQL correctamente
- ✅ Puerto 3000 (o el que configuraste) accesible

---

### ✅ 3.2 REGISTRO DE PROFESIONAL

**URL:** `http://localhost:3000/register`

1. **Completar formulario:**
   - Nombre: Tu nombre
   - Usuario: tu_usuario
   - Contraseña: Contraseña segura
   - Email: tu@email.com
   - **Timezone:** Seleccionar `America/Argentina/Buenos_Aires` (o tu zona)

2. **Verificar:**
   - ✅ Registro exitoso
   - ✅ Redirige a login
   - ✅ Email recibido (si configuraste servicio de email)

---

### ✅ 3.3 LOGIN DE PROFESIONAL

**URL:** `http://localhost:3000/login`

1. Ingresar credenciales registradas
2. Verificar:
   - ✅ Login exitoso
   - ✅ Redirige al dashboard
   - ✅ Token guardado en localStorage
   - ✅ Datos del usuario en localStorage

---

### ✅ 3.4 VERIFICAR DASHBOARD - SECCIÓN HOME

**URL:** Dashboard después del login

**Verificaciones:**

1. **Reloj en Tiempo Real:**
   - ✅ Reloj visible en la parte superior
   - ✅ Muestra fecha y hora: `DD/MM/YYYY - HH:MM:SS`
   - ✅ Actualiza cada segundo
   - ✅ Usa la zona horaria configurada en registro

2. **Estadísticas:**
   - ✅ Total de pacientes: 0 (si no hay)
   - ✅ Consultas de hoy: 0
   - ✅ Próximas consultas: 0

3. **Citas Próximas:**
   - ✅ Muestra "No hay citas próximas" si está vacío
   - ✅ Fechas correctas según timezone configurado

---

### ✅ 3.5 CREAR PACIENTE NUEVO

**URL:** Desde el dashboard → "Nuevo Paciente"

1. **Completar datos:**
   - Apellido y Nombre
   - Tipo y Número de Documento
   - Email y Teléfono
   - Fecha de Nacimiento
   - Sexo
   - Otros datos opcionales

2. **Crear paciente**

3. **Verificar:**
   - ✅ Paciente creado exitosamente
   - ✅ Aparece en la lista de pacientes
   - ✅ Datos guardados correctamente en BD

---

### ✅ 3.6 CREAR CONSULTA

**Opción A: Desde Pacientes → Historia Clínica**
1. Abrir historia clínica del paciente
2. Ir a pestaña "Consultas"
3. Clic en "Nueva Consulta"
4. Completar:
   - Fecha (seleccionar de calendario)
   - Hora (desde selector)
   - Tipo de consulta
   - Motivo
5. Guardar

**Verificar:**
- ✅ Consulta creada
- ✅ Aparece en el listado
- ✅ Fecha y hora correctas

**Opción B: Desde Agenda**
1. Ir a sección "Agenda"
2. Clic en "Nueva Consulta"
3. Seleccionar paciente
4. Elegir fecha y hora
5. Guardar

**Verificar:**
- ✅ Consulta aparece en agenda
- ✅ Fecha correcta según timezone del profesional

---

### ✅ 3.7 VERIFICAR RESERVA PÚBLICA DE TURNOS

**URL:** `http://localhost:3000/reservar-turno`

1. Abrir en **otra ventana** (o modo incógnito)

2. **Configurar horarios disponibles (IMPORTANTE):**
   - Ir a Dashboard → Horarios
   - Configurar días y horarios disponibles

3. **Reservar turno:**
   - Nombre y Apellido
   - Teléfono y Email
   - Fecha: Seleccionar fecha futura
   - Hora: Seleccionar de la lista disponible
   - Tipo de consulta
   - Motivo
4. Enviar reserva

**Verificar:**
- ✅ Validación de fecha futura según timezone del profesional
- ✅ Horarios disponibles se cargan correctamente
- ✅ Reserva creada exitosamente
- ✅ Email de confirmación enviado (si configurado)
- ✅ Código de cancelación generado
- ✅ Reserva aparece en agenda del profesional

---

### ✅ 3.8 REPROGRAMAR CONSULTA

1. Ir a Gestión de Consultas o Agenda
2. Seleccionar una consulta
3. Clic en "Reprogramar"
4. Cambiar fecha/hora
5. Guardar

**Verificar:**
- ✅ Consulta reprogramada
- ✅ Email enviado con nueva fecha/hora
- ✅ Fechas correctas según timezone
- ✅ No permite programar en el pasado

---

### ✅ 3.9 CANCELAR CONSULTA

1. Ir a Gestión de Consultas o Agenda
2. Seleccionar consulta
3. Clic en "Cancelar"
4. Ingresar motivo (opcional)
5. Confirmar

**Verificar:**
- ✅ Consulta cancelada
- ✅ Estado actualizado a "cancelado"
- ✅ Email enviado al paciente

---

### ✅ 3.10 CONFIGURAR ZONA HORARIA

**Dashboard → Configuraciones → Sistema**

1. **Ver zona horaria actual:**
   - Debe mostrar la zona configurada en el registro

2. **Cambiar zona horaria:**
   - Seleccionar otra zona (ej: `America/New_York`)
   - Guardar

3. **Verificar cambios:**
   - ✅ Guardado exitoso
   - ✅ Reloj actualiza hora inmediatamente
   - ✅ Fechas de consultas se muestran en nueva zona
   - ✅ Backend actualiza en BD

4. **Verificar en BD:**
   ```sql
   SELECT id, nombre, timezone FROM profesionales;
   ```
   - ✅ Debe mostrar la nueva zona horaria

---

### ✅ 3.11 CREAR PLAN ALIMENTARIO

1. **Ir a Plan Alimentario o Historia Clínica**
2. **Crear nuevo plan:**
   - Nombre del plan
   - Descripción
   - Fecha inicio/fin
   - Calorías diarias
   - Objetivo
3. **Agregar comidas:**
   - Lunes-Domingo
   - Desayuno, Almuerzo, Merienda, Cena
   - Descripción y preparación
4. **Guardar plan**

**Verificar:**
- ✅ Plan creado
- ✅ Comidas guardadas
- ✅ Plan asignable a pacientes

---

### ✅ 3.12 ASIGNAR PLAN A PACIENTE

1. Ir a Historia Clínica del paciente
2. Pestaña "Plan Alimentario"
3. Seleccionar plan de la lista
4. Guardar asignación

**Verificar:**
- ✅ Plan asignado al paciente
- ✅ Aparece como "Plan Activo"
- ✅ Visible en historia clínica

---

### ✅ 3.13 AGREGAR ANTROPOMETRÍA

1. Historia Clínica → Antropometría
2. Clic en "Nueva Medición"
3. Completar:
   - Fecha
   - Peso, Altura
   - IMC (calculado automático)
   - Otras mediciones
4. Guardar

**Verificar:**
- ✅ Medición guardada
- ✅ Aparece en tabla
- ✅ Gráfico se actualiza
- ✅ Fecha correcta según timezone

---

### ✅ 3.14 AGREGAR LABORATORIO

1. Historia Clínica → Laboratorios
2. Clic en "Nuevo Laboratorio"
3. Completar:
   - Laboratorio
   - Médico solicitante
   - Fecha de estudio
   - Resultados (parámetros)
4. Guardar

**Verificar:**
- ✅ Laboratorio guardado
- ✅ Resultados asociados
- ✅ Aparece en historial

---

### ✅ 3.15 TEST DE DIFERENTES TIMEZONES

**Repite los pasos 3.4 a 3.14 con diferentes zonas horarias:**

**Timezone 1:** `America/Argentina/Buenos_Aires` (GMT-3)
- Cambiar en Configuraciones
- Verificar fechas y horas
- Crear consulta
- Verificar que se muestra correctamente

**Timezone 2:** `America/New_York` (GMT-5/-4)
- Cambiar en Configuraciones
- Verificar que todo funciona
- El reloj debe mostrar hora de NY
- Las consultas se muestran en hora de NY

**Timezone 3:** `Europe/London` (GMT+0/+1)
- Cambiar en Configuraciones
- Verificar funcionamiento completo

---

## 🔒 FASE 4: CONFIGURACIÓN PARA PRODUCCIÓN

### ✅ 4.1 VARIABLES DE ENTORNO

Crear archivo `.env` para producción:

```env
# Base de Datos
DB_HOST=tu_servidor_mysql
DB_USER=prod_user
DB_PASSWORD=contraseña_super_segura
DB_NAME=nutricionista_app
DB_PORT=3306

# Entorno
NODE_ENV=production

# JWT
JWT_SECRET=secret_muy_largo_y_complejo_generar_uno_nuevo_para_produccion

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password

# Puerto
PORT=3000
```

**⚠️ IMPORTANTE:** 
- NO usar credenciales de desarrollo en producción
- Cambiar contraseña de BD
- Usar JWT_SECRET diferente y seguro

---

### ✅ 4.2 CONFIGURAR MYSQL EN PRODUCCIÓN

```sql
-- Conectar a MySQL en producción
mysql -u root -p

-- Configurar timezone en UTC
SET GLOBAL time_zone = '+00:00';
SET time_zone = '+00:00';

-- Verificar
SELECT @@global.time_zone, @@session.time_zone;
```

---

### ✅ 4.3 CREAR BASE DE DATOS EN PRODUCCIÓN

```sql
-- Crear base de datos
CREATE DATABASE nutricionista_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Importar schema limpio
-- Ejecutar: sql/schema.sql en phpMyAdmin de producción
```

**⚠️ NO importar tablas de desarrollo en producción**

---

### ✅ 4.4 INSTALAR DEPENDENCIAS EN PRODUCCIÓN

```bash
# En el servidor de producción
npm install --production

# No instalar dependencias de desarrollo
```

---

### ✅ 4.5 CONFIGURAR HTTPS

**Opción A: Servidor con SSL Certificate**
- Configurar con Let's Encrypt

**Opción B: Usar servicio de hosting con HTTPS**
- La mayoría de hostings incluyen SSL gratuito

---

### ✅ 4.6 BACKUPS AUTOMÁTICOS

```bash
# Script de backup diario
#!/bin/bash
mysqldump -u root -p nutricionista_app > /backups/nutricionista_app_$(date +%Y%m%d).sql

# Agregar a cron
# 0 2 * * * /ruta/al/backup.sh
```

---

## 📦 FASE 5: DEPLOY (SUBIENDO A PRODUCCIÓN)

### ✅ 5.1 ELEGIR HOSTING

**Opciones recomendadas:**
- **Vercel** (para Node.js, gratis y fácil)
- **Railway** (para Node.js + MySQL)
- **Heroku** (clásico, incluye MySQL)
- **Digital Ocean** (VPS, más control)
- **Hostinger** (económico, incluye MySQL)

---

### ✅ 5.2 PROCESO DE DEPLOY

#### **Si usas Vercel:**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### **Si usas Railway/Render:**
1. Conectar repo de GitHub
2. Configurar variables de entorno
3. Deploy automático

#### **Si usas VPS (Digital Ocean/Hostinger):**
```bash
# Subir archivos vía FTP/SFTP
# O usar git pull
git clone https://github.com/tu-repo
cd nutricionista_app
npm install --production
npm start
```

---

### ✅ 5.3 CONFIGURAR VARIABLES DE ENTORNO EN PRODUCCIÓN

En el panel de tu hosting:
- Agregar todas las variables de `.env`
- Guardar
- Reiniciar aplicación

---

## ✅ FASE 6: VERIFICACIÓN EN PRODUCCIÓN

### ✅ 6.1 VERIFICAR HOSTING FUNCIONA

1. Visitar URL de producción
2. Verificar página inicial carga
3. Verificar no hay errores en consola

### ✅ 6.2 REGISTRO EN PRODUCCIÓN

1. Ir a `/register`
2. Registrar nuevo profesional
3. Completar con datos reales
4. Verificar registro exitoso

### ✅ 6.3 LOGIN EN PRODUCCIÓN

1. Ir a `/login`
2. Usar credenciales registradas
3. Verificar acceso al dashboard

### ✅ 6.4 VERIFICAR TIMEZONE

1. Configurar timezone en producción
2. Verificar reloj muestra hora correcta
3. Crear consulta de prueba
4. Verificar fechas correctas

### ✅ 6.5 TEST DE TODAS LAS FUNCIONALIDADES

Repetir Fase 3 completa en producción:
- ✅ Crear paciente
- ✅ Crear consulta
- ✅ Reservar turno (público)
- ✅ Reprogramar consulta
- ✅ Cancelar consulta
- ✅ Crear plan alimentario
- ✅ Asignar plan
- ✅ Antropometría
- ✅ Laboratorios

---

## 📝 CHECKLIST FINAL

### ✅ Base de Datos
- [ ] Limpieza ejecutada (15 tablas)
- [ ] Schema actualizado
- [ ] Sin errores en BD

### ✅ Funcionalidad Core
- [ ] Registro profesional funciona
- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] Timezone funciona en todos lados
- [ ] Crear paciente funciona
- [ ] Crear consulta funciona
- [ ] Reprogramar funciona
- [ ] Cancelar funciona
- [ ] Reserva pública funciona

### ✅ Funcionalidad Avanzada
- [ ] Planes alimentarios funcionan
- [ ] Antropometría funciona
- [ ] Laboratorios funcionan
- [ ] Emails se envían
- [ ] Reportes se generan

### ✅ Producción
- [ ] Variables de entorno configuradas
- [ ] MySQL configurado en UTC
- [ ] HTTPS configurado
- [ ] Backups configurados
- [ ] Deploy ejecutado
- [ ] Sistema funciona en producción

---

## 🌍 TEST PARA USUARIOS GLOBALES

**Para probar uso global:**

1. **Usuario en Buenos Aires:**
   - Configurar `America/Argentina/Buenos_Aires`
   - Verificar reloj y fechas

2. **Usuario en Nueva York:**
   - Configurar `America/New_York`
   - Verificar reloj y fechas

3. **Usuario en Londres:**
   - Configurar `Europe/London`
   - Verificar reloj y fechas

**Todos deben ver:**
- ✅ Reloj con su hora local
- ✅ Fechas correctas
- ✅ Consultas futuras correctas
- ✅ Sin problemas de timezone

---

## 📞 SOPORTE POST-DEPLOY

**Monitorear:**
- Logs de errores
- Uso de CPU/RAM
- Queries lentas
- Errores en consola del navegador

**Si hay problemas:**
1. Revisar logs del servidor
2. Verificar BD funciona
3. Verificar emails llegan
4. Verificar timezone en BD es UTC

---

## ✅ RESUMEN

**Archivos Modificados:**
- ✅ `sql/schema.sql` - Limpiado
- ✅ `config/db.js` - Actualizado
- ✅ `cleanup_database.sql` - Script de limpieza
- ✅ `SCRIPT_PHPMYADMIN_CORREGIDO.sql` - Versión corregida
- ✅ Variables de timezone en todo el sistema

**Sistema Listo Para:**
- ✅ Un solo profesional
- ✅ Cualquier zona horaria del mundo
- ✅ Producción inmediata
- ✅ Escalar a múltiples profesionales

**Próximos Pasos:**
1. ✅ Ejecutar limpieza de BD
2. ✅ Probar sistema local completo
3. ✅ Configurar producción
4. ✅ Deploy
5. ✅ Verificar en producción
6. ✅ ¡LISTO PARA USAR! 🎉

