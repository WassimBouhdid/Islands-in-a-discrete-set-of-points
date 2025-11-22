const NOT_OVER = 0;
const EDGES_OVER = 1;
const PIVOTS_OVER = 2;
const ANCHORS_OVER = 3;

class MainAlgo {

    constructor(S, R, TBlue, TRed) {
        this.S = S;
        this.R = R;
        this.TBlue = TBlue;
        this.TRed = TRed;
        this.resetRun();
    }

    resetRun() {
        this.bluePoints = [...Array(this.S.length).keys()].filter((p) => S[p].color === "blue");
        this.currentAnchorBP = -1;
        this.runBestWeight = 0;
        this.runBestIsland = [];
        this.stepAnchor();
    }

    stepAnchor() {
        ++this.currentAnchorBP;
        this.currentAnchor = this.bluePoints[this.currentAnchorBP];
        if (this.currentAnchorBP === this.bluePoints.length) return ANCHORS_OVER;
        this.anchorBestWeight = 0;
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
        this.anchorBestEdge = null;
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
        if (anchorBestEdge === null) return;
        if (this.runBestWeight > this.anchorBestWeight) {
            this.runBestWeight = this.anchorBestWeight;
            this.runBestIsland = this.buildAnchorBestIsland();
        }
    }

    filterRedPoints() {
        for (let i = 0; i < this.underPoints.length - 1; ++i) {
            for (let j = i + 1; j < this.underPoints.length; ++j) {
            if (numPointsInTriangle(this.TRed, this.S, this.currentAnchor, this.underPoints[i], this.underPoints[j], "red") > 0)
                this.W[this.underPoints[i]][this.underPoints[j]] = null;
            }
        }
    }

    initFirstWeights() {
        const source = this.underPoints[0]
        for (let i = 1; i < this.underPoints.length; ++i) {
            const dest = this.underPoints[i];
            this.W[source][dest] = numPointsInTriangle(this.TBlue, this.S, this.currentAnchor, this.underPoints[0], this.underPoints[i], "blue") + 3;
            if (this.anchorBestWeight < this.W[source][dest]) {
                this.anchorBestWeight = this.W[source][dest];
                this.anchorBestEdge = [source, dest]
            }
        }
    }

    stepPivot() {
        ++this.currentPivotUP;
        this.currentPivot = this.underPoints[this.currentPivotUP];
        if (this.currentPivotUP >= this.underPoints.length - 1) {
            return max(this.stepAnchor(), PIVOTS_OVER);
        }
        this.outEdges = radialOrderingHalfCut(this.currentPivot, R[this.currentPivot], S[this.currentPivot].minus(this.S[this.currentAnchor]));
        this.outEdges = this.outEdges.filter(((i) => this.S[i].color === "blue" && this.S[i].y > this.S[this.currentAnchor].y));
        this.inEdges = radialOrderingHalfCut(this.currentPivot, R[this.currentPivot], S[this.currentAnchor].minus(this.S[this.currentPivot]));
        this.inEdges = this.inEdges.filter((i) => (this.S[i].color === "blue" && this.S[i].y > this.S[this.currentAnchor].y));
        this.pivotBestWeight = 0;
        this.pivotBestInEdge = null;
        this.currentOutEdgeOE = 0;
        this.currentOutEdge = this.outEdges[this.currentOutEdgeOE];
        this.currentInEdgeIE = 0;
        this.currentInEdge = this.inEdges[this.currentInEdgeIE];
        this.lastProcessedIE = null;
        return NOT_OVER;
    }

    stepOutEdge() {
        this.W[this.currentPivot][this.currentOutEdge] = numPointsInTriangle(this.TBlue, this.S, this.currentAnchor, this.currentPivot, this.currentOutEdge) + 3;
        if (this.pivotBestWeight > 0) {
            this.W[this.currentPivot][this.currentOutEdge] += this.W[this.pivotBestInEdge][this.currentPivot] - 2;
            this.prev[this.currentPivot][this.currentOutEdge] += [this.pivotBestInEdge][this.currentPivot];
        }
        if (this.anchorBestWeight < this.W[this.currentPivot][this.currentOutEdge]) {
            this.anchorBestWeight = this.W[this.currentPivot][this.currentOutEdge];
            this.anchorBestEdge = [this.currentPivot, this.currentOutEdge];
        }
        ++this.currentOutEdgeOE;
        if (this.currentOutEdgeOE === this.outEdges.length) {
            return max(EDGES_OVER, this.stepPivot());
        }
        this.currentOutEdge = this.outEdges[this.currentOutEdgeOE];
        return NOT_OVER;
    }

    stepInEdge() {
        // if p-compatible, update max and go to next step ; otherwise step outEdge 
        console.log(this.S.length, this.currentInEdge, this.currentPivot, this.currentOutEdge)
        if (this.currentInEdgeIE === this.inEdges.length
            || !pCompatible(this.S, this.currentInEdge, this.currentPivot, this.currentOutEdge)) {
            return max(NOT_OVER, this.stepOutEdge());
        }
        const weight = this.W[this.currentInEdge][this.currentPivot];
        if (weight !== null) {
            if (this.pivotBestWeight < weight) {
                this.pivotBestWeight = weight;
                this.pivotBestInEdge = this.currentInEdge;
            }
            this.lastProcessedIE = this.currentInEdge;
        }
        ++this.currentInEdgeIE;
        this.currentInEdge = this.inEdges[this.currentInEdgeIE];
        return NOT_OVER
    }

    showProgressOverlay() {
        for (let sourceUP = 0; sourceUP < this.underPoints.length; ++sourceUP) {
            for (let destUP = sourceUP + 1; destUP < this.underPoints.length; ++destUP) {
                const source = this.underPoints[sourceUP];
                const dest = this.underPoints[destUP];
                if (source === this.lastProcessedIE && dest === this.currentPivot) {
                    stroke("yellow");
                } else if (source === this.currentPivot && dest === this.currentOutEdge) {
                    stroke("red");
                } else if () {
                    const edgeColor = color(50, 50, intensity);
                    stroke(color(10, 10, 10));
                } else continue;
                line(this.S[source].x, this.S[source].y, this.S[dest].x, this.S[dest].y);
            }
        }
        for (let p = 0; p < this.S.length; ++p) {
            if (p === this.currentAnchor) {
                text("A", this.S[p].x, this.S[p].y);
            } else if (p === this.currentPivot)
                text("p", this.S[p].x, this.S[p].y);
        }
    }

    showWeightOverlay() {
        for (let sourceUP = 0; sourceUP < this.underPoints.length; ++sourceUP) {
            for (let destUP = sourceUP + 1; destUP < this.underPoints.length; ++destUP) {
                const source = this.underPoints[sourceUP];
                const dest = this.underPoints[destUP];
                const weight = this.W[source][dest];
                if (weight === null) continue;
                const intensity = 200 * weight / this.anchorBestWeight;
                const edgeColor = color(50, 50, intensity);
                stroke(edgeColor)
                line(this.S[source].x, this.S[source].y, this.S[dest].x, this.S[dest].y);
            }
        }
        for (let p = 0; p < this.S.length; ++p) {
            if (p === this.currentAnchor) {
                text("A", this.S[p].x, this.S[p].y);
            } else if (p === this.currentPivot)
                text("p", this.S[p].x, this.S[p].y);
        }
    }

    showGraphOverlay() {
        stroke("green");
        for (let i = 0; i < this.W.length; ++i) {
            for (let j = 0; j < this.W.length; ++j) {
                const weight = this.W[i][j];
                if (weight === null) continue;
                const a = this.S[i];
                const b = this.S[j];
                gradientLine(a, b, color(200, 50, 50, 0), color(50, 200, 50, 255));
            }
        }
    }

    drawPolygon(polygon, color) {
        stroke(color);
        for (let i = 0; i < polygon.length; ++i) {
            const current = this.S[i];
            const next = this.S[(i + 1) % polygon.length];
            line(current.x, current.y, next.x, next.y);
        }
    }

    showBestOverlay() {
        if (this.anchorBestWeight === 0) return;
        if (this.overlayIslandWeight < this.anchorBestWeight) {
            this.overlayIslandWeight = this.anchorBestWeight;
            this.overlayIsland = this.buildAnchorBestIsland();
        }
        drawPolygon(this.overlayIsland, color(0, 0, 255));
        drawPolygon(this.runBestIsland, color(0, 0, 255, 150));
    }
    
}