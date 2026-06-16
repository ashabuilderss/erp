FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json prisma.config.ts ./
RUN npm install

FROM deps AS builder

WORKDIR /app
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate
COPY nest-cli.json tsconfig*.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 4000
CMD ["npm", "run", "start:prod"]
