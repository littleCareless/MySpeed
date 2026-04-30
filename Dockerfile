FROM oven/bun:1 AS client-build

WORKDIR /client
COPY ./client/package.json ./
RUN bun install
COPY ./client ./
RUN bun run build

FROM oven/bun:1 AS server-build

WORKDIR /myspeed

COPY ./server /myspeed/server
COPY ./package.json /myspeed/package.json

RUN bun install

FROM oven/bun:1

RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=Etc/UTC

WORKDIR /myspeed

COPY --from=server-build /myspeed/server /myspeed/server
COPY --from=server-build /myspeed/package.json /myspeed/package.json
COPY --from=server-build /myspeed/node_modules /myspeed/node_modules
COPY --from=client-build /client/build /myspeed/build

VOLUME ["/myspeed/data"]

EXPOSE 5216

CMD ["bun", "run", "server/index.js"]
