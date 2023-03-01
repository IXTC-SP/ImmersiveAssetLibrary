const nodeCron = require("node-cron");
const userModel = require("../models/user");
const modelDb = require("../scripts/databasemanager_model");
const threesixtyDb = require("../scripts/databasemanager_360");
const store = require("../scripts/mongo_store");
const uploadmanager = require("../scripts/uploadsmanager_model");
const uploadmanager_360 = require("../scripts/uploadmanager_360");
//nodeCron.schedule(expression, function, options);
//1st arg * is the time scheduler. all * means every seccond
//2nd arg ia a function executing the job
//3rd arg optional congif object for the job
//https://crontab.guru/
// "*/2 * * * *", every 2 minutes
// const job = nodeCron.schedule("0 18 * * 7", function jobYouNeedToExecute() {
//     // Do whatever you want in here. Send email, Make  database backup or download data.
//     console.log(new Date().toLocaleString());
//   });

const removeUnactivatedAcc = async () => {
  const now = new Date();;
  const dateForCleansing = now.setDate(now.getDate() - 1);
  try {
    const accts = await userModel.deleteMany({
      isActivated: false,
      createdAt: { $lte: new Date(dateForCleansing) },
    });
    // console.log(accts);
    console.log("Deleting accounts ");
  } catch (error) {
    console.log(error);
  }
};
const removeUnactivatedAccJob = nodeCron.schedule("0 2 * * *", removeUnactivatedAcc);

const recreateThumbnailSignedURL = async () => {
  console.log("regenerating thumbnail URL");
  modelDb.UpdateThumbnailUrl();
  threesixtyDb.UpdateThumbnailUrl();
};
const recreateThumbnailSignedURLJob = nodeCron.schedule("0 23 * * *", recreateThumbnailSignedURL);

//sess expires base on cookies, which is getting updated on every req
//but is not geting deleted in the store, cause store expiry is 2 weeks (default)
//so we can obtain the expired session

const removeTmpFolders = async()=> {
  console.log("Remove Tmp folders");
  store.all((error, sessions)=>{
  for(let i = 0; i< sessions.length ; i++){
    if(new Date(sessions[i].expiryDate) < new Date()){
      console.log("destroy this session", sessions[i].sessId)
      store.destroy(sessions[i].sessId, function(err, session){
        if(err){console.log(err)}
      })
      uploadmanager.closeTmpFolder(sessions[i].sessId);
    }
    
  }
  })

}

const removeTmpFoldersJob = nodeCron.schedule("0 4 * * *", removeTmpFolders);//4am each night

module.exports = () => {  
  console.log("running cron jobs");
  recreateThumbnailSignedURLJob.start();
  removeUnactivatedAccJob.start();
  removeTmpFoldersJob.start();
}