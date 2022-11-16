const express = require('express');
// const mongoose = require('mongoose');
const ejs = require('ejs');
const app = express();
// const multer = require('multer');
// const fs = require('fs');
const bodyParser = require('body-parser');

const session = require('express-session');
const passport = require('passport');
// const passportLocalMongoose = require('passport-local-mongoose');
const path = require('path');
const url = require('url');

const gltfmodel = require('./scripts/gltfmodel');
const modeldatabase = require('./scripts/modeldatabase');
const usermanagement = require('./scripts/usermanagement');
const modeldisplay = require('./scripts/modeldisplay');
const storagemanagement = require('./scripts/storagemanagement');
const filedownloader = require('./scripts/filedownloader');

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/scripts', express.static('scripts'));
app.set('view engine', 'ejs');
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


const port = process.env.PORT || 3000;
app.listen(port, function(req, res) {
  console.log('Server running on localhost ', port);
});

app.get("/register", function(req, res) {
  res.render("register", {
    navbarState: {
      allowLogin: true,
      allowRegister: false,
      allowLogout: false
    }
  });
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
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

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

app.post("/login", function(req, res) {
  usermanagement.Login(req, res, (path) => {
    res.redirect(path);
  })
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
});

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

app.get('/view/360', function(req, res) {
  res.render('demopages/view-360', {
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});


app.get('/view/script', function(req, res) {
  res.render('demopages/view-script', {
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
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



//
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

app.get('/', function(req, res) {
  res.render('main', {
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});

//WORKING (ASSET LIST PAGE)
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

//WORKING (UPLOAD PAGE)
app.get('/dragndrop', function(req, res) {
  res.render('demopages/dragndrop', {
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});
const tempupload = require('./scripts/uploadsmanager');
var tmpContent = [];
app.post("/uploadtmp3dmodel", tempupload.uploadtmp3D, function(req, res) {
  tmpContent = req.files;
  let result = tmpContent.image.map(a => a.originalname);
  gltfmodel.Create(req.files.model[0], function(gltfresult){
    // Include fs module
    var fs = require('fs');
    if(gltfresult != ''){
      tmpContent["modelviewerpath"] = '../uploads/tmp/gltf/model.gltf';
    } else {
      tmpContent['modelviewerpath'] = '.' + tmpContent.model[0].destination +  tmpContent.model[0].originalname;
    }
    console.log(tmpContent);
    res.end("complete");

  });
  // let files = tmpContent.image.map(a => a.originalname);
  // files.push(tmpContent.model[0].originalname);
  // console.log(files);
  // let folderpath = req.files.model[0].originalname.split('.')[0];
  // console.log(folderpath);
  // tempupload.publish(req.files.model[0].originalname.split('.')[0], files, req.files.model[0].destination)

});

app.get('/editpage/model', function(req, res) {
  if(tmpContent){
    let images = tmpContent.image.map(a => a.originalname);
    console.log(images);
    res.render('demopages/editpage-model', {
      content : {
        modelviewerpath : tmpContent.modelviewerpath,
        modelfile: tmpContent.model[0].originalname,
        imagefiles: images
      },
      navbarState: {
        allowLogin: false,
        allowRegister: false,
        allowLogout: true
      }
    });
  }

});
app.post('/save3dmodel', tempupload.upload3D, function(req,res){
  console.log(req.files);
  console.log(req.body);

  //create list with all files required to save
  let body = JSON.parse(req.body.data);
  let newfiles = req.files.file.map(a=> a.originalname);
  let allfiles = body.files.concat(newfiles);
  allfiles.push(body.modelfile);

  console.log(allfiles);
  tempupload.publish(tmpContent.model[0].originalname.split('.')[0], allfiles, tmpContent.model[0].destination)
});

app.get('/view/model', function(req, res) {
  res.render('demopages/view-model', {
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});

app.post("/uploadtmp360", tempupload.uploadtmp360, function(req, res) {
  tmpContent = req.files;
  res.end("complete");
});

app.get('/editpage/360', function(req, res) {
  res.render('demopages/editpage-360', {
    tmpfileContent : tmpContent,
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});
app.post("/uploadtmpscript", tempupload.uploadtmpscript, function(req, res) {
  tmpContent = req.files;
  res.end("complete");
});
app.get('/editpage/script', function(req, res) {
  res.render('demopages/editpage-script', {
    tmpfileContent : tmpContent,
    navbarState: {
      allowLogin: false,
      allowRegister: false,
      allowLogout: true
    }
  });
});







app.post('/test', function(req,res){
  console.log("post test form");
  res.redirect('/editpage/model')
})


// Begin reading from stdin so the process does not exit imidiately
process.stdin.resume();
process.on('SIGINT', function() {
  console.log('Interrupted');
  process.exit();
});

process.on('exit',() => {
  tempupload.closeTmpFolder();
  console.log("process.exit() method is fired")
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
