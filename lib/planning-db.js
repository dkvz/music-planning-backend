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
      this.db.run(
        'INSERT INTO planning(uuid, name, created_date) VALUES (?,?,?)',
        PlanningDB.uuid(),
        name,
        Date.now() / 1000,
        function(err) {
          if (err) reject(err);
          // Insert was successful:
          resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Comes from here: https://gist.github.com/jed/982883
   */
  static uuid(a) {
    return a?
      (a^Math.random()*16>>a/4).toString(16) : 
      ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,SessionManager.uuid);
  }

}

module.exports = PlanningDB;