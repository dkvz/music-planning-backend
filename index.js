const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const config = require('./config');
const PlanningDB = require('./lib/planning-db');
const SessionManager = require('./lib/session-manager');
const cookieParser = require('cookie-parser');
const { authMiddleware } = require('./lib/middlewares');

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
/**
 * END MIDDLEWARES
 */

const errServer = (res, msg) => {
  res.status(500);
  res.send('Server error');
  if (msg) console.log(msg);
};

const errNonAuth = (res) => {
  res.status(403);
  res.send('Non authorized');
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
          res.send('OK');
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
    } else if(req.body.token) {
      if (sessions.checkSession(req.body.token)) {
        sessions.refreshSession(req.body.token);
        res.cookie('token', req.body.token);
        res.send('OK');
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
      res.json({uuid});
    } catch (ex) {
      errServer(res, ex);
    } 
  } else {
    errNonAuth(res);
  }
});

app.get('/plannings/:id', async (req, res) => {
  // req.params.id is supposed to be set.
  // Supposed to be a uuid string.
  
});

app.get('/service-check', (req, res) => {
  res.send('OK');
});

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}.`);
});