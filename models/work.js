"use strict";

const mongoose              = require("mongoose");
const { titleSchema,
        contributorSchema,
        publicationSchema,
        identifierSchema,
        linksSchema,
        referenceSchema,
        contentSchema }     = require("./helpers");

const workSchema = mongoose.Schema({
  title:            { type: [ titleSchema ], required: true },
  contributors:     { type: [ contributorSchema ], required: true },
  kind:             String,
  publication_info: publicationSchema,
  identifiers:      [ identifierSchema ],
  links:            [ linksSchema ],
  references:       [ referenceSchema ],
  contents:         [ contentSchema ]
});

workSchema.methods.serialize = function(fieldsArr = null) {
  const workObj = this.toObject();
  let   work = {
                id:               workObj._id.toString(),
                title:            workObj.title,
                contributors:     workObj.contributors.map(contributor => contributor.who.toString()),
                kind:             workObj.kind,
                publication_info: workObj.publication_info,
                identifiers:      workObj.identifiers,
                links:            workObj.links,
                references:       workObj.references,
                contents:         workObj.contents
             },
      filteredWork;
  
  if (fieldsArr) {
    filteredWork = {};
    fieldsArr.forEach(field => {
      filteredWork[field] = work[field];
    });
  }
  
  return filteredWork ? filteredWork : work;
};

workSchema.methods.populatedSerialize = function() {
  const work = this.toObject();
  
  // Revised populated contributors to only show full name
  work.contributors.forEach(contributor => {
    contributor.id  = contributor.who.id;
    contributor.fullname = contributor.who.fullname;
    delete contributor.who;
  });
  
  // Revise published_in (if it exists) in publication info with English title
  if (work.publication_info && work.publication_info.published_in) {
    let title = work.publication_info.published_in.title.find(elem => elem.lang === "en");
    
    work.publication_info.published_in = title.name;
  }
  
  // Revise references (if any exist)
  work.references.forEach(reference => {
    reference.id = reference.work._id;
    reference.title = reference.work.title.find(elem => elem.lang === "en").name;
    delete reference.work;
  });
  
  // Revise contents (if it exists) if any were populated with info from a linked document
  work.contents.forEach(content => {
    if (content.work) {
      let title = content.work.title.find(elem => elem.lang === "en");
      content.name = title.name;
      
      let author = content.work.contributors.find(elem => elem.role === "author");
      
      // If work has no contributor, make content.author = null
      content.author = author ? author.who.fullname : null;
      content.kind = content.work.kind;
      
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

workSchema.statics.getFindMethod = function(id = null) {
  return id ? Work.findById(id) : Work.find();
};

workSchema.statics.findAndPopulate = function(id = null) {
  return this.getFindMethod(id)
             .populate( { path: "contributors.who", select: "name" } )
             .populate( { path: "publication_info.published_in", select: "title" } )
             .populate( { path: "contents.work", select: "title contributors kind",
                          populate: { path: "contributors.who", select: "name" }
                        })
             .populate( { path: "references.work", select: "title" } );
};

workSchema.statics.removeContributor = function(id) {
  return Work.update( { },
                      { $pull: { contributors: { who: new mongoose.Types.ObjectId(id) } } },
                      { multi: true }
                    );
};

const Work = mongoose.model("Work", workSchema);

module.exports = { Work };