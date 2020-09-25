import { extractAndFormatDate, extractVatNumber } from "./_shared";

export interface IVat {
  is_valid: true;
  license_number: string;
  company_name: string;
  expiry_date: string;
  tax_registration_number: string;
}

export const parseVatCertificate = (
  data: Array<string>,
  pages: any
): IVat | any => {
  let returnObject = {
    is_valid: false,
    company_name: "",
    expiry_date: "",
    tax_registration_number: "",
  };

  //# CHECK IF DOCUMENT IS VALID
  (function () {
    data.forEach((line) => {
      const regexResult = line.match(/federal\s+tax\s+authority/i);
      if (regexResult && regexResult[0]) {
        returnObject.is_valid = true;
      }
    });
  })();

  if (!returnObject.is_valid) return { is_valid: false };

  // #1 get tax registration number (usually its in first 20 entries)
  for (let i = 0; i < data.length; i++) {
    returnObject.tax_registration_number = extractVatNumber(data[i]);
    if (returnObject.tax_registration_number) break;
  }

  // #2 get efective registration date, it's usually first occuring date & located in first ~20 entries
  for (let i = 0; i < data.length; i++) {
    const result = extractAndFormatDate(data[i]);
    if (result) {
      returnObject.expiry_date = result;
      break;
    }
  }

  //#3 get full english legal name
  //abstract explanation of search:
  // find first block containing word "english"
  // from that word calculate average Y bounding box, and in combination with x:0.5 (center of page)
  // find block that intersects it
  // in that block find words that intersects it, and thats our final result (full name of company, sometimes partial)

  //find average Y of word: "english" bounding box
  const blocks = pages[0].blocks;
  let topOfBox: number = 0;
  let bottomOfBox: number = 0;

  blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      paragraph.words.forEach((word) => {
        const word_symbols = word.symbols.map((symbol) => symbol.text);
        const word_text = word_symbols.join("");

        if (word_text.match(/english/i) && !!!topOfBox) {
          topOfBox += word.boundingBox.normalizedVertices[0].y / 2;
          topOfBox += word.boundingBox.normalizedVertices[1].y / 2;
        }
        if (word_text.match(/address/) && !!!bottomOfBox) {
          bottomOfBox += word.boundingBox.normalizedVertices[0].y / 2;
          bottomOfBox += word.boundingBox.normalizedVertices[1].y / 2;
        }
      });
    });
  });

  // find block that intersects with averageYof... and x=.5 (center of page)
  let intersectingBlock: any;
  const yAverage = (topOfBox + bottomOfBox) / 2;
  blocks.forEach((block, index) => {
    const left =
      (block.boundingBox.normalizedVertices[0].x +
        block.boundingBox.normalizedVertices[3].x) /
      2;
    const right =
      (block.boundingBox.normalizedVertices[1].x +
        block.boundingBox.normalizedVertices[2].x) /
      2;
    const top =
      (block.boundingBox.normalizedVertices[0].y +
        block.boundingBox.normalizedVertices[1].y) /
      2;
    const bottom =
      (block.boundingBox.normalizedVertices[2].y +
        block.boundingBox.normalizedVertices[3].y) /
      2;

    if (left < 0.5 && right > 0.5 && top <= yAverage && bottom >= yAverage)
      intersectingBlock = block;
  });

  //basicaly in intersecting block check for words that lay on same axis RANGE as word "full english legal name" down to upper border of "registered address"
  if (intersectingBlock) {
    intersectingBlock.paragraphs.forEach((paragraph) => {
      paragraph.words.forEach((word) => {
        const wordAvgY =
          (word.boundingBox.normalizedVertices[1].y +
            word.boundingBox.normalizedVertices[2].y) /
          2;
        if (wordAvgY > topOfBox && wordAvgY < bottomOfBox) {
          const symbol_texts = word.symbols.map((symbol) => symbol.text);
          const word_text = symbol_texts.join("");
          returnObject.company_name =
            returnObject.company_name + " " + word_text;
        }
      });
    });
    returnObject.company_name = returnObject.company_name.trim();
  }

  return returnObject;
  //   return returnObject;
};
