////////////////////////////
// Initialize
////////////////////////////
const express       = require("express");
const routerCreator = express.Router();
const routerWork    = express.Router();

const bodyParser    = require("body-parser");
const jsonParser    = bodyParser.json();
const mongoose      = require("mongoose");

const { Creator, Work }   = require("./models");

////////////////////////////
// Utility functions
////////////////////////////
function requestHasAllRequiredFields(requestBody, requiredFieldsArr) {
  for (let n = 0; n < requiredFieldsArr.length; n++) {
    const requiredField = requiredFieldsArr[n];
    if (!(requiredField in requestBody)) {
      return false;
    }
  }
  
  return true;
}

function getMissingFields(requestBody, requiredFieldsArr) {
  return requiredFieldsArr.filter(elem => !(elem in requestBody) );
}

////////////////////////////
// Middleware
////////////////////////////
function checkRequiredFields(fieldsArr) {
  return (req, res, next) => {
    const missingFields = fieldsArr.filter(field => !(field in req.body));
    if (missingFields.length > 0) {
      next( { status: 400, message: `The request is missing the following field(s): '${missingFields.join("', '")}'` } );
    } else {
      next();
    }
  };
}

function validateIds(req, res, next) {
  (req.params.id && req.body.id && req.params.id === req.body.id)
    ? next()
    : next( { status: 400, message: "Please ensure the correctness of the ids" } );
}

function generateUpdateDocument(updateableFields) {
  return (req, res, next) => {
    const updatedDoc = {};
    updateableFields.forEach(field => {
      if (field in req.body) {
        updatedDoc[field] = req.body[field];
      }
    });
    
    res.locals.updatedDoc = updatedDoc;
    next();
  };
}

////////////////////////////
// Set up routes
////////////////////////////

// Creator route
routerCreator.get("/", (req, res) => {
  Creator.findAndPopulate()
         .then(creators => {
            res.json( { creators: creators.map(creator => creator.populatedSerialize()) } );
          })
          .catch(err => {
            console.error(err);
            res.status(500).json( { message: "Internal server error" } );
          });
});

routerCreator.get("/:id", (req, res) => {
  const {id} = req.params;
  Creator.findAndPopulate(id)
         .then(creator => res.json(creator.populatedSerialize()))
         .catch(err => {
           console.error(err);
           res.status(500).json( { message: "Internal server error" } );
         });
});

routerCreator.post(
  "/",
  jsonParser,
  checkRequiredFields(["fullName"]),
  (req, res) => {
    const {fullName, links, awards} = req.body;
    
    Creator.create({fullName, links, awards})
           .then(creator => res.status(201).json(creator.serialize()))
           .catch(err => {
             console.error(err);
             res.status(500).json( { message: "Internal server error" } );
           });
  }
);

routerCreator.delete("/:id", (req, res) => {
  const {id} = req.params;
  
  // Check that ID exists in data
  Creator.findByIdAndRemove(id)
         .then(creator => res.status(204).end())
         .catch(err => {
           console.error(err);
           res.status(500).json( { message: "Internal server error" } );
         });
});

routerCreator.put(
  "/:id",
  jsonParser,
  validateIds,
  generateUpdateDocument(["fullName", "awards", "links"]),
  (req, res) => {
    const {id} = req.params;
    
    Creator.findByIdAndUpdate(id, res.locals.updatedDoc)
           .then(updatedCreator => res.status(200).end())
           .catch(err => {
             console.error(err);
             res.status(500).json( { message: "Internal server error" } );
           });
});

// Work route
routerWork.get("/", (req, res) => {
  Work.findAndPopulate()
      .then(works => {
        res.json( { works: works.map(work => work.populatedSerialize()) } );
      })
      .catch(err => {
        console.error(err);
        res.status(500).json( { message: "Internal server error" } );
      });
});

routerWork.get("/:id", (req, res) => {
  const {id} = req.params;
  Work.findAndPopulate(id)
      .then(work => {
        res.json( { works: work.populatedSerialize() } );
      })
      .catch(err => {
        console.error(err);
        res.status(500).json( { message: "Internal server error" } );
      });
});

routerWork.post(
  "/",
  jsonParser,
  checkRequiredFields(["title", "contributors", "kind"]),
  (req, res) => {
    const {title, contributors, kind, publication_info, identifiers, links, references, contents} = req.body;
    Work.create({title, contributors, kind, publication_info, identifiers, links, references, contents})
        .then(work => res.status(201).json(work.serialize()))
        .catch(err => {
          console.error(err);
          res.status(500).json( { message: "Internal server error" } );
        });
  }
);

routerWork.delete("/:id", (req, res) => {
  let {id} = req.params;
  Work.findByIdAndRemove(id)
      .then(work => res.status(204).end())
      .catch(err => {
        console.error(err);
        res.status(500).json( { message: "Internal server error" } );
      });
});

routerWork.put(
  "/:id",
  jsonParser,
  validateIds,
  generateUpdateDocument(["title", "contributors", "kind", "publication_info", "identifiers", "links", "references", "contents"]),
  (req, res) => {
    const {id} = req.params;
    
    Work.findByIdAndUpdate(id, res.locals.updatedDoc)
        .then(updatedWork => res.status(200).end())
        .catch(err => {
          console.error(err);
          res.status(500).json( { message: "Internal server error" } );
        });
});

////////////////////////////
// Export routers
////////////////////////////
module.exports = { routerCreator, routerWork };