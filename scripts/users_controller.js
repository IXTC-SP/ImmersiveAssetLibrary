//const userValidators = require("../validators/users");
require("dotenv").config();
const bcrypt = require("bcrypt");
const userModel = require("../models/user");
const tokenModel = require("../models/token");
// const mailgun = require("mailgun-js");
// const DOMAIN = "sandbox5c0f43edfce94ab7b5552e3de5598fae.mailgun.org";
// const mg = mailgun({ apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN });
const jwt = require("jsonwebtoken");
const jwt_decode = require("jwt-decode");
const crypto = require("crypto");
const { error } = require("console");
const nodemailer = require("nodemailer");

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

const controller = {
  login: async (req, res) => {
    return res.send("Route to homepage");
  },
  logout: async (req, res) => {
    try {
      //paspport function, clears session, but not cookie
      //but if session is cleared no more id can be found it wont pop req.user,

      req.logout();
      res.redirect("/login");
    } catch (err) {
      return res.send("error:", err.message);
    }
  },
  setPassword: async (req, res) => {
    //click set, use for reset and activation also
    const { password, confirmPassword } = req.body;
    const token = req.query.token; //taken from the form action url
    const userId = req.query.id;
    let user = null;
    try {
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
          throw new error("Invalid or expired password link has expired");
        }
        const isValid = await bcrypt.compare(token, passwordResetToken.token);
        if (!isValid) {
          throw new error("Invalid or expired password link has expired");
        }
        //delete the token
        await passwordResetToken.deleteOne();
      }
      //reset token is valid
      //token is valid
      if (password && confirmPassword) {
        const hash = await bcrypt.hash(password, 10);
        await userModel.findOneAndUpdate(
          {
            _id: userId,
          },
          { $set: { password: hash, isActivated: true } },
          { new: true }
        );
      } else {
        return res
          .status(401)
          .send({ error: "Please fill in required fields" });
      }
    } catch (err) {
      console.log(err);
      return res.status(401).send({ error: "Reset link has expired" });
    }
    res.redirect("/login");
  },
  sendResetPasswordLink: async (req, res) => {
    //CLICK SEND LINK
    let resetPasswordToken = null;
    let user = null;
    try {
      if (req.body.email) {
        //check that user exist and is activated already
        user = await userModel.findOne({
          email: req.body.email,
          isActivated: true,
        });
        if (user) {
          // const userData = {
          //   email: req.body.email,
          // };
          //generate new secret key diff frm acct activate secret,
          //so the token will always be diff when you want to reset
          const resetPasswordTokenPromise = new Promise((resolve, reject) => {
            crypto.randomBytes(48, function (err, buffer) {
              if (err) {
                return reject(res.json({ err: err.message }));
              }
              return resolve(buffer.toString("hex"));
            });
          });
          resetPasswordTokenPromise
            .then((value) => {
              console.log("---->", value, typeof value);
              resetPasswordToken = value;
            })
            .catch((err) => {
              return res
              .status(401)
              .send({ error: err });
            })
            .finally(async () => {
              //find in the token model
              //if exists delete it
              //update the token model
              let token = await tokenModel.findOne({ userId: user._id });
              if (token) {
                await token.deleteOne();
              }
              const hash = await bcrypt.hash(resetPasswordToken, 10);
              await tokenModel.create({ userId: user._id, token: hash });
              const mailDetails = {
                from: process.env.AUTH_EMAIL,
                to: req.body.email,
                subject: "Reset Password link",
                html: `<p>Please click on the given link to reset your password</p>
                <a href = ${process.env.CLIENT_URL}/reset-password/?token=${resetPasswordToken}&id=${user._id}>${process.env.CLIENT_URL}/reset-password</a>`,
              };
              mailTransporter.sendMail(mailDetails, function (err, data) {
                console.log("send email")
                if (err) {
                  return res.json({ error: err.message });
                } else {
                  return res.json("Reset Password link been sent, kindly check your email");
                }
            });
          })
        } else {
          return res
            .status(401)
            .send({ error: "Email has not been activated " });
        }
      } else {
        return res.status(401).send({ error: "Please fill in email address " });
      }
    } catch (err) {
      console.log(err);
      return res.status(401).send({ error: err.message });
    }
  },
  //show routes
  showSetPassword: async (req, res) => {
    //click the email link,
    res.render("users/setPassword", {
      isActivated: true,
      isLoginpage: false,
      token: req.query.token,
      userId: req.query.id,
    });
  },
  showActivateAndSetPassword: async (req, res) => {
    //click the set pw email link
    let tokenVerified = false;
    let token = null;
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
          return res
            .status(401)
            .send({ error: "Invalid token or expired link" });
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(401).send({ error: err.message });
    }
    res.render("users/setPassword", {
      isActivated: false,
      isLoginpage: false,
      token,
      userId,
    });
  },
  showlogin: async (req, res) => {
    res.render("users/login", {
      isLoginpage: false,
    });
  },
  // showProfile: async (req, res) => {
  //   let user = null;
  //   let showProfile = true;
  //   let editProfile = false;
  //   let uploads = 0;
  //   console.log(typeof req.params);
  //   try {
  //     if (req.body.username) {
  //       console.log("get edited form");
  //       //if its editing the profile
  //     } else {
  //       console.log("get user");
  //       user = await userModel.findById({ _id: req.params.user_id });
  //       if (!user) {
  //         return res.status(401).send({ error: "no such user" });
  //       }
  //       console.log(user);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     res.redirect("/login");
  //     return;
  //   }

  //   res.render("users/profile", {
  //     isLoginpage: showProfile,
  //     showProfile,
  //     user,
  //     uploads,
  //   });
  // },

  // showUploads: async (req, res) => {
  //   let user = null;
  //   let uploads = [];
  //   try {
  //     //find frm model dbs
  //     // uploads = await modeldbs.find({uploadedby: req.params.user_id  });
  //     console.log("Get the uploads by user from model dbs");
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).send({ error: "Get the uploads by user from model dbs" });
  //     //res.redirect("/login");
  //     return;
  //   }

  //   res.render("users/profile", {
  //     uploads,
  //   });
  // },

  // showDownloads: async (req, res) => {
  //   let user = null;
  //   let downloads = [];
  //   try {
  //     user = await userModel.findById({ _id: req.params.user_id });
  //     //find frm model dbs, those downlaody by user_id
  //     if (!user) {
  //       return res.status(401).send({ error: "no such user" });
  //     }
  //     console.log(user);
  //     //downloads = await modeldbs.find({downloadby: req.params.user_id });
  //     console.log("Get the downloads by user from model dbs");
  //   } catch (err) {
  //     console.log(err);
  //     return res.status(401).send({ error: "no such user" });
  //     //res.redirect("/login");
  //     return;
  //   }

  //   res.render("users/profile", {
  //     downloads,
  //   });
  // },

  showDashboard: async (req, res) => {
    let students = [];
    let admins = [];
    let user = [];
    try {
      user = await userModel.findById({ _id: req.params.user_id });
      if (!user) {
        return res.status(401).send({ error: "no such user" });
      }
      //find all accts
      students = await userModel.find({ isAdmin: false });
      admins = await userModel.find({ isAdmin: true });

      console.log(user);
      console.log("Get the accounts");
      console.log(students);
      console.log(admins);
    } catch (err) {
      console.log(err);
      return res.status(401).send({ error: "Failed to get users" });
      //res.redirect("/login");
    }

    res.render("users/dashboard", {
      isLoginpage: true,
      students,
      admins,
      user,
      showProfile: true,
    });
  },
  showForgotPassword: async (req, res) => {
    //click forget pw,
    res.render("users/resetPassword", {
      isLoginpage: false,
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
    let admins = [];
    let errors = null;
    let user = null;
    let isAdmin = null;
    try {
      //check if email has been created before
      user = await userModel.findOne({ email: req.body.email });
      if (user) {
        console.log(user);
        return res
          .status(401)
          .send({ error: "This email has account already been created" });
        // return res.render("users/enrollment", {
        //   errors: "This email has account already been created",
        // });
      } else {
        //generate the token to pass to the email link
        //store token into DBs to autheticate at set pw that the authorized uses to setting the pw
        const token = jwt.sign(
          {
            data: req.body.email,
          },
          process.env.JWT_ACC_ACTIVATE,
          { expiresIn: "50m" }
        );
        //only created the _id, email, isAdmin field
        req.body.isAdmin === "Admin" ? (isAdmin = true) : (isAdmin = false);
        user = await userModel.create({
          ...req.body,
          isAdmin,
          activatePasswordLink: token,
        });
        req.token = token;
        req.user = user;
        console.log("next is email activation");
        next();
      }
    } catch (err) {
      console.log(err);
      return res.status(401).send({ error: "Failed to create users" });
    }

    // res.render("users/enrollment", {
    //   students,
    //   admins,
    // });
  },
  emailActivation: async (req, res) => {
    try {
      console.log("transporter, is created above, sendMail");

      console.log(req.user.email);
      // send mail with defined transport object
      let mailDetails = {
        from: process.env.AUTH_EMAIL,
        to: req.user.email,
        subject: "Account Activation link",
        html: `<p>Please click on the given link to set your password and activate your account</p>
              <a href = ${process.env.CLIENT_URL}/authentication/activate?token=${req.token}&id=${req.user._id}>${process.env.CLIENT_URL}/authentication/activate</a>`,
      };

      mailTransporter.sendMail(mailDetails, function (err, data) {
        console.log("send email")
        if (err) {
          return res.json({ error: err.message });
        } else {
          return res.json("Email has been sent, kindly activate your account");
        }
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
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
  upload: async (req, res) => {
    try {
    } catch (err) {}
  },

  download: async (req, res) => {
    try {
    } catch (err) {}
  },
};

module.exports = controller;
