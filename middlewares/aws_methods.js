const fs = require('fs')
const AWS = require('aws-sdk')
require('dotenv').config()
const archiver = require('archiver')
const stream = require('stream')
// Enter copied or downloaded access ID and secret key here
// const ID = process.env.AWS_ACCESS_KEY_ID
// const SECRET = process.env.AWS_SECRET_ACCESS_KEY

const s3 = new AWS.S3({
  // accessKeyId: ID,
  // secretAccessKey: SECRET,
})

const bucketName = 'immersive-asset-library-bucket'
const awsMethods = {
  uploadFiles: async (tmpContent, objId, type, req, res, next) => {
    console.log(tmpContent)
    let allFiles = []
    let params = null
    if (type === '360') {
      if (tmpContent.image.equi) {
        allFiles.push(tmpContent.image.equi)
      } else {
        allFiles.push(tmpContent.image.top)
        allFiles.push(tmpContent.image.front)
        allFiles.push(tmpContent.image.bottom)
        allFiles.push(tmpContent.image.right)
        allFiles.push(tmpContent.image.left)
        allFiles.push(tmpContent.image.back)
      }
    } else {
      tmpContent.image
        ? (allFiles = [...tmpContent.image, ...tmpContent.model])
        : (allFiles = [...tmpContent.model])
      allFiles.push({ gltfPath: 'uploads\\tmp\\model.gltf' })
    }
    allFiles.push(tmpContent.thumbnail)
    console.log('allfiles', allFiles)
    try {
      const promises = allFiles.map(async (file) => {
        return await new Promise((resolve, reject) => {
          const fileContent = fs.readFileSync(
            file.gltfPath ? file.gltfPath : file.path,
          )
          // Setting up S3 upload parameters
          params = {
            Bucket: bucketName,
            Key: file.gltfPath
              ? `uploads/${objId}/model.gltf`
              : `uploads/${objId}/${file.originalname}`, // folder + File name you want to save as in S3
            Body: fileContent,
          }
          const data = s3.upload(params, function (err, data) {
            if (err) {
              reject(err)
              return res.status(500).json({
                status: 'failed',
                message:
                  'An error occured during file upload. Please try again.',
              })
            } else {
              console.log(`File uploaded successfully. ${data.Location}`)
              resolve(data)
            }
          })
        })
      })
      const uploadedData = await Promise.all(promises)
      uploadedData.push({
        folderPath: `https://${params.Bucket}.s3.amazonaws.com/uploads/${objId}`,
      })
      return uploadedData
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        status: 'failed',
        message: error,
      })
    }
  },
  downloadFiles: async (objId) => {
    let params = {
      Bucket: bucketName /* required */,
      Prefix: `uploads/${objId}/`, // Can be your folder name
    }
    try {
      let files = await s3.listObjectsV2(params).promise()
      //get each file content
      const archive = archiver('zip', { zlib: { level: 5 } })
      const getObjectsPromise = files.Contents.map(async (item) => {
        return await new Promise((resolve, reject) => {
          // using pass through stream object to wrap the stream from aws s3
          const passthrough = new stream.PassThrough()
          params = {
            Bucket: bucketName /* required */,
            Key: `${item.Key}`,
          }
          s3.getObject(params).createReadStream().pipe(passthrough)
          resolve({ passthrough, name: item.Key.split('/')[2] })
        })
      })
      const fileObjects = await Promise.all(getObjectsPromise)
      fileObjects.forEach((item) => {
        archive.append(item.passthrough, { name: item.name })
      })

      console.log(archive)
      return archive
    } catch (error) {
      console.log(error)
      return error
    }
  },
  deleteFiles: async (objId) => {
    try {
      let params = {
        Bucket: bucketName,
        Prefix: `uploads/${objId}/`,
      }

      const listedObjects = await s3.listObjectsV2(params).promise()

      if (listedObjects.Contents.length === 0) return

      const deleteParams = {
        Bucket: bucketName,
        Delete: { Objects: [] },
      }

      listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key })
      })

      const data = await s3
        .deleteObjects(deleteParams, function (err, data) {
          if (err) console.log(err, err.stack)
          // an error occurred
          else console.log(data)
          return data // successful response
        })
        .promise()
      return data
    } catch (error) {
      console.log(error)
      return error
    }
  },
  getSignedFileUrl: async (objId, fileName) => {
    // const s3ObjectUrl = parseUrl(ObjUrl)
    // const presigner = new S3RequestPresigner({
    //   credentials,
    //   region,
    //   sha256: Hash.bind(null, 'sha256'), // In Node.js
    //   //sha256: Sha256 // In browsers
    // })
    // // Create a GET request from S3 url.
    // const url = await presigner.presign(new HttpRequest(s3ObjectUrl))
    // console.log('PRESIGNED URL: ', formatUrl(url))
    let params = {
      Bucket: bucketName,
      Key: `uploads/${objId}/${fileName}`, // folder + File name you want to save as in S3
    }
    const preassignedUrl = await s3.getSignedUrlPromise("getObject", params)
    console.log(preassignedUrl)
    return preassignedUrl
  },
}

module.exports = awsMethods
