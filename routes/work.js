"use strict";

const express     = require("express");
const router      = express.Router();
const bodyParser  = require("body-parser");
const jsonParser  = bodyParser.json();
const { Work }    = require("../models");
const { checkRequiredFields,
        validateIds,
        generateUpdateDocument } = require("../middleware");

router.get("/", (req, res) => {
  Work.findAndPopulate()
      .then(works => {
        res.json( { works: works.map(work => work.populatedSerialize()) } );
      })
      .catch(err => {
        console.error(err);
        res.status(500).json( { message: "Internal server error" } );
      });
});

router.get("/:id", (req, res) => {
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

router.post(
  "/",
  jsonParser,
  checkRequiredFields(["title"]),
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

router.delete("/:id", (req, res) => {
  let {id} = req.params;
  Work.findByIdAndRemove(id)
      .then(work => res.status(204).end())
      .catch(err => {
        console.error(err);
        res.status(500).json( { message: "Internal server error" } );
      });
});

router.put(
  "/:id",
  jsonParser,
  validateIds,
  generateUpdateDocument(["title", "contributors", "kind", "publication_info", "identifiers", "links", "references", "contents"]),
  (req, res) => {
    const {id} = req.params;
    
    Work.findByIdAndUpdate(id, res.locals.updatedDoc)
        .then(updatedWork => res.status(204).end())
        .catch(err => {
          console.error(err);
          res.status(500).json( { message: "Internal server error" } );
        });
});

module.exports = { router };