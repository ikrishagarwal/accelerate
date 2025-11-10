let r1 = 200,
  r2 = 200,
  m1 = 40,
  m2 = 40,
  a1 = 0,
  a2 = 0,
  a1_v = 0,
  a2_v = 0,
  g = 1.5;

let resistance = 0.9999;

let trail;
let px2, py2;

let osc1, osc2, reverb;
let scaleNotes = [220, 247, 294, 330, 370, 440, 494, 554];

let red, blue;

let isPlaying = false;
let playPauseButton;

function setup() {
  createCanvas(windowWidth / 2, windowHeight).parent("canvas");
  background(220);
  a1 = random() * TWO_PI - PI;
  a2 = random() * TWO_PI - PI;

  trail = createGraphics(width, height);
  trail.background(220);
  trail.translate(width / 2, height / 3);
  trail.scale(0.5);

  osc1 = new p5.Oscillator("sine");
  osc2 = new p5.Oscillator("triangle");
  osc1.amp(0);
  osc2.amp(0);

  reverb = new p5.Reverb();
  let canvasParent = select("#canvas");
  if (canvasParent) {
    canvasParent.style("position", "relative");
  }

  playPauseButton = createButton("Play");
  playPauseButton.parent(canvasParent || document.body);
  playPauseButton.style("position", "absolute");
  playPauseButton.style("bottom", "10px");
  playPauseButton.style("right", "10px");
  playPauseButton.style("padding", "8px 16px");
  playPauseButton.style("borderRadius", "6px");
  playPauseButton.style("background", "#222");
  playPauseButton.style("color", "#fff");
  playPauseButton.style("fontSize", "14px");
  playPauseButton.style("zIndex", "9999");
  playPauseButton.mousePressed(togglePlayPause);
}

function togglePlayPause() {
  if (typeof userStartAudio === "function") {
    userStartAudio()
      .then(() => {
        _toggleOscillators();
      })
      .catch((err) => {
        try {
          let ac = getAudioContext && getAudioContext();
          if (ac && ac.state === "suspended") {
            ac.resume().then(() => _toggleOscillators());
          } else {
            _toggleOscillators();
          }
        } catch (e) {
          _toggleOscillators();
        }
      });
  } else {
    try {
      let ac = getAudioContext && getAudioContext();
      if (ac && ac.state === "suspended") ac.resume();
    } catch (e) {}
    _toggleOscillators();
  }
}

function _toggleOscillators() {
  if (!isPlaying) {
    try {
      osc1.start();
      osc2.start();

      reverb.process(osc1, 2, 2);
      reverb.process(osc2, 2, 2);
    } catch (e) {}
    isPlaying = true;
    playPauseButton.html("Pause");
  } else {
    try {
      osc1.amp(0, 0.05);
      osc2.amp(0, 0.05);

      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
        } catch (e) {}
      }, 60);
    } catch (e) {}
    isPlaying = false;
    playPauseButton.html("Play");
  }
}

function draw() {
  background(220);
  imageMode(CORNER);
  image(trail, 0, 0, width, height);

  translate(width / 2, height / 3);
  scale(0.5);

  let x1 = r1 * sin(a1);
  let y1 = r1 * cos(a1);
  let x2 = x1 + r2 * sin(a2);
  let y2 = y1 + r2 * cos(a2);

  stroke(0);
  strokeWeight(3);
  line(0, 0, x1, y1);
  line(x1, y1, x2, y2);

  noStroke();
  createBob(x1, y1, m1, "blue");
  createBob(x2, y2, m2, "red");

  let num1 =
    -g * (2 * m1 + m2) * sin(a1) -
    m2 * g * sin(a1 - 2 * a2) -
    2 *
      sin(a1 - a2) *
      m2 *
      (a2_v * a2_v * r2 + a1_v * a1_v * r1 * cos(a1 - a2));
  let den1 = r1 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2));
  let a1_a = num1 / den1;
  let num2 =
    2 *
    sin(a1 - a2) *
    (a1_v * a1_v * r1 * (m1 + m2) + a2_v * a2_v * r2 * m2 * cos(a1 - a2));
  let den2 = r2 * (2 * m1 + m2 - m2 * cos(2 * a1 - 2 * a2));
  let a2_a = num2 / den2;

  a1_v += a1_a;
  a2_v += a2_a;
  a1 += a1_v;
  a2 += a2_v;

  a1_v *= resistance;
  a2_v *= resistance;

  if (frameCount > 1) {
    trail.stroke(0, 150, 0);
    trail.strokeWeight(2);
    trail.line(px2, py2, x2, y2);
  }

  px2 = x2;
  py2 = y2;

  if (isPlaying) {
    let freq1 = map(abs(a1_v), 0, 0.2, 200, 800, true);
    let freq2 = map(abs(a2_v), 0, 0.3, 150, 900, true);

    freq1 = quantizeToScale(freq1);
    freq2 = quantizeToScale(freq2);

    let amp1 = constrain(map(abs(a1_v), 0, 0.2, 0, 0.3), 0, 0.3);
    let amp2 = constrain(map(abs(a2_v), 0, 0.3, 0, 0.3), 0, 0.3);

    let pan1 = map(sin(a1), -1, 1, -0.7, 0.7);
    let pan2 = map(sin(a2), -1, 1, -0.7, 0.7);

    try {
      osc1.freq(freq1, 0.1);
      osc1.amp(amp1, 0.08);
      osc1.pan(pan1);

      osc2.freq(freq2, 0.1);
      osc2.amp(amp2, 0.08);
      osc2.pan(pan2);
    } catch (e) {}
  } else {
    try {
      osc1.amp(0, 0.05);
      osc2.amp(0, 0.05);
    } catch (e) {}
  }

  frameRate(60);
}

function createBob(x, y, m, fillColor) {
  fill(fillColor);
  ellipse(x, y, m);
}

function quantizeToScale(freq) {
  return scaleNotes.reduce((prev, curr) =>
    Math.abs(curr - freq) < Math.abs(prev - freq) ? curr : prev
  );
}

function updateParameters() {
  r1 = constraint(
    parseFloat(document.getElementById("bob1-length").value),
    50,
    500
  );
  r2 = constraint(
    parseFloat(document.getElementById("bob2-length").value),
    50,
    500
  );
  m1 = constraint(
    parseFloat(document.getElementById("bob1-mass").value),
    20,
    200
  );
  m2 = constraint(
    parseFloat(document.getElementById("bob2-mass").value),
    20,
    200
  );
  g = constraint(parseFloat(document.getElementById("gravity").value), 1, 10);

  resistance =
    0.99999 -
    constraint(
      parseFloat(document.getElementById("air-resistance").value),
      0.00001,
      0.001
    );

  // Reset the simulation
  a1 = random() * TWO_PI - PI;
  a2 = random() * TWO_PI - PI;
  a1_v = 0;
  a2_v = 0;

  trail.background(220);
}

function constraint(n, low, high) {
  return Math.max(Math.min(n, high), low);
}
