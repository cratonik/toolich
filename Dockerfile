# Step 1: Base image
FROM node:20-alpine AS base

# Step 2: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Step 3: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js requires this variable to optimize the build for production
ENV NODE_ENV=production
RUN npm run build

# Step 4: Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

# Copy necessary build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 4000

CMD ["node", "server.js"]