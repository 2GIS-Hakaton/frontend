FROM node:24 AS builder
WORKDIR /build
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev"]