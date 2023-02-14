const datamuse = require('datamuse');

datamuse.words({
  ml: 'ship',
  md: 'f'
})
.then((json) => {
  var arr = []
  json.forEach((j) => {
   var thenum = j.tags[1].replace( /^\D+/g, '');
    if(j.tags[0] === 'n' && thenum > 15){
      arr.push({
        word: j.word,
        tags: [j.tags[0], thenum]
      });
    }
  })

  //do it!
});
