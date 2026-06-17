# UTN Backend - API de Gestión de Espacios de Trabajo

Este proyecto es una API REST desarrollada con **Node.js**, **Express** y **MongoDB** (usando **Mongoose**). Permite la gestión de usuarios (registro, autenticación, restablecimiento de contraseña), perfiles y administración de espacios de trabajo (workspaces), incluyendo un sistema de invitaciones de miembros por correo electrónico.

---

## 🛠️ Tecnologías y Configuración

### Requisitos Previos
- Node.js (v18 o superior)
- Base de datos MongoDB (local o en la nube mediante Atlas)
- Cuenta de Gmail para el envío de correos (o servidor SMTP compatible)

### Instalación
1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno. Copiar el archivo `.env` en la raíz del proyecto y completar las variables correspondientes:
   ```env
   PORT=3000
   MONGO_DB_CONNECTION_STRING=tu_string_de_conexion
   MONGO_DB_NAME=nombre_de_la_bd
   JWT_SECRET=tu_clave_secreta_jwt
   GMAIL_USERNAME=tu_usuario_gmail@gmail.com
   GMAIL_PASSWORD=tu_contraseña_de_aplicacion_gmail
   URL_BACKEND=http://localhost:3000
   URL_FRONTEND=http://localhost:5173
   MODE=development
   ```

### Scripts Disponibles
- **Desarrollo (con modo watch):** `npm run dev`
- **Producción / Inicio:** `npm run start`

---

## 🔐 Autenticación

Las rutas protegidas requieren que se envíe un token JWT válido a través de la cabecera `Authorization` de HTTP:

```http
Authorization: Bearer <access_token>
```

---

## 📡 Endpoints del Sistema

### 1. Autenticación (`/api/auth`)

#### 📝 Registro de Usuario
Crea una nueva cuenta de usuario y envía un correo de verificación.
- **Método:** `POST`
- **Ruta:** `/api/auth/register`
- **Autenticación requerida:** No
- **Cuerpo (JSON):**
  ```json
  {
    "name": "Juan Perez",
    "email": "juan.perez@example.com",
    "password": "miSuperPassword123"
  }
  ```
- **Validaciones:**
  - `name`: Obligatorio, mínimo 3 caracteres.
  - `email`: Obligatorio, debe ser un formato de correo válido y único.
  - `password`: Obligatorio, mínimo 6 caracteres.

#### 📧 Verificación de Correo Electrónico
Verifica la cuenta del usuario utilizando el token recibido por correo electrónico.
- **Método:** `GET`
- **Ruta:** `/api/auth/verify-email`
- **Autenticación requerida:** No
- **Parámetros de consulta (Query params):**
  - `verification_token` (string, obligatorio): Token JWT enviado al correo del usuario.
- **Flujo:** Busca al usuario, valida el token, marca `email_verificado` en `true` y guarda los cambios en la base de datos.

#### 🔑 Inicio de Sesión (Login)
Inicia sesión y obtiene un Token de Acceso (JWT).
- **Método:** `POST`
- **Ruta:** `/api/auth/login`
- **Autenticación requerida:** No
- **Cuerpo (JSON):**
  ```json
  {
    "email": "juan.perez@example.com",
    "password": "miSuperPassword123"
  }
  ```
- **Validaciones:**
  - El usuario debe existir.
  - La contraseña debe coincidir.
  - La cuenta de correo debe estar previamente verificada (`email_verificado` en `true`).
- **Respuesta Exitosa (JSON):**
  ```json
  {
    "message": "log in correcto",
    "ok": true,
    "status": 200,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### 📧 Solicitud de Restablecimiento de Contraseña
Envía un enlace de restablecimiento al correo electrónico si el usuario existe.
- **Método:** `POST`
- **Ruta:** `/api/auth/reset-password-request`
- **Autenticación requerida:** No
- **Cuerpo (JSON):**
  ```json
  {
    "email": "juan.perez@example.com"
  }
  ```
- **Flujo:** Genera un token temporal con vencimiento de 15 minutos y envía un correo electrónico con el link `${URL_FRONTEND}/reset-password?reset_password_token=${token}`.

#### 🔄 Restablecer Contraseña
Establece una nueva contraseña utilizando el token enviado por correo.
- **Método:** `POST`
- **Ruta:** `/api/auth/reset-password`
- **Autenticación requerida:** Sí (mediante cabecera `Authorization: Bearer <reset_password_token>`)
- **Cuerpo (JSON):**
  ```json
  {
    "password": "nuevaContraseniaSuperSegura"
  }
  ```
- **Validaciones:**
  - El token en los headers de autorización debe ser válido y no haber expirado.
  - La contraseña debe tener al menos 6 caracteres.

---

### 2. Perfil de Usuario

#### 👤 Obtener Perfil de Usuario
Obtiene la información básica del usuario autenticado si el token de acceso es válido.
- **Método:** `GET`
- **Ruta:** `/api/profile`
- **Autenticación requerida:** Sí (`authMiddleware`)
- **Cabeceras:** `Authorization: Bearer <access_token>`
- **Respuesta Exitosa (JSON):**
  ```json
  {
    "ok": true,
    "status": 200,
    "message": "estas autenticado"
  }
  ```

---

### 3. Espacios de Trabajo (`/api/workspace`)

#### 🏢 Crear Espacio de Trabajo
Crea un nuevo workspace y asigna automáticamente al creador el rol de propietario (`owner`).
- **Método:** `POST`
- **Ruta:** `/api/workspace/create`
- **Autenticación requerida:** Sí (`authMiddleware`)
- **Cuerpo (JSON):**
  ```json
  {
    "nombre": "Proyecto UTN Backend",
    "descripcion": "Espacio de trabajo para el backend de UTN"
  }
  ```
- **Validaciones:**
  - `nombre`: Obligatorio, mínimo 2 caracteres.
  - `descripcion`: Obligatorio.

#### 🔍 Listar Espacios de Trabajo por Usuario
Obtiene la lista de todos los espacios de trabajo a los que pertenece el usuario autenticado (donde tiene membresía activa o pendiente).
- **Método:** `GET`
- **Ruta:** `/api/workspace`
- **Autenticación requerida:** Sí (`authMiddleware`)

#### ✏️ Actualizar Espacio de Trabajo
Permite actualizar el nombre o descripción del workspace.
- **Método:** `PUT`
- **Ruta:** `/api/workspace/:workspace_id`
- **Autenticación requerida:** Sí (`authMiddleware` + `workspaceMiddleware`)
- **Permisos requeridos:** Rol de `owner` (dueño) o `admin` en el workspace.
- **Cuerpo (JSON):** (Debe enviarse al menos un campo)
  ```json
  {
    "nombre": "Nuevo Nombre del Proyecto",
    "descripcion": "Nueva descripción del espacio"
  }
  ```

#### 🗑️ Eliminar Espacio de Trabajo (Soft-Delete)
Elimina un espacio de trabajo de forma lógica de la base de datos.
- **Método:** `DELETE`
- **Ruta:** `/api/workspace/:workspace_id`
- **Autenticación requerida:** Sí (`authMiddleware` + `workspaceMiddleware`)
- **Permisos requeridos:** Rol de `owner` (dueño) del workspace.

---

### 4. Miembros del Espacio de Trabajo

#### ✉️ Invitar Miembro a un Workspace
Envía una invitación por correo a un usuario para unirse a un espacio de trabajo con un rol específico.
- **Método:** `POST`
- **Ruta:** `/api/workspace/:workspace_id/members`
- **Autenticación requerida:** Sí (`authMiddleware` + `workspaceMiddleware`)
- **Permisos requeridos:** Rol de `owner` (dueño) o `admin` en el workspace.
- **Cuerpo (JSON):**
  ```json
  {
    "invited_email": "invitado@example.com",
    "role": "member"
  }
  ```
- **Validaciones:**
  - El usuario invitado debe existir previamente en el sistema.
  - El usuario no debe ser miembro activo del workspace.
  - No debe poseer una invitación pendiente o previamente aceptada activa.
  - Roles válidos: `owner`, `admin`, `member`.
- **Flujo:** Crea una membresía en estado `pending`, genera un token con expiración de 30 días y envía un correo electrónico con botones para **Aceptar** y **Rechazar** la invitación.

#### ⚖️ Responder a Invitación de Miembro
Recibe la decisión (aceptada o rechazada) del miembro invitado mediante el enlace generado en el correo electrónico.
- **Método:** `GET`
- **Ruta:** `/api/workspace/:workspace_id/members/:decision`
- **Autenticación requerida:** No (se valida con el token enviado por parámetro de consulta)
- **Parámetros de Ruta:**
  - `:decision`: Debe ser `accepted` o `rejected`.
- **Parámetros de consulta (Query params):**
  - `token` (string, obligatorio): Token JWT enviado al correo en la invitación.
- **Flujo:** Verifica el token, busca la invitación asociada, valida que esté en estado `pending`, comprueba la fecha de expiración y actualiza tanto la invitación como el estado de la membresía según la `:decision` enviada.
