"use strict";

const mongoose = require("mongoose");

const linksSchema = mongoose.Schema({
  domain: { type: String, required: true },
  url:    { type: String, required: true }
}, { _id: false });

const awardsSchema = mongoose.Schema({
  name: { type: String, required: true },
  year: { type: String, required: true }
}, { _id: false });

const titleSchema = mongoose.Schema({
  lang: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const contributorSchema = mongoose.Schema({
  role: { type: String, required: true },
  who:  { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Creator" }
}, { _id: false });

const publicationSchema = mongoose.Schema({
  year: String,
  volume: Number,
  issue: Number,
  published_in: { type: mongoose.Schema.Types.ObjectId, ref: "Work" },
  published_by: String
}, { _id: false });

const referenceSchema = mongoose.Schema({
  kind: { type: String, required: true },
  work: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Work" }
}, { _id: false });

const contentSchema = mongoose.Schema({
  kind: String,
  number: String,
  name: String,
  author: String,
  work: { type: mongoose.Schema.Types.ObjectId, ref: "Work" }
}, { _id: false });

contentSchema.add( { contents: { type: [ contentSchema ], default: void 0 } } );

const identifierSchema = mongoose.Schema({
  type: { type: String, required: true },
  identifier: { type: String, required: true }
}, { _id: false });

module.exports = { linksSchema,
                   awardsSchema,
                   titleSchema,
                   contributorSchema,
                   publicationSchema,
                   referenceSchema,
                   contentSchema,
                   identifierSchema
                 };