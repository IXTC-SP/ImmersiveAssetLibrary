const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();
const join = require("path").join;
const s3Zip = require("s3-zip");
const archiver = require("archiver");
const path = require("path");
const stream = require("stream");
// import archiver from 'archiver';
// import path from 'path'
// import { PassThrough } from 'stream';
//creat bucket manually in S3 first

// Enter copied or downloaded access ID and secret key here
const ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
});

const bucketName = "immersive-asset-library-bucket";
const awsMethods = {
  uploadFiles: async (tmpContent, objId, req, res, next) => {
    let allFiles = [];
    tmpContent.image
      ? (allFiles = [...tmpContent.image, ...tmpContent.model])
      : (allFiles = [...tmpContent.model]);
    allFiles.push(tmpContent.thumbnail);
    allFiles.push({ gltfPath: "uploads\\tmp\\model.gltf" });
    try {
      let params = null;
      const promises = allFiles.map(async (file) => {
        return await new Promise((resolve, reject) => {
          const fileContent = fs.readFileSync(
            file.gltfPath ? file.gltfPath : file.path
          );
          // Setting up S3 upload parameters
          let params = {
            Bucket: bucketName,
            Key: file.gltfPath
              ? `uploads/${objId}/model.gltf`
              : `uploads/${objId}/${file.originalname}`, // folder + File name you want to save as in S3
            Body: fileContent,
          };
          const data = s3.upload(params, function (err, data) {
            if (err) {
              reject(err);
              return res.status(500).json({
                status: "failed",
                message:
                  "An error occured during file upload. Please try again.",
              });
            } else {
              console.log(`File uploaded successfully. ${data.Location}`);
              resolve(data);
            }
          });
        });
      });
      const uploadedData = await Promise.all(promises);
      uploadedData.push({
        folderPath: `https://${params.Bucket}.s3.amazonaws.com/uploads/${objId}`,
      });
      return uploadedData;
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "failed",
        message: error,
      });
    }
  },
  downloadFiles: async (objId) => {
    let params = {
      Bucket: bucketName /* required */,
      Prefix: `uploads/${objId}/`, // Can be your folder name
    };
    //get list of Files in folder
    const listObjectsPromise = new Promise((resolve, reject) => {
      const dataContents = s3.listObjectsV2(params, function (err, data) {
        if (err) {
          reject(err, err.stack); // an error occurred
        } else {
          resolve(data.Contents);
          // successful respons
        }
      });

      return dataContents;
    });
    let files = await listObjectsPromise;
    //get each file content
    const archive = archiver("zip", { zlib: { level: 5 } });
    const getObjectsPromise = files.map(async (item) => {
      return await new Promise((resolve, reject) => {
        // using pass through stream object to wrap the stream from aws s3
        const passthrough = new stream.PassThrough();
        params = {
          Bucket: bucketName /* required */,
          Key: `${item.Key}`,
        };
        s3.getObject(params).createReadStream().pipe(passthrough)
        resolve({passthrough, name: item.Key.split("/")[2]});
      });
    });
    const fileObjects = await Promise.all(getObjectsPromise);
    fileObjects.forEach((item) => {
      archive.append(item.passthrough, { name: item.name });
    });

    console.log(archive);
    return archive;
  },
};

module.exports = awsMethods;

// s3Client.upload(folderparams, function (err, data) {
//     if (err) {
//         reject(err)
//         return res.status(500).json({
//           status: 'failed',
//           message:
//             'An error occured during file upload. Please try again.',
//         })
//       } else {
//         console.log(`File uploaded successfully. ${data.Location}`)
//         console.log(`File uploaded successfully. ${data.Bucket}`)
//         resolve(data)
//       }
// })
