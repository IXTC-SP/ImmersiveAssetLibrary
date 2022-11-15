require('dotenv').config()

const express = require('express');
// const mongoose = require('mongoose');
const ejs = require('ejs');
const app = express();
// const multer = require('multer');
// const fs = require('fs');
const bodyParser = require('body-parser');

const session = require('express-session');

// const passportLocalMongoose = require('passport-local-mongoose');
const path = require('path');
const url = require('url');

const gltfmodel = require('./scripts/gltfmodel');
const modeldatabase = require('./scripts/modeldatabase');
//const usermanagement = require('./scripts/usermanagement');
const modeldisplay = require('./scripts/modeldisplay');
const storagemanagement = require('./scripts/storagemanagement');
const filedownloader = require('./scripts/filedownloader');
const userController = require('./scripts/users_controller');
const authMiddleware = require('./middlewares/auth_middleware')// middleware for the authentication, to check if theres a session
const passport = require("passport");

const flash  = require("connect-flash")
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/scripts', express.static('scripts'));
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(flash());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 //1 DAY
  }
}));

//every route
//fisrt check if the req.session.passport.user is there ( on login will store)
//if null, no need to get the userid, so no req.user
//if have then, means has login, pass in the userid for the deserializer
app.use(passport.initialize());//refresh the passport middleware, thers a chance the session expired
app.use(passport.session());//so that can tap into the express sessions data
// createStrategy is responsible to setup passport-local LocalStrategy with the correct options.
require("./config/passport")
app.use(authMiddleware.setAuthUserVar)

app.use((req,res,next)=>{
  console.log(req.session)

  next()
})

//sandra connection
const mongoose = require('mongoose');
//Mongoose
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}.trfz1qc.mongodb.net/`;
const port = process.env.PORT || 3000;
app.listen(port, async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: process.env.MONGO_DB
     });
  } catch(err) {
      console.log(`Failed to connect to DB`)
      process.exit(1)
  }

  console.log(`Immersive Library backend listening on port ${port}`)
})


app.get("/register", function(req, res) {
  res.render("register", {
    navbarState: {
      allowLogin: true,
      allowRegister: false,
      allowLogout: false
    }
  });
});

// app.get("/login", function(req, res) {
//   res.render('login', {
//     navbarState: {
//       allowLogin: false,
//       allowRegister: true,
//       allowLogout: false
//     }
//   });
// });


app.post("/register", function(req, res) {
  usermanagement.Register(req, res, (path) => {
    res.redirect(path);
  })
  // User.register({
  //   username: req.body.username
  // }, req.body.password, function(err, user) {
  //   if (err) {
  //     console.log(err);
  //     res.redirect("/register");
  //   } else {
  //     passport.authenticate("local")(req, res, function() {
  //       //go to main page
  //       res.redirect("/home");
  //     });
  //   }});
});

// app.post("/login", function(req, res) {
//   usermanagement.Login(req, res, (path) => {
//     res.redirect(path);
//   })
  // const user = new User({
  //   username: req.body.username,
  //   passport: req.body.password
  // });
  //
  // req.login(user, function(err) {
  //   if (err) {
  //     console.log(err);
  //
  //   } else {
  //     passport.authenticate("local")(req, res, function() {
  //       //go to main page
  //       res.redirect("/home");
  //     });
  //   }});
// });

// app.get("/objectview", function(req,res){
//   modeldisplay.LoadTempFilesForModels(req, (result)=> {
//     console.log(result);
//   });
//   res.render('objectview', {
//   data: {
//     objectname: req.query.objectname,
//     objectdescription: req.query.objectdescription,
//     objectgltf: 'temp.gltf',
//     diffuse: 'temp_diffuse.png',
//     metallicroughness: 'temp_roughness.png',
//     normal: 'temp_normal.png',
//     occlusion: 'temp_occlusion.png',
//     emission: 'temp_emission.png',
//
//   },
//   navbarState: {
//     allowLogin: false,
//     allowRegister: false,
//     allowLogout: true
//   }
// });
//
//   // if (req.isAuthenticated()) {lo
//   // } else {
//   //   res.redirect("/login");
//   //   return;
//   // }
// });

app.post('/asset/:modelid', function(req, res) {
  modeldatabase.FindModelById(req.params.modelid, (result) => {
    console.log(result);
    res.render('single_asset', {
      model: result,
      navbarState: {
        allowLogin: false,
        allowRegister: false,
        allowLogout: true
      }
    });
  });
});

app.get('/360/equi', function(req, res) {
  res.render('demopages/360viewer(equi)', {
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});

app.get('/360/cube', function(req, res) {
  res.render('demopages/360viewer(cube)', {
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});

app.get('/dragndrop', function(req, res) {
  res.render('demopages/dragndrop', {
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});

app.get('/sample_asset', function(req, res) {
  res.render('sample_asset', {
    modelpath: "./uploads/00_sample/gltf/model.gltf",
    texturepath: "./uploads/00_sample/gltf/Exitlight_Diffuse.tga",
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});


app.get("/assets", function(req, res) {
  if(typeof req.query.search === 'undefined' || req.query.search == ""){
    console.log("get all result on model list");
    modeldatabase.GetAllModels((result) => {
      res.render('assets', {
        data: {
          models: result
        },
        navbarState: {
          allowLogin: false,
          allowRegister: false,
          allowLogout: true
        }
      });
    });
  } else {
    modeldatabase.SearchBar(req.query.search, (result) => {
      console.log("running result on model list" , result);
      res.render('assets', {
        data: {
          models: result
        },
        navbarState: {
          allowLogin: false,
          allowRegister: false,
          allowLogout: true
        }
      });
    });


  }

});



app.post('/search', function(req, res) {
  res.redirect(url.format({
    pathname: "/assets",
    query: {
      search: req.body.searchterm
    }
  }));
});


app.get("/single_asset_edit/:modelid", function(req, res) {
  var tmpid = '62d7b3de10351866025affb7'
  // modeldatabase.FindModelById(req.params.modelid, (result) => {
  modeldatabase.FindModelById(tmpid, (result) => {
    res.render('single_asset_edit', {
      model: result,
      navbarState: {
        allowLogin: false,
        allowRegister: false,
        allowLogout: true
      }
    });
  });
});

app.get("/single_asset_create", function(req, res) {
  res.render('single_asset_create', {
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});

app.post("/upload", storagemanagement.uploadHandler.fields([{name: 'objectfile', maxCount: 1}, {name: 'diffuse', maxCount: 1},{name: 'metallicroughness', maxCount: 1},{name: 'normal', maxCount: 1},
{name: 'occlusion', maxCount: 1},{name: 'emission', maxCount: 1}]), function(req, res) {
  console.log(req.body);
  var modelfolderpath = req.files.objectfile[0].destination.split("/model")[0];
  gltfmodel.Create(req.files.objectfile, function(gltfresult){
    console.log(gltfresult);
      res.send("done");
  })
});

app.post("/update/:modelid", function(req, res) {
  modeldatabase.UpdateModelFromEditPage(req.params.modelid, req, (result) => {
    modeldatabase.FindModelById(req.params.modelid, (doc) => {
      console.log(doc);
      res.render('single_asset', {
        model: doc,
        navbarState: {
          allowLogin: false,
          allowRegister: false,
          allowLogout: true
        }
      });
    });
  });
});

const fs = require('fs');

app.post("/downloadasset/:modelid", function(req, res) {
  modeldatabase.GetModel(req.params.modelid, (result)=> {
    var downloadpath = __dirname + result.paths.folderpath + "/model";
    console.log(downloadpath);
    filedownloader.CreateZipArchive(result.name, downloadpath, (tmppath)=> {
      res.download(tmppath, req.param('file'), function(err){
      //CHECK FOR ERROR
      fs.unlink(tmppath, (err)=> {
        if(err) console.log(err);
        else {
          console.log("complete fs delete tmp file");
        }
      });
      });
    });

  });
});




// app.get("/", function(req, res) {
//   res.render("main", {
//   navbarState: {
//     allowLogin: false,
//     allowRegister: false,
//     allowLogout: false
//   }});
// });
//
// app.get("/home", function(req, res) {
//   if (req.isAuthenticated()) {
//     Model.find({})
//       .then((result) => {
//         Model.find({
//             name: searchInput
//           })
//           .then((searchresult) => {
//             res.render('home', {
//               data: {
//                 modelList: result,
//                 searchList: searchresult
//               },
//               userStatus: {
//                 isAdmin: req.user.isAdmin
//               },
//               navbarState: {
//                 allowLogin: false,
//                 allowRegister: false,
//                 allowLogout: true
//               }
//             });
//             searchInput = "";
//           });
//       });
//   } else {
//     res.redirect("/login");
//     return;
//   }
// });
//
// //Download Feature
// app.get("/download/:filename", function(req, res) {
//   var fileName = "uploads/";
//   fileName += req.params.filename;
//   res.download(fileName);
// });
//
// //Delete Feature
// app.get("/delete/:id", function(req, res) {
//   //delete from uploads
//   Model.find({
//       _id: req.params.id
//     })
//     .then((deleteResult) => {
//       console.log(deleteResult[0].fileLocation);
//       fs.unlink("uploads/" + deleteResult[0].fileLocation, (err) => {
//         if (err) console.error(err);
//       });
//     });
//
//   //delete from database
//   Model.deleteOne({
//     _id: req.params.id
//   }, function(err, result) {
//     if (err) console.log(err);
//     else {
//       console.log("Result: ", result);
//     }
//   });
//
//   res.redirect("/home");
// });
//
// //Search Feature
// let searchInput = "";
// app.post("/search", upload.none, function(req, res) {
//   searchInput = req.body.searchinput;
//   res.redirect("/home");
// });
//
// app.get("/upload", function(req,res){
//   res.render('upload', {
//     // userStatus: {
//     //   isAdmin: req.user.isAdmin
//     // },
//     navbarState: {
//       allowLogin: false,
//       allowRegister: false,
//       allowLogout: true
//     }
//   });
//   // if (req.isAuthenticated()) {
//   // } else {
//   //   res.redirect("/login");
//   //   return;
//   // }
// })
//
//

//
//Upload Feature
// app.post("/upload", upload.fields([{name: 'objectfile', maxCount: 1}, {name: 'diffuse', maxCount: 1},{name: 'metallicroughness', maxCount: 1},{name: 'normal', maxCount: 1},
// {name: 'occlusion', maxCount: 1},{name: 'emission', maxCount: 1}]), function(req, res) {
//   // var newModel = new Model({
//   //   name: req.body.name,
//   //   fileLocation: req.file.originalname,
//   //   description: req.body.description,
//   // })
//   // newModel.save();
//   creategltfmodel.convert(__dirname + "/" + req.files.objectfile[0].path, (gltfpath)=> {
//     res.redirect(url.format({
//        pathname:"/objectview",
//        query: {
//           "objectname": req.body.name,
//           "objectdescription": req.body.description,
//           "gltfpath": gltfpath,
//           "diffuse" : req.files.diffuse[0].path,
//           "metallicroughness" : req.files.metallicroughness[0].path,
//           "normal" : req.files.normal[0].path,
//           "occlusion" : req.files.occlusion[0].path,
//           "emission" : req.files.emission[0].path
//         }
//      }));
//   });
// });
// app.locals.use(function(req, res) {
//   // Expose "error" and "message" to all views that are rendered.
//   res.locals.error = req.session.error || '';
//   res.locals.message = req.session.message || '';

//   // Remove them so they're not displayed on subsequent renders.
//   delete req.session.error;
//   delete req.session.message;
// });

//sandra user admin routes,
// app.get("/:user_id/profile", userController.showProfile)//need upoads by users,
// app.get("/:user_id/uploads", userController.showUploads)//need uploads by user,
// app.get("/:user_id/downloads", userController.showDownloads)//need downloads from dbs
app.get("/:user_id/dashboard/profile", userController.showProfile)
app.get("/:user_id/dashboard/enrollment", userController.showEnrollment)
app.get("/login", userController.showlogin)
app.get("/authentication/activate", userController.showActivateAndSetPassword)//done 
app.get("/forgot-password", userController.showForgotPassword)//done 
app.get("/reset-password", userController.showSetPassword)//done 


app.post("/:user_id/dashboard/enrollment", userController.createEnrollment, userController.emailActivation, userController.showEnrollment)//done 
// app.post("/:user_id/dashboard", userController.showDashboard)
app.post("/:user_id/uploads/delete", userController.deleteUpload)
app.post("/:user_id/uploads/edit", userController.editUpload) 
app.post("/:user_id/uploads", userController.upload)
app.post("/reset-password-link", userController.sendResetPasswordLink)
app.post("/authentication/activate", userController.setPassword)
app.post("/reset-password", userController.setPassword)//done 
//pass the middleware. authenticate will look into the passport.js for the verify callback, and can include options of authntication
//with the veryfycall back ut finds the user in the dbs and
//a passport props wil be created in the the express session
//so there is a req.user 
app.post("/login", passport.authenticate("local", { failureRedirect: '/login', failureFlash: true }), userController.login)
app.post('/logout', userController.logout);


// app.patch("/:user_id/profile", userController.showProfile)
// app.patch("/:user_id/uploads", userController.showUploads)


// app.delete("/:user_id/uploads", userController.showUploads)
app.delete("/:user_id/dashboard/enrollment/:acct_id/delete", userController.deleteEnrollment, userController.showEnrollment)
