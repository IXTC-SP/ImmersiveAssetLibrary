const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const modelSchema = new mongoose.Schema({
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    uploadedby: {
      type: String,
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
    }
   },
);
const Model = mongoose.model('Model', modelSchema);

module.exports = Model
