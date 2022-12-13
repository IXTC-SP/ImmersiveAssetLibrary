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
  assetpath.folderpath = './uploads/' + body.folderpath.replaceAll(' ', '_');
  assetpath.gltfmodelpath = body.gltfmodelpath.replace('tmp', body.folderpath);
  assetpath.diffuse = body.diffusepath;
  assetpath.emission = body.emissivepath;
  assetpath.thumbnail = body.thumbnail == '' ? req.files.newthumbnail[0].originalname.replace('tmp', body.folderpath) : body.thumbnail;

  fastFolderSize(assetpath.folderpath, (err, bytes) => {
    if (err) {
      throw err
    }
    var foldersize = (Math.round((bytes / (1024 * 1024)) * 10) / 10).toString() + 'mb';
    var model = new modeldb({
      title: body.title,
      description: body.description,
      owner: req.session.passport.user._id,
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
    //console.log(arr)
    callback(arr);
  });
}
module.exports.GetAllModels = GetAllModels;

function FindModelsByTags(tags) {
  modeldb.find({
    tags: tags
  }, (err, result) => {
    //console.log(result);
  });
}

const SearchBar = (searchterm, callback) => {
  var arr = [];
  const searchTermLowerCase = searchterm.toLowerCase()
  console.log('start mongoose search');
  modeldb.find({
    title: searchTermLowerCase
  }).then(function(nameresult) {
    arr.push(nameresult);
    console.log('finish search name', nameresult);
    modeldb.find({
      tags: searchTermLowerCase
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



const FindByFilter = (results, attributes) => {
  filteredResult = results.filter((item) => {
    let allAttrSelected = true;
    if (typeof attributes === "string") {
      item.atrribute[attributes]
        ? null
        : (allAttrSelected = false);
    } else {
      Object.values(attributes).forEach((attr) => {
        item.atrribute[attr] ? null : (allAttrSelected = false);
      });
    }
    if (allAttrSelected) {
      return item;
    }
  })
  return filteredResult
}
module.exports.FindByFilter = FindByFilter;

const FindByFormat =  async (results, format) => {
  results = await results.filter(async (item) => {
    let isSameFormat = true;
    if (item.format === format)
      if (isSameFormat) {
        return item;
      }
  });
  return results
}
module.exports.FindByFormat = FindByFormat;


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
