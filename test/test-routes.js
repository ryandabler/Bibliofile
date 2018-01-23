const chai     = require("chai");
const chaiHTTP = require("chai-http");
const mongoose = require("mongoose");
const faker    = require("faker");

const { app, runServer, closeServer } = require("../server");
const { Creator } = require("../models");
const { TEST_DATABASE_URL } = require("../config");

const expect = chai.expect;
chai.use(chaiHTTP);

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

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

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