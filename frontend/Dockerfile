FROM node:alpine as base

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=base /app/dist/ /usr/share/nginx/html/

EXPOSE 3000
