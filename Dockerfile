FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .
RUN npm run build



FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm install --omit=dev

RUN touch db.sqlite && chmod 666 db.sqlite

EXPOSE 3000

CMD ["node", "dist/src/server.js"]