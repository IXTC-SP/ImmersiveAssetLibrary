//const userValidators = require("../validators/users");
require("dotenv").config();
const bcrypt = require("bcrypt");
const userModel = require("../models/user");
const modelModel = require("../models/model");
const threeSixtyModel = require("../models/threesixty");
const tokenModel = require("../models/token");
const jwt = require("jsonwebtoken");
const jwt_decode = require("jwt-decode");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const { DateTime } = require("luxon");
const console = require("console");
const errorMessage = (error, message) => {
  return { error, message };
};

const alertMessage = (alert, message) => {
  return { alert, message };
};

const emailValidation = (emailInput) => {
 // return true;
  const spMailFormat = "[a-z.]*[@]\sp.edu.sg"
  const ichatMailFormat  = "[a-z.]*[@]\ichat.sp.edu.sg"
  if (emailInput.match(spMailFormat) || emailInput.match(ichatMailFormat)) {
    console.log("email allowed")
    return true
  }
  console.log("email disallowed")

  return false
};

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
    this.isLoginpage= true
    this.isSuccess= req.isSuccess || renderObj.isSuccess
    this.uploads = renderObj.uploads
    this.downloads = renderObj.downloads
    this.accounts = renderObj.accounts
    this.errorObj= req.errorObj || renderObj.errorObj
    this.profile = renderObj.profile
    this.user= req.session.userObj
  }
}
const controller = {
  logout: async (req, res) => {
    req.logout(function(err) {
      res.redirect("/login");
    });
    
    // try {
    //   //paspport function, clears session, but not cookie
    //   //but if session is cleared no more id can be found it wont pop req.user,

     
    // } catch (err) {
    //   res.redirect("/login");
    //  // return res.status(404).json("error:", err.message);

    // }
  },
  showProfile: async (req, res) => {
    let renderObj = new RenderObjs()
   
    console.log(renderObj)
    console.log("------>", req.body.email);
    console.log("---->", req.body.confirmPassword);
    const { password, confirmPassword, email } = req.body;
    try {
      if (email) {
        if (confirmPassword) {
          console.log("--->", "save pw");
          if (password === "" || confirmPassword === "") {
            renderObj.profile = "edit";
            renderObj.errorObj = errorMessage(true, "Please fill in the required fields");
          }
          if (password === confirmPassword) {
            console.log("pw same");
            const hash = await bcrypt.hash(password, 10);
            await userModel.findOneAndUpdate(
              {
                _id: req.params.user_id,
              },
              { $set: { password: hash } },
              { new: true }
            );
            renderObj.isSuccess = alertMessage(true, "Password Reset Sucessfully");
          } else {
            renderObj.errorObj = errorMessage(true, "Confirm password does not match");
            renderObj.profile = "edit";
            console.log("click save");
          }
        } else {
          renderObj.profile = "edit";
          console.log("click change pw");
        }
      }
      renderObj.uploads["models"] = await modelModel.find({
        owner: req.session.userObj._id,
      });
      renderObj.uploads["360"] = await threeSixtyModel.find({
        owner: req.session.userObj._id,
      });
      console.log(renderObj.isSuccess.alert);
    } catch (err) {
      console.log(err);
      renderObj.errorObj = errorMessage(true, err.message);
    }
    let renderView = new RenderView(req, renderObj)
    res.render("users/dashboard", {
      ...renderView,
      showProfile: true,
      showUploads: false,
      showDownloads: false,
      showEnrollment: false,
    });
  },

  showEnrollment: async (req, res) => {
    let renderObj = new RenderObjs()
    
    try {
      renderObj.accounts = await userModel.find();
      console.log(renderObj.accounts)
      console.log("Get the accounts");
    } catch (err) {
      console.log(err);
      renderObj.errorObj = errorMessage(true, "Failed to get users");
    }
    let renderView = new RenderView(req, renderObj)
    return res.render("users/dashboard", {
      ...renderView,
      showProfile: false,
      showUploads: false,
      showDownloads: false,
      showEnrollment: true,
    });
  },
  showDownloads: async (req, res, next) => {
    let renderObj = new RenderObjs()

    let user = req.session.userObj;
    try {
      renderObj.downloads["models"] = [...user.downloadedModels];
      renderObj.downloads["360"] = [...user.downloadedThreeSixty];
    } catch (err) {
      console.log(err);
    }
    let renderView = new RenderView(req, renderObj)
    res.render("users/dashboard", {
      ...renderView,
      showProfile: false,
      showUploads: false,
      showDownloads: true,
      showEnrollment: false,
    });
  },
  showUploads: async (req, res, next) => {
    let renderObj = new RenderObjs()

    console.log("-->", req.errorObj);
    try {
      renderObj.uploads["models"] = await modelModel.find({
        owner: req.session.userObj._id,
      });
      renderObj.uploads["360"] = await threeSixtyModel.find({
        owner: req.session.userObj._id,
      });
    } catch (err) {
      console.log(err);
      req.errorObj = errorMessage(true, err);
    }
    let renderView = new RenderView(req, renderObj)
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
    let renderObj = new RenderObjs()
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
        console.log("create user");
        addedUser = await userModel.create({
          ...req.body,
          isAdmin,
          activatePasswordLink: token,
        });
        req.token = token;
        // req.user = user;
        req.addedUser = addedUser;
        // req.accounts = accounts;
        console.log("next is email activation");
        return true;
      } catch (error) {
        console.log(error);
        renderObj.errorObj = errorMessage(true, error.message);
        return false;
      }
    };
    try {
      console.log("---->", req.body);
      renderObj.accounts = await userModel.find();
      console.log("Get the accounts");
      if (req.body.email !== "") {
        //check is the sp email
        if (emailValidation(req.body.email)) {
          //check if email has been created before
          addedUser = await userModel.findOne({ email: req.body.email });
          console.log("check if is activated", addedUser);
          if (addedUser) {
            //and is not activated, incase expire already and try to create again
            if (addedUser.isActivated) {
              console.log(addedUser);
              renderObj.errorObj = errorMessage(
                true,
                "This email has account already been created"
              );
            } else {
              //not activated
              //check if token expired, not expired then cant create again
              //expired will hv err decoding, at catch err create the user
              const user = jwt_decode(addedUser.activatePasswordLink);
              const userExp = new Date(user.exp * 1000);
              const now = new Date();
              //this exp is issued with the token.....so we cant change it
              //not expired and not activate
              console.log(user);
              console.log(userExp);
              console.log(now);

              if (userExp > now) {
                //not expired, not activated, cannot enroll
                console.log("not expired not activated");
                renderObj.errorObj = errorMessage(
                  true,
                  "This email account has not been activated"
                );
              }
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
        renderObj.errorObj = errorMessage(true, "Please fill in required fields");
      }
    } catch (err) {
      console.log(err);
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
    let renderView = new RenderView(req, renderObj)
    return res.render("users/dashboard", {
      ...renderView,
      showProfile: false,
      showUploads: false,
      showDownloads: false,
      showEnrollment: true,
    });
  },
  deleteEnrollment: async (req, res, next) => {
    console.log("delete enrollment");
    let isSuccess = alertMessage(false, " ");
    let errorObj = errorMessage(false, " ");
    try {
      await userModel.deleteOne({ _id: req.params.acct_id });
      isSuccess = alertMessage(true, "Account successfully deleted");
    } catch (error) {
      errorObj = errorMessage(true, error.message);
    }
    req.isSuccess = isSuccess;
    req.errorObj = errorObj;
    return redirect(`/${req.params.user_id}/dashboard/enrollment`)
   // return next();
  },
  deleteUploads: async (req, res, next) => {
    let dbmanager;
    switch (req.params.type){
      case 'model':
        console.log('model asset type');
        dbmanager = modelModel;
        break;
      case '360':
        console.log('360 asset type');
        dbmanager = threeSixtyModel;
        break;
    }
    console.log("delete uploads");
    let isSuccess = alertMessage(false, " ");
    let errorObj = errorMessage(false, " ");
    try {
      await dbmanager.deleteOne({ _id: req.params.asset_id });
      isSuccess = alertMessage(true, "Asset successfully deleted");
    } catch (error) {
      errorObj = errorMessage(true, error.message);
    }
    req.isSuccess = isSuccess;
    req.errorObj = errorObj;
    return redirect(`/${req.params.user_id}/dashboard/uploads`)
  },
};

module.exports = controller;
