const fs = require("fs");
const threesixtydb = require("../models/threesixty");
const fastFolderSize = require("fast-folder-size");

class AssetPath {
  folderpath = "";
  equirectangular = "";
  cubemap = {
    front: "",
    right: "",
    back: "",
    left: "",
    top: "",
    bottom: "",
  };
  thumbnail = "";
}

//either cubemap or equirectangular
class Attribute {
  type = "default";
}

const Save = async function (req, res, callback) {
  //create list with all files required to save
  let body = JSON.parse(req.body.data);

  let attribute = new Attribute();
  attribute.type = body.type;

  let assetpath = new AssetPath();
  //assetpath.folderpath = './uploads/' + body.title.replaceAll(' ', '_');
  assetpath.folderpath = "./uploads/tmp";
  if (attribute.type == "cubemap") {
    assetpath.cubemap.front = body.files[0].originalname;
    assetpath.cubemap.right = body.files[1].originalname;
    assetpath.cubemap.back = body.files[2].originalname;
    assetpath.cubemap.left = body.files[3].originalname;
    assetpath.cubemap.top = body.files[4].originalname;
    assetpath.cubemap.bottom = body.files[5].originalname;
  } else {
    assetpath.equirectangular = body.files[0].originalname;
  }
  //assetpath.thumbnail = req.files.newthumbnail[0].originalname.replace('tmp', body.folderpath);
  assetpath.thumbnail = req.files.newthumbnail[0].originalname;
  fastFolderSize(assetpath.folderpath, (err, bytes) => {
    if (err) {
      throw err;
    }
    var foldersize =
      (Math.round((bytes / (1024 * 1024)) * 10) / 10).toString() + "mb";
    var asset = new threesixtydb({
      title: body.title,
      description: body.description,
      owner: req.session.passport.user._id,
      tags: body.tags,
      assetPath: assetpath,
      atrribute: attribute,
      filesize: foldersize,
      format: body.format,
    });

    asset.save(async function (err, obj) {
      if (err) return console.log(err);
      else {
        var newassetpath = assetpath;
        newassetpath.folderpath = "./uploads/" + obj._id.toString();
        changePath(obj._id, newassetpath);
        callback(obj._id.toString());
      }
    });
  });
};

async function changePath(objid, newFolderPath) {
  await threesixtydb.updateOne({ _id: objid }, { assetPath: newFolderPath });
}

module.exports.save = Save;

const updateToAwsPaths = async function (doc, uploadedDataToAws, cb) {
  let newFolderPath =
    uploadedDataToAws[uploadedDataToAws.length - 1].folderPath;
  let attribute = doc.atrribute;

  let assetpath = new AssetPath();
  assetpath.folderpath = newFolderPath;
  if (attribute.type == "cubemap") {
    assetpath.cubemap = doc.assetPath.cubemap;
    // assetpath.cubemap.right = doc.assetPath.cubemap.right
    // assetpath.cubemap.back = doc.assetPath.cubemap.back
    // assetpath.cubemap.left = doc.assetPath.cubemap.left
    // assetpath.cubemap.top = doc.assetPath.cubemap.top
    // assetpath.cubemap.bottom = doc.assetPath.cubemap.bottom
  } else {
    assetpath.equirectangular = doc.assetPath.equirectangular;
  }
  assetpath.thumbnail = doc.assetPath.thumbnail;

  console.log("----> updated path", assetpath);
  const result = await threesixtydb.findOneAndUpdate(
    { _id: doc._id },
    { $set: { "assetPath.folderpath": newFolderPath } },
    { new: true }
  );
  console.log(result)
  //changePath(doc._id, assetpath)

  cb(doc._id.toString());
  console.log("updated");
};

module.exports.updateToAwsPaths = updateToAwsPaths;

const GetModel = (id, callback) => {
  console.log("---->>> getmodel id", id);
  threesixtydb.findOne(
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
  threesixtydb.find({}, (err, result) => {
    if (err) console.log(err);
    else {
      arr = result;
    }
    console.log(arr);
    callback(arr);
  });
};
module.exports.GetAllModels = GetAllModels;

function FindModelsByTags(tags) {
  threesixtydb.find(
    {
      tags: tags,
    },
    (err, result) => {
      console.log(result);
    }
  );
}

const FindByFormat = async (results, format) => {
  let newResults = [];

  newResults = results.filter((item) => {
    console.log(item.atrribute.type, format);
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
  console.log("start mongoose search");
  threesixtydb
    .find({
      title: searchterm,
    })
    .then(function (nameresult) {
      arr.push(nameresult);
      console.log("finish search name", nameresult);
      threesixtydb
        .find({
          tags: searchterm,
        })
        .then(function (tagresult) {
          // arr.push(tagresult);
          arr = [...new Set(tagresult)];
          console.log("finish search tag", tagresult);
          callback(arr);
        });
    });
};
module.exports.SearchBar = SearchBar;

const FindModelById = (id, callback) => {
  console.log("_>>>>>> id", id);
  threesixtydb.findOne(
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

//FUNCTIONS ------- for development stage ---------
function updateallsize() {
  threesixtydb.find({}, function (err, docs) {
    docs.forEach(async (doc) => {
      let size = await getFolderSize(doc.assetPath.folderpath);
      console.log(size);
      await threesixtydb.updateOne(doc, { filesize: size });
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
