const UsersJson = require('./users.json')
const UserModel = require('../../models/user')

const createUsers= async() => {
    await UserModel.create(UsersJson)
    console.log(`Created users`)
}

module.exports = createUsers()