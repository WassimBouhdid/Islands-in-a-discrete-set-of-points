var userColor = "blue";
var S = [];
var bluePoints = [];
var B = [];
var R = [];
var W = [];
var prev = [];
var underPoints = [];
var TBlue = [];
var TRed = [];

var currentAnchor;
var currentAnchorBlueIndex = null;
var currentPivot = 0;
var inEdges = [];
var outEdges = [];
var currentOutEdge = 0;

var currentOverlayFunction = null;
var anchorBestWeight = null;
var currentBestIsland = null;
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

function drawGraph(showWeights = false) {
  stroke("green");
  for (let i = 0; i < W.length; ++i) {
    for (let j = 0; j < W.length; ++j) {
      const weight = W[i][j];
      if (weight === null) continue;
      if (showWeights) {
        if (weight === 0) continue;
        const intensity = 200 * weight / anchorBestWeight;
        const edgeColor = color(50, intensity, 50);
        stroke(edgeColor)
        line(S[i].x, S[i].y, S[j].x, S[j].y);
      } else {
        const a = S[i];
        const b = S[j];
        gradientLine(a, b, color(200, 50, 50, 0), color(50, 200, 50, 255));
      }
    }
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
  currentAnchorBlueIndex ??= 0;
  // TODO : one point optisland - best island = anchor
  while (true) { // find next anchor that has under-points
    ++currentAnchorBlueIndex;
    currentAnchor = bluePoints[currentAnchorBlueIndex];
    initAnchor(currentAnchorBlueIndex);
    if (currentAnchorBlueIndex === bluePoints.length) {
      endRunAlgo();
      return;
    }
    if (underPoints.length > 0) break;
  }
  currentOverlayFunction = drawGraph;
  actionButtons.set(["resources/nextAnchor.png"], [startRemoveBad], ["Next step : remove non-viable edges"])
}

function startRemoveBad() { // new anchor (show graph()) -> remove bad
  // no selector;
  for (let i = 0; i < underPoints.length - 1; ++i) {
    for (let j = i + 1; j < underPoints.length; ++j) {
      if (numPointsInTriangle(TRed, S, currentAnchor, underPoints[i], underPoints[j], "red") > 0)
        W[underPoints[i]][underPoints[j]] = null;
    }
  }
  actionButtons.set(["resources/nextAnchor.png"], [startRunAlgo], ["Next step : compute first weights"])
}

function nextIteration() {
  // TODO : skip arguments for buttons
  ++currentOutEdge;
  if (currentOutEdge === outEdges.length || currentPivot === 0) { // next pivot
    ++currentPivot;
    if (currentPivot === underPoints.length) {
      startNewAnchor();
      return;
    }
    outEdges = radialOrderingHalfCut(underPoints[currentPivot], R[currentPivot], S[underPoints[currentPivot]].minus(S[currentAnchor]));
    outEdges = outEdges.filter(((i) => S[i].color === "blue" && S[i].y > S[currentAnchor].y));
    inEdges = radialOrderingHalfCut(underPoints[currentPivot], R[currentPivot], S[currentAnchor].minus(S[underPoints[currentPivot]]));
    inEdges = inEdges.filter((i) => (S[i].color === "blue" && S[i].y > S[currentAnchor].y));
    console.log("In out ", inEdges, outEdges)
    currentOutEdge = 0;
  } else {
    // for now : just re-browse the whole thing each time
    let currentInEdge = 0;
    let maxInEdge = 0;
    let maxInWeight = 0;
    console.log("Inedges", inEdges)
    while (currentInEdge < inEdges.length
      && pCompatible(S, inEdges[currentInEdge], underPoints[currentPivot], outEdges[currentOutEdge])) {
      const inWeight = W[inEdges[currentInEdge]][underPoints[currentPivot]];
      console.log("InWeight", inWeight)
      if (inWeight > maxInWeight) {
        maxInEdge = currentInEdge;
        maxInWeight = inWeight;
      }
      ++currentInEdge;
    }
    prev[underPoints[currentPivot]][outEdges[currentOutEdge]] = maxInEdge;
    W[underPoints[currentPivot]][outEdges[currentOutEdge]] = maxInWeight
      + numPointsInTriangle(TBlue, S, currentAnchor, inEdges[maxInEdge], underPoints[currentPivot], "blue")
      - 2;
    const newWeight = W[underPoints[currentPivot]][outEdges[currentOutEdge]];
    console.log("New weight", newWeight);
    if (newWeight > anchorBestWeight) anchorBestWeight = newWeight; // for overlay
  }
}

function startRunAlgo() {
  anchorBestWeight = 0;
  for (let i = 1; i < underPoints.length; ++i) {
    W[underPoints[0]][underPoints[i]] = numPointsInTriangle(TBlue, S, currentAnchor, underPoints[0], underPoints[i], "blue") + 3;
    console.log("Set weight", W[underPoints[0]][underPoints[i]]);
  }
  currentPivot = 0; // not a valid pivot, but triggers first pivot init
  actionButtons.clear();
  actionButtons.set(["resources/nextOrigin.png"], [nextIteration], ["Next outgoing edge"]);
  modeButtons.set(["weights"], [
    () => { currentOverlayFunction = () => drawGraph(true) }
  ], ["show edge weights"]);
}

function resetRun() { // show opti -> point entry - also init.
  currentAnchorBlueIndex = null;
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
    //text("" + p, S[p].x, S[p].y)
    stroke(S[p].color);
    fill(S[p].color);
    ellipse(S[p].x, S[p].y, 4, 4);
    //console.log("State", p, currentAnchor)
    if (Number(p) === currentAnchorBlueIndex) {
      text("A", S[p].x, S[p].y);
    }
  }
  if (currentOverlayFunction) currentOverlayFunction();
}
