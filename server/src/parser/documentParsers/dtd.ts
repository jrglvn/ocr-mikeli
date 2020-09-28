import * as foo from "./_shared";
import { IPage } from "../vision";

export const parseDtd = (pages: Array<IPage>): foo.IDocument | any => {
  let returnObject = { artikli: [] } as foo.IDocument;

  //first word with this regex is number of document
  const [firstOib] = foo.findWordsInBoundsWithRegex(
    /^\d{11}$/,
    pages[0].pageData
  );
  if (firstOib) returnObject.dobavljac_oib = foo.extractTextFromWord(firstOib);

  //first occuring date is date of document
  const [firstDate] = foo.findWordsInBoundsWithRegex(
    /\d{1,2}\.\d{1,2}\.\d{4}/,
    pages[0].pageData
  );
  if (firstDate) returnObject.datum_racuna = foo.extractTextFromWord(firstDate);

  //first word with this regex is number of document
  const [brojRacuna] = foo.findWordsInBoundsWithRegex(
    /\d{1,4}\/\d{2}\/\d{2}/,
    pages[0].pageData
  );
  if (brojRacuna)
    returnObject.broj_racuna = foo.extractTextFromWord(brojRacuna);

  //iterate trought pages to find
  pages.forEach((page) => {
    //find words that should be broj_artikla, and they server as search point for all other
    const katBrojWords = foo.findWordsInBoundsWithRegex(
      /^\d{5}$/,
      page.pageData,
      {
        x1: 0.075,
        x2: 0.125,
      }
    );

    katBrojWords?.forEach((currentWord) => {
      let currentArtikl = {} as foo.IArtikl;
      currentArtikl.pdv_stopa = 25.0;

      //get kat_broj value from found object
      currentArtikl.kat_broj = foo.extractTextFromWord(currentWord);

      //get bar_code word and extract text from it
      const [barcodeWord] = foo.findAdjacentWordsWithRegex(
        /\d{13}/,
        page.pageData,
        { element: currentWord },
        { x1: 0.15, x2: 0.25 }
      );
      if (barcodeWord)
        currentArtikl.bar_code = foo.extractTextFromWord(barcodeWord);

      const nazivWords = foo.findAdjacentWordsWithRegex(
        /.*/,
        page.pageData,
        { element: currentWord },
        { x1: 0.25, x2: 0.5 }
      );
      if (nazivWords.length)
        currentArtikl.naziv = nazivWords
          .map((word) => foo.extractTextFromWord(word))
          .join(" ");

      const [jmjWord] = foo.findAdjacentWordsWithRegex(
        /\w+/,
        page.pageData,
        { element: currentWord },
        { x1: 0.55, x2: 0.625 }
      );
      if (jmjWord) currentArtikl.jmj = foo.extractTextFromWord(jmjWord);

      const [kolicinaWord] = foo.findAdjacentWordsWithRegex(
        /\d+/,
        page.pageData,
        { element: currentWord },
        { x1: 0.625, x2: 0.7 }
      );
      if (kolicinaWord)
        currentArtikl.kolicina = parseFloat(
          foo.extractTextFromWord(kolicinaWord)
        );

      const [cijenaWord] = foo.findAdjacentWordsWithRegex(
        /.*/,
        page.pageData,
        { element: currentWord },
        { x1: 0.7, x2: 0.75 }
      );
      if (cijenaWord)
        currentArtikl.vpc = parseFloat(
          foo
            .extractTextFromWord(cijenaWord)
            .toString()
            .replace(".", "")
            .replace(",", ".")
        );

      const [rabatWord] = foo.findAdjacentWordsWithRegex(
        /.*/,
        page.pageData,
        { element: currentWord },
        { x1: 0.75, x2: 0.78 }
      );
      if (rabatWord)
        currentArtikl.rabat = parseFloat(
          foo
            .extractTextFromWord(rabatWord)
            .toString()
            .replace(".", "")
            .replace(",", ".")
        );

      //end
      returnObject.artikli.push(currentArtikl);
      //end
    });
  });

  console.log(
    "ukupno: ",
    returnObject.artikli.reduce((acc: number, current: foo.IArtikl) => {
      return acc + current?.kolicina!;
    }, 0)
  );

  // console.log(returnObject);

  return returnObject;
};
