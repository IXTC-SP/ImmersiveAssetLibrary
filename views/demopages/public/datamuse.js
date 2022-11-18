async function suggest(word) {
  console.log(word);
  let url = 'https://api.datamuse.com/words?ml=' + word + '&md=f'

  let response = await fetch(url)
  const result = await response.json();
  return result;
}


//submit typed tag:
//check if typed tag exist in selected tags already
//clear existing suggested tags
//generate 10 new suggested tags in a single line
//add tag to selected tags
//clear input field

//submit tag through suggestions:
//check if typed tag exist in selected tags already
//clear existing suggested tags
//generate 10 new suggested tags in a single line
//add tag to selected tags


async function suggestionsFromDatamuse(word){
  console.log(word);
  let url = 'https://api.datamuse.com/words?ml=' + word + '&md=f'

  let response = await fetch(url)
  const result = await response.json();
  var arr = []
  result.forEach((j) => {
   var thenum = j.tags[1].replace( /^\D+/g, '');
    if(j.tags[0] === 'n' && thenum > 15 && arr.length < 11){
      arr.push({
        word: j.word,
        tags: [j.tags[0], thenum]
      });
    }
  });
  return arr;
}

function createTagSuggestion(tagname){
  suggest(tagname).then(result=> {
    var arr = []
    result.forEach((j) => {
     var thenum = j.tags[1].replace( /^\D+/g, '');
      if(j.tags[0] === 'n' && thenum > 15){
        arr.push({
          word: j.word,
          tags: [j.tags[0], thenum]
        });
      }
    });
    suggestedtagarray = new Array(arr);
    console.log(arr);
    suggestedtagarray.forEach((a) => {
      addSuggest(a.word);
    });
  });
}

function addSuggest(tagname){
  let tag = document.createElement("p");
  tag.innerHTML = tagname;
  document.body.appendChild(tag);
  document.getElementById('tag_suggest').appendChild(tag);
  console.log(tag);
  // tag.onclick = function(){ console.log(this); this.parentNode.removeChild(this); };
  console.log(document.activeElement.id);
}

function addTag(tagname){
  let tag = document.createElement("p");
  tag.innerHTML = tagname;
  document.body.appendChild(tag);
  document.getElementById('tag_input').appendChild(tag);
  console.log(tag);
  tag.onclick = function(){ console.log(this); this.parentNode.removeChild(this); };
  console.log(document.activeElement.id);
}
