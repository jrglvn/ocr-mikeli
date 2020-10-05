import * as foo from "./_shared";
import { IPage } from "../";

export const parseMotomarine = (pages: Array<IPage>): foo.IDocument | any => {
  const date = new Date();
  let returnObject = {
    dobavljac: "MOTOMARINE S.r.l.",
    oib: "00968120329",
    artikli: [],
    broj_racuna: date.getTime().toString(),
  } as foo.IDocument;
  const firstPage = pages[0].pageData as IPage;

  const firstPageWordObjects = foo.getWordObjectsFromPage(firstPage);

  //first occuring date is date of document
  //broj racuna is always word before date
  for (let i = 0; i < firstPageWordObjects.length; i++) {
    const regexResult = foo
      .extractTextFromWord(firstPageWordObjects[i])
      .match(/(\d{1,2})\/(\d{2})\/(\d{2})/);
    if (regexResult?.length) {
      returnObject.datum_racuna =
        regexResult[1] + "." + regexResult[2] + ".20" + regexResult[3];
      returnObject.broj_racuna = foo.extractTextFromWord(
        firstPageWordObjects[i - 1]
      );
      break;
    }
  }

  pages.forEach((page) => {
    const currentPage = page.pageData;
    //find words that should be art.number
    const katBrojWords = foo.findWordsInBoundsWithRegex(
      /^\d{7,10}/,
      currentPage,
      {
        x1: 0,
        x2: 0.15,
        y1: 0.2,
      }
    );
    katBrojWords?.forEach((currentWord) => {
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
      const currentWordBoundingBox = foo.getBoundingBox(
        currentWord,
        currentPage
      );
      ///implement rest
    });
  });

  return returnObject;
};
