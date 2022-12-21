require("dotenv").config();

const express = require("express");
const ejs = require("ejs");
const app = express();
const fs = require("fs");
const bodyParser = require("body-parser");

const session = require("express-session");

const path = require("path");
const url = require("url");
const userObj = require("./config/userLogin");

const gltfmodel = require('./scripts/gltfmodel');
const uploadsmanager_model = require('./scripts/uploadsmanager_model');
const databasemanager_model = require('./scripts/databasemanager_model');
const uploadmanager_360 = require('./scripts/uploadmanager_360');
const databasemanager_360 = require('./scripts/databasemanager_360');
const storagemanagement = require('./scripts/storagemanagement');
const filedownloader = require('./scripts/filedownloader');
const userController = require('./scripts/users_controller');
const authController = require('./scripts/auth_controller');
const authMiddleware = require('./middlewares/auth_middleware')// middleware for the authentication, to check if theres a session
const passport = require("passport");

const flash = require("connect-flash");
const methodOverride = require("method-override");
const job = require("./Cron/cron_jobs");
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use("/scripts", express.static("scripts"));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(flash());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //2 DAY
    },
  })
);

//every route
//fisrt check if the req.user is there ( on login will store)
//if null, no need to get the userid, so no req.user
//if have then, means has login, pass in the userid for the deserializer
app.use(passport.initialize()); //refresh the passport middleware, thers a chance the session expired
app.use(passport.session()); //so that can tap into the express sessions data
// createStrategy is responsible to setup passport-local LocalStrategy with the correct options.
require("./config/passport");

//sandra connection
const mongoose = require("mongoose");
//Mongoose
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}.trfz1qc.mongodb.net/`;
const port = process.env.PORT || 3000;
app.listen(port, async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGO_DB,
    });
  } catch (err) {
    console.log(`Failed to connect to DB`);
    process.exit(1);
  }

  console.log(`Immersive Library backend listening on port ${port}`);
  job.start();
  
});

const userModel = require("./models/user");

app.get('/asset/:type/:modelid', function(req, res) {
  var dbmanager;
  var isModel
  switch (req.params.type){
    case 'model':
      console.log('model asset type');
      dbmanager = databasemanager_model;
      isModel = true
      break;
    case '360':
      console.log('360 asset type');
      dbmanager = databasemanager_360;
      isModel = false
      break;
  }
  dbmanager.FindModelById(req.params.modelid, (result) => {
    console.log("---->", result);
    console.log(result.owner);
    userModel.findById(result.owner, function (err, doc) {
      console.log(doc.email);
      res.render("view_asset", {
        data: result,
        assettype : req.params.type,
        owner: doc.email,
        isLoginpage: true,
        isModel,
        user: req.user,
      });
    });
  });
});

const check3dModelFilters = async (result, query) => {
  let filteredResult = [];
  const attributesPromise = async () => {
    if (typeof query.attributes !== "undefined" && query.attributes !== "" ) {
      const list = await databasemanager_model.FindByAttribute(
        result,
        query.attributes
      );
      return list;
    } else {
      return result;
    }
  };
  filteredResult = await attributesPromise();
  const formatPromise = async () => {
    if (query.format !== "format" && query.format !== "" && typeof query.format !== "undefined") {
      const list = await databasemanager_model.FindByFormat(
        filteredResult,
        query.format
      );
      return list;
    } else {
      return filteredResult;
    }
  };
  filteredResult = await formatPromise();
  return filteredResult;
};
const check360Filters = async (result, query) => {
  let filteredResult = [];
  const formatPromise = async () => {
    if (query.format !== "format" && query.format !== "" && typeof query.format !== "undefined") {
      const list = await databasemanager_360.FindByFormat(
        result,
        query.format
      );
      console.log("--->", list)
      return list;
    } else {
      return result;
    }
  };
  filteredResult = await formatPromise();
  return filteredResult;
};

//WORKING (ASSET LIST PAGE)
app.get("/assets/models", authMiddleware.isAuthenticated, async function (req, res) {
  let filteredResult = [];
  if (typeof req.query.search === "undefined" || req.query.search === "") {
    console.log("no search");
    databasemanager_model.GetAllModels(async (result) => {
      filteredResult = await check3dModelFilters (result, req.query);
      console.log(filteredResult.length)
      res.render("assets", {
        data: {
          models: filteredResult,
        },
        assettype: "model",
        user: req.user,
        isLoginpage: true,
        is3dmodelPage: true,
      });
    });
  } else {
    databasemanager_model.SearchBar(req.query.search, async (result) => {
      filteredResult = await check3dModelFilters (result, req.query);
      res.render("assets", {
        data: {
          models: filteredResult,
        },
        assettype: "model",
        user: req.user,
        isLoginpage: true,
        is3dmodelPage: true,
      });
    });
  }
});

app.post("/assets", function (req, res) {
  console.log(req.body)
  if(req.body.asset === "360"){
    req.body.format === "equirectangular" || req.body.format === "cubemap"?  null : req.body.format = "format" 
    res.redirect(
      url.format({
        pathname: "/assets/360",
        query: {
          attributes: req.body.attributes,
          format: req.body.format ,
          search: req.body.searchterm,
        },
      })
    );
  }else{
    req.body.format === "obj" || req.body.format === "fbx"? null:  req.body.format = "format" 
    res.redirect(
      url.format({
        pathname: "/assets/models",
        query: {
          attributes: req.body.attributes,
          format: req.body.format,
          search: req.body.searchterm,
        },
      })
    );
  }
 
});
app.get("/assets/360", async function (req, res) {
  let filteredResult = [];
  if (typeof req.query.search === "undefined" || req.query.search === "") {
    console.log("no search");
    databasemanager_360.GetAllModels(async (result) => {
      filteredResult = await check360Filters(result, req.query);
      res.render("assets", {
        data: {
          models: filteredResult,
        },
        user: req.user,
        assettype: "360",
        isLoginpage: true,
        is3dmodelPage: false,
      });
    });
  } else {
    console.log("search");
    databasemanager_360.SearchBar(req.query.search, async (result) => {
      filteredResult = await check360Filters(result, req.query);
      res.render("assets", {
        data: {
          models: filteredResult,
        },
        assettype: "360",
        user: req.user,
        isLoginpage: true,
        is3dmodelPage: false,
      });
    });
  }
});


//WORKING (UPLOAD PAGE)
const uploadmanager = require("./scripts/uploadsmanager_model");
app.get("/upload", function (req, res) {
  uploadmanager.closeTmpFolder();
  res.render("demopages/dragndrop", {
    isLoginpage: true,
    user: req.user,
  });
});

// ----- model upload to publish ------ START
var tmpContent = [];

app.post(
  "/uploadtmp3dmodel",
  uploadsmanager_model.uploadtmp3D,
  function (req, res) {
    tmpContent = req.files;
    let result;
    if (tmpContent.image) {
      result = tmpContent.image.map((a) => a.originalname);
    }
    tmpContent['format'] = tmpContent.model[0].originalname.split('.')[1];
    gltfmodel.Create(req.files.model[0], function (gltfresult) {
      // Include fs module
      // var fs = require('fs');
      if (gltfresult != "") {
        tmpContent["modelviewerpath"] = "../uploads/tmp/model.gltf";
      } else {
        tmpContent["modelviewerpath"] =
          "." +
          tmpContent.model[0].destination +
          tmpContent.model[0].originalname;
      }
      tmpContent["folderpath"] = tmpContent.model[0].originalname.split(".")[0];
      console.log(tmpContent);
      res.end("complete");
    });
  }
);

app.get("/editpage/model", function (req, res) {
  if (tmpContent) {
    let images;
    if (tmpContent.image) {
      images = tmpContent.image.map((a) => a.originalname);
      console.log(images);
    }

    res.render("demopages/editpage-model", {
      content: {
        folderpath: tmpContent.folderpath,
        modelviewerpath: tmpContent.modelviewerpath,
        modelfile: tmpContent.model[0].originalname,
        thumbnail: typeof(tmpContent.thumbnail) == 'undefined' ? '' : tmpContent.thumbnail[0].originalname,
        imagefiles: images,
        format: tmpContent.format,
      },
      isLoginpage: true,
      isModel: true,
      user: req.user,
    });
  }
});

app.post("/save3dmodel", uploadsmanager_model.upload3D, function (req, res) {
  console.log(req.files);
  console.log(req.body);

  //create list with all files required to save
  let body = JSON.parse(req.body.data);
  let allfiles = body.files;
  if (req.files.file) {
    if (req.files.file.length > 0) {
      let newfiles = req.files.file.map((a) => a.originalname);
      allfiles = body.files.concat(newfiles);
    }
  }
  if (typeof body.modelfile != "undefined") {
    allfiles.push(body.modelfile);
  }
  if (typeof body.modelviewerpath != "undefined") {
    allfiles.push(body.modelviewerpath);
  }
  if (typeof req.files.newthumbnail != "undefined") {
    console.log(req.files.newthumbnail[0].originalname);
    allfiles.push(req.files.newthumbnail[0].filename);
  }
  let thumbnail =
    body.thumbnail == ""
      ? req.files.newthumbnail[0].originalname.replace("tmp", body.folderpath)
      : body.thumbnail;
  uploadsmanager_model.publish(
    body.folderpath,
    allfiles,
    tmpContent.model[0].destination
  );
  //save model database
  databasemanager_model.save(req,res, allfiles, function(result){
    res.send(result);
    var oldpath = './uploads/' + body.folderpath.replaceAll(' ', '_');
    var newpath = './uploads/' + result;
    uploadsmanager_model.changepath(oldpath, newpath);
  });
});
// ----- model upload to publish ------ END

// ----- 360 upload to publish ------ START

app.post("/uploadtmp360", uploadmanager_360.uploadtmp360, function (req, res) {
  console.log(req.body);
  console.log(req.files);
  tmpContent["image"] = [];
  tmpContent["destination"] = req.files.image[0].destination;
  if (req.body.format == "cubemap") {
    tmpContent["image"]["top"] = req.files.image.find(
      (element) => element.originalname.split("_")[0] == "top"
    ).originalname;
    tmpContent["image"]["front"] = req.files.image.find(
      (element) => element.originalname.split("_")[0] == "front"
    ).originalname;
    tmpContent["image"]["bottom"] = req.files.image.find(
      (element) => element.originalname.split("_")[0] == "bottom"
    ).originalname;
    tmpContent["image"]["right"] = req.files.image.find(
      (element) => element.originalname.split("_")[0] == "right"
    ).originalname;
    tmpContent["image"]["back"] = req.files.image.find(
      (element) => element.originalname.split("_")[0] == "back"
    ).originalname;
    tmpContent["image"]["left"] = req.files.image.find(
      (element) => element.originalname.split("_")[0] == "left"
    ).originalname;
  } else {
    tmpContent["image"]["equi"] = req.files.image[0].originalname;
  }
  tmpContent["format"] = req.body.format;
  console.log(tmpContent);
  res.end("complete");
});

app.get("/editpage/360", function (req, res) {
  res.render("demopages/editpage-360", {
    format: tmpContent.format,
    images: tmpContent.image,
    isLoginpage: true,
    isModel: false,
    user: req.user,
  });
});

app.post("/savethreesixty", uploadmanager_360.upload360, function (req, res) {
  console.log(req.files);
  console.log(req.body);

  //create list with all files required to save
  let body = JSON.parse(req.body.data);
  let allfiles = body.files;
  if (req.files.file) {
    console.log("running req files");
    if (req.files.file.length > 0) {
      let newfiles = req.files.file.map((a) => a.originalname);
      allfiles = body.files.concat(newfiles);
    }
  }
  console.log(allfiles);
  let foldername =
    body.title == "" ? "default_foldername" : body.title.replaceAll(" ", "_");

  uploadmanager_360.publish(foldername, allfiles, tmpContent.destination);

  databasemanager_360.save(req,res, allfiles, function(result){
    res.send(result);
    var oldpath = './uploads/' + foldername;
    var newpath = './uploads/' + result;
    uploadmanager_360.changepath(oldpath, newpath);
  });

});

app.get("/view/360", function (req, res) {
  res.render("demopages/view-360", {
    isLoginpage: true,
    user: req.user,
  });
});
// ----- 360 upload to publish ------ END

// ----- script upload to publish ------ START
const uploadmanager_script = require("./scripts/uploadmanager_script");
const console = require("console");
app.post(
  "/uploadtmpscript",
  uploadmanager_script.uploadtmpscript,
  function (req, res) {
    tmpContent = req.files;
    tmpContent["destination"] = req.files.script[0].destination;
    res.end("complete");
  }
);

app.get("/editpage/script", function (req, res) {
  if (tmpContent) {
    console.log(tmpContent);
    let scripts = tmpContent.script.map((a) => a.originalname);
    console.log(scripts);
    res.render("demopages/editpage-script", {
      scripts: scripts,
      isLoginpage: true,
    });
  }
});

app.get("/view/script", function (req, res) {
  res.render("demopages/view-script", {
    isLoginpage: true,
  });
});

app.post(
  "/upload",
  storagemanagement.uploadHandler.fields([
    { name: "objectfile", maxCount: 1 },
    { name: "diffuse", maxCount: 1 },
    { name: "metallicroughness", maxCount: 1 },
    { name: "normal", maxCount: 1 },
    { name: "occlusion", maxCount: 1 },
    { name: "emission", maxCount: 1 },
  ]),
  function (req, res) {
    console.log(req.body);
    var modelfolderpath =
      req.files.objectfile[0].destination.split("/model")[0];
    gltfmodel.Create(req.files.objectfile, function (gltfresult) {
      console.log(gltfresult);
      res.send("done");
    });
  }
);

// Begin reading from stdin so the process does not exit imidiately
process.stdin.resume();
process.on("SIGINT", function () {
  console.log("Interrupted");
  process.exit();
});

process.on("exit", () => {
  uploadsmanager_model.closeTmpFolder();
  console.log("process.exit() method is fired");
});


//WORKING DOWNLOAD ASSET POST
app.post("/downloadasset/:type/:modelid", function(req, res) {
  var dbmanager = databasemanager_model;
  var update;
  console.log(req.params.modelid);
  //console.log(req.param.modelid);
  switch(req.params.type){
    case 'model':
      dbmanager = databasemanager_model;
      update = { $push: {downloadedModels: mongoose.Types.ObjectId(req.params.modelid)}}
      break;
    case '360':
      dbmanager = databasemanager_360;
      update = { $push: {downloadedThreeSixty:  mongoose.Types.ObjectId(req.params.modelid)}}
      break;
  }
  //get userid and add modelid into userid database
  dbmanager.GetModel(req.params.modelid, (result)=> {
    var downloadpath = __dirname + result.assetPath.folderpath.slice(1);
    filedownloader.CreateZipArchive(result.title, downloadpath, (tmppath)=> {
      res.download(tmppath, req.param('file'), function(err){
      //CHECK FOR ERROR
      fs.unlink(tmppath, (err)=> {
        if(err) console.log(err);
        else {
          console.log("complete fs delete tmp file", req.user);
          //save asset id into user downloaded array
          var filter = { _id: req.user._id };
          userModel.findOneAndUpdate(filter, update, function(err,doc){
            if(err) console.log(err);
            console.log('updated', doc);
          })
        }
      });
      });
    });
  });
});

app.get("/:user_id/dashboard/profile", authMiddleware.isAuthenticated, userController.showProfile);
app.post("/:user_id/dashboard/profile", authMiddleware.isAuthenticated, userController.showProfile);
app.patch("/:user_id/dashboard/profile", authMiddleware.isAuthenticated, userController.showProfile);

app.get("/:user_id/dashboard/uploads", authMiddleware.isAuthenticated, userController.showUploads);
app.get("/:user_id/dashboard/downloads", authMiddleware.isAuthenticated, userController.showDownloads);
app.get("/:user_id/dashboard/enrollment", authMiddleware.isAuthenticated, userController.showEnrollment);
app.get("/login", authController.showlogin);
app.get("/authentication/activate", authController.showActivateAndSetPassword); //done
app.get("/forgot-password", authController.showForgotPassword); //done
app.get("/reset-password", authController.showSetPassword); //done
app.get("/logout", authMiddleware.isAuthenticated, userController.logout);

app.post(
  "/:user_id/dashboard/enrollment",
  authMiddleware.isAuthenticated, userController.createEnrollment,
  authController.emailActivation,
  userController.showEnrollment
); //done
// app.post("/:user_id/dashboard", userController.showDashboard)
app.post("/:user_id/uploads/delete", authMiddleware.isAuthenticated, userController.deleteUpload);
// app.post("/:user_id/uploads/edit", userController.editUpload);
// app.post("/:user_id/uploads", userController.upload);
app.post("/reset-password-link", authController.sendResetPasswordLink);
app.post("/authentication/activate", authController.setPassword);
app.post("/reset-password", authController.setPassword); //done
//pass the middleware. authenticate will look into the passport.js for the verify callback, and can include options of authntication
//with the veryfycall back ut finds the user in the dbs and
//a passport props wil be created in the the express session
//so there is a req.user
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  authController.login
);
app.post("/logout", authMiddleware.isAuthenticated, userController.logout);

app.delete(
  "/:user_id/dashboard/enrollment/:acct_id/delete",
  authMiddleware.isAuthenticated,
  userController.deleteEnrollment,
  userController.showEnrollment
);
