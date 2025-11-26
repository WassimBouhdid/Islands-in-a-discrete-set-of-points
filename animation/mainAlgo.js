const NOT_OVER = 0;
const EDGES_OVER = 1;
const PIVOTS_OVER = 2;
const ANCHORS_OVER = 3;

class MainAlgo {

    constructor(S, R, TBlue, TRed, anchorImg) {
        this.anchorImg = anchorImg;
        this.S = S;
        this.R = R;
        this.TBlue = TBlue;
        this.TRed = TRed;
        this.resetRun();
    }

    resetRun() {
        this.bluePoints = [...Array(this.S.length).keys()].filter((p) => S[p].color === "blue");
        this.currentAnchorBP = -1;
        this.anchorBestEdge = null;
        this.runBestWeight = 0;
        this.runBestIsland = [];
        this.stepAnchor();
    }

    testMinIsland() {
        // TODO : island size 2
    }

    stepAnchor() {
        this.updateRunBestIsland();
        console.log("At stepAnchor entrance", this.currentAnchor, this.currentAnchorBP, this.bluePoints);
        if (this.currentAnchor === null || this.currentAnchorBP === this.bluePoints.length - 1) {
            this.currentAnchor = null;
            console.log("Finished at beginning")
            return ANCHORS_OVER;
        }
        ++this.currentAnchorBP;
        this.currentAnchor = this.bluePoints[this.currentAnchorBP];
        this.overlayIslandWeight = 0;
        this.W = [];
        this.prev = [];
        for (let i = 0; i < this.S.length; ++i) {
            this.W.push([]);
            this.prev.push([]);
            for (let j = 0; j < this.S.length; ++j) {
                this.W[i].push(null);
                this.prev[i].push(null);
            }
        }
        this.underPoints = this.R[this.currentAnchor].filter((i) => S[i].color === "blue");
        this.underPoints = radialOrderingHalfCut(this.currentAnchor, this.underPoints, new Vec2(-1, 0));

        this.anchorBestWeight = 0;
        this.anchorBestIsland = [];
        this.anchorBestEdge = null;
        this.currentInEdge = null;
        this.currentOutEdge = null;
        this.currentPivot = null;

        if (this.underPoints.length <= 2) {
            this.testMinIsland();
            return NOT_OVER
        }
        this.initViableWeights();
        if (this.underPoints.length <= 1) {
            this.anchorBestWeight = this.underPoints.length + 1;
            this.anchorBestEdge = []
            this.updateRunBestIsland();
            this.stepAnchor();
        }
        this.initFirstWeights();
        this.currentPivotUP = 0; // must be equal to 1 at first step
        this.stepPivot();
        return NOT_OVER;
    }

    buildAnchorBestIsland() {
        const currentBestIsland = [this.currentAnchor, this.anchorBestEdge[1]];
        let current = this.anchorBestEdge;
        while(current !== null) {
            currentBestIsland.push(current[0]);
            current = this.prev[current[0]][current[1]];
        }
        return currentBestIsland
    }

    updateRunBestIsland() {
        if (this.anchorBestEdge === null) return;
        if (this.runBestWeight < this.anchorBestWeight) {
            this.runBestWeight = this.anchorBestWeight;
            this.runBestIsland = this.buildAnchorBestIsland();
        }
    }

    initViableWeights() {
        for (let i = 0; i < this.underPoints.length - 1; ++i) {
            for (let j = i + 1; j < this.underPoints.length; ++j) {
            if (numPointsInTriangle(this.TRed, this.S, this.currentAnchor, this.underPoints[i], this.underPoints[j], "red") === 0)
                this.W[this.underPoints[i]][this.underPoints[j]] = 0;
            }
        }
    }

    initFirstWeights() {
        const source = this.underPoints[0]
        for (let i = 1; i < this.underPoints.length; ++i) {
            const dest = this.underPoints[i];
            if (this.W[source][dest] === null) continue; // non-viable edge
            this.W[source][dest] = numPointsInTriangle(this.TBlue, this.S, this.currentAnchor, this.underPoints[0], this.underPoints[i], "blue") + 3;
            if (this.anchorBestWeight < this.W[source][dest]) {
                this.anchorBestWeight = this.W[source][dest];
                this.anchorBestEdge = [source, dest]
            }
        }
    }

    stepPivot() {
        if (this.currentPivotUP < this.underPoints.length - 2) {
            ++this.currentPivotUP;
            this.currentPivot = this.underPoints[this.currentPivotUP];
        } else {
            this.currentPivot = null;
            return max(this.stepAnchor(), PIVOTS_OVER);
        }
        console.log(this.currentPivotUP, this.currentPivot, this.underPoints)
        this.outEdges = radialOrderingHalfCut(this.currentPivot, R[this.currentPivot], S[this.currentPivot].minus(this.S[this.currentAnchor]));
        this.outEdges = this.outEdges.filter(((i) => this.S[i].color === "blue" && this.S[i].y > this.S[this.currentAnchor].y
            && this.W[this.currentPivot][i] !== null));
        this.inEdges = radialOrderingHalfCut(this.currentPivot, R[this.currentPivot], S[this.currentAnchor].minus(this.S[this.currentPivot]));
        this.inEdges = this.inEdges.filter((i) => (this.S[i].color === "blue" && this.S[i].y > this.S[this.currentAnchor].y
            && this.W[i][this.currentPivot] !== null));
        this.pivotBestWeight = 0;
        this.pivotBestInEdge = null;
        this.currentOutEdgeOE = -1;
        this.currentOutEdge = null;
        this.currentInEdgeIE = -1;
        this.currentInEdge = null;
        this.lastProcessedIE = null;
        this.lookAheadOutEdge = null;
        return NOT_OVER;
    }

    stepOutEdge() {
        if (this.currentOutEdgeOE < this.outEdges.length - 1) {
            ++this.currentOutEdgeOE;
            this.currentOutEdge = this.outEdges[this.currentOutEdgeOE];
            this.lookAheadOutEdge = this.currentOutEdge;
        } else return max(EDGES_OVER, this.stepPivot());
        this.W[this.currentPivot][this.currentOutEdge] = numPointsInTriangle(this.TBlue, this.S, this.currentAnchor, this.currentPivot, this.currentOutEdge) + 3;
        if (this.pivotBestWeight > 0) {
            this.W[this.currentPivot][this.currentOutEdge] += this.W[this.pivotBestInEdge][this.currentPivot] - 2;
            this.prev[this.currentPivot][this.currentOutEdge] = [this.pivotBestInEdge, this.currentPivot];
        }
        if (this.anchorBestWeight < this.W[this.currentPivot][this.currentOutEdge]) {
            this.anchorBestWeight = this.W[this.currentPivot][this.currentOutEdge];
            this.anchorBestEdge = [this.currentPivot, this.currentOutEdge];
        }
        return NOT_OVER;
    }

    stepInEdge() {
        // if p-compatible, update max and go to next step ; otherwise step outEdge
        // status : returns NOT_OVER if end of inEdge list is reached, because there might be out edges to process after that
        const lookAheadInEdgeIE = this.currentInEdgeIE + 1;
        if (lookAheadInEdgeIE >= this.inEdges.length) {
            // no inEdges left to process - may be outEdges left
            return max(NOT_OVER, this.stepOutEdge());
        }
        const lookAheadInEdge = this.inEdges[lookAheadInEdgeIE];
        const lookAheadOutEdgeOE = this.currentOutEdgeOE + 1;
        if (lookAheadOutEdgeOE >= this.outEdges.length) // no more out-edges to process : done with this pivot !
            return max(EDGES_OVER, this.stepPivot());
        this.lookAheadOutEdge = this.outEdges[lookAheadOutEdgeOE];
        if (pCompatible(this.S, lookAheadInEdge, this.currentPivot, this.lookAheadOutEdge)) {
            // all p-compatible in-edges must have been processed before next out-edge
            this.currentInEdgeIE = lookAheadInEdgeIE;
            this.currentInEdge = lookAheadInEdge;
            const weight = this.W[this.currentInEdge][this.currentPivot];
            if (weight !== null) {
                if (this.pivotBestWeight < weight) {
                    this.pivotBestWeight = weight;
                    this.pivotBestInEdge = this.currentInEdge;
                }
                this.lastProcessedIE = this.currentInEdge;
            }
            return NOT_OVER
        } else return max(NOT_OVER, this.stepOutEdge());
    }

    showSpecialPoints(showPivot = true) {
        stroke("blue");
        fill("blue");
        for (let p = 0; p < this.S.length; ++p) {
            if (p === this.currentAnchor) {
                text("A", this.S[p].x, this.S[p].y);
                //image(this.anchorImg, this.S[p].x, this.S[p].y, 16, 16);
            } else if (showPivot && p === this.currentPivot)
                text("p", this.S[p].x, this.S[p].y);
        }
    }

    showProgressOverlay() {
        for (let sourceUP = 0; sourceUP < this.underPoints.length; ++sourceUP) {
            for (let destUP = sourceUP + 1; destUP < this.underPoints.length; ++destUP) {
                const source = this.underPoints[sourceUP];
                const dest = this.underPoints[destUP];
                if (source === this.lastProcessedIE && dest === this.currentPivot) {
                    stroke("green");
                } else if (this.lookAheadOutEdge !== null && source === this.currentPivot && dest === this.lookAheadOutEdge) {
                    stroke("red");
                } else if (this.W[source][dest] > 0) {
                    const edgeColor = color(50, 50, 50, 20);
                    stroke(edgeColor);
                } else continue;
                line(this.S[source].x, this.S[source].y, this.S[dest].x, this.S[dest].y);
            }
        }
        this.showSpecialPoints();
    }

    showWeightOverlay() {
        for (let sourceUP = 0; sourceUP < this.underPoints.length; ++sourceUP) {
            for (let destUP = sourceUP + 1; destUP < this.underPoints.length; ++destUP) {
                const source = this.underPoints[sourceUP];
                const dest = this.underPoints[destUP];
                const weight = this.W[source][dest];
                if (weight === null || weight === 0) continue;
                const intensity = 255 * weight / this.anchorBestWeight;
                const edgeColor = color((255 - intensity), 50, intensity);
                stroke(edgeColor)
                line(this.S[source].x, this.S[source].y, this.S[dest].x, this.S[dest].y);
            }
        }
        this.showSpecialPoints();
    }

    showViableEdges() {
        stroke("green");
        for (let i = 0; i < this.W.length; ++i) {
            for (let j = 0; j < this.W.length; ++j) {
                const weight = this.W[i][j];
                if (weight === null) continue;
                const a = this.S[i];
                const b = this.S[j];
                gradientLine(a, b, color(0, 0, 255, 0), color(0, 0, 255, 255));
            }
        }
        this.showSpecialPoints(false);
    }

    drawPolygon(polygon, color) {
        stroke(color);
        for (let i = 0; i < polygon.length; ++i) {
            const current = this.S[polygon[i]];
            const next = this.S[polygon[(i + 1) % polygon.length]];
            line(current.x, current.y, next.x, next.y);
        }
    }

    showBestOverlay() {
        if (this.anchorBestWeight === 0) return;
        if (this.overlayIslandWeight < this.anchorBestWeight) {
            this.overlayIslandWeight = this.anchorBestWeight;
            this.overlayIsland = this.buildAnchorBestIsland();
        }
        this.drawPolygon(this.overlayIsland, color(0, 0, 255));
        this.drawPolygon(this.runBestIsland, color(0, 0, 255, 40));
        this.showSpecialPoints(false);
    }

    showResultOverlay() {
        this.drawPolygon(this.runBestIsland, color(0, 0, 255));
    }
    
}