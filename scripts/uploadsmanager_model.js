const path = require('path');
const fs = require('fs')
multer = require('multer');

// var storagepath = './uploads/tmp/';
const uploadstorage  = multer.diskStorage({
  destination: (req, file, cb) => { // setting destination of uploading files
    storagepath = `./uploads/tmp/${req.user._id}/${req.session.id}/`
    fs.mkdirSync(storagepath, {
      recursive: true
    })
    cb(null, storagepath);
  },
  filename: (req, file, cb) => { // naming file
    cb(null, file.originalname)  
  }
});
var upload = multer({
  storage: uploadstorage
});

function closeTmpFolder(userId) {
  var storagepath = './uploads/tmp/' + userId + '/'
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
    //move temp files into new folder
    for (const file of files) {
      var oldPath = './uploads/tmp/' + file
      filesizetotal += getFilesizeInBytes(oldPath);//still
    }
    console.log('move complete');

    try {
      if (fs.existsSync('./uploads/tmp/model.gltf')) {
        //file exists
        var oldPath = './uploads/tmp/model.gltf'
        filesizetotal += getFilesizeInBytes(oldPath);
      }
    } catch(err) {
      console.error(err)
    }

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

const changepath = function changepath(oldpath,newpath){
  fs.rename(oldpath, newpath, function(err) {
  if (err) {
  } else {
  }
});
}


module.exports.uploadHandler = upload;
module.exports.publish = publishfile;
module.exports.changepath = changepath;
module.exports.closeTmpFolder = closeTmpFolder;
module.exports.uploadtmp3D = uploadtmp3D;
module.exports.upload3D = upload3D;
