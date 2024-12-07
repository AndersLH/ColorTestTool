import React, { useRef, useEffect, useState } from "react";
import Color from "./Color";
import ReactDOM from "react-dom/client";

function ColorTest() {


    //React ref variables
    let loading = useRef();
    let app = useRef();
    let colorChoice = useRef();
    let colors = useRef();
    let svgCircles = useRef();
    let svgFillColors = useRef();
    let SVG_output_figures = useRef();
    let wrapper = useRef();
    let controls = useRef();
    let motive = useRef();
    let motiveImage = useRef();
    let min = useRef();
    let max = useRef();
    let minTxt = useRef();
    let maxTxt = useRef();
    let disBtwCircles = useRef();
    let numOfCircles = useRef();
    let exportOfSVG = useRef();
    let generated = useRef();
    let fps = useRef();
    let plate = useRef();


    //Original file from previous project: circles.js


    //Circle class
    class Circle {
        constructor(x, y, r) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.fill = undefined;
            this.angle = Math.random() * 2 * Math.PI;
        }
    }

    //Original file from previous project: math.js


    function getDistance(obj1, obj2) { // Get distance between two points
        return Math.sqrt((obj1.x - obj2.x) * (obj1.x - obj2.x) + (obj1.y - obj2.y) * (obj1.y - obj2.y));
    }


    //Original file from previous project: globals.js


    //Global Variables


    let [MinRadius] = useState(3);   // The 3 sizes a circle can be
    let [MaxRadius] = useState(7);
    let [MidRadius] = useState(Math.floor((MaxRadius + MinRadius) / 2));

    let [numberOfFigures] = useState(20000);  // Try to generate this many figures

    let currentMotive = useRef(0); // Array with current motive

    let [globalRadiusChange, setGlobalRadiusChange] = useState(0); // Global change in radius

    let [globalBorder] = useState(false); // Draw border around figure?

    let [globalMaxDistance] = useState(1);  // Max distance between each figure

    let globalUpdate = useRef(false); // Update the circle geometry?
    let globalDraw = useRef(true);  // Redraw the figures?
    
    let [motiveH] = useState(400); // Dimension of motive
    let [motiveW] = useState(400);
    
    let [globalNumColors] = useState(1); // How many colors on motive and background(each)
    let [globalNumSpecialColors] = useState(1); // How many special colors
    let [numConfusionLines] = useState(4); // How many special colors
    
    let [globalCurrentType] = useState("Circle"); // Current type of figure to be drawn

    let figures = useRef([]);

    let fpsb = useRef(new Date()); // How many special colors
    let fpsCount = useRef(2);
    

    // Main loop
    //Original file from previous project: core.js
    
    function init() {

        setInterval(loop, 1000 / 60);
        placeCircles();
        getTextMap("");
        showColorChoice();
        drawSVG();
        getTextMap("3");
        loading.current.style.display = "none";
        app.current.style.display = "block";
    }
    
    //Wait for DOM to load before initializing a test
    useEffect(() => {
        init();
        //React warning about missing dependencies in useEffect: "react-hooks/exhaustive-deps"
        //It is ignored, as the code works fine despite the warning, and the focus of the project is not here
        // eslint-disable-next-line
    }, []);
    
    function loop() {
        let fpsn = new Date();

        //FPS counter not working properly, however, not vital for project work
        const deltaTime = fpsn - fpsb.current;
            if (deltaTime > 0) {
                fpsCount.current = 1000 / deltaTime;
            } else {
                fpsCount.current = 0; // Avoid Infinity when deltaTime is 0
            }

        fpsb.current = fpsn;
        
        if(fps.current){
            // Remove comment to get broken fps back (not relevant for new project)
            // fps.current.innerHTML = `Fps: ${Math.floor(fpsCount.current)}`;
        }
        
        if (!globalDraw.current) {
            globalDraw.current = globalUpdate.current;
        }

        if (globalDraw.current) {
            globalDraw.current = false;
            if (globalUpdate.current) {
                placeCircles();
            }
            drawSVG();
        }
        
    }
    
    //Original file from previous project: tools.js

    function placeCircles() { // Algorithm that places circles (points) in the plate
        // generated.current.innerHTML = "<b>GENERATING FIGURES ... </b>"; // Output info'// does not work
        

        figures.current = [];                                         // Clears container with circle objects
        for (let i = 0; i < numberOfFigures; i++) {                 // Tries many times to place circle
            let canPlace = true;                                    // Boolean flag telling if colliding or not
            let r = plate.current.getAttribute("width") / 2 * Math.sqrt(Math.random());     // Random radius from center of plate
            let t = Math.random() * 2 * Math.PI;                    // Random Angle (0-360)
            
            let Cr = MaxRadius;                                     // Tries first with biggest circle-radius
            // Create new Circle Object
            let c = new Circle(((r - Cr) * Math.cos(t) + plate.current.getAttribute("width") / 2) | 0,
            ((r - Cr) * Math.sin(t) + plate.current.getAttribute("height") / 2) | 0,
            Cr);
            
            for (let j = 0; j < figures.current.length; j++) {              // Go through all circles currently placed in plate
                if ((figures.current[j].r + c.r + globalMaxDistance) >= getDistance(c, figures.current[j])) { // Collision with circle
                    switch (c.r) {                                  // Try through radius sizes until not colliding
                        case MinRadius: canPlace = false; break;
                        case MidRadius: c.r = MinRadius; break;
                        case MaxRadius: c.r = MidRadius; break;
                        default: window.alert("ERROR"); break;
                    }
                    if (!canPlace) break;                           // If smallest radius can't place, break the loop
                    j = -1;                                         // Try for loop again with smaller radius
                }
            }
            // Add to figures-array if possible to place
            if (canPlace) {
                figures.current = [...figures.current, c];
            }
            
        }   
        
        
        setGlobalRadiusChange(0);                                     // Reset global radius change to zero
        setColor();                                                 // Add Colors to circles
        generated.current.innerHTML = `Figures generated: ${figures.current.length}`; // Output info
        
    }
    
    function setColor() { // Gives colors to figures generated
        if (currentMotive.current) {                                        // If a motive is set
            for (let i = 0; i < figures.current.length; i++) {              // Go through all circles
                let rnd = Math.random() * globalNumColors | 0;      // Random color number
                if (currentMotive.current[(figures.current[i].y / (plate.current.getAttribute("height") / motiveH)) | 0] // Is Circle within motive?
                [(figures.current[i].x / (plate.current.getAttribute("width") / motiveW) | 0)])
                figures.current[i].fill = "fil" + rnd;
                else figures.current[i].fill = "fil" + (rnd + globalNumColors);
            }
        }
    }
    
    function getTextMap(text) { // Makes a motive from a text snippet (1-2 characters (Utf-8))
        
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
        
        currentMotive.current = array;                                      // Set as new motive
        
        setColor();                                                 // Update Colors
    }
    
    
    function drawSVG() { // Make SVG figures on plate
        let fills = svgFillColors.current; // Get element where figure fill colors are defined
        fills.innerHTML = "";                                           // Reset figure fill colors
        let style = document.createElement("style");           // Make a new style element
        style.type = "text/css";                                        // Set type to css
        let selectedFills = document.getElementsByClassName("fillColorsClass"); // Get color information (fills)
        for (let c = 0; c < selectedFills.length; c++) {                // Defines new fill colors to the new style element
            if (globalCurrentType !== "Ring" || selectedFills[c].id === "SC1") style.innerHTML += "." + selectedFills[c].id + "{fill: " + selectedFills[c].value + "}\n";
            else style.innerHTML += `.${selectedFills[c].id}{fill: none; stroke: ${selectedFills[c].value}; stroke-width: ${2 * 10}"}\n`;
        }

        fills.appendChild(style); // Add new style element to "svgFillColors"
        let out = SVG_output_figures.current;    // Get element to make svg figures on
        out.innerHTML = "";                                                   // Reset element
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); // New Element

        let backgroundCircle = document.createElementNS(svg.namespaceURI, "circle");
        backgroundCircle.setAttribute("id", "BackgroundCircle");
        backgroundCircle.setAttribute("class", "SC1");
        backgroundCircle.setAttribute("cx", plate.current.getAttribute("width") / 2 * 10);
        backgroundCircle.setAttribute("cy", plate.current.getAttribute("height") / 2 * 10);
        backgroundCircle.setAttribute("r", plate.current.getAttribute("height") / 2 * 10);
        
        out.appendChild(backgroundCircle);
        
        for (let i = 0; i < figures.current.length; i++) { // Go through all figures
            let figure;                            // Variable definition
            // Different svg element for different figures
            if (globalCurrentType === "Circle" || globalCurrentType === "Ring")
                figure = document.createElementNS(svg.namespaceURI, "circle");
            else figure = document.createElementNS(svg.namespaceURI, "ellipse");
            
            // Need this to make Ring element information
            let ring = 0;
            if (globalCurrentType === "Ring") ring = -1;
            
            // Sets all figure information
            // Make this more readable
            figure.setAttribute("id", "fig_" + i);
            figure.setAttribute("class", figures.current[i].fill);
            figure.setAttribute("cx", (figures.current[i].x * 10));
            figure.setAttribute("cy", figures.current[i].y * 10);
            if (globalCurrentType === "Circle" || globalCurrentType === "Ring")
                figure.setAttribute("r", (((figures.current[i].r + globalRadiusChange) < 1 ? 0 : (figures.current[i].r + globalRadiusChange) + ring)) * 10);
            else {
                figure.setAttribute("rx", ((figures.current[i].r + globalRadiusChange) < 1 ? 0 : (figures.current[i].r + globalRadiusChange) * 10));
                figure.setAttribute("ry", ((figures.current[i].r / 2 + globalRadiusChange / 2) < 1 ? 0 : (figures.current[i].r / 2 + globalRadiusChange / 2)) * 10);
                figure.setAttribute("transform", "rotate(" + figures.current[i].angle * 180 / Math.PI + "," + (Number(figure.getAttribute("cx")) + Number(figure.getAttribute("rx")) / 2) + "," + (Number(figure.getAttribute("cy")) + Number(figure.getAttribute("ry")) / 2) + ")");
            }
            
            if (globalBorder) {
                figure.setAttribute("stroke", "black");
                figure.setAttribute("stroke-width", 1 * 10);
            }
            
            out.appendChild(figure);
        }
    }
    
    //Display colors in test
    function showColorChoice() {
        // Make this more readable
        let colorchoices = colorChoice.current;
        colorchoices.innerHTML = "";


        
        for (let i = 0; i < globalNumColors * 2; i++) {

            //Create custom element <Color/>
            const input = document.createElement("div"); 
            // Can use existing instead
            const root = ReactDOM.createRoot(input);
            root.render(
                <Color globalNumColors={globalNumColors*2} numConfusionLines={numConfusionLines} srgbValue={(value) => recieveSrgbValue(value)} />
            );
        
            
            input.id = "fil" + i;
            input.className = "fillColorsClass";
            // input.value = `${hexVal.current}`;

            input.addEventListener("input", function () {
                drawSVG();
            });
            input.value = i < globalNumColors ? "#4F44F4" : "#BBBBBB";
            colorchoices.appendChild(input);
            let label = document.createElement("label");
            label.innerHTML = " # ";
            colorchoices.appendChild(label);
            let input2 = document.createElement("input");
            input2.id = "fil" + i + "_label";
            input2.value = input.value.replace('#', '');
            input2.maxLength = 6;
            input2.style.width = "8ch";
            input2.addEventListener("keydown", function () {
                this.data = this.value;
            });
            
            // eslint-disable-next-line
            input2.addEventListener("input", function () {
                let prev = this.data;
                if (/^[a-f0-9 ]*$/i.test(this.value)) { //Checks for valid hex match
                    document.getElementById(this.id.slice(0, -6)).value = ("#" + ((this.value.length < 6) ? "000000" : this.value));
                    drawSVG();
                } else this.value = prev;
            });
            
            //Eslint complaining about the use of "globalNumColors", but it remains unchanged and is not a problem
            // eslint-disable-next-line
            input2.addEventListener("keyup", function (evt) {
                if (evt.keyCode === 13){
                    if (i < globalNumColors * 2 - 1) {
                        document.getElementById("fil" + (i + 1) + "_label").focus();
                    }
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
                labelB.innerHTML = "Foreground Color:";
                colorchoices.appendChild(labelB);
                colorchoices.appendChild(document.createElement("br"));
                colorchoices.appendChild(document.createElement("br"));
            }
            
            if (i === (globalNumColors * 2) - 1) {
                colorchoices.appendChild(document.createElement("br"));
                
                let labelB = document.createElement("label");
                labelB.innerHTML = "Background Color:";
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
                        if (evt.keyCode === 13){
                            if (j < globalNumSpecialColors) {
                                document.getElementById("SC" + (j + 1) + "_label").focus();
                            }
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
        let a = exportOfSVG.current;
        a.href = "data:image/svg+xml;base64," + window.btoa(svgCircles.current.innerHTML);
        a.download = "filename.svg";
    }

    //List of svgs
    let svgList = useRef([]);
    //Div for all svg print
    let svgDiv = useRef(null);



    const recieveSrgbValue = (newSrgb) => {

        //Set style color for circles
        for (let i = 0; i < globalNumColors * 2; i++) {
            document.getElementById("fil"+i).value =  newSrgb[i]  // hexList.current[i];
        }


    //   Add each SVG string into the div
    // svgDiv.current.innerHTML = "";
    //   svgList.current.forEach((svgContent) => {
    //     const container = document.createElement('div');
    //     container.innerHTML = svgContent; // Set the SVG content
    //     svgDiv.current.appendChild(container); // Append the div to the target div
    //   });
      


    //List of elements to change
    //Increase size 
    //Add border?
    //Increase noise level of color on confusion line
    //Change background color/contrast - related to size?
    //Geometric shapes - related to size?

    //Color image on background

    //Confusion lines table
    //Tables, one for each graph
    //Generate e.g. 4 lines on a graph
    //  Lines are seperated by x amount
    //  Donts on lines are seperated by y amount
    //  Avoids white point by z radius
    //Checkmarks in table for which line. Use refs. Highlight selected.
    //If multiple colors/dots, add rows in table. 
    //Have checkmark with preview or color values, maybe both in table

    //One table
    //3 buttons: proton, deuatn, tritan
    //Pick 1 of e.g. 4 columns (highlight confusion line)
    //Each row is a color, e.g. 3 rows = 1 for each  

    //NOTE: We only need one single now, one graph
    //(add option for customizing later)



    //Should have a save button
    //Once saved, will be basis for the dynamic version. 
    
    //Button for regenerating new random lines

    //Super optional: make your own line


    //Presentation test
    //Have some "presentation" mode that can be switched back and forth with e.g. "*"
    //Pre mode should hide all other svgs for proper styling - display:none does not work, needs to remove

    //Cannot back and forth, have to reload



    // IDEA: What if everything happens on screen, 
    // Click "start" hides menu, then we keep that one thing on screen at all times
    // Only save for later use maybe 

    //IDEA: Use a single confusion line for a single full test?
    //This would be the only manual inpiut at the start

    //PROBLEM: default values suck
    //PROBLEM: second creation had null background (black)


    };

    //Generate new figures from button push
    let placeCirclesButton = useRef(null);


    // ====== Figure size ====== //
    //Useffect needed as it tries accessing before DOM loads
    useEffect(() => {
        const handleKeyDown = (event) => {
          const key = event.key;
          //Ensure it is a-z or 0-9
          if (/^[a-z0-9]$/.test(key)) {
            placeCirclesButton.current.click();
            
            //If correct, new character, if incorrect, easier test
            //Limit on > 3 due to figure turning worse after that value
            if(motive.current.value === key || globalRadiusChange > 3 ){//|| globalBorder === true){
                //Possible values for test
                const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
                const randomIndex = Math.floor(Math.random() * chars.length);
                //Pick random value for next test
                motive.current.value = chars[randomIndex];
                getTextMap(chars[randomIndex]);
                // eslint-disable-next-line
                globalRadiusChange = 0;
                // globalBorder = false;

                //If correct add to list
                svgList.current.push(svgCircles.current.innerHTML);
                //TODO: if failed and it reaches globalRadisuChange 4, make special case, we still want to see it in data
            } else{
                //If incorrect, increase figure size
                globalRadiusChange++;
                // globalBorder = true;
                
            }

          }
        };
    
        window.addEventListener('keydown', handleKeyDown);
    
        //Prevent double-clicking from each press
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, []);


    
    //Original file from previous project index.html
    
    return (
        <div>
            <h1>Dynamic Ishihara Plates Project</h1>
        <button onClick={() => console.log(svgList.current.at(-1))}>Last one</button>
        <button onClick={() => console.log(svgList.current)}>All</button>



        <div ref={svgDiv}></div>

        <div ref={loading}>
            <h1 style={{ textAlign: "center" }}>Loading...</h1>
        </div>
        <div ref={app} onClick={() => { globalDraw.current = true; }}>
            <div ref={svgCircles}>
                <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="4in" height="4in" version="1.1"
                    style={{
                        shapeRendering: "geometricPrecision",
                        textRendering: "geometricPrecision",
                        imageRendering: "optimizeQuality",
                        fillRule: "evenodd",
                        clipRule: "evenodd",
                    }}
                    viewBox="0 0 4000 4000">
                    <defs ref={svgFillColors}></defs>
                    <g ref={SVG_output_figures}></g>
                </svg>
            </div>
            <div ref={wrapper}>
                <div ref={controls}>
                    <fieldset style={{width: "20%", float: "left"}}>
                        <legend>Controls</legend>
                        <label>Choose a figure:</label>
                        <select onChange={(e) => {globalCurrentType = e.target.value;}}>
                            <option value="Circle" defaultValue={"Circle"}>Circles</option>
                            <option value="Ellipse">Ellipses</option>
                            <option value="Ring">Rings</option>
                        </select>
                        <br />
                        <br />
                        <label> Text Motive: </label>
                        <input type="text" maxLength="2" defaultValue={"3"} style={{width:"35px"}} ref={motive} />
                        <button onClick={() => getTextMap(motive.current.value)}>Make</button>
                        <br />
                        <br />
                        <label> Upload Image Motive: </label>
                        <input type="file" ref={motiveImage} accept="image/x-png" onChange={(e) => {
                            let img = new Image();

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
                                currentMotive.current = array;
                    
                                setColor();
                                drawSVG();
                            }
                    
                        }}/>
                        <br />
                        <br />
                        <label> Change figure-size: </label>
                        <button onClick={() => globalRadiusChange--}>-</button>
                        <button onClick={() => (globalRadiusChange = 0)}> |</button>
                        <button onClick={() => globalRadiusChange++}>+</button>
                        <br />
                        <label> Border? </label>
                        <input type="checkbox" onClick={() => (globalBorder = !globalBorder)}/>
                        <br />
                        <label> Generate figures every frame? </label>
                        <input type="checkbox" onClick={() => (globalUpdate = !globalUpdate)}/>
                        <hr />
                        <div ref={minTxt}>Min Radius: 3</div>
                        <input type="range" min="1" max="5" defaultValue="3" className="slider" ref={min} 
                            onInput={(e) => {
                                if (minTxt.current) {
                                  minTxt.current.innerHTML = `Min Radius: ${e.target.value}`;
                                }
                                MinRadius = Number(e.target.value);
                                MidRadius = ((MaxRadius + MinRadius) / 2) | 0;
                              }}/>
                        <div ref={maxTxt}>Max Radius: 7</div>
                        <input type="range" min="5" max="20" defaultValue="7" className="slider" ref={max}
                        onInput={(e) => {
                            if (maxTxt.current) {
                              maxTxt.current.innerHTML = `Max Radius: ${e.target.value}`;
                            }
                            MaxRadius = Number(e.target.value);
                            MidRadius = ((MaxRadius + MinRadius) / 2) | 0;
                            }}/>
                        <br />
                        <label> Max distance between each figure: </label>
                        <input type="number" min="0" max="20" defaultValue="1" maxLength="2" ref={disBtwCircles} onInput={(e) =>
                            (globalMaxDistance = Number(e.target.value))
                            }/>
                        <br />
                        <label> Try to generate </label>
                        <input type="number" defaultValue="20000" maxLength="5" step="100" min="0" max="99999" ref={numOfCircles}
                            onInput={(e) => (numberOfFigures = Number(e.target.value))}
                        />
                        <label> figures </label>
                        <br />
                        <br />
                        <button onClick={placeCircles} ref={placeCirclesButton}>Generate figures</button>
                        {/* Eslint complains about href not being valid */}
                        {/* eslint-disable-next-line */}
                        <a ref={exportOfSVG} href="#">
                            <button onClick={exportToSVGFile}>Download Plate</button>
                        </a>
                        <br />
                        <div ref={generated}>Figures generated:</div>
                    </fieldset>
                    <br />
                    <div ref={fps}></div>
                </div>
                <div ref={colors}>
                    <fieldset style={{width: "40%"}}>
                        <legend>Colors</legend>
                        <label> How many colors in each group? </label>
                        <input type="number" defaultValue="1" min="1" max="9"  maxLength="1"
                            onInput={(e) => {
                                let value = e.target.value;

                                if (Number(value) < 1) {
                                value = 1;
                                } else if (Number(value) > 9) {
                                value = 9;
                                }

                                if (Number(value) === 0 && value.length) {
                                value = 1; 
                                }

                                value = value.slice(0, e.target.maxLength);

                                globalNumColors = Number(value); 
                                showColorChoice();
                                setColor();
                                drawSVG();

                                e.target.value = value;
                            }}/>
                            <br></br>

                        <label> How many confusion lines? </label>
                        <input type="number" defaultValue="4" min="1" max="9" maxLength="1"
                            onInput={(e) => {
                                let value = e.target.value;

                                if (Number(value) < 1) {
                                value = 1;
                                } else if (Number(value) > 9) {
                                value = 9;
                                }

                                if (Number(value) === 0 && value.length) {
                                value = 1; 
                                }

                                value = value.slice(0, e.target.maxLength);

                                numConfusionLines = Number(value);
                                showColorChoice();
                                setColor();
                                drawSVG();

                                e.target.value = value;
                            }}/>
                            <br></br>

                        <hr />
                        <div ref={colorChoice}></div>
                    </fieldset>
                </div>
            </div>
        </div>
        <canvas ref={plate} width="400" height="400"></canvas>
        </div>
    );
}

export default ColorTest;
