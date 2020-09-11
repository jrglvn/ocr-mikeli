import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";
import styled from "styled-components";

function App() {
  const [document, setDocument] = useState(null);
  const inputFile = useRef<any>(null);

  useEffect(() => {
    document != null && console.log(document);
  }, [document]);

  useEffect(() => {
    setDocument(JSON.parse(localStorage.getItem("ocr")!));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <input
        type="file"
        id="file"
        ref={inputFile as any}
        style={{ display: "none" }}
        onChange={async () => {
          const formData = new FormData();
          formData.append("ocrFile", inputFile.current.files[0]);
          const response = await axios({
            url: `http://localhost:3001/upload`,
            method: "POST",
            data: formData,
            headers: {
              "Content-Type": "application/pdf",
            },
          });
          setDocument(response.data);
          localStorage.setItem("ocr", JSON.stringify(response.data));
        }}
      />
      <StyledButton onClick={() => inputFile.current.click()}>
        select file
      </StyledButton>

      {/* <pre>{document && JSON.stringify(document![0], null, 2)}</pre> */}

      {document !== null && (
        <PageToCanvas page={document![1][0]}></PageToCanvas>
      )}

      {/* {document != null &&
        document.map((page, index) => (
          <PageTextRaw key={index} page={page}></PageTextRaw>
        ))} */}
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

type TElement = {
  text: string;
  top: number;
  left: number;
  width: number;
  height: number;
  confidence: number;
};

type Tpc = {
  top: number;
  left: number;
  width: number;
  height: number;
  confidence: number;
  index: number;
  text: string;
};

const PageToCanvas = (props) => {
  const canvasref = useRef(null);
  const divAsPageContainer = useRef<any>(null);
  const page = props.page.fullTextAnnotation.pages[0];
  const [paragraphContainers, setParagraphContainers] = useState<Array<any>>(
    []
  );
  const [elements, setElements] = useState<Array<TElement>>([]);
  const [pageDimensions, setPageDimensions] = useState<{
    width: number;
    height: number;
  }>();

  useEffect(() => {
    // var ctx = canvasref.current.getContext("2d");

    // canvasref.current.width = page.width;
    // canvasref.current.height = page.height;
    setPageDimensions({ height: page.height, width: page.width });

    page.blocks.forEach((block, index) => {
      //console.log(`Block confidence: ${block.confidence}`);
      block.paragraphs.forEach((paragraph) => {
        let paragraphText = "";
        //console.log(` Paragraph confidence: ${paragraph.confidence}`);
        for (const word of paragraph.words) {
          const symbol_texts = word.symbols.map((symbol) => symbol.text);
          const word_text = symbol_texts.join("");
          // tempElementText = tempElementText + " " + word_text;

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
          const height = Math.floor(
            (word.boundingBox.normalizedVertices[2].y -
              word.boundingBox.normalizedVertices[0].y) *
              page.height
          );
          elements.push({
            text: word_text,
            top: y,
            left: x,
            width: width,
            height: height,
            confidence: word.confidence,
          } as TElement);
          setElements([...elements]);
          paragraphText = paragraphText + " " + word_text;
        }

        const x = Math.floor(
          paragraph.boundingBox.normalizedVertices[0].x * page.width
        );
        const y = Math.floor(
          paragraph.boundingBox.normalizedVertices[0].y * page.height
        );
        const width = Math.floor(
          (paragraph.boundingBox.normalizedVertices[2].x -
            paragraph.boundingBox.normalizedVertices[0].x) *
            page.width
        );
        const height = Math.floor(
          (paragraph.boundingBox.normalizedVertices[2].y -
            paragraph.boundingBox.normalizedVertices[0].y) *
            page.height
        );
        paragraphContainers.push({
          top: y,
          left: x,
          width: width,
          height: height,
          confidence: paragraph.confidence,
          index,
          text: paragraphText,
        } as Tpc);
        setParagraphContainers([...paragraphContainers]);
      });
      // ctx.textBaseline = "top";
      // ctx.font = "8px";
      // ctx.fillStyle = "black";
      // ctx.fillText(index, x + 0.5, y + 0.5 - 10, width);

      // ctx.beginPath();
      // ctx.lineWidth = 1;
      // ctx.strokeStyle = generateColor(block.confidence);
      // ctx.rect(x + 0.5, y + 0.5, width, height);
      // ctx.stroke();
    });

    // props.page.fullTextAnnotation.pages[0].elements.forEach((block) => {
    //   console.log(block);
    // });
  }, []);

  useEffect(() => {
    const regex = /full english legal name/i;
    let result;
    for (let i = 0; i < paragraphContainers.length; i++) {
      result = paragraphContainers[i].text.match(regex);
      if (result) break;
    }
    console.log("regex result: ", result);
  }, [paragraphContainers]);

  {
    /* <canvas ref={canvasref} style={{ border: "1px solid black" }}></canvas> */
  }
  return (
    <div
      style={{
        position: "relative",
        width: pageDimensions?.width + "px",
        height: pageDimensions?.height + "px",
        fontSize: "7px",
        background: "#ddd",
        border: "thin ridge black",
      }}
    >
      {paragraphContainers.map((p, index) => (
        <fieldset
          key={index}
          style={{
            position: "absolute",
            top: p.top + "px",
            left: p.left + "px",
            width: p.width + "px",
            height: p.height + "px",
            border: "1px solid black",
            borderColor: generateColor(p.confidence),
          }}
        >
          <legend style={{ transform: "translateY(-5px)", fontWeight: "bold" }}>
            {p.index}
          </legend>
        </fieldset>
      ))}
      {elements.map((b, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: b.top + "px",
            left: b.left + "px",
            width: b.width + "px",
            height: b.height + "px",
          }}
        >
          {b.text}
        </div>
      ))}
      <div style={{ position: "absolute", top: pageDimensions?.height }}>
        {paragraphContainers.map((p) => (
          <div>{p.text}</div>
        ))}
      </div>
    </div>
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

//[\u0621-\u064A]+
//arabic letters regex
