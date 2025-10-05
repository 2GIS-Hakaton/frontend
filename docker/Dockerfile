FROM node:24-alpine3.21 AS builder
WORKDIR /build
RUN --mount=type=bind,source=package.json,target=/build/package.json \
    --mount=type=bind,source=package-lock.json,target=/build/package-lock.json  \
    npm install
COPY . .
RUN npm run build

FROM busybox:latest AS runner
WORKDIR /app

COPY --from=builder /build/dist .

EXPOSE 8080
CMD ["busybox", "httpd", "-f", "-v", "-p", "8080"]