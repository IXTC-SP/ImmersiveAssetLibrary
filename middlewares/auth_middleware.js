module.exports = {
    //check theres user in the session, in the backend
        isAuthenticated: (req, res, next) => {  
            if (!req.session.passport.user) {
                console.log("not autheticated")               
                res.redirect('/login')                
                return
            }
            console.log(req.session.passport.user)
            console.log("autheticated")
            req.user = req.session.passport.user
            next()
        },
    }