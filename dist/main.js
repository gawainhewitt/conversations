// sizing and resizing dynamically is happening in css #mycanvas and #parentdiv - overrides what's happening in here

//look at correct way to tie images and sound in tone

// add boolean for monophonic or polyphonic looper

// is the site in fact going at half speed?

// better touch and mouse implementation

//save to bring up a clearer dialogue

let theVolume = -10;
let looperSteps = 3;
let looperRows = 2;
let numberOfloopers = looperSteps * looperRows;// automatically generate circular synth based on this
let looperButtonPositions = []; // position to draw the buttons

let seqSteps = 8;
let seqRows = 5;
let seqRowIncrement; // defined in setup
let seqRowPosition; // defined in setup

let seqStuff = new Array ();
for(let i = 0; i < seqRows; i++){
    seqStuff[i] = new Array ();
}

let totalNumberOfButtons = numberOfloopers + seqSteps + seqRows;

let endedTouches = []; // array to store ended touches in

let buttonColour = []; // colour of the looper buttons at any given time
let buttonOffColour; // default off colours for looper buttons
let buttonOnColour; // default on colours for looper buttons
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

let looper_x; // position of looper
let looper_y; // position of looper
let grassPosition; // position of grass, set in setup as uses p5 function

let carpet, seqOn, seqOff, seqStep1, seqStep2, grass, looper, looper2; // to store images in

let performerOff = new Array;
let performerOn = new Array;

let looperwidth;
let looperheight;
let seqWidth;
let seqHeight;
let looper2width;

let one = 'loop1';
let two = 'loop2';
let three = 'loop3';
let four = 'loop4';
let five = 'loop5';
let six = 'loop6';

let stepName = new Array;

for(let i = 0; i < seqRows; i++){
  stepName[i] = `step${i}`;
}

const player1 = new Tone.Player().toDestination();
const player2 = new Tone.Player().toDestination();
const player3 = new Tone.Player().toDestination();
const player4 = new Tone.Player().toDestination();
const player5 = new Tone.Player().toDestination();
const player6 = new Tone.Player().toDestination();

let seqPlayers = new Array;

for(let i = 0; i < seqRows; i++){
  seqPlayers[i] = new Tone.Player().toDestination();
}

let playerArray = [player1, player2, player3, player4, player5, player6];

let seqBuffers = new Array;

let originalTempo = 100;
Tone.Transport.bpm.value = originalTempo;
Tone.Transport.loopEnd.value = "8m";
console.log(`bpm ${Math.round(Tone.Transport.bpm.value)}`);

let slower;
let faster;
let save;

let bpmShow = false;

let bpmTextSize;
let saveTextSize;
let speedTextSize;

let cnvDimension;

let saveText;

let inp;

function preload() {
  carpet = loadImage(`/images/background.png`);
  seqOn = loadImage(`/images/chairYellow.png`);
  seqOff = loadImage(`/images/chair.png`);
  seqStep1 = loadImage(`/images/chairGreen.png`);
  seqStep2 = loadImage(`/images/chairBlue.png`);
  grass = carpet;
  looper = loadImage(`/images/wigmorestage2.png`);
  for(let i = 0; i < numberOfloopers; i++){
    performerOff[i] = loadImage(`/images/performerOff${i+1}.png`);
    performerOn[i] = loadImage(`/images/performerOn${i+1}.png`);
  }

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

  for(let i = 0; i < seqRows; i++){
    seqBuffers[i] = new Tone.ToneAudioBuffer(`/sounds/${stepName[i]}.flac`)
  }

}

function setup() {  // setup p5
  step = TWO_PI/numberOfloopers; // in radians the equivalent of 360/6 - this will be used to draw the circles position
  console.log(`step = ${step}`);

  let masterDiv = document.getElementById("container");
  let divPos = masterDiv.getBoundingClientRect(); //The returned value is a DOMRect object which is the smallest rectangle which contains the entire element, including its padding and border-width. The left, top, right, bottom, x, y, width, and height properties describe the position and size of the overall rectangle in pixels.
  let masterLeft = divPos.left; // distance from left of screen to left edge of bounding box
  let masterRight = divPos.right; // distance from left of screen to the right edge of bounding box
  cnvDimension = masterRight - masterLeft; // size of div -however in some cases this is wrong, so i am now using css !important to set the size and sca;ing - but have kept this to work out size of other elements if needed

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
  looper_x = (width/2);
  looper_y = (height/4);
  grassPosition = (height/10)*9;
  buttonOffColour = 'rgba(0, 200, 70, 0.3)'; // default off colours for looper buttons
  buttonOnColour = 'rgba(255, 255, 0, 0.3)'; // default on colours for looper buttons
  looperwidth = (width/5)*3.5;
  looperheight = (width/5)*3;
  seqWidth = width/10;
  seqHeight = width/13;
  looper2width = width/6;
  seqRowIncrement = height/11; // how close are the rows to each other?
  seqRowPosition = (height/9) * 5; // where is the sequencer positioned on the y axis?
  speed_text_y =  height/10*9.5;
  bpmTextSize = width/8;
  speedTextSize = width/8;
  saveTextSize = width/16;
  slower = ({
    x: width/10,
    y: height/10*0.8,
    text: '-',
    colour: 'rgba(255, 255, 255, 0.9)'
  });
  faster = ({
    x: width/10*9,
    y: height/10*0.8,
    text: '+',
    colour: 'rgba(255, 255, 255, 0.9)'
  });
  save = ({
    x: width/2,
    y: height/10*0.75,
    text: 'Save',
    colour: 'rgba(255, 255, 255, 0.9)',
    status: false
  });

  for (let i = 0; i < numberOfloopers; i++) { // for each button build mouseState default array
    mouseState.push(0);
  }

  if (window.DeviceOrientationEvent) {      // if device orientation changes we recalculate the offsetT variable
    window.addEventListener("deviceorientation", handleOrientationEvent);
  }

  welcomeScreen(); // initial screen for project - also allows an elegant place to put in the Tone.start() command.
                    // if animating put an if statement in the draw() function otherwise it will instantly overide it
  createButtonPositions(); // generate the default array info depending on number of buttons

  inp = createInput(([saveText]));
  inp.id("myInput");
  inp.parent('p5parent');
  inp.position(cnvDimension/4, cnvDimension/2);
  inp.size(cnvDimension/2);
  inp.hide();
}

function handleOrientationEvent() {
  let el = document.getElementById("p5parent");
  offsetT = el.getBoundingClientRect(); // get the size and position of the p5parent div so i can use offset top to work out where touch and mouse actually need to be
}

function welcomeScreen() {
  background(150); // background is grey (remember 5 is maximum because of the setup of colorMode)
  textSize(cnvDimension/10);
  textAlign(CENTER, CENTER);
  text("Creation Zone. Touch screen or click mouse to start", width/10, height/10, (width/10) * 8, (height/10) * 8);
}

function createButtonPositions() {

  //looper button positions

  let looperStepstart = looper_x - radius*2.3;
  let looperStepIncrement = radius*2.3;
  let looperStepDistance = looperStepstart;
  let looperRowIncrement = radius*2.5;
  let looperRowPosition = looper_y - radius/2;

  for(let i = 0; i < looperRows; i++){
    for(let i = 0; i < looperSteps; i++){
      looperButtonPositions.push({
        x: looperStepDistance,
        y: looperRowPosition,
        state: 0,
        colour: buttonOffColour
      });
      looperStepDistance = looperStepDistance + looperStepIncrement;
    }
    looperStepDistance = looperStepstart;
    looperRowPosition = looperRowPosition + looperRowIncrement;
  }

  for(let i = 0; i < looperButtonPositions.length; i++){
    synthState.push(0); //create default state of the synth array
    buttonColour[i] = buttonOffColour;
  }

  //next the positions of the seq sequencer buttons

  let step = (seqSteps/seqSteps);
  let seqStepstart = width/(seqSteps*1.5);
  let seqStepIncrement = width/(seqSteps + (step*0.5));
  let seqStepDistance = seqStepstart;
  let seqRowDistance = seqRowIncrement;

  for(let i = 0; i < seqRows; i++){
    for(let j = 0; j < seqSteps; j++){
      seqStuff[i].push({
        x: seqStepDistance,
        y: seqRowPosition,
        state: 0,
        image: seqOff
      });
      seqStepDistance = seqStepDistance + seqStepIncrement;
    }
    seqStepDistance = seqStepstart;
    seqRowPosition = seqRowPosition + seqRowIncrement;
  }
}

function drawSynth(step) { // instead of using the draw function at 60 frames a second we will call this function when something changes

  if(save.status){
    background(156, 156, 184);
    inp.show();
    inp.value(saveText);
    background(150); // background is grey (remember 5 is maximum because of the setup of colorMode)
    textSize(cnvDimension/20);
    textAlign(CENTER, CENTER);
    text("Copy and paste this link to share your music", width/10, height/10, (width/10) * 8, (height/10) * 3);
    fill(99, 245, 66);
    ellipse(width/2, height/5*4, radius*2);
    fill(0);
    text("ok", width/2, height/5*4);
  }else{

    imageMode(CORNER);

    image(carpet, 0, 0, width, height); // place the carpet image
    imageMode(CENTER);
    image(looper, looper_x, looper_y + (seqHeight/1.5), looperwidth, looperheight); // place the looper image
    //image(grass, 0, grassPosition, width, (height/5)*2); // place the grass image

    for (let i = 0; i < numberOfloopers; i++) { // draw the looper buttons on looper
      fill(looperButtonPositions[i].colour);
      ellipse(looperButtonPositions[i].x, looperButtonPositions[i].y, radius * 2);
    }

    for (let i = 0; i < numberOfloopers; i++) { // draw the looper buttons on looper
      if(looperButtonPositions[i].colour === buttonOffColour){
        image(performerOff[i], looperButtonPositions[i].x, looperButtonPositions[i].y, radius*3, radius*3);
      }else{
        image(performerOn[i], looperButtonPositions[i].x, looperButtonPositions[i].y, radius*3, radius*3);

      }
    }

    imageMode(CENTER);

    for(let i = 0; i < seqRows; i++){
      for(let j = 0; j < seqSteps; j++){
        if((j === step) && (seqStuff[i][j].state === 0)){ // if this is the current step and the step is "off"
          image(seqStep1, seqStuff[i][j].x, seqStuff[i][j].y, seqWidth, seqHeight); // then yellow seq for this step
        }else if((j === step) && (seqStuff[i][j].state === 1)){ // if this is the current step and the step is "on"
          image(seqStep2, seqStuff[i][j].x, seqStuff[i][j].y, seqWidth, seqHeight); // then purple seq for this step
        }
        else{
          image(seqStuff[i][j].image, seqStuff[i][j].x, seqStuff[i][j].y, seqWidth, seqHeight); // otherwise seq colour reflects step state
        }
      }
    }

    textFont('Helvetica');

    textSize(speedTextSize);
    fill(slower.colour);
    text(slower.text, slower.x, slower.y);
    fill(faster.colour);
    text(faster.text, faster.x, faster.y);
    textSize(saveTextSize);
    fill(save.colour);
    text(save.text, save.x, save.y);

    if(bpmShow){
      textSize(bpmTextSize);
      fill('rgba(255, 255, 255, 0.7)');
      text(`BPM ${Math.round(Tone.Transport.bpm.value)}`, width/2, (height/3)*2);
    }
  }
}

function copySave() {
  /* Get the text field */
  var copyText = document.getElementById("myInput");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  document.execCommand("copy");

  /* Alert the copied text */
  //alert("Copied the text: " + copyText.value);
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
      "loopEnd": "54.23",
      "loopStart": 0,
      "playbackRate": 1,
      "reverse": false
    }
  );

  for(let i = 0; i < seqRows; i++){
    seqPlayers[i].buffer = seqBuffers[i].get();
    seqPlayers[i].set(
      {
        "mute": false,
        "volume": -20,
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
  Tone.Transport.scheduleRepeat(play_ = () => {player1.start();}, '2m');
  Tone.Transport.scheduleRepeat(play_ = () => {player2.start();}, '2m');
  Tone.Transport.scheduleRepeat(play_ = () => {player3.start();}, '2m');
  Tone.Transport.scheduleRepeat(play_ = () => {player4.start();}, '2m');
  Tone.Transport.scheduleRepeat(play_ = () => {player5.start();}, '14m');
  player6.start();// this one in free time
  retrieveSavedWork();
}

function handleClick(e){
  if(soundOn) {
    if(save.status){
      let d = dist(mouseX, mouseY, width/2, height/5*4);
      if (d < radius) {
        save.status = false;
        copySave();
        inp.hide();
      }
    }else{

      for (let i = 0; i < numberOfloopers; i++) {
        let d = dist(mouseX, mouseY, looperButtonPositions[i].x, looperButtonPositions[i].y);
        if (d < radius) {
          buttonPressed(i);
        }
      }

      for(let i = 0; i < seqRows; i++){
        for(let j = 0; j < seqSteps; j++){
          let d = dist(mouseX, mouseY, seqStuff[i][j].x, seqStuff[i][j].y);
          if (d < seqHeight/2) {
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
        save.status = true;
        save.colour = 'rgba(255, 0, 255, 0.9)'
        saveSeq();
        drawSynth();
        setTimeout(() => {
          save.colour = 'rgba(255, 255, 255, 0.9)';
          drawSynth();
        }, 1000);
      }
    }
  }else{
    startAudio();
  }
}

function seqPressed(row, step) {

  if(seqStuff[row][step].state === 0) { // if the synth is not playing that note at the moment
    seqStuff[row][step].image = seqOn;
    drawSynth();
    seqStuff[row][step].state = 1; // change the array to reflect that the note is playing
  }
  else { // if the synth is playing that note at the moment
    seqStuff[row][step].image = seqOff;
    drawSynth();
    seqStuff[row][step].state = 0; // change the array to reflect that the note is playing
  }
  console.log(`row${row} step ${step} = ${seqStuff[row][step].state}`);


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
    if(looperButtonPositions[i].state === 0) { // if the synth is not playing that note at the moment
      playerArray[i].volume.rampTo(theVolume, 2);
      looperButtonPositions[i].colour = buttonOnColour; //change the colour of the button to on colour
      drawSynth();
      looperButtonPositions[i].state = 1; // change the array to reflect that the note is playing
    }
    else { // if the synth is playing that note at the moment
      playerArray[i].volume.rampTo(-100, 2);
      looperButtonPositions[i].colour = buttonOffColour; //change the colour of the button to off colour
      drawSynth();
      looperButtonPositions[i].state = 0; // change the array to reflect that the note is playing
    }
    console.log(`looperButtonPositions${i} = ${looperButtonPositions[i].state}`);
}

let index = 0;
    notes = ['a3', 'g3', 'e3', 'd3', 'c3'];

    const sampler = new Tone.Sampler({
      urls: {
        A3: "step1.flac",
        G3: "step2.flac",
        E3: "step3.flac",
        D3: "loop1.flac"
      },
      baseUrl: "/sounds/",
    // 	onload: () => {
    //     // hideLoadScreen();
    //   }
      volume: theVolume
    }).toDestination();

function repeat(time) {
  let _step = index % seqSteps;
  drawSynth(_step)
  for(let i = 0; i < seqRows; i++) {
    //console.log(`row ${i} step ${_step} `);
    //note = notes[i];
    //console.log(`row ${i} step ${_step} ${seqStuff[i][_step].state}`);
    if(seqStuff[i][_step].state === 1) {
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


let seqSaveSteps = new Array;
for(let i = 0; i < seqRows; i++){
  seqSaveSteps[i] = new Array;
}

for(let i = 0; i < seqRows; i++){ // setup and initialise the array
  for(let j = 0; j < seqSteps; j++){
    seqSaveSteps[i].push(0);
  }
}

let looperStepsToSave = new Array;

for(let i = 0; i < looperButtonPositions.length; i++){
  looperStepsToSave[i].push(0);
}


function saveSeq() {
  for(let i = 0; i < seqRows; i++){
    for(let j = 0; j < seqSteps; j++){
      seqSaveSteps[i][j] = seqStuff[i][j].state;
    }
  }

  for(let i = 0; i < looperButtonPositions.length; i++){
    looperStepsToSave[i] = looperButtonPositions[i].state;
  }

  let seqRowsArray = new Array;
  for(let i = 0; i < seqRows; i++){
    seqRowsArray[i] = seqSaveSteps[i].join('');
  }
  let _looperRow = looperStepsToSave.join('');
  let seqHex = new Array;
  for(let i = 0; i < seqRows; i++){
    seqHex[i] = parseInt(seqRowsArray[i], 2).toString(16);
  }
  let looperHex = parseInt(_looperRow, 2).toString(16);
  let bpmToSave = parseInt(Tone.Transport.bpm.value, 10).toString(16);
  let hexToSave = '';
  for(let i = 0; i < seqRows; i++){
    hexToSave = `${hexToSave}${seqHex[i]}_`;
  }
  hexToSave = `${hexToSave}${looperHex}_${bpmToSave}`;
  console.log(hexToSave);
  url_ob.hash = `#${hexToSave}`;
  var new_url = url_ob.href;
  document.location.href = new_url;
  saveText = new_url;
}


function retrieveSavedWork() {

var savedWork = url_ob.hash; //retrieve saved work from url
var savedWorkNoHash = savedWork.replace('#', ''); // remove the hash from it leaving only the number
var savedWorkAsArray = savedWorkNoHash.split('_');
console.log(savedWorkAsArray);
var  savedseqRowBinary = new Array;
for(let i = 0; i < seqRows; i++){
  savedseqRowBinary[i] = (parseInt(savedWorkAsArray[i], 16).toString(2)); // convert seq row to binary
}
var savedseqRow = new Array;
for(let i = 0; i < seqRows; i++){
  savedseqRow[i] = savedseqRowBinary[i].split(''); // convert to array
  console.log(`seq row${i} ${savedseqRow[i]}`);
}
var savedlooperButtons = (parseInt(savedWorkAsArray[seqRows], 16).toString(2));// convert saved looper buttons to binary
console.log(`looper row  ${savedlooperButtons}`);
let savedlooperButtonsAsArray = savedlooperButtons.split(''); // convert to array
console.log(`savedlooperButtonsAsArray ${savedlooperButtonsAsArray}`);
var savedTempo = (parseInt(savedWorkAsArray[seqRows+1], 16).toString(10));// convert tempo to decimal
console.log(`saved tempo  ${savedTempo}`);

for(let i = numberOfloopers - 1; i >= 0 ; i--){
  let a = [];
  if(savedlooperButtonsAsArray.length > 0){
    a[i] = savedlooperButtonsAsArray.pop();
    }else{
    a[i] = 0;
    }
  if(a[i] === "1"){ // you need to put "" around the number because you are comparing a number with a string
    buttonPressed(i);
  }
}

for(let i = 0; i < seqRows; i++){
  console.log(`am i here? seqRow ${i}`);
  for(let j = seqSteps - 1; j >= 0 ; j--){
    let a = [];
    console.log(`savedseqRow ${i} = ${savedseqRow[i]}`);
    if(savedseqRow[i].length > 0){
      a[j] = savedseqRow[i].pop();
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
