const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
        default: " "
    },
   }, 
   { timestamps: true }
)
   
//this creates the user collections
const User = mongoose.model('User', userSchema)

module.exports = User
