"use strict";

const express     = require("express");
const router      = express.Router();
const bodyParser  = require("body-parser");
const jsonParser  = bodyParser.json();
const mongoose    = require("mongoose");
const { Creator } = require("../models");

router.get("/:string", (req, res) => {
  const { string } = req.params,
        regex      = new RegExp(string, "i");
        
  Creator.find( { "$or": [
      { "name.last": { $regex: regex } },
      { "name.first": { $regex: regex } },
      { "name.middle": { $regex: regex } }
    ] } )
    .then(creators => {
      res.json( { creators: creators.map(creator => creator.serialize(["id", "name"])) } );
    });
});

module.exports = { router };