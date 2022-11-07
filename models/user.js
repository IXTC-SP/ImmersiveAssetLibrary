const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    // username: {
    //   type: String,
    //   default:"-"
    // },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    isActivated: {
      type: Boolean,
      default: false
    },
    activatePasswordLink:{
      type: String,
      required: true
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
        default:  new mongoose.Types.ObjectId("630f0acc7fa286ec83e1bcad")///usr sandra
    },
   }, 
   { timestamps: true }
)

// Setting up the passport plugin
// userSchema.plugin(passportLocalMongoose, {usernameField: "email"});

//this creates the user collections
const User = mongoose.model('User', userSchema)

   

module.exports = User
