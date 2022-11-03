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
  }, {
    name: 'other',
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


module.exports.uploadHandler = upload;
module.exports.closeTmpFolder = closeTmpFolder;
module.exports.uploadtmp3D = uploadtmp3D;
module.exports.uploadtmp360 = uploadtmp360;
module.exports.uploadtmpscript = uploadtmpscript;
