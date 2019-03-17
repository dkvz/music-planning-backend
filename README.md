# Music Planning Backend
ExpressJS backend for a planning app. that is pretty much Doodle but for a band.

## Setting up
Requires NodeJS 10+.

First run `npm install` then `npm run dev` to start the server with autoreload enabled.

## API endpoints
I currently have them on a piece of paper and since I'm powering through this I might not copy the enpoint documentation. Yet.

### Timestamps
Timestamps in database are in seconds but JS uses milliseconds. The API expects to receive timestamps in milliseconds, but will send timestamps in seconds. Sorry.

### Rate-limiting
The all-presence endpoint can technically be used to DOS the service by filling up the database.

I thought of using a rate limiting module like this one: https://www.npmjs.com/package/express-rate-limit

But I could probably do something simpler like calculating the general request rate, regardless of client IP address, x-forwarded-for or whatever and completely disable the endpoint once a threshold is met.

Let's create a bad rate limiter as a class.

## Database
I picked SQLite because of ease of hosting (though you do need write privileges somewhere for it to work).

I decided to use this package because it's mentioned on the SQLite website: https://github.com/mapbox/node-sqlite3

Server will expect a database to be found in the "database" folder, with the filename provided in config.js. You can copy and rename the planning.empty.sqlite file.

All the database access methods are supposed to be surrounded by try catch somehow. All of them will return promises.

### Deleting and updating
Delete and update operations will return success even if the entry actually does not exist. This is by quick & dirty design.

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
- [ ] Add an option to disable CORS.