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
              ],
  "works": [
             {
               title: {
                 lang: "en",
                 name: "Laws and Explanation in History"
               },
               contributors: [
                 {
                   role: "author",
                   name: "William Herbert Dray"
                 }
               ],
               type: "book",
               publication_info: {
                 year: 1957
               },
               identifiers: [],
               links: [],
               references: [],
               contents:[]
             },
             {
               title: {
                 lang: "en",
                 name: "Philosophy of History"
               },
               contributors: [
                 {
                   role: "author",
                   name: "William Herbert Dray"
                 }
               ],
               type: "book",
               publication_info: {
                 year: 1964
               },
               identifiers: [],
               links: [],
               references: [],
               contents:[]
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

function getListOfWorks(callback) {
  setTimeout(function() { callback(TEST_DATA) }, 2000);
}

function displayListOfWorks(data) {
  data.works.forEach(work => {
    const $a = $("<li>");
    $a.text(`${work.title.name} ${work.publication_info.year}`);
    $a.attr("href", "#");
    $("#list-of-works").append($a);
  });
}

function getAndDisplayListOfWorks() {
  getListOfWorks(displayListOfWorks);
}

$(function() {
  getAndDisplayListOfAuthors();
  getAndDisplayListOfWorks();
});