# ---------- Stage 1: Build ----------
FROM node:22 AS build

WORKDIR /app

# Copia apenas os manifests do frontend
COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci

# Copia o código do frontend
COPY frontend .

# Build de produção do Angular
RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve

# Copia o build gerado (o outputPath do angular.json é dist/frontend/browser)
COPY --from=build /app/dist/frontend/browser ./public

EXPOSE 3000

# Serve a pasta public onde está o build do Angular
CMD ["sh", "-c", "serve -s public -n -l ${PORT:-3000}"]
    