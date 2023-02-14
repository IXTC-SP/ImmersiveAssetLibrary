const mongoose = require('mongoose');
require('dotenv').config()
//Mongoose
//const MONGODB_URI = "mongodb+srv://mongo_admin:WATcb1g6AvJaq4JZ@cluster0.w9bli.mongodb.net/?retryWrites=true&w=majority";
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}.trfz1qc.mongodb.net/`;
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.MONGO_DB
});

//3D model collection
const modelSchema = new mongoose.Schema({
  name: String,
  description: String,
  paths: mongoose.Schema.Types.Mixed,
  lowpoly: Boolean,
  animated: Boolean,
  rigged: Boolean,
  uploadedby: String,
  downloadcount: Number,
  downloadby: [String],
  tags: [String]
})
// const Model = mongoose.model('Model', modelSchema);

class ModelPaths {
  folderpath = "";
  modelfilepath = "";
  modelviewerfilepath = "";
  diffuse = "";
  normal = "";
  roughness = "";
  occlusion = "";
  emission = "";
  thumbnail = "";

  setPath(texturetype, filepath){
    switch(texturetype){
      case "folderpath":
        this.folderpath = filepath;
        break;
      case "modelfilepath":
        this.modelfilepath = filepath;
        break;
      case "modelviewerfilepath":
        this.modelviewerfilepath = filepath;
        break;
      case "diffuse":
        this.diffuse = filepath;
        break;
      case "normal":
        this.normal = filepath;
        break;
      case "roughness":
        this.roughness = filepath;
        break;
      case "occlusion":
        this.occlusion = filepath;
        break;
      case "emission":
        this.emission = filepath;
        break;
      case "thumbnail":
        this.thumbnail = filepath;
        break;
    }
  }
}

class ModelAsset {
  downloadcount = 0;
  downloadedby = [];
  modelpaths = new ModelPaths();
  tags = [];
  constructor(name, description, folderpath, modelfilepath, modelviewerfilepath, lowpoly, animated, textured, rigged, uploadedby) {
    this.name = name;
    this.description = description;
    this.modelpaths.setPath("folderpath", folderpath);
    this.modelpaths.setPath("modelfilepath", modelfilepath);
    this.modelpaths.setPath("modelviewerfilepath", modelviewerfilepath);
    this.lowpoly = lowpoly;
    this.animated = animated;
    this.textured = textured;
    this.rigged = rigged;
    this.uploadedby = uploadedby;
  }

  addTags(tags){
    this.tags = tags;
  }

  addDownloadUser(user){
    this.downloadedby.push(user);
  }

  saveModel(){
    var model = new Model({
      name:   this.name,
      description: this.description,
      paths: this.modelpaths,
      lowpoly: this.lowpoly,
      animated: this.animated,
      rigged: this.rigged,
      textured: this.textured,
      uploadedby: this.uploadedby,
      downloadcount: this.downloadcount,
      downloadby: this.downloadedby,
      tags: this.tags
    });
    model.save();
  }
}


function FindModelByName(name){
  Model.findOne({name: name}, (err,result)=> {
    console.log(result.paths.diffuse);
  });
}

const GetModel = (id,callback) =>{
  Model.findOne({_id: id}, (err,result)=>{
    if(err) console.log(err);
    else {
      callback(result);
    }
  });
}
module.exports.GetModel = GetModel;

const GetAllModels = (callback) =>{
  var arr = [];
  Model.find({}, (err,result)=>{
    if(err) console.log(err);
    else {
      arr = result;
    }
    console.log(arr)
    callback(arr);
  });
}
module.exports.GetAllModels = GetAllModels;

function FindModelsByTags(tags){
  Model.find({tags: tags}, (err,result)=> {
    console.log(result);
  });
}

const SearchBar = (searchterm, callback) => {
  var arr = [];
  console.log('start mongoose search');
  Model.find({name: searchterm}).then(function(nameresult){
    arr.push(nameresult);
    console.log('finish search name', nameresult);
    Model.find({tags: searchterm}).then(function(tagresult){
      // arr.push(tagresult);
      arr = [...new Set(tagresult)]
      console.log('finish search tag', tagresult);
      callback(arr);
    });
  });
}
module.exports.SearchBar = SearchBar;


 const FindModelById = (id, callback) =>{
  Model.findOne({ _id: id}, (err,result)=> {
    if(err) console.log(err);
    else {
      callback(result);
    }
  });
}
module.exports.FindModelById = FindModelById;

const SaveModel = function(name, description, folderpath, modelfilepath,
  modelviewerfilepath, lowpoly, animated, textured,rigged, uploadedby,tags){
  var model = new ModelAsset(name, description, folderpath, modelfilepath,
  modelviewerfilepath, lowpoly, animated, textured, rigged, uploadedby);
  model.modelpaths.setPath("thumbnail", "/uploads/cyberpunk/thumbnail.png");
  model.addTags(tags);
  console.log(model);
  model.saveModel();
}
module.exports.SaveModel = SaveModel;


function Run(){
  var apple_watch = new ModelAsset("apple_watch", "apple watch model", "/uploads/apple_watch", "/uploads/apple_watch/model/apple_watch.blend",
  "/uploads/apple_watch/gltf/scene.gltf", true, false, false, "upload by me");
  apple_watch.modelpaths.setPath("diffuse", "/uploads/apple_watch/gltf/baseColor.png");
  apple_watch.modelpaths.setPath("thumbnail", "/uploads/apple_watch/thumbnail.png");
  apple_watch.addTags(['apple', 'ios', 'watch']);
  console.log(apple_watch);
  apple_watch.saveModel();

  var cyberpunk = new ModelAsset("cyberpunk", "cyberpunk model", "/uploads/cyberpunk", "/uploads/cyberpunk/model/cyberpunk_obj.obj",
  "/uploads/cyberpunk/gltf/scene.gltf", true, false, false, "upload by me");
  cyberpunk.modelpaths.setPath("diffuse", "/uploads/cyberpunk/gltf/textures/Mat_0_baseColor.png");
  cyberpunk.modelpaths.setPath("emission", "/uploads/cyberpunk/gltf/textures/Mat_0_emissive.png");
  cyberpunk.modelpaths.setPath("normal", "/uploads/cyberpunk/gltf/textures/Mat_0_normal.png");
  cyberpunk.modelpaths.setPath("roughness", "/uploads/cyberpunk/gltf/textures/Mat_0_metallicRoughness.png");
  cyberpunk.modelpaths.setPath("thumbnail", "/uploads/cyberpunk/thumbnail.png");
  cyberpunk.addTags(['cyberpunk', 'shiba', 'dog', 'robot']);
  console.log(cyberpunk);
  cyberpunk.saveModel();

  var deadpool = new ModelAsset("deadpool", "deadpool model", "/uploads/deadpool", "/uploads/deadpool/model/deadpool_obj.obj",
  "/uploads/deadpool/gltf/scene.gltf", true, false, false, "upload by me");
  deadpool.modelpaths.setPath("diffuse", "/uploads/deadpool/gltf/textures/body_baseColor.png");
  deadpool.modelpaths.setPath("emission", "/uploads/deadpool/gltf/textures/body_emissive.png");
  deadpool.modelpaths.setPath("normal", "/uploads/deadpool/gltf/textures/body_normal.png");
  deadpool.modelpaths.setPath("roughness", "/uploads/deadpool/gltf/textures/body_metallicRoughness.png");
  deadpool.modelpaths.setPath("thumbnail", "/uploads/deadpool/thumbnail.png");
  deadpool.addTags(['deadpool', 'shiba', 'dog', 'red']);
  console.log(deadpool);
  deadpool.saveModel();

  var harrypotter = new ModelAsset("harry_potter", "harry potter model", "/uploads/harry_potter", "/uploads/harry_potter/model/harry_potter_fbx.fbx",
  "/uploads/harry_potter/gltf/scene.gltf", true, false, false, "upload by me");
  harrypotter.modelpaths.setPath("diffuse", "/uploads/harry_potter/gltf/textures/Shiba_baseColor.png");
  harrypotter.modelpaths.setPath("normal", "/uploads/harry_potter/gltf/textures/Shiba_normal.png");
  harrypotter.modelpaths.setPath("roughness", "/uploads/harry_potter/gltf/textures/Shiba_metallicRoughness.png");
  harrypotter.modelpaths.setPath("thumbnail", "/uploads/harrypotter/thumbnail.png");
  harrypotter.addTags(['harrypotter', 'shiba', 'dog', 'wizard']);
  console.log(harrypotter);
  harrypotter.saveModel();

  var painter = new ModelAsset("painter", "painter model", "/uploads/painter", "/uploads/painter/painter_fbx.fbx",
  "/uploads/painter/gltf/scene.gltf", true, false, false, "upload by me");
  painter.modelpaths.setPath("diffuse", "/uploads/painter/gltf/textures/Scene_-_Root_baseColor.png");
  painter.modelpaths.setPath("normal", "/uploads/painter/gltf/textures/Scene_-_Root_normal.png");
  painter.modelpaths.setPath("roughness", "/uploads/painter/gltf/textures/Scene_-_Root_metallicRoughness.png");
  painter.modelpaths.setPath("thumbnail", "/uploads/painter/thumbnail.png");
  painter.addTags(['painter', 'shiba', 'dog', 'art']);
  console.log(painter);
  painter.saveModel();


  var robot = new ModelAsset("robot", "robot model", "/uploads/robot", "/uploads/robot/robot_fbx.fbx",
  "/uploads/robot/gltf/scene.gltf", true, false, false, "upload by me");
  robot.modelpaths.setPath("diffuse", "/uploads/robot/gltf/textures/Shiba_baseColor.png");
  robot.modelpaths.setPath("normal", "/uploads/robot/gltf/textures/Shiba_normal.png");
  robot.modelpaths.setPath("roughness", "/uploads/robot/gltf/textures/Shiba_metallicRoughness.png");
  robot.modelpaths.setPath("emission", "/uploads/robot/gltf/textures/Shiba_emissive.png");
  robot.modelpaths.setPath("thumbnail", "/uploads/robot/thumbnail.png");
  robot.addTags(['robot', 'shiba', 'dog', 'metal']);
  console.log(robot);
  robot.saveModel();

  var trailer = new ModelAsset("trailer", "trailer model", "/uploads/trailer", "/uploads/trailer/Alena_Shek.obj",
  "/uploads/trailer/gltf/scene.gltf", true, false, false, "upload by me");
  trailer.modelpaths.setPath("diffuse", "/uploads/trailer/gltf/textures/0208trailer_default_baseColor.png");
  trailer.modelpaths.setPath("emission", "/uploads/trailer/gltf/textures/0208trailer_default_emissive.png");
  trailer.modelpaths.setPath("thumbnail", "/uploads/trailer/thumbnail.png");
  trailer.addTags(['trailer', 'transport', 'home']);
  console.log(trailer);
  trailer.saveModel();

  var tree = new ModelAsset("tree", "tree model", "/uploads/tree", "/uploads/tree/tree_fbx.fbx",
  "/uploads/tree/gltf/scene.gltf", true, false, false, "upload by me");
  tree.modelpaths.setPath("diffuse", "/uploads/tree/gltf/textures/m_tree_baseColor.png");
  tree.modelpaths.setPath("thumbnail", "/uploads/tree/thumbnail.png");
  tree.addTags(['tree', 'nature', 'green']);
  console.log(tree);
  tree.saveModel();
}

function ClearDB(){
  Model.deleteMany({}, (err)=>{
    console.log(err);
  });
}


//Update Model Changes//
function UpdateModelFromEditPage(modelid, req, callback){
  var newname = req.body.name;
  var newdescription = req.body.description;
  var newlowpoly = typeof req.body.lowpoly !== 'undefined';
  var newanimated = typeof req.body.animated !== 'undefined';
  var newrigged = typeof req.body.rigged !== 'undefined';

  Model.updateOne({_id: modelid}, {
    name: newname,
    description: newdescription,
    lowpoly: newlowpoly,
    animated: newanimated,
    rigged: newrigged
  }, function (err, doc) {
    if (err){
        console.log(err)
    }
    else{
        console.log("Updated Docs : ", doc);
        callback(modelid);
    }
  });
}
module.exports.UpdateModelFromEditPage = UpdateModelFromEditPage;


async function UpdateModelName(modelid, newname){
  await Model.updateOne({_id: modelid}, { name: newname });
  console.log('completed model name update');
}

async function UpdateModelDescription(modelid, newdescription){
  await Model.updateOne({_id: modelid}, { description: newdescription });
  console.log('completed model description update');
}

async function UpdateModelLowPoly(modelid, newlowpoly){
  await Model.updateOne({_id: modelid}, { lowpoly: newlowpoly });
  console.log('completed model lowpoly update');
}

async function UpdateModelAnimated(modelid, newanimted){
  await Model.updateOne({_id: modelid}, { animated: newanimted });
  console.log('completed model animated update');
}

async function UpdateModelRigged(modelid, newrigged){
  await Model.updateOne({_id: modelid}, { rigged: newrigged });
  console.log('completed model rigged update');
}




// ClearDB();
// FindModelByName("sample model");
// FindModelsByTags('ship');
// Run();
