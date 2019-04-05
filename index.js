const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const config = require('./config');
const PlanningDB = require('./lib/planning-db');
const SessionManager = require('./lib/session-manager');
const cookieParser = require('cookie-parser');
const { authMiddleware } = require('./lib/middlewares');
const BadRateLimiter = require('./lib/bad-rate-limiter');
const cors = require('cors');

const app = express();

const db = new sqlite3.Database(config.database, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.log('Database connection failed.');
    process.exit();
  }
});
// To hopefully get the best concurrent mode:
db.run('PRAGMA journal_mode = WAL;');
// Get the data access class:
pDB = new PlanningDB(db);

// Handling user sessions in memory for the best
// quick and dirty effect.
const sessions = new SessionManager();

/**
 * MIDDLEWARES HERE
 */
// We need the JSON middleware because all POST
// requests will send JSON bodies:
app.use(cookieParser());
app.use(express.json());
// The authentication middleware needs the sessions manager:
app.use(authMiddleware(sessions));
app.use(cors({credentials: true, origin: config.corsOrigin}));
/**
 * END MIDDLEWARES
 */

const rateLimiter = new BadRateLimiter();

const errServer = (res, msg) => {
  res.status(500);
  res.send('Server error');
  if (msg) console.log(msg);
};

const errNonAuth = (res) => {
  res.status(403);
  res.send('Non authorized');
};

const errNotFound = (res) => {
  res.status(404);
  res.send('Not found');
};

const successResponse = (res) => {
  res.send('OK');
};

app.get('/', async (req, res) => {
  /*db.each('SELECT * FROM login', (err, row) => {
    if (err) console.log(err);
    console.log(row);
  });*/
  res.send('NOTHING HERE');
});

app.post('/login', async (req, res) => {
  // We should have a JSON body with:
  // - username
  // - EITHER password OR token
  if (req.body && req.body.username && (req.body.password || req.body.token)) {
    if (req.body.password) {
      try {
        if (await pDB.checkLogin(req.body.username, req.body.password)) {
          // Send a cookie along:
          res.cookie('token', sessions.newSession());
          successResponse(res);
          return;
        } else {
          // Non authorized.
          errNonAuth(res);
          return;
        }
      } catch (ex) {
        errServer(res, ex);
        return;
      }
    } else if (req.body.token) {
      if (sessions.checkSession(req.body.token)) {
        sessions.refreshSession(req.body.token);
        res.cookie('token', req.body.token);
        successResponse(res);
      } else {
        errNonAuth(res);
      }
    }
  }
  res.status(400);
  res.send('Bad request body format');
});

app.get('/plannings', async (req, res) => {
  // Requires being authenticated:
  if (req.userAuthenticated) {
    try {
      res.json(await pDB.getAllPlannings());
    } catch (ex) {
      errServer(res, ex);
    }
  } else {
    errNonAuth(res);
  }
});

app.post('/plannings', async (req, res) => {
  // Requires being authenticated:
  if (req.userAuthenticated) {
    const name = (req.body.name) ? req.body.name : '';
    try {
      const uuid = await pDB.insertPlanning(name);
      res.json({ uuid });
    } catch (ex) {
      errServer(res, ex);
    }
  } else {
    errNonAuth(res);
  }
});

app.delete('/plannings/:id', async (req, res) => {
  if (req.userAuthenticated) {
    if (req.params.id && req.params.id.length > 2) {
      try {
        await pDB.setPlanningDeleted(req.params.id);
        successResponse(res);
      } catch (ex) {
        errServer(res, ex);
      }
    } else {
      res.status(400);
      res.send('Bad request - Missing planning_id field');
    }
  } else {
    errNonAuth(res);
  }
});

app.get('/plannings/:id', async (req, res) => {
  // req.params.id is supposed to be set.
  // Supposed to be a uuid string.
  if (req.params.id && req.params.id.length > 2) {
    try {
      const result = await pDB.getFullPlanning(req.params.id);
      // Result is null if the planning object was not found:
      if (result !== null) {
        res.json(result);
      } else {
        // 404:
        errNotFound(res);
      }
    } catch (ex) {
      errServer(res, ex);
    }
  } else {
    res.status(400);
    res.send('Bad request - ID is too short');
  }
});

app.post('/events', async (req, res) => {
  // Only administrators (which is any logged in user, really)
  // can post events. Events are attached to a planning object.
  if (req.userAuthenticated) {
    try {
      // Check if we got the date and if it's valid:
      let eventDate;
      if (req.body.event_date) {
        // eventDate is supposed to be a ms timestamp.
        // Or anything that would work with the JS
        // Date constructor.
        eventDate = new Date(req.body.event_date);
      }
      if (!eventDate || isNaN(eventDate.getTime())) {
        // Invalid date:
        res.status(400);
        res.send('Bad request - Invalid date');
        return;
      }
      // Check if we're updating an event:
      if (req.body.id) {
        await pDB.updateEvent(
          req.body.id,
          eventDate,
          req.body.name,
          req.body.description
        );
        successResponse(res);
      } else {
        // We need to check if planning_id was provided
        // and if it exists:
        if (req.body.planning_id &&
          req.body.planning_id.length > 2 &&
          await pDB.getPlanning(req.body.planning_id)) {
            // The planning exists.
            await pDB.createEvent(
              req.body.planning_id,
              eventDate,
              req.body.name,
              req.body.description
            );
            successResponse(res);
        } else {
          errNotFound(res);
        }
      }
    } catch (ex) {
      errServer(res, ex);
    }
  } else {
    errNonAuth(res);
  }
});

// Most of this could be refactored since we have
// multiple similar delete endpoints.
app.delete('/events/:id', async (req, res) => {
  if (req.userAuthenticated) {
    if (req.params.id) {
      try {
        await pDB.deleteEvent(req.params.id);
        successResponse(res);
      } catch (ex) {
        errServer(res, ex);
      }
    } else {
      res.status(400);
      res.send('Bad request - Missing event ID');
    }
  } else {
    errNonAuth(res);
  }
});

app.post('/presence', async (req, res) => {
  // Endpoint to allow administrators to edit
  // any single event.
  if (req.userAuthenticated) {
    try {
      if (req.body.id) {
        // Updating:
        await pDB.updatePresence(
          req.body.id, 
          req.body.name, 
          req.body.instrument_code, 
          req.body.presence
        );
        res.json({id: req.body.id});
      } else {
        // Adding, check that the event exists:
        if (req.body.event_id && 
          await pDB.getEvent(req.body.event_id) && 
          req.body.name) {
            const newId = await pDB.createPresence(
              req.body.event_id, 
              req.body.name,
              req.body.instrument_code,
              req.body.presence
            );
            res.json({id: newId});
        } else {
          res.status(400);
          res.send(`Bad Request - Missing event ID 
            or event does not exist or name is not set`);
        }
      }
    } catch (ex) {
      errServer(res, ex);
    }
  } else {
    errNonAuth(res);
  }
});

app.delete('/presence/:id', async (req, res) => {
  if (req.userAuthenticated) {
    if (req.params.id) {
      try {
        await pDB.deletePresence(req.params.id);
        successResponse(res);
      } catch (ex) {
        errServer(res, ex);
      }
    } else {
      res.status(400);
      res.send('Bad request - Missing presence ID');
    }
  } else {
    errNonAuth(res);
  }
});

app.post('/all-presence', async (req, res) => {
  // Endpoint to persist all the presence info for
  // someone at once. This is the only allowed way
  // to save presence info for non logged-in users.
  // Endpoint can be abused to quickly fill up the 
  // database so we're rate limiting it.
  if (rateLimiter.belowRateLimit()) {
    if (req.body.name && 
      req.body.name.trim().length > 1 && 
      req.body.presences &&
      Array.isArray(req.body.presences) &&
      req.body.presences.length > 0) {
        try {
          // I suppose we can make a whole bunch of promises:
          const inserts = Array();
          // I could use reduce here.
          req.body.presences.forEach(p => {
            if (p.event_id) {
              inserts.push(
                pDB.createPresence(
                  p.event_id,
                  req.body.name,
                  p.instrument_code,
                  p.presence
                )
              );
            }
          });
          await Promise.all(inserts);
          successResponse(res);
        } catch (ex) {
          errServer(res, ex);
        }
    } else {
      res.status(400);
      res.send('Bad request - Missing fields');
    }
  } else {
    res.status(503);
    res.send('Endpoint currenly unavailable due to rate restrictions');
  }
});

app.get('/service-check', (req, res) => {
  successResponse(res);
});

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}.`);
});