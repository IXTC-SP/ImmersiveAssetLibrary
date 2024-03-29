//const userValidators = require("../validators/users");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const userModel = require("../models/user");
const modelModel = require("../models/model");
const threeSixtyModel = require("../models/threesixty");
const jwt = require("jsonwebtoken");
const jwt_decode = require("jwt-decode");
const awsMethods = require("../middlewares/aws_methods");
const { DateTime } = require("luxon");
const console = require("console");
const store = require("./mongo_store");
const errorMessage = (error, message) => {
  return { error, message };
};

const alertMessage = (alert, message) => {
  return { alert, message };
};

const emailValidation = (emailInput) => {
  //return true;
  const spMailFormat = "[a-z.]*[@]sp.edu.sg";
  const ichatMailFormat = "[a-z.]*[@]ichat.sp.edu.sg";
  if (emailInput.match(spMailFormat) || emailInput.match(ichatMailFormat)) {
    // console.log("email allowed");
    return true;
  }
  // console.log("email disallowed");

  return false;
};

const superAdmin = { "637c8339c46b477d10e8b585": "sandra_fong@sp.edu.sg", "63d22d60fa6042e19ea144df":"goh_zhe_an@sp.edu.sg", "63d22e25fa6042e19ea144f2": "tan_rijian@sp.edu.sg","63d22e55fa6042e19ea144f7": "eric_lim@sp.edu.sg"};

// let isSuccess = alertMessage(false, "");
// let errorObj = errorMessage(false, "");
class RenderObjs {
  constructor() {
    this.accounts = [];
    this.uploads = { models: [], 360: [] };
    this.downloads = { models: [], 360: [] };
    this.isSuccess = alertMessage(false, "");
    this.profile = "";
    this.errorObj = errorMessage(false, "");
  }
}

class RenderView {
  constructor(req, renderObj) {
    this.isLoginpage = true;
    this.isSuccess = req.isSuccess || renderObj.isSuccess;
    this.uploads = renderObj.uploads;
    this.downloads = renderObj.downloads;
    this.accounts = renderObj.accounts;
    this.errorObj = req.errorObj || renderObj.errorObj;
    this.profile = renderObj.profile;
    this.user = req.user;
  }
}
const uploadmanager= require("./uploadsmanager_model");
const controller = {
  logout: async (req, res) => {
    store.destroy(req.session.id, function(err, session){
      if(err){console.log(err)}
    })
    uploadmanager.closeTmpFolder(req.session.id);
    req.logout(function (err) {
      res.redirect("/login");
    });
  },
  showProfile: async (req, res) => {
    let renderObj = new RenderObjs();

    const { password, confirmPassword, email } = req.body;
    try {
      if (email) {
        if (confirmPassword) {
          if (password === "" || confirmPassword === "") {
            renderObj.profile = "edit";
            renderObj.errorObj = errorMessage(
              true,
              "Please fill in the required fields"
            );
          }
          if (password === confirmPassword) {
            const hash = await bcrypt.hash(password, 10);
            await userModel.findOneAndUpdate(
              {
                _id: req.params.user_id,
              },
              { $set: { password: hash } },
              { new: true }
            );
            renderObj.isSuccess = alertMessage(
              true,
              "Password Reset Sucessfully"
            );
          } else {
            renderObj.errorObj = errorMessage(
              true,
              "Confirm password does not match"
            );
            renderObj.profile = "edit";
          }
        } else {
          renderObj.profile = "edit";
        }
      }
      renderObj.uploads["models"] = await modelModel.find({
        owner: req.user._id,
      });
      renderObj.uploads["360"] = await threeSixtyModel.find({
        owner: req.user._id,
      });
      //console.log(renderObj.isSuccess.alert);
    } catch (err) {
      console.log(err);
      renderObj.errorObj = errorMessage(true, err.message);
    }
    let renderView = new RenderView(req, renderObj);
    res.render("users/dashboard", {
      ...renderView,
      showProfile: true,
      showUploads: false,
      showDownloads: false,
      showEnrollment: false,
    });
  },

  showEnrollment: async (req, res) => {
    let renderObj = new RenderObjs();

    try {
      renderObj.accounts = await userModel.find({isActivated:true});
    } catch (err) {
      renderObj.errorObj = errorMessage(true, "Failed to get users");
    }
    let renderView = new RenderView(req, renderObj);
    return res.render("users/dashboard", {
      ...renderView,
      showProfile: false,
      showUploads: false,
      showDownloads: false,
      showEnrollment: true,
    });
  },
  showDownloads: async (req, res, next) => {
    let renderObj = new RenderObjs();
    try {
      const user = await userModel
        .findOne({ _id: req.user._id })
        .populate("downloadedModels")
        .populate("downloadedThreeSixty");
      renderObj.downloads["models"] = [...user.downloadedModels];
      renderObj.downloads["360"] = [...user.downloadedThreeSixty];
    } catch (err) {
    }
    let renderView = new RenderView(req, renderObj);
    res.render("users/dashboard", {
      ...renderView,
      showProfile: false,
      showUploads: false,
      showDownloads: true,
      showEnrollment: false,
    });
  },
  showUploads: async (req, res, next) => {
    let renderObj = new RenderObjs();

    try {
      renderObj.uploads["models"] = await modelModel.find({
        owner: req.user._id,
      }).sort({uploaddate: -1});
      renderObj.uploads["360"] = await threeSixtyModel.find({
        owner: req.user._id,
      }).sort({uploaddate: -1});;
    } catch (err) {
      req.errorObj = errorMessage(true, err);
    }
    let renderView = new RenderView(req, renderObj);
    // console.log(renderObj)
    res.render("users/dashboard", {
      ...renderView,
      showProfile: false,
      showUploads: true,
      showDownloads: false,
      showEnrollment: false,
    });
  },
  //create routes
  createEnrollment: async (req, res, next) => {
    //click add account
    let renderObj = new RenderObjs();
    let isAdmin = null;
    let addedUser = null;
    const createUser = async () => {
      try {
        const token = jwt.sign(
          {
            data: req.body.email,
          },
          process.env.JWT_ACC_ACTIVATE,
          { expiresIn: "24 hrs" }
        );
        //only created the _id, email, isAdmin field
        req.body.isAdmin === "Admin" ? (isAdmin = true) : (isAdmin = false);
        addedUser = await userModel.create({
          ...req.body,
          isAdmin,
          activatePasswordLink: token,
        });
        req.token = token;
        // req.user = user;
        req.addedUser = addedUser;
        // req.accounts = accounts;
        return true;
      } catch (error) {
        renderObj.errorObj = errorMessage(true, error.message);
        return false;
      }
    };
    try {
      renderObj.accounts = await userModel.find({isActivated:true});
      if (req.body.email !== "") {
        //check is the sp email
        if (emailValidation(req.body.email)) {
          //check if email has been created before
          addedUser = await userModel.findOne({ email: req.body.email });
          if (addedUser) {
            //and is not activated, incase expire already and try to create again
            if (addedUser.isActivated) {
              renderObj.errorObj = errorMessage(
                true,
                "This email has account already been created"
              );
            } else if (
              !addedUser.isActivated &&
              addedUser.password === undefined
            ) {

              //not activated
              //check if token expired, not expired then cant create again
              //expired will hv err decoding, at catch err create the user
              const user = jwt_decode(addedUser.activatePasswordLink);
              const userExp = new Date(user.exp * 1000);
              const now = new Date();
              //this exp is issued with the token.....so we cant change it
              //not expired and not activate

              if (userExp > now) {
                //not expired, not activated, cannot enroll
                renderObj.errorObj = errorMessage(
                  true,
                  "This email account has not been activated"
                );
              }
            } else {//got deleted and tryna add back again
              req.body.isAdmin === "Admin" ? (isAdmin = true) : (isAdmin = false);
              let reactivateUser = await userModel.findOneAndUpdate({ email: req.body.email }, {isActivated: true, isAdmin}, {new: true});
              renderObj.isSuccess = alertMessage(
                true,
                "Account has been reactivated"
              );
              renderObj.accounts = await userModel.find({isActivated:true});
            }
          } else {
            const result = await createUser();
            if (result) {
              return next();
            }
          }
        } else {
          renderObj.errorObj = errorMessage(
            true,
            "You have entered an invalid email address!"
          );
        }
      } else {
        renderObj.errorObj = errorMessage(
          true,
          "Please fill in required fields"
        );
      }
    } catch (err) {
      if (err.message === "Invalid token specified") {
        await userModel.deleteOne({ _id: addedUser.id });
        const result = await createUser();
        if (result) {
          return next();
        }
      } else {
        renderObj.errorObj = errorMessage(true, err.message);
      }
    }
    let renderView = new RenderView(req, renderObj);
    return res.render("users/dashboard", {
      ...renderView,
      showProfile: false,
      showUploads: false,
      showDownloads: false,
      showEnrollment: true,
    });
  },
  deleteEnrollment: async (req, res, next) => {
    let isSuccess = alertMessage(false, " ");
    let errorObj = errorMessage(false, " ");
    try {
      //check it is not me
      if (superAdmin[req.params.acct_id] === undefined) {
        // await userModel.deleteOne({ _id: req.params.acct_id });
        await userModel.findOneAndUpdate(
          { _id: req.params.acct_id },
          { isActivated: false },
          { new: true }
        );
        isSuccess = alertMessage(true, "Account successfully deleted");
      } else {
        errorObj = errorMessage(
          true,
          "You are not authorized to delete this user"
        );
      }
    } catch (error) {
      errorObj = errorMessage(true, error.message);
    }
    req.isSuccess = isSuccess;
    req.errorObj = errorObj;
    return next();
  },
  deleteUploads: async (req, res, next) => {
    let dbmanager;
    let downloadedType;
    switch (req.params.type) {
      case "model":
        dbmanager = modelModel;
        downloadedType = "downloadedModels";
        break;
      case "360":
        dbmanager = threeSixtyModel;
        downloadedType = "downloadedThreeSixty";
        break;
    }
    let isSuccess = alertMessage(false, " ");
    let errorObj = errorMessage(false, " ");
    try {
      await userModel.updateMany(
        { downloadedType: [req.params.asset_id] },
        { $pullAll: { downloadedType: [req.params.asset_id] } }
      );
      await dbmanager.deleteOne({ _id: req.params.asset_id });
      const deletedInAws = await awsMethods.deleteFiles(req.params.asset_id);
      if (deletedInAws.Deleted) {
        isSuccess = alertMessage(true, "Asset successfully deleted");
      }
    } catch (error) {
      errorObj = errorMessage(true, error.message);
    }
    req.isSuccess = isSuccess;
    req.errorObj = errorObj;
    //return redirect(`/${req.params.user_id}/dashboard/uploads`)
    return next();
  },
};

module.exports = controller;
