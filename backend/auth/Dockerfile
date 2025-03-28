FROM node:latest
WORKDIR /app
COPY package*.json .
COPY . .
RUN npm i  && \
    npx prisma generate  && \
    npx tsc
RUN npx prisma db push
CMD npm run start