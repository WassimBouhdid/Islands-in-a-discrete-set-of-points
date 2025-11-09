const BLUE = 0;
const RED = 1;

const Step = {
  POINT_ENTRY: 0,
  SHOW_TRIANGLES: 1,
  NEW_ANCHOR: 2,
  REMOVE_BAD: 3,
  ALGO_RUN: 4,
  SHOW_OPTI: 5 
}

class Vec2 {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
  }

  plus(other) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  minus(other) {
    return new Vec2(this.x - other.x, this.y - other.y);
  }
}

var userColor = BLUE;
var S = []
var sortedNeighbors = {
  blue: [],
  red: [],
};
var graph = [];
var B = [];
var R = [];
var currentOverlayFunction = null;
var currentBest = null;
var currentSelect = null;
var currentButtons = null;

var infoText = "Click to add points";

function orientationDeterminant(p1, p2, p3) {
  let vec1 = p2.minus(p1);
  let vec2 = p3.minus(p2);
  return vec1.x * vec2.y - vec1.y * vec2.x;
}

function isRightTurn(p1, p2, p3) {
  return orientationDeterminant(p1, p2, p3) > 0;
}

function resetPoints(e) {
  e.stopPropagation();
  userPoints["blue"] = [];
  userPoints["red"] = [];
}

function mousePressed() {
  userPoints[userColor].push(new Vec2(mouseX, mouseY));
}

// This Redraws the Canvas when resized
windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
};

function generateRadialOrderings() {
  R = [];
  for (let i = 0; i < S.length; ++i) {
    R.push([...Array(ps.length).keys()]);
    R[i].splice(i, 1);
    R[i].sort((a, b) => {
      return orientationDeterminant(S[i], S[a], S[b]);
    });
  }
}

function numPointsInTriangle(p1, p2, p3) {
  p1, p2, p3 = [p1, p2, p3].sort((a, b) => S[b].x - S[a].x);
  return stripes[p1][p2] + stripes[p2][p3] - stripes[p1][p3];
}

function generateTriangleInformation() {
  const stripes = []
  for (let i = 0; i < S.length; ++i) {
    stripes.push([])
    for (let j = 0; j < S.length; ++j) stripes[i].push(0);
  }
  const sortedByX = [...Array(S.length).keys()];
  sortedByX.sort((i, j) => S[j].x - S[i].x);
  for (let i = 1; i < sortedByX.length; ++i) {
    const referenceIndex = sortedByX[x];
    const reference = S[referenceIndex];
    const sortedRadially = R[sortedByX[x]];
    sortedRadially = sorted.filter((j) => S[j].x < reference.x);
    console.log("Equal", i, sortedRadially.length);
    for (let j = i - 1; j >= 1; --j) {
      const previous = sortedRadially[j - 1];
      const current = sortedRadially[j];
      if (S[current].x < S[previous].x)
        stripes[current][referenceIndex] = stripes[previous][referenceIndex] + stripes[current][previous] + 1;
      else
        stripes[current][referenceIndex] = stripes[previous][referenceIndex] - stripes[current][previous];
    }
  }
}

function buildGraph(anchor) {
  graph = [];
  underPoints = sortedNeighbors[anchor].filter(
    (i) => userPoints.blue[i].y > userPoints.blue[anchor].y
  );
  for (let i = 0; i < underPoints.length - 1; ++i) {
    for (let j = i + 1; j < underPoints.length; ++j) graph.push([underPoints[i], underPoints[j]]);
  }
}

function drawArrow(src, dest) {
  stroke("green");
  line(src.x, src.y, dest.x, dest.y);
  const deltaAngle = PI / 6, pointLength = 12;
  const angle = atan2(src.y - dest.y, src.x - dest.x);
  const upperAngle = angle + deltaAngle;
  const lowerAngle = angle - deltaAngle;
  console.log(upperAngle, lowerAngle)
  line(dest.x, dest.y, dest.x + cos(upperAngle) * pointLength, dest.y + sin(upperAngle) * pointLength);
  line(dest.x, dest.y, dest.x + cos(lowerAngle) * pointLength, dest.y + sin(lowerAngle) * pointLength);
}

function gradientLine(point1, point2, color1, color2) {
  var grad = this.drawingContext.createLinearGradient(point1.x, point1.y, point2.x, point2.y);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  this.drawingContext.strokeStyle = grad;
  line(point1.x, point1.y, point2.x, point2.y);
}

function drawGraph() {
  stroke("green");
  for (edge of graph) {
    const a = userPoints["blue"][edge[0]];
    const b = userPoints["blue"][edge[1]];
    //drawArrow(a, b);
    gradientLine(a, b, color(50, 200, 50, 0), color(50, 200, 50, 255));
  }
}

function displayGraph() {

}

function makeSelect(...options) {
  if (currentSelect) currentSelect.remove();
  currentSelect = createSelect();
  for (let i = 0; i < options.length; ++i)
    currentSelect.option(options[i]);
}

function makeButtons(handlers, imgPaths, infoTexts) {
  for (button of currentButtons) button.remove();
  currentButtons = []
  for (let i = 0; i < handlers.length; ++i) {
    const newButton = createImg(imgPaths[i]);
    newButton.class("dynaButton");
    newButton.mousePressed(handlers[i]);
    newButton.mouseOver(() => infoText = infoTexts[i])
    newButton.mouseOut(() => infoText = "");
    currentButtons.push(newButton);
  }
}

function endPointEntry { // point entry -> show triangles
  // test with 0 or one red/blue pt.
  currentSelect.remove();
  // Generate points, show stripes + (5 + 3 - 7 = ...) (color numbers and stripe correspondingly)
  sortAllPoints();
}

function endShowTriangle { // show triangles -> new anchor
  createButton();
  currentAnchor = 1;
  buildGraph(currentAnchor)
  currentStepFunction = endStep[Step.NEW_ANCHOR];
}

function endNewAnchor { // new anchor (show graph()) -> remove bad
  // no selector;
  currentStepFunction = remove_BAD;
}

function endRemoveBad { // remove bad -> run algo
  currentSelect.remove();
  makeSelect("weights", "prev", "current best");
  currentSelect.option();
}

function endOrigin() {

  // if ..., call end
}

function endDest() {

  // if ... call endAnchor
}

function endRunAlgo() {

  // if... call endRunAlgo
}

function endRunAlgo { // run algo -> show opti
}

function endShowOpti { // show opti -> point entry - also init.
  
  makeSelect("blue", "red");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fill("black");
  textSize(40);
  endShowOpti();
}

function draw() {
  // Put drawings here
  fill("grey");
  background(200);
  fill("black");
  stroke("black");
  text(infoText, 30, 50);
  if (userPoints["blue"].length > 4) {
  }
  for (pointColor of Object.entries(userPoints)) {
    fill(pointColor[0]);
    stroke(pointColor[0]);
    for (userPoint of pointColor[1]) ellipse(userPoint.x, userPoint.y, 4, 4);
  }
}
