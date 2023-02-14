require('dotenv').config()
const mongoose = require('mongoose')

//const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}.trfz1qc.mongodb.net/?retryWrites=true&w=majority`
const MONGODB_URI = "mongodb+srv://ixtcdeveloper:uxtcdeveloper1234@ixtc.trfz1qc.mongodb.net/"


const port = process.env.PORT || 3000

const connectDb = async()  => {
    try {
        await mongoose.connect(MONGODB_URI , { dbName: process.env.MONGO_DB})
    } catch(err) {
        process.exit(1)
    }

    
}

module.exports = connectDb()