# Build the frontend.
FROM node:22-alpine AS frontend

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

# Run the optional self-hosted server.
FROM node:22-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev
COPY server/server.js ./server/server.js
COPY shared ./shared
COPY --from=frontend /app/dist ./dist

EXPOSE 3000

CMD ["node", "server/server.js"]
