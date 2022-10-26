//get extension string of file
function getExtension(filename) {
  var parts = filename.split('.');
  return parts[parts.length - 1];
}

function isImage(filename) {
var ext = getExtension(filename);
switch (ext.toLowerCase()) {
  case 'jpg':
  case 'png':
  case 'jpeg':
    //etc
    return true;
}
return false;
}

function isZip(filename) {
var ext = getExtension(filename);
switch (ext.toLowerCase()) {
  case 'zip':
    //etc
    return true;
}
return false;
}

function isObj(filename) {
var ext = getExtension(filename);
switch (ext.toLowerCase()) {
  case 'fbx':
  case 'obj':
  case 'gltf':
  case 'glb':
  case 'jpg':
  case 'png':
  case 'jpeg':
    //etc
    return true;
}
return false;
}

function isScript(filename) {
var ext = getExtension(filename);
switch (ext.toLowerCase()) {
  case 'cs':
  case 'js':
  case 'py':
    //etc
    return true;
}
return false;
}
