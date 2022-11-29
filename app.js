require('dotenv').config()

const express = require('express');
// const mongoose = require('mongoose');
const ejs = require('ejs');
const app = express();
// const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');

const session = require('express-session');

// const passportLocalMongoose = require('passport-local-mongoose');
const path = require('path');
const url = require('url');

const gltfmodel = require('./scripts/gltfmodel');
const modeldatabase = require('./scripts/databasemanager_model');
//const usermanagement = require('./scripts/usermanagement');
const modeldisplay = require('./scripts/modeldisplay');
const storagemanagement = require('./scripts/storagemanagement');
const filedownloader = require('./scripts/filedownloader');
const userController = require('./scripts/users_controller');
const authMiddleware = require('./middlewares/auth_middleware')// middleware for the authentication, to check if theres a session
const passport = require("passport");

const flash  = require("connect-flash")
const methodOverride = require('method-override');
const job = require('./Cron/cron_jobs');
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
  job.start()
})

app.post('/asset/:modelid', function(req, res) {
  modeldatabase.FindModelById(req.params.modelid, (result) => {
    console.log(result);
    res.render('single_asset', {
      model: result,
      isLoginpage: true
    });
  });
});






app.get('/', function(req, res) {
  res.render('main', {
    isLoginpage: true
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
        isLoginpage: true
      });
    });
  } else {
    modeldatabase.SearchBar(req.query.search, (result) => {
      console.log("running result on model list" , result);
      res.render('assets', {
        data: {
          models: result
        },
        isLoginpage: true
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

app.post('/asset/:modelid', function(req, res) {
  modeldatabase.FindModelById(req.params.modelid, (result) => {
    console.log(result);
    res.render('single_asset', {
      model: result,
      isLoginpage: true
    });
  });
});

//OLD
app.get("/single_asset_edit/:modelid", function(req, res) {
  var tmpid = '62d7b3de10351866025affb7'
  // modeldatabase.FindModelById(req.params.modelid, (result) => {
  modeldatabase.FindModelById(tmpid, (result) => {
    res.render('single_asset_edit', {
      model: result,
      isLoginpage: true
    });
  });
});

//OLD
app.get("/single_asset_create", function(req, res) {
  res.render('single_asset_create', {
    isLoginpage: true
  });
});

//OLD
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
const uploadsmanager = require('./scripts/uploadsmanager_model');
app.get('/dragndrop', function(req, res) {
  uploadsmanager.closeTmpFolder();
  res.render('demopages/dragndrop', {
    isLoginpage: true
  });
});

// ----- model upload to publish ------ START
const uploadsmanager_model = require('./scripts/uploadsmanager_model');
const databasemanager_model = require('./scripts/databasemanager_model');
var tmpContent = [];

app.post("/uploadtmp3dmodel", uploadsmanager_model.uploadtmp3D, function(req, res) {
  tmpContent = req.files;
  let result;
  if(tmpContent.image){
    result = tmpContent.image.map(a => a.originalname);
  }
  gltfmodel.Create(req.files.model[0], function(gltfresult){
    // Include fs module
    var fs = require('fs');
    if(gltfresult != ''){
      tmpContent["modelviewerpath"] = '../uploads/tmp/model.gltf';
    } else {
      tmpContent['modelviewerpath'] = '.' + tmpContent.model[0].destination +  tmpContent.model[0].originalname;
    }
    tmpContent['folderpath'] = tmpContent.model[0].originalname.split('.')[0];
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
    let images;
    if(tmpContent.image){
      images = tmpContent.image.map(a => a.originalname);
      console.log(images);
    }

    res.render('demopages/editpage-model', {
      content : {
        folderpath : tmpContent.folderpath,
        modelviewerpath : tmpContent.modelviewerpath,
        modelfile: tmpContent.model[0].originalname,
        thumbnail: typeof(tmpContent.thumbnail) == 'undefined' ? '' : tmpContent.thumbnail[0].originalname,
        imagefiles: images
      },
      isLoginpage: true
    });
  }
});

app.post('/save3dmodel', uploadsmanager_model.upload3D, function(req,res){
  console.log(req.files);
  console.log(req.body);

  //create list with all files required to save
  let body = JSON.parse(req.body.data);
  let allfiles = body.files;
  if(req.files.file){
    if(req.files.file.length > 0){
      let newfiles = req.files.file.map(a=> a.originalname);
      allfiles = body.files.concat(newfiles);
    }
  }
  if(typeof(body.modelfile) != 'undefined'){
    allfiles.push(body.modelfile);
  }
  if(typeof(body.modelviewerpath) != 'undefined'){
    allfiles.push(body.modelviewerpath);
  }
  if(typeof(req.files.newthumbnail) != 'undefined'){
    console.log(req.files.newthumbnail[0].originalname);
    allfiles.push(req.files.newthumbnail[0].filename);
  }

  console.log(allfiles);
  uploadsmanager_model.publish(body.folderpath, allfiles, tmpContent.model[0].destination);
  //save model database
  databasemanager_model.save(req,res, allfiles);
});

app.get('/view/model', function(req, res) {

  res.render('demopages/view-model', {
    isLoginpage: true
  });
});
// ----- model upload to publish ------ END


// ----- 360 upload to publish ------ START
const uploadmanager_360 = require('./scripts/uploadmanager_360');

app.post("/uploadtmp360", uploadmanager_360.uploadtmp360, function(req, res) {
  console.log(req.body);
  console.log(req.files);
  tmpContent['image'] = []
  tmpContent['destination'] = req.files.image[0].destination;
  if(req.body.format == 'cubemap') {
    tmpContent['image']['top'] = req.files.image.find(element => element.originalname.split('_')[0] == 'top').originalname
    tmpContent['image']['front'] = req.files.image.find(element => element.originalname.split('_')[0] == 'front').originalname
    tmpContent['image']['bottom'] = req.files.image.find(element => element.originalname.split('_')[0] == 'bottom').originalname
    tmpContent['image']['right'] = req.files.image.find(element => element.originalname.split('_')[0] == 'right').originalname
    tmpContent['image']['back'] = req.files.image.find(element => element.originalname.split('_')[0] == 'back').originalname
    tmpContent['image']['left'] = req.files.image.find(element => element.originalname.split('_')[0] == 'left').originalname
  } else {
    tmpContent['image']['equi'] = req.files.image[0].originalname;
  }
  tmpContent['format'] = req.body.format;
  console.log(tmpContent);
  res.end("complete");
});

app.get('/editpage/360', function(req, res) {
  res.render('demopages/editpage-360', {
    format: tmpContent.format,
    images : tmpContent.image,
    isLoginpage: true
  });
});

app.post('/savethreesixty', uploadmanager_360.upload360, function(req,res){
  console.log(req.files);
  console.log(req.body);

  //create list with all files required to save
  let body = JSON.parse(req.body.data);
  let allfiles = body.files;
  if(req.files.file){
    console.log('running req files');
    if(req.files.file.length > 0){
      let newfiles = req.files.file.map(a=> a.originalname);
      allfiles = body.files.concat(newfiles);
    }
  }
  let foldername = body.title == "" ? "default_foldername" : body.title.replace(/\s/g, '');
  console.log(allfiles);
  console.log(foldername);
  console.log(tmpContent.destination);


  uploadmanager_360.publish(body.title, allfiles, tmpContent.destination);

});

app.get('/view/360', function(req, res) {
  res.render('demopages/view-360', {
    isLoginpage: true
  });
});
// ----- 360 upload to publish ------ END


// ----- script upload to publish ------ START
const uploadmanager_script = require('./scripts/uploadmanager_script');
app.post("/uploadtmpscript", uploadmanager_script.uploadtmpscript, function(req, res) {
  tmpContent = req.files;
  tmpContent['destination'] = req.files.script[0].destination;
  res.end("complete");
});

app.get('/editpage/script', function(req, res) {
  if(tmpContent){
    console.log(tmpContent);
      let scripts = tmpContent.script.map(a => a.originalname);
      console.log(scripts);
    res.render('demopages/editpage-script', {
      scripts : scripts,
      isLoginpage: true
    });
  }
});

app.get('/view/script', function(req, res) {
  res.render('demopages/view-script', {
    isLoginpage: true
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
    isLoginpage: true
  });
});

// ----- model upload to publish ------ START
const tempupload = require('./scripts/uploadsmanager');
var tmpContent = [];
app.post("/uploadtmp3dmodel", tempupload.uploadtmp3D, tempupload.;

app.get('/editpage/model', function(req, res) {
  if(tmpContent){
    let images = tmpContent.image.map(a => a.originalname);
    console.log(images);
    res.render('demopages/editpage-model', {
      content : {
        modelviewerpath : tmpContent.modelviewerpath,
        modelfile: tmpContent.model[0].originalname,
        thumbnail: typeof(tmpContent.thumbnail) == 'undefined' ? '' : tmpContent.thumbnail[0].originalname,
        imagefiles: images
      },
      isLoginpage: true
    });
  }

});

app.post('/save3dmodel', tempupload.upload3D, function(req,res){
  console.log(req.files);
  console.log(req.body);

  //create list with all files required to save
  let body = JSON.parse(req.body.data);
  let allfiles = body.files;
  if(req.files.file.length > 0){
    let newfiles = req.files.file.map(a=> a.originalname);
    allfiles = body.files.concat(newfiles);
  }
  if(typeof(body.modelfile) != 'undefined'){
    allfiles.push(body.modelfile);
  }
  if(typeof(req.files.newthumbnail) != 'undefined'){
    console.log(req.files.newthumbnail[0].originalname);
    allfiles.push(req.files.newthumbnail[0].filename);
  }

  console.log(allfiles);
  tempupload.publish(tmpContent.model[0].originalname.split('.')[0], allfiles, tmpContent.model[0].destination);
  //save model database

});

app.get('/view/model', function(req, res) {

  res.render('demopages/view-model', {
    isLoginpage: true
  });
});
// ----- model upload to publish ------ END


// ----- 360 upload to publish ------ START
const threesixtymanager_upload = require('./scripts/360manager_upload');

app.post("/uploadtmp360", threesixtymanager_upload.uploadtmp360, function(req, res) {
  console.log(req.body);
  console.log(req.files);
  tmpContent['image'] = []
  tmpContent['destination'] = req.files.image[0].destination;
  if(req.body.format == 'cubemap') {
    tmpContent['image']['top'] = req.files.image.find(element => element.originalname.split('_')[0] == 'top').originalname
    tmpContent['image']['front'] = req.files.image.find(element => element.originalname.split('_')[0] == 'front').originalname
    tmpContent['image']['bottom'] = req.files.image.find(element => element.originalname.split('_')[0] == 'bottom').originalname
    tmpContent['image']['right'] = req.files.image.find(element => element.originalname.split('_')[0] == 'right').originalname
    tmpContent['image']['back'] = req.files.image.find(element => element.originalname.split('_')[0] == 'back').originalname
    tmpContent['image']['left'] = req.files.image.find(element => element.originalname.split('_')[0] == 'left').originalname
  } else {
    tmpContent['image']['equi'] = req.files.image[0].originalname;
  }
  tmpContent['format'] = req.body.format;
  console.log(tmpContent);
  res.end("complete");
});

app.get('/editpage/360', function(req, res) {
  res.render('demopages/editpage-360', {
    format: tmpContent.format,
    images : tmpContent.image,
    isLoginpage: true
  });
});

app.post('/savethreesixty', threesixtymanager_upload.upload360, function(req,res){
  console.log(req.files);
  console.log(req.body);

  //create list with all files required to save
  let body = JSON.parse(req.body.data);
  let allfiles = [];
  if(req.files.file){
    console.log('running req files');
    if(req.files.file.length > 0){
      let newfiles = req.files.file.map(a=> a.originalname);
      allfiles = body.files.concat(newfiles);
    }
  }


  threesixtymanager_upload.publish(body.title, allfiles, tmpContent.destination);

});

app.get('/view/360', function(req, res) {
  res.render('demopages/view-360', {
    isLoginpage: true
  });
});
// ----- 360 upload to publish ------ END


// ----- script upload to publish ------ START
const scriptmanager_upload = require('./scripts/scriptmanager_upload');
app.post("/uploadtmpscript", scriptmanager_upload.uploadtmpscript, function(req, res) {
  tmpContent = req.files;
  tmpContent['destination'] = req.files.script[0].destination;
  res.end("complete");
});

app.get('/editpage/script', function(req, res) {
  if(tmpContent){
    console.log(tmpContent);
      let scripts = tmpContent.script.map(a => a.originalname);
      console.log(scripts);
    res.render('demopages/editpage-script', {
      scripts : scripts,
      isLoginpage: true
    });
  }
});

app.get('/view/script', function(req, res) {
  res.render('demopages/view-script', {
    isLoginpage: true
  });
});

app.post('/savescript', scriptmanager_upload.uploadscript, function(req,res){
  console.log(req.files);
  console.log(req.body);

  //create list with all files required to save
  let body = JSON.parse(req.body.data);
  let allfiles = body.files;
  if(req.files){
    if(req.files.file.length > 0){
      let newfiles = req.files.file.map(a=> a.originalname);
      allfiles = body.files.concat(newfiles);
    }
  }
  scriptmanager_upload.publish(body.title, allfiles, tmpContent.destination);

});

app.get('/view/360', function(req, res) {
  res.render('demopages/view-360', {
    isLoginpage: true
  });
});
// ----- script upload to publish ------ END



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
        isLoginpage: true
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


//WORKING DOWNLOAD ASSET POST
app.post("/downloadasset/:modelid", function(req, res) {
  modeldatabase.GetModel(req.params.modelid, (result)=> {
    var downloadpath = __dirname + result.assetPath.folderpath.slice(1) + "/model";
    filedownloader.CreateZipArchive(result.title, downloadpath, (tmppath)=> {
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
app.get("/:user_id/dashboard/uploads", userController.showUploads)
app.get("/:user_id/dashboard/downloads", userController.showDownloads)
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
