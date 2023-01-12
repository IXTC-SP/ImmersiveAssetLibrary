const fs = require('fs')
const AWS = require('aws-sdk')
require('dotenv').config()

//creat bucket manually in S3 first

// Enter copied or downloaded access ID and secret key here
const ID = process.env.AWS_ACCESS_KEY_ID
const SECRET = process.env.AWS_SECRET_ACCESS_KEY

const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
})
const awsMethods = {
  uploadFiles: async (req, res, next) => {
    console.log(req.files)
    let body = JSON.parse(req.body.data)
    let allfiles = body.files
    if (req.files.file) {
      if (req.files.file.length > 0) {
        let newfiles = req.files.file.map((a) => a.originalname)
        allfiles = body.files.concat(newfiles)
      }
    }
    if (typeof body.modelfile != 'undefined') {
      allfiles.push(body.modelfile)
    }
    if (typeof body.modelviewerpath != 'undefined') {
      allfiles.push(body.modelviewerpath)
    }
    if (typeof req.files.newthumbnail != 'undefined') {
      console.log(req.files.newthumbnail[0].originalname)
      allfiles.push(req.files.newthumbnail[0].filename)
    }
    let thumbnail =
      body.thumbnail == ''
        ? req.files.newthumbnail[0].originalname.replace('tmp', body.folderpath)
        : body.thumbnail
    console.log('--->files', allfiles)

    if (allfiles) {
      let params = null
      const promises = allfiles.map(async (file) => {
        return await new Promise((resolve, reject) => {
          // Setting up S3 upload parameters
          params = {
            Bucket: 'immersive-asset-library-bucket',
            Key: 'uploads/' + file.originalname + '/' + file.originalname, // folder + File name you want to save as in S3
            Body: file.buffer,
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
              console.log(`File uploaded successfully. ${data.Bucket}`)
              resolve(data)
            }
          })
          return data
        })
      })
      const uploadedData = await Promise.all(promises)
      console.log(uploadedData)
      req.uploadedData = [...uploadedData]
      //return next()
    } else {
      console.log('An epub file is required')
      return res.status(500).json({
        status: 'failed',
        message: 'An epub file is required',
      })
    }
  },
}

module.exports = awsMethods

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