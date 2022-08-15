const { exec } = require("child_process");
const path = require('path');
const fs = require('fs')


const Create = (objectfile, callback) => {
  var modelfolderpath = objectfile[0].destination.split("/model")[0];
  var modeltype = objectfile[0].filename.split(".")[1];
  try {
    if (fs.existsSync(modelfolderpath)) {
      //file exists
      console.log("file exist");
    }
  } catch (error) {
    console.error(error)
  }
  var gltfpath = modelfolderpath + "/gltf/model.gltf";
  console.log(gltfpath);
  var runcode = "";
  if (!fs.existsSync(gltfpath)) {
    runcode = "";
    switch (modeltype) {
      case "obj":
        // code block
        runcode = 'obj2gltf -i ';
        // runcode += file;
        runcode += modelfolderpath + ' -o ' + gltfpath;
        exec(runcode, (err, output) => {
          // once the command has completed, the callback function is called
          if (err) {
            // log and return if we encounter an error
            console.error("could not execute command: ", err)
            return
          }
          // log the output received from the command
          console.log("Output: \n", output)
        });
        callback(gltfpath);
        break;
      default:
        // code block
        runcode = 'fbx2gltf -e -i ' + filepath + ' -o ' + gltfpath;
        const convert = require('fbx2gltf');
        convert(modelfolderpath, gltfpath, ['--embed']).then(
          destPath => {
            // yay, do what we will with our shiny new GLB file!
            gltfpath = path.dirname(filepath) + "/" + path.basename(filepath, path.extname(filepath)) + "_out/" + path.basename(filepath, path.extname(filepath)) + ".gltf"
            console.log(gltfpath);
            callback(gltfpath);
          },
          error => {
            // ack, conversion failed: inspect 'error' for details
          }
        );
        break;
    }

  }
}

module.exports.Create = Create;
