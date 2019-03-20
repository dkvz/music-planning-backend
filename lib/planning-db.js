const sha1 = require('js-sha1');

class PlanningDB {
  
  constructor(db) {
    this.db = db;
  }

  _getOne(query, id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        query,
        id,
        (err, res) => {
          if (err) reject(err);
          // Result will be undefined if no entry was found.
          resolve(res);
        }
      );
    });
  }

  _insert(query, params) {
    return new Promise((resolve, reject) => {
      this.db.run(
        query,
        params,
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  _update(query, params) {
    return new Promise((resolve, reject) => {
      this.db.run(
        query,
        params,
        err => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  _delete(query, id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        query,
        id,
        err => {
          if (err) reject(err);
          resolve(id);
        }
      );
    });
  }

  checkLogin(username, password) {
    return new Promise((resolve, reject) => {
      if (username && password) {
        // Get the account from the database:
        this.db.get('SELECT * FROM login WHERE name = ?', username, (err, row) => {
          if (err) reject(err);
          if (row) {
            if (row.password === sha1(password + row.salt)) {
              resolve(true);
            }
          }
          resolve(false);
        });
      } else {
        resolve(false);
      }
    });
  }

  getAllPlannings() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM planning WHERE deleted = 0 ORDER BY created_date ASC', 
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        });
    });
  }

  insertPlanning(name) {
    return new Promise((resolve, reject) => {
      // Last inserted ID is in the callback of db.run, but as this.lastID so
      // we can't use an arrow function.
      // Actually I don't care since I'm generating the ID myself.
      const newId = PlanningDB.uuid();
      this.db.run(
        'INSERT INTO planning(uuid, name, created_date) VALUES (?,?,?)',
        newId,
        name,
        Date.now(),
        function(err) {
          if (err) reject(err);
          // Insert was successful:
          //resolve(this.lastID);
          resolve(newId);
        }
      );
    });
  }

  /**
   * This has nothing to do with an actual uuid, it's more like...
   * a short string ID.
   */
  static uuid(len = 8) {
    const source = 'acdefghijklmnopqrstuvwxzzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
    const res = [];
    for (let i = 0; i < len; i++) {
      res.push(source.charAt(Math.random() * (source.len + 1)));
    }
    return res.join('');
  }

  getPlanning(uuid) {
    return this._getOne(
      'SELECT uuid, name, created_date FROM planning WHERE uuid = ?',
      uuid
    );
/*     return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT uuid, name, created_date FROM planning WHERE uuid = ?',
        uuid,
        (err, res) => {
          if (err) reject(err);
          // Result will be undefined if no entry was found.
          resolve(res);
        }
      );
    });
 */  
  }

  deletePlanning(uuid) {
    // TODO This should delete everything recusively.
    // For the moment, it's not. Because we're changing the 
    // plannings deletion to just be a flag.
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM planning WHERE uuid = ?',
        uuid,
        err => {
          if (err) reject(err);

          resolve(uuid);
        }
      );
    });
  }

  setPlanningDeleted(uuid) {
    return this._update(
      'UPDATE planning SET deleted = 1 WHERE uuid = ?',
      [uuid]
    );
  }

  getFullPlanning(uuid) {
    return new Promise((resolve, reject) => {
      // We could use db.serialize, but I'm going
      // callback semi-hell here.
      this.db.get(
        'SELECT uuid, name, created_date FROM planning WHERE uuid = ?', 
        uuid, 
        (err, res) => {
          if (err) reject(err);
          if (res) {
            // We can use all the data in "res" as is.
            // Get all the events for that planning and add it to "res":
            this.db.all(
              `SELECT id, event_date, name, description FROM event 
              WHERE planning_uuid = ? ORDER BY event_date ASC`,
              uuid,
              (err, rows) => {
                if (err) reject(err);
                res.events = rows;
                db.serialize(() => {
                  res.events.forEach(event => {
                    // Get the presence info for these events:
                    this.db.all(
                      `SELECT id, name, instrument_code, presence FROM 
                      presence WHERE event_id = ? 
                      ORDER BY instrument_code ASC`,
                      event.id,
                      (err, presences) => {
                        if (err) reject(err);
                        presences.forEach(pres => {
                          pres.presence = pres.presence ? true : false
                        });
                        event.presences = presences;
                      }
                    );
                  });
                }, _ => {
                  // I think I gotta resolve here.
                  // Uh...
                  resolve(res);
                }); 
              }
            );
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  getEvent(eventId) {
    return this._getOne(
      `SELECT id, planning_id, event_date, name, description 
      FROM event WHERE id = ?`,
      eventId
    );
  }

  createEvent(planningId, eventDate, name, description) {
    // We expect eventDate to be a Date object.
    return this._insert(
      'INSERT INTO event(planning_uuid, event_date, name, description) VALUES (?,?,?,?)',
      [
        planningId,
        eventDate.getTime() / 1000,
        name,
        description
      ]
    );
    /* return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO event(planning_uuid, event_date, name, description) VALUES (?,?,?,?)',
        planningId,
        eventDate.getTime() / 1000,
        name,
        description,
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    }); */
  }

  updateEvent(eventId, eventDate, name, description) {
    return this._update(
      'UPDATE event SET event_date = ?, name = ?, description = ? WHERE id = ?',
      [
        eventDate.getTime() / 1000,
        name,
        description,
        eventId
      ]
    );
  }

  deleteEvent(eventId) {
    return new Promise((resolve, reject) => {
      // Recursively delete all presences too:
      this._delete(
        'DELETE FROM presence WHERE event_id = ?',
        eventId
      ).then(() => {
        this._delete(
          'DELETE FROM event WHERE id = ?',
          eventId
        )
        .then(() => resolve(eventId))
        .catch((err) => reject(err));
      })
      .catch((err) => reject(err));
    });
  }

  createPresence(eventId, name, instrumentCode, presence) {
    return this._insert(
      `INSERT INTO presence (event_id, name, instrument_code, presence) 
      VALUES (?, ?, ?, ?)`,
      [
        eventId,
        name,
        instrumentCode,
        presence ? 1 : 0
      ]
    );
  }

  updatePresence(presenceId, name, instrumentCode, presence) {
    return this._update(
      `UPDATE presence SET name = ?, instrument_code = ?, presence = ? 
      WHERE id = ?`,
      [
        name,
        instrumentCode,
        presence ? 1 : 0,
        presenceId
      ]
    );
  }

  deletePresence(presenceId) {
    return this._delete(
      'DELETE FROM presence WHERE id = ?',
      presenceId
    );
  }

}

module.exports = PlanningDB;