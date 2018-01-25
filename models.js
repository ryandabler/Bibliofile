"use strict";

const mongoose = require("mongoose");

////////////////////////////
// Set up sub-schemas
////////////////////////////
const linksSchema = mongoose.Schema({
  domain: { type: String, required: true },
  url:    { type: String, required: true }
}, { _id: false });

const awardsSchema = mongoose.Schema({
  award_name: { type: String, required: true },
  award_year: { type: String, required: true }
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
  kind: { type: String, required: true },
  identifier: { type: String, required: true }
}, { _id: false });

////////////////////////////
// Set up creator data model
////////////////////////////
const creatorSchema = mongoose.Schema({
  name: {
           first:  String,
           middle: String,
           last:  { type: String, required: true}
        },
  links: [ linksSchema ],
  awards: [ awardsSchema ],
  created: { type: String, default: Date.now }
}, { toJSON: { virtuals: true}, toObject: { virtuals: true } });

creatorSchema.virtual("fullName")
  .get(function() {
    const nameFields = ["first", "middle", "last"];
    let fullName = "";
    
    nameFields.forEach(nameField => {
      if (this.name.hasOwnProperty(nameField) && this.name[nameField]) {
        fullName += `${this.name[nameField]} `;
      }
    });
    
    return fullName.trim();
  })
  .set(function(fullName) {
    const splitAuthor = fullName.split(" ");
    
    if (splitAuthor.length === 1) {
      this.name.last = splitAuthor[0];
    } else {
      this.name.first = splitAuthor[0];
      this.name.last  = splitAuthor[splitAuthor.length - 1];
    
      if (splitAuthor.length >= 3) {
        this.name.middle = splitAuthor.slice(1, splitAuthor.length - 1).join(" ");
      }
    }
  });
  
creatorSchema.methods.serialize = function() {
  return {
    id:     this._id,
    name:   this.fullName,
    links:  this.links,
    awards: this.awards,
  };
};

const Creator = mongoose.model("Creator", creatorSchema);

////////////////////////////
// Set up work data model
////////////////////////////
const workSchema = mongoose.Schema({
  title:            { type: [ titleSchema ], required: true },
  contributors:     { type: [ contributorSchema ], required: true },
  kind:             { type: String, required: true},
  publication_info: publicationSchema,
  identifiers:      [ identifierSchema ],
  links:            [ linksSchema ],
  references:       [ referenceSchema ],
  contents:         [ contentSchema ]
});

workSchema.methods.serialize = function() {
  return {
    id:               this._id,
    title:            this.title,
    contributors:     this.contributors,
    kind:             this.kind,
    publication_info: this.publication_info,
    identifiers:      this.identifiers,
    links:            this.links,
    references:       this.references,
    contents:         this.contents
  };
};

workSchema.methods.populatedSerialize = function() {
  const work = this.toObject();
  
  // Revised populated contributors to only show full name
  work.contributors.forEach(contributor => {
    contributor.who = contributor.who.fullName;
  });
  
  // Revise published_in (if it exists) in publication info with English title
  if (work.publication_info.published_in) {
    let title = work.publication_info.published_in.title.find(elem => elem.lang === "en");
    
    work.publication_info.published_in = title.name;
  }
  
  // Revise contents (if it exists) if any were populated with info from a linked document
  work.contents.forEach(content => {
    if (content.work) {
      let title = content.work.title.find(elem => elem.lang === "en");
      content.name = title.name;
      
      let author = content.work.contributors.find(elem => elem.role === "author");
      content.author = author.who.fullName;
      
      delete content.work;
    }
  });
  
  // Return
  return {
    id:               work._id,
    title:            work.title,
    contributors:     work.contributors,
    kind:             work.kind,
    publication_info: work.publication_info,
    identifiers:      work.identifiers,
    links:            work.links,
    references:       work.references,
    contents:         work.contents
  };
};

const Work = mongoose.model("Work", workSchema);

////////////////////////////
// Export models
////////////////////////////
module.exports = { Creator, Work };