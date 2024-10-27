import './Color.css';


function Color() {
  return (
    <div>
      <svg height="500" width="500">
        {/* x-axis */}
        <text font-size="19" text-anchor="middle" x="50%" y="98%">x</text>
        <line x1="90%" y1="90%" x2="8%" y2="90%" style={{stroke:'black', strokeWidth:'2'}} />
        {/* y-axis */}
        <text font-size="19" text-anchor="middle" x="2%" y="55%">y</text>
        <line x1="10%" y1="10%" x2="10%" y2="92%" style={{stroke:'black', strokeWidth:'2'}} />
      

        {
          Array.from(
            { length: 10 },
            (_, i) => (
              //Dynamically create x coordinate lines
              <g>
                <line x1={10 + i*8 +"%"} y1="89%" x2={10 + i*8 +"%"} y2="91%" style={{stroke:'black', strokeWidth:'2'}}/>
                <text font-size="14" text-anchor="middle" x={10 + i*8 +"%"} y="95%">0.{i}</text>
              </g>
            )
          )
        }

        {
          Array.from(
            { length: 10 },
            (_, i) => (
              //Dynamically create y coordinate lines
              <g>
                <line x1="9%" y1={18 + i*8 +"%"} x2="11%" y2={18 + i*8 +"%"} style={{stroke:'black', strokeWidth:'2'}}/>
                <text font-size="14" text-anchor="middle" x="5%" y={91 - i*8 +"%"}>0.{i}</text>
              </g>
            )
          )
        }


      </svg>


    </div>
  );
}

export default Color;
