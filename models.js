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

////////////////////////////
// Set up creator data model
////////////////////////////
const creatorSchema = mongoose.Schema({
  name:   {
            first:  String,
            middle: String,
            last:  { type: String, required: true}
          },
  links:  [ linksSchema ],
  awards: [ awardsSchema ],
  created: { type: String, default: Date.now }
});

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


////////////////////////////
// Export models
////////////////////////////
module.exports = { Creator };