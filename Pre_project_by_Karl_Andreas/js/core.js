function init() {
    setInterval(loop, 1000 / 60);
    placeCircles();
    getTextMap("");
    showColorChoice();
    drawSVG();
    getTextMap("3");
    document.getElementById("loading").style.display = "none";
    document.getElementById("app").style.display = "block";
}

init();

// Main loop
function loop() {

    let fpsn = new Date();
    fps = (1000 / (fpsn - fpsb));
    fpsb = fpsn;

    document.getElementById("fps").innerHTML = "Fps: " + Math.floor(fps);

    if (!globalDraw) globalDraw = globalUpdate;

    if (globalDraw) {
        globalDraw = false;
        if (globalUpdate) placeCircles();
        drawSVG();
    }
}