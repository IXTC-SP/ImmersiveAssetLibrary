const { exec } = require("child_process");
const path = require('path');
const fs = require('fs')


const Create = (objectfile, callback) => {
  var modelfolderpath = path.resolve(objectfile[0].destination.split("/model")[0]);
  var modeltype = objectfile[0].filename.split(".")[1];
  var modelfilepath = path.resolve(objectfile[0].destination + "\\" + objectfile[0].originalname);
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
        });
        callback(gltfpath);
        break;
        case "fbx":
        // code block
        // runcode = 'fbx2gltf -e -i ' + modelfilepath + ' -o ' + gltfpath;
        const convert = require('fbx2gltf');
        convert(modelfilepath, gltfpath, ['--embed']).then(
          destPath => {
            let oldDirName = modelfolderpath + "/model_out";
            let newDirName = modelfolderpath + "/gltf";
            // rename the directory
            fs.rename(oldDirName, newDirName, (err) => {
                if(err) {
                    throw err;
                }

                console.log("Directory renamed successfully.");
            });
            gltfpath = modelfolderpath + "\\gltf\\model.gltf"
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
    }

  }
}

module.exports.Create = Create;
