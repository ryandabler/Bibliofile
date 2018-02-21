////////////////////////////
// Initialize
////////////////////////////
const chai     = require("chai");
const chaiHTTP = require("chai-http");
const mongoose = require("mongoose");
const faker    = require("faker");

const { app, runServer, closeServer } = require("../server");
const { Creator, Work } = require("../models");
const { TEST_DATABASE_URL } = require("../config");

const expect = chai.expect;
chai.use(chaiHTTP);

mongoose.Promise = global.Promise;

////////////////////////////
// Utility functions
////////////////////////////
function generateCreatorData() {
  return {
    fullname: `${faker.name.firstName()} ${faker.name.lastName()}`,
    links: [
      {
        domain: "Wikipedia",
        url: faker.internet.url()
      }
    ],
    awards: [
      {
        name: faker.lorem.words(),
        year: faker.date.past(25).getFullYear().toString()
      },
      {
        name: faker.lorem.words(),
        year: faker.date.past(25).getFullYear().toString()
      }
    ],
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
    title: [{ lang: "en",
             name: faker.lorem.words()
           }],
    contributors: { role: "author",
                    who:  creator.id
                  },
    kind: "book",
    publication_info: { year: faker.date.past(25).getFullYear().toString() },
    identifiers: [],
    links: [ { domain: faker.lorem.word(), url: faker.internet.url() } ],
    references: [],
    contents: [{
                kind: "chapter",
                name: faker.lorem.words()
    }]
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
                   expect(res.body.creators).to.be.a("object");
                   expect(res.body.creators).to.deep.equal(creator);
                 });
    });
  });

  describe("POST endpoint", function() {
    it("Should create a creator", async function() {
      const newCreatorObj = generateCreatorData();
      let   newCreator    = await Creator.create(newCreatorObj);
      newCreator = newCreator.serialize();
      
      return chai.request(app)
                 .post("/api/creators")
                 .send(newCreatorObj)
                 .then(function(res) {
                   expect(res).to.have.status(201);
                   expect(res).to.be.json;
                   expect(res.body).to.be.a("object");
                   expect(res.body).to.include.keys("id", "name", "links", "awards");
                   expect(res.body.id).to.not.equal(null);
                  
                  expect(res.body.name).to.equal(newCreator.name);
                  expect(res.body.links).to.deep.equal(newCreator.links);
                  expect(res.body.awards).deep.equal(newCreator.awards);
                  expect(res.body.works).to.deep.equal(newCreator.works);
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
                   expect(err.response.text).to.match(/{"message":"The request is missing the following field\(s\): .+"}/);
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
                           };
      
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                   const id = res.body.creators[0].id;
                   updatedCreator.id = id;
                    
                   return chai.request(app)
                              .put(`/api/creators/${id}`)
                              .send(updatedCreator);
                 })
                 .then(function(res) {
                   expect(res).to.have.status(200);
                    
                   return Creator.findById(updatedCreator.id);
                 })
                 .then(function(creator) {
                   const serialCreator = creator.serialize();
                   expect(serialCreator.links).to.deep.equal(updatedCreator.links);
                 });
    });
  
    it("Throw error on blog update due to bad id", function() {
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                   const updateId = res.body.creators[0].id;
                   const updatedCreator = { id: updateId.slice(0, updateId.length - 1),
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
                   expect(res.body.works).to.deep.equal(work);
                 });
    });
  });
  
  describe("POST endpoint", function() {
    // it("Should create a new work", function() {
    it("Should create a new work", async function() {
      const newWorkObj = await generateWorkData();
      let   newWork    = await Work.create(newWorkObj);
      newWork = newWork.serialize();
      
      return chai.request(app)
                 .post("/api/works")
                 .send(newWorkObj)
                 .then(function(res) {
                   expect(res).to.have.status(201);
                   expect(res).to.be.json;
                   expect(res.body).to.be.a("object");
                    
                   const expectedKeys = ["id", "title", "contributors", "kind", "publication_info", "identifiers", "links", "references", "contents"];
                   expect(res.body).to.include.keys(expectedKeys);
                   expect(res.body.id).to.not.equal(null);
                   
                   expect(res.body.title).to.deep.equal(newWork.title);
                   expect(res.body.contributors).to.deep.equal(newWork.contributors);
                   expect(res.body.kind).to.equal(newWork.kind);
                   expect(res.body.publication_info).to.deep.equal(newWork.publication_info);
                   expect(res.body.identifiers).to.deep.equal(newWork.identifiers);
                   expect(res.body.links).to.deep.equal(newWork.links);
                   expect(res.body.references).to.deep.equal(newWork.references);
                   expect(res.body.contents).to.deep.equal(newWork.contents);
                 });
    });
    
    it("Should create a new work with default values for non-essential properties", function() {
      const work = {
                      title: [{
                                 lang: "en",
                                 name: "This is a test work"
                             }]
                   };
                   
      return chai.request(app)
                 .post("/api/works")
                 .send(work)
                 .then(function(res) {
                   expect(res).to.have.status(201);
                   expect(res).to.be.json;
                   expect(res.body).to.be.a("object");
                   
                   const expectedKeys = ["id", "title", "contributors", "identifiers", "links", "references", "contents"];
                   expect(res.body).to.include.keys(expectedKeys);
                   
                   const assignableFields = { id: res.body.id,
                                              contributors: [],
                                              identifiers: [],
                                              links: [],
                                              references: [],
                                              contents: []
                                            };
                   expect(res.body).to.deep.equal(Object.assign(work, assignableFields));
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
    
    it("Should throw an error due to incorrect id", function() {
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
  
  describe("PUT endpoint", function() {
    it("Should update a work", function() {
      const updatedWork = {
                             links: [
                               {
                                 domain: "Google",
                                 url: "www.google.com"
                               }
                             ]
                          };
      
      return chai.request(app)
                 .get("/api/works")
                 .then(function(res) {
                   const id = res.body.works[0].id;
                   updatedWork.id = id;
                   
                   return chai.request(app)
                              .put(`/api/works/${id}`)
                              .send(updatedWork);
                 })
                 .then(function(res) {
                   expect(res).to.have.status(204);
                   
                   return Work.findById(updatedWork.id);
                 })
                 .then(function(work) {
                   const serialWork = work.serialize();
                   expect(serialWork.links).to.deep.equal(updatedWork.links);
                 });
    });
    
    it("Should throw an error due to incorrect id", function() {
      const updatedWork = {
                             links: [
                               {
                                 domain: "Google",
                                 url: "www.google.com"
                               }
                             ]
                          };
      return chai.request(app)
                 .get("/api/works")
                 .then(function(res) {
                   const id = res.body.works[0].id;
                   updatedWork.id = id;
                   
                   return chai.request(app)
                              .put(`/api/works/${id.slice(0, id.length - 1)}`)
                              .send(updatedWork);
                 })
                 .catch(function(err) {
                   expect(err).to.have.status(400);
                   expect(err.response.text).to.match(/Please ensure the correctness of the ids/);
                 });
    });
  });
});

// Search
describe("Search API", function() {
  describe("Works", function() {
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
    
    it("Should return a list of works", function() {
      let work;
      
      return chai.request(app)
                 .get("/api/works")
                 .then(function(res) {
                   work = res.body.works[0];
                   const partialTitle = work.title[0].name.slice(0, work.title[0].name.length - 1);
                   
                   return chai.request(app)
                              .get(`/api/search/works/${partialTitle}`)
                 })
                 .then(function(res) {
                   const arrayOfIds = res.body.works.map(work => work.id);
                   expect(res).to.have.status(200)
                   expect(res).to.be.json;
                   expect(res.body).to.be.a("object");
                   expect(res.body.works.length).to.be.at.least(1);
                   expect(arrayOfIds).to.include(work.id);
                 })
    });
  });
  
  describe("Creators", function() {
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
    
    it("Should return a list of creators", function() {
      let creator;
      
      return chai.request(app)
                 .get("/api/creators")
                 .then(function(res) {
                   creator = res.body.creators[0];
                   const firstName = creator.name.split(" ")[0]
                   const partialName = firstName.slice(0, firstName.length - 1);
                   
                   return chai.request(app)
                              .get(`/api/search/creators/${partialName}`)
                 })
                 .then(function(res) {
                   const arrayOfIds = res.body.creators.map(creator => creator.id);
                   expect(res).to.have.status(200)
                   expect(res).to.be.json;
                   expect(res.body).to.be.a("object");
                   expect(res.body.creators.length).to.be.at.least(1);
                   expect(arrayOfIds).to.include(creator.id);
                 })
    });
  });
});

// Conversation
describe("Conversation API", function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });
  
  after(function() {
    return closeServer();
  });
  
  it("Should return a conversation", async function() {
    // Create two works, one which references the other
    let workA, workB;
    
    return Promise.all([
      Work.create({title: [{ lang: "en", name: "Work A" }] }),
      Work.create({title: [{ lang: "en", name: "Work B" }] })
    ])
    .then(function(data) {
      [workA, workB] = data;
      workA = workA.serialize();
      workB = workB.serialize();
      workA.references = { kind: "footnote", work: workB.id };
      
      return chai.request(app)
                 .put(`/api/works/${workA.id}`)
                 .send(workA)
    })
    .then(function(response) {
      return chai.request(app)
                 .get(`/api/conversation/${workA.id}`)
    })
    .then(function(res) {
      const conversation = res.body.conversation;
      const convoIds = conversation.map(work => work.id);
      
      expect(convoIds).to.include.members([ workA.id, workB.id ]);
    });
    
  });
});