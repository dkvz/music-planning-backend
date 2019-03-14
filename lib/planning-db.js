sha1 = require('js-sha1');

class PlanningDB {
  
  constructor(db) {
    this.db = db;
  }

  checkLogin(username, password) {
    return new Promise((resolve) => {
      if (username && password) {
        // Get the account from the database:
        this.db.get('SELECT * FROM login WHERE name = ?', username, (err, row) => {
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



}

module.exports = PlanningDB;