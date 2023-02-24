
module.exports = {
    //check theres user in the session, in the backend
        isAuthenticated: async (req, res, next) => {  
            try {
                // console.log("current session id ", req.session.id)         
                if (req.session.passport.user) {
                    req.user = req.session.passport.user
                    next()     
                    }
                
            } catch (error) {
                console.log("unauthenticated")
                return res.redirect('/login')  
            }
           
        },
        // closeTmp: async(req,res,next)=>{
        //     // try {
        //     //     console.log("remove current session id ", req.session.id)
        //     //     uploadsmanager_model.closeTmpFolder(req.session.id);
        //     //     next()
        //     // } catch (error) {
        //     //     console.log(error)
        //     //     return res.redirect('/login')  
        //     // }
        // next()
        // }
    }
    

    