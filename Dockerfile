FROM node:20-alpine AS client-build

WORKDIR /client
COPY ./client/package*.json ./
RUN npm install --force
COPY ./client ./
RUN npm run build

FROM denoland/deno:alpine

RUN apk add --no-cache tzdata python3 make g++

ENV TZ=Etc/UTC

WORKDIR /myspeed

COPY ./server /myspeed/server
COPY ./deno.json /myspeed/deno.json

RUN deno install --allow-scripts

COPY --from=client-build /client/build /myspeed/build

VOLUME ["/myspeed/data"]

EXPOSE 5216

CMD ["deno", "run", "--allow-all", "server/index.js"]