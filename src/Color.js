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
  return (
    <div style={{height: "400px", width: "400px"}}>
      <svg style={{height:"75%", width: "75%"}} onClick={clickSVG}>
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
          y={`${11.4 + clickPosition.y * 0.8}%`}
        >
          {/* X: {(clickPosition.x / 100).toFixed(3)}, 
          Y: {(1-(clickPosition.y / 100)).toFixed(3)}, 
          sRGB: {calcSRGB()[0]+", "+ calcSRGB()[1] + ", " + calcSRGB()[2]} */}
          x
        </text>
        )}

        {/* Confusion lines */}
        {/* <line style={{stroke:'red', strokeWidth:'2'}} x1={`${10 + (100 * 0.7455) * 0.8}%`} y1={`${10 + (100 - (100 * 0.2565)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.55)) * 0.8}%`} />
        <line style={{stroke:'red', strokeWidth:'2'}} x1={`${10 + (100 * 0.7455) * 0.8}%`} y1={`${10 + (100 - (100 * 0.2565)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.65)) * 0.8}%`} />
        <line style={{stroke:'green', strokeWidth:'2'}} x1={`${10 + (100 * 1.4) * 0.8}%`} y1={`${10 + (100 - (100 * -0.4)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.6)) * 0.8}%`} />
        <line style={{stroke:'green', strokeWidth:'2'}} x1={`${10 + (100 * 1.4) * 0.8}%`} y1={`${10 + (100 - (100 * -0.4)) * 0.8}%`} x2={`${10 + (100 * 0.1) * 0.8}%`} y2={`${10 + (100 - (100 * 0.5)) * 0.8}%`} />
        <line style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * 0.17045) * 0.8}%`} y1={`${10 + (100 - (100 * 0)) * 0.8}%`} x2={`${10 + (100 * 0.36) * 0.8}%`} y2={`${10 + (100 - (100 * 0.8)) * 0.8}%`} />
        <line style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * 0.17045) * 0.8}%`} y1={`${10 + (100 - (100 * 0)) * 0.8}%`} x2={`${10 + (100 * 0.5) * 0.8}%`} y2={`${10 + (100 - (100 * 0.8)) * 0.8}%`} />
        <line style={{stroke:'blue', strokeWidth:'2'}} x1={`${10 + (100 * 0.17045) * 0.8}%`} y1={`${10 + (100 - (100 * 0)) * 0.8}%`} x2={`${10 + (100 * 0.6) * 0.8}%`} y2={`${10 + (100 - (100 * 0.7)) * 0.8}%`} /> */}

        {/* Use interpolation to find line between */}

        {/* Protan: (0.7455, 0.2565)
            Deutan: (1.4, -0.4)
            Tritan: (0.17045, 0) */}

        {/* White point D65 Wikipedia, find good paper instead */}
        <circle style={{stroke:'black', strokeWidth:'2'}} r={"2"} cx={`${10 + (100 * 0.31272) * 0.8}%`} cy={`${10 + (100 - (100 * 0.32903)) * 0.8}%`} />


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
  );
}

export default Color;
