import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";
import styled from "styled-components";

function App() {
  const [document, setDocument] = useState(null);
  const inputFile = useRef(null);

  useEffect(() => {
    document != null && console.log(document);
  }, [document]);

  return (
    <div className="App">
      <input
        type="file"
        id="file"
        ref={inputFile}
        style={{ display: "none" }}
        onChange={() => {
          console.log("sending: " + inputFile.current.files[0].name);
          const formData = new FormData();
          formData.append("pdfFile", inputFile.current.files[0]);
          axios({
            url: `http://localhost:3001/upload`,
            method: "POST",
            data: formData,
            headers: {
              "Content-Type": "application/pdf",
            },
          })
            .then((response) => {
              setDocument(JSON.parse(response.data.parsedData));
            })
            .catch((error) => {
              console.log("error");
            });
        }}
      />
      <StyledButton onClick={() => inputFile.current.click()}>
        select file
      </StyledButton>

      {document != null && <PageToCanvas page={document[0]}></PageToCanvas>}

      {document != null &&
        document.map((page, index) => (
          <PageTextRaw key={index} page={page}></PageTextRaw>
        ))}
    </div>
  );
}

const StyledButton = styled.button`
  background-color: #555;
  border-radius: 4px;
  color: white;
  border: none;
  width: 6rem;
  padding: 1rem;
  &:hover {
    cursor: pointer;
    background-color: #666;
    transform: scale(1.02);
  }
`;

const StyledDiv = styled.div`
  padding: 1rem;
  font-size: 0.8rem;
  border: 1px solid black;
  width: 60%;
  color: white;
`;

const PageToCanvas = (props) => {
  const canvasref = useRef(null);
  const page = props.page.fullTextAnnotation.pages[0];

  useEffect(() => {
    var ctx = canvasref.current.getContext("2d");

    canvasref.current.width = page.width;
    canvasref.current.height = page.height;

    page.blocks.forEach((block, index) => {
      //console.log(`Block confidence: ${block.confidence}`);
      for (const paragraph of block.paragraphs) {
        //console.log(` Paragraph confidence: ${paragraph.confidence}`);
        for (const word of paragraph.words) {
          const symbol_texts = word.symbols.map((symbol) => symbol.text);
          const word_text = symbol_texts.join("");
          if (word_text.toLowerCase() === "dubai")
            console.log(word_text, " on block_index: ", index);
          const x = Math.floor(
            word.boundingBox.normalizedVertices[0].x * page.width
          );
          const y = Math.floor(
            word.boundingBox.normalizedVertices[0].y * page.height
          );
          const width = Math.floor(
            (word.boundingBox.normalizedVertices[2].x -
              word.boundingBox.normalizedVertices[0].x) *
              page.width
          );
          ctx.textBaseline = "top";
          ctx.font = "8px";
          ctx.fillStyle = "black";
          ctx.fillText(word_text, x, y, width);
        }
      }
      const x = Math.floor(
        block.boundingBox.normalizedVertices[0].x * page.width
      );
      const y = Math.floor(
        block.boundingBox.normalizedVertices[0].y * page.height
      );
      const width = Math.floor(
        (block.boundingBox.normalizedVertices[2].x -
          block.boundingBox.normalizedVertices[0].x) *
          page.width
      );
      const height = Math.floor(
        (block.boundingBox.normalizedVertices[2].y -
          block.boundingBox.normalizedVertices[0].y) *
          page.height
      );

      ctx.textBaseline = "top";
      ctx.font = "8px";
      ctx.fillStyle = "black";
      ctx.fillText(index, x + 0.5, y + 0.5 - 10, width);

      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = generateColor(block.confidence);
      ctx.rect(x + 0.5, y + 0.5, width, height);
      ctx.stroke();
    });

    // props.page.fullTextAnnotation.pages[0].blocks.forEach((block) => {
    //   console.log(block);
    // });
  }, []);

  return (
    <canvas ref={canvasref} style={{ border: "1px solid black" }}></canvas>
  );
};

const PageTextRaw = (props) => {
  return <StyledDiv>{props.page.fullTextAnnotation.text}</StyledDiv>;
};

const generateColor = (confidence) => {
  confidence = Math.floor(confidence * 100);

  if (confidence > 98) return "green";
  if (confidence > 80) return "yellow";
  if (confidence > 60) return "orange";
  return "red";
};

export default App;
