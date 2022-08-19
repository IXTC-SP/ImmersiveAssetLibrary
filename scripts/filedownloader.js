var AdmZip = require("adm-zip");
const tmp = require('tmp');
const fs = require('fs');
const path = require('path');

// extension should include the dot, for example '.html'
function changeExtension(file, extension) {
  const basename = path.basename(file, path.extname(file))
  return path.join(path.dirname(file), basename + extension)
}


const CreateZipArchive = async (assetname, assetfolderpath, callback) => {

  var tmpfile = tmp.fileSync();
  console.log('File: ', tmpfile.name);
  console.log('Filedescriptor: ', tmpfile.fd);
  var exportpath = changeExtension(tmpfile.name, ".zip");
  console.log(exportpath);

  const zip = new AdmZip();
  const outputFile = assetname + ".zip";
  zip.addLocalFolder(assetfolderpath);
  // zip.writeZip(outputFile);
  var buffer = zip.toBuffer();

  fs.writeFile(exportpath, buffer, "binary", function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
        callback(exportpath);
    }
  });
  // If we don't need the file anymore we could manually call the removeCallback
  // But that is not necessary if we didn't pass the keep option because the library
  // will clean after itself.
  // tmpobj.removeCallback();
}

module.exports.CreateZipArchive = CreateZipArchive;


// var directory = __dirname.split("\scripts")[0];
// console.log(directory);
// var samplefilepath = directory + "/uploads/deadpool/model";
// console.log(samplefilepath);
// CreateZipArchive("deadpool", samplefilepath);
