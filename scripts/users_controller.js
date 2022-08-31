
//const userValidators = require("../validators/users");
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const mongoose = require('mongoose');

//Mongoose
const MONGODB_URI = "mongodb+srv://mongo_admin:WATcb1g6AvJaq4JZ@cluster0.w9bli.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//user account collection
const userSchema = new mongoose.Schema({
  username: {
    type: String
  },
  password: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

const controller = {
    //login
    login: async (req, res) => {
      try{

      }
      catch(err){

      }
    },

    logout: async (req, res) => {
      try{

      }
      catch(err){

      }
    },

    //show routes
    showProfile: async (req, res) => {
        let user = null;
        let showProfile = true;
        let editProfile = false;
        //let saveProfile = false;
        try {
          if (req.body) {
            if(!req.body.credits){//this is the put req, click save button
              user = await userModel.findByIdAndUpdate(
                { _id: req.session.user },
                { $set: { ...req.body } },//set the input from my body
                { new: true }
              )
              req.session.username = user.firstname;
              //editProfile = true
              showProfile = true;
            
            }else{//ths is the post req, click edit button, has credits
              showProfile = false;
              user= req.body;
            }
          } else{
            user = await userModel.findById({ _id: req.session.user });
          }
        } catch (err) {
          console.log(err);
          res.redirect("/login");
          return;
        }
    
        res.render("users/profile", {
          showProfile,
          //editProfile,
          user,
        });
      },
      
      showUploads: async (req, res) => {
        try{

        }
        catch(err){

        }
      },

      showDownloads: async (req, res) => {
        try{

        }
        catch(err){

        }
      },

      showEnrollment: async (req, res) => {
        try{

        }
        catch(err){

        }
      },

      //create routes
      upload: async (req, res) => {
        try{

        }
        catch(err){

        }
      },

      download: async (req, res) => {
        try{

        }
        catch(err){

        }
      },




}

module.exports = controller;