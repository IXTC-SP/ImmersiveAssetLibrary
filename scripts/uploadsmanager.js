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
    name: 'diffuse',
    maxCount: 1
  }, {
    name: 'normal',
    maxCount: 1
  }, {
    name: 'occlusion',
    maxCount: 1
  },
  {
    name: 'height',
    maxCount: 1
  }, {
    name: 'emissive',
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
  }
]);
const uploadtmp360 = upload.fields([
  {
    name: 'top',
    maxCount: 1
  }, {
    name: 'front',
    maxCount: 1
  }, {
    name: 'left',
    maxCount: 1
  },
  {
    name: 'right',
    maxCount: 1
  }, {
    name: 'back',
    maxCount: 1
  }, {
    name: 'bottom',
    maxCount: 1
  }
]);
const uploadtmpscript = upload.fields([
  {
  name: 'scripts',
  maxCount: 10
}]);

const publishfile = function(foldername, files){
    //create a new folder based on title
    if (!fs.existsSync('./uploads/' + foldername)){
    fs.mkdirSync('./uploads/' + foldername);
    }
    //move temp files into new folder
    for(i=0;i<files.length;i++){
      var oldPath = './uploads/tmp/' + files[i]
      var newPath = './uploads/' + foldername + '/' + files[i]
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
        console.log('move ' + oldPath + ' to ' + newPath)
      });
    }

    let dir = getDirectories('./uploads/tmp');
    for(i=0;i<dir.length;i++){
      var oldPath = dir[i]
      var newPath = dir[i].replace('tmp', foldername);
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
      });
    }
    //remove rest of tmp files
    // fs.rmSync(storagepath, { recursive: true, force: true });
};

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
module.exports.uploadtmp360 = uploadtmp360;
module.exports.uploadtmpscript = uploadtmpscript;
