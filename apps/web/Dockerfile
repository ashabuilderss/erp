FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm install

FROM deps AS builder

WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Next 16.2.7 standalone layout (build context = apps/web, WORKDIR = /app):
#  - Next emits the standalone project under standalone/app/ containing
#    server.js, package.json, .next/ and a traced node_modules/
#  - .next/static and public are NOT traced into standalone and must be
#    copied explicitly
COPY --from=builder /app/.next/standalone/app ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget --no-quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
