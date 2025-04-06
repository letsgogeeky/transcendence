FROM node:latest
WORKDIR /app
COPY package*.json .
COPY . .
RUN npm i  && \
    npx prisma generate  && \
    npx tsc

CMD ["npm", "run", "start"]