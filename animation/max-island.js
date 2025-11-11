var userColor = "blue";
var S = [];
var bluePoints = [];
var B = [];
var R = [];
var graph = [];
var underPoints = [];
var TBlue = [];
var TRed = [];
var currentAnchor = null;
var currentOverlayFunction = null;
var currentBest = null;
var modeButtons = new ModeButtons();
var actionButtons = new ActionButtons();
var currentButtons = null;

var infoText = "Click to add points";

function resetPoints(e) {
  e.stopPropagation();
  userPoints["blue"] = [];
  userPoints["red"] = [];
}

// This Redraws the Canvas when resized
windowResized = function () {
  resizeCanvas(windowWidth, windowHeight);
};

function generateRadialOrderings() {
  R = [];
  for (let i = 0; i < S.length; ++i) {
    const rightSide = [];
    const leftSide = [...Array(S.length).keys()];
    leftSide.splice(i, 1);
    for (let j = leftSide.length - 1; j >= 0; --j) {
      if (S[leftSide[j]].x < S[i].x) {
        rightSide.push(leftSide[j]);
        leftSide.splice(j, 1);
      }
    }
    sortFunction = (a, b) => {
      return orientationDeterminant(S[i], S[a], S[b]);
    }
    leftSide.sort(sortFunction);
    rightSide.sort(sortFunction);
    R.push(leftSide + rightSide);
  }
}

function radialOrderingHalfCut(referenceIndex, ordering, cutVector) {
  const cutIndex = 0;
  while(isRightTurn(S[referenceIndex].plus(cutVector), S[ordering[cutIndex]])) ++cutIndex;
  return ordering.map((e, i) => { ordering[(i + cutIndex) % ordering.length] });
}

function generateTriangleInformation() {
  TBlue = generateColorTriangleInformation("blue");
  TRed = generateColorTriangleInformation("red");
}

function findRadialStart(refPoint, rotatedVector, direction) {
  // TODO...
  for (let start = 0; start < rotatedVector.length; ++start) {
    const startPoint = rotatedVector[start];
    const previous = rotatedVector[(start - 1 + rotatedVector.length) % rotatedVector.length];
    const toLeft = orientationDeterminant(refPoint, S[startPoint], S[previous]);
    if ((toLeft * direction) > 0) return start;
  }
}

function generateColorTriangleInformation(color) {
  let T = []
  for (let i = 0; i < S.length; ++i) {
    T.push([])
    for (let j = 0; j < S.length; ++j) T[i].push(0);
  }
  const sortedByX = [...Array(S.length).keys()];
  sortedByX.sort((i, j) => S[i].x - S[j].x);
  for (let i = 2; i < sortedByX.length; ++i) {
    console.log("Point ", sortedByX[i]);
    const referenceIndex = sortedByX[i];
    const referencePoint = S[referenceIndex];
    sortedRadially = sortedByX.slice(0, i);
    // TODO : retrieve order from R
    sortedRadially.sort((a, b) => orientationDeterminant(referencePoint, S[b], S[a]));
    for (let j = 1; j < sortedRadially.length; ++j) {
      const previous = sortedRadially[j - 1];
      const current = sortedRadially[j];
      if (S[current].x < S[previous].x) {
        const toAdd = (S[previous].color === color) ? 1 : 0
        T[current][referenceIndex] = T[previous][referenceIndex] + T[current][previous] + toAdd;
      } else {
        T[current][referenceIndex] = T[previous][referenceIndex] - T[previous][current];
      }
    }
  }
  return T;
}

function initAnchor(anchor) {
  console.log("anchor blue index", anchor)
  const anchorSIndex = bluePoints[anchor]; 
  console.log("Anchor point", S[anchorSIndex])
  graph = [];
  underPoints = bluePoints.filter(
    (i) => { S[i].y > S[anchorSIndex].y && S[i].color === "blue" }
  );
  console.log("under points", underPoints)
  underPoints.sort((a, b) => orientationDeterminant(referencePoint, S[a], S[b]));
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
  //console.log(graph)
  stroke("green");
  for (edge of graph) {
    const a = userPoints["blue"][edge[0]];
    const b = userPoints["blue"][edge[1]];
    gradientLine(a, b, color(50, 200, 50, 0), color(50, 200, 50, 255));
  }
}

function startShowTriangles() { // point entry -> show triangles
  enablePointEntry = false;
  // test with 0 or one red/blue pt.
  actionButtons.clear();
  modeButtons.clear();
  generateRadialOrderings();
  generateTriangleInformation();
  const triangleOverlay = new TriangleOverlay(S, TBlue, TRed);
  currentOverlayFunction = () => triangleOverlay.draw();
  mousePressed = () => triangleOverlay.processClick(mouseX, mouseY);
  actionButtons.set(["resources/nextAnchor.png"], [startNewAnchor], ["Next step : start algorithm"])
  // Generate points, show stripes + (5 + 3 - 7 = ...) (color numbers and stripe correspondingly)
}

function startNewAnchor() { // show triangles -> new anchor
  mousePressed = () => {}
  actionButtons.clear();
  currentAnchor ??= 0;
  // TODO : one point optisland - best island = anchor
  while (true) { // find next anchor that has under-points
    ++currentAnchor;
    console.log("Test anchor", currentAnchor);
    initAnchor(currentAnchor);
    console.log("Graph", graph)
    if (currentAnchor === bluePoints.length) {
      endRunAlgo();
      return;
    }
    if (underPoints.length > 0 || currentAnchor === 30) break;
  }
  console.log("Anchor", currentAnchor)
  currentOverlayFunction = drawGraph;
  actionButtons.set(["resources/nextAnchor.png"], [startRemoveBad], ["Next step : remove non-viable edges"])
}

function startRemoveBad() { // new anchor (show graph()) -> remove bad
  // no selector;
  currentStepFunction = remove_BAD;
  actionButtons.set(["resources/nextAnchor.png"], [startRemoveBad], ["Next step : remove non-viable edges"])
}

function startRunAlgo() { // remove bad -> run algo
  currentRadio.remove();
}

function endOrigin() {

  // if ..., call end
}

function endDest() {

  // if ... call endAnchor
}

function endRunAlgo() {

  // if... call endNewAnchor, or endShowTriangle
}

function resetRun() { // show opti -> point entry - also init.
  currentAnchor = null;
  currentOverlayFunction = null;
  currentBest = null;
  currentOverlayFunction = null;
  S = [];
  bluePoints = [];
  redPoints = [];
  const colors = ["blue", "red"];
  const handlers = [() => userColor = "blue", () => userColor = "red"];
  modeButtons.set(colors, handlers, ["Add blue points", "Add red points"]);
  actionButtons.set(["resources/nextAnchor.png"], [startShowTriangles], ["Next step : count points in triangles"])
  mousePressed = () => {
    const newPoint = new Vec2(mouseX, mouseY, userColor);
    for (p of S) // no vertical - horizontal alignments
      if (p.x === newPoint.x || p.y === newPoint.y) return;
    S.push(newPoint)
    if (userColor === "blue") bluePoints.push(S.length - 1);
    else redPoints.push(S.length - 1);
  };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fill("black");
  textSize(40);
  resetRun();
}

function draw() {
  // Put drawings here
  fill("grey");
  background(200);
  fill("black");
  stroke("black");
  text(infoText, 30, windowHeight - 50);
  for (p in S) {
    text("" + p, S[p].x, S[p].y)
    stroke(S[p].color);
    fill(S[p].color);
    ellipse(S[p].x, S[p].y, 4, 4);
  }
  if (currentOverlayFunction) currentOverlayFunction();
}
