import React, { useRef, useEffect, useState } from "react";
import Color from "./Color";
import ReactDOM from "react-dom/client";
import ExcelExport from './ExcelExport';
import "./ColorTest.css"
import easytest from "./easytest.png";
import redgreen from "./redgreen.png";

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
    let startPage = useRef();
    let endPage = useRef();
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


    function getDistance(obj1, obj2) { // Get distance between two points
        return Math.sqrt((obj1.x - obj2.x) * (obj1.x - obj2.x) + (obj1.y - obj2.y) * (obj1.y - obj2.y));
    }

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
    
    let [currentRadio] = useState(0);
    let [currentColorType] = useState("protan");
    let [currentColorList] = useState([]);

    //Toggle button for enabling table graphics
    let [toggleTable,setToggleTable] = useState(false);

    //Progress bar during live test
    let progressBar = useRef(null);
    let progressCount = useRef(0);

    //Start variable for the test
    let startTest = useRef(false);

    //Instruction text under plates
    let instructionPlate = useRef(null);

    //User age and gender
    let userAge = useRef(null);
    let userExp = useRef(null);
    let userGender = useRef(null);

    //Track score for player
    let scoreParticipantP = useRef(0);
    let scoreParticipantD = useRef(0);
    let scoreParticipantT = useRef(0);
    let maxScoreP = useRef(0);
    let maxScoreD = useRef(0);
    let maxScoreT = useRef(0);

    let [finalScoreParticipantP, setFinalScoreParticipantP] = useState(0);
    let [finalScoreParticipantD, setFinalScoreParticipantD] = useState(0);
    let [finalScoreParticipantT, setFinalScoreParticipantT] = useState(0);
    let [finalMaxScoreP,setFinalMaxScoreP] = useState(0);
    let [finalMaxScoreD,setFinalMaxScoreD] = useState(0);
    let [finalMaxScoreT,setFinalMaxScoreT] = useState(0);

    //Default values of parameters
    let noiseLevel = useRef(0.000);
    let [colRadius] = useState(0.015);
    let backgroundColor = useRef("#FFFFFF");
    let [globalCurrentType] = useState("Circle"); // Current type of figure to be drawn
    let [globalNumColors] = useState(3); // How many colors on motive and background(each)
    let [globalNumSpecialColors] = useState(1); // How many background colors (always 1)
    let [numConfusionLines] = useState(3); // How many confusion lines
    let currentBrightness = useRef(100);
    let brightReduce = useRef(0);
    let noiseColor = useRef(false);

    //Track time
    let startPlateTime = useRef(null);
    let endPlateTime = useRef(null);
    let plateTime = useRef(null);
    let startTotalTime = useRef(null);
    let endTotalTime = useRef(null);
    let totalTime = useRef(null);

    //Spam prevention timer
    let lastClick = useRef(null);
    let nowClick = useRef(null);
    let currentClick = useRef(null);

    let startForm = useRef(null);

    //AFK timer
    const timeoutAfk = useRef(1000000);
    let afkTimer = useRef(false);

    //End screen timer
    const timeoutEndScreen = useRef(30000);
    let endTimer = useRef(false);
    
    let figures = useRef([]);

    let fpsb = useRef(new Date());
    let fpsCount = useRef(5);
    
    let activeTest = useRef("size");

    // Main loop
    function init() {
        setInterval(loop, 1000 / 60);
        placeCircles();
        getTextMap("");
        showColorChoice();
        drawSVG();
        getTextMap("3");
        loading.current.style.display = "none";
        app.current.style.display = "block";

        //Start with a line for color test
        recieveColor("protan");
        recieveRadio(1);
    }
    
    //Wait for DOM to load before initializing a test
    useEffect(() => {
        init();
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

    function placeCircles() { // Algorithm that places circles (points) in the plate

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
                let rnd = Math.random() * (globalNumColors) | 0;      // Random color number
                let rnd2 = Math.random() * (globalNumColors+1) | 0;      // Random color number
                if (currentMotive.current[(figures.current[i].y / (plate.current.getAttribute("height") / motiveH)) | 0] // Is Circle within motive?
                [(figures.current[i].x / (plate.current.getAttribute("width") / motiveW) | 0)])
                figures.current[i].fill = "fil" + rnd; 
                else{
                    //Add a motive color into background as noise, 15% chance * 25 chance from rnd2 % (about 4 %) of background dots being colored
                    if(activeTest.current === "noiseColor"){
                        figures.current[i].fill = "fil" + (Math.random() < 0.11 ? (rnd2 + globalNumColors - 1) : (rnd + globalNumColors));
                    } else {
                        figures.current[i].fill = "fil" + (rnd + globalNumColors); //
                    }

                } 

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
            if (globalCurrentType === "Circle" || globalCurrentType === "Ring"){
                figure = document.createElementNS(svg.namespaceURI, "circle");
            } else if(globalCurrentType === "Rect"){
                figure = document.createElementNS(svg.namespaceURI, "rect");
            } else if(globalCurrentType === "Square"){
                figure = document.createElementNS(svg.namespaceURI, "rect");
            } else {
                figure = document.createElementNS(svg.namespaceURI, "polygon");
            }
            
            // Need this to make Ring element information
            let ring = 0;
            if (globalCurrentType === "Ring") ring = -1;
            
            // Sets all figure information
            // Make this more readable
            figure.setAttribute("id", "fig_" + i);
            figure.setAttribute("class", figures.current[i].fill);
            figure.setAttribute("cx", (figures.current[i].x * 10));
            figure.setAttribute("cy", figures.current[i].y * 10);
            if (globalCurrentType === "Circle" || globalCurrentType === "Ring"){
                figure.setAttribute("r", (((figures.current[i].r + globalRadiusChange) < 1 ? 0 : (figures.current[i].r + globalRadiusChange) + ring)) * 10);
            } else if (globalCurrentType === "Rect") {
                figure.setAttribute("x", figures.current[i].x * 9.7); 
                figure.setAttribute("y", figures.current[i].y * 9.9);
                figure.setAttribute("width", ((figures.current[i].r + globalRadiusChange) < 1 ? 0 : (figures.current[i].r + globalRadiusChange)) * 10); 
                figure.setAttribute("height", ((figures.current[i].r / 2 + globalRadiusChange / 2) < 1 ? 0 : (figures.current[i].r / 2 + globalRadiusChange / 2)) * 10);
                figure.setAttribute("transform", "rotate(" + figures.current[i].angle * 180 / Math.PI + "," + 
                    (Number(figure.getAttribute("x")) + Number(figure.getAttribute("width")) / 2) + "," + 
                    (Number(figure.getAttribute("y")) + Number(figure.getAttribute("height")) / 2) + ")");
            } else if (globalCurrentType === "Square") {
                let size = ((figures.current[i].r + globalRadiusChange) < 1 ? 0 : (figures.current[i].r + globalRadiusChange)) * 10;
                figure.setAttribute("x", figures.current[i].x * 9.9);
                figure.setAttribute("y", figures.current[i].y * 9.8); 
                figure.setAttribute("width", size); 
                figure.setAttribute("height", size); 
                figure.setAttribute("transform", "rotate(" + figures.current[i].angle * 180 / Math.PI + "," +
                    (Number(figure.getAttribute("x")) + size / 2) + "," + 
                    (Number(figure.getAttribute("y")) + size / 2) + ")");
            } else {
                let size = ((figures.current[i].r + globalRadiusChange) < 1 ? 0 : (figures.current[i].r + globalRadiusChange)) * 10.5;
                let x = figures.current[i].x * 10;
                let y = figures.current[i].y * 10;
                let angle = figures.current[i].angle * 180 / Math.PI;

                //triangle points
                let x1 = x;
                let y1 = y - size / Math.sqrt(3);
                let x2 = x - size / 2;
                let y2 = y + size / (2 * Math.sqrt(3));
                let x3 = x + size / 2;
                let y3 = y + size / (2 * Math.sqrt(3));

                figure.setAttribute("points", `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
                //randomize triangle rotation
                figure.setAttribute("transform", `rotate(${angle}, ${x}, ${y})`);
            }

            //unused
            // { //ellipse
            //     figure.setAttribute("rx", ((figures.current[i].r + globalRadiusChange) < 1 ? 0 : (figures.current[i].r + globalRadiusChange) * 9.8));
            //     figure.setAttribute("ry", ((figures.current[i].r / 2 + globalRadiusChange / 2) < 1 ? 0 : (figures.current[i].r / 2 + globalRadiusChange / 2)) * 10);
            //     figure.setAttribute("transform", "rotate(" + figures.current[i].angle * 180 / Math.PI + "," + (Number(figure.getAttribute("cx")) + Number(figure.getAttribute("rx")) / 2) + "," + (Number(figure.getAttribute("cy")) + Number(figure.getAttribute("ry")) / 2) + ")");
            // }
            
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
                <Color  globalNumColors={globalNumColors*2} 
                        numConfusionLines={numConfusionLines} 
                        noiseLevel={noiseLevel.current} 
                        colRadius={colRadius} 
                        currentRadio={currentRadio} 
                        currentBrightness={currentBrightness.current}
                        brightReduce={brightReduce.current}
                        toggleTable={toggleTable}
                        setToggleTable={setToggleTable}
                        currentColorType={currentColorType}
                        recieveRadioVal={(value) => recieveRadio(value)} 
                        recieveColorType={(value) => recieveColor(value)}
                        srgbValue={(value) => recieveSrgbValue(value)} />
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
                    input.value = backgroundColor.current;
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




    const recieveSrgbValue = (newSrgb) => {
        currentColorList = newSrgb;
        //Set style color for circles
        for (let i = 0; i < globalNumColors * 2; i++) {
            document.getElementById("fil"+i).value =  newSrgb[i]  // hexList.current[i];
        }
    };

    //Change values from child element
    const recieveRadio = (newRadio) => {
        currentRadio = newRadio;
    }
    const recieveColor = (newCol) => {
        currentColorType = newCol;
    }

    //Generate new figures from button push
    let placeCirclesButton = useRef(null);

    //Data for excel sheet
    let dataExcel = useRef([]);

    //Start AFK timer to prevent people dealing with unfinished tests
    function startAfkTimer(){
        afkTimer.current = setTimeout(() => {
            fullReset();
        }, timeoutAfk.current);
    }

    //Move from the end screen to the start screen ready for next participant
    function removeEndScreen(){
        //Hide start page
        startPage.current.style.display = "block";
        instructionPlate.current.style.display = "none";
        endPage.current.style.display = "none";
        svgCircles.current.style.display = "none";
    
        //Reset scores
        scoreParticipantP.current = 0;
        scoreParticipantD.current = 0;
        scoreParticipantT.current = 0;
        maxScoreP.current = 0;
        maxScoreD.current = 0;
        maxScoreT.current = 0;
        setFinalScoreParticipantP(0);
        setFinalScoreParticipantD(0);
        setFinalScoreParticipantT(0);
        setFinalMaxScoreP(0);
        setFinalMaxScoreD(0);
        setFinalMaxScoreT(0);

        //Stop timer to prevent double refresh
        clearTimeout(endTimer.current);

        window.location.reload(); //Refresh page due to long sits in library for performance
    }

    function fullReset(){

        endPage.current.style.display = "block";
        svgCircles.current.style.display = "none";
        startTest.current = false;

        startForm.current.reset(); //reset form for next person

        //Reset progress bar
        progressBar.current.style.display = "none";
        progressCount.current = 0;
        progressBar.current.innerHTML = "Progress: "+progressCount.current+" %";


        //Collect data after test
        document.getElementById("excelButton").click();

        //Update state of final scores
        setFinalScoreParticipantP((prevMax) => prevMax + scoreParticipantP.current);
        setFinalScoreParticipantD((prevMax) => prevMax + scoreParticipantD.current);
        setFinalScoreParticipantT((prevMax) => prevMax + scoreParticipantT.current);
        setFinalMaxScoreP((prevScore) => prevScore + maxScoreP.current);
        setFinalMaxScoreD((prevScore) => prevScore + maxScoreD.current);
        setFinalMaxScoreT((prevScore) => prevScore + maxScoreT.current);

        //End timer
        endTotalTime.current = Date.now();
        totalTime.current = endTotalTime.current - startTotalTime.current;

        //Reset parameters
        noiseLevel.current = 0.000;
        globalRadiusChange = 0;
        globalBorder = false;
        backgroundColor.current = "#FFFFFF"; 
        brightReduce.current = 0;
        globalCurrentType = "Circle";

        //Reset colors for new test
        recieveColor("protan");
        recieveRadio(1);
        activeTest.current = "size";

        //Re-render
        showColorChoice();
        setColor();
        drawSVG(); 

        //End afk timer
        clearTimeout(afkTimer.current);

        //Start timer for moving back to start page
        endTimer.current = setTimeout(() => {
            removeEndScreen();
        }, timeoutEndScreen.current);        
    }

    //Color testing
    useEffect(() => {
        //Check for key press during testing
        const handleKeyDown = (event) => {
            const key = event.key;

            //Wait for startTest button to be pressed
            if(!startTest.current){
                return;
            }

            //Toggle settings during testing (turn off for live data collection)
            if (/^'$/.test(key)) {
                wrapper.current.style.display = wrapper.current.style.display === "none" ? "block" : "none";
                return;
            }
            
            //Prevent errors from starting too early
            if(currentColorList.length === 0){
                return;
            }
                
            let correctPress = false;

            //Prevent spamming buttons and accidental double clicks
            nowClick.current = Date.now();
            currentClick.current = nowClick.current - lastClick.current;
            
            //Check for valid inputs
            if (/^[a-z0-9 ]$/.test(key) && currentClick.current > 200) {
                //Simulate click on generate figures to generate a new plate
                placeCirclesButton.current.click();
                
                //Register click
                lastClick.current = Date.now();

                //Check for correct press or maxed out parameters
                if( motive.current.value === key || 
                    (globalRadiusChange > 3 && activeTest.current === "size") || 
                    globalBorder || 
                    noiseLevel.current > 0.008 || 
                    noiseColor.current ||
                    (brightReduce.current === 0 && activeTest.current === "brightness") || 
                    (backgroundColor.current === "#000000" && activeTest.current === "background") || 
                    globalCurrentType === "Square"){
                    correctPress = true;
                }
            } else {
                return;
            }        

            //Reset AFK timer and start it again
            clearTimeout(afkTimer.current);
            startAfkTimer();

            //Calculate time spent on a plate
            endPlateTime.current = Date.now();
            plateTime.current = (endPlateTime.current - startPlateTime.current) / 1000;
            startPlateTime.current = Date.now();
                
            //Generate list of current colors into string format for the Excel file
            let listColorString = "";
            for(let i = 0; i < globalNumColors*2; i++){
                listColorString += currentColorList[i] 
                if(i < globalNumColors*2-1){
                    listColorString += ", "; 
                }
            }

            //Add data to excel file
            dataExcel.current.push({ 
                ID: 1,  
                Age: userAge.current,
                Gender: userGender.current,
                Experience: userExp.current,
                Motive: motive.current.value, 
                UserKey: key === " " ? "skip" : key, 
                CorrectPress: motive.current.value === key ? "yes" : "no", 
                NoiseLevel: activeTest.current === "noise" ? noiseLevel.current : "",
                NoiseColor: activeTest.current === "noiseColor" ? "true" : "",
                CircleSize: activeTest.current === "size" ? globalRadiusChange : "",
                Border: activeTest.current === "border" ? globalBorder ? "true" : "false" : "",
                BrightnessRedcued: activeTest.current === "brightness" ? brightReduce.current : "",
                BackgroundColor: activeTest.current === "background" ? backgroundColor.current : "",  
                Shape: globalCurrentType,
                TimeSpentPlate: plateTime.current,
                ColorDeficiency: currentColorType,
                NumberOfConfusionLines: numConfusionLines,
                ConfusionLine: currentRadio,
                NumberOfColors: globalNumColors*2,
                sRGB: listColorString,
            });

            switch(currentColorType){
                case "protan": maxScoreP.current += 1; break;
                case "deutan": maxScoreD.current += 1; break;
                case "tritan": maxScoreT.current += 1; break;
                default: break;
            }
            
            //If correctly pressed or maxed parameters, reset paramters and set new motive
            if(correctPress){
                switch(currentColorType){
                    case "protan": scoreParticipantP.current += 1; break;
                    case "deutan": scoreParticipantD.current += 1; break;
                    case "tritan": scoreParticipantT.current += 1; break;
                    default: break;
                }

                //Pick new random motive for next test
                const chars = "abcdefghijkmnopqrstuvwxyz23456789"; //Removed l, 1 and 0 to avoid mix-ups
                let randomIndex = Math.floor(Math.random() * chars.length);

                //Prevent same motive twice in a row 
                if(chars[randomIndex] === motive.current.value && randomIndex > 0){
                    randomIndex -= 1;
                } else if(chars[randomIndex] === motive.current.value){
                    randomIndex += 1;
                }
                motive.current.value = chars[randomIndex]
                getTextMap(chars[randomIndex]);

                //Reset parameters
                noiseLevel.current = 0.000;
                //eslint-disable-next-line
                globalRadiusChange = 0;
                //eslint-disable-next-line
                globalBorder = false;
                //eslint-disable-next-line
                noiseColor.current = false;


                //Background color parameter reset
                if(activeTest.current === "background"){
                    backgroundColor.current = "#BFBFBF";
                }

                //Brightness parameter reset
                if(activeTest.current === "brightness"){
                    brightReduce.current = 12;
                }

                if(activeTest.current === "shape"){
                    // eslint-disable-next-line
                    globalCurrentType = "Triangle";
                    globalRadiusChange = 6;
                }

                //Reached final test
                if(currentRadio === numConfusionLines && currentColorType === "tritan"){
                    //Update progress
                    progressCount.current += 4.75
                    progressBar.current.innerHTML = "Progress: "+progressCount.current+" %";

                    //Change parameter or finish test if all parameters are done
                    switch(activeTest.current){
                        case "size": activeTest.current = "background";  recieveColor("protan"); recieveRadio(1); backgroundColor.current = "#BFBFBF"; break;
                        case "background": activeTest.current = "noise"; recieveColor("protan"); recieveRadio(1); backgroundColor.current = "#FFFFFF"; break;
                        case "noise": activeTest.current = "border"; recieveColor("protan"); recieveRadio(1); break;
                        case "border": activeTest.current = "noiseColor"; recieveColor("protan"); recieveRadio(1);  break;
                        case "noiseColor": activeTest.current = "shape"; recieveColor("protan"); recieveRadio(1);   globalCurrentType = "Triangle"; globalRadiusChange = 6; break;
                        case "shape": activeTest.current = "brightness"; recieveColor("protan"); recieveRadio(1); globalCurrentType = "Circle"; globalRadiusChange = 0; brightReduce.current = 12; break;
                        case "brightness": fullReset(); brightReduce.current = 0; break;
                        default: break;
                    }
                } else if(currentRadio === numConfusionLines){ //Reached final confusion line
                    
                    //Update 4.5 % progress
                    progressCount.current += 4.75;
                    progressBar.current.innerHTML = "Progress: "+progressCount.current+" %";


                    //Cycle confusion lines and color tests
                    if(currentColorType === "protan"){
                        recieveColor("deutan");
                    } else {
                        recieveColor("tritan");
                    }
                    recieveRadio(1);
                } else {
                    //Go to next confusion line
                    recieveRadio(currentRadio+1); 
                }
                

                //TODO: Potentially download the whole array worth with the excel file 

                //Too big for excel, need another method
                //FigureB64: "data:image/svg+xml;base64," + window.btoa(svgCircles.current.innerHTML)},                
                // svgList.current.push(svgCircles.current.innerHTML);


                //TODO:
                //If we dont have random confusion lines, we can save which confusion line


            } else {
                //Change parameters after incorrect motive input
                //Make switch case
                if(activeTest.current === "noise"){
                    noiseLevel.current += 0.003;
                }
                if(activeTest.current === "noiseColor"){
                    noiseColor.current = true;
                }
                if(activeTest.current === "size"){
                    globalRadiusChange++;
                }
                if(activeTest.current === "border"){
                    globalBorder = true;
                }
                if(activeTest.current === "brightness"){
                    brightReduce.current -= 4;
                    //avoid negative numbers
                    if(brightReduce.current < 0){
                        brightReduce.current = 0;
                    }
                }
                if(activeTest.current === "background"){
                    //Remove "#"
                    let colorHex = backgroundColor.current.slice(1);
                    //Reduce the color in hex by 1/4th of a step towards black 
                    let colorInt = parseInt(colorHex, 16);
                    colorInt -= 0x404040; 
                    if (colorInt < 0) colorInt = 0; //Prevent negative numbers
                    //Helps if-checks in case the hex number is less than 6 characters 
                    colorHex = colorInt.toString(16).padStart(6, "0"); 
                    backgroundColor.current = `#${colorHex}`;
                }
                if(activeTest.current === "shape"){
                    globalRadiusChange = 3;
                    globalCurrentType = "Square";

                }
            }
            //Re-render color test
            showColorChoice();
            setColor();
            drawSVG(); 
        }
    
        window.addEventListener('keydown', handleKeyDown);
    
        //Prevent double-clicking from each press
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    //HTML
    
    return (
        <div>

        <div ref={loading}>
            <h1 style={{ textAlign: "center" }}>Loading...</h1>
        </div>
        <h2 ref={progressBar} style={{display:"none", position: "absolute", left: "30px", top:"30px"}}>
            Progress: 0 %
        </h2>
        <div ref={app} onClick={() => { globalDraw.current = true; }}>
            <div ref={svgCircles} style={{display:"none"}} className="plateDiv">
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
            <div ref={startPage} className="startPage">
                {/* Add date to data? */}
                <h1 className="rainbowText" style={{marginBottom:"-40px",marginTop:"40px"}}>
                    Do you have perfect color vision?  
                </h1>

                <img src={easytest} width="27%" alt="" />

                <p style={{width:"40%", display:"inline-block"}}>
                This test will challenge your color vision, even if you think you have good color vision! As you take the test, 
                it will adapt based on your performance. Simply use the <b>keyboard</b> to match the displayed <b>lower case letter or number</b> during the test. 
                <br></br><br></br>

                The test is anonymous and the data gathered will be used to aid my master's thesis. 
                By participating in this test, you agree to your test results and information below being used
                and published in my master's thesis.
                <br></br><br></br>
                Contact me at <b>andelha@stud.ntnu.no</b> if you have any questions.
                <br></br><br></br>
                <i>-Anders Lunde Hagen</i>
                </p>

                <img src={redgreen}  width="25%" alt=""/>

                <form ref={startForm}>
                <div className="containerRadio" style={{paddingLeft:"70px"}}>
                    
                    
                    <div className="radioDiv">
                            <h3 title="Why do I ask for this?
                                        People who have a lot of experience within color science and color tests might perform better">
                                How experienced are you within the field of color science: <span style={{cursor:"help"}}>ⓘ</span>  
                            </h3>
                        <div style={{display:"inline-block", textAlign:"right"}}>  
                            <label>No experience<input name="exp" type="radio" onChange={(e) => userExp.current = "no experience"}></input></label><br></br>
                            <label>Some experience<input name="exp" type="radio" onChange={(e) => userExp.current = "some experience"}></input></label><br></br>
                            <label>Well experienced<input name="exp" type="radio" onChange={(e) => userExp.current = "well experienced"} required></input></label><br></br>
                            <label>No answer<input name="exp" type="radio" onChange={(e) => userExp.current = "no answer"}></input></label>
                        </div>
                    </div>

                    <div className="radioDiv">
                        <h3 title="Why do I ask for this?
                            Males have a higher chance of having a type of color vision deficiency, so this will be used to look for abnormalities in the data">
                            Select your gender at birth: <span style={{cursor:"help"}}>ⓘ</span><br></br>
                            
                        </h3>
                        <div style={{display:"inline-block", textAlign:"right"}}>
                            <label>Male<input name="gender" type="radio" onChange={() => userGender.current = "male"}></input></label><br></br>
                            <label>Female<input name="gender" type="radio" onChange={() => userGender.current = "female"} required></input></label><br></br>
                            <label>No answer<input name="gender" type="radio" onChange={() => userGender.current = "no answer"}></input></label><br></br>
                        </div>
                    </div>

                    <div className="radioDiv">
                            <h3 title="Why do I ask for this?
                                        A person might have improved or worsened color vision as they age">
                                Select your age range: <span style={{cursor:"help"}}>ⓘ</span> 
                            </h3>
                        <div style={{display:"inline-block", textAlign:"right"}}>  
                            <label>Under 20<input name="age" type="radio" onChange={(e) => userAge.current = "under 20"}></input></label><br></br>
                            <label>21-40<input name="age" type="radio" onChange={(e) => userAge.current = "21-40"}></input></label><br></br>
                            <label>41-60<input name="age" type="radio" onChange={(e) => userAge.current = "41-60"}></input></label><br></br>
                            <label>61-80<input name="age" type="radio" onChange={(e) => userAge.current = "61-80"}></input></label><br></br>
                            <label>Over 80<input name="age" type="radio" onChange={(e) => userAge.current = "over 80"} required></input></label><br></br>
                            <label>No answer<input name="age" type="radio" onChange={(e) => userAge.current = "no answer"}></input></label>
                        </div>
                    </div>

                    <div className="radioDiv" style={{marginRight:"150px", marginLeft:"-50px"}}>
                        <h3 className="rainbowTextDelay">
                            Start test
                        </h3>
                        <button type="submit" onClick={(e) => {
                            
                            // Check if the form is invalid 
                            if (!e.target.closest("form").checkValidity()) {
                                return;
                            } 
                            e.preventDefault();

                            startTest.current = true
                            //Hide start page
                            startPage.current.style.display = "none";
                            instructionPlate.current.style.display = "block";
                            svgCircles.current.style.display = "block";
                            wrapper.current.style.display = "none";
                            progressBar.current.style.display = "block";

                            //Start plate timers
                            startPlateTime.current = Date.now();
                            startTotalTime.current = Date.now();

                            //Spam timer
                            lastClick.current = Date.now();

                            startAfkTimer();

                        }}>Start</button>
                    </div>

                    
                </div>
                </form>

            </div>
            <div ref={endPage} style={{display:"none"}} className="endPage">

                <div style={{display:"inline-block", textAlign:"left"}}>
                You have finished the test, thank you for participating! You got <br></br> 
                    <b>{finalScoreParticipantP}/{finalMaxScoreP}</b> correct answers for protan (red). <br></br> 
                    <b>{finalScoreParticipantD}/{finalMaxScoreD}</b> correct answers for deutan (green). <br></br> 
                    <b>{finalScoreParticipantT}/{finalMaxScoreT}</b> correct answers for tritan (blue). <br></br> 
                    <br></br>
                    (Disclaimer: incorrect answers may not be an indication of color vision deficiency (color blindness), as the test is slighlty random making it
                    prone to errors even for people with perfect color vision)
                </div>

                    <br></br>
                    <br></br>
                Click 'continue' to start a new test: <br></br>
                <button onClick={() => removeEndScreen() }>Continue</button>
            </div>
            <div ref={wrapper} style={{display:"none"}}>
                <ExcelExport data={dataExcel.current} fileName="UserData"/>
                <select onChange={(e) => {
                    activeTest.current = e.target.value; 
                    //Set brightness to testing value
                    if(e.target.value === "brightness"){brightReduce.current = 12;} 
                    else {brightReduce.current = 0;}

                    //Set background color to testing grey
                    if(e.target.value === "background"){backgroundColor.current = "#BFBFBF";}
                    else {backgroundColor.current = "#FFFFFF";}
                    //re-render after changing parameter
                    showColorChoice();
                    setColor();
                    drawSVG();
                }}>
                    <option value="noise">Noise</option>
                    <option value="noiseColor">NoiseColor</option>
                    <option value="size">Size</option>
                    <option value="border">Border</option>
                    <option value="brightness">Brightness</option>
                    <option value="background">Background Color</option>
                    <option value="shape">Shape</option>
                </select>
                <div ref={controls}>
                    <fieldset style={{width: "20%", float: "left"}}>
                        <legend>Controls</legend>
                        <label>Choose a figure:</label>
                        <select onChange={(e) => {globalCurrentType = e.target.value;}}>
                            <option value="Circle" defaultValue={"Circle"}>Circles</option>
                            <option value="Triangle">Triangles</option>
                            <option value="Rect">Rectangle</option>
                            <option value="Square">Square</option>
                            <option value="Ring">Rings</option>
                        </select>
                        <br />
                        <br />
                        <label> Text Motive: </label>
                        <input type="text" maxLength="2" defaultValue={"3"} style={{width:"35px", display:"none"}} ref={motive} />
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
                        {/* Eslint complains about href not being valid, so how about you stop complaining!? */}
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
                    <fieldset style={{width: "60%"}}>
                        <legend>Colors</legend>
                        <label> How many colors in each group? </label>
                        <input type="number" defaultValue="1" min="1" max="9"  maxLength="1"
                            onInput={(e) => {
                                let value = e.target.value;

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
                            <label> Level of color noise? </label>
                        <input type="number" defaultValue="0.000" min="0" max="1"  step={"0.002"}
                            onInput={(e) => {
                                let value = e.target.value;

                                noiseLevel.current = Number(value); 
                                showColorChoice();
                                setColor();
                                drawSVG();

                                e.target.value = value;
                            }}/>
                            <br></br>
                            <label> Collision radius? </label>
                        <input type="number" defaultValue="0.0" min="0" max="1"  step={"0.002"}
                            onInput={(e) => {
                                let value = e.target.value;

                                colRadius = Number(value); 
                                showColorChoice();
                                setColor();
                                drawSVG();

                                e.target.value = value;
                            }}/>

                        <hr />
                        <div ref={colorChoice}></div>
                    </fieldset>
                </div>
            </div>
        </div>
        <canvas ref={plate} style={{display:"none"}} width="400" height="400"></canvas>
        <p ref={instructionPlate} style={{display:"none", textAlign:"center"}}>
            Press the <b>letter or number</b> on the <b>keyboard</b> to match the motive. <br></br>
            If it is difficult to see, make your best guess. <br></br>
            If it is impossible to see, press <b>spacebar to skip</b> or take your best guess anyway. <br></br> 
        </p>
        </div>
    );
}

export default ColorTest;
