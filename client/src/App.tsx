import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";

function App() {
  const inputFile = useRef<any>(null);
  const [responseArray, setResponseArray] = useState<any>();
  const [pages, setPages] = useState<Array<any>>();

  useEffect(() => {
    setResponseArray(JSON.parse(localStorage.getItem("ocr")!));
  }, []);
  useEffect(() => {
    if (responseArray && responseArray.length) {
      setPages(responseArray[1][0].fullTextAnnotation.pages);
      console.log(responseArray);
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

      <pre style={{ background: "#eee", padding: "10px" }}>
        {responseArray && JSON.stringify(responseArray[0], null, 2)}
      </pre>

      {pages?.map((page, index) => (
        <DataToPage key={index} page={page} />
      ))}

      <div>
        {responseArray &&
          responseArray.length &&
          responseArray[1][0].fullTextAnnotation.text
            .toString()
            .split(/\r?\n/)
            .map((line, index) => <div key={index}>{line}</div>)}
      </div>
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

const DataToPage = ({ page }) => {
  const [words, setWords] = useState<Array<TElement>>([]);
  const [paragraphs, setParagraphs] = useState<Array<TElement>>([]);
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

        paragraphs.push({
          text: paragraphText,
          confidence: paragraph.confidence,
          index,
          ...getBoundingBox(paragraph, page),
        } as TElement);
        setParagraphs([...paragraphs]);
      });
    });
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: page.width + "px",
        height: page.height + "px",
        fontSize: "10px",
        background: "#ddd",
        border: "medium ridge black",
      }}
    >
      {paragraphs.map((p, index) => (
        <fieldset
          key={index}
          style={{
            position: "absolute",
            top: Math.floor(p.top * page.height) + "px",
            left: Math.floor(p.left * page.width) + "px",
            width: Math.floor(p.width * page.width) + "px",
            height: Math.floor(p.height * page.height) + "px",
            border: "1px solid black",
            borderColor: generateColor(p.confidence),
          }}
        >
          <legend style={{ transform: "translateY(-5px)", fontWeight: "bold" }}>
            {p.index}
          </legend>
        </fieldset>
      ))}
      {words.map((word, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: Math.floor(word.top * page.height) + "px",
            left: Math.floor(word.left * page.width) + "px",
            width: Math.floor(word.width * page.width) + "px",
            height: Math.floor(word.height * page.height) + "px",
          }}
        >
          {word.text}
        </div>
      ))}
    </div>
  );
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

const StyledApp = styled.div`
  box-sizing: border-box;
  & * {
    box-sizing: border-box;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px;
  & button {
    background: #0275d8;
    border: none;
    outline: none;
    color: white;
    padding: 1rem;
  }
  & fieldset {
    padding: 0;
    margin: 0;
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

export const findParagrapshContainingText = (
  pages: any,
  regex: RegExp
): Array<{ paragraph: any; page: any }> => {
  const paragraphObjects: Array<{ paragraph: any; page: any }> = [];

  pages.forEach((page) => {
    page.blocks.forEach((block) => {
      block.paragraphs.forEach((paragraph) => {
        let paragraph_text = "";
        paragraph.words.forEach((word) => {
          paragraph_text = paragraph_text + " " + extractTextFromWord(word);
        });
        const regexResult = paragraph_text.match(regex);
        if (regexResult && regexResult[0]) {
          paragraphObjects.push({ paragraph, page });
        }
      });
    });
  });

  return paragraphObjects;
};

export const findWordsContainingText = (
  pages: any,
  regex: RegExp
): Array<{ word: any; page: any }> => {
  const wordObjects: Array<any> = [];

  pages.forEach((page) => {
    page.blocks.forEach((block) => {
      block.paragraphs.forEach((paragraph) => {
        paragraph.words.forEach((word) => {
          const word_text = extractTextFromWord(word);
          const regexResult = word_text.match(regex);
          if (regexResult && regexResult[0]) {
            wordObjects.push({ word, page });
          }
        });
      });
    });
  });

  return wordObjects;
};

export const extractTextFromWord = (word) => {
  const word_symbols = word.symbols.map((symbol) => symbol.text);
  return word_symbols.join("");
};

const findWordsInBounds = (
  page,
  { x1, x2, y1, y2 }: { x1; x2; y1; y2: number }
): Array<any> => {
  const wordsInBound: Array<any> = [];
  page.blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      paragraph.words.forEach((word) => {
        const wordBox = getBoundingBox(word, page);
        if (
          wordBox.avgX > x1 &&
          wordBox.avgX < x2 &&
          wordBox.avgY > y1 &&
          wordBox.avgY < y2
        ) {
          console.log("x: ", wordBox.avgX, "y: ", wordBox.avgY);
          wordsInBound.push(word);
        }
      });
    });
  });
  return wordsInBound;
};
