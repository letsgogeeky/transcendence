FROM node:latest
WORKDIR /app
COPY package*.json .
COPY . .
RUN npm i  && \
    npx prisma generate

RUN npm run build

CMD npm run dev