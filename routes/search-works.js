"use strict";

const express     = require("express");
const router      = express.Router();
const bodyParser  = require("body-parser");
const jsonParser  = bodyParser.json();
const mongoose    = require("mongoose");
const { Work }    = require("../models");

router.get("/:string", (req, res) => {
  const { string } = req.params;
  Work.find( { "title.name": { $regex: new RegExp(string, "i") } } )
      .then(works => {
        res.json( { works: works.map(work => work.serialize()) } );
      });
});

module.exports = { router };