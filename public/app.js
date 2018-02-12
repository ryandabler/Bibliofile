"use strict";

//////////////////////
// Globals
//////////////////////
const API_GENERIC_ENDPOINT = "http://localhost:8080/api";
const APP_STATE = {
  currentlyLoaded: null,
  data: [],
  currentItem: null,
  editedItem: null
};
const CREATE_FUNCTIONS = { links: createLink,
                           awards: createAward,
                           title: createTitle,
                           contributors: createContributor,
                           identifiers: createIdentifier,
                           contents: createContent,
                           references: createReference
                         };

//////////////////////
// DOM functions
//////////////////////
function createListItem(main, addl=null, data_id=null, id=null, clickable=true) {
  const $li = $("<li>");
  clickable ? $li.addClass("result clickable") : $li.addClass("result");
  $li.text(main);
  
  data_id ? $li.attr("data-id", data_id)                                          : null;
  id      ? $li.attr("id", id)                                                    : null;
  addl    ? $li.append($("<span>").text(`(${addl})`).addClass("additional-info")) : null;
  return $li;
}

function updateItemsSection(data, htmlIdToAppendTo, dataType) {
  // Set banner text
  const bannerText = dataType.charAt(0).toUpperCase() + dataType.slice(1, dataType.length);
  $("#banner-items").text(bannerText);
  
  // Activate appropriate item
  $("#nav-header").find("span").removeClass("activated");
  $("#nav-header").find(`[data-segment=${dataType}]`).find("span").addClass("activated");
  
  // Switch to "items" section
  switchDisplay("items");
  
  // Render list
  renderListOfItemsToDOM(data, htmlIdToAppendTo);
}

function renderListOfItemsToDOM(data, htmlIdToAppendTo) {
  const $ulElement = $(`#${htmlIdToAppendTo}`);
  $ulElement.empty();
  
  data[APP_STATE.currentlyLoaded].forEach(item => {
    const name = item.name || item.title.find(elem => elem.lang === "en").name,
          $li = createListItem(name, null, null, item.id);
    $ulElement.append($li);
  });
}

function createLink(link) {
  const $li = $("<li>"),
        $a  = $("<a>");
  
  $li.addClass("result");
  $li.attr("data-id", link._id_);
  $a.attr("href", link.url);
  $a.attr("target", "_blank");
  $a.text(link.domain);
  
  $li.append($a);
  return $li;
}

function createAward(award) {
  return createListItem(award.name, award.year, award._id_, null, false);
}

function createWork(work) {
  return createListItem(work.title, null, work._id_, work.id);
}

function createTitle(title) {
  return createListItem(title.name, null, title._id_, null, false);
}

function createContributor(contributor) {
  return createListItem(contributor.fullname, contributor.role, contributor._id_, contributor.id);
}

function createContent(content) {
  const $li = $("<li>");
  let html = "<b>";
  
  html += content.kind ? content.kind : "";
  html += content.number ? ` ${content.number}</b>:` : "</b>";
  html += ` ${content.name}`;
  
  $li.addClass("result clickable");
  $li.html(html);
  $li.attr("data-id", content._id_);
  
  if(content.author) {
    const $span = $("<span>");
    $span.text(`(${content.author})`);
    $span.addClass("additional-info");
    $li.append($span);
  }
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
  // Check for id and title either nested under reference.work or directly under reference
  // From the database, reference.work.<FIELD> will be retrieved, but when manually entering data
  // they will be only under reference
  const $li   = $("<li>"),
        $span = $("<span>");
  
  $li.addClass("result clickable");
  reference.id ? $li.attr("id", reference.id) : null;
  $li.attr("data-id", reference._id_);
  $li.text(reference.title);
  
  $span.addClass("additional-info");
  $span.text(`(${reference.kind})`);
  $li.append($span);
  
  return $li;
}

function createIdentifier(identifier) {
  return createListItem(identifier.identifier, identifier.type, identifier._id_, null, false);
}

function renderSection(sectionName, dataSegment, generatorObj) {
  // generatorObj takes a function to call in "fn" and the parameter to pass to the function
  // in "param"
  if(dataSegment.length === 0) {
    $(`#item-${sectionName}`).addClass("hidden js-empty");
    $(`#item-${sectionName}-list`).empty();
  } else {
    $(`#item-${sectionName}`).removeClass("hidden js-empty");
    const items = generatorObj.fn(generatorObj.param);
    $(`#item-${sectionName}-list`).append(items);
  }
}

function renderCreator(data) {
  // Set banner text
  $("#banner-item-creator").text(data.name);
  
  // Handle sections
  renderSection("links-creator", data.links, { fn: data.links.map.bind(data.links), param: createLink } );
  renderSection("awards-creator", data.awards, { fn: data.awards.map.bind(data.awards), param: createAward } );
  renderSection("works-creator", data.works, { fn: data.works.map.bind(data.works), param: createWork } );
  
  // Switch to item display
  switchDisplay("item-creators");
}

function renderWork(data) {
  // Set banner text
  $("#banner-item-work").text(data.title.find(elem => elem.lang === "en").name);
  
  // Handle sections
  renderSection("title-work", data.title, { fn: data.title.map.bind(data.title), param: createTitle } );
  renderSection("contributors-work", data.contributors, { fn: data.contributors.map.bind(data.contributors), param: createContributor } );
  renderSection("contents-work", data.contents, { fn: createContents, param: data.contents } );
  renderSection("references-work", data.references, { fn: data.references.map.bind(data.references), param: createReference } );
  renderSection("identifiers-work", data.identifiers, { fn: data.identifiers.map.bind(data.identifiers), param: createIdentifier } );
  renderSection("links-work", data.links, { fn: data.links.map.bind(data.links), param: createLink } );
  
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
    const $div    = $("<div>"),
          $label  = $("<label>"),
          $input  = $("<input>"),
          inputId = infoPiece.id ? infoPiece.id : `${formType}-${infoPiece.label}`,
          divRow  = [];
    
    if (infoPiece.label) {
      $label.addClass("table-cell");
      $label.attr("for", `${formType}-${infoPiece.label}`);
      $label.text(infoPiece.label);
      divRow.push($label);
    }
    
    if (infoPiece.required) {
      $input.prop("required", true);
    }
    
    $input.addClass("table-cell");
    $input.attr("type", infoPiece.input);
    $input.attr("id", inputId);
    divRow.push($input);
    
    if(infoPiece.events) {
      infoPiece.events.forEach(event => {
        $input.on(event.type, event.callback);
      });
    }
    
    $div.addClass("table-row");
    $div.append(divRow);
    
    return $div;
  });
}

function generateToolbox() {
  const $button = $("<button>"),
        $save   = $("<i>"),
        $clear  = $("<i>");
  
  $button.append($save);
  
  $save.addClass("fa fa-floppy-o");
  $clear.addClass("fa fa-trash-o");
  
  $clear.click(clearForm);
  
  return [$button, $clear];
}

function generateFormFields(callingId) {
  const type = getTypeFromId(callingId);
  let fields;
  
  switch(type) {
    case "title":
      fields = [
        {label: "lang",  input: "text", required: true},
        {label: "name", input: "text", required: true}
      ];
      break;
      
    case "contributors":
      fields = [
        {label: "role", input: "text", required: true},
        {label: "who",  input: "text", required: true, id: "contributors-fullname", events: [ { type: "input", callback: searchDatabase("creators") } ] },
        {input: "hidden", id: "contributors-id"}
      ];
      break;
      
    case "links":
      fields = [
        {label: "domain", input: "text", required: true},
        {label: "url",    input: "text", required: true}
      ];
      break;
      
    case "contents":
      fields = [
        {label: "kind",   input: "text"},
        {label: "number", input: "text"},
        {label: "name",   input: "text", required: true}
      ];
      break;
      
    case "identifiers":
      fields = [
        {label: "type",       input: "text", required: true},
        {label: "identifier", input: "text", required: true},
      ];
      break;
      
    case "references":
      fields = [
        {label: "kind", input: "text", required: true},
        {label: "work", input: "text", required: true, id: "references-title", events: [ { type: "input", callback: searchDatabase("works") } ] },
        {input: "hidden", id: "references-id"}
      ];
      break;
    
    case "info":
      fields = [
        {label: "type",  input: "text"},
        {label: "value", input: "text"}
      ];
      break;
    
    case "awards":
      fields = [
        {label: "name", input: "text", required: true},
        {label: "year", input: "text", required: true}
      ];
  }
  
  return fields;
}

function displayNewItemForm(event) {
  const loadedSegment = $("#nav-header .activated").closest("li").attr("data-segment");
  if (loadedSegment === "creators") {
    $("#items form h2").text("Enter Name");
  } else {
    $("#items form h2").text("Enter Title");
  }
  
  $("#items > *:not(div)").addClass("hidden");
  $("#items > form").removeClass("hidden");
  $("#cancel-new-element").removeClass("hidden");
  $("#new-element").addClass("hidden");
}

function hideNewItemForm(event) {
  $("#items > *:not(div)").removeClass("hidden");
  $("#form-new").addClass("hidden");
  $("#items input").val("");
  $("#new-element").removeClass("hidden");
  $("#cancel-new-element").addClass("hidden");
}

function showInfoForm($parentElem, infoPieces, id, textboxes = null) {
  const $form     = $("<form>"),
        $toolbox  = $("<div>"),
        tboxes    = textboxes ? textboxes : generateFormInputs(infoPieces, getTypeFromId(id));
        
  $toolbox.addClass("toolbox");
  $toolbox.append(generateToolbox());
  
  $form.addClass("table");
  $form.attr("id", id);
  $form.append(tboxes);
  $form.append($toolbox);
  $form.submit(saveForm);
  
  $parentElem.after($form);
}

function updateEntryInDOM($where, object, type) {
  let $li = CREATE_FUNCTIONS[type](object);
  addEditButtons($li, true);
  
  $where.replaceWith($li);
}

function addEditButtons($li, makeExpanded = false) {
  const $span    = $("<span>").addClass("js-opt-list-item");
  const $iEdit   = $("<i>").addClass("fa fa-pencil-square-o js-edit-list-item");
  const $iDelete = $("<i>").addClass("fa fa-times js-delete-list-item");
  
  makeExpanded ? $iEdit.attr("data-expanded", "true") : null;
  
  $span.append( [ $iEdit, $iDelete ] );
  $li.append($span);
}

function insertEntryIntoDOM($listToInsertInto, objectToInsert) {
  // Remove js-empty class from header to prevent header being hidden after save
  $listToInsertInto.prev().prev().removeClass("js-empty");
  
  const type = getTypeFromId($listToInsertInto.attr("id"));
  let newItem = CREATE_FUNCTIONS[type](objectToInsert);
  
  addEditButtons(newItem);
  
  // Insert into list
  $listToInsertInto.append(newItem);
}

function makeEditable(dataType) {
  return function(event) {
    const $nearestSection = $(this).closest("section");
  
    // Add edit and delete buttons to each list item
    addEditButtons($nearestSection.find("li"));
    
    // Unhide all section headings and edit buttons
    $nearestSection.find(".item-heading").removeClass("hidden");
    $nearestSection.find(".item-heading .js-add-new").removeClass("hidden");
    
    // Show toolbox items
    $nearestSection.find(".toolbox .hidden").removeClass("hidden");
    $(`#edit-${dataType}`).addClass("hidden");
    
    // Make an edited copy of the object
    APP_STATE.editedItem = JSON.parse(JSON.stringify(APP_STATE.currentItem));
  };
}

function makeUneditable($section) {
  // Hide all section headings and edit buttons
  $section.find(".js-empty").addClass("hidden");
  $section.find(".item-heading .js-add-new").addClass("hidden");
  $section.find(".js-opt-list-item").addClass("hidden");
  
  // Remove all unopened forms unless we are on "#items"
  if ($section.attr("id") !== "items") {
    $section.find("form").remove();
  }
  
  $section.find("[data-expanded=true]").attr("data-expanded", "false");
  
  // Show toolbox items
  $section.find(".toolbox :not(.hidden)").addClass("hidden");
  $section.find(".toolbox .fa-pencil-square-o").removeClass("hidden");
  $section.find(".toolbox .fa-plus-circle").removeClass("hidden");
  
  // Reset APP_STATE.editedItem
  APP_STATE.editedItem = null;
}

function cancelEditing(event) {
  const $section = $(event.currentTarget).closest("section"),
        type     = getTypeFromId($section.attr("id")),
        dataObj  = {};
  dataObj[type] = APP_STATE.currentItem;
  
  makeUneditable($section);
  renderItemToDOM(type)(dataObj);
}

function chooseItemFromDropdown(idToAddTextTo) {
  return function(event) {
    const $current    = $(event.currentTarget),
          $form       = $current.closest("form"),
          $divOverlay = $current.closest("div");
          
    $form.find("input[type=hidden]").val($current.attr("id"));
    $form.find(`#${idToAddTextTo}`).val($current.text());
    $divOverlay.remove();
  };
}

function showSearchChoices(dataType, $emittingElement) {
  return function(data) {
    const $div           = $("#srch-over-contrib").length ? $("#srch-over-contrib") : $("<div>"),
          $ul            = $("<ul>"),
          width          = $emittingElement.outerWidth(),
          list           = data[dataType].map(item => {
                             const name = item.name || item.title.find(elem => elem.lang === "en").name;
                             return createListItem(name, null, guid(), item.id);
                           });
    
    $ul.addClass("results-list");
    $ul.append(list);
    $ul.on("click", "li", chooseItemFromDropdown($emittingElement[0].id));
    
    $div.empty();
    $div.append($ul);
    $div.attr("id", "srch-over-contrib");
    $div.addClass("search-overlay");
    $div.width(width);
    
    $emittingElement.after($div);
  };
}

function deleteListItem(event) {
  event.stopPropagation();
  const $li  = $(event.currentTarget).closest("li"),
        _id_ = $li.attr("data-id"),
        $ul  = $(event.currentTarget).closest("ul"),
        $h3  = $ul.prev(),
        type = getTypeFromId($ul.attr("id"));
  
  removeFromAPP_STATE(_id_, type);
  $(event.currentTarget).closest("li").remove();
  
  if ($ul.children().length === 0) {
    $h3.addClass("js-empty");
  }
}

function editListItem(event) {
  // stop propagation to prevent other events from triggering that might make the
  // app try to navigate to the content in the list item
  event.stopPropagation();
  toggleInfoForm(event);
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

function getItemDetails(dataType = null, id = null) {
  return function(event) {
    const type = dataType ? dataType : $("#nav-header").find("span.activated").closest("li").attr("data-segment");
    const API_URL = `${API_GENERIC_ENDPOINT}/${type}/${id || this.id}`;
    queryAPI(API_URL, "json", "GET").then(renderItemToDOM(type));
  };
}

function deleteItem(dataType) {
  return function(event) {
    queryAPI(`${API_GENERIC_ENDPOINT}/${dataType}/${APP_STATE.currentItem.id}`,
             "json",
             "DELETE"
            )
            .then(res => {
              makeUneditable($(event.currentTarget).closest("section"));
              switchDisplay("items");
            })
            .catch(console.log);
  };
}

function displayErrorMessage($section, message) {
  const $text = $section.find(".text");
  $text.text(message);
  $text.parent().removeClass("hidden");
}

function generateIntermediateSavePromises($liElements, field, type) {
  const promises = [];
  const data     = [];
  $liElements.each(function(idx) {
    const data_id = $(this).attr("data-id");
    const itemInAPP_STATE = APP_STATE.editedItem[field].find(item => item._id_ === data_id);
    const queryObj = { contentType: "application/json; charset=utf-8",
                       processData: false
                     };
    
    if (type === "creators") {
      queryObj.data = JSON.stringify({ fullname: itemInAPP_STATE.fullname });
    } else {
      queryObj.data = JSON.stringify({ title: { lang: "en", name: itemInAPP_STATE.title } });
    }
    
    data.push({ data_id, field, type });
    promises.push(queryAPI(`${API_GENERIC_ENDPOINT}/${type}`, "json", "POST", queryObj));
  });
  
  return [data, promises];
}

function updateAPP_STATEWithNewData(dataArr, data_info, $lis) {
  dataArr.forEach((elem, idx) => {
    const { data_id, field, type } = data_info[idx];
    const itemInAPP_STATE = APP_STATE.editedItem[field].find(item => item._id_ === data_id);
    itemInAPP_STATE.id = elem.id;
    itemInAPP_STATE.work = elem.id;
    $lis[idx].id = itemInAPP_STATE.id;
  });
}

function saveItem(dataType) {
  return function(event) {
    const $section = $(event.currentTarget).closest("section");
    
    // Check for errors
    const errors = checkAPP_STATEForErrors($section);
    if (!errors) {
      // Create new contributors/references if they don't already exist
      const [referenceData, referencePromises] = generateIntermediateSavePromises(
        $("#item-references-work-list li:not([id])"),
        "references",
        "works");
      const [contributorData, contributorPromises] = generateIntermediateSavePromises(
        $("#item-contributors-work-list li:not([id])"),
        "contributors",
        "creators");
      const promises  = referencePromises.concat(contributorPromises);
      const data_info = referenceData.concat(contributorData);
      const $lis      = $.merge($("#item-references-work-list li:not([id])"), $("#item-contributors-work-list li:not([id])"));
      
      Promise.all(promises)
        .then(data => {
          // Need to modify APP_STATE and the DOM with returned "id" fields in order to allow the
          // update to happen
          updateAPP_STATEWithNewData(data, data_info, $lis);
          
          // Sanitize APP_STATE so that it will fit model
          sanitizeAPP_STATE($section);
          
            // Perform query
          const queryObj = { data: JSON.stringify(APP_STATE.editedItem),
                            contentType: "application/json; charset=utf-8",
                            processData: false
                          };
          queryAPI(`${API_GENERIC_ENDPOINT}/${dataType}/${APP_STATE.editedItem.id}`,
                  "json",
                  "PUT",
                    queryObj
                  )
                  .then(res => {
                    APP_STATE.currentItem = APP_STATE.editedItem;
                  })
                  .catch(err => {
                    if(err.status === 200) {
                      APP_STATE.currentItem = APP_STATE.editedItem;
                    } else {
                      console.log(err);
                    }
                  });
                  
          makeUneditable($section);
        });
    } else {
      cancelEditing(event);
    }
  };
}

function searchDatabase(dataType) {
  return function(event) {
    const $currentTarget = $(event.currentTarget);
    if ($currentTarget.val().length > 3) {
      queryAPI(`${API_GENERIC_ENDPOINT}/search/${dataType}/${$currentTarget.val()}`,
                "json",
                "GET"
              ).then(showSearchChoices(dataType, $currentTarget));
    } else {
      $("#srch-over-contrib").remove();
    }
  };
}

//////////////////////
// Other functions
//////////////////////
function sanitizeAPP_STATE($section) {
  const item = APP_STATE.editedItem;
  
  if (item.contributors) {
    // Input "who" field for authors
    item.contributors.forEach(contributor => {
      contributor.who = contributor.id;
    });
  }
  
  if (item.references) {
    item.references.forEach(reference => {
      reference.work = reference.id;
    });
  }
}

function checkAPP_STATEForErrors($section) {
  const item = APP_STATE.editedItem;
  let errors = 0;
  
  if (item.title && item.title.length === 0) {
    displayErrorMessage($section, "Please ensure there is at least one title");
    errors++;
  }
  
  return errors;
}

function createAndDisplayItem(event) {
  event.preventDefault();
  const type     = $("#nav-header .activated").closest("li").attr("data-segment"),
        queryObj = { contentType: "application/json; charset=utf-8",
                     processData: false
                   };
  
  if (type === "creators") {
    queryObj.data = JSON.stringify({ fullname: $(this).find("input").val() });
  } else {
    queryObj.data = JSON.stringify({ title: { lang: "en", name: $(this).find("input").val() } });
  }
  
  queryAPI(`${API_GENERIC_ENDPOINT}/${type}`, "json", "POST", queryObj)
    .then(data => getItemDetails(type, data.id)());
}

function getTypeFromId(id) {
  return id.split("-")[1];
}

function removeFromAPP_STATE(_id_, type) {
  const entry = APP_STATE.editedItem[type].find(item => item._id_ === _id_);
  APP_STATE.editedItem[type] = APP_STATE.editedItem[type].filter(item => item !== entry);
}

function updateEntryInAPP_STATE(type, _id_, object) {
  const entry = APP_STATE.editedItem[type].find(item => item._id_ === _id_),
        idx   = APP_STATE.editedItem[type].indexOf(entry);
  object._id_ = entry._id_;
  APP_STATE.editedItem[type][idx] = object;
  return object;
}

function insertIntoAPP_STATE(field, object) {
  object._id_ = guid();
  
  // General rule for all other fields (because they are arrays)
  // First check if the field exists in editedItem
  if(APP_STATE.editedItem[field] && APP_STATE.editedItem[field] instanceof Array) {
    APP_STATE.editedItem[field].push(object);
  } else {
    APP_STATE.editedItem[field] = [ object ];
  }
  
  return object;
}

function sanitizeInput(type, object) {
  if (type === "links" && !object.url.match(/https*:\/\//)) {
    object.url = "http://" + object.url;
  }
}

function saveForm(event) {
  event.preventDefault();
  const $form     = $(this).closest("form"),
        type      = getTypeFromId($form.attr("id")),
        inputs    = $form.find("input"),
        editOrNew = $form.attr("id").search("list");
  let $where,
      object = {};
  
  inputs.each(idx => {
    const $input = $(inputs[idx]);
    object[getTypeFromId($input.attr("id"))] = $input.val();
  });
  console.log("object", object, type);
  sanitizeInput(type, object);
  
  if (editOrNew === -1) {
    $where = $form.next();
    
    object = insertIntoAPP_STATE(type, object);
    insertEntryIntoDOM($where, object);
  } else {
    const _id_ = $(this).prev().attr("data-id");
    $where = $form.prev();
    
    object = updateEntryInAPP_STATE(type, _id_, object);
    updateEntryInDOM($where, object, type);
  }
  
  clearForm(event);
}

function clearForm(event) {
  const $form = $(this).closest("form");
  $form.find("input[type=text]").val("");
}

function setValuesForTextboxes(textboxes, _id_, type) {
  const element = APP_STATE.editedItem[type].find(item => item._id_ === _id_);
  
  return textboxes.map(textbox => {
    const input    = textbox.find("input"),
          property = getTypeFromId(input.attr("id"));
    input.val(element[property]);
    return textbox;
  });
}

function toggleInfoForm(event) {
  const $currentTarget  = $(event.currentTarget),
        $section        = $currentTarget.closest("section"),
        $form           = $section.find("form"),
        currentId       = $currentTarget.hasClass("js-add-new") ? $currentTarget.attr("id")
                                                                : $currentTarget.closest("ul").attr("id"),
        $whereToPutForm = $currentTarget.hasClass("js-add-new") ? $currentTarget.parent()
                                                                : $currentTarget.closest("li"),
        fields          = generateFormFields(currentId),
        formId          = `${currentId}-div`,
        type            = getTypeFromId(formId);
        
  let textboxes         = $currentTarget.hasClass("js-add-new") ? null : generateFormInputs(fields, type);
  textboxes = textboxes ? setValuesForTextboxes(textboxes, $whereToPutForm.attr("data-id"), type)
                        : null;
  
  // Remove form if one already exists
  if ($form.length > 0) {
    $form.remove();
  }
  
  // Don't show form if "data-expanded" === "true"
  if ($currentTarget.attr("data-expanded") === "true") {
    $currentTarget.attr("data-expanded", "false");
  } else {
    // Revert "data-expanded" for all items other than the one clicked
    $section.find(`[data-expanded=true]:not(${$currentTarget.attr("id")})`).attr("data-expanded", "false");
    $currentTarget.attr("data-expanded", "true");
    
    showInfoForm($whereToPutForm, fields, formId, textboxes);
  }
}

function loadSegment(event) {
  const $current = $(event.currentTarget),
        dataSeg  = $current.attr("data-segment");
  
  // If currently editing when navigating away, make uneditable
  makeUneditable($("section:not(.hidden"));
  
  if (dataSeg === "creators" || dataSeg === "works") {
    getListOfItems(dataSeg).then(processGETListData(dataSeg))
                           .catch(err => console.log("error"));
  }
}

function addEventListeners() {
  $("#list-of-items").on("click", "li", getItemDetails());
  $("#item-works-creator-list").on("click", "li", getItemDetails("works"));
  $("#item-contributors-work-list").on("click", "li", getItemDetails("creators"));
  $(".js-add-new").click(toggleInfoForm);
  $("#new-element").click(displayNewItemForm);
  $("#form-new").submit(createAndDisplayItem)
  $("#edit-work").click(makeEditable("work"));
  $("#edit-creator").click(makeEditable("creator"));
  $("#cancel-work, #cancel-creator").click(cancelEditing);
  $("#delete-work").click(deleteItem("works"));
  $("#delete-creator").click(deleteItem("creators"));
  $("#save-work").click(saveItem("works"));
  $("#save-creator").click(saveItem("creators"));
  $(".x").click(event => $(event.currentTarget).parent().addClass("hidden"));
  $("ul").on("click", ".js-delete-list-item", deleteListItem);
  $("ul").on("click", ".js-edit-list-item", editListItem);
  $("#nav-header").on("click", "li", loadSegment);
}

function loadData(data, dataType) {
  APP_STATE.data = [];
  APP_STATE.data.push(...data[dataType]);
}

function loadItem(data) {
  const dataWithIds = data,
        fieldsNeedingIds = ["awards", "links", "title", "contributors", "contents", "references", "identifiers"];
  
  fieldsNeedingIds.forEach(fieldNeedingId => {
    if(dataWithIds[fieldNeedingId]) {
      dataWithIds[fieldNeedingId].forEach(field => {
        field._id_ = guid();
      });
    }
  });
  
  APP_STATE.currentItem = data;
}

function processGETListData(dataType) {
  return function(data) {
    loadData(data, dataType);
    updateItemsSection(data, "list-of-items", dataType);
  };
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function initApp() {
  Object.seal(APP_STATE);
  
  addEventListeners();
  getListOfItems("creators").then(processGETListData("creators"))
                            .catch(err => console.log(err));
}

$(initApp);