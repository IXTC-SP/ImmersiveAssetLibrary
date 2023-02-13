const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();
const archiver = require("archiver");
const stream = require("stream");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
var request = require('request');


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
    // console.log("AWS temp content details",tmpContent);
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
    // console.log("allfiles", allFiles);
    try {
      const promises = allFiles.map(async (file) => {
        return await new Promise((resolve, reject) => {
          const fileContent = fs.readFileSync(
            file.gltfPath ? file.gltfPath.substring(1) : file.path
          );
          // console.log(" file content data : ",fileContent);
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
              // console.log(`File uploaded successfully. ${data.Location}`);
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
  getFolderContent: async () => {
    let params = {
      Bucket: bucketName /* required */,
      Key: `sample/modelitem.zip`, // Can be your folder name
    };
    var data = await s3.getObject(params).promise();
    // Load the zip file data buffer
    // var zip = new JSZip();
    // var ziploaded = await zip.loadAsync(data.Body);
    // // Get the list of files in the zip
    // var files = Object.keys(ziploaded.files);
    // // Read the contents of each file in the zip
    // const fileDatasPromise = files.map(async (file) => {
    //   return await new Promise((resolve, reject) => {
    //     resolve(zip.files[file].async("uint8array"));
    //     // resolve(zip.files[file].async("blob"));
    //   });
    // });
    // const file_datas = await Promise.all(fileDatasPromise);
    // console.log(file_datas[3])
    // // console.log(file_datas);
    // // for (var i = 0; i < files.length; i++) {
    // //   var file = files[i];
    // //   zip.files[file].async("blob").then(function(file_data) {
    // //     console.log(file_data);
    // //     file_datas.push(file_data);
    // //   });
    // // }
    // return file_datas;
    return data.Body;
  },
  getSingleModelContent: async (objId, gltfpath) => {
    var buffers = {};
    var params = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${gltfpath}`
    };
    const gltfbuffer = await s3.getObject(params).promise();
    const model = JSON.parse(gltfbuffer.Body.toString());

    if(model.images){
      model.images.forEach((image)=> {
        image.uri = s3.getSignedUrl('getObject', {Bucket: bucketName, Key: `uploads/${objId}/${image.uri}`});
      });
    }

    let stringData = JSON.stringify(model);
    let dataUrl = "data:application/octet-stream;base64," + Buffer.from(stringData).toString("base64");


    buffers['gltf'] = dataUrl;
    return buffers;
  },
  getSingleModelContentByURL: async (objId, gltfpath) => {
    var buffers = {};
    var params = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${gltfpath}`
    };
    const model = s3.getSignedUrl('getObject', params)
    console.log(model);

    function parse(){
      return new Promise(function(resolve, reject){
          request(model, function (error, response, body) {
              // in addition to parsing the value, deal with possible errors
              if (error) return reject(error);
              try {
                  // JSON.parse() can throw an exception if not valid JSON
                  resolve(JSON.parse(body));
              } catch(e) {
                  reject(e);
              }
          });
      });
  }

  var modelfile = await parse()
  if(modelfile.images){
    modelfile.images.forEach((image)=> {
      image.uri = s3.getSignedUrl('getObject', {Bucket: bucketName, Key: `uploads/${objId}/${image.uri}`});
      console.log("running images");
    });
  }
    let stringData = JSON.stringify(modelfile);
    // let byteCharacters = new TextEncoder().encode(stringData);
    // let byteArrays = [...Array(byteCharacters.length)].map((_, i) => byteCharacters.slice(i * 8192, i * 8192 + 8192));

    // let binaryData = '';
    // for (let byteArray of byteArrays) {
    //   binaryData += String.fromCharCode(...new Uint8Array(byteArray));
    // }

    // let dataUrl = "data:application/octet-stream;base64," + Buffer.from(binaryData).toString('base64');
    let dataUrl = "data:application/octet-stream;base64," + Buffer.from(stringData).toString("base64");

  buffers['gltf'] = dataUrl;
  return buffers;



    // let stringData = JSON.stringify(model);
    // let byteCharacters = new TextEncoder().encode(stringData);
    // let byteArrays = [...Array(byteCharacters.length)].map((_, i) => byteCharacters.slice(i * 8192, i * 8192 + 8192));

    // let binaryData = '';
    // for (let byteArray of byteArrays) {
    //   binaryData += String.fromCharCode(...new Uint8Array(byteArray));
    // }

    // let dataUrl = 'data:' + gltfbuffer.ContentType + ';base64,' + Buffer.from(binaryData).toString('base64');
  },
  getSingleCubemapContent: async (objId, cubemapPaths) => {
    var buffers = {};
    buffers['cubemap'] = {};
    const fileDatasPromise = Object.entries(cubemapPaths).map(async (key,value) => {
      return await new Promise((resolve, reject) => {
        var params = {
          Bucket: bucketName,
          Key: `uploads/${objId}/${key[1]}`
        };
        s3.getObject(params).promise().then(data=> {
          var base64Image = data.Body.toString("base64");
          var imgSrc = `data:${data.ContentType};base64,${base64Image}`;
          var result = { key : key[0], path : imgSrc}
          resolve(result);
        });
      });
    });
    const file_datas = await Promise.all(fileDatasPromise);
    file_datas.forEach((data, index)=>{
      buffers['cubemap'][data.key.toString()] = data.path;
    })
    return buffers;
  },
  getSingleEquirectangularContent: async (objId, equirectangularPath) => {
    var buffers = {};
    var params = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${equirectangularPath}`
    };
    var preassignedUrl = await  s3.getObject(params).promise();
    var base64Image = preassignedUrl.Body.toString("base64");
    var imgSrc = `data:${preassignedUrl.ContentType};base64,${base64Image}`;
    buffers['equirectangle'] = imgSrc;
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
  },
  reloadThumbnailUrl : async (objId,thumbnailpath) => {
    let params = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${thumbnailpath}`, // folder + File name you want to save as in S3
      Expires: 43200
    }
    var preassignedUrl = await s3.getSignedUrlPromise("getObject", params);
    return preassignedUrl;
  }
};

module.exports = awsMethods;