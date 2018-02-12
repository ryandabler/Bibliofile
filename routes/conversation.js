"use strict";

const express     = require("express");
const router      = express.Router();
const mongoose    = require("mongoose");
const bodyParser  = require("body-parser");
const jsonParser  = bodyParser.json();
const { Work }    = require("../models");

mongoose.Promise = global.Promise;

router.get("/:id", (req, res) => {
  const {id}  = req.params;
  Work.aggregate( [ { $match: { "_id": new mongoose.Types.ObjectId(id) } },
                    { $graphLookup: { from: "works",
                                      startWith: "$_id",
                                      connectFromField: "references.work",
                                      connectToField: "_id",
                                      as: "citations",
                                      maxDepth: 3
                                    }
                    },
                    { $project: { "citations": 1
                                }
                    }
                  ],
                  function(err, result) {
                    if (err) {
                      res.status(500).send(err);
                    } else {
                      console.log(result);
                      const conversation = result[0].citations.map(work => {
                        const newWork = new Work(work);
                        return newWork.serialize(["id", "title"]);
                      });
                      res.json( { works: conversation } );
                    }
                  }
                );
});

module.exports = { router };