const fs = require("fs");
const modeldb = require("../models/model");
const fastFolderSize = require("fast-folder-size");
const awsMethod = require("../middlewares/aws_methods");

class AssetPath {
  folderpath = "";
  gltfmodelpath = "";
  thumbnail = "";
}

class Attribute {
  lowpoly = false;
  animated = false;
  rigged = false;
  textured = false;
}

const Save = async function (req, res, callback) {
  //create list with all files required to save
  let body = JSON.parse(req.body.data);

  let attribute = new Attribute();
  attribute.lowpoly = body.lowpoly;
  attribute.rigged = body.rigged;
  attribute.animated = body.animated;
  attribute.textured = body.textured;

  let assetpath = new AssetPath();
  //get size from tmp folder straight
  assetpath.folderpath = `./uploads/tmp/`;
  assetpath.gltfmodelpath = "model.gltf";
  assetpath.thumbnail = req.files.newthumbnail[0].originalname;
  let modelOutFolderSize = null;
  if (fs.existsSync(`./uploads/tmp/` + req.session.id + "/model_out")) {
    fastFolderSize(`./uploads/tmp/` + req.session.id + "/model_out", (err, bytes) => {
      if (err) {
        throw err;
      } else {
        modelOutFolderSize = bytes;
      }
    });
  } else {
    modelOutFolderSize = 2;
  }
  fastFolderSize(`./uploads/tmp/` + req.session.id, (err, bytes) => {0
    if (err) {
      throw err;
    }
    var foldersize =
      (
        Math.round(((bytes - modelOutFolderSize) / (1024 * 1024)) * 10) / 10
      ).toString() + "mb";
    var model = new modeldb({
      title: body.title,
      description: body.description,
      owner: req.session.passport.user._id,
      tags: body.tags,
      assetPath: assetpath,
      atrribute: attribute,
      filesize: foldersize,
      format: body.format.toLowerCase(),
    });
    model.save(function (err, obj) {
      if (err) return console.log(err);
      else {
        changePath(obj._id, assetpath);
        callback(obj._id.toString());
      }
    });
  });
};
module.exports.save = Save;

const updateToAwsPaths = async function (doc, uploadedDataToAws, cb){
  let newFolderPath =  uploadedDataToAws[uploadedDataToAws.length-1].folderPath;
  var newThumbnailPath = await awsMethod.reloadThumbnailUrl(doc._id,'new_thumbnail.png');

  const result = await modeldb.findOneAndUpdate(
    { _id: doc._id },
    { $set: { "assetPath.folderpath": newFolderPath, "assetPath.thumbnail": newThumbnailPath } },
    { new: true }
  );
  cb(doc._id.toString());
};

module.exports.updateToAwsPaths = updateToAwsPaths;

async function changePath(objid, newassetpath) {
  await modeldb.updateOne(
    { _id: objid },
    {
      assetPath: newassetpath,
    }
  );
}

const GetModel = (id, callback) => {
  modeldb.findOne(
    {
      _id: id,
    },
    (err, result) => {
      if (err) console.log(err);
      else {
        callback(result);
      }
    }
  );
};
module.exports.GetModel = GetModel;

const GetAllModels = (callback) => {
  var arr = [];
  modeldb.find({}, (err, result) => {
    if (err) console.log(err);
    else {
      arr = result;
    }
    callback(arr);
  });
};
module.exports.GetAllModels = GetAllModels;

function FindModelsByTags(tags) {
  modeldb.find(
    {
      tags: tags,
    },
    (err, result) => {
    }
  );
}

const SearchBar = async (searchterm, callback) => {
  let searchArr = searchterm.split(" ");
  modeldb
    .aggregate([
      { $addFields: { title_arr: { $split: ["$title", " "] } } },
      {
        $match: {
          $or: [
            { title_arr: { $in: [...searchArr] } },
            { tags: { $in: [...searchArr] } },
          ],
        },
      },
    ])
    .collation({ locale: "en", strength: 2 })
    .then(function (results) {
      callback(results);
    });
};
module.exports.SearchBar = SearchBar;

const FindModelById = (id, callback) => {
  modeldb.findOne(
    {
      _id: id,
    },
    (err, result) => {
      if (err) console.log(err);
      else {
        callback(result);
      }
    }
  );
};
module.exports.FindModelById = FindModelById;

const FindByAttribute = async (results, attributes) => {
  let newResults = [];
  newResults = results.filter((item) => {
    let allAttrSelected = true;
    if (typeof attributes === "string") {
      item.atrribute[attributes] ? null : (allAttrSelected = false);
    } else {
      Object.values(attributes).forEach((attr) => {
        item.atrribute[attr] ? null : (allAttrSelected = false);
      });
    }
    if (allAttrSelected) {
      return item;
    }
  });
  return await newResults;
};
module.exports.FindByAttribute = FindByAttribute;

const FindByFormat = async (results, format) => {
  let newResults = [];
  newResults = results.filter((item) => {
    if (item.format === format) {
      return item;
    }
  });
  return await newResults;
};

module.exports.FindByFormat = FindByFormat;

const UpdateThumbnailUrl = function() {
  modeldb.find({}, (err,results)=> {
    results.forEach(async (result,index)=> {
      //original path is called 'new_thumbnail.png'
      var newThumbnailPath = await awsMethod.reloadThumbnailUrl(
        result._id,
        "new_thumbnail.png"
      );
      modeldb.findByIdAndUpdate(
        result._id,
        { $set: { "assetPath.thumbnail": newThumbnailPath } },
        (result) => {}
      );
    });
  });
}

module.exports.UpdateThumbnailUrl = UpdateThumbnailUrl;

