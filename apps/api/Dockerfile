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
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7860

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7860/api/v1/health || exit 1

CMD ["node", "dist/main"]
