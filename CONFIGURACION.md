# Sistema de Gestión Nutricional

## Configuración del Archivo .env

Para que el sistema funcione correctamente, necesitas crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nutricionista_app
DB_PORT=3306

# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Claves de Registro Profesional
# Formato: NUTRI-XXXX (separadas por comas)
REGISTRATION_KEYS=NUTRI-ADMIN,NUTRI-MED001,NUTRI-NUT001,NUTRI-CLIN001,NUTRI-DEP001

# Configuración de Seguridad
JWT_SECRET=nutricionista_app_super_secret_key_2024_change_in_production
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# Configuración de CORS
CORS_ORIGIN=http://localhost:3000
```

## Claves de Registro Profesional

El sistema utiliza claves de registro para controlar el acceso de profesionales. Las claves deben seguir el formato `NUTRI-XXXX` donde:

- `NUTRI` es el prefijo fijo
- `XXXX` puede ser cualquier combinación de letras mayúsculas y números

### Claves Predefinidas:

- `NUTRI-ADMIN` - Clave maestra para administradores del sistema
- `NUTRI-MED001` - Clave para profesionales médicos especializados
- `NUTRI-NUT001` - Clave para nutricionistas certificados
- `NUTRI-CLIN001` - Clave para profesionales clínicos
- `NUTRI-DEP001` - Clave para nutricionistas deportivos

### Agregar Nuevas Claves:

Para agregar nuevas claves de registro:

1. Edita el archivo `.env`
2. Agrega la nueva clave a la variable `REGISTRATION_KEYS` separada por comas
3. Reinicia el servidor

Ejemplo:
```env
REGISTRATION_KEYS=NUTRI-ADMIN,NUTRI-MED001,NUTRI-NUT001,NUTRI-CLIN001,NUTRI-DEP001,NUTRI-NEW001
```

## Instalación y Uso

1. Instalar dependencias:
```bash
npm install
```

2. Crear el archivo `.env` con la configuración anterior

3. Iniciar el servidor:
```bash
npm start
```

4. El sistema estará disponible en `http://localhost:3000`

## Estructura del Proyecto

- `config/` - Configuraciones del sistema
- `controllers/` - Controladores de la API
- `models/` - Modelos de datos
- `routes/` - Rutas de la API
- `views/` - Vistas del frontend
- `sql/` - Scripts de base de datos
- `public/` - Archivos estáticos
