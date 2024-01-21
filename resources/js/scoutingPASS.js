// ScoutingPASS.js
//
// The guts of the ScoutingPASS application
// Written by Team 2451 - PWNAGE; (HACK-EDITED BY ALX :DDD)

document.addEventListener("touchstart", startTouch, false);
document.addEventListener("touchend", moveTouch, false);

// Swipe Up / Down / Left / Right
let initialX = null;
let xThreshold = 0.3;
let slide = 0;
let enableGoogleSheets = false;
let pitScouting = false;
let checkboxAs = 'YN';

// Options
let options = {
  correctLevel: QRCode.CorrectLevel.L,
  quietZone: 15,
  quietZoneColor: '#FFFFFF'
};

// Must be filled in: s=scouter, e=event,  l=level(q,qf,sf,f), m=match#, r=robot(r1,r2,b1..), t=team#
// let requiredFields = ["s", "e", "m", "l", "r", "as"];  // requires auton start pos ("as")
let requiredFields = []

let prev_cycle_end_time = null
let cycles = []

class Cycle {
  static src_condense_map = new Map([
      ['hpg', 0],
      ['hpo', 1],
      ['oga', 2],
      ['g', '3']
  ])
  static target_condense_map = new Map([
        ['par', 0],
        ['amp', 1],
        ['spe', 2],
        ['amp_spe', 3]
  ])

  constructor(gametime, source, shot_from, target, status, time) {
    this.gametime = gametime  // 0=auton, 1=teleop
    this.source = source;      // 0=hp_ground, 1=hp_other, 2=o.g.auton i.e. auton_leftover, 3=ground
    this.shot_from = shot_from;   // zone_id
    this.target = target;      // 0=partner, 1=amp, 2=speaker, 3=amplified_speaker
    this.status = status;      // 0=unsuccessful, 1=successful
    this.time = time;
  }
  condense() {
    // gsxytftime
    // g = gametime (auton / teleop)
    // s = source
    // x, y = grid_x, grid_y
    // t = target
    // f = successful?
    // time = {x}y.z
    return `${this.gametime}${this.source}${this.shot_from}${this.target}${this.status}${this.time}`
  }

  toString() {
    return this.condense()
  }
}

function nextCycle(code_identifier) {
  let undefined_vars = saveCycle(code_identifier)
  if (undefined_vars.length > 0) {  // More than 0 undefined vars
    alert(`Missing fields in Cycle Form: ${undefined_vars.join(', ')}`)
    return
  }
  try {
    clearCycle(code_identifier)
  } catch (e) {
    alert(e)
  }
  let break_component = document.getElementById(`break_${code_identifier}break`)
  break_component.setAttribute("nof_cycles", (parseInt(break_component.getAttribute("nof_cycles"))+1).toString())
  break_component.setAttribute("prev_cycle_end_time", Date.now().toString())
  break_component.innerHTML = `Cycle Form (${break_component.getAttribute("nof_cycles")}):` + '&nbsp;';
}

function saveCycle(code_identifier) {
  try {
    let Form = document.forms.scoutingForm;
    let src = Form[`${code_identifier}src`]
    let src_value = Cycle.src_condense_map.get(src.value ? src.value.replace(/"/g, '').replace(/;/g, "-") : "");

    let shotfrom = document.getElementById('canvas_' + code_identifier + 'shotfrom')
    let shotfrom_value = shotfrom.getAttribute('grid_coords')

    let tar = Form[`${code_identifier}tar`]
    let tar_value = Cycle.target_condense_map.get(tar.value ? tar.value.replace(/"/g, '').replace(/;/g, "-") : "");

    let success = Form[`${code_identifier}success`]
    let success_value = success.checked ? 1 : 0;

    let gametime = code_identifier.endsWith('a') ? 0 : 1

    let undefined_vars = []
    if (src_value == undefined) {
      undefined_vars.push('\"Source\"')
    }
    if (shotfrom_value == undefined) {
      undefined_vars.push('\"Shot From Region\"')
    }
    if (tar_value == undefined) {
      undefined_vars.push('\"Target\"')
    }
    if (undefined_vars.length > 0) {
      return undefined_vars
    }

    let break_component = document.getElementById(`break_${code_identifier}break`)
    let prev_cycle_end_time;
    if (break_component.hasAttribute("prev_cycle_end_time")) {
      prev_cycle_end_time = parseInt(break_component.getAttribute("prev_cycle_end_time"))
    } else {
      prev_cycle_end_time = 0
    }

    let cycle = new Cycle(
        gametime,
        src_value,
        shotfrom_value,
        tar_value,
        success_value,
        prev_cycle_end_time == 0 ? 0.0 : ((Date.now() - prev_cycle_end_time) / 1000).toFixed(1),
    )
    cycles.push(cycle)
    return []
  } catch (e) {
    alert(e)
  }
}

function clearCycle(code_identifier) {
  // Clear XY coordinates
  let inputs = document.querySelectorAll("[id*='XY_']");
  for (e of inputs) {
    code = e.id.substring(3)
    e.value = "[]"
  }
  inputs = new Set(document.querySelectorAll("[id*='input_']"));
  for (e of inputs) {
    code = e.id.substring(6)
    if (!code.startsWith(code_identifier)) {
      continue
    }
    if (e.className == "clickableImage") {
      e.value = "[]";
      continue;
    }
    let radio = code.indexOf("_")
    if (radio > -1) {
      let baseCode = code.substr(0, radio)
      if (e.checked) {
        e.checked = false
        document.getElementById("display_" + baseCode).value = ""
      }
      let defaultValue;
      try {
        defaultValue = document.getElementById("default_" + baseCode).value
      } catch (p) {
        defaultValue = ''
      }
      if (defaultValue != "") {
        if (defaultValue == e.value) {
          e.checked = true
          document.getElementById("display_" + baseCode).value = defaultValue
        }
      }
    } else {
      if (e.type == "number" || e.type == "text" || e.type == "hidden") {
        if ((e.className == "counter") ||
            (e.className == "timer") ||
            (e.className == "cycle")) {
          e.value = 0
          if (e.className == "timer" || e.className == "cycle") {
            // Stop interval
            let timerStatus = document.getElementById("status_" + code);
            let startButton = document.getElementById("start_" + code);
            let intervalIdField = document.getElementById("intervalId_" + code);
            let intervalId = intervalIdField.value;
            timerStatus.value = 'stopped';
            startButton.innerHTML = "Start";
            if (intervalId != '') {
              clearInterval(intervalId);
            }
            intervalIdField.value = '';
            if (e.className == "cycle") {
              document.getElementById("cycletime_" + code).value = "[]"
              document.getElementById("display_" + code).value = ""
            }
          }
        } else {
          e.value = ""
        }
      } else if (e.type == "checkbox") {
        if (e.checked == true) {
          e.checked = false
        }
      } else {
        console.log("unsupported input type")
      }
    }
  }
  drawFields()
}

function addNextCycleButton(table, idx, name, data, code_identifier) {
  let row = table.insertRow(idx);
  let cell1 = row.insertCell(0);
  cell1.classList.add("title");
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  // let cell2 = row.insertCell(1);
  cell1.innerHTML = name + '&nbsp;';  // No need to show name for button
  if (data.hasOwnProperty('tooltip')) {
    cell1.setAttribute("title", data.tooltip);
  }
  // cell2.classList.add("field");
  let inp = document.createElement("input");
  inp.setAttribute("id", "input_" + data.code);
  inp.setAttribute("type", "button");
  inp.setAttribute("onclick", `nextCycle(\"${code_identifier}\")`)
  inp.setAttribute("value", "Next Cycle")
  if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
    inp.setAttribute("name", data.gsCol);
  } else {
    inp.setAttribute("name", data.code);
  }
  if (data.hasOwnProperty('defaultValue')) {
    inp.setAttribute("value", data.defaultValue);
  }
  if (data.hasOwnProperty('disabled')) {
    inp.setAttribute("disabled", "");
  }
  cell1.appendChild(inp);
  return idx + 1;
}

bicycle_component_identifier = 'cycle'

// Add bicycle
function addBicycle(table, idx, name, data) {
  let code_identifier;
  if (data.bicycle_id == 'auton') {
    code_identifier = bicycle_component_identifier + 'a';
  } else {  // teleop
    code_identifier = bicycle_component_identifier + 't';
  }

  let break_data = JSON.parse(`{
            "name": "Cycle Form:",
            "code": "${code_identifier}break",
            "type": "break"
        }`)
  idx = addBreak(table, idx, break_data.name, break_data)

  let source_data;
  if (code_identifier == bicycle_component_identifier + 'a') { // Auton
    source_data = JSON.parse(`{ 
     "name": "Source",
     "code": "${code_identifier}src",
     "type": "radio",
     "choices": {
      "hpg": "HP Ground<br>",
      "hpo": "HP (other)<br>",
      "oga": "O.G. Auton<br>",
      "g": "Ground"
     }
     }`)
  } else {  // Teleop intake
    source_data = JSON.parse(`{ 
     "name": "Source",
     "code": "${code_identifier}src",
     "type": "radio",
     "choices": {
      "hpg": "HP Ground<br>",
      "hpo": "HP (other)<br>",
      "oga": "O.G. Auton<br>",
      "g": "Ground"
     }
     }`)
  }
  idx = addRadio(table, idx, source_data.name, source_data) // Source

  let shot_from_data = JSON.parse(`{
      "name": "Shot From Region:",
      "code": "${code_identifier}shotfrom",
      "type": "shotfrom",
      "filename": "2024/field_image.png",
      "clickRestriction": "one",
      "shape": "rect 4 white orangered true"
  }`)
  idx = addShotFrom(table, idx, shot_from_data.name, shot_from_data)

  let target_data = JSON.parse(`
  { 
   "name": "Target",
   "code": "${code_identifier}tar",
   "type": "radio",
   "choices": {
    "par": "Alliance Parter<br>",
    "amp": "Amp<br>",
    "spe": "Speaker<br>",
    "amp_spe": "Amplified Speaker"
   }
  }`)
  idx = addRadio(table, idx, target_data.name, target_data)  // Target

  let successful_data = JSON.parse(`
  { 
   "name": "Successful?",
   "code": "${code_identifier}success",
   "type": "bool"
   }`)
  idx = addCheckbox(table, idx, successful_data.name, successful_data) // Successful?

  let next_button_data = JSON.parse(`
  { 
    "name": "Next Cycle:",
    "code": "${code_identifier}nc",
    "type": "nextCycleButton"
  }`)
  idx = addNextCycleButton(table, idx, next_button_data.name, next_button_data, code_identifier)

  return idx
}

function onShotFromClicked(event) {
  try {
    let target = event.target;
    let base = getIdBase(target.id);
    //Resolution height and width (e.g. 52x26)
    let resX = 12;
    let resY = 6;
    let dimensions = document.getElementById("dimensions" + base);
    if (dimensions.value != "") {
      let arr = dimensions.value.split(' ');
      resX = arr[0];
      resY = arr[1];
    }
    //Turns coordinates into a numeric box
    let box = ((Math.ceil(event.offsetY / target.height * resY) - 1) * resX) + Math.ceil(event.offsetX / target.width * resX);
    let coords = event.offsetX + "," + event.offsetY;
    let allowableResponses = document.getElementById("allowableResponses" + base).value;
    if (allowableResponses != "none") {
      let allowableResponsesList = allowableResponses.split(',').map(Number);
      if (allowableResponsesList.indexOf(box) == -1) {
        return;
      }
    }

    let centerX = event.offsetX
    let centerY = event.offsetY
    let y_level = centerY < 80 ? 0 : 1
    let x_level;
    if (centerX < 35) {
      x_level = 0
    } else if (centerX < 100) {
      x_level = 1
    } else if (centerX < 150) {
      x_level = 2
    } else if (centerX < 200) {
      x_level = 3
    } else if (centerX < 260) {
      x_level = 4
    } else {
      x_level = 5
    }
    shotfrom_component = document.getElementById('canvas' + base)
    shotfrom_component.setAttribute('grid_coords', `${x_level}${y_level}`)

    //Cumulating values
    let changingXY = document.getElementById("XY" + base);
    let changingInput = document.getElementById("input" + base);
    let clickRestriction = document.getElementById("clickRestriction" + base).value;
    let toggleClick = document.getElementById("toggleClick" + base).value;
    let cycleTimer = document.getElementById("cycleTimer" + base);
    let boxArr = Array.from(JSON.parse(changingInput.value));
    let xyArr = Array.from(JSON.parse(changingXY.value));

    if ((toggleClick.toLowerCase() == 'true') &&
        (boxArr.includes(box))) {
      // Remove it
      let idx = boxArr.indexOf(box);
      boxArr.splice(idx, 1);
      xyArr.splice(idx, 1);
      changingInput.value = JSON.stringify(boxArr);
      changingXY.value = JSON.stringify(xyArr);
    } else {
      if (JSON.stringify(changingXY.value).length <= 2) {
        changingXY.value = JSON.stringify([coords]);
        changingInput.value = JSON.stringify([box]);
      } else if (clickRestriction == "one") {
        // Replace box and coords
        changingXY.value = JSON.stringify([coords]);
        changingInput.value = JSON.stringify([box]);
      } else if (clickRestriction == "onePerBox") {
        // Add if box already not in box list/Array
        if (!boxArr.includes(box)) {
          boxArr.push(box);
          changingInput.value = JSON.stringify(boxArr);

          coords = findMiddleOfBox(box, target.width, target.height, resX, resY);
          xyArr.push(coords);
          changingXY.value = JSON.stringify(xyArr);
        }
      } else {
        // No restrictions - add to array
        xyArr.push(coords);
        changingXY.value = JSON.stringify(xyArr);

        boxArr.push(box);
        changingInput.value = JSON.stringify(boxArr);
      }
      // If associated with cycleTimer - send New Cycle EVENT
      if (cycleTimer != null) {
        document.getElementById("cycle_" + cycleTimer.value).click();
      }
    }

    drawFields()
  } catch (e) {
    alert(e)
  }
}

function addShotFrom(table, idx, name, data) {
  let row = table.insertRow(idx);
  let cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  cell.setAttribute("style", "text-align: center;");
  cell.classList.add("title");
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  cell.innerHTML = name;
  if (data.hasOwnProperty('tooltip')) {
    cell.setAttribute("title", data.tooltip);
  }

  let showFlip = true;
  if (data.hasOwnProperty('showFlip')) {
    if (data.showFlip.toLowerCase() == 'false') {
      showFlip = false;
    }
  }

  let showUndo = true;
  if (data.hasOwnProperty('showUndo')) {
    if (data.showUndo.toLowerCase() == 'false') {
      showUndo = false;
    }
  }

  if (showFlip || showUndo) {
    idx += 1
    row = table.insertRow(idx);
    cell = row.insertCell(0);
    cell.setAttribute("colspan", 2);
    cell.setAttribute("style", "text-align: center;");

    if (showUndo) {
      // Undo button
      let undoButton = document.createElement("input");
      undoButton.setAttribute("type", "button");
      undoButton.setAttribute("onclick", "undo(this.parentElement)");
      undoButton.setAttribute("value", "Undo");
      undoButton.setAttribute("id", "undo_" + data.code);
      undoButton.setAttribute("class", "undoButton");
      cell.appendChild(undoButton);
    }

    if (showFlip) {
      // Flip button
      let flipButton = document.createElement("input");
      flipButton.setAttribute("type", "button");
      flipButton.setAttribute("onclick", "flip(this.parentElement)");
      flipButton.setAttribute("value", "Flip Image");
      flipButton.setAttribute("id", "flip_" + data.code);
      flipButton.setAttribute("class", "flipButton");
      if (showUndo) {
        flipButton.setAttribute("margin-left", '8px');
      }
      cell.appendChild(flipButton);
    }
  }

  idx += 1;
  row = table.insertRow(idx);
  cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  cell.setAttribute("style", "text-align: center;");
  var canvas = document.createElement('canvas');
  //canvas.onclick = onFieldClick;
  canvas.setAttribute("onclick", "onShotFromClicked(event)");
  canvas.setAttribute("class", "field-image-src");
  canvas.setAttribute("id", "canvas_" + data.code);
  canvas.innerHTML = "No canvas support";
  cell.appendChild(canvas);

  idx += 1;
  row = table.insertRow(idx);
  row.setAttribute("style", "display:none");
  cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  let inp = document.createElement('input');
  inp.setAttribute("type", "hidden");
  inp.setAttribute("id", "XY_" + data.code);
  inp.setAttribute("value", "[]");
  cell.appendChild(inp);
  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
    inp.setAttribute("name", data.gsCol);
  } else {
    inp.setAttribute("name", data.code);
  }
  inp.setAttribute("id", "input_" + data.code);
  inp.setAttribute("value", "[]");
  inp.setAttribute("class", "clickableImage");

  cell.appendChild(inp);

  // TODO: Make these more efficient/elegant
  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "clickRestriction_" + data.code);
  inp.setAttribute("value", "none");
  if (data.hasOwnProperty('clickRestriction')) {
    if ((data.clickRestriction == "one") ||
        (data.clickRestriction == "onePerBox")) {
      inp.setAttribute("value", data.clickRestriction);
    }
  }
  cell.appendChild(inp);

  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "allowableResponses_" + data.code);
  inp.setAttribute("value", "none");
  if (data.hasOwnProperty('allowableResponses')) {
    let responses = data.allowableResponses.split(' ').map(Number)
    console.log(responses)
    inp.setAttribute("value", responses);
  }
  cell.appendChild(inp);

  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "dimensions_" + data.code);
  inp.setAttribute("value", "12 6");
  if (data.hasOwnProperty('dimensions')) {
    if (data.dimensions != "") {
      // TODO: Add validation for "X Y" format
      inp.setAttribute("value", data.dimensions);
    }
  }
  cell.appendChild(inp);

  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "shape_" + data.code);
  // Default shape: white circle of size 5 not filled in
  inp.setAttribute("value", "rect 5 white white true");
  if (data.hasOwnProperty('shape')) {
    if (data.shape != "") {
      // TODO: Add validation for "shape size color fill" format
      inp.setAttribute("value", data.shape);
    }
  }
  cell.appendChild(inp);

  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "toggleClick_" + data.code);
  inp.setAttribute("value", "false");
  if (data.hasOwnProperty('toggleClick')) {
    if (data.toggleClick != "") {
      // TODO: Add validation for true/false format
      inp.setAttribute("value", data.toggleClick);
    }
  }
  cell.appendChild(inp);

  if (data.hasOwnProperty('cycleTimer')) {
    if (data.cycleTimer != "") {
      inp = document.createElement('input');
      inp.setAttribute("hidden", "");
      inp.setAttribute("id", "cycleTimer_" + data.code);
      inp.setAttribute("value", data.cycleTimer);
      cell.appendChild(inp);
    }
  }

  idx += 1
  row = table.insertRow(idx);
  row.setAttribute("style", "display:none");
  cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  var img = document.createElement('img');
  img.src = data.filename;
  img.setAttribute("id", "img_" + data.code);
  img.setAttribute("class", "field-image-src");
  img.setAttribute("onload", "drawFields()");
  img.setAttribute("hidden", "");
  cell.appendChild(img);

  return idx + 1
}

function addTimer(table, idx, name, data) {
  let lineBreak;
  let row = table.insertRow(idx);
  let cell1 = row.insertCell(0);
  cell1.setAttribute("colspan", "2");
  cell1.setAttribute("style", "text-align: center;");
  cell1.classList.add("title");
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  cell1.innerHTML = name;
  if (data.hasOwnProperty('tooltip')) {
    cell1.setAttribute("title", data.tooltip);
  }

  idx += 1
  row = table.insertRow(idx);
  let cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  cell.setAttribute("style", "text-align: center;");

  if (data.type == 'cycle') {
    let ct = document.createElement('input');
    ct.setAttribute("type", "hidden");
    ct.setAttribute("id", "cycletime_" + data.code);
    if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
      ct.setAttribute("name", data.gsCol);
    } else {
      ct.setAttribute("name", data.code);
    }
    ct.setAttribute("value", "[]");
    cell.appendChild(ct);
    ct = document.createElement('input');
    ct.setAttribute("type", "text");
    ct.setAttribute("id", "display_" + data.code);
    ct.setAttribute("value", "");
    ct.setAttribute("disabled", "");
    cell.appendChild(ct);
    lineBreak = document.createElement("br");
    cell.appendChild(lineBreak);
  }
  const button1 = document.createElement("input");
  button1.setAttribute("id", "start_" + data.code);
  button1.setAttribute("type", "button");
  button1.setAttribute("onclick", "timer(this.parentElement)");
  button1.setAttribute("value", "Start");
  cell.appendChild(button1);

  let inp = document.createElement("input");
  if (data.type == 'timer') {
    inp.classList.add("timer");
  } else {
    inp.classList.add("cycle");
  }
  inp.setAttribute("id", "input_" + data.code);
  inp.setAttribute("type", "text");
  if (data.type != 'cycle') {
    if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
      inp.setAttribute("name", data.gsCol);
    } else {
      inp.setAttribute("name", data.code);
    }
  }
  inp.setAttribute("style", "background-color: black; color: white;border: none; text-align: center;");
  inp.setAttribute("disabled", "");
  inp.setAttribute("value", 0);
  inp.setAttribute("size", 7);
  inp.setAttribute("maxLength", 7);
  cell.appendChild(inp);

  const button2 = document.createElement("input");
  button2.setAttribute("id", "clear_" + data.code);
  button2.setAttribute("type", "button");
  button2.setAttribute("onclick", "resetTimer(this.parentElement)");
  button2.setAttribute("value", "Reset");
  cell.appendChild(button2);
  lineBreak = document.createElement("br");
  cell.appendChild(lineBreak);

  if (data.type == 'cycle') {
    const button3 = document.createElement("input");
    button3.setAttribute("id", "cycle_" + data.code);
    button3.setAttribute("type", "button");
    button3.setAttribute("onclick", "newCycle(this.parentElement)");
    button3.setAttribute("value", "New Cycle");
    cell.appendChild(button3);
    const button4 = document.createElement("input");
    button4.setAttribute("id", "undo_" + data.code);
    button4.setAttribute("type", "button");
    button4.setAttribute("onclick", "undoCycle(this.parentElement)");
    button4.setAttribute("value", "Undo");
    button4.setAttribute('style', "margin-left: 20px;");
    cell.appendChild(button4);
  }

  idx += 1
  row = table.insertRow(idx);
  row.setAttribute("style", "display:none");
  cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  cell.setAttribute("style", "text-align: center;");
  inp = document.createElement('input');
  inp.setAttribute("type", "hidden");
  inp.setAttribute("id", "status_" + data.code);
  inp.setAttribute("value", "stopped");
  cell.appendChild(inp);
  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "intervalId_" + data.code);
  inp.setAttribute("value", "");
  cell.appendChild(inp);

  if (data.hasOwnProperty('defaultValue')) {
    const def = document.createElement("input");
    def.setAttribute("id", "default_" + data.code)
    def.setAttribute("type", "hidden");
    def.setAttribute("value", data.defaultValue);
    cell2.appendChild(def);
  }

  return idx + 1;
}

function addCounter(table, idx, name, data) {
  let row = table.insertRow(idx);
  const cell1 = row.insertCell(0);
  cell1.classList.add("title");
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  let cell2 = row.insertCell(1);
  cell1.innerHTML = name + '&nbsp;';
  if (data.hasOwnProperty('tooltip')) {
    cell1.setAttribute("title", data.tooltip);
  }
  cell2.classList.add("field");

  const button1 = document.createElement("input");
  button1.setAttribute("type", "button");
  button1.setAttribute("id", "minus_" + data.code);
  button1.setAttribute("onclick", "counter(this.parentElement, -1)");
  button1.setAttribute("value", "-");
  cell2.appendChild(button1);

  let inp = document.createElement("input");
  inp.classList.add("counter");
  inp.setAttribute("id", "input_" + data.code);
  inp.setAttribute("type", "text");
  if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
    inp.setAttribute("name", data.gsCol);
  } else {
    inp.setAttribute("name", data.code);
  }
  inp.setAttribute("style", "background-color: black; color: white;border: none; text-align: center;");
  inp.setAttribute("disabled", "");
  inp.setAttribute("value", 0);
  inp.setAttribute("size", 2);
  inp.setAttribute("maxLength", 2);
  cell2.appendChild(inp);

  const button2 = document.createElement("input");
  button2.setAttribute("type", "button");
  button2.setAttribute("id", "plus_" + data.code);
  button2.setAttribute("onclick", "counter(this.parentElement, 1)");
  button2.setAttribute("value", "+");
  cell2.appendChild(button2);

  if (data.hasOwnProperty('cycleTimer')) {
    if (data.cycleTimer != "") {
      inp = document.createElement('input');
      inp.setAttribute("hidden", "");
      inp.setAttribute("id", "cycleTimer_" + data.code);
      inp.setAttribute("value", data.cycleTimer);
      cell.appendChild(inp);
    }
  }

  if (data.hasOwnProperty('defaultValue')) {
    var def = document.createElement("input");
    def.setAttribute("id", "default_" + data.code)
    def.setAttribute("type", "hidden");
    def.setAttribute("value", data.defaultValue);
    cell2.appendChild(def);
  }

  return idx + 1;
}

function addClickableImage(table, idx, name, data) {
  let row = table.insertRow(idx);
  let cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  cell.setAttribute("style", "text-align: center;");
  cell.classList.add("title");
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  cell.innerHTML = name;
  if (data.hasOwnProperty('tooltip')) {
    cell.setAttribute("title", data.tooltip);
  }

  let showFlip = true;
  if (data.hasOwnProperty('showFlip')) {
    if (data.showFlip.toLowerCase() == 'false') {
      showFlip = false;
    }
  }

  let showUndo = true;
  if (data.hasOwnProperty('showUndo')) {
    if (data.showUndo.toLowerCase() == 'false') {
      showUndo = false;
    }
  }

  if (showFlip || showUndo) {
    idx += 1
    row = table.insertRow(idx);
    cell = row.insertCell(0);
    cell.setAttribute("colspan", 2);
    cell.setAttribute("style", "text-align: center;");

    if (showUndo) {
      // Undo button
      let undoButton = document.createElement("input");
      undoButton.setAttribute("type", "button");
      undoButton.setAttribute("onclick", "undo(this.parentElement)");
      undoButton.setAttribute("value", "Undo");
      undoButton.setAttribute("id", "undo_" + data.code);
      undoButton.setAttribute("class", "undoButton");
      cell.appendChild(undoButton);
    }

    if (showFlip) {
      // Flip button
      let flipButton = document.createElement("input");
      flipButton.setAttribute("type", "button");
      flipButton.setAttribute("onclick", "flip(this.parentElement)");
      flipButton.setAttribute("value", "Flip Image");
      flipButton.setAttribute("id", "flip_" + data.code);
      flipButton.setAttribute("class", "flipButton");
      if (showUndo) {
        flipButton.setAttribute("margin-left", '8px');
      }
      cell.appendChild(flipButton);
    }
  }

  idx += 1;
  row = table.insertRow(idx);
  cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  cell.setAttribute("style", "text-align: center;");
  var canvas = document.createElement('canvas');
  //canvas.onclick = onFieldClick;
  canvas.setAttribute("onclick", "onFieldClick(event)");
  canvas.setAttribute("class", "field-image-src");
  canvas.setAttribute("id", "canvas_" + data.code);
  canvas.innerHTML = "No canvas support";
  cell.appendChild(canvas);

  idx += 1;
  row = table.insertRow(idx);
  row.setAttribute("style", "display:none");
  cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  let inp = document.createElement('input');
  inp.setAttribute("type", "hidden");
  inp.setAttribute("id", "XY_" + data.code);
  inp.setAttribute("value", "[]");
  cell.appendChild(inp);
  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
    inp.setAttribute("name", data.gsCol);
  } else {
    inp.setAttribute("name", data.code);
  }
  inp.setAttribute("id", "input_" + data.code);
  inp.setAttribute("value", "[]");
  inp.setAttribute("class", "clickableImage");

  cell.appendChild(inp);

  // TODO: Make these more efficient/elegant
  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "clickRestriction_" + data.code);
  inp.setAttribute("value", "none");
  if (data.hasOwnProperty('clickRestriction')) {
    if ((data.clickRestriction == "one") ||
      (data.clickRestriction == "onePerBox")) {
      inp.setAttribute("value", data.clickRestriction);
    }
  }
  cell.appendChild(inp);

  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "allowableResponses_" + data.code);
  inp.setAttribute("value", "none");
  if (data.hasOwnProperty('allowableResponses')) {
    let responses = data.allowableResponses.split(' ').map(Number)
    console.log(responses)
      inp.setAttribute("value", responses);
  }
  cell.appendChild(inp);

  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "dimensions_" + data.code);
  inp.setAttribute("value", "12 6");
  if (data.hasOwnProperty('dimensions')) {
    if (data.dimensions != "") {
      // TODO: Add validation for "X Y" format
      inp.setAttribute("value", data.dimensions);
    }
  }
  cell.appendChild(inp);

  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "shape_" + data.code);
  // Default shape: white circle of size 5 not filled in
  inp.setAttribute("value", "circle 5 white white true");
  if (data.hasOwnProperty('shape')) {
    if (data.shape != "") {
      // TODO: Add validation for "shape size color fill" format
      inp.setAttribute("value", data.shape);
    }
  }
  cell.appendChild(inp);

  inp = document.createElement('input');
  inp.setAttribute("hidden", "");
  inp.setAttribute("id", "toggleClick_" + data.code);
  inp.setAttribute("value", "false");
  if (data.hasOwnProperty('toggleClick')) {
    if (data.toggleClick != "") {
      // TODO: Add validation for true/false format
      inp.setAttribute("value", data.toggleClick);
    }
  }
  cell.appendChild(inp);

  if (data.hasOwnProperty('cycleTimer')) {
    if (data.cycleTimer != "") {
      inp = document.createElement('input');
      inp.setAttribute("hidden", "");
      inp.setAttribute("id", "cycleTimer_" + data.code);
      inp.setAttribute("value", data.cycleTimer);
      cell.appendChild(inp);
    }
  }

  idx += 1
  row = table.insertRow(idx);
  row.setAttribute("style", "display:none");
  cell = row.insertCell(0);
  cell.setAttribute("colspan", 2);
  var img = document.createElement('img');
  img.src = data.filename;
  img.setAttribute("id", "img_" + data.code);
  img.setAttribute("class", "field-image-src");
  img.setAttribute("onload", "drawFields()");
  img.setAttribute("hidden", "");
  cell.appendChild(img);

  return idx + 1
}

function addText(table, idx, name, data) {
  let row = table.insertRow(idx);
  let cell1 = row.insertCell(0);
  cell1.classList.add("title");
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  let cell2 = row.insertCell(1);
  cell1.innerHTML = name + '&nbsp;';
  if (data.hasOwnProperty('tooltip')) {
    cell1.setAttribute("title", data.tooltip);
  }
  cell2.classList.add("field");
  let inp = document.createElement("input");
  inp.setAttribute("id", "input_" + data.code);
  inp.setAttribute("type", "text");
  if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
    inp.setAttribute("name", data.gsCol);
  } else {
    inp.setAttribute("name", data.code);
  }
  if (data.hasOwnProperty('size')) {
    inp.setAttribute("size", data.size);
  }
  if (data.hasOwnProperty('maxSize')) {
    inp.setAttribute("maxLength", data.maxSize);
  }
  if (data.hasOwnProperty('defaultValue')) {
    if (data.type == 'event') {
      data.defaultValue = data.defaultValue.toLowerCase();
    }
    inp.setAttribute("value", data.defaultValue);
  }
  if (data.hasOwnProperty('required')) {
    inp.setAttribute("required", "");
  }
  if (data.hasOwnProperty('disabled')) {
    inp.setAttribute("disabled", "");
  }
  cell2.appendChild(inp);
  if (data.hasOwnProperty('defaultValue')) {
    var def = document.createElement("input");
    def.setAttribute("id", "default_" + data.code)
    def.setAttribute("type", "hidden");
    def.setAttribute("value", data.defaultValue);
    cell2.appendChild(def);
  }
  return idx + 1
}

function addBreak(table, idx, name, data) {
  let row = table.insertRow(idx);
  let cell1 = row.insertCell(0);
  cell1.classList.add("title");
  cell1.setAttribute('id', 'break_' + data.code)
  cell1.setAttribute('nof_cycles', '0')
  cell1.style.fontWeight = 'bold'
  cell1.style.fontSize = 'larger'
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  cell1.innerHTML = `Cycle Form (${cell1.getAttribute("nof_cycles")}):` + '&nbsp;';
  if (data.hasOwnProperty('tooltip')) {
    cell1.setAttribute("title", data.tooltip);
  }
  return idx + 1
}

function addNumber(table, idx, name, data) {
  let row = table.insertRow(idx);
  let cell1 = row.insertCell(0);
  cell1.classList.add("title");
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  let cell2 = row.insertCell(1);
  cell1.innerHTML = name + '&nbsp;';
  if (data.hasOwnProperty('tooltip')) {
    cell1.setAttribute("title", data.tooltip);
  }
  cell2.classList.add("field");
  let inp = document.createElement("input");
  inp.setAttribute("id", "input_" + data.code);
  inp.setAttribute("type", "number");
  if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
    inp.setAttribute("name", data.gsCol);
  } else {
    inp.setAttribute("name", data.code);
  }
  if ((data.type == 'team') ||
    (data.type == 'match')) {
    inp.setAttribute("onchange", "updateMatchStart(event)");
  }
  if (data.hasOwnProperty('min')) {
    inp.setAttribute("min", data.min);
  }
  if (data.hasOwnProperty('max')) {
    inp.setAttribute("max", data.max);
  }
  if (data.hasOwnProperty('defaultValue')) {
    inp.setAttribute("value", data.defaultValue);
  }
  if (data.hasOwnProperty('disabled')) {
    inp.setAttribute("disabled", "");
  }
  if (data.hasOwnProperty('required')) {
    inp.setAttribute("required", "");
  }
  cell2.appendChild(inp);

  if (data.hasOwnProperty('defaultValue')) {
    var def = document.createElement("input");
    def.setAttribute("id", "default_" + data.code)
    def.setAttribute("type", "hidden");
    def.setAttribute("value", data.defaultValue);
    cell2.appendChild(def);
  }

  if (data.type == 'team') {
    idx += 1
    row = table.insertRow(idx);
    cell1 = row.insertCell(0);
    cell1.setAttribute("id", "teamname-label");
    cell1.setAttribute("colspan", 2);
    cell1.setAttribute("style", "text-align: center;");
  }

  return idx + 1;
}

function addRadio(table, idx, name, data) {
  const row = table.insertRow(idx);
  let cell1 = row.insertCell(0);
  cell1.classList.add("title");
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  let cell2 = row.insertCell(1);
  cell1.innerHTML = name + '&nbsp;';
  if (data.hasOwnProperty('tooltip')) {
    cell1.setAttribute("title", data.tooltip);
  }
  cell2.classList.add("field");
  if ((data.type == 'level') ||
    (data.type == 'robot')
  ) {
    cell2.setAttribute("onchange", "updateMatchStart(event)");
  }
  let checked = null
  if (data.hasOwnProperty('defaultValue')) {
    checked = data.defaultValue;
  }
  let keys;
  if (data.hasOwnProperty('choices')) {
    keys = Object.keys(data.choices);
    keys.forEach(c => {
      let inp = document.createElement("input");
      inp.setAttribute("id", "input_" + data.code + "_" + c);
      inp.setAttribute("type", "radio");
      if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
        inp.setAttribute("name", data.gsCol);
      } else {
        inp.setAttribute("name", data.code);
      }
      inp.setAttribute("value", c);
      if (checked == c) {
        inp.setAttribute("checked", "");
      }
      cell2.appendChild(inp);
      cell2.innerHTML += data.choices[c];
    });
  }
  let inp = document.createElement("input");
  inp.setAttribute("id", "display_" + data.code);
  inp.setAttribute("hidden", "");
  inp.setAttribute("value", "");
  cell2.appendChild(inp);

  if (data.hasOwnProperty('defaultValue')) {
    let def = document.createElement("input");
    def.setAttribute("id", "default_" + data.code)
    def.setAttribute("type", "hidden");
    def.setAttribute("value", data.defaultValue);
    cell2.appendChild(def);
  }

  return idx + 1;
}

function addCheckbox(table, idx, name, data) {
  let row = table.insertRow(idx);
  let cell1 = row.insertCell(0);
  cell1.classList.add("title");
  if (!data.hasOwnProperty('code')) {
    cell1.innerHTML = `Error: No code specified for ${name}`;
    return idx + 1;
  }
  let cell2 = row.insertCell(1);
  cell1.innerHTML = name + '&nbsp;';
  if (data.hasOwnProperty('tooltip')) {
    cell1.setAttribute("title", data.tooltip);
  }
  cell2.classList.add("field");
  let inp = document.createElement("input");
  inp.setAttribute("id", "input_" + data.code);
  inp.setAttribute("type", "checkbox");
  if (enableGoogleSheets && data.hasOwnProperty('gsCol')) {
    inp.setAttribute("name", data.gsCol);
  } else {
    inp.setAttribute("name", data.code);
  }
  cell2.appendChild(inp);

  if (data.type == 'bool') {
    cell2.innerHTML += "(checked = Yes)";
  }

  if (data.hasOwnProperty('defaultValue')) {
    let def = document.createElement("input");
    def.setAttribute("id", "default_" + data.code)
    def.setAttribute("type", "hidden");
    def.setAttribute("value", data.defaultValue);
    cell2.appendChild(def);
  }

  return idx + 1;
}

function addElement(table, idx, data) {
  let name = 'Default Name';
  if (data.hasOwnProperty('name')) {
    name = data.name
  }

  let err;
  if (!data.hasOwnProperty('type')) {
    console.log("No type specified");
    console.log("Data: ")
    console.log(data);
    err = {code: "err", defaultValue: "No type specified: " + data};
    idx = addText(table, idx, name, err);
    return
  }

  if (data.type == 'counter') {
    idx = addCounter(table, idx, name, data);
  } else if (data.type == 'bicycle') {
    idx = addBicycle(table, idx, name, data)
  } else if (data.type == 'break') {
    idx = addBreak(table, idx, name, data)
  } else if ((data.type == 'scouter') || (data.type == 'event') || (data.type == 'text')) {
    idx = addText(table, idx, name, data);
  } else if ((data.type == 'level') || (data.type == 'radio') || (data.type == 'robot')) {
    idx = addRadio(table, idx, name, data);
  } else if ((data.type == 'match') || (data.type == 'team') || (data.type == 'number')) {
    idx = addNumber(table, idx, name, data);
  } else if ((data.type == 'field_image') || (data.type == 'clickable_image')) {
    idx = addClickableImage(table, idx, name, data);
  } else if ((data.type == 'bool') || (data.type == 'checkbox') || (data.type == 'pass_fail')) {
    idx = addCheckbox(table, idx, name, data);
  } else if (data.type == 'counter') {
    idx = addCounter(table, idx, name, data);
  } else if ((data.type == 'timer') || (data.type == 'cycle')) {
    idx = addTimer(table, idx, name, data);
  } else {
    console.log(`Unrecognized type: ${data.type}`);
  }
  return idx
}

function configure() {
  let mydata;
  try {
    mydata = JSON.parse(config_data);
  } catch (err) {
    console.log(`Error parsing configuration file`)
    console.log(err.message)
    console.log('Use a tool like http://jsonlint.com/ to help you debug your config file')
    let table = document.getElementById("prematch_table")
    let row = table.insertRow(0);
    let cell1 = row.insertCell(0);
    cell1.innerHTML = `Error parsing configuration file: ${err.message}<br><br>Use a tool like <a href="http://jsonlint.com/">http://jsonlint.com/</a> to help you debug your config file`
    return -1
  }

  if(mydata.hasOwnProperty('dataFormat')) {
    dataFormat = mydata.dataFormat;
  }
  
  if (mydata.hasOwnProperty('title')) {
    document.title = mydata.title;
  }

  if (mydata.hasOwnProperty('page_title')) {
    for (pgtitle of document.getElementsByClassName("page_title")) {
      pgtitle.innerHTML = mydata.page_title;
    }
  }

  if (mydata.hasOwnProperty('enable_google_sheets')) {
    if (mydata.enable_google_sheets.toUpperCase() == 'TRUE') {
      enableGoogleSheets = true;
    }
  }

  if (mydata.hasOwnProperty('pitConfig')) {
    if (mydata.pitConfig.toUpperCase() == 'TRUE') {
      pitScouting = true;
    }
  }

  if (mydata.hasOwnProperty('checkboxAs')) {
    // Supported modes
    // YN - Y or N
    // TF - T or F
    // 10 - 1 or 0
    if (['YN','TF','10'].includes(mydata.checkboxAs)) {
      console.log("Setting checkboxAs to " + mydata.checkboxAs);
      checkboxAs = mydata.checkboxAs;
    } else {
      console.log("unrecognized checkboxAs setting.  Defaulting to YN.")
      checkboxAs = 'YN';
    }
  }

  // Configure prematch screen
  let pmc = mydata.prematch;
  let pmt = document.getElementById("prematch_table");
  var idx = 0;
  pmc.forEach(element => {
    idx = addElement(pmt, idx, element);
  });

  // Configure auton screen
  let ac = mydata.auton;
  let at = document.getElementById("auton_table");
  idx = 0;
  ac.forEach(element => {
    idx = addElement(at, idx, element);
  });

  // Configure teleop screen
  let tc = mydata.teleop;
  let tt = document.getElementById("teleop_table");
  idx = 0;
  tc.forEach(element => {
    idx = addElement(tt, idx, element);
  });

  // Configure endgame screen
  let egc = mydata.endgame;
  let egt = document.getElementById("endgame_table");
  idx = 0;
  egc.forEach(element => {
    idx = addElement(egt, idx, element);
  });

  // Configure postmatch screen
  pmc = mydata.postmatch;
  pmt = document.getElementById("postmatch_table");
  var idx = 0;
  pmc.forEach(element => {
    idx = addElement(pmt, idx, element);
  });

  if (!enableGoogleSheets) {
    document.getElementById("submit").style.display = "none";
  }

  return 0
}

function getRobot(){
  return document.forms.scoutingForm.r.value;
}

function resetRobot() {
  for (rb of document.getElementsByName('r')) {
    rb.checked = false
  }
}

function getLevel(){
  return document.forms.scoutingForm.l.value
}

function validateData() {
  let ret = true;
  let errStr = "";
  for (rf of requiredFields) {
    let thisRF = document.forms.scoutingForm[rf];
    if (thisRF.value == "[]" || thisRF.value.length == 0) {
      if (rf == "as") {
        rftitle = "Auto Start Position"
      } else {
        thisInputEl = thisRF instanceof RadioNodeList ? thisRF[0] : thisRF;
        rftitle = thisInputEl.parentElement.parentElement.children[0].innerHTML.replace("&nbsp;","");
      }
      errStr += rf + ": " + rftitle + "\n";
      ret = false;
    }
  }
  if (ret == false) {
    alert("Enter all required values\n" + errStr);
  }
  return ret
}

function getData(dataFormat) {
  let Form = document.forms.scoutingForm;
  let UniqueFieldNames = [];
  let fd = new FormData();
  let str = [];

  let checkedChar;
  let uncheckedChar;
  switch(checkboxAs) {
    case 'TF':
      checkedChar = 'T';
      uncheckedChar = 'F';
      break;
    case '10':
      checkedChar = '1';
      uncheckedChar = '0';
      break;
    default:
      checkedChar = 'Y';
      uncheckedChar = 'N';
  }

  // collect the names of all the elements in the form
  let fieldnames = Array.from(Form.elements, formElmt => formElmt.name);
  // make sure to add the name attribute only to elements from which you want to collect values.  Radio button groups all share the same name
  // so those element names need to be de-duplicated here as well.
  fieldnames.forEach((fieldname) => {
    if (fieldname != "" && !UniqueFieldNames.includes(fieldname)) {
      UniqueFieldNames.push(fieldname)
    }
  });

  UniqueFieldNames.forEach((fieldname) => {
    if (fieldname.startsWith(bicycle_component_identifier)) {
      return
    }
    let thisField = Form[fieldname];
    let thisFieldValue;
    if (thisField.type == 'checkbox') {
      thisFieldValue = thisField.checked ? checkedChar : uncheckedChar;
    } else {
      thisFieldValue = thisField.value ? thisField.value.replace(/"/g, '').replace(/;/g, "-") : "";
    }
    fd.append(fieldname, thisFieldValue)
  })

  if (dataFormat == "kvs") {
    Array.from(fd.keys()).forEach(thisKey => {
      str.push(thisKey + "=" + fd.get(thisKey))
    });
    return str.join(";") + `;[${cycles.join(',')}]`
  // } else if (dataFormat == "tsv") {
  //   Array.from(fd.keys()).forEach(thisKey => {
  //     str.push(fd.get(thisKey))
  //   });
  //   return str.join(";")
  } else {
    return "unsupported dataFormat"
  }
}

function updateQRHeader() {
  let str = 'Event: !EVENT! Match: !MATCH! Robot: !ROBOT! Team: !TEAM!';
  if (!pitScouting) {
    str = str
      .replace('!EVENT!', document.getElementById("input_e").value)
      .replace('!MATCH!', document.getElementById("input_m").value)
      .replace('!ROBOT!', document.getElementById("display_r").value)
      .replace('!TEAM!', document.getElementById("input_t").value);
  } else {
    str = 'Pit Scouting - Team !TEAM!'
      .replace('!TEAM!', document.getElementById("input_t").value);
  }
  document.getElementById("display_qr-info").textContent = str;
}

function qr_regenerate() {
  // Validate required pre-match date (event, match, level, robot, scouter)
  if (!pitScouting) {  
    if (validateData() == false) {
      // Don't allow a swipe until all required data is filled in
      return false
    }
  }
  // Get data
  let data = getData(dataFormat)  // bug
  // Regenerate QR Code
  qr.makeCode(data)
  updateQRHeader()
  return true
}

function clearForm() {
  let match = 0;
  let e = 0;

  if (pitScouting) {
    swipePage(-1);
  } else {
    swipePage(-5);

    // Increment match
    match = parseInt(document.getElementById("input_m").value)
    if (match == NaN) {
      document.getElementById("input_m").value = ""
    } else {
      document.getElementById("input_m").value = match + 1
    }

    // Robot
    resetRobot()
  }

  try {
    // Clear XY coordinates
    inputs = document.querySelectorAll("[id*='XY_']");
    for (e of inputs) {
      code = e.id.substring(3)
      e.value = "[]"
    }

    inputs = document.querySelectorAll("[id*='input_']");
    for (e of inputs) {
      code = e.id.substring(6)

      // Don't clear key fields
      if (code == "m") continue
      if (code.substring(0, 2) == "r_") continue
      if (code.substring(0, 2) == "l_") continue
      if (code == "e") continue
      if (code == "s") continue

      if (e.className == "clickableImage") {
        e.value = "[]";
        continue;
      }

      let radio = code.indexOf("_")
      if (radio > -1) {
        let baseCode = code.substr(0, radio)
        if (e.checked) {
          e.checked = false
          document.getElementById("display_" + baseCode).value = ""
        }
        let defaultValue;
        try {
          defaultValue = document.getElementById("default_" + baseCode).value
        } catch (p) {
          defaultValue = ''
        }
        if (defaultValue != "") {
          if (defaultValue == e.value) {
            e.checked = true
            document.getElementById("display_" + baseCode).value = defaultValue
          }
        }
      } else {
        if (e.type == "number" || e.type == "text" || e.type == "hidden") {
          if ((e.className == "counter") ||
              (e.className == "timer") ||
              (e.className == "cycle")) {
            e.value = 0
            if (e.className == "timer" || e.className == "cycle") {
              // Stop interval
              let timerStatus = document.getElementById("status_" + code);
              let startButton = document.getElementById("start_" + code);
              let intervalIdField = document.getElementById("intervalId_" + code);
              let intervalId = intervalIdField.value;
              timerStatus.value = 'stopped';
              startButton.innerHTML = "Start";
              if (intervalId != '') {
                clearInterval(intervalId);
              }
              intervalIdField.value = '';
              if (e.className == "cycle") {
                document.getElementById("cycletime_" + code).value = "[]"
                document.getElementById("display_" + code).value = ""
              }
            }
          } else {
            e.value = ""
          }
        } else if (e.type == "checkbox") {
          if (e.checked == true) {
            e.checked = false
          }
        } else {
          console.log("unsupported input type")
        }
      }
    }
    cycles = []

    let auton_specifier = bicycle_component_identifier + 'a'
    let teleop_specifier = bicycle_component_identifier + 't'

    let break_component;
    break_component = document.getElementById(`break_${auton_specifier}break`)
    break_component.setAttribute("nof_cycles", "0")
    break_component.innerHTML = `Cycle Form (${break_component.getAttribute("nof_cycles")}):` + '&nbsp;';
    if (break_component.hasAttribute("prev_cycle_end_time")) {
      break_component.removeAttribute("prev_cycle_end_time")
    }

    break_component = document.getElementById(`break_${teleop_specifier}break`)
    break_component.setAttribute("nof_cycles", "0")
    if (break_component.hasAttribute("prev_cycle_end_time")) {
      break_component.removeAttribute("prev_cycle_end_time")
    }
    break_component.innerHTML = `Cycle Form (${break_component.getAttribute("nof_cycles")}):` + '&nbsp;';

    clearCycle(auton_specifier)
    clearCycle(teleop_specifier)
    drawFields()
  } catch (e) {
    alert(e)
  }
}

function startTouch(e) {
  initialX = e.touches[0].screenX;
}

function moveTouch(e) {
  if (initialX === null) {
    return;
  }

  let currentX = e.changedTouches[0].screenX;
  let diffX = initialX - currentX;

  // sliding horizontally
  if (diffX / screen.width > xThreshold) {
    // swiped left
    swipePage(1);
  } else if (diffX / screen.width < -xThreshold) {
    // swiped right
    swipePage(-1);
  }
  initialX = null;
}

function swipePage(increment) {
  let q = qr_regenerate()
  if (q == true) {
    let slides = document.getElementById("main-panel-holder").children
    if (slide + increment < slides.length && slide + increment >= 0) {
      slides[slide].style.display = "none";
      slide += increment;
      window.scrollTo(0, 0);
      slides[slide].style.display = "table";
      document.getElementById('data').innerHTML = "";
      document.getElementById('copyButton').setAttribute('value', 'Copy Data');
    }
  }
}

function drawFields(name) {
  let fields = document.querySelectorAll("[id*='canvas_']");
  for (f of fields) {
    code = f.id.substring(7);
    let img = document.getElementById("img_" + code);
    let shape = document.getElementById("shape_" + code);
    let shapeArr = shape.value.split(' ');
    let ctx = f.getContext("2d");
    ctx.clearRect(0, 0, f.width, f.height);
    ctx.drawImage(img, 0, 0, f.width, f.height);

    let xyStr = document.getElementById("XY_" + code).value
    if (JSON.stringify(xyStr).length > 2) {
      pts = Array.from(JSON.parse(xyStr))
      for (p of pts) {
        let coord = p.split(",")
        let centerX = coord[0];
        let centerY = coord[1];
        let radius = 5;
        ctx.beginPath();
        let drawType = shapeArr[0].toLowerCase()
        if (drawType == 'circle') {
          ctx.arc(centerX, centerY, shapeArr[1], 0, 2 * Math.PI, false);
        } else if (drawType == 'rect') {
          try {
            let y_level = centerY < 80 ? 0 : 80
            let height = 80
            let x_level;
            let width;
            if (centerX < 35) {
              x_level = 0
              width = 34
            } else if (centerX < 100) {
              x_level = 34
              width = 69
            } else if (centerX < 150) {
              x_level = 100
              width = 48
            } else if (centerX < 200) {
              x_level = 150
              width = 43
            } else if (centerX < 260) {
              x_level = 193
              width = 70
            } else {
              x_level = 266
              width = 34
            }
            ctx.rect(x_level, y_level, width, height);
          } catch (e) {
            alert(e)
          }
        } else {
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        }
        ctx.lineWidth = 2;
        if (shapeArr[2] != "") {
          ctx.strokeStyle = shapeArr[2];
        } else {
          ctx.strokeStyle = '#FFFFFF';
        }
        if (shapeArr[4].toLowerCase() == 'true') {
          ctx.fillStyle = shapeArr[3];
        }
        if (drawType == 'rect') {
          ctx.fillStyle = 'rgba(255, 165, 0, 0.2)'
        }
        ctx.stroke();
        if (shapeArr[4].toLowerCase() == 'true') {
          ctx.fill();
        }
      }
    }
  }
}

function onFieldClick(event) {
  let target = event.target;
  let base = getIdBase(target.id);

  //Resolution height and width (e.g. 52x26)
  let resX = 12;
  let resY = 6;

  let dimensions = document.getElementById("dimensions" + base);
  if (dimensions.value != "") {
    let arr = dimensions.value.split(' ');
    resX = arr[0];
    resY = arr[1];
  }

  //Turns coordinates into a numeric box
  let box = ((Math.ceil(event.offsetY / target.height * resY) - 1) * resX) + Math.ceil(event.offsetX / target.width * resX);
  let coords = event.offsetX + "," + event.offsetY;
  let allowableResponses = document.getElementById("allowableResponses" + base).value;

  if(allowableResponses != "none"){
    let allowableResponsesList = allowableResponses.split(',').map(Number);
    if (allowableResponsesList.indexOf(box)==-1){
      return;
    }
  }

  //Cumulating values
  let changingXY = document.getElementById("XY" + base);
  let changingInput = document.getElementById("input" + base);
  let clickRestriction = document.getElementById("clickRestriction" + base).value;
  let toggleClick = document.getElementById("toggleClick" + base).value;
  let cycleTimer = document.getElementById("cycleTimer" + base);
  let boxArr = Array.from(JSON.parse(changingInput.value));
  let xyArr = Array.from(JSON.parse(changingXY.value));

  if ((toggleClick.toLowerCase() == 'true') &&
    (boxArr.includes(box))) {
    // Remove it
    let idx = boxArr.indexOf(box);
    boxArr.splice(idx, 1);
    xyArr.splice(idx, 1);
    changingInput.value = JSON.stringify(boxArr);
    changingXY.value = JSON.stringify(xyArr);
  } else {
    if (JSON.stringify(changingXY.value).length <= 2) {
      changingXY.value = JSON.stringify([coords]);
      changingInput.value = JSON.stringify([box]);
    } else if (clickRestriction == "one") {
      // Replace box and coords
      changingXY.value = JSON.stringify([coords]);
      changingInput.value = JSON.stringify([box]);
    } else if (clickRestriction == "onePerBox") {
      // Add if box already not in box list/Array
      if (!boxArr.includes(box)) {
        boxArr.push(box);
        changingInput.value = JSON.stringify(boxArr);

        coords = findMiddleOfBox(box, target.width, target.height, resX, resY);
        xyArr.push(coords);
        changingXY.value = JSON.stringify(xyArr);
      }
    } else {
      // No restrictions - add to array
      xyArr.push(coords);
      changingXY.value = JSON.stringify(xyArr);

      boxArr.push(box);
      changingInput.value = JSON.stringify(boxArr);
    }
    // If associated with cycleTimer - send New Cycle EVENT
    if (cycleTimer != null) {
      document.getElementById("cycle_" + cycleTimer.value).click();
    }
  }

  drawFields()
}

function findMiddleOfBox(boxNum, width, height, resX, resY) {
  let boxHeight = height / resY;
  let boxWidth = width / resX;
  let boxX = (boxNum % resX) - 1;
  if (boxX == -1) { boxX = resX - 1 }
  let boxY = Math.floor((boxNum - boxX + 1) / resX);
  let x = Math.round((boxWidth * boxX) + (Math.floor(boxWidth / 2)));
  let y = Math.round((boxHeight * boxY) + (Math.floor(boxHeight / 2)));
  return x+","+y
}

function getIdBase(name) {
  return name.slice(name.indexOf("_"), name.length)
}

function getTeamName(teamNumber) {
  if (teamNumber !== undefined) {
    if (teams) {
      let teamKey = "frc" + teamNumber;
      let ret = "";
      Array.from(teams).forEach(team => ret = team.key == teamKey ? team.nickname : ret);
      return ret;
    }
  }
  return "";
}

function getMatch(matchKey) {
  //This needs to be different than getTeamName() because of how JS stores their data
  if (matchKey !== undefined) {
    if (schedule) {
      let ret = "";
      Array.from(schedule).forEach(match => ret = match.key == matchKey ? match.alliances : ret);
      return ret;
    }
  }
  return "";
}

function getCurrentTeamNumberFromRobot() {
  if (getRobot() != "" && typeof getRobot() !== 'undefined' && getCurrentMatch() != "") {
    if (getRobot().charAt(0) == "r") {
      return getCurrentMatch().red.team_keys[parseInt(getRobot().charAt(1)) - 1]
    } else if (getRobot().charAt(0) == "b") {
      return getCurrentMatch().blue.team_keys[parseInt(getRobot().charAt(1)) - 1]
    }
  }
}

function getCurrentMatchKey() {
  return document.getElementById("input_e").value + "_" + getLevel() + document.getElementById("input_m").value;
}

function getCurrentMatch() {
  return getMatch(getCurrentMatchKey());
}

function updateMatchStart(event) {
  if ((getCurrentMatch() == "") ||
    (!teams)) {
    console.log("No match or team data.");
    return;
  }
  if (event.target.id.startsWith("input_r")) {
    document.getElementById("input_t").value = getCurrentTeamNumberFromRobot().replace("frc", "");
    onTeamnameChange();
  }
  if (event.target.id == "input_m") {
    if (getRobot() != "" && typeof getRobot()) {
      document.getElementById("input_t").value = getCurrentTeamNumberFromRobot().replace("frc", "");
      onTeamnameChange();
    }
  }
}

function onTeamnameChange(event) {
  let newNumber = document.getElementById("input_t").value;
  let teamLabel = document.getElementById("teamname-label");
  if (newNumber != "") {
    teamLabel.innerText = getTeamName(newNumber) != "" ? "You are scouting " + getTeamName(newNumber) : "That team isn't playing this match, please double check to verify correct number";
  } else {
    teamLabel.innerText = "";
  }
}

/**
 * adds to the number in innerHTML of the value tag.
 * @param {element} element the <div> tag element (parent to the value tag).
 * @param {number} step the amount to add to the value tag.
 */
function counter(element, step) {
  let target = event.target;
  let base = getIdBase(target.id);

  let ctr = element.getElementsByClassName("counter")[0];
  let cycleTimer = document.getElementById("cycleTimer" + base);
  let result = parseInt(ctr.value) + step;

  if (isNaN(result)) {
    result = 0;
  }

  if (result >= 0 || ctr.hasAttribute('data-negative')) {
    ctr.value = result;
  } else {
    ctr.value = 0;
  }

  // If associated with cycleTimer - send New Cycle EVENT
  if (step >= 0 && cycleTimer != null) {
    document.getElementById("cycle_" + cycleTimer.value).click();
  }
}

function resetTimer(event) {
  let timerID = event.firstChild;
  let tId = getIdBase(timerID.id);
  let inp = document.getElementById("input" + tId)
  inp.value = 0

  // stop timer
  timerStatus = document.getElementById("status" + tId);
  startButton = document.getElementById("start" + tId);
  intervalIdField = document.getElementById("intervalId" + tId);
  let intervalId = intervalIdField.value;
  timerStatus.value = 'stopped';
  startButton.setAttribute("value", "Start");
  if (intervalId != '') {
    clearInterval(intervalId);
  }
  intervalIdField.value = '';
}

function timer(event) {
  let timerID = event.firstChild;
  let tId = getIdBase(timerID.id)
  timerStatus = document.getElementById("status" + tId);
  startButton = document.getElementById("start" + tId);
  intervalIdField = document.getElementById("intervalId" + tId);
  let statusValue = timerStatus.value;
  let intervalId = intervalIdField.value;
  if (statusValue == 'stopped') {
    timerStatus.value = 'started';
    startButton.setAttribute("value", "Stop");

    let intId = setInterval(() => {
      if (document.getElementById("status" + tId).value == 'started') {
        inp = document.getElementById("input" + tId);
        let t = parseFloat(inp.value);
        t += 0.1;
        tTrunc = t.toFixed(1)
        inp.value = tTrunc;
      }
    }, 100);
    intervalIdField.value = intId;
  } else {
    timerStatus.value = 'stopped';
    startButton.setAttribute("value", "Start");

    clearInterval(intervalId);
    intervalIdField.value = '';
  }
  drawFields();
}

function undo(event) {
  let undoID = event.firstChild;
  //Getting rid of last value
  changingXY = document.getElementById("XY" + getIdBase(undoID.id));
  changingInput = document.getElementById("input" + getIdBase(undoID.id));
  let tempValue = Array.from(JSON.parse(changingXY.value));
  tempValue.pop();
  changingXY.value = JSON.stringify(tempValue);

  tempValue = Array.from(JSON.parse(changingInput.value));
  tempValue.pop();
  changingInput.value = JSON.stringify(tempValue);
  drawFields();
}

function flip(event) {
  let flipID = event.firstChild;
  let flipImg = document.getElementById("canvas" + getIdBase(flipID.id));
  if (flipImg.style.transform == "") {
    flipImg.style.transform = 'rotate(180deg)';
  } else {
    flipImg.style.transform = '';
  }
  drawFields();
}

function displayData(){
  document.getElementById('data').innerHTML = getData(dataFormat);
}

function copyData(){
  navigator.clipboard.writeText(getData(dataFormat));
  document.getElementById('copyButton').setAttribute('value','Copied');
}

window.onload = function () {
  let ret = configure();
  if (ret !== -1) {
    let ece = document.getElementById("input_e");
    let ec = null;
    if (ece != null) {
      ec = ece.value;
    }
    if (ec != null) {
      getTeams(ec);
      getSchedule(ec);
    }
    this.drawFields();
    if (enableGoogleSheets) {
      console.log("Enabling Google Sheets.");
      setUpGoogleSheets();
    }
  }
};
