class TriangleOverlay {

    constructor(S, TBlue, TRed) {
        this.S = S;
        this.TBlue = TBlue;
        this.TRed = TRed;
        this.selected = [];
    }

    processClick(x, y) {
        console.log("Clicked")
        let closest = null;
        for (let i = 0; i < this.S.length; ++i) {
            if (Math.hypot(S[i].x - x, S[i].y - y) < 5) {
                closest = i;
                break;
            }
        }
        if (closest !== null) {
            if (this.selected.length === 3)
                this.selected = []
            if (!this.selected.includes(closest)) {
                this.selected.push(closest);
                this.selected.sort((i, j) => S[i].x - S[j].x)
            }
        }
    }

    quadToBottom(i, j, color) {
        fill(color);
        stroke(color);
        quad(S[i].x, S[i].y, S[j].x, S[j].y, S[j].x, windowHeight, S[i].x, windowHeight);
    }

    draw() {
        if (this.selected.length === 3) {
            const [x, y, z] = this.selected;
            this.quadToBottom(x, z, "green");
            this.quadToBottom(x, y, "yellow");
            this.quadToBottom(y, z, "brown");
            // TODO : A + B - C = ...
            const infoText = "" + numPointsInTriangle(this.TBlue, this.S, this.selected[0], this.selected[1], this.selected[2], "blue")
             + " " + numPointsInTriangle(this.TRed, this.S, this.selected[0], this.selected[1], this.selected[2], "red");
            text(infoText, 30, 30)

            // the thing that works
            //const pointsDown = isRightTurn(this.S[this.selected[0]], this.S[this.selected[1]], this.S[this.selected[2]]);
            //const result = Math.abs(this.T[x][y] + this.T[y][z] - this.T[x][z]) - (pointsDown ? 1 : 0);
        }
        // TODO : redraw important points in black
    }

}