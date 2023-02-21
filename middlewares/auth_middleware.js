const uploadsmanager_model = require("../scripts/uploadsmanager_model");
class SessId {
    constructor(sessId){
        this.sessId = sessId
    }
    get Sessid(){
        return this.sessId
    }
}



module.exports = {
    //check theres user in the session, in the backend
        isAuthenticated: async (req, res, next) => {  
            if(!req.hasSessionClass){

            }
            let newSessId = new SessId(req.session.id)
            try {
                console.log("current session id ", req.session.id)         
                if (req.session.passport.user) {
                    // console.log("is authenticated")                    
                    // uploadsmanager_model.closeTmpFolder(req.session.id);
                    req.user = req.session.passport.user
                    
                    console.log(newSessId )
                    if(newSessId.sessId === undefined || newSessId.sessId !== req.session.id ){
                        console.log(newSessId.sessId );
                        newSessId.sessId = req.session.id
                    }else(
                        console.log(newSessId.sessId )
                    )
                   
                    if (req.session.views) {
                        req.session.views++
                        console.log("sess not expired yet")
                        res.locals.sessId = req.session.id
                      } else {
                        console.log("new sess")
                        //delete tmp files
                        //res.redirect("/login")
                        // console.log(req.session.prevSessId )
                        // uploadmanager.closeTmpFolder(req.session.prevSessId );
                        // if (fs.existsSync('./uploads/tmp/')) {
                        //   fs.rmSync('./uploads/tmp/', {
                        //     recursive: true
                        //   });
                        // }
                       
                        req.session.views = 1
                        //req.session.save()
                                 
                    }
                    console.log(res.locals);
                    next()
                }
            } catch (error) {
                console.log("not authenticated", error)
                console.log("previous sess id", newSessId.Sessid) 
                console.log(res.locals);
                // req.session.previousId = req.session.id
                req.session.destroy()
                return res.redirect('/login')  
            }
           
        },
        closeTmp: async(req,res,next)=>{
            // try {
            //     console.log("remove current session id ", req.session.id)
            //     uploadsmanager_model.closeTmpFolder(req.session.id);
            //     next()
            // } catch (error) {
            //     console.log(error)
            //     return res.redirect('/login')  
            // }
        next()
        }
    }
    

    