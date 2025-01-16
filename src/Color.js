import './Color.css';
import React, { useState, useRef, useEffect } from 'react';
import chromaticityImage from "./chrom_imp.png";

//xxY to sRGB code from matlab code, converted to Javascript with https://www.codeconvert.ai/matlab-to-javascript-converter. Some minor adjustments has been made to fit my code. 
//Calculate XYZ from xyY 
function xyy2xyz(x, y, Y) {
  const X = (x * Y) / y;
  const Z = (Y * (1.0 - x - y)) / y;
  return [X, Y, Z];
}

//Calculate sRGB values from XYZ, AI translated from Matlab
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

  //Gamma correction and scaling
  const gammaCorrect = (value) =>
    value <= 0.00304
      ? value * 12.92
      : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;

  const [sR, sG, sB] = sRGB.map((value) =>
    Math.max(0, Math.min(255, gammaCorrect(value) * 255))
  );

  return [Math.round(sR), Math.round(sG), Math.round(sB)];
}

//Combined function to convert xyY to sRGB
function xyy2srgb(x, y, Y) {
  const XYZ = xyy2xyz(x, y, Y);
  return xyz2srgb(XYZ);
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
  const [sliderBright, setSliderBright] = useState(currentBrightness);
  let [listColors,setListColors] = useState(currentColorType);


  //Coordinates for white point D65
  let whitePoint = {x: 0.31272, y: 0.32903};

  //Coordinates for creating sRGB triangle
  let sRGBTriangle = {a: {x: 0.64, y: 0.33}, b: {x: 0.30, y: 0.60}, c: {x: 0.15, y: 0.06}}


  //Confusion line values 
  //x1 and y1 from color science papers as the copunctual point where the confusion lines start, 
  //x2 and y2 are points to actually create a line from the confusion line point, manually found and tested to stay within borders
  //stat are the x or y coordinates the lines will stop at, they remain static
  const protan = {x1: 0.7455, y1: 0.2565, x2: 0.14, y2: 0.67, stat:0.1}; 
  const deutan = {x1: 1.4, y1: -0.4, x2: 0.3, y2: 0.74, stat:0.1}; 
  const tritan = {x1: 0.17045, y1: 0, x2: 0.35, y2: 0.95, stat:0.7};


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
  function calcSRGB(x,y){
    y = 100-y; //Inverted y-axis in web
    return xyy2srgb((x / 100), (1-(y / 100)), sliderBright);
  }

  //Convert an array of RGB to a hex value
  function srgbToHex([r, g, b]) {
    const toHex = (value) => value.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // //SRGB functino based on cursor click, old implementation for early testing
  function calcSRGBClick(){
    return xyy2srgb((clickPosition.x / 100), (1-(clickPosition.y / 100)), sliderBright);
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
    // srgbValue(xyy2srgb((gridX / 100).toFixed(3), (1-(gridY / 100)).toFixed(3), sliderBright)); 
    srgbValue(listConfusionColors.current);

  };


  function isPointInTriangle(x, y) {
    // Helper function to calculate area of a triangle
    function triangleArea(x1, y1, x2, y2, x3, y3) {
      return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
    }
  
    // Total area of the triangle
    const totalArea = triangleArea(sRGBTriangle.a.x, sRGBTriangle.a.y, 
                                   sRGBTriangle.b.x, sRGBTriangle.b.y, 
                                   sRGBTriangle.c.x, sRGBTriangle.c.y);
  
    //Calculate sub-triangle areas
    const area1 = triangleArea(x, y, sRGBTriangle.b.x, sRGBTriangle.b.y, sRGBTriangle.c.x, sRGBTriangle.c.y);
    const area2 = triangleArea(sRGBTriangle.a.x, sRGBTriangle.a.y, x, y, sRGBTriangle.c.x, sRGBTriangle.c.y);
    const area3 = triangleArea(sRGBTriangle.a.x, sRGBTriangle.a.y, sRGBTriangle.b.x, sRGBTriangle.b.y, x, y);
  
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
  function interpolate(x1, y1, x2, y2, t, i, j, radius, noise) {

    //Interpolate functions
    let dot = mathInter(x1, y1, x2, y2, t, j);

    //If out of boundary, use recursion until it is
    while(!isPointInTriangle(dot.x,dot.y)|| t > 1){
      t += 0.02;
      dot = mathInter(x1,y1,x2,y2,t, j);
    }
  
    //Check if current dot is too close to another dot or too close to the whitepoint
    for(let a = 0; a < j; a++){
      while(Math.sqrt((dot.x - listConfusionDots.current[i][a][0].x) ** 2 + (dot.y - listConfusionDots.current[i][a][0].y) ** 2) <= radius 
        || Math.sqrt((dot.x - whitePoint.x) ** 2 + (dot.y - whitePoint.y) ** 2) <= 0.05 || t > 1){
        t += 0.003;
        dot = mathInter(x1,y1,x2,y2,t, j);
      }
    }
    

    //Random angle in any direction
    // const angle = Math.random() * 2 * Math.PI; 

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

    addConfusionDots(dot, i, j);
  
    return dot;
  }


  //Calculate the dots and colors on the dots on a confusion line
  function calcConfusionDot(x1, y1, x2, y2, stat, xCoor, i,j){

    //Calculate the dots based on their respective confusion lines and interpolate
    let dot;
    let tValue = 0.1; //Math.random();
    if(xCoor){ //Checks if x2,y2 coordinates need to be swapped depending on the confusion line, tritan differs from deutan and protan
      dot = interpolate(x1,y1,calcConfusionLine(i,x2,y2),stat,tValue, i, j, colRadius, noiseLevel);
    } else {
      dot = interpolate(x1,y1,stat,calcConfusionLine(i,x2,y2),tValue, i, j, colRadius, noiseLevel);
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
    if(currentRadio > 0){
      document.getElementById("mm"+(currentRadio)).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }

  }, [currentColorType, currentRadio]);

//Prevent DOM from lagging one state behind by forcing an update with a dummy decoy
  useEffect(() => {
    setDecoyState(true);
  }, [listColors]);

  return (
    <div>
      <div style={{float:"right"}}>
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
                          listConfusionColors.current.push(srgbToHex(calcSRGB(document.getElementById(`${j-1}-line-${m}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${j-1}-line-${m}-dot`).getAttribute("data-coord-y")*100)));
                          //mix colors TODO
                          // listConfusionColors.current.push(srgbToHex(calcSRGB(document.getElementById(`${Math.floor(Math.random() * numConfusionLines)}-line-${m}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${Math.floor(Math.random() * numConfusionLines)}-line-${m}-dot`).getAttribute("data-coord-y")*100)));
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
                        ? srgbToHex(calcSRGB(document.getElementById(`${j-1}-line-${i-1}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${j-1}-line-${i-1}-dot`).getAttribute("data-coord-y")*100)) 
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
        <input type="range" min="0" max="100" value={sliderBright} onMouseUp={() => {
          if(listConfusionCoords.current === null){
            return;
          }
          listConfusionColors.current = [];
          for (let m = 0; m < globalNumColors; m++){
              listConfusionColors.current.push(srgbToHex(calcSRGB(document.getElementById(`${listConfusionCoords.current-1}-line-${m}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${listConfusionCoords.current-1}-line-${m}-dot`).getAttribute("data-coord-y")*100)));
            }
            srgbValue(listConfusionColors.current);}} 
          onChange={(e) => {
          changeBrightness(e); 
          }}></input>
        {sliderBright}
      </label>
      </div> 
      <div ref={colorBox} style={{width: "200px", height:"200px", backgroundColor:"rgb("+calcSRGBClick()[0]+", "+ calcSRGBClick()[1] + ", " + calcSRGBClick()[2]+")"}}></div>

    <div style={{height: "600px", width: "600px"}} >
      <svg style={{height:"75%", width: "75%"}} onClick={clickSVG}>

        {/* Chromaticity diagram */}
        <image href={chromaticityImage} x={"5%"} y={"7.5%"} style={{filter: `brightness(${sliderBright}%)`}} width="86.7%" />

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
                      x2={`${10 + (100 * protan.stat) * 0.8}%`} 
                      y2={`${10 + (100 - (100 * calcConfusionLine(i,protan.x2,protan.y2))) * 0.8}%`} //0.14 and 0.67 values found manually through testing
                      /> 
                      {
                      Array.from(
                      { length: globalNumColors },
                        (_, j) => {
                          //Calculate confusion dot
                          const calcDot = calcConfusionDot(protan.x1, protan.y1, protan.x2, protan.y2, protan.stat, false, i,j);
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
                      x2={`${10 + (100 * deutan.stat) * 0.8}%`} 
                      y2={`${10 + (100 - (100 * calcConfusionLine(i,deutan.x2,deutan.y2))) * 0.8}%`} 
                      /> 
                      {
                      Array.from(
                        { length: globalNumColors },
                          (_, j) => {
                            //Calculate confusion dot
                            const calcDot = calcConfusionDot(deutan.x1, deutan.y1, deutan.x2, deutan.y2, deutan.stat, false, i,j);
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
                      x2={`${10 + (100 * calcConfusionLine(i,tritan.x2,tritan.y2)) * 0.8}%`}
                      y2={`${10 + (100 - (100 * tritan.stat)) * 0.8}%`} />
                    {
                    Array.from(
                      { length: globalNumColors },
                        (_, j) => {
                          //Calculate confusion dot
                          const calcDot = calcConfusionDot(tritan.x1, tritan.y1, tritan.x2, tritan.y2, tritan.stat, true, i,j);
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
          x: {(clickPosition.x / 100).toFixed(3)}, 
          y: {(1-(clickPosition.y / 100)).toFixed(3)}, 
          sRGB: {calcSRGBClick()[0]+", "+ calcSRGBClick()[1] + ", " + calcSRGBClick()[2]}
        </text>
        )}


        {/* White point D65 Wikipedia, find good paper instead */}
        <circle style={{stroke:'grey', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * whitePoint.x) * 0.8}%`} cy={`${10 + (100 - (100 * whitePoint.y)) * 0.8}%`} />


        {/* Possibly inaccurate sRGB triangle, find good source */}
        <line style={{stroke:'black', strokeWidth:'2'}} x1={`${10 + (100 * sRGBTriangle.a.x) * 0.8}%`} y1={`${10 + (100 - (100 * sRGBTriangle.a.y)) * 0.8}%`} x2={`${10 + (100 * sRGBTriangle.b.x) * 0.8}%`} y2={`${10 + (100 - (100 * sRGBTriangle.b.y)) * 0.8}%`} />
        <line style={{stroke:'black', strokeWidth:'2'}} x1={`${10 + (100 * sRGBTriangle.b.x) * 0.8}%`} y1={`${10 + (100 - (100 * sRGBTriangle.b.y)) * 0.8}%`} x2={`${10 + (100 * sRGBTriangle.c.x) * 0.8}%`} y2={`${10 + (100 - (100 * sRGBTriangle.c.y)) * 0.8}%`} />
        <line style={{stroke:'black', strokeWidth:'2'}} x1={`${10 + (100 * sRGBTriangle.c.x) * 0.8}%`} y1={`${10 + (100 - (100 * sRGBTriangle.c.y)) * 0.8}%`} x2={`${10 + (100 * sRGBTriangle.a.x) * 0.8}%`} y2={`${10 + (100 - (100 * sRGBTriangle.a.y)) * 0.8}%`} />

      </svg>
    </div>
    </div>

  );
}

export default Color;
