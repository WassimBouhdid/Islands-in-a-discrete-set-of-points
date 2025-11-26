for (let navTab of document.querySelectorAll(".navTab")) {
    const section = navTab.getAttribute("section");
    navTab.addEventListener("click", (e) => {
        e.stopPropagation();
        for (let div of document.querySelectorAll(".selected")) // just to be sure
            div.classList.remove("selected");
        for (let div of document.querySelectorAll(".currentSection"))
            div.classList.remove("currentSection");
        navTab.classList.add("selected")
        const currentSection = document.getElementById(section);
        currentSection.classList.add("currentSection");
        window.location.href = "#" + section;
    })
}

let startSection = window.location.href.split("#");
startSection = startSection[startSection.length - 1];
const navTab = document.querySelector("[section=" + startSection + "]");
for (let div of document.querySelectorAll(".selected"))
    div.classList.remove("selected");
for (let div of document.querySelectorAll(".currentSection"))
    div.classList.remove("currentSection");
navTab.classList.add("selected")
const currentSection = document.getElementById(startSection);
currentSection.classList.add("currentSection");