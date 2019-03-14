function authMiddleware(req, res, next) {
  // Check if there's a cookie with "token" in it.
  // If yes, check validity. Put a flag in the request if valid.
  // Destroy cookie if invalid. Also set the flag but to the 
  // opposite value.
  if (req.cookies) {
    console.log(req.cookies);
  }
  next();
}

module.exports = {
  authMiddleware
};