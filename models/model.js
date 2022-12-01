const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const modelSchema = new mongoose.Schema({
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    owner: {
      type: mongoose.Types.ObjectId,
    },
    downloadcount: {
      type: Number,
      default: 0
    },
    tags:{
      type: [String]
    },
    assetPath: {
      type: mongoose.Schema.Types.Mixed,
    },
    atrribute: {
      type: mongoose.Schema.Types.Mixed,
    },
    uploaddate: {
      type: Date,
      default: () => Date.now()
    },
    filesize: {
      type: String
    }
   }
);
const Model = mongoose.model('Model', modelSchema);

module.exports = Model


assignownerid();
function assignownerid(){
  Model.find({}, async function(err, docs) {
    for(i=0;i<docs.length;i++){
      if(i%2 == 0){
        await Model.updateOne(docs[i], { owner: mongoose.Types.ObjectId('637c8339c46b477d10e8b585') });
      } else {
        await Model.updateOne(docs[i], { owner: mongoose.Types.ObjectId('637c8329c46b477d10e8b57e') });
      }
    }
  });
}
