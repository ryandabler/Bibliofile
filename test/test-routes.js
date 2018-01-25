////////////////////////////
// Initialize
////////////////////////////
const chai     = require("chai");
const chaiHTTP = require("chai-http");
const mongoose = require("mongoose");
const faker    = require("faker");
mongoose.Promise = global.Promise;
const { app, runServer, closeServer } = require("../server");
const { Creator, Work } = require("../models");
const { TEST_DATABASE_URL } = require("../config");

const expect = chai.expect;
chai.use(chaiHTTP);

////////////////////////////
// Utility functions
////////////////////////////
function generateCreatorData() {
  return {
    fullName: `${faker.name.firstName()} ${faker.name.lastName()}`,
    links: [
      {
        domain: "Wikipedia",
        url: faker.internet.url()
      }
    ],
    awards: [
      {
        award_name: faker.lorem.words(),
        award_year: faker.date.past(25).getFullYear().toString()
      },
      {
        award_name: faker.lorem.words(),
        award_year: faker.date.past(25).getFullYear().toString()
      }
    ],
    created: Date.now().toString()
  };
}

function seedCreatorData() {
  console.info("seeding creator data");
  const seedData = [];
  
  for (let n = 0; n < 10; n++) {
    seedData.push(generateCreatorData());
  }
  
  return Creator.insertMany(seedData);
}

async function generateWorkData() {
  const creator = await Creator.create(generateCreatorData());
  const work = {
    title: { lang: "en",
             name: faker.lorem.words()
           },
    contributors: { role: "author",
                    who:  creator.id
                  },
    kind: "book",
    publication_info: { year: faker.date.past(25).getFullYear().toString() },
    identifiers: [],
    links: [ { domain: faker.lorem.word(), url: faker.internet.url() } ],
    references: [],
    contents: {
                kind: "chapter",
                name: faker.lorem.words()
    }
  };
  
  return work;
}

async function seedWorkData(done) {
  console.info("seeding work data");
  const seedData = [];
  
  for (let n = 0; n < 10; n++) {
    seedData.push(generateWorkData());
  }
  
  return Promise.all(seedData);
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

////////////////////////////
// Test suite
////////////////////////////

// Creator
describe("Creator API", function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });
  
  beforeEach(function() {
    return seedCreatorData();
  });
  
  after(function() {
    return closeServer();
  });
  
  afterEach(function() {
    return tearDownDb();
  });
  
  describe("GET endpoint", function() {
    it("Should return all existing creators", function() {
      let res;
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(_res) {
                   res = _res;
                   expect(_res).to.have.status(200);
                   expect(_res).to.be.json;
                   expect(_res.body).to.be.a("object");
                   expect(_res.body.creators).to.be.a("array");
                    
                   // Make sure seeding worked
                   expect(_res.body.creators.length).to.be.at.least(1);
                    
                   const expectedKeys = ["id", "name", "links", "awards"];
                   res.body.creators.forEach(function(creator) {
                     expect(creator).to.be.a("object");
                     expect(creator).to.include.keys(expectedKeys);
                   });
                    
                   return Creator.count();
                 })
                 .then(function(count) {
                   expect(res.body.creators.length, count).to.be.equal;
                 });
    });
    
    it("Should return one creator", function() {
      let creator;
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                   creator = res.body.creators[0];
                   return chai.request(app)
                              .get(`/api/creators/${creator.id}`);
                 })
                 .then(function(res) {
                   expect(res).to.have.status(200);
                   expect(res).to.be.json;
                   expect(res.body).to.be.a("object");
                   expect(res.body).to.deep.equal(creator);
                 });
    });
  });

  describe("POST endpoint", function() {
    it("Should create a blog post", function() {
      const newCreator = generateCreatorData();
      
      return chai.request(app)
                 .post("/api/creators")
                 .send(newCreator)
                 .then(function(res) {
                   expect(res).to.have.status(201);
                   expect(res).to.be.json;
                   expect(res.body).to.be.a("object");
                   expect(res.body).to.include.keys("id", "name", "links", "awards");
                   expect(res.body.id).to.not.equal(null);
                   
                   // Process newCreator to make it match the response from the server
                   newCreator.name = newCreator.fullName;
                   delete newCreator.fullName;
                   delete newCreator.created;
                   
                   expect(res.body).to.deep.equal(Object.assign(newCreator, {id: res.body.id}));
                    
                   return Creator.findById(res.body.id);
                 })
                 .then(function(creator) {
                   let serialCreator = creator.serialize();
                   
                   expect(serialCreator.name).to.equal(newCreator.name);
                 });
    });
  
    it("Should throw an error because field is missing", function() {
      const badCreator = { links: [
                                    {
                                      domain: "Wikipedia",
                                      url:"https://en.wikipedia.org/wiki/Plato"
                                    }
                                  ]
                          };
      return chai.request(app)
                 .post("/api/creators")
                 .send(badCreator)
                 .catch(function(err) {
                   expect(err.response).to.have.status(400);
                   expect(err.response.text).to.be.a("string");
                   expect(err.response.text).to.match(/The request is missing the field\(s\) .+/);
                 });
    });
  });
  
  describe("DELETE endpoint", function() {
    it("Should delete a creator", function() {
      let deleteId;
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                   deleteId = res.body.creators[0].id;
                   return chai.request(app)
                              .delete(`/api/creators/${deleteId}`);
                 })
                 .then(function(res) {
                   expect(res).to.have.status(204);
                   return Creator.findById(deleteId);
                 })
                 .then(function(creator) {
                   expect(creator).to.be.null;
                 });
    });
    
    it("Should throw error due to incorrect id", function() {
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                   const deleteId = res.body.creators[0].id;
                   return chai.request(app)
                              .delete(`/api/creators/${deleteId.slice(0, deleteId.length - 1)}`);
                 })
                 .catch(function(err) {
                   expect(err.response).to.have.status(500);
                   expect(err.response.text).to.be.a("string");
                   expect(err.response.text).to.match(/Internal server error/);
                 });
    });
  });
  
  describe("PUT endpoint", function() {
    it("Update creator", function() {
      let updatedCreator = {
                              links: [
                                {
                                  domain: "Stanford Encyclopedia of Philosophy",
                                  url: "https://plato.stanford.edu/"
                                }
                              ]
                           },
          originalCreator;
      
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                   originalCreator = res.body.creators[0];
                   updatedCreator.id = originalCreator.id;
                    
                   return chai.request(app)
                              .put(`/api/creators/${originalCreator.id}`)
                              .send(updatedCreator);
                 })
                 .then(function(res) {
                   expect(res).to.have.status(200);
                    
                   return Creator.findById(updatedCreator.id);
                 })
                 .then(function(creator) {
                   const serialCreator = creator.serialize();
                   expect(serialCreator.links[0].url).to.equal("https://plato.stanford.edu/");
                   expect(serialCreator.links[0].domain).to.equal("Stanford Encyclopedia of Philosophy");
                 });
    });
  
    it("Throw error on blog update due to bad id", function() {
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                   const updateId = res.body.creators[0].id;
                   const updatedCreator = { id:       updateId.slice(0, updateId.length - 1),
                                            links: [
                                              {
                                                domain: "Stanford Encyclopedia of Philosophy",
                                                url: "https://plato.stanford.edu/"
                                              }
                                            ]
                                          };
                   return chai.request(app)
                              .put(`/api/creators/${updateId}`)
                              .send(updatedCreator);
                 })
                 .catch(function(err) {
                   expect(err.response).to.have.status(400);
                   expect(err.response.text).to.be.a("string");
                   expect(err.response.text).to.match(/Please ensure the correctness of the ids/);
                 });
    });
  });
});

// Work
describe("Work API", function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });
  
  beforeEach(function() {
    this.timeout(10000);
    return seedWorkData().then(data => Work.insertMany(data));
  });
  
  after(function() {
    return closeServer();
  });
  
  afterEach(function() {
    return tearDownDb();
  });
  
  describe("GET endpoint", function() {
    it("Should return all existing works", function() {
      let res;
      return chai.request(app)
                 .get("/api/works")
                 .then(function(_res) {
                   res = _res;
                   expect(_res).to.have.status(200);
                   expect(_res).to.be.json;
                   expect(_res.body).to.be.a("object");
                   expect(_res.body.works).to.be.a("array");
                     
                   // Make sure seeding worked
                   expect(_res.body.works.length).to.be.at.least(1);
                     
                   const expectedKeys = ["id", "title", "contributors", "kind", "publication_info", "identifiers", "links", "references", "contents"];
                   res.body.works.forEach(function(work) {
                     expect(work).to.be.a("object");
                     expect(work).to.include.keys(expectedKeys);
                   });
                    
                   return Work.count();
                 })
                 .then(function(count) {
                   expect(res.body.works.length, count).to.be.equal;
                 });
    });
    
    it("Should return one work", function() {
      let work;
      return chai.request(app)
                 .get("/api/works")
                 .then(function(res) {
                   work = res.body.works[0];
                     
                   return chai.request(app)
                              .get(`/api/works/${work.id}`);
                 })
                 .then(function(res) {
                   expect(res).to.have.status(200);
                   expect(res).to.be.json;
                   expect(res.body.works).to.be.a("object");
                   
                   const expectedKeys = ["id", "title", "contributors", "kind", "publication_info", "identifiers", "links", "references", "contents"];
                   expect(res.body.works).to.include.keys(expectedKeys);
                   
                   expect(res.body.works).to.deep.include(work);
                 });
    });
  });
  
  describe("POST endpoint", function() {
    it("Should create a new work", function() {
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                  //console.log(creators);
                   work = {
                             title: [{
                               lang: "en",
                               name: "This is a test work"
                             }],
                             contributors: [{
                               role: "author",
                               who: res.body.creators[0].id
                             }],
                             kind: "book",
                             publication_info: {
                               year: "2017"
                             },
                             identifiers: [],
                             links: [],
                             references: [],
                             contents: []
                   };
                   
                   return chai.request(app)
                              .post("/api/works")
                              .send(work);
                 })
                 .then(function(res) {
                   expect(res).to.have.status(201);
                   expect(res).to.be.json;
                   expect(res.body).to.be.a("object");
                    
                   const expectedKeys = ["id", "title", "contributors", "kind", "publication_info", "identifiers", "links", "references", "contents"];
                   expect(res.body).to.include.keys(expectedKeys);
                   
                   expect(res.body).to.deep.equal(Object.assign(work, {id: res.body.id}));
                   });
    });
    
    it("Should create a new work with default values for non-essential properties", function() {
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                  //console.log(creators);
                   work = {
                             title: [{
                               lang: "en",
                               name: "This is a test work"
                             }],
                             contributors: [{
                               role: "author",
                               who: res.body.creators[0].id
                             }],
                             kind: "book",
                             publication_info: {
                               year: "2017"
                             }
                   };
                   
                   return chai.request(app)
                              .post("/api/works")
                              .send(work);
                 })
                 .then(function(res) {
                   expect(res).to.have.status(201);
                   expect(res).to.be.json;
                   expect(res.body).to.be.a("object");
                    
                   const expectedKeys = ["id", "title", "contributors", "kind", "publication_info", "identifiers", "links", "references", "contents"];
                   expect(res.body).to.include.keys(expectedKeys);
                   
                   const assignableFields = { id: res.body.id,
                                              identifiers: [],
                                              links: [],
                                              references: [],
                                              contents: []
                                            };
                   expect(res.body).to.deep.equal(Object.assign(work, assignableFields));
                   });
    });
    
    it("Should throw error due to missing required field", function() {
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                  //console.log(creators);
                   work = {
                             title: [{
                               lang: "en",
                               name: "This is a test work"
                             }],
                             contributors: [{
                               role: "author",
                               who: res.body.creators[0].id
                             }],
                             publication_info: {
                               year: "2017"
                             }
                   };
                   
                   return chai.request(app)
                              .post("/api/works")
                              .send(work);
                 })
                 .catch(function(err) {
                   expect(err.response).to.have.status(400);
                   expect(err.response.text).to.be.a("string");
                   expect(err.response.text).to.match(/The request is missing the field\(s\) .+/);
                 });
    });
  });
  
  describe("DELETE endpoint", function() {
    it("Should delete a work", function() {
      let id;
      return chai.request(app)
                 .get("/api/works")
                 .then(function(res) {
                   id = res.body.works[0].id;
                   
                   return chai.request(app)
                              .delete(`/api/works/${id}`);
                 })
                 .then(function(res) {
                   expect(res).to.have.status(204);
                   return Work.findById(id);
                 })
                 .then(function(work) {
                   expect(work).to.be.null;
                 });
    });
    
    it.only("Should throw an error due to incorrect id", function() {
      let id;
      return chai.request(app)
                 .get("/api/works")
                 .then(function(res) {
                   id = res.body.works[0].id;
                   
                   return chai.request(app)
                              .delete(`/api/works/${id.slice(0, id.length - 1)}`);
                 })
                 .catch(function(err) {
                   expect(err).to.have.status(500);
                   expect(err.response.text).to.match(/Internal server error/);
                 });
    });
  });
});