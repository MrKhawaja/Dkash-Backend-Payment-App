FROM node:lts-alpine
WORKDIR /app
COPY package.json /app
RUN npm i
COPY . /app
CMD ["node", "server.js"]