# THIS DOCKERFILE HAS NOT BEEN TESTED

# Create an image from the source.

# Great doc about Dockerizing NodeJS: 
# https://nodejs.org/de/docs/guides/nodejs-docker-webapp/

# We're also using a multi-stage build.

FROM node:lts-alpine as install-stage
WORKDIR /usr/src/app
COPY ../package*.json ./
RUN npm install
# I need to NOT copy the database folder.
COPY ../*.js .
COPY ../lib .

FROM node:lts-alpine as production-stage
WORKDIR /usr/src/app
COPY --from=install-stage /usr/src/app /usr/src/app
EXPOSE 8081
CMD ["npm", "start"]