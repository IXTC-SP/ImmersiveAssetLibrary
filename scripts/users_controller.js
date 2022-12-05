//const userValidators = require("../validators/users");
require("dotenv").config();
const bcrypt = require("bcrypt");
const userModel = require("../models/user");
const modelModel = require("../models/model");
const tokenModel = require("../models/token");
// const mailgun = require("mailgun-js");
// const DOMAIN = "sandbox5c0f43edfce94ab7b5552e3de5598fae.mailgun.org";
// const mg = mailgun({ apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN });
const jwt = require("jsonwebtoken");
const jwt_decode = require("jwt-decode");
const crypto = require("crypto");
// const { error } = require("console");
const nodemailer = require("nodemailer");
// const e = require('connect-flash')

const { DateTime } = require("luxon");
const console = require("console");

//need 2 step verfication for app password, cos google diables the less secure apps in may 2022
let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});
mailTransporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

const errorMessage = (error, message) => {
  return { error, message };
};

const alertMessage = (alert, message) => {
  return { alert, message };
};

const emailValidation = (emailInput) => {
  return true;
  // const mailFomat = "[a-z.]*[@]\sp.edu.sg"
  // if (emailInput.match(mailFomat)) {
  //   console.log("email allowed")
  //   return true
  // }
  // console.log("email disallowed")

  // return false
};
const controller = {
  login: async (req, res) => {
    // return res.send("Route to homepage");
    
    res.redirect(`/assets`);
    //res.redirect("/assets/req.params.userId");
  },
  logout: async (req, res) => {
    try {
      //paspport function, clears session, but not cookie
      //but if session is cleared no more id can be found it wont pop req.user,

      //req.logout();
      res.redirect("/login");
    } catch (err) {
      return res.send("error:", err.message);
    }
  },
  setPassword: async (req, res, next) => {
    //click set, use for reset and activation
    const { password, confirmPassword } = req.body;
    const token = req.query.token; //taken from the form action url
    const userId = req.query.id;
    let errorObj = null;
    let isInvalid = false;
    let user = null;
    try {
      user = await userModel.findOne({
        _id: userId,
      });
      if (password === "" || confirmPassword === "") {
        errorObj = errorMessage(true, "Please fill in the required fields");
        // return res.render("users/setPassword", {
        //   errorObj,
        //   isActivated: true,
        //   isLoginpage: false,
        //   isInvalid: false,
        //   token: req.query.token,
        //   userId: req.query.id,
        // });
      }
      if (password === confirmPassword) {
        const hash = await bcrypt.hash(password, 10);
        await userModel.findOneAndUpdate(
          {
            _id: userId,
          },
          { $set: { password: hash, isActivated: true } },
          { new: true }
        );
        return res.render("users/passwordLinkSent", {
          checkEmail: false,
          isLoginpage: false,
        });
      } else {
        errorObj = errorMessage(true, "Confirm password does not match");
        // return res.render("users/setPassword", {
        //   errorObj,
        //   isActivated: true,
        //   isLoginpage: false,
        //   isInvalid: false,
        //   token: req.query.token,
        //   userId: req.query.id,
        // });
      }
    } catch (err) {
      console.log(err);
      errorObj = errorMessage(true, err);
    }
    return res.render("users/setPassword", {
      errorObj,
      isActivated: true,
      isLoginpage: false,
      isInvalid: false,
      token: req.query.token,
      userId: req.query.id,
    });
  },
  sendResetPasswordLink: async (req, res, next) => {
    //CLICK SEND LINK
    let resetPasswordToken = null;
    let user = null;
    let errorObj = null;
    try {
      if (req.body.email) {
        //check that user exist and is activated already
        user = await userModel.findOne({
          email: req.body.email,
          isActivated: true,
        });
        if (user) {
          const resetPasswordTokenPromise = new Promise((resolve, reject) => {
            crypto.randomBytes(48, function (err, buffer) {
              if (err) {
                return reject(res.json({ err: err.message }));
              }
              return resolve(buffer.toString("hex"));
            });
          });
          resetPasswordTokenPromise
            .then(async (value) => {
              console.log("---->", value, typeof value);
              resetPasswordToken = value;
              let token = await tokenModel.findOne({ userId: user._id });
              if (token) {
                await token.deleteOne();
              }
              const hash = await bcrypt.hash(resetPasswordToken, 10);
              await tokenModel.create({ userId: user._id, token: hash });
              // const token = jwt.sign(
              //   {
              //     data: userData,
              //   },
              //   resetPasswordSecret,
              //   { expiresIn: "20s" }
              // );
              const mailDetails = {
                from: process.env.AUTH_EMAIL,
                to: req.body.email,
                subject: "Reset Password link",
                html: `<p>Please click on the given link to reset your password</p>
                <a href = ${process.env.CLIENT_URL}/reset-password/?token=${resetPasswordToken}&id=${user._id}>${process.env.CLIENT_URL}/reset-password</a>`,
              };

              mailTransporter.sendMail(mailDetails, function (err, data) {
                console.log("send email");
                return res.render("users/passwordLinkSent", {
                  checkEmail: true,
                  email: user.email,
                  isLoginpage: false,
                });
              });
            })
            .catch((err) => {
              console.error(err);
              errorObj = errorMessage(true, err.message);
              return res.render("users/resetPassword", {
                isLoginpage: false,
                errorObj,
              });
            });
        } else {
          errorObj = errorMessage(true, "Email has not been activated ");
          return res.render("users/resetPassword", {
            isLoginpage: false,
            isActivated: true,
            errorObj,
          });
        }
      } else {
        errorObj = errorMessage(true, "Please fill in email address ");
        return res.render("users/resetPassword", {
          isLoginpage: false,
          errorObj,
        });
      }
    } catch (err) {
      console.log(err);
      errorObj = errorMessage(true, err.message);
      return res.render("users/resetPassword", {
        isLoginpage: false,
        errorObj,
      });
    }
  },
  //show routes
  showSetPassword: async (req, res, next) => {
    //click the email link,
    const token = req.query.token; //taken from the form action url
    const userId = req.query.id;
    let isInvalid = false;
    let errorObj = null;
    let user = null;
    user = await userModel.findOne({
      _id: userId,
    });
    //if set is a reset pw, is already activated
    //check that the reset token is valid,
    //means the person that send the email link is the person setting the pw
    if (user.isActivated) {
      //check if user has a reset token,
      const passwordResetToken = await tokenModel.findOne({ userId });
      if (!passwordResetToken) {
        errorObj = errorMessage(
          true,
          "This link has expired, click forget password to reset"
        );
        isInvalid = true;
        // return res.render("users/setPassword", {
        //   isLoginpage: false,
        //   errorObj,
        //   isInvalid: true,
        // });
      }
      const isValid = await bcrypt.compare(token, passwordResetToken.token);
      if (!isValid) {
        errorObj = errorMessage(
          true,
          "This link has expired, click forget password to reset"
        );
        isInvalid = true;
        // return res.render("users/setPassword", {
        //   isLoginpage: false,
        //   errorObj,
        //   isInvalid: true,
        // });
      }
    }
    res.render("users/setPassword", {
      isInvalid: false,
      errorObj: false,
      isActivated: true,
      isLoginpage: false,
      token: req.query.token,
      userId: req.query.id,
    });
  },
  showActivateAndSetPassword: async (req, res) => {
    //click the set pw email link for activation
    errorObj = errorMessage(false, "");
    let tokenVerified = false;
    let token = null;
    let isInvalid = false;
    console.log(req.query.token);
    console.log(req.query.id);
    let secret = null;
    try {
      token = req.query.token;
      userId = req.query.id;
      if (token) {
        const verified = jwt.verify(token, process.env.JWT_ACC_ACTIVATE);
        if (verified) {
          tokenVerified = true;
        } else {
          errorObj = errorMessage(true, "Invalid token or expired link");
          isInvalid = true;
          // return res
          //   .status(401)
          //   .send({ error: "Invalid token or expired link" });
        }
      }
    } catch (err) {
      console.log(err);
      errorObj = errorMessage(true, "Link has Expired");
      isInvalid = true;
      // return res.status(401).send({ error: 'Link has Expired'});
    }
    res.render("users/setPassword", {
      isInvalid,
      errorObj,
      isActivated: false,
      isLoginpage: false,
      token,
      userId,
    });
  },
  showlogin: async (req, res, next) => {
    if (req.session.flash) {
      console.log("----->", req.session.flash.error[0]);
      let message = req.session.flash.error[0];
      req.session.flash.error = [];
      res.render("users/login", {
        isLoginpage: false,
        error: true,
        message,
      });
    } else {
      res.render("users/login", {
        isLoginpage: false,
        error: false,
      });
    }
  },
  showProfile: async (req, res) => {
    let accounts = [];
    let uploads = [];
    let isSuccess = (false, "");
    let profile = "";
    let errorObj = errorMessage(false, "");
    let user = null;
    console.log("------>", req.body.email);
    console.log("---->", req.body.confirmPassword);
    const { password, confirmPassword, email } = req.body;
    try {
      if (email) {
        if (confirmPassword) {
          console.log("--->", "save pw");
          if (password === "" || confirmPassword === "") {
            profile = "edit";
            errorObj = errorMessage(true, "Please fill in the required fields");
          }
          if (password === confirmPassword) {
            console.log("pw same")
            const hash = await bcrypt.hash(password, 10);
            await userModel.findOneAndUpdate(
              {
                _id: req.params.user_id,
              },
              { $set: { password: hash } },
              { new: true }
            );
            isSuccess = alertMessage(true, "Password Reset Sucessfully");
          }else{
            errorObj = errorMessage(true,"Confirm password does not match" )
            profile = "edit";
            console.log("click save");
          }
        } else {
          profile = "edit";
          console.log("click change pw");
        }
      }

      user = await userModel.findById({ _id: req.params.user_id });
      if (!user) {
        return res.status(401).send({ error: "no such user" });
      }
      console.log(isSuccess.alert);
    } catch (err) {
      console.log(err);
      errorObj = errorMessage(true, err.message )
      // return res.status(401).send({ error: "Failed to get users" });
      //res.redirect("/login");
    }

    res.render("users/dashboard", {
      isLoginpage: true,
      isSuccess,
      uploads,
      accounts,
      errorObj,
      profile,
      user,
      showProfile: true,
      showUploads: false,
      showDownloads: false,
      showEnrollment: false,
    });
  },
  getUser: async(input)=>{
    let user = null
    user = await userModel.findById({ _id: input });
    if (!user) {
      return res.status(401).send({ error: "no such user" });
    }else{
      return user._id
    }
  },
  showEnrollment: async (req, res) => {
    let accounts = [];
    let uploads = [];
    let profile = "";
    let isSuccess = alertMessage(false, "");
    let errorObj = errorMessage(false, "");
    //console.log('-->', req.errorObj)
    // req.errorObj? errorObj = errorMessage(false, "") : errorObj =  req.errorObj

    let user = [];
    try {
      user = await userModel.findById({ _id: req.params.user_id });
      if (!user) {
        errorObj = errorMessage(true, "no such user");
        // return res.status(401).send({ error: 'no such user' })
      }
      //find all accts
      accounts = await userModel.find();
      // admins = await userModel.find({ isAdmin: true });

      //console.log(user)
      console.log("Get the accounts");
    } catch (err) {
      console.log(err);
      errorObj = errorMessage(true, "Failed to get users");
      //return res.status(401).send({ error: 'Failed to get users' })
      //res.redirect("/login");
    }

    return res.render("users/dashboard", {
      isLoginpage: true,
      isSuccess: req.isSuccess || isSuccess,
      uploads,
      accounts,
      errorObj: req.errorObj || errorObj,
      profile,
      user,
      showProfile: false,
      showUploads: false,
      showDownloads: false,
      showEnrollment: true,
    });
  },
  showDownloads: async (req, res, next) => {
    let accounts = [];
    let uploads = [];
    let profile = "";
    // let isSuccess = alertMessage(false, "");
    // let errorObj = errorMessage(false, "")
    console.log("-->", req.errorObj);
    // req.errorObj? errorObj = errorMessage(false, "") : errorObj =  req.errorObj

    let user = [];
    try {
      user = await userModel.findById({ _id: req.params.user_id });
      if (!user) {
        return res.status(401).send({ error: "no such user" });
      }
      //find all accts
      accounts = await userModel.find();
      // admins = await userModel.find({ isAdmin: true });

      console.log(user);
      console.log("Get the accounts");
    } catch (err) {
      console.log(err);
      //return res.status(401).send({ error: "Failed to get users" });
      //res.redirect("/login");
    }
    // req.errorObj.errorObj
    // req.isSuccess = isSuccess
    // return next()
    res.render("users/dashboard", {
      isLoginpage: true,
      isSuccess: req.isSuccess || alertMessage(false, ""),
      uploads,
      accounts,
      errorObj: req.errorObj || errorMessage(false, ""),
      profile,
      user,
      showProfile: false,
      showUploads: false,
      showDownloads: true,
      showEnrollment: false,
    });
  },
  showUploads: async (req, res, next) => {
    let profile = "";
    let accounts = [];
    let uploads = [];
    console.log("-->", req.errorObj);
    let user = [];
    try {
      uploads = await modelModel.find({owner:req.session.passport.user._id});
    } catch (err) {
      console.log(err);
      req.errorObj = errorMessage(true, err)
    }
    res.render("users/dashboard", {
      isLoginpage: true,
      isSuccess: req.isSuccess || alertMessage(false, ""),
      uploads,
      uploads,
      accounts,
      errorObj: req.errorObj || errorMessage(false, ""),
      profile,
      user : req.session.passport.user,
      showProfile: false,
      showUploads: true,
      showDownloads: false,
      showEnrollment: false,
    });
  },
  showForgotPassword: async (req, res, next) => {
    //click forget pw,
    let errorObj = errorMessage(false, "");
    res.render("users/resetPassword", {
      isLoginpage: false,
      errorObj,
    });
  },
  // deleteEnrollment: async (req, res) => {
  //   try{
  //     students = await userModel.findOneAndDelete({email: req.params.email})
  //     console.log("Acct deleted")
  //   }
  //   catch(err){
  //     return res.status(401).send({error: "Failed to delete users"})
  //     //res.redirect("/login");
  //   }
  // },

  //create routes
  createEnrollment: async (req, res, next) => {
    //click add account
    let students = [];
    let isSuccess = alertMessage(false, " ");
    let errorObj = errorMessage(false, " ");
    let uploads = [];
    let profile = ""
    let user = null;
    let adminUser = null;
    let isAdmin = null;
    let accounts = [];
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
        errorObj = errorMessage(true, error.message);
        return false;
      }
    };
    try {
      console.log("---->", req.body);
      user = await userModel.findById({ _id: req.params.user_id });
      if (!user) {
        errorObj = errorMessage(false, "Unauthorized account");
      }
      //find all accts
      accounts = await userModel.find();
      // admins = await userModel.find({ isAdmin: true });

      console.log(user);
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
              errorObj = errorMessage(
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
                errorObj = errorMessage(
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
          errorObj = errorMessage(
            true,
            "You have entered an invalid email address!"
          );
        }
      } else {
        errorObj = errorMessage(true, "Please fill in required fields");
        //return res.status(401).send({ error: "Failed to create users" });
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
        errorObj = errorMessage(true, err.message);
      }
    }
    return res.render("users/dashboard", {
      isLoginpage: true,
      isSuccess: req.isSuccess || isSuccess,
      uploads,
      accounts,
      errorObj: req.errorObj || errorObj,
      profile,
      user,
      showProfile: false,
      showUploads: false,
      showDownloads: false,
      showEnrollment: true,
    });
  },
  emailActivation: async (req, res, next) => {
    let isSuccess = alertMessage(false, " ");
    let errorObj = errorMessage(false, " ");
    try {
      console.log("transporter, is created above, sendMail");
      // send mail with defined transport object
      let mailDetails = {
        from: process.env.AUTH_EMAIL,
        to: req.addedUser.email,
        subject: "Account Activation link",
        html: `<p>Thanks for registering with Immersive Asset Library! Please click on the given link to set your password and activate your account</p>
              <a href = ${process.env.CLIENT_URL}/authentication/activate?token=${req.token}&id=${req.addedUser._id}>${process.env.CLIENT_URL}/authentication/activate</a>
              <p>This link will expire in 24 hours. If your link has expired, please get your admin to register your account again.</p>
              <p>Regards,</p>
              <p>The IXTC team</p>`,
      };

      let result = await mailTransporter.sendMail(mailDetails);
      console.log(result);
      if (result.accepted.length > 0) {
        isSuccess = alertMessage(
          true,
          "An email with activation instructions has been sent to the account."
        );
      } else {
        errorObj = (true, "Email account has been rejected");
      }
    } catch (error) {
      errorObj = (true, error.message);

      console.log(error);
    }
    req.isSuccess = isSuccess;
    req.errorObj = errorObj;
    return next();
    console.log("---->", isSuccess);
    //res.redirect(`/${req.params.user_id}/dashboard/enrollment`)
    // return res.render("users/dashboard", {
    //   isLoginpage: true,
    //   errorObj,
    //   isSuccess,
    //   accounts: req.accounts,
    //   user: req.user,
    //   showProfile: false,
    //   showUploads: false,
    //   showDownloads: false,
    //   showEnrollment: true,
    // });
  },
  deleteEnrollment: async (req, res, next) => {
    let user = [];
    console.log("delete enrollment");
    let isSuccess = alertMessage(false, " ");
    let errorObj = errorMessage(false, " ");
    try {
      await userModel.deleteOne({ _id: req.params.acct_id });
      // user = await userModel.findById({ _id: req.params.user_id });
      // if (!user) {
      //   return res.status(401).send({ error: "no such user" });
      // }
      // //find all accts
      // accounts = await userModel.find();
      // // admins = await userModel.find({ isAdmin: true });

      // console.log(req.params.acct_id );
      // console.log("Get the accounts");
      isSuccess = alertMessage(true, "Account successfully deleted");
    } catch (error) {
      errorObj = errorMessage(true, error.message);
    }
    req.isSuccess = isSuccess;
    req.errorObj = errorObj;
    return next();
    res.redirect(`/${req.params.user_id}/dashboard/enrollment`);
    // return res.render("users/dashboard", {
    //   isLoginpage: true,
    //   errorObj,
    //   isSuccess,
    //   accounts,
    //   user: req.user,
    //   showProfile: false,
    //   showUploads: false,
    //   showDownloads: false,
    //   showEnrollment: true,
    // });
  },
  deleteUpload: async (req, res, next) => {
    //get the id of the selecetd upload
    //dont delet eth upload, but siable view of upload
  },
  editUpload: async (req, res, next) => {
    //got to edit page
  },
  // createEnrollment: async (req, res) => {
  //   req.body.isAdmin === "Admin" ? (isAdmin = true) : (isAdmin = false);
  //   userModel.register(
  //     new userModel({
  //       ...req.body,
  //     })
  //   ),
  //     console.log("Email has been sent, kindly activate your account");
  //   //send email to user
  // },
  upload: async (req, res, next) => {
    try {
    } catch (err) {}
  },

  download: async (req, res, next) => {
    try {
    } catch (err) {}
  },
};

module.exports = controller;
