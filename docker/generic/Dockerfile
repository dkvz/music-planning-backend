# docker build -t generic-nodeserver .

# docker run --name nodeserver-test -e REPOSITORY='https://github.com/dkvz/music-planning-backend' generic-nodeserver

FROM node:lts-alpine

ENV REPOSITORY 'https://github.com'

RUN apk add --no-cache git
WORKDIR /usr/src
COPY init.sh ./

EXPOSE 8081
CMD ["sh", "init.sh"]