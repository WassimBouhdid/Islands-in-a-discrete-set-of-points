class ModeButtons {

    constructor() {
        this.buttons = []
        this.current = null;
        this.container = document.getElementById("modeButtonContainer");
    }

    clear() {
        this.container.innerHTML = "";
        for (let button of this.buttons)
            button.remove();
        this.buttons = []
    }

    set(texts, handlers, infoTexts) {
        this.clear();
        for (let i = 0; i < texts.length; ++i) {
            const newButton = createButton(texts[i]);
            newButton.class("dynaButton");
            newButton.parent(this.container);
            newButton.mousePressed((e) => {
                e.stopPropagation();
                this.current.removeClass("selected");
                this.current = newButton;
                this.current.addClass("selected");
                handlers[i]();
            });
            newButton.mouseOver(() => infoText = infoTexts[i])
            newButton.mouseOut(() => infoText = "");
            this.buttons.push(newButton);
        }
        this.current = this.buttons[0];
        this.current.addClass("selected");
        handlers[0]();
    }

}

class ActionButtons {

    constructor() {
        this.buttons = []
        this.current = null;
        this.container = document.getElementById("actionButtonContainer");
    }

    clear() {
        this.container.innerHTML = "";
        for (let button of this.buttons)
            button.remove();
        this.buttons = []
    }

    set(imgPaths, handlers, infoTexts) {
        this.clear();
        for (let i = 0; i < handlers.length; ++i) {
            const newButton = createImg(imgPaths[i]);
            newButton.parent(this.container);
            newButton.class("dynaButton");
            newButton.mousePressed((e) => {
                e.stopPropagation();
                handlers[i]();
            });
            newButton.mouseOver(() => infoText = infoTexts[i])
            newButton.mouseOut(() => infoText = "");
            this.buttons.push(newButton);
        }
    }

}