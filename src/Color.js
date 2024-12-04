import './Color.css';
import React, { useState, useRef, useEffect } from 'react';

//xxY to sRGB code from matlab, converted to Javascript with ChatGPT. Some minor adjustments has been made to fit my code. 
//Calculate XYZ from xyY 
function xyy2xyz(x, y, Y) {
  const X = (x * Y) / y;
  const Z = (Y * (1.0 - x - y)) / y;
  return [X, Y, Z];
}

//Calculate sRGB values from XYZ
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


function Color({ srgbValue }) {

  //Click coordinates
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [sliderBright, setSliderBright] = useState(100);

  //Update brightness slider
  const changeBrightness = (event) => {
    setSliderBright(event.target.value);
  }

  //SRGB functino based on cursor click, old implementation for early testing
  function calcSRGBClick(){
    return xyy2srgb((clickPosition.x / 100).toFixed(3), (1-(clickPosition.y / 100)).toFixed(3), sliderBright);
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
    srgbValue(xyy2srgb((gridX / 100).toFixed(3), (1-(gridY / 100)).toFixed(3), sliderBright)); 

  };


  //Global confusion line values 
  //x1 and y1 from color science papers as the point where the confusion lines start
  //x2 and y2 are points to actually create a line from the confusion line point, manually found and tested
  //stat are the x or y coordinates the lines will stop at, they remain static
  const protan = {x1: 0.7455, y1: 0.2565, x2: 0.14, y2: 0.67, stat:0.1}; 
  const deutan = {x1: 1.4, y1: -0.4, x2: 0.3, y2: 0.74, stat:0.1}; 
  const tritan = {x1: 0.17045, y1: 0, x2: 0.35, y2: 0.95, stat:0.7};




  //Interpolate and find a point t on line from x1,y1 to x2,y2 
  function interpolate(x1, y1, x2, y2, t) {

    //Add interpolation to sRGB triangle to ensure it is within boundaries
    //TBD

    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);
    return {x: x,y: y };
  }

  let [listColors,setListColors] = useState("prot");

  //Number of generated confusion lines
  let numConfusionLines = 5;
  //Temporary store lines and wait for refresh button generate new ones
  let [generateNewCF, setGenerateNewCF] = useState(true);
  // let dList = [];
  // let tList = [];

  //Calculate an even random split of confusion lines generated
  function calcConfusionLine(i, min, max){
    //Find the section for each line to place itself in
    let split = (max-min)/numConfusionLines;

    //Calculate a random number in the interval between the new min and max
    let newMin = split*i + min;
    let newMax = split*(i+1) + min;
    let retNum = Math.random() * (newMax - newMin) + newMin;

    //Add to array for storage if refresh button has been pressed
    if (generateNewCF){
      cfList[i] = retNum;

      if(i === (numConfusionLines - 1)){
        setGenerateNewCF(false);
      }

    }    

    return cfList[i];
  }



  //Calculate the dots and colors on the dots on a confusion line
  function calcConfusionDot(x1, y1, x2, y2, stat, xCoor, i,j){

    //Calculate the dots based on their respective confusion lines and interpolate
    //TODO random interpolation inside triangle, CURRENTLY STATIC
    let dot;
    if(xCoor){ //Checks if x2 and y2 coordinates need to be swapped depending on the confusion line, tritan differs from deutan and protan
      dot = interpolate(x1,y1,calcConfusionLine(i,x2,y2),stat,(0.3+j/10));
    } else {
      dot = interpolate(x1,y1,stat,calcConfusionLine(i,x2,y2),(0.3+j/10));
    }

    // let color = calcSRGB(100*dot.x,100-100*dot.y);

    return {x: dot.x, y: dot.y};
  }

  //TODO: REMOVE and CHANGE to parent value
  const tempColorAmount = 4;

  //Force re-render to ensure table is updated (if no re-render happens, it stays 1 DOM state "behind")
  useEffect(() => {
    setGenerateNewCF(true);
  }, [listColors]);

  return (
    <div>
      <div>
        <h3>Type of color confusion lines:</h3>

        {/* Dropdown list with color types */}
        <select value={listColors} onChange={(e) => {
          setListColors(e.target.value); 
          setGenerateNewCF(true); 
        }}>
          <option value="prot">Protanopia</option>
          <option value="deut">Deuteranopia</option>
          <option value="trit">Tritanopia</option>
        </select>

      <table>
        <tbody>

        {
          Array.from(
            { length: tempColorAmount+1 },
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
                      <th key={j + "dot"}><label>Line {j}<br/><input type="radio" name="colorLine"></input></label></th>
                    ) : j === 0 ? (
                      <th key={j + "dot"}>Color {i}</th>
                    ) : (
                      // <th key={j + "dot"} style={{backgroundColor: document.getElementById("0-dot") ? document.getElementById("0-dot").style.stroke : "grey" }}></th>
                      //If-check to make sure the element is loaded in. Calculate color and set cell to be the color of the correspoding confusion dot
                      <th key={j + "dot"} style={{backgroundColor: document.getElementById(`${j-1}-line-${i-1}-dot`) ? srgbToHex(calcSRGB(document.getElementById(`${j-1}-line-${i-1}-dot`).getAttribute("data-coord-x")*100,document.getElementById(`${j-1}-line-${i-1}-dot`).getAttribute("data-coord-y")*100)) : "grey" }}></th>
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
    <div style={{height: "400px", width: "400px"}}>
      <svg style={{height:"75%", width: "75%"}} onClick={clickSVG}>


        {/* Dynamic creation of confusion lines */}
        {/* Protan */}
        {
          Array.from(
            { length: numConfusionLines },
            (_, i) => listColors === "prot" ? (
              <React.Fragment key={i + "pline"}>
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
                  //Length NUMBER HAS TO BE RETRIEVED FORM GLOBAL COLORS PARENT
                  { length: tempColorAmount },
                    (_, j) => {
                      const calcDot = calcConfusionDot(protan.x1, protan.y1, protan.x2, protan.y2, protan.stat, false, i,j);
                      return(
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
                    //Length NUMBER HAS TO BE RETRIEVED FORM GLOBAL COLORS PARENT
                    { length: tempColorAmount },
                      (_, j) => {
                        const calcDot = calcConfusionDot(deutan.x1, deutan.y1, deutan.x2, deutan.y2, deutan.stat, false, i,j);
                        return(
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
                <line key={i+"t"} 
                  style={{stroke:'blue', strokeWidth:'2'}} 
                  id={i+"-line"}
                  x1={`${10 + (100 * tritan.x1) * 0.8}%`} 
                  y1={`${10 + (100 - (100 * tritan.y1)) * 0.8}%`} 
                  x2={`${10 + (100 * calcConfusionLine(i,tritan.x2,tritan.y2)) * 0.8}%`}
                  y2={`${10 + (100 - (100 * tritan.stat)) * 0.8}%`} />
                {
                Array.from(
                  //Length NUMBER HAS TO BE RETRIEVED FORM GLOBAL COLORS PARENT
                  { length: tempColorAmount },
                    (_, j) => {
                      const calcDot = calcConfusionDot(tritan.x1, tritan.y1, tritan.x2, tritan.y2, tritan.stat, true, i,j);
                      return(
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



        {/* Confusion lines */}
        {/* <line style={{stroke:'red', strokeWidth:'2'}} x1={`${10 + (100 * protan.x1) * 0.8}%`} y1={`${10 + (100 - (100 * protan.y1)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.55)) * 0.8}%`} /> */}

        {/* Points interpolated on confusion line */}
        {/* <circle style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * interpolate(protan.x1,protan.y1,0.1,0.55,0.5).x) * 0.8}%`} cy={`${10 + (100 - (100 * interpolate(protan.x1,protan.y1,0.1,0.55,0.5).y)) * 0.8}%`} />
        <circle style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * interpolate(protan.x1,protan.y1,0.1,0.55,0.6).x) * 0.8}%`} cy={`${10 + (100 - (100 * interpolate(protan.x1,protan.y1,0.1,0.55,0.6).y)) * 0.8}%`} />
        <circle style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * interpolate(protan.x1,protan.y1,0.1,0.55,0.7).x) * 0.8}%`} cy={`${10 + (100 - (100 * interpolate(protan.x1,protan.y1,0.1,0.55,0.7).y)) * 0.8}%`} /> */}


        {/* Values for edges for each coordinate. Randome values between these are the way to go for t value */}
        {/* Prot: 0.1x,  0.67y   -   0.1x,  0.14y */}
        {/* Deut: 0.1x,  0.3y    -   0.1x,  0.74y */}
        {/* Trit: 0.35x, 0.7y    -   0.95x, 0.7y */}


        {/* <circle style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * interpolate(protan.x1,protan.y1,0.1,0.55,0.7).x) * 0.8}%`} cy={`${10 + (100 - (100 * interpolate(protan.x1,protan.y1,0.1,0.55,0.7).y)) * 0.8}%`} /> */}

        


        {/* <line style={{stroke:'green', strokeWidth:'2'}} x1={`${10 + (100 * deutan.x1) * 0.8}%`} y1={`${10 + (100 - (100 * deutan.y1)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.6)) * 0.8}%`} />
        <line style={{stroke:'green', strokeWidth:'2'}} x1={`${10 + (100 * deutan.x1) * 0.8}%`} y1={`${10 + (100 - (100 * deutan.y1)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.3)) * 0.8}%`} />
        <line style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * tritan.x1) * 0.8}%`} y1={`${10 + (100 - (100 * tritan.y1)) * 0.8}%`} x2={`${10 + (100 * 0.35) * 0.8}%`} y2={`${10 + (100 - (100 * 0.7)) * 0.8}%`} />
        <line style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * tritan.x1) * 0.8}%`} y1={`${10 + (100 - (100 * tritan.y1)) * 0.8}%`} x2={`${10 + (100 * 0.5) * 0.8}%`} y2={`${10 + (100 - (100 * 0.8)) * 0.8}%`} />
        <line style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * tritan.x1) * 0.8}%`} y1={`${10 + (100 - (100 * tritan.y1)) * 0.8}%`} x2={`${10 + (100 * 0.6) * 0.8}%`} y2={`${10 + (100 - (100 * 0.7)) * 0.8}%`} /> */}

        {/* Use interpolation to find line between */}





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
          X: {(clickPosition.x / 100).toFixed(3)}, 
          Y: {(1-(clickPosition.y / 100)).toFixed(3)}, 
          sRGB: {calcSRGBClick()[0]+", "+ calcSRGBClick()[1] + ", " + calcSRGBClick()[2]}
          x
        </text>
        )}


        {/* White point D65 Wikipedia, find good paper instead */}
        <circle style={{stroke:'grey', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * 0.31272) * 0.8}%`} cy={`${10 + (100 - (100 * 0.32903)) * 0.8}%`} />


        {/* Possibly inaccurate sRGB triangle, find good source */}
        <line style={{stroke:'black', strokeWidth:'2'}} x1={`${10 + (100 * 0.64) * 0.8}%`} y1={`${10 + (100 - (100 * 0.33)) * 0.8}%`} x2={`${10 + (100 * 0.3) * 0.8}%`} y2={`${10 + (100 - (100 * 0.6)) * 0.8}%`} />
        <line style={{stroke:'black', strokeWidth:'2'}} x1={`${10 + (100 * 0.30) * 0.8}%`} y1={`${10 + (100 - (100 * 0.60)) * 0.8}%`} x2={`${10 + (100 * 0.15) * 0.8}%`} y2={`${10 + (100 - (100 * 0.06)) * 0.8}%`} />
        <line style={{stroke:'black', strokeWidth:'2'}} x1={`${10 + (100 * 0.15) * 0.8}%`} y1={`${10 + (100 - (100 * 0.06)) * 0.8}%`} x2={`${10 + (100 * 0.64) * 0.8}%`} y2={`${10 + (100 - (100 * 0.33)) * 0.8}%`} />

      </svg>

      <div ref={colorBox} style={{width: "25%", height: "80%", float:"left", backgroundColor: "rgb("+ calcSRGBClick()[0] +","+ calcSRGBClick()[1] +","+ calcSRGBClick()[2] +")"}}></div>
      <label>Brightness: 
        <input type="range" min="0" max="100" value={sliderBright} onChange={changeBrightness}></input>
        {sliderBright}
      </label>

      

    </div>
    </div>

  );
}

export default Color;
