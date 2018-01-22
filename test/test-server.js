const chai = require("chai");
const chaiHTTP = require("chai-http");
const expect = chai.expect;
const {app, runServer, closeServer} = require("../server");

chai.use(chaiHTTP);

describe("Test root", function() {
  before(function() {
    return runServer();
  });
  
  after(function() {
    return closeServer();
  });
  
  it("Should load root", function() {
    return chai.request(app)
               .get("/")
               .then(function(res) {
                 expect(res).to.have.status(200);
                 expect(res).to.be.html;
               });
  });
});

