import { extractAndFormatDate } from "./_shared";

export interface IVatCertificateReturnObject {
  license_number: string;
  company_name: string;
  expiry_date: string;
  tax_registration_number: string;
}

export const parseVatCertificate = (
  data: Array<string>,
  rawResult: any
): IVatCertificateReturnObject | any => {
  let vatCertificateInfo = {
    company_name: "",
    expiry_date: "",
    tax_registration_number: "",
  };

  // #1 get tax registration number (usually its in first 20 entries)
  for (let i = 0; i < 30; i++) {
    const temp = data[i].match(/\d{15}/);
    if (temp) {
      vatCertificateInfo.tax_registration_number = temp[0];
      break;
    }
  }

  // #2 get efective registration date, it's usually first occuring date & located in first ~20 entries
  for (let i = 0; i < 30; i++) {
    const result = extractAndFormatDate(data[i]);
    if (result) {
      vatCertificateInfo.expiry_date = result;
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
  const blocks = rawResult.pages[0].blocks;
  let yAverage: number = 0;
  blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      paragraph.words.forEach((word) => {
        const word_symbols = word.symbols.map((symbol) => symbol.text);
        const word_text = word_symbols.join("");

        if (word_text.match(/english/i) && !!!yAverage) {
          word.boundingBox.normalizedVertices.forEach(
            (v) => (yAverage += v.y / 4)
          );
        }
      });
    });
  });

  // find block that intersects with averageYof... and x=.5 (center of page)
  let intersectingBlock: any;
  blocks.forEach((block) => {
    if (
      block.boundingBox.normalizedVertices[0].x < 0.5 &&
      block.boundingBox.normalizedVertices[1].x > 0.5 &&
      block.boundingBox.normalizedVertices[1].y < yAverage &&
      block.boundingBox.normalizedVertices[2].y > yAverage
    )
      intersectingBlock = block;
  });

  //basicaly in intersecting block check for words that lay on same axis as word "full english legal name"
  intersectingBlock.paragraphs.forEach((paragraph) => {
    paragraph.words.forEach((word) => {
      if (
        word.boundingBox.normalizedVertices[1].y <= yAverage &&
        word.boundingBox.normalizedVertices[2].y >= yAverage
      ) {
        const symbol_texts = word.symbols.map((symbol) => symbol.text);
        const word_text = symbol_texts.join("");
        vatCertificateInfo.company_name =
          vatCertificateInfo.company_name + " " + word_text;
      }
    });
  });
  vatCertificateInfo.company_name = vatCertificateInfo.company_name.trim();

  return vatCertificateInfo;
  //   return vatCertificateInfo;
};
