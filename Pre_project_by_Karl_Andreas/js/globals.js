//Global Variables
let MinRadius = 3;                                       // The 3 sizes a circle can be
let MaxRadius = 7;
let MidRadius = ((MaxRadius + MinRadius) / 2) | 0;

let numberOfFigures = 20000;                             // Try to generate this many figures

let currentMotive = 0;                                   // Array with current motive

// Figures
let globalRadiusChange = 0;                              // Global change in radius

let globalBorder = false;                                // Draw border around figure?

let globalMaxDistance = 1;                               // Max distance between each figure

let globalUpdate = false;                                // Update the circle geometry?
let globalDraw = true;                                   // Redraw the figures?

let motiveH = 400, motiveW = 400;                        // Dimension of motive

let globalNumColors = 3;                                 // How many colors on motive and background(each)
let globalNumSpecialColors = 1;                          // How many special colors

let globalCurrentType = "Circle";                        // Current type of figure to be drawn

let plate = document.getElementById("plate");  // Plate canvas
let plateCtx = plate.getContext("2d");


let figures = [];                                        // Global array holding the figures to be drawn

let fpsb = new Date();                                   // FPS variables
let fps = 0;


// Html Elements
document.getElementById("app").onclick = function () {
    globalDraw = true;
};

document.getElementById("min").oninput = function () {
    document.getElementById("minTxt").innerHTML = "Min Radius: " + this.value;
    MinRadius = Number(this.value);
    MidRadius = ((MaxRadius + MinRadius) / 2) | 0;
};

document.getElementById("max").oninput = function () {
    document.getElementById("maxTxt").innerHTML = "Max Radius: " + this.value;
    MaxRadius = Number(this.value);
    MidRadius = ((MaxRadius + MinRadius) / 2) | 0;
};

document.getElementById("motiveImage").addEventListener("change", function(e) {

    let img = new Image;

    img.src = e.target.files[0];
    img.src = URL.createObjectURL(e.target.files[0]);

    img.onload = function() {

        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext('2d');

        canvas.width = canvas.height = motiveW;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let array = new Array(canvas.height);

        for (let i = 0; i < canvas.height; i++) {
            array[i] = new Array(canvas.width);
            for (let j = 0; j < canvas.width; j++) {
                array[i][j] = (canvasData.data[i * canvas.height * 4 + j * 4 + 3]) ? 1 : 0;
            }
        }
        currentMotive = array;

        setColor();
        drawSVG();
    }

});
