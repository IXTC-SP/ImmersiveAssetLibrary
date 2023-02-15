const path = require('path');
const fs = require('fs')
const os = require('os');
multer = require('multer');

// var storagepath = './uploads/tmp/';
const uploadstorage = multer.diskStorage({


  destination: (req, file, cb) => { // setting destination of uploading files
    var storagepath = './uploads/tmp/' + req.session.id + '/';
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

function closeTmpFolder(sessionid) {
  var storagepath = './uploads/tmp/' + sessionid + '/'
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
  },
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

    try {
      if (fs.existsSync('./uploads/tmp/new_thumbnail.png')) {
        //file exists
        var oldPath = './uploads/tmp/new_thumbnail.png'
        var newPath = (publishpath + '/new_thumbnail.png');
        fs.renameSync(oldPath, newPath);
      }
    } catch(err) {
    }
};

const changepath = function changepath(oldpath,newpath){
  fs.rename(oldpath, newpath, function(err) {
  if (err) {
  } else {
  }
});
}

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

module.exports.uploadHandler = upload;
module.exports.publish = publishfile;
module.exports.changepath = changepath;
module.exports.closeTmpFolder = closeTmpFolder;
module.exports.uploadtmp360 = uploadtmp360;
module.exports.upload360 = upload360;
