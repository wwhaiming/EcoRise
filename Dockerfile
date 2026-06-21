# EcoRise — single-host interactive demo image.
# One container serves the Express API AND the built React frontend from the same
# origin, so the httpOnly session cookie (sameSite=lax) works with no CORS. On boot
# the server seeds the demo board + account and the coach corpus (DEMO_MODE), so a
# fresh, ephemeral host comes up already populated, exactly like `npm run demo`.
#
# Works on any container host (Render, Fly.io, Railway, Cloud Run).
#   Required runtime env: JWT_SECRET (>= 32 random chars).
#   Recommended env: NODE_ENV=production, DEMO_MODE=true, COACH_ENABLED=true.

FROM node:20-bookworm

WORKDIR /app

# better-sqlite3 is a native module; node:20-bookworm ships the build toolchain
# (python3, make, g++) it compiles against during install. (slim variants do not.)

# Install dependencies first for better layer caching.
COPY package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm install --prefix backend && npm install --prefix frontend

# Copy the source and build the frontend into frontend/dist (served by the backend).
COPY . .
RUN npm run build --prefix frontend

ENV NODE_ENV=production
ENV DEMO_MODE=true
ENV COACH_ENABLED=true
# The host (Render/Fly/etc.) injects PORT; server.js reads process.env.PORT || 3001.
EXPOSE 3001

# JWT_SECRET is intentionally NOT baked in — the server refuses to boot without a
# strong one, so set it as a runtime env var (render.yaml auto-generates it).
CMD ["node", "backend/server.js"]
