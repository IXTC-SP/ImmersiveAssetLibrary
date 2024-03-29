const mongoose = require('mongoose')
const Schema = mongoose.Schema

const sessionsSchema = new Schema({
  _id: {
    type: String,
  },
  expires: {
    type: Date,
  },
  session: {
    type: mongoose.Schema.Types.Mixed,
  },
})

//this creates the user collections
const mySession = mongoose.model("mySession", sessionsSchema);

module.exports = mySession;