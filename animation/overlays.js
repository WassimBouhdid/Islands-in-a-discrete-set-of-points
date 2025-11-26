class TriangleOverlay {

    constructor(S, TBlue, TRed) {
        this.S = S;
        this.TBlue = TBlue;
        this.TRed = TRed;
        this.selected = [];
    }

    findClosest(x, y) {
        let closest = null;
        for (let i = 0; i < this.S.length; ++i) {
            if (Math.hypot(S[i].x - x, S[i].y - y) < 5) {
                closest = i;
                break;
            }
        }
        return closest;
    }

    processClick(x, y) {
        const closest = this.findClosest(x, y);
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
        noFill();
        stroke(color);
        quad(S[i].x, S[i].y, S[j].x, S[j].y, S[j].x, windowHeight, S[i].x, windowHeight);
    }

    draw() {
        if (this.selected.length === 3) {
            const [x, y, z] = this.selected;
            this.quadToBottom(x, z, "green");
            this.quadToBottom(x, y, "yellow");
            this.quadToBottom(y, z, "brown");
            const blueText = "" + numPointsInTriangle(this.TBlue, this.S, this.selected[0], this.selected[1], this.selected[2], "blue") + " blue points"
            const redText = "" + numPointsInTriangle(this.TRed, this.S, this.selected[0], this.selected[1], this.selected[2], "red") + " red points";
            stroke("blue");
            fill("blue");
            text(blueText, 30, 90);
            stroke("red");
            fill("red");
            text(redText, 30, 120);
        }
        for (let i = 0; i < this.selected.length; ++i) {
            const p = this.S[this.selected[i]];
            stroke(p.color);
            fill(p.color);
            ellipse(p.x, p.y, 6, 6);
        }
        const closest = this.findClosest(mouseX, mouseY);
        if (closest !== null) {
            const p = this.S[closest];
            stroke(p.color);
            fill(p.color);
            ellipse(p.x, p.y, 6, 6);
        }
    }

}