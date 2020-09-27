import * as _ from "./_shared";
import { IPage } from "../vision";

export const parseDtd = (pages: Array<IPage>): _.IDocument | any => {
  let returnObject = { artikli: [] } as _.IDocument;

  //first word with this regex is number of document
  const [firstOib] = _.findWordsInBoundsWithRegex(/^\d{11}$/, pages[0]);
  if (firstOib) returnObject.dobavljac_oib = _.extractTextFromWord(firstOib);

  //first occuring date is date of document
  const [firstDate] = _.findWordsInBoundsWithRegex(
    /\d{1,2}\.\d{1,2}\.\d{4}/,
    pages[0]
  );
  if (firstDate) returnObject.datum_racuna = _.extractTextFromWord(firstDate);

  //first word with this regex is number of document
  const [brojRacuna] = _.findWordsInBoundsWithRegex(
    /\d{1,4}\/\d{2}\/\d{2}/,
    pages[0]
  );
  if (brojRacuna) returnObject.broj_racuna = _.extractTextFromWord(brojRacuna);

  //iterate trought pages to find
  pages.forEach((page) => {
    //find words that should be art.number
    const katBrojWords = _.findWordsInBoundsWithRegex(
      /^\d{5}$/,
      page.pageData,
      {
        x1: 0.075,
        x2: 0.125,
      }
    );

    if (katBrojWords) {
      for (let i = 0; i < katBrojWords.length; i++) {
        returnObject.artikli.push({} as _.IArtikl);
        returnObject.artikli[i].kat_broj = _.extractTextFromWord(
          katBrojWords[i]
        );
      }
    }
  });

  // console.log(returnObject);

  return returnObject;
};
