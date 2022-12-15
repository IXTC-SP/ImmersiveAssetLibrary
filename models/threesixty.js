const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const threeSixtySchema = new mongoose.Schema({
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    owner: {
      type: mongoose.Types.ObjectId,
    },
    downloadcount: {
      type: Number,
      default: 0
    },
    tags:{
      type: [String]
    },
    assetPath: {
      type: mongoose.Schema.Types.Mixed,
    },
    atrribute: {
      type: mongoose.Schema.Types.Mixed,
    },
    uploaddate: {
      type: Date,
      default: () => Date.now()
    },
    filesize: {
      type: String
    },
    format: {
      type: String
    }
   }
);
const ThreeSixty = mongoose.model('ThreeSixty', threeSixtySchema);

module.exports = ThreeSixty;
