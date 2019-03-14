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

}

module.exports = PlanningDB;