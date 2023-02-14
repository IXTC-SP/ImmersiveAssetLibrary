const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const userModel = require("../models/user");
const bcrypt = require("bcryptjs");

//passwort js is a middle ware and will be used globally
//each req will use a passprt local strategy, it uses express session
//statemanagement oftenhandes in FE like react,
//backed can also handle it wil express session
//passport strategy need a verify callback that take username, pw and a function that return
//error or if its success etc
//the post req with the username and pw, pasport will automatic look for the fields and verfiy them
//by default is username, password, can use custom filed or can use the pass req to call back
//if req is the first param it will accept the req.body also,
const verifyCallback = async (req, username, password, done) => {
  let user = null;
 
  //passport use promise, .then and .catch, async and awaits wrapping the promise
  try {
    user = await userModel.findOne({
      email: username.toLowerCase(),
      isActivated: true,
    });
    if (!user) {
      return done(null, false, "Check that this account has been enrolled and activated.");
    }
    //use bcrypt to compare instead of passpor valid password
    // console.log(user);
    const pwMatches = await bcrypt.compare(password, user.password);
    if (pwMatches) {
      //no error, res with user data     
      return done(null, user);
    } else {
      return done(null, false, "Email or password is incorrect");
    }
  } catch (error) {
    console.log(error);
    return done(null, false, error);
  }
};

//strategy requrires a verify callback which takes 3 param
// pass req to callback must be true, if u want to verfu the req.body also
//add custom filed for the usernameField
const strategy = new LocalStrategy(
  { session: true, passReqToCallback: true },
  verifyCallback
);

passport.use(strategy);
//passport.use(userModel.createStrategy(verifyCallback));
//passport.use(new LocalStrategy(userModel.authenticate()));

//same as req.session.id = user.id
//store the user id in the passport prop in session, under user property
//so the id is in req.session.passport.user
passport.serializeUser((user, done) => {
  
  return done(null, user);
});
//passport.serializeUser(userModel.serializeUser())
//get the user out of the session, logout//base on the user id in the session, is not log in, wont do this
//populate a req.user and attach the req.user with this found user object, and use for every req
passport.deserializeUser(async (id, done) => {
 
  return done(null, id);
});
//passport.deserializeUser(userModel.deserializeUser())
