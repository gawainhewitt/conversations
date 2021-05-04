// sizing and resizing dynamically is happening in css #mycanvas and #parentdiv - overrides what's happening in here

//getting there!

let theVolume = -10;
let performerSteps = 3;
let performerRows = 2;
let numberOfPerformers = performerSteps * performerRows;// automatically generate circular synth based on this
let performerButtonPositions = []; // position to draw the buttons

let chairSteps = 16;
let chairRows = 6;
let chairRowIncrement; // defined in setup
let chairRowPosition; // defined in setup

let chairStuff = new Array ();
for(let i = 0; i < chairRows; i++){
    chairStuff[i] = new Array ();
}

let totalNumberOfButtons = numberOfPerformers + chairSteps + chairRows;

let endedTouches = []; // array to store ended touches in

let buttonColour = []; // colour of the performer buttons at any given time
let buttonOffColour; // default off colours for performer buttons
let buttonOnColour; // default on colours for performer buttons
let synthState = []; // we need to store whether a note is playing because the synth is polyphonic and it will keep accepting on messages with every touch or moved touch and we won't be able to switch them all off
let radius; // radius of the buttons
let offsetT; // to store the difference between x and y readings once menus are taken into account
let r; // radius of the circle around which the buttons will be drawn
let angle = 0; // variable within which to store the angle of each button as we draw it
let step; // this will be calculated and determine the gap between each button around the circle
let ongoingTouches = []; // array to copy the ongoing touch info into

let soundOn = false; // have we instigated Tone.start() yet? (needed to allow sound)
let whichKey = [0,0,0,0,0,0,0,0,0]; // array ensures only one trigger per qwerty click
let mouseState = []; // variable to store mouse clicks and drags in
let mouseClick = false;

let stage_x; // position of stage
let stage_y; // position of stage
let grassPosition; // position of grass, set in setup as uses p5 function

let stage2image; // current image for these items

let carpet, chairOn, chairOff, chairStep1, chairStep2, grass, stage, stage2; // to store images in

let stagewidth;
let stageheight;
let chairWidth;
let chairHeight;
let stage2width;

let one = 'loop1_5bars';
let two = 'loop2_2bars';
let three = 'loop3_2bars';
let four = 'loop4_2bars';
let five = 'loop5_14bars';
let six = 'loop6_free';

let stepName = new Array;

for(let i = 0; i < chairRows; i++){
  stepName[i] = `step${i}`;
}

const player1 = new Tone.Player().toDestination();
const player2 = new Tone.Player().toDestination();
const player3 = new Tone.Player().toDestination();
const player4 = new Tone.Player().toDestination();
const player5 = new Tone.Player().toDestination();
const player6 = new Tone.Player().toDestination();

let seqPlayers = new Array;

for(let i = 0; i < chairRows; i++){
  seqPlayers[i] = new Tone.Player().toDestination();
}

let playerArray = [player1, player2, player3, player4, player5, player6];

let seqBuffers = new Array;

let originalTempo = 85;
Tone.Transport.bpm.value = originalTempo;
Tone.Transport.loopEnd.value = "8m";
console.log(`bpm ${Math.round(Tone.Transport.bpm.value)}`);

let slower;
let faster;
let save;

let bpmShow = false;

let bpmTextSize;
let optionTextSize;

function preload() {
  carpet = loadImage(`/images/background.jpg`);
  chairOn = loadImage(`/images/bird_on.png`);
  chairOff = loadImage(`/images/bird.png`);
  chairStep1 = loadImage(`/images/bird_icon_yellow.png`);
  chairStep2 = loadImage(`/images/bird_icon_purple.png`);
  grass = loadImage(`/images/grass.jpg`);
  stage = loadImage(`/images/tree.png`);
  stage2off = loadImage(`/images/tree2_off.png`);

  buffers = new Tone.ToneAudioBuffers({
    urls: {
      A1: `${one}.flac`,
      A2: `${two}.flac`,
      A3: `${three}.flac`,
      A4: `${four}.flac`,
      A5: `${five}.flac`,
      A6: `${six}.flac`,
    },
    //onload:  () => welcomeScreen(), // initial screen for project - also allows an elegant place to put in the Tone.start() command.,
    baseUrl: "/sounds/"
  });

  for(let i = 0; i < chairRows; i++){
    seqBuffers[i] = new Tone.ToneAudioBuffer(`/sounds/${stepName[i]}.flac`)
  }

}

function setup() {  // setup p5
  step = TWO_PI/numberOfPerformers; // in radians the equivalent of 360/6 - this will be used to draw the circles position
  console.log(`step = ${step}`);

  let masterDiv = document.getElementById("container");
  let divPos = masterDiv.getBoundingClientRect(); //The returned value is a DOMRect object which is the smallest rectangle which contains the entire element, including its padding and border-width. The left, top, right, bottom, x, y, width, and height properties describe the position and size of the overall rectangle in pixels.
  let masterLeft = divPos.left; // distance from left of screen to left edge of bounding box
  let masterRight = divPos.right; // distance from left of screen to the right edge of bounding box
  let cnvDimension = masterRight - masterLeft; // size of div -however in some cases this is wrong, so i am now using css !important to set the size and sca;ing - but have kept this to work out size of other elements if needed

  console.log("canvas size = " + cnvDimension);

  let cnv = createCanvas(cnvDimension, cnvDimension); // create canvas - because i'm now using css size and !important this sizing actually reduntant
  cnv.id('mycanvas'); // assign id to the canvas so i can style it - this is where the css dynamic sizing is applied
  cnv.parent('p5parent'); //put the canvas in a div with this id if needed - this also needs to be sized

  // *** add vanilla JS event listeners for touch which i want to use in place of the p5 ones as I believe that they are significantly faster
  let el = document.getElementById("p5parent");
  el.addEventListener("click", handleClick);

  offsetT = el.getBoundingClientRect(); // get the size and position of the p5parent div so i can use offset top to work out where touch and mouse actually need to be

  noStroke(); // no stroke on the drawings

  radius = width/14;
  r = width/5;
  stage_x = (width/2);
  stage_y = (height/4);
  stage2image = stage2off;
  grassPosition = (height/10)*9;
  buttonOffColour = 'rgba(0, 200, 70, 0.3)'; // default off colours for stage buttons
  buttonOnColour = 'rgba(255, 255, 0, 0.3)'; // default on colours for stage buttons
  stagewidth = (width/5)*3.5;
  stageheight = (width/5)*3;
  chairWidth = width/9;
  chairHeight = width/12;
  stage2width = width/6;
  chairRowIncrement = height/15; // how close are the rows to each other?
  chairRowPosition = height/2; // where is the sequencer positioned?
  speed_text_y =  height/10*9.5;
  bpmTextSize = width/8;
  optionTextSize = width/16;
  slower = ({
    x: width/10,
    y: height/10*9.5,
    text: 'Slower',
    colour: 'rgba(255, 255, 255, 0.9)'
  });
  faster = ({
    x: width/10*9,
    y: height/10*9.5,
    text: 'Faster',
    colour: 'rgba(255, 255, 255, 0.9)'
  });
  save = ({
    x: width/2,
    y: height/10*9.5,
    text: 'Save',
    colour: 'rgba(255, 255, 255, 0.9)'
  });

  for (let i = 0; i < numberOfPerformers; i++) { // for each button build mouseState default array
    mouseState.push(0);
  }

  if (window.DeviceOrientationEvent) {      // if device orientation changes we recalculate the offsetT variable
    window.addEventListener("deviceorientation", handleOrientationEvent);
  }

  welcomeScreen(); // initial screen for project - also allows an elegant place to put in the Tone.start() command.
                    // if animating put an if statement in the draw() function otherwise it will instantly overide it
  createButtonPositions(); // generate the default array info depending on number of buttons
}

function handleOrientationEvent() {
  let el = document.getElementById("p5parent");
  offsetT = el.getBoundingClientRect(); // get the size and position of the p5parent div so i can use offset top to work out where touch and mouse actually need to be
}

function welcomeScreen() {
  background(150); // background is grey (remember 5 is maximum because of the setup of colorMode)
  textSize(32);
  textAlign(CENTER, CENTER);
  text("Performance Zone. Touch screen or click mouse to start", width/10, height/10, (width/10) * 8, (height/10) * 8);
}

function createButtonPositions() {

  //stage button positions

  let performerStepstart = stage_x - radius*2.5;
  let stageStepIncrement = radius*2.3;
  let stageStepDistance = performerStepstart;
  let stageRowIncrement = radius*2.5;
  let stageRowPosition = stage_y - radius*2;

  for(let i = 0; i < performerRows; i++){
    for(let i = 0; i < performerSteps; i++){
      performerButtonPositions.push({
        x: stageStepDistance,
        y: stageRowPosition,
        state: 0,
        colour: buttonOffColour
      });
      stageStepDistance = stageStepDistance + stageStepIncrement;
    }
    stageStepDistance = performerStepstart;
    stageRowPosition = stageRowPosition + stageRowIncrement;
  }

  for(let i = 0; i < performerButtonPositions.length; i++){
    synthState.push(0); //create default state of the synth array
    buttonColour[i] = buttonOffColour;
  }

  //next the positions of the chair sequencer buttons

  let step = (chairSteps/chairSteps);
  let chairStepstart = width/(chairSteps*1.5);
  let chairStepIncrement = width/(chairSteps + (step*0.5));
  let chairStepDistance = chairStepstart;
  let chairRowDistance = chairRowIncrement;

  for(let i = 0; i < chairRows; i++){
    for(let j = 0; j < chairSteps; j++){
      chairStuff[i].push({
        x: chairStepDistance,
        y: chairRowPosition,
        state: 0,
        image: chairOff
      });
      chairStepDistance = chairStepDistance + chairStepIncrement;
    }
    chairStepDistance = chairStepstart;
    chairRowPosition = chairRowPosition + chairRowIncrement;
  }
}

function drawSynth(step) { // instead of using the draw function at 60 frames a second we will call this function when something changes

  imageMode(CORNER);

  image(carpet, 0, 0, width, height); // place the carpet image
  imageMode(CENTER);
  image(stage, stage_x, stage_y + (chairHeight/3), stagewidth, stageheight); // place the stage image
  imageMode(CORNER);
  image(grass, 0, grassPosition, width, (height/5)*2); // place the grass image
  image(stage2image, (width/10)*8, grassPosition - stage2width, stage2width, stage2width);

  for (let i = 0; i < numberOfPerformers; i++) { // draw the looper buttons on stage
    fill(performerButtonPositions[i].colour);
    ellipse(performerButtonPositions[i].x, performerButtonPositions[i].y, radius * 2);
  }

  imageMode(CENTER);

  for(let i = 0; i < chairRows; i++){
    for(let j = 0; j < chairSteps; j++){
      if((j === step) && (chairStuff[i][j].state === 0)){ // if this is the current step and the step is "off"
        image(chairStep1, chairStuff[i][j].x, chairStuff[i][j].y, chairWidth, chairHeight); // then yellow chair for this step
      }else if((j === step) && (chairStuff[i][j].state === 1)){ // if this is the current step and the step is "on"
        image(chairStep2, chairStuff[i][j].x, chairStuff[i][j].y, chairWidth, chairHeight); // then purple chair for this step
      }
      else{
        image(chairStuff[i][j].image, chairStuff[i][j].x, chairStuff[i][j].y, chairWidth, chairHeight); // otherwise chair colour reflects step state
      }
    }
  }

  textFont('Helvetica');
  textSize(optionTextSize);
  fill(slower.colour);
  text(slower.text, slower.x, slower.y);
  fill(faster.colour);
  text(faster.text, faster.x, faster.y);
  fill(save.colour);
  text(save.text, save.x, save.y);

  if(bpmShow){
    textSize(bpmTextSize);
    fill('rgba(255, 255, 255, 0.7)');
    text(`BPM ${Math.round(Tone.Transport.bpm.value)}`, width/2, height/2);
  }
}

function startAudio() {
  Tone.start(); // we need this to allow audio to start.
  soundOn = true;
  drawSynth();
  player1.buffer = buffers.get("A1");
  player1.set(
    {
      "mute": false,
      "volume": -100,
      "autostart": false,
      "fadeIn": 0,
      "fadeOut": 0,
      "loop": false,
      "loopEnd": "1m",
      "loopStart": 0,
      "playbackRate": 1,
      "reverse": false
    }
  );
  player2.buffer = buffers.get("A2");
  player2.set(
    {
      "mute": false,
      "volume": -100,
      "autostart": false,
      "fadeIn": 0,
      "fadeOut": 0,
      "loop": false,
      "loopEnd": "1m",
      "loopStart": 0,
      "playbackRate": 1,
      "reverse": false
    }
  );
  player3.buffer = buffers.get("A3");
  player3.set(
    {
      "mute": false,
      "volume": -100,
      "autostart": false,
      "fadeIn": 0,
      "fadeOut": 0,
      "loop": false,
      "loopEnd": "1m",
      "loopStart": 0,
      "playbackRate": 1,
      "reverse": false
    }
  );
  player4.buffer = buffers.get("A4");
  player4.set(
    {
      "mute": false,
      "volume": -100,
      "autostart": false,
      "fadeIn": 0,
      "fadeOut": 0,
      "loop": false,
      "loopEnd": "1m",
      "loopStart": 0,
      "playbackRate": 1,
      "reverse": false
    }
  );
  player5.buffer = buffers.get("A5");
  player5.set(
    {
      "mute": false,
      "volume": -100,
      "autostart": false,
      "fadeIn": 0,
      "fadeOut": 0,
      "loop": false,
      "loopEnd": "1m",
      "loopStart": 0,
      "playbackRate": 1,
      "reverse": false
    }
  );
  player6.buffer = buffers.get("A6");
  player6.set(
    {
      "mute": false,
      "volume": -100,
      "autostart": false,
      "fadeIn": 0,
      "fadeOut": 0,
      "loop": true,
      "loopEnd": "69.854",
      "loopStart": 0,
      "playbackRate": 1,
      "reverse": false
    }
  );

  for(let i = 0; i < chairRows; i++){
    seqPlayers[i].buffer = seqBuffers[i].get();
    seqPlayers[i].set(
      {
        "mute": false,
        "volume": -10,
        "autostart": false,
        "fadeIn": 0,
        "fadeOut": 0,
        "loop": false,
        "playbackRate": 1,
        "reverse": false
      }
    );
  }

  Tone.Transport.start();
  Tone.Transport.scheduleRepeat(repeat, '8n'); // call our function 'repeat' every x time (8n or an 8th note in this case)
  Tone.Transport.scheduleRepeat(play_ = () => {player1.start();}, '5m');
  Tone.Transport.scheduleRepeat(play_ = () => {player2.start();}, '2m');
  Tone.Transport.scheduleRepeat(play_ = () => {player3.start();}, '2m');
  Tone.Transport.scheduleRepeat(play_ = () => {player4.start();}, '2m');
  Tone.Transport.scheduleRepeat(play_ = () => {player5.start();}, '14m');
  player6.start();// this one in free time
  retrieveSavedWork();
}

// function playLooper(time) {
//   player1.start();
//   //sampler.triggerAttackRelease('D3', '4m', time);
//   player2.start();
//   player3.start();
//   player4.start();
//   player5.start();
// }


function handleClick(e){
  if(soundOn) {

    for (let i = 0; i < numberOfPerformers; i++) {
      let d = dist(mouseX, mouseY, performerButtonPositions[i].x, performerButtonPositions[i].y);
      if (d < radius) {
        buttonPressed(i);
      }
    }

    for(let i = 0; i < chairRows; i++){
      for(let j = 0; j < chairSteps; j++){
        let d = dist(mouseX, mouseY, chairStuff[i][j].x, chairStuff[i][j].y);
        if (d < chairHeight/2) {
          seqPressed(i, j);
        }
      }
    }

    if(isMouseInsideText(slower.text, slower.x, slower.y)){
      console.log("slower");
      if(Tone.Transport.bpm.value > 35){
        Tone.Transport.bpm.value = Tone.Transport.bpm.value - 5;
      }
      setSpeed(Tone.Transport.bpm.value);
      console.log(`bpm ${Math.round(Tone.Transport.bpm.value)}`);
      slower.colour = 'rgba(255, 0, 255, 0.9)'
      bpmShow = true;
      drawSynth();
      setTimeout(() => {
        bpmShow = false;
        slower.colour = 'rgba(255, 255, 255, 0.9)';
        drawSynth();
      }, 1000);
    }

    if(isMouseInsideText(faster.text, faster.x, faster.y)){
      console.log("faster");
      if(Tone.Transport.bpm.value < 195){
        Tone.Transport.bpm.value = Tone.Transport.bpm.value + 5;
      }
      setSpeed(Tone.Transport.bpm.value);
      console.log(`bpm ${Math.round(Tone.Transport.bpm.value)}`);
      faster.colour = 'rgba(255, 0, 255, 0.9)'
      bpmShow = true;
      drawSynth();
      setTimeout(() => {
        bpmShow = false;
        faster.colour = 'rgba(255, 255, 255, 0.9)';
        drawSynth();
      }, 1000);
    }

    if(isMouseInsideText(save.text, save.x, save.y)){
      console.log("save");
      save.colour = 'rgba(255, 0, 255, 0.9)'
      saveSeq();
      drawSynth();
      setTimeout(() => {
        save.colour = 'rgba(255, 255, 255, 0.9)';
        drawSynth();
      }, 1000);
    }

  }else{
    startAudio();
  }
}

function seqPressed(row, step) {

  if(chairStuff[row][step].state === 0) { // if the synth is not playing that note at the moment
    chairStuff[row][step].image = chairOn;
    drawSynth();
    chairStuff[row][step].state = 1; // change the array to reflect that the note is playing
  }
  else { // if the synth is playing that note at the moment
    chairStuff[row][step].image = chairOff;
    drawSynth();
    chairStuff[row][step].state = 0; // change the array to reflect that the note is playing
  }
  console.log(`row${row} step ${step} = ${chairStuff[row][step].state}`);


}

function setSpeed(tempo) {
  for(let i = 0; i < playerArray.length; i++){
    playerArray[i].playbackRate = tempo/originalTempo;
  }
  for(let i = 0; i < seqPlayers.length; i++){
    seqPlayers[i].playbackRate = tempo/originalTempo;
  }
}

function buttonPressed(i) {
    if(performerButtonPositions[i].state === 0) { // if the synth is not playing that note at the moment
      playerArray[i].volume.rampTo(theVolume, 2);
      performerButtonPositions[i].colour = buttonOnColour; //change the colour of the button to on colour
      drawSynth();
      performerButtonPositions[i].state = 1; // change the array to reflect that the note is playing
    }
    else { // if the synth is playing that note at the moment
      playerArray[i].volume.rampTo(-100, 2);
      performerButtonPositions[i].colour = buttonOffColour; //change the colour of the button to off colour
      drawSynth();
      performerButtonPositions[i].state = 0; // change the array to reflect that the note is playing
    }
    console.log(`performerButtonPositions${i} = ${performerButtonPositions[i].state}`);
}

let index = 0;
    notes = ['a3', 'g3', 'e3', 'd3', 'c3'];

    const sampler = new Tone.Sampler({
      urls: {
        A3: "step1.flac",
        G3: "step2.flac",
        E3: "step3.flac",
        D3: "loop1_5bars.flac"
      },
      baseUrl: "/sounds/",
    // 	onload: () => {
    //     // hideLoadScreen();
    //   }
      volume: theVolume
    }).toDestination();

function repeat(time) {
  let _step = index % chairSteps;
  drawSynth(_step)
  for(let i = 0; i < chairRows; i++) {
    //console.log(`row ${i} step ${_step} `);
    //note = notes[i];
    //console.log(`row ${i} step ${_step} ${chairStuff[i][_step].state}`);
    if(chairStuff[i][_step].state === 1) {
      //sampler.triggerAttackRelease(note, '4n', time);
      seqPlayers[i].start();
    }
  }

  index++;
}

function isMouseInsideText(text, textX, textY) {
  const messageWidth = textWidth(text);
  const messageTop = textY - textAscent();
  const messageBottom = textY + textDescent();

  return mouseX > textX - messageWidth/2 && mouseX < textX + messageWidth/2 && // note messageWidth/2 because text being drawn centred in draw
    mouseY > messageTop && mouseY < messageBottom;
}



// save functionality here

//document.URL is the current url
var url_ob = new URL(document.URL);


let chairSaveSteps = new Array;
for(let i = 0; i < chairRows; i++){
  chairSaveSteps[i] = new Array;
}

for(let i = 0; i < chairRows; i++){ // setup and initialise the array
  for(let j = 0; j < chairSteps; j++){
    chairSaveSteps[i].push(0);
  }
}

let performerStepsToSave = new Array;

for(let i = 0; i < performerButtonPositions.length; i++){
  performerStepsToSave[i].push(0);
}


function saveSeq() {
  for(let i = 0; i < chairRows; i++){
    for(let j = 0; j < chairSteps; j++){
      chairSaveSteps[i][j] = chairStuff[i][j].state;
    }
  }

  for(let i = 0; i < performerButtonPositions.length; i++){
    performerStepsToSave[i] = performerButtonPositions[i].state;
  }

  let chairRowsArray = new Array;
  for(let i = 0; i < chairRows; i++){
    chairRowsArray[i] = chairSaveSteps[i].join('');
  }
  let _stageRow = performerStepsToSave.join('');
  let chairHex = new Array;
  for(let i = 0; i < chairRows; i++){
    chairHex[i] = parseInt(chairRowsArray[i], 2).toString(16);
  }
  let stageHex = parseInt(_stageRow, 2).toString(16);
  let bpmToSave = parseInt(Tone.Transport.bpm.value, 10).toString(16);
  let hexToSave = '';
  for(let i = 0; i < chairRows; i++){
    hexToSave = `${hexToSave}${chairHex[i]}_`;
  }
  hexToSave = `${hexToSave}${stageHex}_${bpmToSave}`;
  console.log(hexToSave);
  url_ob.hash = `#${hexToSave}`;
  var new_url = url_ob.href;
  document.location.href = new_url;
}


function retrieveSavedWork() {

var savedWork = url_ob.hash; //retrieve saved work from url
var savedWorkNoHash = savedWork.replace('#', ''); // remove the hash from it leaving only the number
var savedWorkAsArray = savedWorkNoHash.split('_');
console.log(savedWorkAsArray);
var  savedChairRowBinary = new Array;
for(let i = 0; i < chairRows; i++){
  savedChairRowBinary[i] = (parseInt(savedWorkAsArray[i], 16).toString(2)); // convert chair row to binary
}
var savedchairRow = new Array;
for(let i = 0; i < chairRows; i++){
  savedchairRow[i] = savedChairRowBinary[i].split(''); // convert to array
  console.log(`chair row${i} ${savedchairRow[i]}`);
}
var savedstageButtons = (parseInt(savedWorkAsArray[chairRows], 16).toString(2));// convert saved stage buttons to binary
console.log(`stage row  ${savedstageButtons}`);
let savedstageButtonsAsArray = savedstageButtons.split(''); // convert to array
console.log(`savedstageButtonsAsArray ${savedstageButtonsAsArray}`);
var savedTempo = (parseInt(savedWorkAsArray[chairRows+1], 16).toString(10));// convert tempo to decimal
console.log(`saved tempo  ${savedTempo}`);

for(let i = numberOfPerformers - 1; i >= 0 ; i--){
  let a = [];
  if(savedstageButtonsAsArray.length > 0){
    a[i] = savedstageButtonsAsArray.pop();
    }else{
    a[i] = 0;
    }
  if(a[i] === "1"){ // you need to put "" around the number because you are comparing a number with a string
    buttonPressed(i);
  }
}

for(let i = 0; i < chairRows; i++){
  console.log(`am i here? chairRow ${i}`);
  for(let j = chairSteps - 1; j >= 0 ; j--){
    let a = [];
    console.log(`savedchairRow ${i} = ${savedchairRow[i]}`);
    if(savedchairRow[i].length > 0){
      a[j] = savedchairRow[i].pop();
      }else{
      a[j] = 0;
      }
    if(a[j] === "1"){ // you need to put "" around the number because you are comparing a number with a string
      seqPressed(i, j);
    }
  }
}

if(isNaN(savedTempo) === false){
  Tone.Transport.bpm.value = savedTempo;

  setSpeed(Tone.Transport.bpm.value);
  console.log(`saved bpm ${Math.round(Tone.Transport.bpm.value)}`);
  bpmShow = true;
  //drawSynth();
  setTimeout(() => {
    bpmShow = false;
    faster.colour = 'rgba(255, 255, 255, 0.9)';
    drawSynth();
  }, 1000);

}

}
