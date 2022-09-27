const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    // username: {
    //   type: String,
    //   default:"-"
    // },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
        default:  new mongoose.Types.ObjectId("630f0acc7fa286ec83e1bcad")///usr sandra
    },
   }, 
   { timestamps: true }
)
   
//this creates the user collections
const User = mongoose.model('User', userSchema)

module.exports = User
