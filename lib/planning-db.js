sha1 = require('js-sha1');

class PlanningDB {
  
  constructor(db) {
    this.db = db;
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
      this.db.all('SELECT * FROM planning ORDER BY created_date ASC', (err, rows) => {
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
        Date.now() / 1000,
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

}

module.exports = PlanningDB;