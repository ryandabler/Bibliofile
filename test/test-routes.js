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

//   describe("POST endpoint", function() {
//     it("Should create a blog post", function() {
//       const newBlog = generateBlogData();
//       newBlog.author = `${newBlog.author.firstName} ${newBlog.author.lastName}`;
      
//       return chai.request(app)
//                 .post("/blog-posts")
//                 .send(newBlog)
//                 .then(function(res) {
//                   expect(res).to.have.status(201);
//                   expect(res).to.be.json;
//                   expect(res.body).to.be.a("object");
//                   expect(res.body).to.include.keys("id", "title", "content", "author", "created");
//                   expect(res.body.id).to.not.equal(null);
//                   expect(res.body).to.deep.equal(Object.assign(newBlog, {id: res.body.id}));
                   
//                   return BlogPost.findById(res.body.id);
//                 })
//                 .then(function(blogPost) {
//                   const blogAuthor = `${blogPost.author.firstName} ${blogPost.author.lastName}`;
                   
//                   expect(blogAuthor).to.equal(newBlog.author);
//                   expect(blogPost.title).to.equal(newBlog.title);
//                   expect(blogPost.content).to.equal(newBlog.content);
//                   expect(blogPost.created).to.equal(newBlog.created);
//                   expect(blogPost.id).to.equal(newBlog.id);
//                 });
//     });
  
//     it("Throw error on blog post creation due to missing field on POST method", function() {
//       const badBlog = { title: "Test post",
//                         content: "Test content"
//                       };
//       return chai.request(app)
//                 .post("/blog-posts")
//                 .send(badBlog)
//                 .catch(function(err) {
//                   expect(err.response).to.have.status(400);
//                   expect(err.response.text).to.be.a("string");
//                   expect(err.response.text).to.match(/The request is missing the field\(s\) .+/);
//                 });
//     });
//   });
  
//   describe("DELETE endpoint", function() {
//     it("Should delete a restaurant by id", function() {
//       let deleteId;
//       return chai.request(app)
//                 .get("/blog-posts")
//                 .then(function(res) {
//                   deleteId = res.body.blogPosts[0].id;
//                   return chai.request(app)
//                               .delete(`/blog-posts/${deleteId}`);
//                 })
//                 .then(function(res) {
//                   expect(res).to.have.status(204);
//                   return BlogPost.findById(deleteId);
//                 })
//                 .then(function(blogPost) {
//                   expect(blogPost).to.be.null;
//                 });
//     });
    
//     it("Throw error due to incorrect id", function() {
//       return chai.request(app)
//                 .get("/blog-posts")
//                 .then(function(res) {
//                   const deleteId = res.body.blogPosts[0].id;
//                   return chai.request(app)
//                               .delete(`/blog-posts/${deleteId.slice(0, deleteId.length - 1)}`);
//                 })
//                 .catch(function(err) {
//                   expect(err.response).to.have.status(500);
//                   expect(err.response.text).to.be.a("string");
//                   expect(err.response.text).to.match(/Internal server error/);
//                 });
//     });
//   });
  
//   describe("PUT endpoint", function() {
//     it("Update blog post", function() {
//       let updatedPost = { title:   "Test update",
//                           author:  "Test author"
//                         },
//           originalPost;
      
//       return chai.request(app)
//                 .get("/blog-posts")
//                 .then(function(res) {
//                   originalPost = res.body.blogPosts[0];
//                   updatedPost.id = originalPost.id;
                   
//                   return chai.request(app)
//                               .put(`/blog-posts/${originalPost.id}`)
//                               .send(updatedPost);
//                 })
//                 .then(function(res) {
//                   expect(res).to.have.status(200);
                   
//                   return BlogPost.findById(updatedPost.id);
//                 })
//                 .then(function(blogPost) {
//                   const blogAuthor = `${blogPost.author.firstName} ${blogPost.author.lastName}`.trim();
//                   expect(blogAuthor).to.equal(updatedPost.author);
//                   expect(blogPost.title).to.equal(updatedPost.title);
//                   expect(blogPost.content).to.equal(originalPost.content);
//                 });
//     });
//   });
  
//   it("Throw error on blog update due to bad id", function() {
//     return chai.request(app)
//               .get("/blog-posts")
//               .then(function(res) {
//                 const updateId = res.body.blogPosts[0].id;
//                 const updatedPost = { id:       updateId.slice(0, updateId.length - 1),
//                                       title:   "Test update",
//                                       content: "Test update test update",
//                                     };
//                 return chai.request(app)
//                             .put(`/blog-posts/${updateId}`)
//                             .send(updatedPost);
//               })
//               .catch(function(err) {
//                 expect(err.response).to.have.status(400);
//                 expect(err.response.text).to.be.a("string");
//                 expect(err.response.text).to.match(/Please ensure the correctness of the ids/);
//               });
//   });
});