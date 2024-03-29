const path = require('path');
const fs = require('fs')
const os = require('os');
multer = require('multer');

var storagepath = './uploads/tmp/';
var uploadcontent;
const uploadstorage = multer.diskStorage({
  destination: (req, file, cb) => { // setting destination of uploading files
    fs.mkdirSync(storagepath, {
      recursive: true
    })
    cb(null, storagepath);
  },
  filename: (req, file, cb) => { // naming file
    cb(null, file.originalname);
  }
});
var upload = multer({
  storage: uploadstorage
});

function closeTmpFolder() {
  if (fs.existsSync(storagepath)) {
    fs.rmSync(storagepath, {
      recursive: true
    });
  }
}

const uploadtmp360 = upload.fields([
  {
    name: 'image',
    maxCount: 6
  }
]);

const upload360 = upload.fields([
  {
    name: 'image',
    maxCount: 6
  }
]);

const publishfile = async function(foldername, files){
  var filesizetotal = 0;
    //create a new folder based on title
    var publishpath = './uploads/' + foldername;
    if (!fs.existsSync(publishpath)){
    fs.mkdirSync(publishpath);
    }
    //move temp files into new folder
    for (const file of files) {
      var oldPath = './uploads/tmp/' + file
      var newPath = publishpath + '/' + file
      fs.renameSync(oldPath, newPath);
      filesizetotal += getFilesizeInBytes(newPath);
    }

    //data required -> folderpath, totalfilesize, publish date,  assettype, ownedby, main asset type, main asset path, download count
    console.log('getting file size ' + filesizetotal);
    // getfilesize(publishpath);

};

function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInMegabytes = stats.size / (1024*1024);
    return fileSizeInMegabytes ;
}

const getAllFiles = function(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
    }
  })

  return arrayOfFiles
}

function setPublishDate(){
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  today = mm + '/' + dd + '/' + yyyy;
  return today
}

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath)
    .map(file => path.join(srcpath, file))
    .filter(path => fs.statSync(path).isDirectory());
}


module.exports.uploadHandler = upload;
module.exports.publish = publishfile;
module.exports.closeTmpFolder = closeTmpFolder;
module.exports.uploadtmp360 = uploadtmp360;
module.exports.upload360 = upload360;
