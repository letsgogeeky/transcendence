
# Base image with Node.js
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN rm -rf node_modules && npm install

# Copy the rest of the application
COPY . .

# Development stage
FROM base AS dev
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production stage
# FROM base AS prod
# RUN npm run build
# CMD ["npx", "http-server", "dist", "-p", "8080"]
# EXPOSE 8080
