# syntax=docker/dockerfile:1
# =========================================================
# CraftKart WEB TIER image
# Stage 1 builds the React SPA, stage 2 serves it with Nginx,
# which also reverse-proxies /api to the Application Tier.
# =========================================================
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (cached layer unless package files change)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Create React App bakes REACT_APP_* values into the bundle at BUILD time.
# These are all PUBLIC values (they end up in the browser anyway) - real
# secrets (DB password, JWT, Stripe secret key) only exist in the app tier.
ARG REACT_APP_API_URL=/api
ARG REACT_APP_SUPABASE_URL=""
ARG REACT_APP_SUPABASE_ANON_KEY=""
ARG REACT_APP_BUCKET_NAME=craftkart
ARG REACT_APP_DOCS_BUCKET=seller-documents
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL \
    REACT_APP_SUPABASE_ANON_KEY=$REACT_APP_SUPABASE_ANON_KEY \
    REACT_APP_BUCKET_NAME=$REACT_APP_BUCKET_NAME \
    REACT_APP_DOCS_BUCKET=$REACT_APP_DOCS_BUCKET \
    CI=false \
    GENERATE_SOURCEMAP=false
RUN npm run build

# ---------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
# nginx's entrypoint renders /etc/nginx/templates/*.template with envsubst
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html

# Where to send /api traffic. Overridden at runtime:
#   docker-compose -> http://backend:5000
#   AWS            -> http://<internal ALB DNS name>
ENV BACKEND_URL=http://backend:5000 \
    NGINX_RESOLVER=127.0.0.11

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1/healthz || exit 1
