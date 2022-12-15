const fs = require('fs')
const threesixtydb = require('../models/threesixty');
const fastFolderSize = require('fast-folder-size')

class AssetPath {
  folderpath = "";
  equirectangular = "";
  cubemap = {
    front: "",
    right: "",
    back: "",
    left: "",
    top: "",
    bottom: ""
  }
}

//either cubemap or equirectangular
class Attribute {
  type = 'default';
}

const Save = async function(req, res, files) {
  //create list with all files required to save
  let body = JSON.parse(req.body.data);

  let attribute = new Attribute();
  attribute.type = body.type;

  let assetpath = new AssetPath();
  assetpath.folderpath = './uploads/' + body.title.replaceAll(' ', '_');
  if(attribute.type == 'cubemap'){
    assetpath.cubemap.front = body.files[0];
    assetpath.cubemap.right = body.files[1];
    assetpath.cubemap.back = body.files[2];
    assetpath.cubemap.left = body.files[3];
    assetpath.cubemap.top = body.files[4];
    assetpath.cubemap.bottom = body.files[5];
  } else {
    assetpath.equirectangular = body.files[0];
  }

  console.log(assetpath.folderpath);
  fastFolderSize(assetpath.folderpath, (err, bytes) => {
    if (err) {
      throw err
    }
    var foldersize = (Math.round((bytes / (1024 * 1024)) * 10) / 10).toString() + 'mb';
    var asset = new threesixtydb({
      title: body.title,
      description: body.description,
      owner: req.session.passport.user._id,
      tags: body.tags,
      assetPath: assetpath,
      atrribute: attribute,
      filesize: foldersize
    });

    asset.save(function(err) {
      if (err) return console.log(err);
    });
  });

}

module.exports.save = Save;

const GetModel = (id, callback) => {
  threesixtydb.findOne({
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
  threesixtydb.find({}, (err, result) => {
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
  threesixtydb.find({
    tags: tags
  }, (err, result) => {
    console.log(result);
  });
}

const FindByFormat = async (results, format) => {
  let newResults = []
 
  newResults = results.filter((item) => {
    console.log(item.atrribute.type, format)
    if (item.atrribute.type === format) {
      console.log("items");
      return item;
    }
  });
  console.log("2");
  return await newResults;
};


module.exports.FindByFormat = FindByFormat;

const SearchBar = (searchterm, callback) => {
  var arr = [];
  console.log('start mongoose search');
  threesixtydb.find({
    title: searchterm
  }).then(function(nameresult) {
    arr.push(nameresult);
    console.log('finish search name', nameresult);
    threesixtydb.find({
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
  threesixtydb.findOne({
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
  threesixtydb.find({}, function(err, docs) {
    docs.forEach(async doc => {
      let size = await getFolderSize(doc.assetPath.folderpath);
      console.log(size);
      await threesixtydb.updateOne(doc, { filesize: size });
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
