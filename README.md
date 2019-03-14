# Music Planning Backend
ExpressJS backend for a planning app. that is pretty much Doodle but for a band.

## Setting up
Requires NodeJS 10+.

First run `npm install` then `npm run dev` to start the server with autoreload enabled.

## API endpoints
I currently have them on a piece of paper and since I'm powering through this I might not copy the enpoint documentation. Yet.

## Database
I picked SQLite because of ease of hosting (though you do need write privileges somewhere for it to work).

I decided to use this package because it's mentioned on the SQLite website: https://github.com/mapbox/node-sqlite3

Server will expect a database to be found in the "database" folder, with the filename provided in config.js. You can copy and rename the planning.empty.sqlite file.

All the database access methods are supposed to be surrounded by try catch somehow. All of them will return promises.

### SQLite doc
* [Main ways to execute statements, get data etc.](https://github.com/mapbox/node-sqlite3/wiki/API)
* [How to do queries sequentially (since they normally use callbacks)](https://github.com/mapbox/node-sqlite3/wiki/Control-Flow)

## Sessions
I use the UUID generator from here: https://gist.github.com/jed/982883

## Accounts
Accounts passwords are hashed in sha1 with hex representation as follows:
```
HASHED_PWD = sha1(password + salt)
```

# TODO
- [ ] Check if just providing params after the query in DB access methods from SQLite3 actually prevents SQL injection.
- [ ] Does rejecting a promise make it catchable in a try catch when using async / await ?