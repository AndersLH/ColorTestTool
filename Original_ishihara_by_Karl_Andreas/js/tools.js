function placeCircles() { // Algorithm that places circles (points) in the plate
    document.getElementById("generated").innerHTML = "<b>GENERATING FIGURES ... </b>"; // Output info'// TODO: does not work

    figures = [];                                               // Clears container with circle objects
    for (let i = 0; i < numberOfFigures; i++) {                 // Tries many times to place circle
        let canPlace = true;                                    // Boolean flag telling if colliding or not
        let r = plate.width / 2 * Math.sqrt(Math.random());     // Random radius from center of plate
        let t = Math.random() * 2 * Math.PI;                    // Random Angle (0-360)

        let Cr = MaxRadius;                                     // Tries first with biggest circle-radius
                                                                // Create new Circle Object
        let c = new Circle(((r - Cr) * Math.cos(t) + plate.width / 2) | 0,
            ((r - Cr) * Math.sin(t) + plate.height / 2) | 0,
            Cr);

        for (let j = 0; j < figures.length; j++) {              // Go through all circles currently placed in plate
            if ((figures[j].r + c.r + globalMaxDistance) >= getDistance(c, figures[j])) { // Collision with circle
                switch (c.r) {                                  // Try through radius sizes until not colliding
                    case MinRadius:                             // or discard if not possible
                        canPlace = false;
                        break;
                    case MidRadius:
                        c.r = MinRadius;
                        break;
                    case MaxRadius:
                        c.r = MidRadius;
                        break;
                    default:
                        window.alert("ERROR");                  // Error
                        break;
                }
                if (!canPlace) break;                           // If smallest radius can't place, break the loop
                j = -1;                                         // Try for loop again with smaller radius
            }
        }
        if (canPlace) figures.push(c);                          // Add to figures-array if possible to place
    }

    globalRadiusChange = 0;                                     // Reset global radius change to zero
    setColor();                                                 // Add Colors to circles
    document.getElementById("generated").innerHTML = "Figures generated: " + figures.length; // Output info

}

function setColor() { // Gives colors to figures generated
    if (currentMotive) {                                        // If a motive is set
        for (let i = 0; i < figures.length; i++) {              // Go through all circles
            let rnd = Math.random() * globalNumColors | 0;      // Random color number
            if (currentMotive[(figures[i].y / (plate.height / motiveH)) | 0] // Is Circle within motive?
                [(figures[i].x / (plate.width / motiveW) | 0)])
                figures[i].fill = "fil" + rnd;
            else figures[i].fill = "fil" + (rnd + globalNumColors);
        }
    }
}

function getTextMap(text) { // Makes a motive from a text snippet (1-2 characters (Utf-8))
    document.getElementById("motive").focus();        // Focus motive text field for faster input

    let canvas = document.createElement("canvas");     // Make a new canvas element
    let ctx = canvas.getContext('2d');                 // Get draw context from canvas

    canvas.width = canvas.height = motiveW;                     // Set resolution of canvas to match motive height

    ctx.shadowOffsetX = ctx.shadowOffsetY = 2;                  // Shadowoffsett for better readability
    ctx.font = " " + motiveW - motiveW / 6 + "px Times";        // Font and Font Size
                                                                // Draw Text on canvas
    ctx.fillText(text, (text.length > 1) ? motiveW / 10 : motiveW / 3, motiveH - motiveH / 5, motiveW);

    let canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Get all data from array as picture
    let array = new Array(canvas.width);

    // Go through picture, and add a 1 to the motive array if the alpha channel is not 0, else add a 0
    for (let i = 0; i < canvas.height; i++) {
        array[i] = new Array(canvas.width);
        for (let j = 0; j < canvas.width; j++) {
            array[i][j] = (canvasData.data[i * canvas.height * 4 + j * 4 + 3]) ? 1 : 0;
        }
    }

    currentMotive = array;                                      // Set as new motive

    setColor();                                                 // Update Colors
}

function getImageMap(src) { // Not used yet
    let img = new Image;
    img.src = src;

    console.log(src);

    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');

    canvas.width = canvas.height = motiveW;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let array = new Array(canvas.width);

    for (let i = 0; i < canvas.height; i++) {
        array[i] = new Array(canvas.width);
        for (let j = 0; j < canvas.width; j++) {
            array[i][j] = (canvasData.data[i * canvas.height * 4 + j * 4 + 3]) ? 1 : 0;
        }
    }
    currentMotive = array;

    setColor();
}

function drawSVG() { // Make SVG figures on plate
    let fills = document.getElementById("svgFillColors"); // Get element where figure fill colors are defined
    fills.innerHTML = "";                                           // Reset figure fill colors
    let style = document.createElement("style");           // Make a new style element
    style.type = "text/css";                                        // Set type to css
    let selectedFills = document.getElementsByClassName("fillColorsClass"); // Get color information (fills)
    for (let c = 0; c < selectedFills.length; c++) {                // Defines new fill colors to the new style element
        if (globalCurrentType !== "Ring" || selectedFills[c].id === "SC1") style.innerHTML += "." + selectedFills[c].id + "{fill: " + selectedFills[c].value + "}\n";
        else style.innerHTML += "." + selectedFills[c].id + "{fill: " + "none; stroke: " + selectedFills[c].value + "; stroke-width: " + 2 * 10 + "}\n";
    }
    fills.appendChild(style); // Add new style element to "svgFillColors"
    let out = document.getElementById("SVG_output_figures");    // Get element to make svg figures on
    out.innerHTML = "";                                                   // Reset element
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); // New Element

    let backgroundCircle = document.createElementNS(svg.namespaceURI, "circle");
    backgroundCircle.setAttribute("id", "BackgroundCircle");
    backgroundCircle.setAttribute("class", "SC1");
    backgroundCircle.setAttribute("cx", plate.width / 2 * 10);
    backgroundCircle.setAttribute("cy", plate.height / 2 * 10);
    backgroundCircle.setAttribute("r", plate.height / 2 * 10);

    out.appendChild(backgroundCircle);

    for (let i = 0; i < figures.length; i++) { // Go through all figures
        let figure;                            // Variable definition
        // Different svg element for different figures
        if (globalCurrentType === "Circle" || globalCurrentType === "Ring")
            figure = document.createElementNS(svg.namespaceURI, "circle");
        else figure = document.createElementNS(svg.namespaceURI, "ellipse");

        // Need this to make Ring element information
        let ring = 0;
        if (globalCurrentType === "Ring") ring = -1;

        // Sets all figure information
        // TODO: Make this more readable
        figure.setAttribute("id", "fig_" + i);
        figure.setAttribute("class", figures[i].fill);
        figure.setAttribute("cx", (figures[i].x * 10));
        figure.setAttribute("cy", figures[i].y * 10);
        if (globalCurrentType === "Circle" || globalCurrentType === "Ring")
            figure.setAttribute("r", (((figures[i].r + globalRadiusChange) < 1 ? 0 : (figures[i].r + globalRadiusChange) + ring)) * 10);
        else {
            figure.setAttribute("rx", ((figures[i].r + globalRadiusChange) < 1 ? 0 : (figures[i].r + globalRadiusChange) * 10));
            figure.setAttribute("ry", ((figures[i].r / 2 + globalRadiusChange / 2) < 1 ? 0 : (figures[i].r / 2 + globalRadiusChange / 2)) * 10);
            figure.setAttribute("transform", "rotate(" + figures[i].angle * 180 / Math.PI + "," + (Number(figure.getAttribute("cx")) + Number(figure.getAttribute("rx")) / 2) + "," + (Number(figure.getAttribute("cy")) + Number(figure.getAttribute("ry")) / 2) + ")");
        }

        if (globalBorder) {
            figure.setAttribute("stroke", "black");
            figure.setAttribute("stroke-width", 1 * 10);
        }

        out.appendChild(figure);
    }
}


function showColorChoice() {
    // TODO: Make this more readable

    let colorchoices = document.getElementById("colorChoice");
    colorchoices.innerHTML = "";

    for (let i = 0; i < globalNumColors * 2; i++) {
        if (i === 0) {
            labelM = document.createElement("label");
            labelM.innerHTML = "Motive Color(s):";
            colorchoices.appendChild(labelM);
            colorchoices.appendChild(document.createElement("br"));
            colorchoices.appendChild(document.createElement("br"));
        }
        let input = document.createElement("input");
        input.type = "color";
        input.id = "fil" + i;
        input.className = "fillColorsClass";
        input.addEventListener("input", function () {
            document.getElementById(this.id + "_label").value = this.value.replace('#', '');
            drawSVG();
        });
        input.value = i < globalNumColors ? "#444444" : "#BBBBBB";
        colorchoices.appendChild(input);
        label = document.createElement("label");
        label.innerHTML = " # ";
        colorchoices.appendChild(label);
        input2 = document.createElement("input");
        input2.id = "fil" + i + "_label";
        input2.value = input.value.replace('#', '');
        input2.maxLength = 6;
        input2.style.width = "8ch";
        input2.addEventListener("keydown", function () {
            this.data = this.value;
        });

        input2.addEventListener("input", function () {
            let prev = this.data;
            if (/^[a-f0-9 ]*$/i.test(this.value)) {
                document.getElementById(this.id.slice(0, -6)).value = ("#" + ((this.value.length < 6) ? "000000" : this.value));
                drawSVG();
            } else this.value = prev;
        });

        input2.addEventListener("keyup", function (evt) {
            if (evt.keyCode === 13)
                if (i < globalNumColors * 2 - 1) {
                    document.getElementById("fil" + (i + 1) + "_label").focus();
                }
        });

        input2.addEventListener("focus", function (evt) {
            this.select();
        });
        colorchoices.appendChild(input2);
        colorchoices.appendChild(document.createElement("br"));

        if (i === globalNumColors - 1) {
            colorchoices.appendChild(document.createElement("br"));

            let labelB = document.createElement("label");
            labelB.innerHTML = "Background Color(s):";
            colorchoices.appendChild(labelB);
            colorchoices.appendChild(document.createElement("br"));
            colorchoices.appendChild(document.createElement("br"));
        }

        if (i === (globalNumColors * 2) - 1) {
            colorchoices.appendChild(document.createElement("br"));

            let labelB = document.createElement("label");
            labelB.innerHTML = "Special Color(s):";
            colorchoices.appendChild(labelB);
            colorchoices.appendChild(document.createElement("br"));
            colorchoices.appendChild(document.createElement("br"));

            for (let j = 1; j <= globalNumSpecialColors; j++) {
                let input = document.createElement("input");
                input.type = "color";
                input.id = "SC" + j;
                input.className = "fillColorsClass";
                input.addEventListener("input", function () {
                    document.getElementById(this.id + "_label").value = this.value.replace('#', '');
                    drawSVG();
                });
                input.value = "#FFFFFF";
                colorchoices.appendChild(input);
                label = document.createElement("label");
                label.innerHTML = " # ";
                colorchoices.appendChild(label);
                input2 = document.createElement("input");
                input2.id = "SC" + j + "_label";
                input2.value = input.value.replace('#', '');
                input2.maxLength = 6;
                input2.style.width = "8ch";
                input2.addEventListener("keydown", function () {
                    this.data = this.value;
                });

                input2.addEventListener("input", function () {
                    let prev = this.data;
                    if (/^[a-f0-9 ]*$/i.test(this.value)) {
                        document.getElementById(this.id.slice(0, -6)).value = ("#" + ((this.value.length < 6) ? "000000" : this.value));
                        drawSVG();
                    } else this.value = prev;
                });

                input2.addEventListener("keyup", function (evt) {
                    if (evt.keyCode === 13)
                        if (j < globalNumSpecialColors) {
                            document.getElementById("SC" + (j + 1) + "_label").focus();
                        }
                });

                input2.addEventListener("focus", function (evt) {
                    this.select();
                });
                colorchoices.appendChild(input2);
                colorchoices.appendChild(document.createElement("br"));
            }
        }
    }
}

function exportToSVGFile() {
    let a = document.getElementById("exportOfSVG");
    a.href = "data:image/svg+xml;base64," + window.btoa(document.getElementById("svgCircles").innerHTML);
    a.download = "filename.svg";
}