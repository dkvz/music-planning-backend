# docker build -t generic-nodeserver .

# We want this image to be able to checkout a very specific commit.
# Will default to just getting the last one by doing a git checkout master.

# My plan is to use this with Kubernetes and hopefully trigger updates
# by adjusting the COMMIT env variable.

# You need to adjust the specific commit getting checkout out or remove that 
# environment variable altogether (will fetch latest commit in that case).
# docker run --name nodeserver-test -e REPOSITORY='https://github.com/dkvz/music-planning-backend.git' -e COMMIT='85f727ae44673f66f6d4b116f0076e98be951e8a' generic-nodeserver

FROM node:lts-alpine

ENV REPOSITORY 'https://github.com'
ENV COMMIT 'master'

RUN apk add --no-cache git
WORKDIR /usr/src
COPY init.sh ./

EXPOSE 8081
CMD ["sh", "init.sh"]