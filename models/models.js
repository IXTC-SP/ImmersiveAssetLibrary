const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const modelSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    uploadedby: {
      type: String,
      required: true
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
      required: true
    },
    atrribute: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
   },
);

//this creates the user collections
const Model = mongoose.model('Model', modelSchema)

class AssetPath {
  folderpath = "";
  gltfmodelpath = "";
  diffuse = "";
  emission = "";
  thumbnail = "";
}

class Attribute {
  lowpoly = False;
  animated = False;
  rigged = False;
  textured = False;
}

class Model {
  title = "";
  description = "";
  assetPath = new AssetPath();
  attribute = new Attribute();
  tags = [];
  user = "";
}

let currentModel;

const Create = function (title, description, paths, attributes, user, tags){
  var assetpath = new AssetPath();
  assetpath.gltfmodelpath = paths['gltfmodelpath'];
  assetpath.folderpath = paths['folderpath'];
  assetpath.diffuse = paths['diffuse'];
  assetpath.emission = paths['emission'];
  assetpath.thumbnail = paths['thumbnail'];

  var attribute = new Attribute();
  attribute.lowpoly = attributes['lowpoly'];
  attribute.animated = attributes['animated'];
  attribute.rigged = attributes['rigged'];
  attribute.textured = attributes['textured'];

  currentModel = new Model();
  currentModel.title = title;
  currentModel.description = description;
  currentModel.assetPath = assetpath;
  currentModel.attribute = attribute;
  currentModel.tags = tags;
  currentModel.user = "";
}
module.exports.Create = Create;


const Save = function(){
  if(createdModel){
    var model = new Model({
      name:   currentModel.title,
      description: currentModel.description,
      uploadedby : currentModel.user,
      tags: currentModel.tags,
      assetPath: currentModel.assetPath,
      attribute: currentModel.attribute,
    });
    model.save();
  }
}
module.exports.Save = Save;
