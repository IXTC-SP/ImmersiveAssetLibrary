require("dotenv").config();

const express = require("express");
const ejs = require("ejs");
const app = express();
// const fs = require("fs");
const bodyParser = require("body-parser");

const session = require("express-session");

// const path = require("path");
const url = require("url");

const gltfmodel = require("./scripts/gltfmodel");
const uploadsmanager_model = require("./scripts/uploadsmanager_model");
const databasemanager_model = require("./scripts/databasemanager_model");
// const uploadmanager_360 = require("./scripts/uploadmanager_360");
const databasemanager_360 = require("./scripts/databasemanager_360");
// const storagemanagement = require("./scripts/storagemanagement");
// const filedownloader = require("./scripts/filedownloader");
const userController = require("./scripts/users_controller");
const authController = require("./scripts/auth_controller");
const authMiddleware = require("./middlewares/auth_middleware"); // middleware for the authentication, to check if theres a session
const passport = require("passport");
const awsMethods = require("./middlewares/aws_methods");
// const archiver = require("archiver");
// const PassThrough = require("stream");

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
    process.exit(1);
  }
  databasemanager_360.UpdateThumbnailUrl()
  databasemanager_model.UpdateThumbnailUrl()
  job();
});

const userModel = require("./models/user");

//For loading single model/360 pages
app.get(
  "/asset/:type/:modelid",
  authMiddleware.isAuthenticated,
  function (req, res) {
    var dbmanager;
    var isModel;
    switch (req.params.type) {
      case "model":
        dbmanager = databasemanager_model;
        isModel = true;
        break;
      case "360":
        dbmanager = databasemanager_360;
        isModel = false;
        break;
    }
    var modelid = req.params.modelid;
    dbmanager.FindModelById(modelid, async (result) => {
      var buffers;
      if(isModel){
        buffers = await awsMethods.getSingleModelContentByURL(req.params.modelid,result.assetPath.gltfmodelpath)
      } else {
        if(result.assetPath.equirectangular) {
          buffers = await awsMethods.getSingleEquirectangularContent(req.params.modelid,result.assetPath.equirectangular)
        } else {
          buffers = await awsMethods.getSingleCubemapContent(req.params.modelid,result.assetPath.cubemap)
        }
      } 
      // const used = process.memoryUsage().heapUsed / 1024 / 1024;
      // console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
      userModel.findById(result.owner, function (err, doc) {
        res.render("view_asset", {
          buffers : buffers,
          data: result,
          assettype: req.params.type,
          owner: doc.email,
          isLoginpage: true,
          isModel,
          user: req.user,
        });
      });
    });
  }
);

//checking model filter on assets page
const check3dModelFilters = async (result, query) => {
  let filteredResult = [];
  const attributesPromise = async () => {
    if (typeof query.attributes !== "undefined" && query.attributes !== "") {
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
    if (
      query.format !== "format" &&
      query.format !== "" &&
      typeof query.format !== "undefined"
    ) {
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
//checking 360 filter on assets page
const check360Filters = async (result, query) => {
  let filteredResult = [];
  const formatPromise = async () => {
    if (
      query.format !== "format" &&
      query.format !== "" &&
      typeof query.format !== "undefined"
    ) {
      const list = await databasemanager_360.FindByFormat(result, query.format);
      return list;
    } else {
      return result;
    }
  };
  filteredResult = await formatPromise();
  return filteredResult;
};
//sorting assets on assets pages
const sortResults = (result) => {
  result.sort((a, b) => {
    return a.uploaddate > b.uploaddate
      ? -1
      : a.uploaddate > b.uploaddate
      ? 1
      : 0;
  });

  return result;
};

//WORKING (ASSET LIST PAGE)
app.get(
  "/assets/models",
  authMiddleware.isAuthenticated,
  async function (req, res) {
    let filteredResult = [];
    if (typeof req.query.search === "undefined" || req.query.search === "") {
      databasemanager_model.GetAllModels(async (result) => {
        filteredResult = await check3dModelFilters(result, req.query);
        filteredResult = await sortResults(filteredResult);
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
        filteredResult = await check3dModelFilters(result, req.query);
        filteredResult = await sortResults(filteredResult);
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
  }
);
app.post("/assets", function (req, res) {
  if (req.body.asset === "360") {
    req.body.format === "equirectangular" || req.body.format === "cubemap"
      ? null
      : (req.body.format = "format");
    res.redirect(
      url.format({
        pathname: "/assets/360",
        query: {
          attributes: req.body.attributes,
          format: req.body.format,
          search: req.body.searchterm,
        },
      })
    );
  } else {
    req.body.format === "obj" || req.body.format === "fbx" || req.body.format === "gltf"
      ? null
      : (req.body.format = "format");
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
    databasemanager_360.GetAllModels(async (result) => {
      filteredResult = await check360Filters(result, req.query);
      filteredResult = await sortResults(filteredResult);
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
    databasemanager_360.SearchBar(req.query.search, async (result) => {
      filteredResult = await check360Filters(result, req.query);
      filteredResult = await sortResults(filteredResult);
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
  res.render("/dragndrop", {
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
    tmpContent["format"] = tmpContent.model[0].originalname.split(".")[1];
    gltfmodel.Create(req.files.model[0], function (gltfresult) {
      if (gltfresult) {
        tmpContent["modelviewerpath"] = "../uploads/tmp/model.gltf";
        tmpContent["folderpath"] = tmpContent.model[0].originalname.split(".")[0];
        gltfmodel.ClearMaterialFromModel(gltfresult, function () {
          res.end("complete");
        });
      } else {
        tmpContent["folderpath"] = tmpContent.model[0].originalname.split(".")[0];
        var fullpath = tmpContent.model[0].destination + tmpContent.model[0].originalname;
        tmpContent["modelviewerpath"] = "." + fullpath;
        gltfmodel.ClearMaterialFromModel(fullpath, function () {
          res.end("complete");
        });
      }
     
    });
  }
);

app.get("/editpage/model", function (req, res) {
  if (tmpContent) {
    let images;
    if (tmpContent.image) {
      images = tmpContent.image.map((a) => a.originalname);
    }
    res.render("editpage-model", {
      content: {
        folderpath: tmpContent.folderpath,
        modelviewerpath: tmpContent.modelviewerpath,
        modelfile: tmpContent.model[0].originalname,
        thumbnail:
          typeof tmpContent.thumbnail == "undefined"
            ? ""
            : tmpContent.thumbnail[0].originalname,
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

  //save model database
  databasemanager_model.save(req, res, async function (result) {
    tmpContent["thumbnail"] = req.files.newthumbnail[0];
    const uploadedDataToAws = await awsMethods.uploadFiles(tmpContent, result, "3dModel");
    tmpContent = []
    databasemanager_model.GetModel(result, async function (doc) {
      databasemanager_model.updateToAwsPaths(
        doc,
        uploadedDataToAws,
        function (id) {
          res.send(id);
        }
      );
    });

 
});
});
// ----- model upload to publish ------ END


// Begin reading from stdin so the process does not exit imidiately
process.stdin.resume();
process.on("SIGINT", function () {
  process.exit();
});

process.on("exit", () => {
  uploadsmanager_model.closeTmpFolder();
});

//WORKING DOWNLOAD ASSET POST
app.post("/downloadasset/:type/:modelid", function (req, res) {
  var dbmanager = databasemanager_model;
  var update;
  var filter;
  switch (req.params.type) {
    case "model":
      dbmanager = databasemanager_model;
      update = {
        $push: {
          downloadedModels: mongoose.Types.ObjectId(req.params.modelid),
        },
      };
      filter = {
        _id: req.user._id,
        downloadedModels: req.params.modelid,
      };
      break;
    case "360":
      dbmanager = databasemanager_360;
      update = {
        $push: {
          downloadedThreeSixty: mongoose.Types.ObjectId(req.params.modelid),
        },
      };
      filter = {
        _id: req.user._id,
        downloadedThreeSixty: req.params.modelid,
      };
      break;
  }
  //get userid and add modelid into userid database
  dbmanager.GetModel(req.params.modelid, async (result) => {
    try {
      //download from aws
      const zipFiles = await awsMethods.downloadFiles(result._id);
      // res is the response object in the http request. You may want to create your own write stream object to write files in your local machine
      zipFiles.pipe(res);
      // use finalize function to start the process
      zipFiles.finalize();
      let doc = await userModel.findOne(filter);
      if (doc === null) {
        userModel.findOneAndUpdate(
          { _id: req.user._id },
          update,
          function (err, doc) {
            if (err) console.log(err);
          }
        );
      } else {
      }
    } catch (error) {
      console.log(error);
    }
  });
});
app.get(
  "/:user_id/dashboard/profile",
  authMiddleware.isAuthenticated,
  userController.showProfile
);
app.post(
  "/:user_id/dashboard/profile",
  authMiddleware.isAuthenticated,
  userController.showProfile
);
app.patch(
  "/:user_id/dashboard/profile",
  authMiddleware.isAuthenticated,
  userController.showProfile
);

app.get(
  "/:user_id/dashboard/uploads",
  authMiddleware.isAuthenticated,
  userController.showUploads
);
app.get(
  "/:user_id/dashboard/downloads",
  authMiddleware.isAuthenticated,
  userController.showDownloads
);
app.get(
  "/:user_id/dashboard/enrollment",
  authMiddleware.isAuthenticated,
  userController.showEnrollment
);
app.get("/", function (req,res){
  res.redirect("/login");
});
app.get("/login", authController.showlogin);
app.get("/authentication/activate", authController.showActivateAndSetPassword); //done
app.get("/forgot-password", authController.showForgotPassword); //done
app.get("/reset-password", authController.showSetPassword); //done
app.get("/logout", authMiddleware.isAuthenticated, userController.logout);

app.post(
  "/:user_id/dashboard/enrollment",
  authMiddleware.isAuthenticated,
  userController.createEnrollment,
  authController.emailActivation,
  userController.showEnrollment
);
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

app.delete(
  "/:user_id/dashboard/uploads/:type/:asset_id/delete",
  authMiddleware.isAuthenticated,
  userController.deleteUploads,
  userController.showUploads
);
