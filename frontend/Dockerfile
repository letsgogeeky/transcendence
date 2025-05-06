
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

# openssl req -x509 -nodes \
#   -newkey RSA:2048       \
#   -keyout root-ca.key    \
#   -days 365              \
#   -out root-ca.crt       \
#   -subj '/C=US/ST=Denial/L=Earth/O=Atest/CN=root_CA_for_firefox'

# openssl req -nodes   \
#   -newkey rsa:2048   \
#   -keyout server.key \
#   -out server.csr    \
#   -subj '/C=US/ST=Denial/L=Earth/O=Dis/CN=anything_but_whitespace'

# openssl x509 -req    \
#   -CA root-ca.crt    \
#   -CAkey root-ca.key \
#   -in server.csr     \
#   -out server.crt    \
#   -days 365          \
#   -CAcreateserial    \
#   -extfile <(printf "subjectAltName = DNS:localhost\nauthorityKeyIdentifier = keyid,issuer\nbasicConstraints = CA:FALSE\nkeyUsage = digitalSignature, keyEncipherment\nextendedKeyUsage=serverAuth")

# Add root-ca.crt to Firefox's trust store