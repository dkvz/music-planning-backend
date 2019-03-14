function authMiddleware(sessions) {
  // Check if there's a cookie with "token" in it.
  // If yes, check validity. Put a flag in the request if valid.
  // Destroy cookie if invalid. Also set the flag but to the 
  // opposite value.
  return function(req, res, next) {
    res.userAuthenticated = false;
    if (req.cookies && req.cookies.token) {
      // Check if valid:
      if (sessions.checkSession(req.cookies.token)) {
        req.userAuthenticated = true;
      } else {
        // Invalid token.
        res.cookie('token', '');
      }
    }
    next();
  };
}

module.exports = {
  authMiddleware
};