
//const userValidators = require("../validators/users");
const userModel = require("../models/user")

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
        console.log(typeof req.params)
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
            user = await userModel.findById({ _id: req.params.user_id  });
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