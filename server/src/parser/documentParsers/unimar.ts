import * as _ from "./_shared";

export const parseUnimar = ({
  pages,
  textArray,
}: {
  pages: Array<any>;
  textArray: Array<string>;
}): _.IDocument | any => {
  let returnObject = { artikli: [] } as _.IDocument;

  const katBrojWords = _.findWordsInBoundsWithRegex(
    /\d{7,8}(\w?){2,3}/,
    pages[0],
    {
      x1: 0,
      x2: 0.2,
    }
  );

  //#initialize array of empty IArtikl objects

  for (let i = 0; i < katBrojWords.length; i++) {
    returnObject.artikli.push({} as _.IArtikl);
  }

  //#check in space below/between katbroj for extra characters that belong to katbroj
  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const currentWordBoundingBox = _.getBoundingBox(currentWord, pages[0]);
    let temp = _.extractTextFromWord(currentWord);

    const bottomOfLookup =
      i !== katBrojWords.length - 1
        ? _.getBoundingBox(katBrojWords[i + 1], pages[0]).top
        : currentWordBoundingBox.bottom + currentWordBoundingBox.height;

    const [extraWord] = _.findWordsInBoundsWithRegex(/.*/, pages[0], {
      x1: currentWordBoundingBox.left,
      x2: currentWordBoundingBox.right,
      y1: currentWordBoundingBox.bottom,
      y2: bottomOfLookup,
    });
    if (extraWord) {
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
    const currentWordBoundingBox = _.getBoundingBox(currentWord, pages[0]);

    const bottomOffset =
      i !== katBrojWords.length - 1
        ? _.getBoundingBox(katBrojWords[i + 1], pages[0]).top -
          currentWordBoundingBox.bottom
        : currentWordBoundingBox.height;

    const nazivWords = _.findAdjacentWordsWithRegex(
      /.*/,
      pages[0],
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

  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [jmj] = _.findAdjacentWordsWithRegex(
      /.*/,
      pages[0],
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

  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [kolicina] = _.findAdjacentWordsWithRegex(
      /.*/,
      pages[0],
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

  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [vpc] = _.findAdjacentWordsWithRegex(
      /.*/,
      pages[0],
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

  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [rabat] = _.findAdjacentWordsWithRegex(
      /.*/,
      pages[0],
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

  for (let i = 0; i < katBrojWords.length; i++) {
    const currentWord = katBrojWords[i];
    const [pdv] = _.findAdjacentWordsWithRegex(
      /.*/,
      pages[0],
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

  const [firstDate] = _.findWordsInBoundsWithRegex(
    /\d{1,2}\.\d{1,2}\.\d{4}/,
    pages[0]
  );
  returnObject.datum_racuna = _.extractTextFromWord(firstDate);

  const [brojRacuna] = _.findWordsInBoundsWithRegex(
    /\d{1,4}-\d{2}-\d{2}/,
    pages[0]
  );
  returnObject.broj_racuna = _.extractTextFromWord(brojRacuna);

  // setPrimka({
  //   datum_racuna: extractTextFromWord(firstDate),
  //   broj_racuna: extractTextFromWord(brojRacuna),
  //   ukupno: tempZapisi?.reduce(
  //     (accumulator: number, current: IZapis) =>
  //       accumulator +
  //       (current?.vpc! * current?.kol! * (100 - current?.rabat!)) / 100,
  //     0
  //   ),
  //   artikli: tempZapisi,
  // });

  console.log(returnObject);
  return returnObject;
};
