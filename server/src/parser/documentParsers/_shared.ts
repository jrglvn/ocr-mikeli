export interface IArtikl {
  kat_broj?: string;
  bar_code?: string;
  naziv?: string;
  jmj?: string;
  kolicina?: number;
  vpc?: number;
  rabat?: number;
  pdv_stopa?: number;
}

export interface IDocument {
  dobavljac?: string;
  oib?: string;
  broj_racuna?: string;
  datum_racuna?: string;
  artikli: Array<IArtikl>;
}

export const extractTextFromWord = (word) => {
  const word_symbols = word.symbols.map((symbol) => symbol.text);
  return word_symbols.join("");
};

export const findAdjacentWordsWithRegex = (
  regex: RegExp,
  page: any,
  source: { element: any; offset?: { x1?; x2?; y1?; y2?: number } },
  bounds?: { x1?; x2?; y1?; y2?: number }
) => {
  source.offset ||= {};
  source.offset.x1 ||= 0;
  source.offset.x2 ||= 0;
  source.offset.y1 ||= 0;
  source.offset.y2 ||= 0;
  bounds ||= {};
  bounds!.x1 ||= 0;
  bounds!.x2 ||= 1;
  bounds!.y1 ||= 0;
  bounds!.y2 ||= 1;

  const source_box = getBoundingBox(source.element, page);
  const foundWords: Array<any> = [];
  page.blocks.forEach((block) => {
    const vertices = block.boundingBox.normalizedVertices.length
      ? block.boundingBox.normalizedVertices
      : block.boundingBox.vertices;
    let slope =
      (vertices[1].y - vertices[0].y) / (vertices[1].x - vertices[0].x);

    slope = 0; // console.log(extractTextFromWord(source.element), " slope: ", slope);

    block.paragraphs.forEach((paragraph) => {
      paragraph.words.forEach((word) => {
        const word_text = extractTextFromWord(word);
        if (word_text.match(regex)) {
          const word_box = getBoundingBox(word, page);
          const slope_YoffSet = (word_box.avgX - source_box.avgX) * slope;
          if (
            word_box.avgX > bounds!.x1 &&
            word_box.avgX < bounds!.x2 &&
            word_box.avgY >
              source_box.top + source.offset!.y1 + slope_YoffSet &&
            word_box.avgY <
              source_box.bottom + source.offset!.y2 + slope_YoffSet
          ) {
            foundWords.push(word);
          }
        }
      });
    });
  });
  return foundWords;
};

export const findWordsInBoundsWithRegex = (
  regex: RegExp,
  page: any,
  bounds?: { x1?: number; x2?: number; y1?: number; y2?: number }
) => {
  bounds ||= {};
  bounds.x1 ||= 0;
  bounds.x2 ||= 1;
  bounds.y1 ||= 0;
  bounds.y2 ||= 1;

  const wordsInBounds: Array<any> = [];
  page.blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      paragraph.words.forEach((word) => {
        const word_text = extractTextFromWord(word);
        if (word_text.match(regex)) {
          const wordBox = getBoundingBox(word, page);
          if (
            wordBox.avgX > bounds!.x1! &&
            wordBox.avgX < bounds!.x2! &&
            wordBox.avgY > bounds!.y1! &&
            wordBox.avgY < bounds!.y2!
          ) {
            wordsInBounds.push(word);
          }
        }
      });
    });
  });
  return wordsInBounds;
};

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
