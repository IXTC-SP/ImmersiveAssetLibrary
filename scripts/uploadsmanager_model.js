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

const uploadtmp3D = upload.fields([
  {
    name: 'model',
    maxCount: 1
  },
  {
    name: 'thumbnail',
    maxCount: 1
  },
  {
    name: 'image',
    maxCount: 10
  }
]);
const upload3D = upload.fields([
  {
    name: 'file',
    maxCount: 10
  },
  {
    name: 'newthumbnail',
    maxCount:1
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
    console.log('move complete');

    try {
      if (fs.existsSync('./uploads/tmp/model.gltf')) {
        //file exists
        var oldPath = './uploads/tmp/model.gltf'
        var newPath = (publishpath + '/model.gltf');
        fs.renameSync(oldPath, newPath);
        console.log('add gltf folder');
        filesizetotal += getFilesizeInBytes(newPath);
      }
    } catch(err) {
      console.error(err)
    }

    //data required -> folderpath, totalfilesize, publish date,  assettype, ownedby, main asset type, main asset path, download count
    console.log('getting file size ' + filesizetotal);
    // getfilesize(publishpath);
    closeTmpFolder();

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


function getDirectories(srcpath) {
  return fs.readdirSync(srcpath)
    .map(file => path.join(srcpath, file))
    .filter(path => fs.statSync(path).isDirectory());
}


module.exports.uploadHandler = upload;
module.exports.publish = publishfile;
module.exports.closeTmpFolder = closeTmpFolder;
module.exports.uploadtmp3D = uploadtmp3D;
module.exports.upload3D = upload3D;