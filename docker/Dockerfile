FROM node:24 AS builder
WORKDIR /build
COPY . .
RUN npm install && npm run build

FROM busybox:latest AS runner
WORKDIR /app

COPY --from=builder /build/dist .

EXPOSE 8080
CMD ["busybox", "httpd", "-f", "-v", "-p", "8080"]