# ETAP 1: Budowanie (Build Stage)
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiujemy pliki definicji zależności
COPY package*.json ./
COPY tsconfig.json ./

# Instalujemy WSZYSTKIE zależności (również te deweloperskie do kompilacji)
RUN npm install

# Kopiujemy resztę kodu i kompilujemy TS -> JS
COPY . .
RUN npm run build

# ETAP 2: Produkcja (Production Stage)
FROM node:20-alpine AS runner
WORKDIR /app

# Ustawiamy środowisko na produkcyjne
ENV NODE_ENV=prod

# Kopiujemy tylko skompilowany kod z poprzedniego etapu
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalujemy TYLKO zależności produkcyjne (bez TypeScripta, ts-node itp.)
# Dzięki temu obraz jest o kilkaset MB mniejszy
RUN npm install --omit=dev

# SQLite potrzebuje pliku bazy - tworzymy go z odpowiednimi uprawnieniami
RUN touch db.sqlite && chmod 666 db.sqlite

EXPOSE 3000

# Startujemy aplikację używając czystego Node.js
CMD ["node", "dist/server.js"]