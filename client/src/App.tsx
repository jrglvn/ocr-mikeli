import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

export interface IPage {
  pageData: any;
  text: string;
}

function App() {
  const inputFile = useRef<any>(null);
  const [responseArray, setResponseArray] = useState<any>();
  const [pages, setPages] = useState<Array<any>>();

  useEffect(() => {
    setResponseArray(JSON.parse(localStorage.getItem("ocr")!));
  }, []);

  useEffect(() => {
    if (responseArray && responseArray.length) {
      setPages(responseArray[1]);
      // console.log(responseArray);
    }
  }, [responseArray]);

  return (
    <StyledApp>
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
          localStorage.setItem("ocr", JSON.stringify(response.data));
          setResponseArray(response.data);
        }}
      />
      <button onClick={() => inputFile.current.click()}>select file</button>
      {pages?.map((page, index) => (
        <DataToPage key={index} page={page} />
      ))}
      <pre>
        {responseArray?.length && JSON.stringify(responseArray[0], null, 2)}
      </pre>
    </StyledApp>
  );
}

type TElement = {
  top: number;
  left: number;
  width: number;
  height: number;
  confidence?: number;
  index?: number;
  text?: string;
};

const DataToPage = (props) => {
  const [words, setWords] = useState<Array<TElement>>([]);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [context, setContext] = React.useState<CanvasRenderingContext2D | null>(
    null
  );

  const page = props.page.pageData;

  useEffect(() => {
    page.blocks.forEach((block, index) => {
      block.paragraphs.forEach((paragraph) => {
        let paragraphText = "";
        for (const word of paragraph.words) {
          const symbol_texts = word.symbols.map((symbol) => symbol.text);
          const word_text = symbol_texts.join("");

          words.push({
            text: word_text,
            confidence: word.confidence,
            ...getBoundingBox(word, page),
          } as TElement);
          setWords([...words]);
          paragraphText = paragraphText + " " + word_text;
        }
      });
    });
  }, []);

  React.useEffect(() => {
    if (canvasRef.current) {
      const renderCtx = canvasRef.current.getContext("2d");

      if (renderCtx && !context) {
        setContext(renderCtx);
      }
    }

    if (context) {
      context.beginPath();
      context.lineWidth = 1;
      context.strokeStyle = "green";
      context.translate(0.5, 0.5);
      context.beginPath();
      context.moveTo(page.width * 0.2, 0);
      context.lineTo(page.width * 0.2, page.height);
      context.moveTo(page.width * 0.4, 0);
      context.lineTo(page.width * 0.4, page.height);
      context.moveTo(page.width * 0.6, 0);
      context.lineTo(page.width * 0.6, page.height);
      context.moveTo(page.width * 0.8, 0);
      context.lineTo(page.width * 0.8, page.height);
      context.stroke();
      context.translate(-0.5, -0.5);

      page.blocks.forEach((block) => {
        block.paragraphs.forEach((paragraph) => {
          const vertices = paragraph.boundingBox.normalizedVertices;
          let slope =
            (vertices[1].y - vertices[0].y + vertices[2].y - vertices[3].y) /
            (vertices[1].x - vertices[0].x + vertices[2].x - vertices[3].x);
          context.translate(0.5, 0.5);
          context.beginPath();
          context.lineWidth = 1;
          context.strokeStyle = "yellow";
          context.moveTo(
            Math.round(vertices[0].x * page.width),
            Math.round(vertices[0].y * page.height)
          );
          context.lineTo(
            Math.round(vertices[1].x * page.width),
            Math.round(vertices[1].y * page.height)
          );
          context.lineTo(
            Math.round(vertices[2].x * page.width),
            Math.round(vertices[2].y * page.height)
          );
          context.lineTo(
            Math.round(vertices[3].x * page.width),
            Math.round(vertices[3].y * page.height)
          );
          context.lineTo(
            Math.round(vertices[0].x * page.width),
            Math.round(vertices[0].y * page.height)
          );
          context.stroke();
          context.translate(-0.5, -0.5);
          paragraph.words.forEach((word) => {
            if (extractTextFromWord(word).match(/.*/)) {
              const vertices = word.boundingBox.normalizedVertices;
              context.translate(0.5, 0.5);
              context.beginPath();
              context.lineWidth = 1;
              context.strokeStyle = "red";
              context.moveTo(
                Math.round(vertices[0].x * page.width),
                Math.round(vertices[0].y * page.height)
              );
              context.lineTo(
                Math.round(vertices[1].x * page.width),
                Math.round(vertices[1].y * page.height)
              );
              context.lineTo(
                Math.round(vertices[2].x * page.width),
                Math.round(vertices[2].y * page.height)
              );
              context.lineTo(
                Math.round(vertices[3].x * page.width),
                Math.round(vertices[3].y * page.height)
              );
              context.lineTo(
                Math.round(vertices[0].x * page.width),
                Math.round(vertices[0].y * page.height)
              );
              context.stroke();

              // context.beginPath();

              // context.moveTo(
              //   Math.round(
              //     ((vertices[0].x +
              //       vertices[1].x +
              //       vertices[2].x +
              //       vertices[3].x) /
              //       4) *
              //       page.width
              //   ),
              //   Math.round(
              //     ((vertices[0].y +
              //       vertices[1].y +
              //       vertices[2].y +
              //       vertices[3].y) /
              //       4) *
              //       page.height
              //   )
              // );
              // context.lineTo(
              //   page.width,
              //   Math.round(
              //     ((vertices[0].y + vertices[3].y) / 2 +
              //       (1 - (vertices[0].x + vertices[3].x) / 2) * slope) *
              //       page.height
              //   )
              // );
              // context.strokeStyle = "blue";
              // context.stroke();

              context.translate(-0.5, -0.5);
            }
          });
        });
      });
    }
  }, [page, context]);

  return (
    <>
      <div
        style={{
          position: "relative",
          width: page.width + "px",
          height: page.height + "px",
          background: "#ddd",
          border: "2px solid black",
          boxSizing: "content-box",
        }}
      >
        <canvas
          id="canvas"
          ref={canvasRef}
          width={page.width}
          height={page.height}
          style={{
            position: "absolute",
          }}
        ></canvas>

        {words.map((word, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              fontSize: Math.round(word.height * page.height * 0.75),
              top: Math.round(word.top * page.height) + "px",
              left: Math.round(word.left * page.width) + "px",
              width: Math.round(word.width * page.width) + "px",
              height: Math.round(word.height * page.height) + "px",
            }}
          >
            {word.text}
          </div>
        ))}
      </div>
      <pre>
        {words?.map((word) => (
          <p>{word.text}</p>
        ))}
      </pre>
    </>
  );
};

const generateColor = (confidence) => {
  confidence = Math.round(confidence * 100);

  if (confidence > 98) return "green";
  if (confidence > 80) return "yellow";
  if (confidence > 60) return "orange";
  return "red";
};

export default App;

//[\u0621-\u064A]+
//arabic letters regex

const StyledApp = styled.div`
  box-sizing: border-box;
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  & button {
    background: #0275d8;
    border: none;
    outline: none;
    color: white;
    padding: 1rem;
  }
`;

export const getBoundingBox = (
  element: any,
  page: any
): {
  top;
  right;
  bottom;
  left;
  avgX;
  avgY;
  width;
  height;
} => {
  let result = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    avgX: 0,
    avgY: 0,
    width: 0,
    height: 0,
  };

  const vertices: Array<any> = element.boundingBox.normalizedVertices.length
    ? element.boundingBox.normalizedVertices
    : element.boundingBox.vertices;

  const factor = element.boundingBox.normalizedVertices.length
    ? { width: 1, height: 1 }
    : { width: page.width, height: page.height };

  result.top = Math.min(vertices[0].y, vertices[1].y) / factor.height;
  result.right = Math.max(vertices[1].x, vertices[2].x) / factor.width;
  result.bottom = Math.max(vertices[2].y, vertices[3].y) / factor.height;
  result.left = Math.min(vertices[3].x, vertices[0].x) / factor.width;
  result.avgX = (result.left + result.right) / 2;
  result.avgY = (result.top + result.bottom) / 2;

  result.width = result.right - result.left;
  result.height = result.bottom - result.top;

  return result;
};

export const extractTextFromWord = (word) => {
  const word_symbols = word.symbols.map((symbol) => symbol.text);
  return word_symbols.join("");
};
