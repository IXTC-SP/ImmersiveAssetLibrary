module.exports = {
    //check theres user in the session, in the backend
        isAuthenticated: (req, res, next) => {  
            try {
                if (req.session.passport.user) {
                    req.user = req.session.passport.user
                    next()
                }
            } catch (error) {
                return res.redirect('/login')  
            }
           
        },
    }