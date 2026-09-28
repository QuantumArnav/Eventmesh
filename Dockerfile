FROM node:24-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/dev.db
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

COPY . .
RUN npm run db:setup && npm run build

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["sh", "-c", "npm run db:deploy && npm run start -- --hostname 0.0.0.0"]
