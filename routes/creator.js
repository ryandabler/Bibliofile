"use strict";

const express     = require("express");
const router      = express.Router();
const bodyParser  = require("body-parser");
const jsonParser  = bodyParser.json();
const { Creator } = require("../models");
const { checkRequiredFields,
        validateIds,
        generateUpdateDocument } = require("../middleware");

router.get("/", (req, res) => {
  Creator.findAndPopulate()
         .then(creators => {
            res.json( { creators: creators.map(creator => creator.populatedSerialize()) } );
          })
          .catch(err => {
            console.error(err);
            res.status(500).json( { message: "Internal server error" } );
          });
});

router.get("/:id", (req, res) => {
  const {id} = req.params;
  Creator.findAndPopulate(id)
         .then(creator => {
           res.json( { creators: creator.populatedSerialize() } );
         })
         .catch(err => {
           console.error(err);
           res.status(500).json( { message: "Internal server error" } );
         });
});

router.post(
  "/",
  jsonParser,
  checkRequiredFields(["fullname"]),
  (req, res) => {
    const {fullname, links, awards} = req.body;
    
    Creator.create({fullname, links, awards})
           .then(creator => res.status(201).json(creator.serialize()))
           .catch(err => {
             console.error(err);
             res.status(500).json( { message: "Internal server error" } );
           });
  }
);

router.delete("/:id", (req, res) => {
  const {id} = req.params;
  
  // Check that ID exists in data
  Creator.findByIdAndRemove(id)
         .then(creator => res.status(204).end())
         .catch(err => {
           console.error(err);
           res.status(500).json( { message: "Internal server error" } );
         });
});

router.put(
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

module.exports = { router };