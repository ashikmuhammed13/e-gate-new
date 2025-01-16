function sessionAuth(req, res, next) {
    if (req.session.user) {
        req.user = req.session.user; // Attach session data to req.user
    } else {
        return res.redirect(' /admin/login'); 
    }
    next();
}


module.exports = sessionAuth;
