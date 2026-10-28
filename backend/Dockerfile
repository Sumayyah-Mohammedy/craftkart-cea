# syntax=docker/dockerfile:1
# =========================================================
# CraftKart APPLICATION TIER image (Node.js / Express API)
# =========================================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# production dependencies only (no jest/nodemon in the image)
RUN npm ci --omit=dev --no-audit --no-fund

# ---------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=5000 \
    DB_SSL_CA=/app/certs/rds-global-bundle.pem

# AWS RDS certificate bundle so the API can VERIFY the database's TLS certificate
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/certs/rds-global-bundle.pem

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY app.js server.js ./
COPY config ./config
COPY controllers ./controllers
COPY db ./db
COPY middleware ./middleware
COPY models ./models
COPY routes ./routes
COPY scripts ./scripts
COPY utils ./utils

# Image version shown by /api/health (set by the CI pipeline)
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

# Run as the unprivileged "node" user, never root
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
