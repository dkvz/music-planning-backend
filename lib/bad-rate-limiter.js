class BadRateLimiter {
  
  constructor() {
    this.max = 75;
    // 5 minutes of time window in ms:
    this.duration = 15*60*1000;
    this.reset();
  }

  reset() {
    this.counter = 0;
    this.lastStart = Date.now();
  }

  belowRateLimit() {
    if (Date.now() > (this.duration + this.lastStart)) {
      this.reset();
    }
    if (++this.counter > this.max) {
      return false; 
    } else {
      return true;
    }
  }

}

module.exports = BadRateLimiter;