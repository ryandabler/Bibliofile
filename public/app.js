"use strict";

//////////////////////
// ONLY FOR TESTING PURPOSES
//////////////////////
const API_WORK_ENDPOINT    = "localhost:8080/api/works",
      API_CREATOR_ENDPOINT = "localhost:8080/api/creators";
//////////////////////
//
//////////////////////

function renderListToDOM(data, htmlIdToAppendTo) {
  const $htmlElement = $(`#${htmlIdToAppendTo}`);
  console.log(data);
}

function queryAPI(endpointURL, dataType, method, queryObj = {}) {
  const ajaxRequestObject = {
                               url:       endpointURL,
                               dataType:  dataType,
                               method:    method//,
                               //data:      queryObj
                            };
                            
  return $.ajax(ajaxRequestObject)
          .then(function(data) {
            renderListToDOM(data, "list-of-creators");
          })
          .catch(err => console.log(err));
}

function getListOfCreators() {
  return queryAPI("http://localhost:8080/api/creators", "json", "GET");
}

function addEventListeners() {
  // $("#result-type")       .change  (displayUserMessage);
  // $(".user-msg")          .click   (inputEventHandler);
  // $("#favorite-book-txt") .keypress(displayUserMessage);
  // $("#favorite-band-txt") .keypress(displayUserMessage);
  // $("#favorite-movie-txt").keypress(displayUserMessage);
  // $("#results-menu")      .on      ("click", "li", switchDisplayDiv);
  // $("#results-menu")      .on      ("keypress", "li", switchDisplayDiv);
  // $("#reset-btn")         .click   (resetApp);
}

function initApp() {
  addEventListeners();
  const a = getListOfCreators();
  a
}

$(initApp);