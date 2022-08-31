const UsersJson = require("./users.json");
const UserModel = require("../../models/user");

const createUsers = async () => {
    await UserModel.create(UsersJson);
    console.log(`Created users`);
};

const addCreatedByField = async () => {
    await UserModel.updateMany(
        {}, 
        { $set: { createdBy: "630f0acc7fa286ec83e1bcad" } },
        { new: true }
    )

console.log("addCreatedByField")
};

module.exports = addCreatedByField();
