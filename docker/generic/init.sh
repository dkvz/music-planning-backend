#!/bin/sh

git clone "$REPOSITORY" app
cd app
git checkout "$COMMIT"
npm install
npm start