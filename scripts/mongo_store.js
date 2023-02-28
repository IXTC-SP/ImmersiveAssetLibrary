const MongoDBStore = require('connect-mongo')
const store = MongoDBStore.create({
  mongoUrl: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}.trfz1qc.mongodb.net/`,
  dbName: process.env.MONGO_DB,
  collectionName: 'mySessions',
});

module.exports = store