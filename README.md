# Yawar — Colectiva por la Sostenibilidad Menstrual

Sitio web oficial de **Colectiva Yawar**, construido con [Astro](https://astro.build) y TailwindCSS.

---

## Estructura del proyecto

```text
/
├── nginx/
│   └── nginx.conf              # Configuración de Nginx (requerida para Docker)
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/                 # Imágenes, logos e iconos
│   ├── components/
│   │   ├── about/
│   │   ├── footer/
│   │   ├── header/
│   │   ├── hero/
│   │   ├── info/
│   │   └── talleres/
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro         # /
│   │   ├── about/              # /about
│   │   ├── talleres/           # /talleres
│   │   ├── recursos/           # /recursos
│   │   └── estadisticas/       # /estadisticas
│   └── utils/
│       ├── constants.ts
│       └── navigation.ts
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Desarrollo local

Requiere [Node.js 20+](https://nodejs.org) y [pnpm](https://pnpm.io).

```sh
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo en localhost:4321
pnpm dev

# Construir para producción (salida en ./dist/)
pnpm build

# Previsualizar la build de producción localmente
pnpm preview
```

---

## Docker

### Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- El archivo `nginx/nginx.conf` debe existir (ver sección siguiente)

### Crear nginx/nginx.conf

El `Dockerfile` requiere este archivo. Créalo en la raíz del proyecto:

```sh
mkdir -p nginx
```

Luego crea `nginx/nginx.conf` con el siguiente contenido:

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    server_tokens off;
    sendfile on;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml text/javascript image/svg+xml;

    client_body_temp_path /tmp/client_body;
    proxy_temp_path       /tmp/proxy;

    server {
        listen 8080;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ $uri.html $uri/index.html =404;
        }

        location /_astro/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        error_page 404 /404.html;
    }
}
```

### Construir y correr con Docker Compose

```sh
# Construir la imagen y levantar el contenedor
docker compose up --build

# Correr en segundo plano
docker compose up --build -d

# Ver logs del contenedor
docker compose logs -f

# Detener el contenedor
docker compose down
```

El sitio estará disponible en **http://localhost:8080**.

### Comandos Docker útiles

```sh
# Reconstruir la imagen desde cero (sin caché)
docker compose build --no-cache

# Ver el estado del contenedor
docker compose ps

# Acceder al contenedor
docker exec -it yawar-app sh
```

---

## Comandos Astro

| Comando               | Acción                                            |
| :-------------------- | :------------------------------------------------ |
| `pnpm dev`            | Servidor de desarrollo en `localhost:4321`        |
| `pnpm build`          | Build de producción en `./dist/`                  |
| `pnpm preview`        | Previsualizar la build localmente                 |
| `pnpm astro ...`      | Comandos CLI: `astro add`, `astro check`, etc.    |
| `pnpm astro -- --help`| Ayuda del CLI de Astro                            |
