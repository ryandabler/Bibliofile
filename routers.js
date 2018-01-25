////////////////////////////
// Initialize
////////////////////////////
const express       = require('express');
const routerCreator = express.Router();
const routerWork    = express.Router();

const bodyParser    = require('body-parser');
const jsonParser    = bodyParser.json();
const mongoose      = require("mongoose");

const { Creator, Work }   = require('./models');

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
// Set up routes
////////////////////////////

// Creator route
routerCreator.get("/", (req, res) => {
  Creator.find()
         .then(creators => {
            res.json( { creators: creators.map(creator => creator.serialize()) } );
          })
          .catch(err => {
            console.error(err);
            res.status(500).json( { message: "Internal server error" } );
          });
});

routerCreator.get("/:id", (req, res) => {
  const {id} = req.params;
  Creator.findById(id)
         .then(creator => res.json(creator.serialize()))
         .catch(err => {
           console.error(err);
           res.status(500).json( { message: "Internal server error" } );
         });
});

routerCreator.post("/", jsonParser, (req, res) => {
  // Check that all required fields have been added
  const requiredFields = ["fullName"];
  if (!requestHasAllRequiredFields(req.body, requiredFields)) {
    const message = `The request is missing the field(s) "${getMissingFields(req.body, requiredFields).join(", ")}".`;
    console.error(message);
    return res.status(400).send(message);
  }
  
  // Create new creator
  const {fullName, links, awards} = req.body;
  
  Creator.create({fullName, links, awards})
         .then(creator => res.status(201).json(creator.serialize()))
         .catch(err => {
           console.error(err);
           res.status(500).json( { message: "Internal server error" } );
         });
});

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

routerCreator.put("/:id", jsonParser, (req, res) => {
  const {id} = req.params;
  
  // Check that ID is correct
  if (req.params.id && req.body.id && id === req.body.id) {
    // Update blog post
    const updatedCreator = {};
    const updateableFields = ["fullName", "awards", "links"];
    updateableFields.forEach(field => {
      if (field in req.body) {
        updatedCreator[field] = req.body[field];
      }
    });
    
    Creator.findByIdAndUpdate(id, updatedCreator)
           .then(updatedCreator => res.status(200).end())
           .catch(err => {
             console.error(err);
             res.status(500).json( { message: "Internal server error" } );
           });
  } else {
    res.status(400).json( { message: "Please ensure the correctness of the ids" } );
  }
});

// Work route
routerWork.get("/", (req, res) => {
  Work.find()
      .populate( { path: "contributors.who", select: "name" } )
      .populate( { path: "publication_info.published_in", select: "title" } )
      .populate( { path: "contents.work", select: "title contributors",
                   populate: { path: "contributors.who", select: "name" }
                 } )
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
  Work.findById(id)
      .populate( { path: "contributors.who", select: "name" } )
      .populate( { path: "publication_info.published_in", select: "title" } )
      .populate( { path: "contents.work", select: "title contributors",
                   populate: { path: "contributors.who", select: "name" }
                 } )
      .then(work => {
        res.json( { works: work.populatedSerialize() } );
      })
      .catch(err => {
        console.error(err);
        res.status(500).json( { message: "Internal server error" } );
      });
});

routerWork.post("/", jsonParser, (req, res) => {
  // Check that all required fields have been added
  const requiredFields = ["title", "contributors", "kind"];
  if (!requestHasAllRequiredFields(req.body, requiredFields)) {
    const message = `The request is missing the field(s) "${getMissingFields(req.body, requiredFields).join(", ")}".`;
    console.error(message);
    return res.status(400).send(message);
  }
  
  // Create new work
  const {title, contributors, kind, publication_info, identifiers, links, references, contents} = req.body;
  Work.create({title, contributors, kind, publication_info, identifiers, links, references, contents})
      .then(work => res.status(201).json(work.serialize()))
      .catch(err => {
        console.error(err);
        res.status(500).json( { message: "Internal server error" } );
      });
});

routerWork.delete("/:id", (req, res) => {
  let {id} = req.params;
  Work.findByIdAndRemove(id)
      .then(work => res.status(204).end())
      .catch(err => {
        console.error(err);
        res.status(500).json( { message: "Internal server error" } );
      });
});

////////////////////////////
// Export routers
////////////////////////////
module.exports = { routerCreator, routerWork };