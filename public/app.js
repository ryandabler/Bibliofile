"use strict";

//////////////////////
// ONLY FOR TESTING PURPOSES
//////////////////////
const API_WORK_ENDPOINT    = "http://localhost:8080/api/works",
      API_CREATOR_ENDPOINT = "http://localhost:8080/api/creators",
      API_GENERIC_ENDPOINT = "http://localhost:8080/api";
//////////////////////
//
//////////////////////

const APP_STATE = {
  currentlyLoaded: null,
  data: [],
  currentItem: null
};

function renderListOfItemsToDOM(data, htmlIdToAppendTo) {
  const $htmlElement = $(`#${htmlIdToAppendTo}`);
  
  data[APP_STATE.currentlyLoaded].forEach(item => {
    const $li = $("<li>");
    $li.addClass("result clickable");
    $li.attr("id", item.id);
    $li.text(item.name);
    $htmlElement.append($li);
  });
}

function renderItemToDOM(data) {
  
}

function queryAPI(endpointURL, dataType, method, queryObj = {}) {
  const ajaxRequestObject = {
                               url:       endpointURL,
                               dataType:  dataType,
                               method:    method//,
                               //data:      queryObj
                            };
                            
  return $.ajax(ajaxRequestObject);
}

function getListOfItems(type) {
  // Return an IIFE in order to be able to use promise chaining in the
  // function that invokes getListOfItems();
  return (function() {
    APP_STATE.currentlyLoaded = type;
    return queryAPI(`${API_GENERIC_ENDPOINT}/${type}`, "json", "GET");
  })();
}

function getItemDetails(event) {
  const API_URL = `${API_GENERIC_ENDPOINT}/${APP_STATE.currentlyLoaded}/${this.id}`;
  queryAPI(API_URL, "json", "GET").then(console.log);
}

function addEventListeners() {
  $("#list-of-items").on("click", "li", getItemDetails)
  // $("#result-type")       .change  (displayUserMessage);
  // $(".user-msg")          .click   (inputEventHandler);
  // $("#favorite-book-txt") .keypress(displayUserMessage);
  // $("#favorite-band-txt") .keypress(displayUserMessage);
  // $("#favorite-movie-txt").keypress(displayUserMessage);
  // $("#results-menu")      .on      ("click", "li", switchDisplayDiv);
  // $("#results-menu")      .on      ("keypress", "li", switchDisplayDiv);
  // $("#reset-btn")         .click   (resetApp);
}

function loadData(data) {
  APP_STATE.data.push(...data[APP_STATE.currentlyLoaded]);
}

function processGETListData(data) {
  loadData(data);
  renderListOfItemsToDOM(data, "list-of-items");
}

function initApp() {
  Object.seal(APP_STATE);
  
  addEventListeners();
  getListOfItems("creators").then(processGETListData)
                     .catch(err => console.log(err));
}

$(initApp);