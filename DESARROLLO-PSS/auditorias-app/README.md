# Sistema de Gestión de Auditorías de Seguimiento

Sistema full stack para la gestión y seguimiento de auditorías. Construido con **Node.js + Express** en el backend y **React 18 + Vite** en el frontend, con **PostgreSQL 16** como base de datos.

## 📁 Estructura del Proyecto

```
auditorias-app/
├── backend/               # API REST (Node.js + Express)
│   ├── routes/            # Definición de rutas
│   ├── controllers/       # Lógica de negocio
│   ├── middleware/        # Middlewares (auth, validación, etc.)
│   ├── config/            # Configuración (DB, JWT, correo)
│   └── utils/             # Utilidades y helpers
├── frontend/              # Aplicación web (React 18 + Vite)
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # Contextos de React
│   │   ├── services/      # Llamadas a la API
│   │   └── utils/         # Utilidades del frontend
│   └── public/            # Archivos estáticos
├── docker-compose.yml     # Configuración de PostgreSQL
└── README.md
```

## 🚀 Requisitos Previos

- **Node.js** v18 o superior
- **Docker** y **Docker Compose**
- **npm** (incluido con Node.js)

## 📦 Instalación Paso a Paso

### 1. Clonar o crear el proyecto

```bash
cd auditorias-app
```

### 2. Levantar la base de datos (PostgreSQL 16)

```bash
docker-compose up -d
```

Esto creará un contenedor con PostgreSQL 16 en el puerto `5432` con:
- **Base de datos:** `auditorias_db`
- **Usuario:** `postgres`
- **Contraseña:** `postgres`
- **Volumen persistente:** `postgres_data`

### 3. Configurar el Backend

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

Crear el archivo de variables de entorno:

```bash
cp .env.example .env
```

Editar el archivo `.env` con tus valores de configuración (puerto, base de datos, JWT, SMTP).

### 4. Configurar el Frontend

```bash
cd ../frontend
```

Instalar dependencias:

```bash
npm install
```

### 5. Ejecutar el proyecto

**Backend** (en una terminal):

```bash
cd backend
npm run dev
```

El servidor se ejecutará en `http://localhost:3001`.

**Frontend** (en otra terminal):

```bash
cd frontend
npm run dev
```

La aplicación se ejecutará en `http://localhost:5173`.

## 🛠️ Tecnologías Utilizadas

### Backend
- **Express** - Framework web
- **pg** - Cliente de PostgreSQL
- **jsonwebtoken** - Autenticación JWT
- **bcryptjs** - Encriptación de contraseñas
- **cors** - Middleware CORS
- **dotenv** - Variables de entorno
- **nodemailer** - Envío de correos
- **xlsx** - Exportación a Excel
- **node-cron** - Tareas programadas

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Bundler y dev server
- **react-router-dom** - Enrutamiento
- **axios** - Cliente HTTP
- **tailwindcss** - Estilos CSS
- **lucide-react** - Iconos

## 📝 Notas

- El archivo `.env.example` contiene las variables de entorno necesarias. Copia este archivo a `.env` y ajusta los valores según tu entorno.
- Asegúrate de que el puerto `5432` esté libre antes de levantar el contenedor de PostgreSQL.
- Para producción, cambia las credenciales de la base de datos y el `JWT_SECRET` por valores seguros.
