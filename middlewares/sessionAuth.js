function sessionAuth(req, res, next) {
    if (req.session.user) {
        req.user = req.session.user; // Attach session data to req.user
        next(); // Proceed to the next middleware or route
    } else {
        return res.redirect('/admin/login');
    }
  }
  
  module.exports = sessionAuth;