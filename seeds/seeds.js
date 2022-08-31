require('./config')

const globAll = require("glob-all")

const seed = async () => {
    //gets the array of the diff file path according to this conditions
    //include all file seeds/ and seeds/../.. 
    //! means exclude those files
  const requireAll = globAll.sync([
    'seeds/**/*.js',
    '!seeds/config.js',
    '!seeds/seeds.js'
  ]).map((filepath) => {
    console.log('Seeding: ', filepath)
    return require(`../${filepath}`) //evaluate each file, eg: "seeds/users/user.js"
  })

  //once async is done then do this. require all will be the array of file paths
  //fulfill when all of the other promises is fulfilled in the array
  await Promise.all(requireAll)
  process.exit(1)
}

seed()
//run npm start seed, it will call this js file, 
//which will evaluate .congif (connecting to db), 
//then invoke seed(). which will go through each requred filepath and evaluate
