# ---------- Stage 1: builder ----------
FROM node:22 AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./
COPY backend/src ./src

RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:22

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

# Prisma Client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Prisma schema
COPY --from=builder /app/prisma ./prisma

# App compilado
COPY --from=builder /app/dist ./dist

EXPOSE 8001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]