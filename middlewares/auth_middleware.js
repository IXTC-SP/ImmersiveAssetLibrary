module.exports = {
    //check theres user in the session, in the backend
        isAuthenticated: (req, res, next) => {  
            try {
                if (req.session.passport.user) {
                    console.log(req.session.passport.user)
                    console.log("autheticated")
                    req.user = req.session.passport.user
                    next()
                }
            } catch (error) {
                console.log(error, "not autheticated") 
                return res.redirect('/login')  
            }
           
        },
    }