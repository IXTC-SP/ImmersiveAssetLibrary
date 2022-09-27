//const userValidators = require("../validators/users");
const userModel = require("../models/user");

const controller = {
  //login
  login: async (req, res) => {
    try {
    } catch (err) {}
  },

  logout: async (req, res) => {
    try {
    } catch (err) {}
  },

  //show routes
  showlogin: async (req, res) => {
    res.render("users/login", {
      isLoginpage: false,
    });
  },

  showProfile: async (req, res) => {
    let user = null;
    let showProfile = true;
    let editProfile = false;
    let uploads = 0;
    console.log(typeof req.params);
    try {
      if (req.body.username) {
        console.log("get edited form");
        //if its editing the profile
      } else {
        console.log("get user");
        user = await userModel.findById({ _id: req.params.user_id });
        if (!user) {
          return res.status(401).send({ error: "no such user" });
        }
        console.log(user);
      }
    } catch (err) {
      console.log(err);
      res.redirect("/login");
      return;
    }

    res.render("users/profile", {
      showProfile,
      user,
      uploads,
    });
  },

  showUploads: async (req, res) => {
    let user = null;
    let uploads = [];
    try {
      //find frm model dbs
      // uploads = await modeldbs.find({uploadedby: req.params.user_id  });
      console.log("Get the uploads by user from model dbs");
    } catch (err) {
      console.log(err);
      res.status(500).send({ error: "Get the uploads by user from model dbs" });
      //res.redirect("/login");
      return;
    }

    res.render("users/profile", {
      uploads,
    });
  },

  showDownloads: async (req, res) => {
    let user = null;
    let downloads = [];
    try {
      user = await userModel.findById({ _id: req.params.user_id });
      //find frm model dbs, those downlaody by user_id
      if (!user) {
        return res.status(401).send({ error: "no such user" });
      }
      console.log(user);
      //downloads = await modeldbs.find({downloadby: req.params.user_id });
      console.log("Get the downloads by user from model dbs");
    } catch (err) {
      console.log(err);
      return res.status(401).send({ error: "no such user" });
      //res.redirect("/login");
      return;
    }

    res.render("users/profile", {
      downloads,
    });
  },

  showEnrollment: async (req, res) => {
    let students = [];
    let admins = [];
    try {
      //find all accts
      students = await userModel.find({ isAdmin: false });
      admins = await userModel.find({ isAdmin: true });
      console.log("Get the accounts");
      console.log(students);
      console.log(admins);
    } catch (err) {
      console.log(err);
      return res.status(401).send({ error: "Failed to get users" });
      //res.redirect("/login");
    }

    res.render("users/dashboard/enrollment", {
      isLoginpage : true,
      students,
      admins,
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
  createEnrollment: async (req, res) => {
    let students = [];
    let admins = [];
    let errors = null;
    let user = null;
    try {
      //check if email has been created before
      user = await userModel.findOne({ email: req.body.email });
      console.log(user);
      if (user) {
        console.log(user);
        console.log("This email has account already been created");
        return res.render("users/enrollment", {
          errors: "This email has account already been created",
        });
      } else {
        await userModel.create({ ...req.body });
        console.log("Acct created");
      }
    } catch (err) {
      console.log(err);
      return res.status(401).send({ error: "Failed to create users" });
      //res.redirect("/login");
    }

    res.render("users/enrollment", {
      students,
      admins,
    });
  },

  //create routes
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
