import React, { useRef, useEffect, useState, useCallback } from 'react';
import QR from 'qrcode';

function App() {
  const qrcanvas = useRef(null);
  const input = useRef(null);
  const [text, setText] = useState("Make QR");

  useEffect(()=>{
    if (qrcanvas !== null && qrcanvas.current !== null) {
      QR.toCanvas(qrcanvas.current, text);
    }
  },[text])

  const onButtonClicked = useCallback(()=>{
    if(input.current.value){
      setText(input.current.value);
    }
  },[]);

  return (
    <html>
      <body>
        <form onSubmit={(e) => { e.preventDefault(); onButtonClicked() }}>
          <input ref={input}></input>
          <button>Make</button>
        </form>
        <canvas ref={qrcanvas}></canvas>
      </body>
    </html>
  );
}

export default App;