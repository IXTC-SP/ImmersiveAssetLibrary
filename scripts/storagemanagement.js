const multer = require('multer');
const fs = require('fs');


//Multer - for interpreting multipart forms to get model file
const uploadstorage = multer.diskStorage({
  destination: (req, file, cb) => { // setting destination of uploading files
    storagepath = './uploads/' + req.body.name + '/model';
    fs.mkdirSync(storagepath, { recursive: true })
    cb(null, storagepath)
  },
  filename: (req, file, cb) => { // naming file
    cb(null, file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "objectfile") { // if uploading resume
    let format = file.originalname.split('.')[1]
    console.log(format);
    if (
      format === 'obj' ||
      format === 'fbx'
    ) { // check file type to be obj or fbx
      cb(null, true);
    } else {
      console.log('objectfile type is wrong');
      cb(null, false); // else fails
    }
  } else { // else uploading image
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) { // check file type to be png, jpeg, or jpg
      cb(null, true);
    } else {
      cb(null, false); // else fails
    }
  }
};
const upload = multer({
  storage: uploadstorage,
  fileFilter: fileFilter
});

module.exports.uploadHandler = upload;
