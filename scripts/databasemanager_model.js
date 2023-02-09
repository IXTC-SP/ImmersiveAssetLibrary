const fs = require("fs");
const modeldb = require("../models/model");
const fastFolderSize = require("fast-folder-size");
<<<<<<< HEAD
const fastFolderSizeSync = require("fast-folder-size/sync");
=======
const fastFolderSizeSync = require('fast-folder-size/sync')
const awsMethod = require("../middlewares/aws_methods");
>>>>>>> 15cdaed1e543bbd75c0f3f3b3ef544afebc6a6f2

class AssetPath {
  folderpath = "";
  gltfmodelpath = "";
  // diffuse = "";
  // emission = "";
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
  assetpath.folderpath = "./uploads/tmp";
  assetpath.gltfmodelpath = "model.gltf";
  assetpath.thumbnail = req.files.newthumbnail[0].originalname;
  console.log(assetpath.folderpath, "before fast folder size");
  console.log(body.format);
  let modelOutFolderSize = null;
  if (fs.existsSync("./uploads/tmp/model_out")) {
    fastFolderSize(`${assetpath.folderpath}/model_out`, (err, bytes) => {
      if (err) {
        console.log("fast folder fail");
        throw err;
      } else {
        modelOutFolderSize = bytes;
      }
    });
  } else {
    modelOutFolderSize = 2;
  }
  fastFolderSize(assetpath.folderpath, (err, bytes) => {
    if (err) {
      console.log("fast folder fail");
      throw err;
    }
    console.log(modelOutFolderSize);
    console.log(typeof body.tags[0]);
    console.log(bytes);
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
      format: body.format,
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
  console.log(result);
  cb(doc._id.toString());
  console.log("updated");
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
    //console.log(arr)
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
      //console.log(result);
    }
  );
}

// const SearchBar = (searchterm, callback) => {
//   var arr = [];
//   let searchArr = searchterm.toLowerCase().split(" ")
//   console.log(searchArr)
//   //const searchTermLowerCase = searchterm.toLowerCase();
//   console.log("start mongoose search");
//   modeldb
//     .find({
//       title:{$in:[...searchArr]}
//     })
//     .then(function (nameresult) {
//       arr.push(nameresult);
//       console.log("finish search name", nameresult);
//       modeldb
//         .find({
//           tags: {$in:[...searchArr]},
//         })
//         .then(function (tagresult) {
//            //arr.push(tagresult);
//           //arr = [...new Set(tagresult)];
//           arr = [...tagresult,...nameresult];
//           console.log("finish search tag", tagresult);
//           console.log("arr--->",arr)
//           callback(arr);
//         });
//     });
// };
const SearchBar = async (searchterm, callback) => {
  //var arr = [];
  let searchArr = searchterm.split(" ");
  console.log(searchArr);
  console.log("start mongoose search");
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
      console.log("finish search name", results);
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
      console.log("items");
      return item;
    }
  });
  console.log("2");
  return await newResults;
};

module.exports.FindByFormat = FindByFormat;

//FUNCTIONS ------- for development stage ---------
function updateallsize() {
  modeldb.find({}, function (err, docs) {
    docs.forEach(async (doc) => {
      let size = await getFolderSize(doc.assetPath.folderpath);
      console.log(size);
      await modeldb.updateOne(doc, { filesize: size });
    });
  });
}

//manually assign userid to modelDB
const AssignUserToModel = function (userid, modelid) {};

//search through model db and check if model asset path is valid.
// if Invalid, remove model from modelDB.
// If model asset path is not found in modelDB, return them as a list
const ReconstructModelDB = function () {};

const SetupSampleDB = function () {};


const UpdateThumbnailUrl = function() {
  console.log('loaded');
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
  // setInterval(function(){
  //   UpdateThumbnailUrl();
  // }, 1000*60*10)
}

module.exports.UpdateThumbnailUrl = UpdateThumbnailUrl;

// UpdateThumbnailUrl();


// UpdateThumbnailUrlOnInterval();
