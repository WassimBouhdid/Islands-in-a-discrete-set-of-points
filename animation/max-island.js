var userColor = "blue";
var S = [];
var bluePoints = [];
var B = [];
var R = [];
var TBlue = [];
var TRed = [];

var currentOverlayFunction = null;
var currentBestIsland = null;
var modeButtons = new ModeButtons();
var actionButtons = new ActionButtons();
var mainAlgo = null;
var currentButtons = null;

var anchorImg = null;
var helpText = "Click to add points";
var infoText = "";

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
    R.push(leftSide.concat(rightSide));
  }
}

function radialOrderingHalfCut(referenceIndex, ordering, cutVector) {
  // TODO : move it to geom, with points argument
  ordering = ordering.filter((i) => isRightTurn(S[referenceIndex], S[referenceIndex].plus(cutVector), S[i]));
  return ordering.sort((a, b) => orientationDeterminant(S[referenceIndex], S[a], S[b])); // cheating for now
  /*let cutIndex = 0;
  while (true) {
    const previous = ordering[(cutIndex - 1 + ordering.length) % ordering.length];
    const next = ordering[(cutIndex + 1) % ordering.length];
    if (!isRightTurn(S[referenceIndex], S[cutIndex], S[next]) &&
      !isRightTurn(S[referenceIndex], S[cutIndex], S[previous])) break;
    console.log(cutIndex)
    ++cutIndex;
  }
  console.log("Cut index", cutIndex, ordering[cutIndex])
  const result = []
  for (let i = 0; i < ordering.length; ++i)
    result.push(ordering[(cutIndex + i - 2) % ordering.length]);*/
}

function generateTriangleInformation() {
  TBlue = generateColorTriangleInformation("blue");
  TRed = generateColorTriangleInformation("red");
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

function initAnchor() {
  W = []
  prev = []
  for (let i = 0; i < S.length; ++i) {
    W.push([]);
    prev.push([])
    for (q of S) {
      prev[i].push(null);
      W[i].push(null);
    }
  }
  underPoints = R[currentAnchor].filter((i) => S[i].color === "blue");
  underPoints = radialOrderingHalfCut(currentAnchor, underPoints, new Vec2(-1, 0))
  for (let i = 0; i < underPoints.length - 1; ++i) {
    for (let j = i + 1; j < underPoints.length; ++j) W[underPoints[i]][underPoints[j]] = 0;
  }
}

function drawArrow(src, dest) {
  stroke("green");
  line(src.x, src.y, dest.x, dest.y);
  const deltaAngle = PI / 6, pointLength = 12;
  const angle = atan2(src.y - dest.y, src.x - dest.x);
  const upperAngle = angle + deltaAngle;
  const lowerAngle = angle - deltaAngle;
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

function startShowTriangles() { // point entry -> show triangles
  helpText = "Click three points to show point count inside triangle";
  enablePointEntry = false;
  // test with 0 or one red/blue pt.
  actionButtons.clear();
  modeButtons.clear();
  generateRadialOrderings();
  generateTriangleInformation();
  const triangleOverlay = new TriangleOverlay(S, TBlue, TRed);
  currentOverlayFunction = () => triangleOverlay.draw();
  mousePressed = () => triangleOverlay.processClick(mouseX, mouseY);
  actionButtons.set(["resources/nextAnchor.png"], [startProcessPivots], ["Next step : choose an anchor"])
  // Generate points, show stripes + (5 + 3 - 7 = ...) (color numbers and stripe correspondingly)
}

function startProcessPivots() {
  helpText = "Choose an overlay and run the algorithm";
  mainAlgo = new MainAlgo(S, R, TBlue, TRed, anchorImg);
  actionButtons.clear();
  const stepInEdgeHandler = () => {
    if (mainAlgo.stepInEdge() === ANCHORS_OVER) {
      startShowBest();
    }
  }
  const stepPivotHandler = () => {
    let result = NOT_OVER;
    while (result < EDGES_OVER) {
      result = mainAlgo.stepInEdge();
      if (result === ANCHORS_OVER) {
        startShowBest();
        return;
      }
    }
  }
  const stepAnchorHandler = () => {
    let result = NOT_OVER;
    while (result < PIVOTS_OVER) {
      result = mainAlgo.stepInEdge();
      if (result === ANCHORS_OVER) {
        startShowBest();
        return;
      }
    }
  }
  actionButtons.set(["resources/nextOrigin.png", "resources/nextPivot.png", "resources/nextAnchor.png"],
    [stepInEdgeHandler, stepPivotHandler, stepAnchorHandler],
    ["next edge pair", "next pivot", "next anchor"]);
  modeButtons.set(["viable edges", "weights", "progress", "best island"], [
    () => { currentOverlayFunction = () => mainAlgo.showViableEdges() },
    () => { currentOverlayFunction = () => mainAlgo.showWeightOverlay() },
    () => { currentOverlayFunction = () => mainAlgo.showProgressOverlay() },
    () => { currentOverlayFunction = () => mainAlgo.showBestOverlay() }
  ], ["show viable edges & orientation", "show edge weights", "show current in-out edges", "show best islands found so far"]);
}

function startShowBest() {
  actionButtons.set(["resources/nextAnchor.png"], [resetRun], ["reset"]);
  modeButtons.clear();
  currentDisplayFunction = () => mainAlgo.showBestOverlay(true);
}

function resetRun() { // show opti -> point entry - also init.
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

function preload() {
  //anchorImg = loadImage("resources/anchor.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fill("black");
  textSize(20);
  resetRun();
}

function draw() {
  // Put drawings here
  fill("grey");
  background(255);
  fill("black");
  stroke("black");
  text(helpText, 30, 30 + textSize());
  text(infoText, 30, windowHeight - 50);
  for (let p = 0; p < S.length; ++p) {
    //text("" + p, S[p].x, S[p].y)
    stroke(S[p].color);
    fill(S[p].color);
    ellipse(S[p].x, S[p].y, 4, 4);
  }
  if (currentOverlayFunction) currentOverlayFunction();
}
