# Music Planning Backend
ExpressJS backend for a planning app. that is pretty much Doodle but for a band.

## Setting up
Requires NodeJS 10+.

First run `npm install` then `npm run dev` to start the server with autoreload enabled.

## API endpoints
I currently have them on a piece of paper and since I'm powering through this I might not copy the enpoint documentation. Yet.

-> I had to change delete because it's never supposed to have a request body and Axios actually sort of enforces that.

### Timestamps
Timestamps in database are in seconds but JS uses milliseconds. The API expects to receive timestamps in milliseconds, but will send timestamps in seconds. Sorry.

### Rate-limiting
The all-presence endpoint can technically be used to DOS the service by filling up the database.

I thought of using a rate limiting module like this one: https://www.npmjs.com/package/express-rate-limit

But I could probably do something simpler like calculating the general request rate, regardless of client IP address, x-forwarded-for or whatever and completely disable the endpoint once a threshold is met.

Let's create a bad rate limiter as a class.

### CORS
I'm having issues with CORS because I wanted to use cookies for authentication and that requires very specific headers, including using `{withCredentials: true}` as an Axios option. But that's not enough, withCredentials will NOT work if the Access-Control-Allow-Origin header is set to "*", which it is if you use the cors middleware with no options.

To add multiple allowed origins it looks like you have to do something weird with a function that checks if origin is allowed or not as shown on this page: https://expressjs.com/en/resources/middleware/cors.html

From what I understand I need to do something like that:
```js
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
```

Which led me to have this in index.js when I register the middleware:
```js
app.use(cors({
  credentials: true, 
  origin: function(origin, callback) {
    if (config.corsOrigin.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}));
```

Apparently you can pass middlewares to Express routes, and that's how you would easily only selectively enable CORS with different options on different routes.

## Database
I picked SQLite because of ease of hosting (though you do need write privileges somewhere for it to work).

I decided to use this package because it's mentioned on the SQLite website: https://github.com/mapbox/node-sqlite3

Server will expect a database to be found in the "database" folder, with the filename provided in config.js.
You can initialize the database using "sqlite_model.sql" at the root of the project.

All the database access methods are supposed to be surrounded by try catch somehow. All of them will return promises.

### Deleting and updating
Delete and update operations will return success even if the entry actually does not exist. This is by quick & dirty design.

### SQLite doc
* [Main ways to execute statements, get data etc.](https://github.com/mapbox/node-sqlite3/wiki/API)
* [How to do queries sequentially (since they normally use callbacks)](https://github.com/mapbox/node-sqlite3/wiki/Control-Flow)

### DB Updates

#### Adding deleted flag for plannings and category for events
For categories I'm not creating a table with the category names etc. It's just going to be 1 and 2 (**CAREFUL NOT TO USE 0**).

```sql
ALTER TABLE planning ADD deleted INTEGER DEFAULT 0;
ALTER TABLE event ADD category INTEGER DEFAULT 1;
```

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
- [ ] Dates are really weird in database. Default to current timestamp is putting a date text in there, but I'm using a JS timestamp otherwise. Both are working and can be provided to JS Date() constructor, so it works, but uh... Yeah
- [ ] At some point I got into my head that the "presence" field in the presence table is actually useless since an entry existing already signifies presence. But that's not true at all, we might need it to also show absences.