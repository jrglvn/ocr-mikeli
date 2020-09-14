export const extractAndFormatDate = (data: string): string => {
  let result = "";

  let tempResult = data.match(/\d{2,4}[\W\D]+\d{2}[\W\D]+\d{2,4}/);
  if (tempResult) {
    result = tempResult[0].replace(/[\W\D]+/g, "/"); //replace multiple // or \\
  }

  //because of arabic text direction sometimes google vision returns inversed date order
  //if years is on first position change order of items inside string
  if (result.match(/^\d{4}/)) {
    tempResult = result.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    if (tempResult)
      result = `${tempResult[3]}/${tempResult[2]}/${tempResult[1]}`;
  }

  return result;
};

export const extractVatNumber = (data: string): string => {
  let result = "";
  const temp = data.match(/\d{15}/);
  if (temp) {
    result = temp[0];
  }

  return result;
};

export const findWordObject = (
  rawResult: any,
  regex: RegExp
): Array<{ element: any; text: string }> => {
  const blocks = rawResult.pages[0].blocks;

  const results: Array<{ element: any; text: string }> = [];

  blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      let paragraphText = "";
      paragraph.words.forEach((word) => {
        const word_symbols = word.symbols.map((symbol) => symbol.text);
        const word_text = word_symbols.join("");
        paragraphText = paragraphText + word_text + " ";
      });
      console.log(paragraphText);
      const temp = paragraphText.match(regex);
      if (temp && temp[0]) {
        results.push({ element: paragraph, text: temp[0] });
      }
    });
  });
  return results;
};

export const getBoundingBox = (
  rawResult: any,
  element: any
): {
  top;
  right;
  bottom;
  left;
  avgX;
  avgY;
  width;
  height;
  pageWidth;
  pageHeight;
  avgXnormalized;
  avgYnormalized: number;
} => {
  const page = rawResult.pages[0];
  let result = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    avgX: 0,
    avgY: 0,
    width: 0,
    height: 0,
    pageWidth: 0,
    pageHeight: 0,
    avgXnormalized: 0,
    avgYnormalized: 0,
  };

  const vertices: Array<any> = element.boundingBox.normalizedVertices.length
    ? element.boundingBox.normalizedVertices
    : element.boundingBox.vertices;

  const pageSize = element.boundingBox.normalizedVertices.length
    ? { width: page.width, height: page.height }
    : { width: 1, height: 1 };

  result.top = Math.floor(
    Math.min(vertices[0].y, vertices[1].y) * pageSize.height
  );
  result.right = Math.floor(
    Math.max(vertices[1].x, vertices[2].x) * pageSize.width
  );
  result.bottom = Math.floor(
    Math.max(vertices[2].y, vertices[3].y) * pageSize.height
  );
  result.left = Math.floor(
    Math.min(vertices[3].x, vertices[0].x) * pageSize.width
  );
  result.width = result.right - result.left;
  result.height = result.bottom - result.top;
  result.avgX = (result.left + result.right) / 2;
  result.avgY = (result.top + result.bottom) / 2;
  result.pageWidth = page.width;
  result.pageHeight = page.height;
  result.avgXnormalized = result.avgX / result.pageWidth;
  result.avgYnormalized = result.avgY / result.pageHeight;

  return result;
};
