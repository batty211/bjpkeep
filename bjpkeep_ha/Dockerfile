# Build stage
FROM node:22-bookworm-slim AS builder

# Install system dependencies for canvas (needed during build/prisma generate)
RUN apt-get update && apt-get install -y \
    openssl \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg62-turbo-dev \
    libgif-dev \
    librsvg2-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install dependencies (Cached)
COPY package*.json ./
RUN npm ci

# 2. Generate Prisma Client (Cached unless schema changes)
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate

# 3. Build Application (Always runs if source changes)
COPY . .
RUN npm run build

# Production stage
FROM node:22-bookworm-slim

# Install runtime dependencies for canvas and fonts
RUN apt-get update && apt-get install -y \
    openssl \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    libexpat1 \
    fonts-noto-core \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-thai-tlwg \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install bashio
RUN \
    curl -J -L -o /tmp/bashio.tar.gz \
        "https://github.com/hassio-addons/bashio/archive/v0.16.2.tar.gz" \
    && mkdir /tmp/bashio \
    && tar zxvf /tmp/bashio.tar.gz --strip 1 -C /tmp/bashio \
    && mv /tmp/bashio/lib /usr/lib/bashio \
    && ln -s /usr/lib/bashio/bashio /usr/bin/bashio \
    && rm -rf /tmp/bashio.tar.gz /tmp/bashio

WORKDIR /app

# Copy production artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/run.sh ./run.sh

# Also copy source for dev_mode support
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/tailwind.config.ts ./bjpkeep_ha/tailwind.config.ts 2>/dev/null || true

# Make sure run.sh is executable
RUN chmod +x /app/run.sh

EXPOSE 3000

CMD ["/app/run.sh"]
