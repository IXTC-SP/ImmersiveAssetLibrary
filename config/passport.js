const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const userModel = require("../models/user");
const bcrypt = require("bcrypt");


//passwort js is a middle ware and will be used globally
//each req will use a passprt local strategy, it uses express session
//statemanagement oftenhandes in FE like react,
//backed can also handle it wil express session
//passport strategy need a verify callback that take username, pw and a function that return
//error or if its success etc
//the post req with the username and pw, pasport will automatic look for the fields and verfiy them
//by default is username, password, can use custom filed or can use the pass req to call back
//if req is the first param it will accept the req.body also,
const verifyCallback = async (username, password, done) => {
  let user = null;
  console.log("verify callback");
  //passport use promise, .then and .catch, async and awaits wrapping the promise
  try {   
    user = await userModel.findOne({ email: username });
    if (!user || !user.isActivated) {
      //no error, but also no user
      return done("No user by that email");
    }
    //use bcrypt to compare instead of passpor valid password
    // console.log(user);
    const pwMatches = await bcrypt.compare(password, user.password);
    if (pwMatches) {
      //no error, res with user data
      return done(null, user);
    } else {
      return done("Email or password is incorrect");
    }
  } catch (error) {
    console.log(error);
    return done(error, false, { message: error.message });
  }
};

//strategy requrires a verify callback which takes 3 param
// pass req to callback must be true, if u want to verfu the req.body also
//add custom filed for the usernameField
const strategy = new LocalStrategy(
  verifyCallback
);

passport.use(strategy);
//passport.use(userModel.createStrategy(verifyCallback));
//passport.use(new LocalStrategy(userModel.authenticate()));

//same as req.session.id = user.id
//store the user id in the passport prop in session, under user property
//so the id is in req.session.passport.user
passport.serializeUser((user, done) => {
  console.log("serialise")
  return done(null, user);
});
//passport.serializeUser(userModel.serializeUser())
//get the user out of the session, logout//base on the user id in the session, is not log in, wont do this
//populate a req.user and attach the req.user with this found user object, and use for every req
passport.deserializeUser(async (id, done) => {
  console.log("deserialise")
  return done(null, id);
  try {
     await userModel.findById(user._id);
    return done(null, user._id);
  } catch (error) {
    return done(null, false, { message: "No such account, please check that your accountt has been activated" });
  }
});
//passport.deserializeUser(userModel.deserializeUser())
