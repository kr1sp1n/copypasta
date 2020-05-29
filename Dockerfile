FROM hayd/alpine-deno:latest AS base
WORKDIR /app

FROM base AS build
COPY ./src ./src
RUN deno bundle ./src/main.js bundle.js

FROM build AS release
RUN apk --no-cache add tini
USER deno
COPY --from=build /app/bundle.js ./bundle.js
ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "deno", "run", "--allow-net", "bundle.js"]
EXPOSE 8080