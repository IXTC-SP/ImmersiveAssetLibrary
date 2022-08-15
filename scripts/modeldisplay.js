const fs = require('fs');

function LoadTempFilesForModels(req, callback){
  console.log('write model path');
  WriteTempFile(req.query.gltfpath, './public/temp.gltf');
  console.log('write diffuse path');
  WriteTempFile(req.query.diffuse, './public/temp_diffuse.gltf');
  console.log('write metallicroughness path');
  WriteTempFile(req.query.metallicroughness, './public/temp_roughness.gltf');
  console.log('write normal path');
  WriteTempFile(req.query.normal, './public/temp_normal.gltf');
  console.log('write occlusion path');
  WriteTempFile(req.query.occlusion, './public/temp_occlusion.gltf');
  console.log('write emission path');
  WriteTempFile(req.query.emission, './public/temp_emission.gltf');
  callback("complete writing")
}

function WriteTempFile(readpath, writepath){
  if(readpath === "") return;
  var content = fs.readFileSync(readpath);
  fs.writeFile('writepath', content, err => {
    if (err) {
      console.error(err);
    }
  // file written successfully
  });
}
