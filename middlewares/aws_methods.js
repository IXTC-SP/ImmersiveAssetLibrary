const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();

//creat bucket manually in S3 first

// Enter copied or downloaded access ID and secret key here
const ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
});
const awsMethods = {
  uploadFiles: async (tmpContent, objId, req, res, next) => {
    const allFiles = [...tmpContent.image, ...tmpContent.model];
    allFiles.push(tmpContent.thumbnail)
    console.log("----->content", allFiles);
    console.log("----->Id", objId);
    if (allFiles) {
      let params = null;
      const promises = allFiles.map(async (file) => {
        // const fileData = fs.readFileSync("./uploads/tmp/" + file, function (err, data) {
        //   if (err) {
        //     console.log(err);
        //   } else {
        //     console.log("file data---->>", data);
        //     return data
        //   }
        // });
        return await new Promise((resolve, reject) => {
          // Setting up S3 upload parameters
          params = {
            Bucket: "immersive-asset-library-bucket",
            Key: "uploads/" + objId + "/" + file.originalname, // folder + File name you want to save as in S3
            Body: file.path,
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
              console.log(`File uploaded successfully. ${data.Bucket}`);
              resolve(data);
            }
          });
          return data;
        });
      });
      const uploadedData = await Promise.all(promises);
      const gltfPromise = () => {
        params = {
          Bucket: "immersive-asset-library-bucket",
          Key: "uploads/" + objId + "/" + "model.gltf", // folder + File name you want to save as in S3
          Body: tmpContent.modelviewerpath,
        };
        const gltfData = s3.upload(params, function (err, data) {
          if (err) {
            console.log(err);
            return res.status(500).json({
              status: "failed",
              message: "An error occured during file upload. Please try again.",
            });
          } else {
            console.log(`File uploaded successfully. ${data.Location}`);
            console.log(`File uploaded successfully. ${data.Bucket}`);
            return data;
          }
        });
        return gltfData
      };
      const gltfData = await new Promise(gltfPromise)
      uploadedData.push(gltfData);

      return uploadedData;
      req.uploadedData = [...uploadedData];
      //return next()
    } else {
      console.log("An epub file is required");
      return res.status(500).json({
        status: "failed",
        message: "An epub file is required",
      });
    }
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
