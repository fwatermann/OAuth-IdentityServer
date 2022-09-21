FROM node:lts-alpine as building

WORKDIR /app
COPY ./*.json /app/
RUN npm ci

COPY ./src /app/src
COPY ./config.template.json /app/src/config/config.json
COPY ./*.* /app
RUN npm install typescript -g
RUN npm run unix-build

FROM node:lts-alpine

WORKDIR /app

COPY --from=building /app/dist /app
COPY --from=building /app/*.* /app/
COPY ./config.template.json /app/config.json
RUN npm install --production

ENV NODE_ENV=production

EXPOSE 80
CMD node index.js
