const path = require('path');
const fs = require('fs')
const os = require('os');
multer = require('multer');
// var storage = multer.diskStorage({
//     destination: function (request, file, callback) {
//       console.log(request.body.files);
//       callback(null, './uploads/');
//     },
//     filename: function (request, file, callback) {
//         console.log(file);
//         callback(null, file.originalname)
//     }
// });

var storagepath = './uploads/tmp/';

const uploadstorage = multer.diskStorage({
  destination: (req, file, cb) => { // setting destination of uploading files
    fs.mkdirSync(storagepath, { recursive: true })
    cb(null, storagepath);
  },
  filename: (req, file, cb) => { // naming file
    cb(null, file.originalname);
  }
});
var upload = multer({ storage: uploadstorage });

function closeTmpFolder(){
  fs.rmSync(storagepath, { recursive: true });
}


module.exports.uploadHandler = upload;
module.exports.closeTmpFolder = closeTmpFolder;
