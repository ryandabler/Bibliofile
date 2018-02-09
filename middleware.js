"use strict";

////////////////////////////
// Utility functions
////////////////////////////
function requestHasAllRequiredFields(requestBody, requiredFieldsArr) {
  for (let n = 0; n < requiredFieldsArr.length; n++) {
    const requiredField = requiredFieldsArr[n];
    if (!(requiredField in requestBody)) {
      return false;
    }
  }
  
  return true;
}

function getMissingFields(requestBody, requiredFieldsArr) {
  return requiredFieldsArr.filter(elem => !(elem in requestBody) );
}

////////////////////////////
// Middleware
////////////////////////////
function checkRequiredFields(fieldsArr) {
  return (req, res, next) => {
    const missingFields = fieldsArr.filter(field => !(field in req.body));
    if (missingFields.length > 0) {
      next( { status: 400, message: `The request is missing the following field(s): '${missingFields.join("', '")}'` } );
    } else {
      next();
    }
  };
}

function validateIds(req, res, next) {
  (req.params.id && req.body.id && req.params.id === req.body.id)
    ? next()
    : next( { status: 400, message: "Please ensure the correctness of the ids" } );
}

function generateUpdateDocument(updateableFields) {
  return (req, res, next) => {
    const updatedDoc = {};
    updateableFields.forEach(field => {
      if (field in req.body) {
        updatedDoc[field] = req.body[field];
      }
    });
    
    res.locals.updatedDoc = updatedDoc;
    next();
  };
}

module.exports = { checkRequiredFields,
                   validateIds,
                   generateUpdateDocument
                 };