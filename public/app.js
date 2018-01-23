const TEST_DATA = {
  "creators": [
                {
                  name: "William Herbert Dray",
                  links: [
                    {
                      domain: "Wikipedia",
                      url: "https://en.wikipedia.org/wiki/William_Herbert_Dray"
                    },
                    {
                      domain: "The Canadian Encyclopedia",
                      url: "http://www.thecanadianencyclopedia.com/en/article/william-herbert-dray/"
                    }
                  ]
                },
                
                {
                  name: "Benedetto Croce",
                  links: [
                    {
                      domain: "Wikipedia",
                      url: "https://en.wikipedia.org/wiki/Benedetto_Croce"
                    }
                  ]
                },
                
                {
                  name: "Grant Duff Douglas Ainslie",
                  
                  links: [
                    {
                      domain: "Wikipedia",
                      url: "https://en.wikipedia.org/wiki/Douglas_Ainslie"
                    }
                  ]
                }
              ]
};

function getListOfAuthors(callback) {
  setTimeout(function() { callback(TEST_DATA) }, 2000);
}

function displayListOfAuthors(data) {
  data.creators.forEach(creator => {
    const $a = $("<li>");
    $a.text(creator.name);
    $a.attr("href", "#");
    $("#list-of-creators").append($a);
  });
}

function getAndDisplayListOfAuthors() {
  getListOfAuthors(displayListOfAuthors);
}

$(function() {
  getAndDisplayListOfAuthors();
});