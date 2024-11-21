# State 1: Build
FROM node:12 as build_state
# Get dependencies
COPY . .
RUN yarn install --network-timeout 1000000
RUN yarn
ENV NODE_ENV=production
# build
RUN yarn build

# State 2: Run
FROM node:16

RUN yarn global add serve
RUN mkdir -p /app
COPY --from=build_state dist /app
WORKDIR /app

EXPOSE 8080

CMD ["serve", "-s", ".", "-p", "8080"]
