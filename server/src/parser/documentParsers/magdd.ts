import * as foo from "./_shared";
import { IPage } from "../";

export const parseMagdd = (pages: Array<IPage>): foo.IDocument | any => {
  let returnObject = {
    dobavljac: "M.A.G.D.D. d.o.o.",
    oib: "41435588068",
    artikli: [],
  } as foo.IDocument;
  const firstPage = pages[0].pageData;

  //first occuring date is date of document
  const [firstDate] = foo.findWordsInBoundsWithRegex(
    /\d{1,2}\.\d{1,2}\.\d{4}/,
    firstPage
  );
  if (firstDate) returnObject.datum_racuna = foo.extractTextFromWord(firstDate);

  //first word with this regex is number of document
  const [brojRacuna] = foo.findWordsInBoundsWithRegex(
    /\d{1,4}-\d{2}-\d{2}/,
    firstPage
  );
  if (brojRacuna)
    returnObject.broj_racuna = foo.extractTextFromWord(brojRacuna);

  pages.forEach((page) => {
    const currentPage = page.pageData;
    //find words that should be art.number
    const katBrojWords = foo.findWordsInBoundsWithRegex(
      /^\d{7,8}(\w?){2,3}/,
      currentPage,
      {
        x1: 0,
        x2: 0.175,
      }
    );

    //#initialize array of empty IArtikl objects

    katBrojWords?.forEach((currentWord, index) => {
      //set default values
      let currentArtikl = {
        bar_code: "",
        jmj: "",
        kat_broj: "",
        naziv: "",
        kolicina: -1,
        rabat: -1,
        vpc: -1,
        pdv_stopa: 25,
      } as foo.IArtikl;

      //#check in space below/between katbroj for extra characters that belong to katbroj
      const currentWordBoundingBox = foo.getBoundingBox(
        currentWord,
        currentPage
      );
      let temp = foo.extractTextFromWord(currentWord);

      //   const bottomOfLookup =
      //     index !== katBrojWords.length - 1
      //       ? foo.getBoundingBox(katBrojWords[index + 1], currentPage).top
      //       : currentWordBoundingBox.bottom + currentWordBoundingBox.height;

      returnObject.artikli.push(currentArtikl);
    });
  });

  return returnObject;
};
