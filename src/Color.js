import './Color.css';
import React, { useState, useRef } from 'react';

//xxY to sRGB code from matlab, converted to Javascript with ChatGPT. Some minor adjustments has been made to fit my code. 
//Calculate XYZ from xyY 
function xyy2xyz(x, y, Y) {
  console.log("x,y,Y", x, y, Y);
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

  // Apply transformation
  const sRGB = M.map(row =>
    row.reduce((sum, value, i) => sum + value * (XYZ[i] / 100), 0)
  );

  // Gamma correction and scaling
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
  console.log(xyz2srgb(XYZ));

  return xyz2srgb(XYZ);
}



function Color() {

  //Click coordinates
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [sliderBright, setSliderBright] = useState(100);

  //Update brightness slider
  const changeBrightness = (event) => {
    setSliderBright(event.target.value);
  }

  //Change later -
  function calcRGB(){
    return xyy2srgb((clickPosition.x / 100).toFixed(3), (1-(clickPosition.y / 100)).toFixed(3), sliderBright);
  }
  //Ref initialization
  const colorBox = useRef(null);

  //Click event
  const clickSVG = (event) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();

    // Calculate the actual position within the SVG
    const x = ((event.clientX - rect.left) / rect.width);
    const y = ((event.clientY - rect.top) / rect.height);

    // Limit click coordinates to be within the grid (10% to 90%)
    const gridX = Math.max(0, Math.min((x - 0.1) / 0.8, 1)) * 100;
    const gridY = Math.max(0, Math.min((y - 0.1) / 0.8, 1)) * 100;
    
    setClickPosition({ x: gridX, y: gridY });

  };
  return (
    <div class="container">
      <svg height="500" width="500" onClick={clickSVG}>
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
          y={`${10 + clickPosition.y * 0.8}%`}
        >
          X: {(clickPosition.x / 100).toFixed(3)}, 
          Y: {(1-(clickPosition.y / 100)).toFixed(3)}, 
          sRGB: {calcRGB()[0]+", "+ calcRGB()[1] + ", " + calcRGB()[2]}
        </text>
        )}


      </svg>
        <div ref={colorBox} style={{width: "150px", height: "150px", backgroundColor: "rgb("+ calcRGB()[0] +","+ calcRGB()[1] +","+ calcRGB()[2] +")"}}></div>
      <label>Brightness: 
        <input type="range" min="1" max="100" value={sliderBright} onChange={changeBrightness}></input>
        {sliderBright}
      </label>

    </div>
  );
}

export default Color;
