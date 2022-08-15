const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const mongoose = require('mongoose');

//Mongoose
const MONGODB_URI = "mongodb+srv://mongo_admin:WATcb1g6AvJaq4JZ@cluster0.w9bli.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//user account collection
const userSchema = new mongoose.Schema({
  username: {
    type: String
  },
  password: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


async function createAdmin() {
  User.findOne({
      username: 'admin'
    })
    .then(function(res) {
      if (res === null) {
        console.log('registering new admin');
        User.register({
          username: 'admin',
          isAdmin: true
        }, 'password');
      } else {
        console.log('result from find admin is ', res);
      }
    });
}
createAdmin();


function Register(req, res, callback) {
  var path = "";
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      path = "/register";
    } else {
      passport.authenticate("local")(req, res, function() {
        //go to main page
        path = "/home";
      });
    }
  });
  callback(path);
};


function Login(req, res, callback) {
  var path = "";
  const user = new User({
    username: req.body.username,
    passport: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);

    } else {
      passport.authenticate("local")(req, res, function() {
        //go to main page
        path = "/home";
      });
    }
  });

  callback(path);
}
