# LTS Node Alpine Image
FROM node:24-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm install

# Dev Stage
FROM base AS development

COPY . .
EXPOSE 5173
ENV CHOKIDAR_USERPOLLING=true
CMD ["npm", "run", "dev", "--", "--host"]

# Builder Stage
FROM base AS builder

COPY . .
RUN npm run build

# Prod (Nginx)
FROM nginx:alpine AS production

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "deamon off;"]
