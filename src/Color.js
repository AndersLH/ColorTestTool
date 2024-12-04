import './Color.css';
import React, { useState, useRef } from 'react';

//xxY to sRGB code from matlab, converted to Javascript with ChatGPT. Some minor adjustments has been made to fit my code. 
//Calculate XYZ from xyY 
function xyy2xyz(x, y, Y) {
  // console.log("x,y,Y", x, y, Y);
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
  // return Math.round(sR) + ", " + Math.round(sG) + ", " + Math.round(sB);

}

//Combined function to convert xyY to sRGB
function xyy2srgb(x, y, Y) {
  const XYZ = xyy2xyz(x, y, Y);
  // console.log(xyz2srgb(XYZ));

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

  //Change later -
  function calcSRGB(){
    return xyy2srgb((clickPosition.x / 100).toFixed(3), (1-(clickPosition.y / 100)).toFixed(3), sliderBright);
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
  const protan = {x: 0.7455, y: 0.2565};
  const deutan = {x: 1.4, y: -0.4};
  const tritan = {x: 0.17045, y: 0};


  //Interpolate and find a point t on line from x1,y1 to x2,y2 
  function interpolate(x1, y1, x2, y2, t) {

    //Add interpolation to sRGB triangle to ensure it is within boundaries
    //TBD

    const x = x1 + t * (x2 - x1);
    const y = y1 + t * (y2 - y1);
    return {x: x,y: y };
  }

  let [radioColors,setRadioColors] = useState("prot");

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

  return (
    <div>
      <div>
        <h3>Type of color confusion lines:</h3>
        <button onClick={() => setGenerateNewCF(true)}>Generate new lines</button> <br/>
        <label><input type="radio" name="colorType"  checked={radioColors === "prot"} onChange={() => {setRadioColors("prot"); setGenerateNewCF(true);}}/>Protanopia</label>
        <label><input type="radio" name="colorType"  checked={radioColors === "deut"} onChange={() => {setRadioColors("deut"); setGenerateNewCF(true);}}/>Deuteranopia</label>
        <label><input type="radio" name="colorType"  checked={radioColors === "trit"} onChange={() => {setRadioColors("trit"); setGenerateNewCF(true);}}/>Tritanopia</label>
      <table>
        <tbody>
        <tr>
          <th></th>
          <th><label>Line 1<br/><input type="radio" name="colorLine"></input></label></th>
          <th><label>Line 2<br/><input type="radio" name="colorLine"></input></label></th>
          <th><label>Line 3<br/><input type="radio" name="colorLine"></input></label></th>
          <th><label>Line 4<br/><input type="radio" name="colorLine"></input></label></th>
          <th><label>Line 5<br/><input type="radio" name="colorLine"></input></label></th>
        </tr>
        <tr>
          <th>Primary1</th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
        <tr>
          <th>Secondary1</th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
        <tr>
          <th>Background1</th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
        </tbody>
      </table>
      </div> 
    <div style={{height: "400px", width: "400px"}}>
      <svg style={{height:"75%", width: "75%"}} onClick={clickSVG}>


        {/* Dynamic creation of confusion lines */}
        {
          Array.from(
            { length: numConfusionLines },
            (_, i) => radioColors === "prot" ? (
              <line key={i+"p"} style={{stroke:'red', strokeWidth:'2'}} x1={`${10 + (100 * protan.x) * 0.8}%`} y1={`${10 + (100 - (100 * protan.y)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * calcConfusionLine(i,0.14,0.67))) * 0.8}%`} />
            ) : null
          )
        }

        { 
          Array.from(
            { length: numConfusionLines },
            (_, i) => radioColors === "deut" ? (
              <line key={i+"d"} style={{stroke:'green', strokeWidth:'2'}} x1={`${10 + (100 * deutan.x) * 0.8}%`} y1={`${10 + (100 - (100 * deutan.y)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * calcConfusionLine(i,0.3,0.74))) * 0.8}%`} />
            ) : null
          )
        }

        {
          Array.from(
            { length: numConfusionLines },
            (_, i) => radioColors === "trit" ? (
              <React.Fragment key={i + "line"}>
                <line key={i+"t"} style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * tritan.x) * 0.8}%`} y1={`${10 + (100 - (100 * tritan.y)) * 0.8}%`} x2={`${10 + (100 * calcConfusionLine(i,0.35,0.95)) * 0.8}%`} y2={`${10 + (100 - (100 * 0.7)) * 0.8}%`} />
                {
                  Array.from(
                    //Length NUMBER HAS TO BE RETRIEVED FORM GLOBAL COLORS PARENT
                    { length: 2 },
                    (_, j) => (
                      <circle key={j+"dot-"+i+"t"} style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * interpolate(protan.x,protan.y,0.1,0.55,0.7).x) * 0.8}%`} cy={`${10 + (100 - (100 * interpolate(protan.x,protan.y,0.1,0.55,0.7).y)) * 0.8}%`} />    
                    )
                  )
                }
              </React.Fragment>
            ) : null
          )
        }



        {/* Confusion lines */}
        {/* <line style={{stroke:'red', strokeWidth:'2'}} x1={`${10 + (100 * protan.x) * 0.8}%`} y1={`${10 + (100 - (100 * protan.y)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.55)) * 0.8}%`} /> */}

        {/* Points interpolated on confusion line */}
        {/* <circle style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * interpolate(protan.x,protan.y,0.1,0.55,0.5).x) * 0.8}%`} cy={`${10 + (100 - (100 * interpolate(protan.x,protan.y,0.1,0.55,0.5).y)) * 0.8}%`} />
        <circle style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * interpolate(protan.x,protan.y,0.1,0.55,0.6).x) * 0.8}%`} cy={`${10 + (100 - (100 * interpolate(protan.x,protan.y,0.1,0.55,0.6).y)) * 0.8}%`} />
        <circle style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * interpolate(protan.x,protan.y,0.1,0.55,0.7).x) * 0.8}%`} cy={`${10 + (100 - (100 * interpolate(protan.x,protan.y,0.1,0.55,0.7).y)) * 0.8}%`} /> */}


        {/* Values for edges for each coordinate. Randome values between these are the way to go for t value */}
        {/* Prot: 0.1x,  0.67y   -   0.1x,  0.14y */}
        {/* Deut: 0.1x,  0.3y    -   0.1x,  0.74y */}
        {/* Trit: 0.35x, 0.7y    -   0.95x, 0.7y */}


        {/* <circle style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * interpolate(protan.x,protan.y,0.1,0.55,0.7).x) * 0.8}%`} cy={`${10 + (100 - (100 * interpolate(protan.x,protan.y,0.1,0.55,0.7).y)) * 0.8}%`} /> */}

        


        {/* <line style={{stroke:'green', strokeWidth:'2'}} x1={`${10 + (100 * deutan.x) * 0.8}%`} y1={`${10 + (100 - (100 * deutan.y)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.6)) * 0.8}%`} />
        <line style={{stroke:'green', strokeWidth:'2'}} x1={`${10 + (100 * deutan.x) * 0.8}%`} y1={`${10 + (100 - (100 * deutan.y)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.3)) * 0.8}%`} />
        <line style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * tritan.x) * 0.8}%`} y1={`${10 + (100 - (100 * tritan.y)) * 0.8}%`} x2={`${10 + (100 * 0.35) * 0.8}%`} y2={`${10 + (100 - (100 * 0.7)) * 0.8}%`} />
        <line style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * tritan.x) * 0.8}%`} y1={`${10 + (100 - (100 * tritan.y)) * 0.8}%`} x2={`${10 + (100 * 0.5) * 0.8}%`} y2={`${10 + (100 - (100 * 0.8)) * 0.8}%`} />
        <line style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * tritan.x) * 0.8}%`} y1={`${10 + (100 - (100 * tritan.y)) * 0.8}%`} x2={`${10 + (100 * 0.6) * 0.8}%`} y2={`${10 + (100 - (100 * 0.7)) * 0.8}%`} /> */}

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
          {/* X: {(clickPosition.x / 100).toFixed(3)}, 
          Y: {(1-(clickPosition.y / 100)).toFixed(3)}, 
          sRGB: {calcSRGB()[0]+", "+ calcSRGB()[1] + ", " + calcSRGB()[2]} */}
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

      <div ref={colorBox} style={{width: "25%", height: "80%", float:"left", backgroundColor: "rgb("+ calcSRGB()[0] +","+ calcSRGB()[1] +","+ calcSRGB()[2] +")"}}></div>
      <label>Brightness: 
        <input type="range" min="0" max="100" value={sliderBright} onChange={changeBrightness}></input>
        {sliderBright}
      </label>

      

    </div>
    </div>

  );
}

export default Color;
