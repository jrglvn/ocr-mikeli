import * as _ from "./_shared";
import { IPage } from "../vision";

export const parseUnimar = (pages: Array<IPage>): _.IDocument | any => {
  const firstPage = pages[0].pageData;
  let returnObject = { artikli: [] } as _.IDocument;

  //first occuring date is date of document
  const [firstDate] = _.findWordsInBoundsWithRegex(
    /\d{1,2}\.\d{1,2}\.\d{4}/,
    firstPage
  );
  if (firstDate) returnObject.datum_racuna = _.extractTextFromWord(firstDate);

  //first word with this regex is number of document
  const [brojRacuna] = _.findWordsInBoundsWithRegex(
    /\d{1,4}-\d{2}-\d{2}/,
    firstPage
  );
  if (brojRacuna) returnObject.broj_racuna = _.extractTextFromWord(brojRacuna);

  //first word with this regex is number of document
  const [firstOib] = _.findWordsInBoundsWithRegex(/^\d{11}$/, firstPage);
  if (firstOib) returnObject.dobavljac_oib = _.extractTextFromWord(firstOib);

  //find words that should be art.number
  const katBrojWords = _.findWordsInBoundsWithRegex(
    /^\d{7,8}(\w?){2,3}/,
    firstPage,
    {
      x1: 0,
      x2: 0.175,
    }
  );

  //#initialize array of empty IArtikl objects

  for (let i = 0; i < katBrojWords.length; i++) {
    returnObject.artikli.push({} as _.IArtikl);
  }

  //#check in space below/between katbroj for extra characters that belong to katbroj
  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const currentWordBoundingBox = _.getBoundingBox(currentWord, firstPage);
    let temp = _.extractTextFromWord(currentWord);

    const bottomOfLookup =
      i !== katBrojWords.length - 1
        ? _.getBoundingBox(katBrojWords[i + 1], firstPage).top
        : currentWordBoundingBox.bottom + currentWordBoundingBox.height;

    const [extraWord] = _.findWordsInBoundsWithRegex(/.*/, firstPage, {
      x1: currentWordBoundingBox.left,
      x2: currentWordBoundingBox.right,
      y1: currentWordBoundingBox.bottom,
      y2: bottomOfLookup,
    });
    if (extraWord && !extraWord[0]?.match(/ukupno/i)) {
      temp += _.extractTextFromWord(extraWord);
    }

    let formatted: string;

    if (temp.match(/\d{8}/)) {
      formatted =
        temp.substring(0, 3) +
        "." +
        temp.substring(3, 6) +
        "." +
        temp.substring(6);
    } else {
      formatted =
        temp.substring(0, 2) +
        "." +
        temp.substring(2, 5) +
        "." +
        temp.substring(5);
    }
    returnObject.artikli[i].kat_broj = formatted;
  }

  //# check in zone right to find names of items also use free space below for extra words
  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const currentWordBoundingBox = _.getBoundingBox(currentWord, firstPage);

    const bottomOffset =
      i !== katBrojWords.length - 1
        ? _.getBoundingBox(katBrojWords[i + 1], firstPage).top -
          currentWordBoundingBox.bottom
        : currentWordBoundingBox.height;

    const nazivWords = _.findAdjacentWordsWithRegex(
      /.*/,
      firstPage,
      {
        element: currentWord,
        offset: { y2: bottomOffset },
      },
      { x1: 0.15, x2: 0.375 }
    );
    if (nazivWords && nazivWords.length) {
      const nazivWordsText = nazivWords.map((word) =>
        _.extractTextFromWord(word)
      );
      nazivWordsText.splice(1, 0, returnObject.artikli[i].kat_broj);
      nazivWordsText[0] = nazivWordsText[0].toString().toUpperCase();
      returnObject.artikli[i].naziv = nazivWordsText.join(" ");
      while (true) {
        const token = returnObject.artikli[i].naziv?.match(/\s+?([\W\D])\s+?/);
        if (!token) break;
        returnObject.artikli[i].naziv = returnObject.artikli[i].naziv?.replace(
          /\s+?[\W\D]\s+?/,
          token[1]
        );
      }
    }
  }
  // find jedinicne mjere value
  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [jmj] = _.findAdjacentWordsWithRegex(
      /.*/,
      firstPage,
      {
        element: currentWord,
      },
      { x1: 0.375, x2: 0.42 }
    );
    if (jmj) {
      returnObject.artikli[i].jmj = _.extractTextFromWord(jmj)
        .toString()
        .toLowerCase();
    }
  }

  //find kolicina words
  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [kolicina] = _.findAdjacentWordsWithRegex(
      /.*/,
      firstPage,
      {
        element: currentWord,
      },
      { x1: 0.42, x2: 0.5 }
    );
    if (kolicina) {
      returnObject.artikli[i].kolicina = parseFloat(
        _.extractTextFromWord(kolicina).replace(".", "").replace(",", ".")
      );
    }
  }

  //find vpc words
  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [vpc] = _.findAdjacentWordsWithRegex(
      /.*/,
      firstPage,
      {
        element: currentWord,
      },
      { x1: 0.5, x2: 0.6 }
    );
    if (vpc) {
      returnObject.artikli[i].vpc = parseFloat(
        _.extractTextFromWord(vpc).replace(".", "").replace(",", ".")
      );
    }
  }

  //find rabat words
  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [rabat] = _.findAdjacentWordsWithRegex(
      /.*/,
      firstPage,
      {
        element: currentWord,
      },
      { x1: 0.65, x2: 0.75 }
    );
    if (rabat) {
      returnObject.artikli[i].rabat = parseFloat(
        _.extractTextFromWord(rabat).replace(".", "").replace(",", ".")
      );
    }
  }

  //find pdv value word, and from it calculate PDV_rate
  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [pdv] = _.findAdjacentWordsWithRegex(
      /.*/,
      firstPage,
      {
        element: currentWord,
      },
      { x1: 0.8, x2: 0.875 }
    );
    if (pdv) {
      returnObject.artikli[i].pdv_stopa = Math.round(
        (parseFloat(
          _.extractTextFromWord(pdv).replace(".", "").replace(",", ".")
        ) /
          (((returnObject.artikli[i].vpc! *
            (100 - returnObject.artikli[i].rabat!)) /
            100) *
            returnObject.artikli[i].kolicina!)) *
          100
      );
    }
  }

  console.log(returnObject);

  return returnObject;
};
