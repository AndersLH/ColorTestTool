import './Color.css';
import React, { useState, useRef, useEffect } from 'react';
import chromaticityImage from "./CIE_1976_UCS.png";

//xxY to sRGB code from matlab code, converted to Javascript with https://www.codeconvert.ai/matlab-to-javascript-converter. Some minor adjustments has been made to fit my code. 
//Calculate XYZ from xyY 
function xyy2xyz(x, y, Y) {
  //After using CIE 1976, the new coordinates must be converted back to 1931 before proceeding
  let con = uv2xy(x,y);
  x = con.x;
  y = con.y;

  // console.log("xy:",x,y);

  const X = (x * Y) / y;
  const Z = (Y * (1.0 - x - y)) / y;

  return [X, Y, Z];
}

//Convert from uv 1976 CIE to xy 1931 CIE
function uv2xy(up,vp){
  const u = (9 * up) / (6 * up - 16 * vp + 12);
  const p = (4 * vp) / (6 * up - 16 * vp + 12);
  return {x:u,y:p};
}

//Convert xy 1931 CIE to uv 1976 CIE
function xy2uv(x, y) {
  //Prevent division by zero 
  if (x + y === 0) {
    return { u: 0, v: 0 };
  }
  
  const u = (4 * x) / (-2 * x + 12 * y + 3);
  const v = (9 * y) / (-2 * x + 12 * y + 3);

  return {u:u, v:v};
}

//Calculate sRGB values from XYZ
//AI translated from Matlab code
function xyz2srgb(XYZ) {
  const M = [
    [3.2410, -1.5374, -0.4986],
    [-0.9692, 1.8760, 0.0416],
    [0.0556, -0.2040, 1.0570],
  ];


  //Apply transformation
  const sRGB = M.map(row =>
    row.reduce((sum, value, i) => sum + value * (XYZ[i] / 100), 0)
  );

  //If outside of linear RGB gamut
  if(sRGB[0] < 0 || sRGB[0] > 1 || sRGB[1] < 0 || sRGB[1] > 1 || sRGB[2] < 0 || sRGB[2] > 1){ 
    return sRGB;
  }

  //Gamma correction and scaling
  const gammaCorrect = (value) =>
    value <= 0.00304
      ? value * 12.92
      : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;

      //Make an unrestricted dupe of this and make it an if check 

      const [sR, sG, sB] = sRGB.map((value) =>
        Math.max(0, gammaCorrect(value) * 255)
  );

  return [Math.round(sR), Math.round(sG), Math.round(sB)];
}

//Combined function to convert xyY to sRGB
function xyy2srgb(x, y, Y) {
  let XYZ = xyy2xyz(x, y, Y);
  let sRGB = xyz2srgb(XYZ); 

  //Check for valid sRGB values, if not valid reduce brightness until it is
  while((sRGB[0] > 0 && sRGB[0] < 1) || (sRGB[1] > 0 && sRGB[1] < 1) || (sRGB[2] > 0 && sRGB[2] < 1)){
    Y -= 1; 
    XYZ = xyy2xyz(x, y, Y);
    sRGB = xyz2srgb(XYZ);       
  }

  // console.log("xy:",uv2xy(x,y),"FinalY:",Y);
  
  return {a:xyz2srgb(XYZ),b:Y};
}

//List of confusion lines to perserve lines on DOM update
let cfList = [];


function Color({  srgbValue, 
                  recieveRadioVal, 
                  recieveBrightnessVal, 
                  recieveColorType,
                  currentRadio, 
                  globalNumColors, 
                  numConfusionLines,
                  noiseLevel, 
                  colRadius, 
                  currentBrightness, 
                  currentColorType}) {

                    
  //Click coordinates
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  //Slider for brightness setting
  let [sliderBright, setSliderBright] = useState(100);
  let [listColors,setListColors] = useState(currentColorType);

  //Default to 100 brightness on all confusion lines
  let maxBrightConfusion = useRef([]);
  for(let i = 0; i < numConfusionLines+1; i++){
    maxBrightConfusion.current[i] = 100;
  }



  //Coordinates for white point D65
  const whitePoint1931 = {x: 0.31272, y: 0.32903};
  const newW = xy2uv(whitePoint1931.x,whitePoint1931.y);
  const whitePoint1976 = {x:newW.u, y:newW.v};

  //Coordinates for creating sRGB triangle
  const sRGBTriangle1931 = {
    a: {x: 0.64, y: 0.33}, 
    b: {x: 0.30, y: 0.60}, 
    c: {x: 0.15, y: 0.06}
  }
  
  //Convert coordinates from 1931 triangle to 1976 triangle
  const newA = xy2uv(sRGBTriangle1931.a.x,sRGBTriangle1931.a.y);
  const newB = xy2uv(sRGBTriangle1931.b.x,sRGBTriangle1931.b.y);
  const newC = xy2uv(sRGBTriangle1931.c.x,sRGBTriangle1931.c.y);

  const sRGBTriangle1976 = {
    a: {x: newA.u, y: newA.v},
    b: {x: newB.u, y: newB.v},
    c: {x: newC.u, y: newC.v}}


  //Confusion line values 
  //x1 and y1 from color science papers as the copunctual point where the confusion lines start, 
  //yMin and yMax are points to actually create a line from the confusion line point, manually found and tested to stay within borders
  // 'xyStop' are the x or y coordinates the lines will stop at, they remain static
  const protan1931 = {x1: 0.7455, y1: 0.2565};// x2: 0.14, y2: 0.67, stat:0.1}; 
  const deutan1931 = {x1: 1.4, y1: -0.4}; // x2: 0.3, y2: 0.74, stat:0.1}; 
  const tritan1931 = {x1: 0.17045, y1: 0}; // x2: 0.35, y2: 0.95, stat:0.7};

  const newPro = xy2uv(protan1931.x1,protan1931.y1);
  const newDeu = xy2uv(deutan1931.x1,deutan1931.y1);
  const newTri = xy2uv(tritan1931.x1,tritan1931.y1);

  const protan = {x1: newPro.u, y1: newPro.v, yMin: 0.15, yMax: 0.53, xyStop:0.05}; 
  const deutan = {x1: newDeu.u, y1: newDeu.v, yMin: 0.15, yMax: 0.46, xyStop:0.6}; 
  const tritan = {x1: newTri.u, y1: newTri.v, yMin: 0.1, yMax: 0.35, xyStop:0.6};

  //Temporary store lines and wait for refresh button generate new ones
  let [generateNewCF, setGenerateNewCF] = useState(true);
  //Decoy state, it exists to help update the DOM as the table colors lags behind on state without it
  let [decoyState, setDecoyState] = useState(true);



  //Update brightness slider
  const changeBrightness = (event) => {
    setSliderBright(event.target.value);
    recieveBrightnessVal(event.target.value);
  }

  //Calculate sRGB values from x,y coordinates and slider brightness
  function calcSRGB(x,y, conLine){
    y = 100-y; //Inverted y-axis in web

    let srgb = xyy2srgb((x / 100), (1-(y / 100)), maxBrightConfusion.current[conLine]); //sliderBright old parameter
    // console.log("confusionLine:",conLine, srgb.a, srgb.b);

    if(listConfusionColors.current.length === globalNumColors ){
      listConfusionColors.current[listConfusionColors.current.length+1] = 1;

      listConfusionColors.current = [];
      for (let m = 0; m < globalNumColors; m++){
          listConfusionColors.current.push(srgbToHex(calcSRGB(document.getElementById(`${listConfusionCoords.current-1}-line-${m}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${listConfusionCoords.current-1}-line-${m}-dot`).getAttribute("data-coord-y")*100, listConfusionCoords.current-1)));
      }
      srgbValue(listConfusionColors.current);

    }



    //Set the lowest brightness to all confusion line dots
    maxBrightConfusion.current[conLine] = srgb.b;

    return srgb.a;
  }

  //Convert an array of RGB to a hex value
  function srgbToHex([r, g, b]) {
    const toHex = (value) => value.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // //SRGB functino based on cursor click, old implementation for early testing
  function calcSRGBClick(){
    return xyy2srgb((clickPosition.x / 100), (1-(clickPosition.y / 100)), sliderBright, 0).a;
  }

  //Ref initialization
  const colorBox = useRef(null);

  //Click event
  const clickSVG = (event) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();

    //Calculate the actual position within the SVG
    const x = ((event.clientX - rect.left) / rect.width);
    const y = ((event.clientY - rect.top) / rect.height);

    //Limit click coordinates to be within the grid (10% to 90%)
    const gridX = Math.max(0, Math.min((x - 0.1) / 0.8, 1)) * 100;
    const gridY = Math.max(0, Math.min((y - 0.1) / 0.8, 1)) * 100;
    
    setClickPosition({ x: gridX, y: gridY });
    
    //Pass sRGB values to parent manually, due to delayed useState update
    srgbValue(listConfusionColors.current);

  };


  function isPointInTriangle(x, y) {
    // Helper function to calculate area of a triangle
    function triangleArea(x1, y1, x2, y2, x3, y3) {
      return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
    }
  
    // Total area of the triangle
    const totalArea = triangleArea(sRGBTriangle1976.a.x, sRGBTriangle1976.a.y, 
                                   sRGBTriangle1976.b.x, sRGBTriangle1976.b.y, 
                                   sRGBTriangle1976.c.x, sRGBTriangle1976.c.y);
  
    //Calculate sub-triangle areas
    const area1 = triangleArea(x, y, sRGBTriangle1976.b.x, sRGBTriangle1976.b.y, sRGBTriangle1976.c.x, sRGBTriangle1976.c.y);
    const area2 = triangleArea(sRGBTriangle1976.a.x, sRGBTriangle1976.a.y, x, y, sRGBTriangle1976.c.x, sRGBTriangle1976.c.y);
    const area3 = triangleArea(sRGBTriangle1976.a.x, sRGBTriangle1976.a.y, sRGBTriangle1976.b.x, sRGBTriangle1976.b.y, x, y);
  
    //Check if the sum of the sub-triangle areas equals the total area
    return Math.abs(totalArea - (area1 + area2 + area3)) < 1e-9; // Allow for floating-point precision errors
  }

  //Calculate an even random split of confusion lines generated
  function calcConfusionLine(i, min, max){
    //Find the section for each line to place itself in
    let split = (max-min)/numConfusionLines;

    //Calculate a random number in the interval between the new min and max
    let newMin = split*i + min;
    let newMax = split*(i+1) + min;
    let retNum =  (newMax - newMin) + newMin; //Math.random() * ... for random confusion lines

    //Add to array for storage if refresh button has been pressed
    if (generateNewCF && decoyState){
      cfList[i] = retNum;

      if(i === (numConfusionLines - 1)){
        setGenerateNewCF(false);
        setDecoyState(false);
      }
    }    
      return cfList[i];
  }


  //List of dots for keeping a certain distance from each other
  let listConfusionDots = useRef([]);

  //Reset and initialize dots for new generation of lines on DOM update
  for(let a = 0; a < numConfusionLines; a++){
    listConfusionDots.current[a] = [];
  }

  //Save confusion dots in arrays within array for preventing collisions 
  function addConfusionDots(dot, i, j){
    listConfusionDots.current[i][j] = [];
    listConfusionDots.current[i][j][0] = dot;
  }




  //---------------------------------
  //Interpolate calculation
  function mathInter(x1, y1, x2, y2, t, j){
    //Interpolate functions
    // if(j % 2 === 1){
    //   t = 1 - t;
    // }
    if(globalNumColors/2 > j){
      t = 1-t;
    }

    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);
    return {x:x, y:y};
  }

  //Interpolate and find a point t on line from x1,y1 to x2,y2 
  function interpolate(x1, y1, x2, y2, t, i, j, radius, noise, type) {

    //Interpolate functions
    let dot = mathInter(x1, y1, x2, y2, t, j);
    let originalDot = dot;

    //If out of boundary, use recursion until it is
    while(!isPointInTriangle(dot.x,dot.y)){
      t += 0.02;
      dot = mathInter(x1,y1,x2,y2,t, j);

      //Prevent infinite loop
      //TODO: replace in while loop with && t < 1
      if(t>1){
        break;
      }
    }

    //Once dots are inside the triangle, move one more time to get them away from the edge 
    if(type === "t"){
      t += 0.04;
    } else if (type === "d"){
      t += 0.005;
    } else {
      t += 0.01
    }
    dot = mathInter(x1,y1,x2,y2,t,j);

  
    //Check if current dot is too close to another dot or too close to the whitepoint
    for(let a = 0; a < j; a++){
      while(Math.sqrt((dot.x - listConfusionDots.current[i][a][0].x) ** 2 + (dot.y - listConfusionDots.current[i][a][0].y) ** 2) <= radius 
        || Math.sqrt((dot.x - whitePoint1976.x) ** 2 + (dot.y - whitePoint1976.y) ** 2) <= 0.03){
        t += 0.003;
        dot = mathInter(x1,y1,x2,y2,t, j);

      //Prevent infinite loop
      if(t>1){
        break;
      }

      }
    }
    

    //Random angle in any direction
    // const angle = Math.random() * 2  * Math.PI; 

    //Calculate the distance moving away from the confusion line as "noise"
    //Calculated angle perpindicular to line
    const dirX = x2 - x1;
    const dirY = y2 - y1;

    //Normalize the direction vector
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    const unitDirX = dirX / length;
    const unitDirY = dirY / length;

    //Calculate perpendicular vectors, alternating sides
    const perpX = j % 2 === 0 ? -unitDirY : unitDirY;
    const perpY = j % 2 === 0 ? unitDirX : -unitDirX;

    //Calculate angle of the perpendicular vector
    const angle = Math.atan2(perpY, perpX);

    //Add a skew to prevent perfect perpindicularity which just creates another confusion line
    const skew = (i * 0.1 - j * 0.2);

    //Add how far the dot will move out based on noise with the angle + skew
    dot.x += noise * Math.cos(angle + skew);
    dot.y += noise * Math.sin(angle + skew);

    //If the noise is outside, revert changes
    if(!isPointInTriangle(dot.x,dot.y)){
      dot = originalDot;
      console.log("oopsie")
    }

    addConfusionDots(dot, i, j);
  
    return dot;
  }


  //Calculate the dots and colors on the dots on a confusion line
  function calcConfusionDot(x1, y1, x2, y2, stat, xCoor, i,j, type){

    //Calculate the dots based on their respective confusion lines and interpolate
    let dot;
    let tValue = 0.1; 
    if(xCoor){ //Checks if x2,y2 coordinates need to be swapped depending on the confusion line, tritan differs from deutan and protan
      dot = interpolate(x1,y1,calcConfusionLine(i,x2,y2),stat,tValue, i, j, colRadius, noiseLevel, type);
    } else {
      dot = interpolate(x1,y1,stat,calcConfusionLine(i,x2,y2),tValue, i, j, colRadius, noiseLevel, type);
    }

    

    return dot;
  }

  //List of colors for a selected confusion line
  let listConfusionColors = useRef([]);
  //Coordinates for current confusion line for brightness slider to use for updating
  let listConfusionCoords = useRef(null);

  //Re-click radio button after DOM update
  useEffect(() => {

    if(document.getElementById("colorSelect")){
      document.getElementById("colorSelect").dispatchEvent(new MouseEvent("click",{bubbles: true} ));
    }

    //Prevent error when no radio is selected
    if(currentRadio > 0 && document.getElementById("mm"+(currentRadio))){
      document.getElementById("mm"+(currentRadio)).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }

  }, [currentColorType, currentRadio]);

//Prevent DOM from lagging one state behind by forcing an update with a dummy decoy
  useEffect(() => {
    setDecoyState(true);
  }, [listColors]);


  return (
    <div>
      <div style={{float:"left"}}>
        <h3>Type of color confusion lines:</h3>

        {/* Dropdown list with color types */}
        <select id="colorSelect" value={listColors} onChange={(e) => {
          setListColors(e.target.value);
          recieveColorType(e.target.value); 
          setGenerateNewCF(true); 
          setDecoyState(true);
          //Reset radio buttons in table and reset list
          listConfusionColors.current = [];
          recieveRadioVal(0);
          for(let i = 0; i < numConfusionLines; i++){
            document.getElementById("mm"+(i+1)).checked = "";
          }

        }}>
          <option value="protan">Protanopia</option>
          <option value="deutan">Deuteranopia</option>
          <option value="tritan">Tritanopia</option>
        </select>

      <table>
        <tbody>

        {
          Array.from(
            { length: globalNumColors+1 },
            (_, i) => (
              <React.Fragment key={i + "dot"}>
                <tr>
                  {
                Array.from(
                  //Length
                  { length: numConfusionLines+1 },
                    (_, j) => i === 0 && j === 0 ? (
                      <th key={j + "dot"}></th>
                    ) : i === 0 ? (
                      <th key={j + "dot"} id={"radioLine-"+j} onChange={() => {
                        //Reset values for new confusion line
                        recieveRadioVal(j); //keep line selection during DOM update
                        listConfusionColors.current = [];
                        listConfusionCoords.current = 0;
                        for (let n = 0; n < numConfusionLines; n++){
                          document.getElementById(`${n}-line`).style.strokeWidth = 2;
                        }
                        //Get color of each point in this confusion line
                        for (let m = 0; m < globalNumColors; m++){
                          listConfusionColors.current.push(srgbToHex(calcSRGB(document.getElementById(`${j-1}-line-${m}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${j-1}-line-${m}-dot`).getAttribute("data-coord-y")*100, j)));
                          listConfusionCoords.current = j;
                        }
                        document.getElementById(`${j-1}-line`).style.strokeWidth = 4;
    
                        srgbValue(listConfusionColors.current);

                        //Duplicate to update the brightness of the colors, temporary fix but works well
                        for (let m = 0; m < globalNumColors; m++){
                          listConfusionColors.current.push(srgbToHex(calcSRGB(document.getElementById(`${j-1}-line-${m}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${j-1}-line-${m}-dot`).getAttribute("data-coord-y")*100)));
                          listConfusionCoords.current = j;
                        }
                        document.getElementById(`${j-1}-line`).style.strokeWidth = 4;
    
                        srgbValue(listConfusionColors.current);
                      }
                      }><label>Line {j}<br/><input type="radio" name="colorLine" id={"mm"+j}></input></label></th>
                    ) : j === 0 && i <= globalNumColors / 2 ? (
                      <th key={j + "dot"}>Motive</th>
                    ) : j === 0 ? (
                      <th key={j + "dot"}>Foreground</th>
                    ) : (
                      //If-check to make sure the element is loaded in. Calculate color and set cell to be the color of the correspoding confusion dot
                      <th key={j + "dot"} style={{backgroundColor: 
                        document.getElementById(`${j-1}-line-${i-1}-dot`) 
                        ? "blue"// srgbToHex(calcSRGB(document.getElementById(`${j-1}-line-${i-1}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${j-1}-line-${i-1}-dot`).getAttribute("data-coord-y")*100, j)) //Comment out for lag reduction during active tests
                        : "grey" }}></th>
                    )
                  ) 
                }
                </tr>
              </React.Fragment>
            )
          )
        }
        </tbody>
      </table>
      <label>Brightness: 
        <input type="range" min="0" max="100" value={sliderBright} id="briSlide" onMouseUp={() => {
          if(listConfusionCoords.current === null){
            return;
          }
          listConfusionColors.current = [];
          for (let m = 0; m < globalNumColors; m++){
              listConfusionColors.current.push(srgbToHex(calcSRGB(document.getElementById(`${listConfusionCoords.current-1}-line-${m}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${listConfusionCoords.current-1}-line-${m}-dot`).getAttribute("data-coord-y")*100, listConfusionCoords.current-1)));
            }
            srgbValue(listConfusionColors.current);
          }
          } 
          onChange={(e) => {
          changeBrightness(e); 
          }}></input>
        {sliderBright}
      </label>
      </div> 

    <div style={{height: "800px", width: "800px"}} >
      <svg style={{height:"70%", width: "70%"}} onClick={clickSVG}>

        {/* Chromaticity diagram */}
        <image href={chromaticityImage} x={"7.3%"} y={"39.3%"} style={{filter: `brightness(${sliderBright}%)`}} width="53.4%" />

        {/* Dynamic creation of confusion lines */}
        {/* Protan */}
        {
          Array.from(
            { length: numConfusionLines },
            (_, i) => { 
              if (listColors === "protan")  {
                return(
                  <React.Fragment key={i + "pline"}>
                    {/* Confusion lines */}
                    <line key={i+"p"} 
                      style={{stroke:'red', strokeWidth:'2'}} 
                      id={i+"-line"}
                      x1={`${10 + (100 * protan.x1) * 0.8}%`} 
                      y1={`${10 + (100 - (100 * protan.y1)) * 0.8}%`} 
                      x2={`${10 + (100 * protan.xyStop) * 0.8}%`} 
                      y2={`${10 + (100 - (100 * calcConfusionLine(i,protan.yMin,protan.yMax))) * 0.8}%`} //0.14 and 0.67 values found manually through testing
                      /> 
                      {
                      Array.from(
                      { length: globalNumColors },
                        (_, j) => {
                          //Calculate confusion dot
                          const calcDot = calcConfusionDot(protan.x1, protan.y1, protan.yMin, protan.yMax, protan.xyStop, false, i,j, "p");
                          return(
                            // Confusion dots
                            <circle key={j+"dot-"+i+"t"} 
                            style={{stroke:'black', strokeWidth:'2'}} r={"2"} 
                            id={i+"-line-"+j+"-dot"}
                            data-coord-x={calcDot.x}
                            data-coord-y={calcDot.y}
                            cx={`${10 + (100 * calcDot.x) * 0.8}%`} 
                            cy={`${10 + (100 - (100 * calcDot.y)) * 0.8}%`} />    
                          ) 
                        }
                      )
                    }
                  </React.Fragment>
                )
              } return null;
            }
          )
        }

        {/* Deutan */}
        { 
          Array.from(
            { length: numConfusionLines },
            (_, i) => { 
              if (listColors === "deutan")  {
                return(
                  <React.Fragment key={i + "dline"}>
                    {/* Confusion lines */}
                    <line key={i+"d"} 
                      style={{stroke:'green', strokeWidth:'2'}} 
                      id={i+"-line"}
                      x1={`${10 + (100 * deutan.x1) * 0.8}%`} 
                      y1={`${10 + (100 - (100 * deutan.y1)) * 0.8}%`} 
                      x2={`${10 + (100 * deutan.xyStop) * 0.8}%`} 
                      y2={`${10 + (100 - (100 * calcConfusionLine(i,deutan.yMin,deutan.yMax))) * 0.8}%`} 
                      /> 
                      {
                      Array.from(
                        { length: globalNumColors },
                          (_, j) => {
                            //Calculate confusion dot
                            const calcDot = calcConfusionDot(deutan.x1, deutan.y1, deutan.yMin, deutan.yMax, deutan.xyStop, false, i,j, "d");
                            return(
                              // Confusion dots
                              <circle key={j+"dot-"+i+"t"} 
                              style={{stroke:'black', strokeWidth:'2'}} r={"2"} 
                              id={i+"-line-"+j+"-dot"}
                              data-coord-x={calcDot.x}
                              data-coord-y={calcDot.y}
                              cx={`${10 + (100 * calcDot.x) * 0.8}%`} 
                              cy={`${10 + (100 - (100 * calcDot.y)) * 0.8}%`} />    
                            ) 
                          }
                        )
                    }
                  </React.Fragment>
                )
              } return null;
            }
          )
        }

        {/* Tritan */}
        {
          Array.from(
            { length: numConfusionLines },
            (_, i) => { 
              if (listColors === "tritan")  {
                return(
                  <React.Fragment key={i + "tline"}>
                    {/* Confusion lines */}
                    <line key={i+"t"} 
                      style={{stroke:'blue', strokeWidth:'2'}} 
                      id={i+"-line"}
                      x1={`${10 + (100 * tritan.x1) * 0.8}%`} 
                      y1={`${10 + (100 - (100 * tritan.y1)) * 0.8}%`} 
                      x2={`${10 + (100 * calcConfusionLine(i,tritan.yMin,tritan.yMax)) * 0.8}%`}
                      y2={`${10 + (100 - (100 * tritan.xyStop)) * 0.8}%`} />
                    {
                    Array.from(
                      { length: globalNumColors },
                        (_, j) => {
                          //Calculate confusion dot
                          const calcDot = calcConfusionDot(tritan.x1, tritan.y1, tritan.yMin, tritan.yMax, tritan.xyStop, true, i,j, "t");
                          return(
                            // Confusion dots
                            <circle key={j+"dot-"+i+"t"} 
                            style={{stroke:'black', strokeWidth:'2'}} r={"2"} 
                            id={i+"-line-"+j+"-dot"}
                            data-coord-x={calcDot.x}
                            data-coord-y={calcDot.y}
                            cx={`${10 + (100 * calcDot.x) * 0.8}%`} 
                            cy={`${10 + (100 - (100 * calcDot.y)) * 0.8}%`} />    
                          ) 
                        }
                      )
                    }
                  </React.Fragment>
                )
              } return null;
            }
          )
        }
 

        {/* x-axis */}
        <text style={{fontSize: "19", textAnchor: "middle"}} x="50%" y="98%">x</text>
        <line style={{stroke:'black', strokeWidth:'2'}} x1="90%" y1="90%" x2="8%" y2="90%" />
        {/* y-axis */}
        <text style={{fontSize: "19", textAnchor: "middle"}} x="2%" y="55%">y</text>
        <line style={{stroke:'black', strokeWidth:'2'}} x1="10%" y1="10%" x2="10%" y2="92%" />
      

        {
          Array.from(
            { length: 10 },
            (_, i) => (
              //Dynamically create x coordinate lines
              <g key={`x-${i}`}>
                <line style={{stroke:'black', strokeWidth:'2'}} x1={10 + i*8 +"%"} y1="89%" x2={10 + i*8 +"%"} y2="91%" />
                <text style={{fontSize: "14", textAnchor: "middle"}} x={10 + i*8 +"%"} y="95%">0.{i}</text>
              </g>
            )
          )
        }

        {
          Array.from(
            { length: 10 },
            (_, i) => (
              //Dynamically create y coordinate lines
              <g key={`y-${i}`}>
                <line style={{stroke:'black', strokeWidth:'2'}} x1="9%" y1={18 + i*8 +"%"} x2="11%" y2={18 + i*8 +"%"} />
                <text style={{fontSize: "14", textAnchor: "middle"}} x="5%" y={91 - i*8 +"%"}>0.{i}</text>
              </g>
            )
          )
        }


        {/* Click for coordinates in grid */}
        {clickPosition && (
          <text style={{fontSize: "20", textAnchor: "middle", cursor: "default"}}
          x={`${10 + clickPosition.x * 0.8}%`}
          y={`${11.7 + clickPosition.y * 0.8}%`}
        >
          x
        </text>
        )}


        {/* White point D65 Wikipedia, find good paper instead  */}
        <circle style={{stroke:'grey', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * whitePoint1976.x) * 0.8}%`} cy={`${10 + (100 - (100 * whitePoint1976.y)) * 0.8}%`} />
       


        {/* Possibly inaccurate sRGB triangle, find good source */}
        <line style={{stroke:'black', strokeWidth:'2'}} x1={`${10 + (100 * sRGBTriangle1976.a.x) * 0.8}%`} y1={`${10 + (100 - (100 * sRGBTriangle1976.a.y)) * 0.8}%`} x2={`${10 + (100 * sRGBTriangle1976.b.x) * 0.8}%`} y2={`${10 + (100 - (100 * sRGBTriangle1976.b.y)) * 0.8}%`} />
        <line style={{stroke:'black', strokeWidth:'2'}} x1={`${10 + (100 * sRGBTriangle1976.b.x) * 0.8}%`} y1={`${10 + (100 - (100 * sRGBTriangle1976.b.y)) * 0.8}%`} x2={`${10 + (100 * sRGBTriangle1976.c.x) * 0.8}%`} y2={`${10 + (100 - (100 * sRGBTriangle1976.c.y)) * 0.8}%`} />
        <line style={{stroke:'black', strokeWidth:'2'}} x1={`${10 + (100 * sRGBTriangle1976.c.x) * 0.8}%`} y1={`${10 + (100 - (100 * sRGBTriangle1976.c.y)) * 0.8}%`} x2={`${10 + (100 * sRGBTriangle1976.a.x) * 0.8}%`} y2={`${10 + (100 - (100 * sRGBTriangle1976.a.y)) * 0.8}%`} />

      </svg>
    </div>
          {/* Color box for calibrating screen color */}
          <div ref={colorBox} style={{width: "300px", height:"300px", backgroundColor:"rgb("+calcSRGBClick()[0]+", "+ calcSRGBClick()[1] + ", " + calcSRGBClick()[2]+")"}}></div>
      <p style={{fontSize: "20", textAnchor: "middle", cursor: "default"}}
          x={`${10 + clickPosition.x * 0.8}%`}
          y={`${11.7 + clickPosition.y * 0.8}%`}
        >
          x: {(clickPosition.x / 100).toFixed(3)}, 
          y: {(1-(clickPosition.y / 100)).toFixed(3)}, 
          sRGB: {calcSRGBClick()[0]+", "+ calcSRGBClick()[1] + ", " + calcSRGBClick()[2]}
        </p>
    </div>

  );
}

export default Color;
