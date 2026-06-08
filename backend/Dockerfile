FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000 3001
CMD ["npm", "run", "start:dev"]

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12 AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000 3001
HEALTHCHECK --interval=30s --timeout=3s CMD ["node", "-e", "require('http').get('http://localhost:3000/api/v1/pools', r => r.statusCode === 200 ? process.exit(0) : process.exit(1))"]
CMD ["dist/main.js"]
