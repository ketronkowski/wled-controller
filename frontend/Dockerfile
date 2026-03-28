# Build stage runs on native builder platform — avoids slow QEMU for npm install/build.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
# nginx docker image runs envsubst on *.template files at startup
ENV BACKEND_HOST=backend
EXPOSE 80
