"use strict";

const mongoose                      = require("mongoose");
const { linksSchema, awardsSchema } = require("./helpers");

const creatorSchema = mongoose.Schema({
  name:    {
              first:  String,
              middle: String,
              last:  { type: String, required: true}
           },
  links:   [ linksSchema ],
  awards:  [ awardsSchema ],
  created: { type: String, default: Date.now }
}, { toJSON: { virtuals: true}, toObject: { virtuals: true } });

creatorSchema.virtual("fullname")
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

creatorSchema.virtual("works", {
  ref: "Work",
  localField: "_id",
  foreignField: "contributors.who"
});

creatorSchema.methods.serialize = function(fieldsArr = null) {
  const creatorObj = this.toObject();
  let   creator    = {
                        id:     creatorObj._id,
                        name:   creatorObj.fullname,
                        links:  creatorObj.links,
                        awards: creatorObj.awards,
                        works:  creatorObj.works
                     },
      filteredCreator;
  
  if (fieldsArr) {
    filteredCreator = {};
    fieldsArr.forEach(field => {
      filteredCreator[field] = creator[field];
    });
  }
  
  return filteredCreator ? filteredCreator : creator;
};

creatorSchema.methods.populatedSerialize = function() {
  const creator = this.toObject();
  
  // Revise list of works to only be title and publication year
  const revisedWorks = creator.works.map(work => {
    let title = work.title.find(title => title.lang === "en").name,
        id    = work._id;
    
    return { id, title };
  });
  
  return {
    id:     this._id,
    name:   this.fullname,
    links:  this.links,
    awards: this.awards,
    works:  revisedWorks
  };
};

creatorSchema.statics.getFindMethod = function(id = null) {
  return id ? Creator.findById(id) : Creator.find();
};

creatorSchema.statics.findAndPopulate = function(id = null) {
  return this.getFindMethod(id)
             .populate( { path: "works", select: "id title publication_info" } );
};

const Creator = mongoose.model("Creator", creatorSchema);

module.exports = { Creator };