for (let navTab of document.querySelectorAll(".navTab")) {
    const section = navTab.getAttribute("section");
    navTab.addEventListener("click", (e) => {
        e.stopPropagation();
        for (let div of document.querySelectorAll(".selected"))
            div.classList.remove("selected");
        for (let div of document.querySelectorAll(".currentSection"))
            div.classList.remove("currentSection");
        navTab.classList.add("selected")
        const currentSection = document.getElementById(section);
        currentSection.classList.add("currentSection");
    })
}