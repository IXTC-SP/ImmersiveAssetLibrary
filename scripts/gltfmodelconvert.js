const { exec } = require("child_process");
const path = require('path');
const fs = require('fs')


var folderpath = __dirname.split("scripts")[0] + "\\uploads\\00_sample";
var modelfilepath = folderpath + "\\EmergencyLight.FBX";
var gltfpath = folderpath + "\\model.gltf";

convertmodel();
function convertmodel() {
  console.log("converting model");
  const convert = require('fbx2gltf');
  convert(modelfilepath, gltfpath, ['--embed']).then(
    destPath => {
      let oldDirName = folderpath + "/model_out";
      let newDirName = folderpath + "/gltf";
      // rename the directory
      fs.rename(oldDirName, newDirName, (err) => {
          if(err) {
              throw err;
          }
          console.log("Directory renamed successfully.");
      });
      gltfpath = folderpath + "\\gltf\\model.gltf"
      console.log(gltfpath);
      // yay, do what we will with our shiny new GLB file!
      console.log("completed fbx to gltf conversion");
    },
    error => {
      // ack, conversion failed: inspect 'error' for details
    }
  );
}
