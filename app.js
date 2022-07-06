const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const app = express();
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

//Multer - for interpreting multipart forms to get model file
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },

  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({
  storage: storage
});
//Multer


app.use(express.static('public'));
//EJS
app.set('view engine', 'ejs');
//EJS
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "This is a secret key",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

//Mongoose
const MONGODB_URI = "mongodb+srv://mongo_admin:WATcb1g6AvJaq4JZ@cluster0.w9bli.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//3D model collection
const modelSchema = new mongoose.Schema({
  name: String,
  fileLocation: String,
  description: String,
})
const Model = mongoose.model('Model', modelSchema);

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
//Mongoose
async function createAdmin(){
  User.findOne({username: 'admin'})
  .then(function(res){
    if(res === null){
      console.log('registering new admin');
      User.register({username: 'admin', isAdmin : true}, 'password');
    } else {
      console.log('result from find admin is ' ,res);
    }
  });
}
createAdmin();

const port = process.env.PORT || 3000;
app.listen(port, function(req, res) {
  console.log('Server running on localhost ', port);
});

app.get("/register", function(req, res) {
  res.render("register",{
  navbarState: {
    allowLogin: true,
    allowRegister: false,
    allowLogout: false
  }});
});

app.get("/login", function(req, res) {
  res.render('login', {
    navbarState: {
      allowLogin: false,
      allowRegister: true,
      allowLogout: false
    }
  });
});

app.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get("/home", function(req, res) {
  if (req.isAuthenticated()) {
    Model.find({})
      .then((result) => {
        Model.find({
            name: searchInput
          })
          .then((searchresult) => {
            res.render('home', {
              data: {
                modelList: result,
                searchList: searchresult
              },
              userStatus: {
                isAdmin: req.user.isAdmin
              },
              navbarState: {
                allowLogin: false,
                allowRegister: false,
                allowLogout: true
              }
            });
            searchInput = "";
          });
      });
  } else {
    res.redirect("/login");
    return;
  }
});

app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        //go to main page
        res.redirect("/home");
      });
    }});
});

app.post("/login", function(req, res) {
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
        res.redirect("/home");
      });
    }});
});

app.get("/", function(req, res) {
  res.render("main", {
  navbarState: {
    allowLogin: false,
    allowRegister: false,
    allowLogout: false
  }});
});

//Download Feature
app.get("/download/:filename", function(req, res) {
  var fileName = "uploads/";
  fileName += req.params.filename;
  res.download(fileName);
});

//Delete Feature
app.get("/delete/:id", function(req, res) {
  //delete from uploads
  Model.find({
      _id: req.params.id
    })
    .then((deleteResult) => {
      console.log(deleteResult[0].fileLocation);
      fs.unlink("uploads/" + deleteResult[0].fileLocation, (err) => {
        if (err) console.error(err);
      });
    });

  //delete from database
  Model.deleteOne({
    _id: req.params.id
  }, function(err, result) {
    if (err) console.log(err);
    else {
      console.log("Result: ", result);
    }
  });

  res.redirect("/home");
});

//Search Feature
let searchInput = "";
app.post("/search", upload.none(), function(req, res) {
  searchInput = req.body.searchinput;
  res.redirect("/home");
});

//Upload Feature
app.post("/home", upload.single('filetoupload'), function(req, res) {
  var newModel = new Model({
    name: req.body.name,
    fileLocation: req.file.originalname,
    description: req.body.description,
  })
  newModel.save();

  res.redirect('/home');
});
