# This Dockerfile is for a more generic image that can run other
# services based on Express or another HTTP server thingy.

# I'm mostly following the doc here: https://nodejs.org/en/docs/guides/nodejs-docker-webapp

# This won't work without some kind of storage for the database

# docker build -t nodeserver:1 --build-arg repository='https://github.com/dkvz/music-planning-backend' - < standalone.Dockerfile

# The image is not generic in any way... We need some sort of script that will download the repo, install the dependencies and run the thing.

FROM node:lts-alpine

ARG repository

RUN apk add --no-cache git
WORKDIR /usr/src/app
RUN git clone $repository .
RUN npm install

EXPOSE 8081
CMD ["npm", "start"]