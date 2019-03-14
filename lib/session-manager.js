class SessionManager {

  constructor() {
    this.sessions = {};
    // Max session lifetime in ms. I think
    // it's supposed to be 20 days.
    this.maxAge = 1000 * 60 * 60 * 24 * 20;
  }

  /**
   * Comes from here: https://gist.github.com/jed/982883
   * 
   * There's a very distant remote chance that this would not 
   * actually be unique, but it doesn't matter here since we
   * have a single level of logged in users and do not care
   * if it gets refreshed by some sort of super chance from
   * outer space.
   */
  static uuid(a) {
    return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,SessionManager.uuid);
  }

  newSession() {
    // Generate a token from uuid:
    const token = SessionManager.uuid();
    this.sessions[token] = SessionManager._sessionObject();
    // Also do some cleanup at the end:
    this._cleanUp();
    return token;
  }

  checkSession(token) {
    if (this.sessions[token] &&
      (Date.now() - this.sessions[token].time) <= this.maxAge) {
      // Session is still valid:
      return true;
    } else if (this.sessions[token]) {
      delete this.sessions[token];
    }
    return false;
  }

  refreshSession(token) {
    if (this.sessions[token]) this.sessions[token].time = Date.now();
  }

  static _sessionObject() {
    return {
      time: Date.now()
    };
  }

  _cleanUp() {
    const now = Date.now();
    Object.keys(this.sessions).forEach((s) => {
      if (this.sessions[s].time &&
        (now - this.sessions[s].time) > (this.maxAge + 15 * 60 * 1000)) {
        delete this.sessions[s];
      }
    });
  }

}

module.exports = SessionManager;