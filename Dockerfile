FROM node:20 as builder
WORKDIR /app
COPY ./package-lock.json .
COPY ./package.json .
RUN npm ci
COPY . .
RUN npm run build


FROM node:20 as app
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY package.json .
CMD ["npm", "start"]