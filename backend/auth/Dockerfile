FROM node:latest
WORKDIR /app

# Generate server.key and server.crt
RUN openssl genrsa -out server.key 2048
RUN openssl req -new -key server.key -out server.csr -subj "/CN=localhost"
RUN openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

COPY package*.json .
COPY . .
RUN npm i  && \
    npx prisma generate  && \
    npx tsc

CMD ["npm", "run", "start"]