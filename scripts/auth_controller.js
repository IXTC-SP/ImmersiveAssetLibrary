require("dotenv").config();
const bcrypt = require("bcrypt");
const userModel = require("../models/user");
const tokenModel = require("../models/token");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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

const errorMessage = (error, message) => {
  return { error, message };
};

const alertMessage = (alert, message) => {
  return { alert, message };
};

const controller = {
  login: async (req, res) => {
    try {
      res.redirect(`/assets/models`);
    } catch (error) {
      res.redirect(`/login`);
    }
  
  },
  setPassword: async (req, res, next) => {
    //click set, use for reset and activation
    const { password, confirmPassword } = req.body;
    const token = req.query.token; //taken from the form action url
    const userId = req.query.id;
    let errorObj = errorMessage(false, " ");
    let isInvalid = false;
    let user = null;
    try {
      user = await userModel.findOne({
        _id: userId,
      });
      if (password === "" || confirmPassword === "") {
        errorObj = errorMessage(true, "Please fill in the required fields");
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
    let errorObj = errorMessage(false, " ");
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
              resetPasswordToken = value;
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
                console.log("send email");
                return res.render("users/passwordLinkSent", {
                  checkEmail: true,
                  email: user.email,
                  isLoginpage: false,
                });
              });
            })
        } else {
          errorObj = errorMessage(true, "Check that this account has been enrolled and activated.");
        }
      } else {
        errorObj = errorMessage(true, "Please fill in email address ");
      }
    } catch (err) {
      errorObj = errorMessage(true, err.message);
    }
    return res.render("users/resetPassword", {
        isLoginpage: false,
        errorObj,
      });
  },
  //show routes
  showSetPassword: async (req, res, next) => {
    //click the email link,
    const token = req.query.token; //taken from the form action url
    const userId = req.query.id;
    let isInvalid = false;
    let errorObj = errorMessage(false, " ");
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
          errorObj = errorMessage(
            true,
            "This link has expired, click forget password to reset"
          );
          isInvalid = true;
        }
        const isValid = await bcrypt.compare(token, passwordResetToken.token);
        if (!isValid) {
          errorObj = errorMessage(
            true,
            "This link has expired, click forget password to reset"
          );
          isInvalid = true;
        }
      }
    } catch (error) {
        console.log(error)
        errorObj = errorMessage(
            true,
            error
          );
    }

    res.render("users/setPassword", {
      isInvalid: false,
      errorObj: false,
      isActivated: true,
      isLoginpage: false,
      token: req.query.token,
      userId,
    });
  },
  showActivateAndSetPassword: async (req, res) => {
    //click the set pw email link for activation
    let errorObj = errorMessage(false, " ");
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
        }
      }
    } catch (err) {
      console.log(err);
      errorObj = errorMessage(true, "Link has Expired");
      isInvalid = true;
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
    let errorObj = errorMessage(false, " ");
    if (req.session.flash) {
      console.log("----->", req.session.flash.error[0]);
      errorObj = errorMessage(true, req.session.flash.error[0])

    }
    res.render("users/login", {
        isLoginpage: false,
        errorObj
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
        html: `<p>Thanks for registering with Immersive Asset Library! Please click on the given link to set your password and activate your account.</p>
              <a href = ${process.env.CLIENT_URL}/authentication/activate?token=${req.token}&id=${req.addedUser._id}>${process.env.CLIENT_URL}/authentication/activate</a>
              <p>This link will expire in 24 hours. If your link has expired, please get your admin to enroll your account again.</p>
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
  },
};

module.exports = controller;
