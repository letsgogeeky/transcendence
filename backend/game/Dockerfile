FROM node:latest
WORKDIR /app
COPY package*.json .
COPY . .
RUN npm i
CMD npm run start