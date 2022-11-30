const fs = require('fs')
const modeldb = require('../models/model');
const fastFolderSize = require('fast-folder-size')

class AssetPath {
  folderpath = "";
  gltfmodelpath = "";
  diffuse = "";
  emission = "";
  thumbnail = "";
}

class Attribute {
  lowpoly = false;
  animated = false;
  rigged = false;
  textured = false;
}

const Save = async function(req, res, files) {
  //create list with all files required to save
  let body = JSON.parse(req.body.data);

  let attribute = new Attribute();
  attribute.lowpoly = body.lowpoly;
  attribute.rigged = body.rigged;
  attribute.animated = body.animated;
  attribute.textured = body.textured;

  let assetpath = new AssetPath();
  assetpath.folderpath = './uploads/' + body.folderpath;
  assetpath.gltfmodelpath = body.gltfmodelpath.replace('tmp', body.folderpath);
  assetpath.diffuse = body.diffusepath;
  assetpath.emission = body.emissivepath;
  assetpath.thumbnail = body.thumbnail;

  // console.log(assetpath.gltfmodelpath);
  // let foldersize = await fastFolderSize(assetpath.folderpath);
  // console.log(foldersize);

  fastFolderSize(assetpath.folderpath, (err, bytes) => {
    if (err) {
      throw err
    }
    var foldersize = (Math.round((bytes / (1024 * 1024)) * 10) / 10).toString() + 'mb';
    var model = new modeldb({
      title: body.title,
      description: body.description,
      uploadedby: "sample_user",
      tags: body.tags,
      assetPath: assetpath,
      atrribute: attribute,
      filesize: foldersize
    });

    model.save(function(err) {
      if (err) return console.log(err);
    });
  });



}


function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInMegabytes = stats.size / (1024*1024);
    return fileSizeInMegabytes ;
}

async function getFolderSize(path) {
  return await new Promise((resolve, reject) => {
    fastFolderSize(path, (err, bytes) => {
      if (err) {
        throw err
      }
      var result = (Math.round((bytes / (1024 * 1024)) * 10) / 10).toString() + 'mb';
      resolve(result);
      return result;
    })
  });
}




module.exports.save = Save;

const GetModel = (id, callback) => {
  modeldb.findOne({
    _id: id
  }, (err, result) => {
    if (err) console.log(err);
    else {
      callback(result);
    }
  });
}
module.exports.GetModel = GetModel;

const GetAllModels = (callback) => {
  var arr = [];
  modeldb.find({}, (err, result) => {
    if (err) console.log(err);
    else {
      arr = result;
    }
    console.log(arr)
    callback(arr);
  });
}
module.exports.GetAllModels = GetAllModels;

function FindModelsByTags(tags) {
  modeldb.find({
    tags: tags
  }, (err, result) => {
    console.log(result);
  });
}

const SearchBar = (searchterm, callback) => {
  var arr = [];
  console.log('start mongoose search');
  modeldb.find({
    title: searchterm
  }).then(function(nameresult) {
    arr.push(nameresult);
    console.log('finish search name', nameresult);
    modeldb.find({
      tags: searchterm
    }).then(function(tagresult) {
      // arr.push(tagresult);
      arr = [...new Set(tagresult)]
      console.log('finish search tag', tagresult);
      callback(arr);
    });
  });
}
module.exports.SearchBar = SearchBar;


const FindModelById = (id, callback) => {
  modeldb.findOne({
    _id: id
  }, (err, result) => {
    if (err) console.log(err);
    else {
      callback(result);
    }
  });
}
module.exports.FindModelById = FindModelById;


//FUNCTIONS ------- for development stage ---------
function updateallsize() {
  modeldb.find({}, function(err, docs) {
    docs.forEach(async doc => {
      let size = await getFolderSize(doc.assetPath.folderpath);
      console.log(size);
      await modeldb.updateOne(doc, { filesize: size });
    });
  });
}

//manually assign userid to modelDB
const AssignUserToModel = function(userid, modelid) {

}

//search through model db and check if model asset path is valid.
// if Invalid, remove model from modelDB.
// If model asset path is not found in modelDB, return them as a list
const ReconstructModelDB = function() {

}

const SetupSampleDB = function() {

}