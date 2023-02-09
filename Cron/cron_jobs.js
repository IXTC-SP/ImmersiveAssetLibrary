const nodeCron = require("node-cron");
const userModel = require("../models/user");
const modelDb = require("../scripts/databasemanager_model");
const threesixtyDb = require("../scripts/databasemanager_360");
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
  const now = new Date();
  console.log(now);
  const dateForCleansing = now.setDate(now.getDate() - 1);
  console.log("------>", new Date(dateForCleansing));
  try {
    const accts = await userModel.deleteMany({
      isActivated: false,
      createdAt: { $lte: new Date(dateForCleansing) },
    });
    console.log(accts);
    console.log("Deleting accounts every min, greated then 1 day");
  } catch (error) {
    console.log(error);
  }
};
const removeUnactivatedAccJob = nodeCron.schedule("0 8 * * *", removeUnactivatedAcc);

const recreateThumbnailSignedURL = async () => {
  console.log("regenerating thumbnail URL");
  modelDb.UpdateThumbnailUrl();
  threesixtyDb.UpdateThumbnailUrl();
};
const recreateThumbnailSignedURLJob = nodeCron.schedule("55 */11 * * *", recreateThumbnailSignedURL);


module.exports = () => {  
  console.log("running cron jobs");
  recreateThumbnailSignedURLJob.start();
  removeUnactivatedAccJob.start();
}