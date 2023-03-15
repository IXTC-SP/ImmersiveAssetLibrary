const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const obj2gltf = require("obj2gltf");

const Create = (objectfile, callback) => {
  var modelfolderpath = path.resolve(objectfile.destination);
  var modeltype = objectfile.filename.split(".")[1];
  var modelfilepath = modelfolderpath + "/" + objectfile.originalname;
  var gltfpath = modelfolderpath + "/model.gltf";

  try {
    if (fs.existsSync(modelfolderpath)) {
      //file exists
      console.log("file exist");
    }
  } catch (error) {
    console.error(error);
  }
  switch (modeltype) {
    case "obj":
      // code block
      var objpath = objectfile.destination + "/" + objectfile.originalname;
      var objgltfpath = objectfile.destination + "/model.gltf";
      obj2gltf(objpath).then(function (gltf) {
        const data = Buffer.from(JSON.stringify(gltf));
        fs.writeFileSync(objgltfpath, data);
        callback(gltfpath);
      });

      break;
    case "fbx":
      // code block
      // runcode = 'fbx2gltf -e -i ' + modelfilepath + ' -o ' + gltfpath;
      let convert = require("fbx2gltf");
      convert(modelfilepath, gltfpath, ["--embed"]).then(
        (destPath) => {
          let oldDirName = modelfolderpath + "/model_out/model.gltf";
          let newDirName = modelfolderpath + "/model.gltf";
          // rename the directory
          fs.rename(oldDirName, newDirName, (err) => {
            if (err) {
              throw err;
            }
            // console.log("Directory renamed successfully.");
          });
          // gltfpath = modelfolderpath + "/model.gltf"
          // yay, do what we will with our shiny new GLB file!
          // console.log("completed fbx to gltf conversion");
          callback(gltfpath);
        },
        (error) => {
          // ack, conversion failed: inspect 'error' for details
        }
      );
      break;
    case "FBX":
      // code block
      // runcode = 'fbx2gltf -e -i ' + modelfilepath + ' -o ' + gltfpath;
      let convertFBX = require("fbx2gltf");
      convertFBX(modelfilepath, gltfpath, ["--embed"]).then(
        (destPath) => {
          let oldDirName = modelfolderpath + "/model_out/model.gltf";
          let newDirName = modelfolderpath + "/model.gltf";
          // rename the directory
          fs.rename(oldDirName, newDirName, (err) => {
            if (err) {
              throw err;
            }
            // console.log("Directory renamed successfully.");
          });
          // gltfpath = modelfolderpath + "/model.gltf"
          // yay, do what we will with our shiny new GLB file!
          console.log("completed fbx to gltf conversion");
          callback(gltfpath);
        },
        (error) => {
          // ack, conversion failed: inspect 'error' for details
        }
      );
      break;
    default:
      callback("");
      break;
  }
};
module.exports.Create = Create;

const ClearMaterialFromModel = (gltfmodelpath, callback) => {
  let path = gltfmodelpath.replace("model.gltf", "");
  let rawdata = fs.readFileSync(gltfmodelpath);
  let jsonfile = JSON.parse(rawdata);
  if (jsonfile.images) {
    jsonfile.images.forEach((image, i) => {
      let imagepath = path + image.uri;
      console.log("looking for image", imagepath)
      var imageexist = fs.existsSync(imagepath);
      if (!imageexist) {
        jsonfile.textures.forEach((texture, t) => {
          if (texture.source == i) {
            jsonfile.materials.forEach((material, m) => {
              if(material.normalTexture){
                delete material.normalTexture;
              }
              if(material.emissiveTexture){
                delete material.emissiveTexture;
              }
              if (material.pbrMetallicRoughness["baseColorTexture"]) {
                if (
                  material.pbrMetallicRoughness["baseColorTexture"]["index"] ==
                  t
                ) {
                  delete material.pbrMetallicRoughness["baseColorTexture"];
                }
              }
              if (material.pbrMetallicRoughness.metallicRoughnessTexture) {
                if (
                  material.pbrMetallicRoughness.metallicRoughnessTexture[
                    "index"
                  ] == t
                ) {
                  delete material.pbrMetallicRoughness.metallicRoughnessTexture;
                }
              }
              if (material.occlusionTexture) {
                if (material.occlusionTexture["index"] == t) {
                  delete material.occlusionTexture;
                }
              }
            });
            delete jsonfile.textures[t];
          }
        });
        delete jsonfile.images[i];
      }
    });
    console.log("cleared")

    // jsonfile.images = jsonfile.images.filter(item => item !== null && item !== undefined);
    // jsonfile.textures = jsonfile.textures.filter(item => item !== null && item !== undefined);

  }

  let data = JSON.stringify(jsonfile);
  fs.writeFile(gltfmodelpath, data, (err) => {
    if (err) console.log(err);
    else {
      
      callback("");
    }
  });
};
module.exports.ClearMaterialFromModel = ClearMaterialFromModel;



