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
    let allFiles = [];
    tmpContent.image
      ? (allFiles = [...tmpContent.image, ...tmpContent.model])
      : (allFiles = [...tmpContent.model]);
    allFiles.push(tmpContent.thumbnail);
    allFiles.push({ gltfPath: "uploads\\tmp\\model.gltf" });
    try {
      let params = null;
      const promises = allFiles.map(async (file) => {
        const fileContent = fs.readFileSync(file.gltfPath ? file.gltfPath : file.path,);
        return await new Promise((resolve, reject) => {
          // Setting up S3 upload parameters
          params = {
            Bucket: "immersive-asset-library-bucket",
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
              // console.log(`File uploaded successfully. ${data.Bucket}`);
              // const dataObj = {};
              // //get the name of file and the url
              // dataObj[file.originalname] = data.Location;
              // console.log(dataObj);
              resolve(data);
            }
          });
        });
      });
      const uploadedData = await Promise.all(promises);
      uploadedData.push({"folderPath": `https://${params.Bucket}.s3.amazonaws.com/uploads/${objId}`})
      return uploadedData 
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: "failed",
        message: error,
      });
    }
  },
  downloadFiles:async()=> {
    
  }
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
