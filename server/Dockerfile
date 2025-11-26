# LTS Node Alpine Image
FROM node:24-alpine AS base

WORKDIR /app

COPY package*.json ./

COPY prisma ./prisma

# Dev Stage
FROM base AS development

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "run", "dev"]

# Build Stage
FROM base AS builder

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

# Production Stage
FROM node:24-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000
CMD ["node", "dist/server.js"]