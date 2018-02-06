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
  currentItem: null,
  editedItem: null
};

//////////////////////
// DOM functions
//////////////////////
function createListItem(item) {
  // This function can be called on works or creators
  // Both have an id field, however, the other field is either "name" or "title"
  // Currently we are defaulting to the English title
  const $li = $("<li>");
  $li.addClass("result clickable");
  $li.attr("id", item.id);
  $li.text(item.name || item.title.find(elem => elem.lang === "en").name);
  
  return $li;
}

function renderListOfItemsToDOM(data, htmlIdToAppendTo) {
  const $htmlElement = $(`#${htmlIdToAppendTo}`);
  
  data[APP_STATE.currentlyLoaded].forEach(item => {
    const $li = createListItem(item);
    $htmlElement.append($li);
  });
}

function createLink(link) {
  const $li = $("<li>"),
        $a  = $("<a>");
  
  $li.addClass("result clickable");
  $a.attr("href", link.url);
  $a.text(link.domain);
  
  $li.append($a);
  return $li;
}

function createAward(award) {
  
}

function createWork(work) {
  const $li   = $("<li>"),
        $span = $("<span>");
  
  $li.addClass("result clickable");
  $li.attr("id", work.id);
  $li.text(work.title);
  
  if (work.year) {
    $span.addClass("additional-info");
    $span.text(`(${work.year})`);
    $li.append($span);
  }
  
  return $li;
}

function createTitle(title) {
  const $li = $("<li>");
        
  $li.addClass("result clickable");
  $li.text(title.name);
  
  return $li;
}

function createContributor(contributor) {
  const $li   = $("<li>"),
        $span = $("<span>");
  
  $li.addClass("result clickable");
  $li.attr("id", contributor.id);
  $li.text(contributor.fullname);
  
  $span.addClass("additional-info");
  $span.text(`(${contributor.role})`);
  $li.append($span);
  
  return $li;
}

function createContent(content) {
  const $li = $("<li>");
        
  $li.addClass("result clickable");
  $li.text(content.name);
  
  return $li;
}

function createContents(contents) {
  let contentsList = [];
  // Needs to happen recursively because of the fact that TOCs can be
  // broken into parts and further broken into chapters
  contents.forEach(content => {
    contentsList.push(createContent(content));
    if(content.contents) {
      // Recursive
      const toAppendList = createContents(content.contents, contentsList);
      contentsList = contentsList.concat(toAppendList);
    }
  });
  
  return contentsList;
}

function createReference(reference) {
  const $li   = $("<li>"),
        $span = $("<span>");
  
  $li.addClass("result clickable");
  $li.attr("id", reference.work.id);
  $li.text(reference.work.title);
  
  $span.addClass("additional-info");
  $span.text(`(${reference.kind})`);
  $li.append($span);
  
  return $li;
}

function createIdentifier(identifier) {
  const $li   = $("<li>");
  
  $li.addClass("result clickable");
  $li.attr("id", identifier.identifier);
  $li.html(`<b>${identifier.type}</b>: ${identifier.identifier}`);
  
  return $li;
}

/////////// THESE TWO FUNCTIONS CAN LIKELY BE COMBINED
// generatorObj = { fn: dataSegment.map, param: generatorFn
function testrenderSection(sectionName, dataSegment, generatorObj) {
  //generatorObj.fn.apply(dataSegment);
  console.log(dataSegment, generatorObj, generatorObj.param);
  if(dataSegment.length === 0) {
    $(`#item-${sectionName}`).addClass("hidden js-empty");
    $(`#item-${sectionName}-list`).empty();
  } else {
    $(`#item-${sectionName}`).removeClass("hidden js-empty");
    const items = eval(generatorObj.fn(generatorObj.param));
    $(`#item-${sectionName}-list`).append(items);
  }
}

function renderSection(sectionName, dataSegment, generatorFn) {
  if(dataSegment.length === 0) {
    $(`#item-${sectionName}`).addClass("hidden js-empty");
    $(`#item-${sectionName}-list`).empty();
  } else {
    $(`#item-${sectionName}`).removeClass("hidden js-empty");
    const items = dataSegment.map(generatorFn);
    $(`#item-${sectionName}-list`).append(items);
  }
}

function renderContents(sectionName, dataSegment) {
  if(dataSegment.length === 0) {
    $(`#item-${sectionName}`).addClass("hidden js-empty");
    $(`#item-${sectionName}-list`).empty();
  } else {
    $(`#item-${sectionName}`).removeClass("hidden js-empty");
    const items = createContents(dataSegment);
    $(`#item-${sectionName}-list`).append(items);
  }
}

function renderInformation(sectionName, dataSegments) {
  // dataSegments is an array. The first element is the 'kind' property.
  // The second element is the 'publication_info' property
  const items   = [],
        $liKind = $("<li>");
  
  $liKind.addClass("result clickable");
  $liKind.text(`kind: ${dataSegments[0]}`);
  items.push($liKind);
  
  for (let pubInfo in dataSegments[1]) {
    const $li = $("<li>");
    $li.addClass("result clickable");
    $li.text(`${pubInfo}: ${dataSegments[1][pubInfo]}`);
    items.push($li);
  }
  
  $(`#item-${sectionName}-list`).append(items);
}

function renderCreator(data) {
  // Set banner text
  $("#banner-item-creator").text(data.name);
  
  // Handle sections
  renderSection("links-creator", data.links, createLink);
  renderSection("awards-creator", data.awards, createAward);
  renderSection("works-creator", data.works, createWork);
  
  // Switch to item display
  switchDisplay("item-creators");
}

function renderWork(data) {
  // Set banner text
  $("#banner-item-work").text(data.title.find(elem => elem.lang === "en").name);
  
  // Handle sections
  // testrenderSection("title-work", data.title, {fn:data.title.map, param: createTitle});
  renderSection("title-work", data.title, createTitle);
  renderSection("contributors-work", data.contributors, createContributor);
  renderInformation("info-work", [data.kind, data.publication_info]);
  renderContents("contents-work", data.contents);
  renderSection("references-work", data.references, createReference);
  renderSection("identifiers-work", data.identifiers, createIdentifier);
  renderSection("links-work", data.links, createLink);
  
  // Switch to item display
  switchDisplay("item-works");
}

function clearOldItemData(itemType) {
  $(`#item-${itemType} ul`).empty();
}

function renderItemToDOM(itemType) {
  return function(data) {
    loadItem(data[itemType]);
    clearOldItemData(itemType);
    
    if (itemType === "creators") {
      renderCreator(data.creators);
    } else if (itemType === "works") {
      renderWork(data.works);
    }
  };
}

function switchDisplay(activeDisplayId) {
  $("main section").addClass("hidden");
  $(`#${activeDisplayId}`).removeClass("hidden");
}

function generateFormInputs(infoPieces, formType) {
  // infoPieces is an array of elements that a textbox needs to be created for
  return infoPieces.map(infoPiece => {
    const $div   = $("<div>"),
          $label = $("<label>"),
          $input = $("<input>");
    
    $label.addClass("table-cell");
    $label.attr("for", `${formType}-${infoPiece.label}`);
    $label.text(infoPiece.label);
    
    $input.addClass("table-cell");
    $input.attr("type", infoPiece.input);
    $input.attr("id", `${formType}-${infoPiece.label}`);
    
    $div.addClass("table-row");
    $div.append([$label, $input]);
    
    return $div;
  });
}

function generateToolbox() {
  const $save  = $("<i>"),
        $clear = $("<i>");
        
  $save.addClass("fa fa-floppy-o");
  $clear.addClass("fa fa-trash-o");
  
  $save.click(saveForm);
  $clear.click(clearForm);
  
  return [$save, $clear];
}

function showNewInfoDiv($parentElem, infoPieces, id) {
  const $form     = $("<form>"),
        textboxes = generateFormInputs(infoPieces, getTypeFromId(id)),
        $toolbox  = $("<div>");
        
  $toolbox.addClass("toolbox");
  $toolbox.append(generateToolbox());
  
  $form.addClass("table");
  $form.attr("id", id);
  $form.append(textboxes);
  $form.append($toolbox);
  
  $parentElem.after($form);
}

function removeNewInfoDiv(idToRemove) {
  $(`#${idToRemove}`).remove();
}

function insertEntryIntoDOM($listToInsertInto, objectToInsert) {
  // Remove js-empty class from header to prevent header being hidden after save
  $listToInsertInto.prev().prev().removeClass("js-empty");
  
  const type = getTypeFromId($listToInsertInto.attr("id"));
  let newItem;
  
  switch(type) {
    case "title":
      newItem = createTitle(objectToInsert);
      break;
      
    case "contributors":
      newItem = createContributor(objectToInsert);
      break;
      
    case "info":
      break;
      
    case "contents":
      newItem = createContent(objectToInsert);
      break;
      
    case "links":
      newItem = createLink(objectToInsert);
      break;
      
    case "references":
      newItem = createReference(objectToInsert);
      break;
      
    case "identifiers":
      newItem = createIdentifier(objectToInsert);
      break;
  }
  
  $listToInsertInto.append(newItem);
}

function makeEditable(event) {
  const $nearestSection = $(this).closest("section");
  
  // Add delete buttons to each list item
  const $i = $("<i>").addClass("fa fa-times js-delete-list-item");
  $nearestSection.find("li").append($i);
  
  // Unhide all section headings and edit buttons
  $nearestSection.find(".item-heading").removeClass("hidden");
  $nearestSection.find(".item-heading .js-add-new").removeClass("hidden");
  
  // Show toolbox items
  $nearestSection.find(".toolbox .hidden").removeClass("hidden");
  $("#edit-work").addClass("hidden");
  
  // Make an edited copy of the object
  APP_STATE.editedItem = JSON.parse(JSON.stringify(APP_STATE.currentItem));
}

function makeUneditable($section) {
  // Hide all section headings and edit buttons
  $section.find(".js-empty").addClass("hidden");
  $section.find(".item-heading .js-add-new").addClass("hidden");
  
  // Remove all unopened forms
  $section.find("form").remove();
  
  // Show toolbox items
  $section.find(".toolbox :not(.hidden)").addClass("hidden");
  $section.find(".toolbox .fa-pencil-square-o").removeClass("hidden");
  
  // Reset APP_STATE.editedItem
  APP_STATE.editedItem = null;
}

function cancelEditing(event) {
  const $section = $(event.currentTarget).closest("section");
  makeUneditable($section);
  renderItemToDOM("works")( { works: APP_STATE.currentItem } );
}

//////////////////////
// API functions
//////////////////////
function queryAPI(endpointURL, dataType, method, optionsObj = null) {
  const ajaxRequestObject = {
                               url:       endpointURL,
                               dataType:  dataType,
                               method:    method
                            };
  if(optionsObj) {
    Object.assign(ajaxRequestObject, optionsObj);
  }
  
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

function getItemDetails(itemType) {
  return function(event) {
    const API_URL = `${API_GENERIC_ENDPOINT}/${itemType}/${this.id}`;
    queryAPI(API_URL, "json", "GET").then(renderItemToDOM(itemType));
  };
}

function deleteWork(event) {
  queryAPI(`${API_WORK_ENDPOINT}/${APP_STATE.currentItem.id}`,
           "json",
           "DELETE"
          )
          .then(res => switchDisplay("items"))
          .catch(console.log);
}

function deleteListItem(event) {
  $(event.currentTarget).parent().remove();
}

function saveWork(event) {
  // Sanitize APP_STATE so that it will fit model
  sanitizeAPP_STATE();
  
  // Perform query
  const queryObj = { data: JSON.stringify(APP_STATE.editedItem),
                     contentType: "application/json; charset=utf-8",
                     processData: false
                   };
  queryAPI(`${API_GENERIC_ENDPOINT}/works/${APP_STATE.editedItem.id}`,
           "json",
           "PUT",
            queryObj
          ).then(res => makeUneditable($(this).closest("section")))
           .catch(err => console.log("error", err));
}

//////////////////////
// Other functions
//////////////////////
function sanitizeAPP_STATE() {
  // Input "who" field for authors
  APP_STATE.editedItem.contributors.forEach(contributor => {
    contributor.who = contributor.id;
  });
}

function getTypeFromId(id) {
  return id.split("-")[1];
}

function insertIntoAPP_STATE(field, object) {
  // Need custom rule for when the items general info is updated
  if(field === "info") {
    if(object.type === "kind") {
      APP_STATE.editedItem.kind = object.value;
    } else {
      APP_STATE.editedItem.publication_info[object.type] = object.value;
    }
  }
  
  // General rule for all other fields (because they are arrays)
  // First check if the field exists in editedItem
  if(APP_STATE.editedItem[field] && APP_STATE.editedItem[field] instanceof Array) {
    APP_STATE.editedItem[field].push(object);
  } else {
    APP_STATE.editedItem[field] = [ object ];
  }
}

function saveForm(event) {
  const $form  = $(this).closest("form"),
        type   = getTypeFromId($form.attr("id")),
        inputs = $form.find("input"),
        object = {};
  
  inputs.each(idx => {
    const $input = $(inputs[idx]);
    object[getTypeFromId($input.attr("id"))] = $input.val();
  });
  
  insertIntoAPP_STATE(type, object);
  insertEntryIntoDOM($form.next(), object);
}

function clearForm(event) {
  const $form = $(this).closest("form");
  $form.find("input[type=text]").val("");
}

function addNewInfoPiece($parent, callingId) {
  let fields,
      id = `${callingId}-div`;
  
  switch(callingId) {
    case "new-title-work":
      fields = [
        {label: "lang",  input: "text"},
        {label: "name", input: "text"}
      ];
      break;
      
    case "new-contributors-work":
      fields = [
        {label: "role", input: "text"},
        {label: "who",  input: "text"}
      ];
      break;
      
    case "new-links-work":
      fields = [
        {label: "domain", input: "text"},
        {label: "url",    input: "text"}
      ];
      break;
      
    case "new-contents-work":
      fields = [
        {label: "kind",   input: "text"},
        {label: "number", input: "text"},
        {label: "name",   input: "text"},
        {label: "author", input: "text"},
        {label: "work",   input: "text"}
      ];
      break;
      
    case "new-identifiers-work":
      fields = [
        {label: "type",       input: "text"},
        {label: "identifier", input: "text"}
      ];
      break;
      
    case "new-references-work":
      fields = [
        {label: "kind", input: "text"},
        {label: "work", input: "text"}
      ];
      break;
      
    case "new-info-work":
      fields = [
        {label: "type",  input: "text"},
        {label: "value", input: "text"}
      ];
      break;
  }
  
  showNewInfoDiv($parent, fields, id);
}

function toggleNewInfoPiece(event) {
  const $currentTarget = $(event.currentTarget),
        currentId      = event.currentTarget.id,
        $parent        = $(event.currentTarget.parentElement);
  
  if($currentTarget.attr("data-expanded") === "true") {
    $currentTarget.attr("data-expanded", "false");
    removeNewInfoDiv(`${currentId}-div`);
  } else {
    $currentTarget.attr("data-expanded", "true");
    addNewInfoPiece($parent, currentId);
  }
}

function addEventListeners() {
  $("#list-of-items").on("click", "li", getItemDetails("creators"));
  $("#item-works-creator-list").on("click", "li", getItemDetails("works"));
  $(".js-add-new").click(toggleNewInfoPiece);
  $("#edit-work").click(makeEditable);
  $("#cancel-work").click(cancelEditing);
  $("#delete-work").click(deleteWork);
  $("#save-work").click(saveWork);
  $("ul").on("click", ".js-delete-list-item", deleteListItem);
}

function loadData(data) {
  APP_STATE.data.push(...data[APP_STATE.currentlyLoaded]);
}

function loadItem(data) {
  APP_STATE.currentItem = data;
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