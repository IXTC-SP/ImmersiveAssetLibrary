const { exec } = require("child_process");
const path = require('path');
const fs = require('fs')


const Create = (objectfile, callback) => {
  var modelfolderpath = path.resolve(objectfile.destination);
  // var modelfolderpath = path.resolve(objectfile.destination.split("/model")[0]);
  var modeltype = objectfile.filename.split(".")[1];
  var modelfilepath = path.resolve(objectfile.destination + "\\" + objectfile.originalname);
  var gltfpath = modelfolderpath + "\\model.gltf";
  // var gltfpath = modelfolderpath + "\\" + "gltf" + "\\" + "model.gltf";

  try {
    if (fs.existsSync(modelfolderpath)) {
      //file exists
      console.log("file exist");
    }
  } catch (error) {
    console.error(error)
  }
  if (!fs.existsSync(gltfpath)) {
    switch (modeltype) {
      case "obj":
        // code block
        console.log("running obj conversion");
        var runcode = 'obj2gltf -i ';
        // runcode += file;
        runcode += modelfilepath + ' -o ' + gltfpath;
        exec(runcode, (err, output) => {
          // once the command has completed, the callback function is called
          if (err) {
            // log and return if we encounter an error
            console.error("could not execute command: ", err)
            return
          }
          // log the output received from the command
          console.log("Output: \n", output)

          callback(gltfpath);
        });
        // gltfpath = modelfolderpath + "\\model.gltf"

        break;
        case "fbx":
        // code block
        // runcode = 'fbx2gltf -e -i ' + modelfilepath + ' -o ' + gltfpath;
        const convert = require('fbx2gltf');
        convert(modelfilepath, gltfpath, ['--embed']).then(
          destPath => {
            let oldDirName = modelfolderpath + "/model_out/model.gltf";
            let newDirName = modelfolderpath + "/model.gltf";
            // rename the directory
            fs.rename(oldDirName, newDirName, (err) => {
                if(err) {
                    throw err;
                }
                console.log("Directory renamed successfully.");
            });
            gltfpath = modelfolderpath + "\\model.gltf"
            console.log(gltfpath);
            // yay, do what we will with our shiny new GLB file!
            console.log("completed fbx to gltf conversion");
            callback(gltfpath);
          },
          error => {
            // ack, conversion failed: inspect 'error' for details
          }
        );
        break;
        default:
          callback('');
        break;
    }

  }
}
module.exports.Create = Create;

const ClearMaterialFromModel = (gltfmodelpath, callback) => {
  console.log(gltfmodelpath);
  let path =  gltfmodelpath.replace('model.gltf','');
  let rawdata = fs.readFileSync(gltfmodelpath);
  let jsonfile = JSON.parse(rawdata);
  if(jsonfile.images){
    jsonfile.images.forEach((image,i)=>{
      console.log(image.uri);
      let imagepath = path + image.uri;
      var imageexist = fs.existsSync(imagepath);
      if(!imageexist){
        console.log(imagepath + " does not exist");
        jsonfile.textures.forEach((texture,t)=>{
          if(texture.source == i){
            console.log(texture + ' has source from image ' + i);
            jsonfile.materials.forEach((material,m)=>{
              if(material.pbrMetallicRoughness['baseColorTexture']){
                if(material.pbrMetallicRoughness['baseColorTexture']['index'] == t){
                  console.log(material + ' has source from texture ' + t);
                  delete material.pbrMetallicRoughness['baseColorTexture'];
                }
              }
            });
            // jsonfile.textures.splice(t,1);
            delete jsonfile.textures[t]
          }
        })
        // jsonfile.images.splice(i,1);
        delete jsonfile.images[i]
      }
    })
  }

  //console.log(jsonfile);
  let data = JSON.stringify(jsonfile);
  fs.writeFile(gltfmodelpath, data, (err)=>{
    if (err)
    console.log(err);
  else {
    callback('');
  }
  });
  // delete jsonfile['images'];
  // delete jsonfile['textures'];
  // jsonfile.materials.forEach((item,index)=> {
  //   delete item.pbrMetallicRoughness['baseColorTexture'];
  // })
  // // let readfile = JSON.parse(jsonfile);
  // console.log(jsonfile);
  // let data = JSON.stringify(jsonfile);
  // fs.writeFile(gltfmodelpath, data, (err)=>{
  //   if (err)
  //   console.log(err);
  // else {
  //   callback('');
  // }
  // });
}
module.exports.ClearMaterialFromModel = ClearMaterialFromModel;
