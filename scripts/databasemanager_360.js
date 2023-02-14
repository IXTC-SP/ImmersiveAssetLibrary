const fs = require("fs");
const threesixtydb = require("../models/threesixty");
const fastFolderSize = require("fast-folder-size");
const awsMethod = require("../middlewares/aws_methods");

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
        changePath(obj._id, assetpath);
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
  var newThumbnailPath = await awsMethod.reloadThumbnailUrl(doc._id,'new_thumbnail.png');
  const result = await threesixtydb.findOneAndUpdate(
    { _id: doc._id },
    { $set: { "assetPath.folderpath": newFolderPath , "assetPath.thumbnail": newThumbnailPath } },
    { new: true }
  );
  cb(doc._id.toString());
};

module.exports.updateToAwsPaths = updateToAwsPaths;

const GetModel = (id, callback) => {
  threesixtydb.findOne(
    {
      _id: id,
    },
    (err, result) => {
      callback(result);
    }
  );
};
module.exports.GetModel = GetModel;

const GetAllModels = (callback) => {
  var arr = [];
  threesixtydb.find({}, (err, result) => {
    if (!err) arr = result;
    callback(arr);
  });
};
module.exports.GetAllModels = GetAllModels;

function FindModelsByTags(tags) {
  threesixtydb.find(
    {
      tags: tags,
    },
  );
}

const FindByFormat = async (results, format) => {
  let newResults = [];

  newResults = results.filter((item) => {
    if (item.atrribute.type === format) {
      return item;
    }
  });
  return await newResults;
};

module.exports.FindByFormat = FindByFormat;

const SearchBar = (searchterm, callback) => {
  let searchArr = searchterm.split(" ");
  threesixtydb
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
  threesixtydb.findOne(
    {
      _id: id,
    },
    (err, result) => {
      callback(result);
    }
  );
};
module.exports.FindModelById = FindModelById;

const UpdateThumbnailUrl = function() {
  threesixtydb.find({}, (err,results)=> {
    results.forEach(async (result,index)=> {
      //original path is called 'new_thumbnail.png'
      var newThumbnailPath = await awsMethod.reloadThumbnailUrl(
        result._id,
        "new_thumbnail.png"
      );
      threesixtydb.findByIdAndUpdate(
        result._id,
        { $set: { "assetPath.thumbnail": newThumbnailPath } },
        (result) => {}
      );
    });
  });
}

module.exports.UpdateThumbnailUrl = UpdateThumbnailUrl;

