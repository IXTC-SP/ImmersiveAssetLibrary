const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();
const archiver = require("archiver");
const stream = require("stream");
var AdmZip = require("adm-zip");

// Enter copied or downloaded access ID and secret key here
const ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET = process.env.AWS_SECRET_ACCESS_KEY;

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
});

const bucketName = "immersive-asset-library-bucket";
const awsMethods = {
  uploadFiles: async (tmpContent, objId, type, req, res, next) => {
    console.log("AWS temp content details",tmpContent);
    let allFiles = [];
    let params = null;
    if (type === "360") {
      if (tmpContent.image.equi) {
        allFiles.push(tmpContent.image.equi);
      } else {
        allFiles.push(tmpContent.image.top);
        allFiles.push(tmpContent.image.front);
        allFiles.push(tmpContent.image.bottom);
        allFiles.push(tmpContent.image.right);
        allFiles.push(tmpContent.image.left);
        allFiles.push(tmpContent.image.back);
      }
    } else {
      tmpContent.image
        ? (allFiles = [...tmpContent.image, ...tmpContent.model])
        : (allFiles = [...tmpContent.model]);
      allFiles.push({ gltfPath: tmpContent.modelviewerpath });
    }
    allFiles.push(tmpContent.thumbnail);
    console.log("allfiles", allFiles);
    try {
      const promises = allFiles.map(async (file) => {
        return await new Promise((resolve, reject) => {
          const fileContent = fs.readFileSync(
            file.gltfPath ? file.gltfPath.substring(1) : file.path
          );
          console.log(" file content data : ",fileContent);
          // Setting up S3 upload parameters
          params = {
            Bucket: bucketName,
            Key: file.gltfPath
              ? `uploads/${objId}/model.gltf`
              : `uploads/${objId}/${file.originalname}`, // folder + File name you want to save as in S3
            Body: fileContent,
          };
          const data = s3.upload(params, function (err, data) {
            if (err) {
              console.log(err);
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
    try {
      let files = await s3.listObjectsV2(params).promise()
      //get each file content
      const archive = archiver("zip", { zlib: { level: 5 } });
      const getObjectsPromise = files.Contents.map(async (item) => {
        return await new Promise((resolve, reject) => {
          // using pass through stream object to wrap the stream from aws s3
          const passthrough = new stream.PassThrough();
          params = {
            Bucket: bucketName /* required */,
            Key: `${item.Key}`,
          };
          s3.getObject(params).createReadStream().pipe(passthrough);
          resolve({ passthrough, name: item.Key.split("/")[2] });
        });
      });
      const fileObjects = await Promise.all(getObjectsPromise);
      fileObjects.forEach((item) => {
        archive.append(item.passthrough, { name: item.name });
      });

      console.log("archive" ,archive);
      return archive;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  deleteFiles: async (objId) => {
    try {
      let params = {
        Bucket: bucketName,
        Prefix: `uploads/${objId}/`,
      };

      const listedObjects = await s3.listObjectsV2(params).promise();

      if (listedObjects.Contents.length === 0) return;

      const deleteParams = {
        Bucket: bucketName,
        Delete: { Objects: [] },
      };

      listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
      });

      const data = await s3.deleteObjects(deleteParams, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else 
        console.log(data)
        return data ; // successful response
      }).promise()
      return data

    } catch (error) {
      console.log(error)
      return error
    }
  },
  getFolderContent: async (objId) => {
    let params = {
      Bucket: bucketName /* required */,
      Prefix: `uploads/${objId}/`, // Can be your folder name
    };
    try {
      let files = await s3.listObjectsV2(params).promise()
      //get each file content
      let filebuffers = [];
      files.Contents.map((item) => {
        params = {
          Bucket: bucketName /* required */,
          Key: `${item.Key}`,
        };
        filebuffers.push(s3.getObject(params));
      });
      console.log("archive" ,filebuffers);
      return filebuffers;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  getSingleModelContent: async (objId, gltfpath, thumbnailpath) => {
    var buffers = {};
    var params = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${gltfpath}`
    };
    var gltfbuffer = await s3.getObject(params).promise();
    // await handleFiles(gltfbuffer);
    
    const bin = gltfbuffer.Body.toString('binary');
    // buffers['gltf'] = bin;
    var base64Gltf = Buffer.from(gltfbuffer.Body).toString("base64");
    buffers['gltf'] = `data:${gltfbuffer.ContentType};base64,${base64Gltf}`;
    var params2 = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${thumbnailpath}`
    };
    var thumbnailbuffer = await s3.getObject(params2).promise();
    var base64Image = Buffer.from(thumbnailbuffer.Body).toString("base64");
    buffers['thumbnail'] = `data:${thumbnailbuffer.ContentType};base64,${base64Image}`;
    return buffers;
  },
  getSingleCubemapContent: async (objId, cubemapPaths, thumbnailpath) => {
    var buffers = {
      cubemap: Object,
      thumbnail: ""
    }
  for (const [key, value] of Object.entries(cubemapPaths)) {
    console.log(`${key}: ${value}`);
    var params = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${value}`
    };
    s3.getObject(params, function(err, data) {
      if (err) console.log(err, err.stack);
      buffers.cubemap[key.toString()] = data.Body;
    });
  }
    var params2 = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${thumbnailpath}`
    };
    s3.getObject(params2, function(err, data) {
      if (err) console.log(err, err.stack);
      buffers.thumbnail = data.Body;
    });
    return buffers;
  },
  getSingleEquirectangularContent: async (objId, equirectangularPath, thumbnailpath) => {
    var buffers = {
      equirectangle: "",
      thumbnail: ""
    }
    var params = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${equirectangularPath}`
    };
    s3.getObject(params, function(err, data) {
      if (err) console.log(err, err.stack);
      buffers.equirectangle = data.Body;
    });
    var params2 = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${thumbnailpath}`
    };
    s3.getObject(params2, function(err, data) {
      if (err) console.log(err, err.stack);
      buffers.thumbnail = data.Body;
    });
    return buffers;
  },
  getSignedFileUrl: async (objId, fileName) => {
    let params = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${fileName}`, // folder + File name you want to save as in S3
      Expires: 5
    }
    var preassignedUrl = await s3.getSignedUrlPromise("getObject", params);
    console.log("preassigned url " ,preassignedUrl);
    return preassignedUrl;
  }  
};

module.exports = awsMethods;

const CreateZipArchive = async (files) => {
  const zip = new AdmZip();
  files.forEach (async (file)=>{
    zip.addFile(file.Body);
  })

  var buffer = zip.toBuffer();
  return buffer;
};