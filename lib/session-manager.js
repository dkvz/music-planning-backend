class SessionManager {

  constructor() {
    this.sessions = {};
    // Max session lifetime in ms. I think
    // it's supposed to be 20 days.
    this.maxAge = 1000*60*60*24*20;
  }

  newSession(token) {
    this.sessions[token] = SessionManager._sessionObject();
    // Also do some cleanup at the end:
    this._cleanUp();
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

  }

  static _sessionObject() {
    // There's only one thing in the returned object
    // but there might be more in the future. So I'll
    // leave it at that.
    return {
      time: Date.now()
    };
  }

  _cleanUp() {
    const now = Date.now();
    Object.keys(this.sessions).forEach((s) => {
      if (this.sessions[s].time &&
        (now - this.sessions[s].time) > (this.maxAge + 15*60*1000)) {
          delete this.sessions[s];
        }
    });
  }

}

module.exports = SessionManager;