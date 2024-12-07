import './Color.css';
import React, { useState, useRef, useEffect } from 'react';
import chromaticityImage from "./chrom_imp.png";

//xxY to sRGB code from matlab, converted to Javascript with ChatGPT. Some minor adjustments has been made to fit my code. 
//Calculate XYZ from xyY 
function xyy2xyz(x, y, Y) {
  const X = (x * Y) / y;
  const Z = (Y * (1.0 - x - y)) / y;
  return [X, Y, Z];
}

//Calculate sRGB values from XYZ, AI translated from Matlab
function xyz2srgb(XYZ) {
  const M = [
    [3.2410, -1.5374, -0.4986],
    [-0.9692, 1.8760, 0.0416],
    [0.0556, -0.2040, 1.0570],
  ];

  //Apply transformation
  //AI translated from Matlab
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


function Color({ srgbValue, globalNumColors, numConfusionLines}) {

  //Click coordinates
  // const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [sliderBright, setSliderBright] = useState(100);

  //Coordinates for white point D65
  // let whitePoint = {x: 0.31272, y: 0.32903};

  //Coordinates for creating sRGB triangle
  let sRGBTriangle = {a: {x: 0.64, y: 0.33}, b: {x: 0.30, y: 0.60}, c: {x: 0.15, y: 0.06}}


  //Confusion line values 
  //x1 and y1 from color science papers as the copunctual point where the confusion lines start, 
  //x2 and y2 are points to actually create a line from the confusion line point, manually found and tested to stay within borders
  //stat are the x or y coordinates the lines will stop at, they remain static
  const protan = {x1: 0.7455, y1: 0.2565, x2: 0.14, y2: 0.67, stat:0.1}; 
  const deutan = {x1: 1.4, y1: -0.4, x2: 0.3, y2: 0.74, stat:0.1}; 
  const tritan = {x1: 0.17045, y1: 0, x2: 0.35, y2: 0.95, stat:0.7};


  //Controls which confusion lines to show
  let [listColors,setListColors] = useState("prot");

  //Temporary store lines and wait for refresh button generate new ones
  let [generateNewCF, setGenerateNewCF] = useState(true);
  //Decoy state, it exists to help update the DOM as the table colors lags behind on state without it
  let [decoyState, setDecoyState] = useState(true);



  //Update brightness slider
  const changeBrightness = (event) => {
    setSliderBright(event.target.value);
  }

  //Calculate sRGB values from x,y coordinates and slider brightness
  function calcSRGB(x,y){
    y = 100-y; //Inverted y-axis in web
    return xyy2srgb((x / 100).toFixed(3), (1-(y / 100)).toFixed(3), sliderBright);
  }

  //Convert an array of RGB to a hex value
  function srgbToHex([r, g, b]) {
    const toHex = (value) => value.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // //SRGB functino based on cursor click, old implementation for early testing
  // function calcSRGBClick(){
  //   return xyy2srgb((clickPosition.x / 100).toFixed(3), (1-(clickPosition.y / 100)).toFixed(3), sliderBright);
  // }

  //Ref initialization
  // const colorBox = useRef(null);

  //Click event
  // const clickSVG = (event) => {
  //   const svg = event.currentTarget;
  //   const rect = svg.getBoundingClientRect();

  //   //Calculate the actual position within the SVG
  //   const x = ((event.clientX - rect.left) / rect.width);
  //   const y = ((event.clientY - rect.top) / rect.height);

  //   //Limit click coordinates to be within the grid (10% to 90%)
  //   const gridX = Math.max(0, Math.min((x - 0.1) / 0.8, 1)) * 100;
  //   const gridY = Math.max(0, Math.min((y - 0.1) / 0.8, 1)) * 100;
    
  //   setClickPosition({ x: gridX, y: gridY });
    
  //   //Pass sRGB values to parent manually, due to delayed useState update
  //   // srgbValue(xyy2srgb((gridX / 100).toFixed(3), (1-(gridY / 100)).toFixed(3), sliderBright)); 
  //   srgbValue(listConfusionColors.current);

  // };


  function isPointInTriangle(x, y) {
    // Helper function to calculate area of a triangle
    function triangleArea(x1, y1, x2, y2, x3, y3) {
      return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
    }
  
    // Total area of the triangle
    const totalArea = triangleArea(sRGBTriangle.a.x, sRGBTriangle.a.y, 
                                   sRGBTriangle.b.x, sRGBTriangle.b.y, 
                                   sRGBTriangle.c.x, sRGBTriangle.c.y);
  
    //Triangles with x and y, which should all add up to 'triangleArea' if x and y are within the original
    const area1 = triangleArea(x, y, sRGBTriangle.b.x, sRGBTriangle.b.y, sRGBTriangle.c.x, sRGBTriangle.c.y);
    const area2 = triangleArea(sRGBTriangle.a.x, sRGBTriangle.a.y, x, y, sRGBTriangle.c.x, sRGBTriangle.c.y);
    const area3 = triangleArea(sRGBTriangle.a.x, sRGBTriangle.a.y, sRGBTriangle.b.x, sRGBTriangle.b.y, x, y);
  
    // Check if the sum of the sub-triangle areas equals the total area
    return Math.abs(totalArea - (area1 + area2 + area3)) < 1e-9; // Allow for floating-point precision errors
  }

  //Calculate an even random split of confusion lines generated
  function calcConfusionLine(i, min, max){
    //Find the section for each line to place itself in
    let split = (max-min)/numConfusionLines;

    //Calculate a random number in the interval between the new min and max
    let newMin = split*i + min;
    let newMax = split*(i+1) + min;
    let retNum = Math.random() * (newMax - newMin) + newMin;

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

  //Interpolate and find a point t on line from x1,y1 to x2,y2 
  function interpolate(x1, y1, x2, y2, t) {
    //Add interpolation to sRGB triangle to ensure it is within boundaries
    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);

    let reCalc = {x,y};
    
    //If border is hit, loop back around 
    if(t>1){
      t = 0;
    }

    //If out of boundary, use recursion until it is
    if(!isPointInTriangle(x,y)){
      reCalc = interpolate(x1, y1, x2, y2, t+0.2);
    }
    
    return reCalc;
  }


  //Calculate the dots and colors on the dots on a confusion line
  function calcConfusionDot(x1, y1, x2, y2, stat, xCoor, i,j){

    //Calculate the dots based on their respective confusion lines and interpolate
    //TODO random interpolation inside triangle, CURRENTLY STATIC
    let dot;
    if(xCoor){ //Checks if x2 and y2 coordinates need to be swapped depending on the confusion line, tritan differs from deutan and protan
      dot = interpolate(x1,y1,calcConfusionLine(i,x2,y2),stat,(j/10));
    } else {
      dot = interpolate(x1,y1,stat,calcConfusionLine(i,x2,y2),(j/10));
    }

    // let color = calcSRGB(100*dot.x,100-100*dot.y);

    return {x: dot.x, y: dot.y};
  }

  //List of colors for a selected confusion line
  let listConfusionColors = useRef([]);
  //Coordinates for current confusion line for brightness slider to use for updating
  let listConfusionCoords = useRef(null);

//Prevent DOM from lagging one state behind by forcing an update with a dummy decoy
  useEffect(() => {
    setDecoyState(true);
  }, [listColors]);

  return (
    <div>
      <div>
        <h3>Type of color confusion lines:</h3>
        {/* Does not maintain updated state after button click */}
        {/* <button value={listColors} onClick={() => {setGenerateNewCF(true); setDecoyState(true);}}>Generate new lines</button> <br/> */}
        {/* <button onClick={() => setListColors}>Generate new lines</button> <br/> */}
        {/* <button onClick={() => console.log(listConfusionColors.current)}>Gen cols</button> <br/> */}

        {/* Dropdown list with color types */}
        <select id="colorSelect" value={listColors} onChange={(e) => {
          setListColors(e.target.value); 
          setGenerateNewCF(true); 
          setDecoyState(true);
          //Reset radio buttons in table and reset list
          listConfusionColors.current = [];
          for(let i = 0; i < numConfusionLines; i++){
            document.getElementById("mm"+(i+1)).checked = "";
          }
        }}>
          <option value="prot">Protanopia</option>
          <option value="deut">Deuteranopia</option>
          <option value="trit">Tritanopia</option>
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
                  //Length NUMBER HAS TO BE RETRIEVED FORM GLOBAL COLORS PARENT
                  { length: numConfusionLines+1 },
                    (_, j) => i === 0 && j === 0 ? (
                      <th key={j + "dot"}></th>
                    ) : i === 0 ? (
                      <th key={j + "dot"} id={"radioLine-"+j} onChange={() => {
                        //Reset other confusion lines
                          listConfusionColors.current = [];
                          listConfusionCoords.current = 0;
                          for (let n = 0; n < numConfusionLines; n++){
                            document.getElementById(`${n}-line`).style.strokeWidth = 2;
                          }
                          //Get color of each point in this confusion line
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
      </div> 
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
    <div style={{height: "400px", width: "400px"}}>
      <svg style={{height:"75%", width: "75%"}}>

        {/* Chromaticity diagram */}
        <image href={chromaticityImage} x={"5%"} y={"7.5%"} style={{filter: `brightness(${sliderBright}%)`}} width="86.7%" />

        {/* Dynamic creation of confusion lines */}
        {/* Protan */}
        {
          Array.from(
            { length: numConfusionLines },
            (_, i) => listColors === "prot" ? (
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
            ) : null
          )
        }

        {/* Deutan */}
        { 
          Array.from(
            { length: numConfusionLines },
            (_, i) => listColors === "deut" ? (
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
            ) : null
          )
        }

        {/* Tritan */}
        {
          Array.from(
            { length: numConfusionLines },
            (_, i) => listColors === "trit" ? (
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
            ) : null
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
        {/* {clickPosition && (
          <text style={{fontSize: "20", textAnchor: "middle", cursor: "default"}}
          x={`${10 + clickPosition.x * 0.8}%`}
          y={`${11.7 + clickPosition.y * 0.8}%`}
        >
          X: {(clickPosition.x / 100).toFixed(3)}, 
          Y: {(1-(clickPosition.y / 100)).toFixed(3)}, 
          sRGB: {calcSRGBClick()[0]+", "+ calcSRGBClick()[1] + ", " + calcSRGBClick()[2]}
          x
        </text>
        )} */}


        {/* White point D65 Wikipedia, find good paper instead */}
        {/* <circle style={{stroke:'grey', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * whitePoint.x) * 0.8}%`} cy={`${10 + (100 - (100 * whitePoint.y)) * 0.8}%`} /> */}


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
