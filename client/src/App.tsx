import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import { workerData } from "worker_threads";

interface IZapis {
  katBroj?: string;
  naziv?: string;
  jmj?: string;
  kol?: number;
  vpc?: number;
  rabat?: number;
}

interface Primka {
  broj_racuna?: string;
  datum_racuna?: string;
  artikli?: Array<IZapis>;
  ukupno?: number;
}

function App() {
  const inputFile = useRef<any>(null);
  const [responseArray, setResponseArray] = useState<any>();
  const [pages, setPages] = useState<Array<any>>();
  const [primka, setPrimka] = useState<Primka>();

  useEffect(() => {
    setResponseArray(JSON.parse(localStorage.getItem("ocr")!));
  }, []);
  useEffect(() => {
    if (responseArray && responseArray.length) {
      setPages(responseArray[1][0].fullTextAnnotation.pages);
      // console.log(responseArray);
    }
  }, [responseArray]);

  useEffect(() => {
    if (pages) {
      const katBrojWords = getWordsInBoundsWithRegex(
        /\d{7,8}(\w?){2,3}/,
        pages[0],
        {
          x1: 0,
          x2: 0.2,
        }
      );

      //create temp object, later add it to useState
      let tempZapisi = katBrojWords.map((word) => {
        const word_text = extractTextFromWord(word);
        let formatted: string;
        if (word_text.match(/\d{8}/)) {
          formatted =
            word_text.substring(0, 3) +
            "." +
            word_text.substring(3, 6) +
            "." +
            word_text.substring(6);
        } else {
          formatted =
            word_text.substring(0, 2) +
            "." +
            word_text.substring(2, 5) +
            "." +
            word_text.substring(5);
        }
        return { katBroj: formatted } as IZapis;
      });

      //need to see if there is extra word that needs to be part of katBroj word
      (() => {
        for (let i = 0; i < katBrojWords.length; i++) {
          //if index is not last, check in space between word and next word,
          if (i !== katBrojWords.length - 1) {
            const word1bb = getBoundingBox(katBrojWords[i], pages[0]);
            const word2bb = getBoundingBox(katBrojWords[i + 1], pages[0]);

            const [wordBetween] = getWordsInBoundsWithRegex(/.*/, pages[0], {
              x1: word1bb.left,
              x2: word1bb.right,
              y1: word1bb.bottom,
              y2: word2bb.top,
            });
            if (wordBetween) {
              tempZapisi[i].katBroj += extractTextFromWord(wordBetween);
            }

            const nazivWords = getWordsInBoundsWithRegex(/.*/, pages[0], {
              x1: 0.15,
              x2: 0.375,
              y1: word1bb.top,
              y2: word2bb.top,
            });
            if (nazivWords.length) {
              tempZapisi[i].naziv = nazivWords
                .map((word) => extractTextFromWord(word))
                .join(" ");
              console.log(tempZapisi[i]);
            }
          } else {
            // if index is last check in space below
            const word1bb = getBoundingBox(katBrojWords[i], pages[0]);
            const [wordBelow] = getWordsInBoundsWithRegex(/.*/, pages[0], {
              x1: word1bb.left,
              x2: word1bb.right,
              y1: word1bb.bottom,
              y2: word1bb.bottom + word1bb.height,
            });
            if (wordBelow) {
              const wordBelow_text = extractTextFromWord(wordBelow);
              if (!wordBelow_text.match(/ukupno/i)) {
                tempZapisi[i].katBroj += wordBelow_text;
              }
            }

            const nazivWords = getWordsInBoundsWithRegex(/.*/, pages[0], {
              x1: 0.15,
              x2: 0.375,
              y1: word1bb.top,
              y2: word1bb.bottom + word1bb.height,
            });
            if (nazivWords.length) {
              tempZapisi[i].naziv = nazivWords
                .map((word) => extractTextFromWord(word))
                .join(" ");
            }
          }
        }
      })();

      //iterate again through katBrojWords and look at right to get jmj, kol, VPC,
      (() => {
        for (let i = 0; i < katBrojWords.length; i++) {
          const wordbb = getBoundingBox(katBrojWords[i], pages[0]);

          const [jmj] = getWordsInBoundsWithRegex(/.*/, pages[0], {
            x1: 0.375,
            x2: 0.425,
            y1: wordbb.top,
            y2: wordbb.bottom,
          });
          if (jmj) {
            tempZapisi[i].jmj = extractTextFromWord(jmj);
          }

          const [kolicina] = getWordsInBoundsWithRegex(/.*/, pages[0], {
            x1: 0.425,
            x2: 0.5,
            y1: wordbb.top,
            y2: wordbb.bottom,
          });
          if (kolicina) {
            tempZapisi[i].kol = parseFloat(extractTextFromWord(kolicina));
          }

          const [cijena] = getWordsInBoundsWithRegex(/.*/, pages[0], {
            x1: 0.5,
            x2: 0.6,
            y1: wordbb.top,
            y2: wordbb.bottom,
          });
          if (cijena) {
            tempZapisi[i].vpc = parseFloat(
              extractTextFromWord(cijena)
                .replace(",", "-")
                .replace(".", ",")
                .replace("-", ".")
            );
          }

          const [rabat] = getWordsInBoundsWithRegex(/.*/, pages[0], {
            x1: 0.65,
            x2: 0.75,
            y1: wordbb.top,
            y2: wordbb.bottom,
          });
          if (rabat) {
            tempZapisi[i].rabat = parseFloat(
              extractTextFromWord(rabat).replace(",", ".")
            );
          }
        }
      })();

      const [firstDate] = getWordsInBoundsWithRegex(
        /\d{1,2}\.\d{1,2}\.\d{4}/,
        pages[0]
      );

      const [brojRacuna] = getWordsInBoundsWithRegex(
        /\d{1,4}-\d{2}-\d{2}/,
        pages[0]
      );

      setPrimka({
        datum_racuna: extractTextFromWord(firstDate),
        broj_racuna: extractTextFromWord(brojRacuna),
        ukupno: tempZapisi?.reduce(
          (accumulator: number, current: IZapis) =>
            accumulator +
            (current?.vpc! * current?.kol! * (100 - current?.rabat!)) / 100,
          0
        ),
        artikli: tempZapisi,
      });
    }
  }, [pages]);

  useEffect(() => {
    // zapisi && console.log(zapisi);
  }, [primka]);

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

      {/* <pre style={{ background: "#eee", padding: "10px" }}>
        {responseArray && JSON.stringify(responseArray[0], null, 2)}
      </pre> */}
      <pre style={{ background: "#eee", padding: "10px" }}>
        {JSON.stringify(primka, null, 2)}
      </pre>

      {pages?.map((page, index) => (
        <DataToPage key={index} page={page} />
      ))}

      {/* <div>
        {responseArray &&
          responseArray.length &&
          responseArray[1][0].fullTextAnnotation.text
            .toString()
            .split(/\r?\n/)
            .map((line, index) => <div key={index}>{line}</div>)}
      </div> */}
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
    <>
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
            <legend
              style={{ transform: "translateY(-5px)", fontWeight: "bold" }}
            >
              {p.index}
            </legend>
          </fieldset>
        ))}
        {words.map((word, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              fontSize: Math.floor(word.height * page.height * 0.75),
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
      <div>
        {paragraphs.map((paragraph) => (
          <p>{paragraph.text}</p>
        ))}
      </div>
    </>
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
): Array<{ result: string; paragraph: any; page: any }> => {
  const paragraphObjects: Array<{
    result: string;
    paragraph: any;
    page: any;
  }> = [];

  pages.forEach((page) => {
    page.blocks.forEach((block) => {
      block.paragraphs.forEach((paragraph) => {
        let paragraph_text = "";
        paragraph.words.forEach((word) => {
          paragraph_text = paragraph_text + " " + extractTextFromWord(word);
        });
        const regexResult = paragraph_text.match(regex);
        if (regexResult && regexResult[0]) {
          paragraphObjects.push({ result: regexResult[0], paragraph, page });
        }
      });
    });
  });

  return paragraphObjects;
};

export const findWordsContainingText = (
  pages: Array<any>,
  regex: RegExp
): Array<{ result: string; word: any; page: any }> => {
  const wordObjects: Array<any> = [];

  pages.forEach((page) => {
    page.blocks.forEach((block) => {
      block.paragraphs.forEach((paragraph) => {
        paragraph.words.forEach((word) => {
          const word_text = extractTextFromWord(word);
          const regexResult = word_text.match(regex);
          if (regexResult && regexResult[0]) {
            wordObjects.push({ result: regexResult[0], word, page });
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

export const findWordsInBounds = (
  source: any,
  page: any,
  { x1, x2, offsetY1, offsetY2 }: { x1; x2; offsetY1; offsetY2: number }
): Array<any> => {
  const sourceWordBox = getBoundingBox(source, page);
  const wordsInBound: Array<any> = [];
  page.blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      const vertices = paragraph.boundingBox.normalizedVertices.length
        ? paragraph.boundingBox.normalizedVertices
        : paragraph.boundingBox.vertices;

      const kFactor =
        (vertices[1].y - vertices[0].y) / (vertices[1].x - vertices[0].x);

      paragraph.words.forEach((word) => {
        const wordBox = getBoundingBox(word, page);
        const yOffset = (wordBox.avgX - sourceWordBox.avgX) * kFactor;
        if (
          wordBox.avgX > x1 &&
          wordBox.avgX < x2 &&
          wordBox.top < sourceWordBox.avgY + yOffset - offsetY1 &&
          wordBox.avgY > sourceWordBox.avgY + yOffset + offsetY2
        ) {
          wordsInBound.push(word);
        }
      });
    });
  });
  return wordsInBound;
};

export const getOffsetWords = (
  pages: any,
  regex: RegExp,
  indexOfElement: number,
  {
    x1,
    x2,
    offsetY1 = 0,
    offsetY2 = 0,
  }: { x1: number; x2: number; offsetY1?: number; offsetY2?: number }
) => {
  const foundWords = findWordsContainingText(pages, regex);
  const wordAtIndex = foundWords[indexOfElement];
  if (wordAtIndex) {
    const foundWords = findWordsInBounds(wordAtIndex.word, wordAtIndex.page, {
      x1,
      x2,
      offsetY1,
      offsetY2,
    });
    if (foundWords) {
      const stringArray = foundWords.map((word) => extractTextFromWord(word));
      return stringArray.join(" ");
    }
  }
  return "";
};

export const getWordsInBoundsWithRegex = (
  regex: RegExp,
  page: any,
  bounds: { x1?: number; x2?: number; y1?: number; y2?: number } = {}
) => {
  bounds.x1 = bounds.x1 || 0;
  bounds.x2 = bounds.x2 || 1;
  bounds.y1 = bounds.y1 || 0;
  bounds.y2 = bounds.y2 || 1;

  const wordsInBounds: Array<any> = [];
  page.blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      paragraph.words.forEach((word) => {
        const word_text = extractTextFromWord(word);
        if (word_text.match(regex)) {
          const wordBox = getBoundingBox(word, page);
          if (
            wordBox.avgX > bounds.x1! &&
            wordBox.avgX < bounds.x2! &&
            wordBox.avgY > bounds.y1! &&
            wordBox.avgY < bounds.y2!
          ) {
            wordsInBounds.push(word);
          }
        }
      });
    });
  });
  return wordsInBounds;
};
