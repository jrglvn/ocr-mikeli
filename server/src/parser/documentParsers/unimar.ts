import * as foo from "./_shared";
import { IPage } from "../vision";

export const parseUnimar = (pages: Array<IPage>): foo.IDocument | any => {
  let returnObject = { artikli: [] } as foo.IDocument;
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

  //first word with this regex is number of document
  const [firstOib] = foo.findWordsInBoundsWithRegex(/^\d{11}$/, firstPage);
  if (firstOib) returnObject.dobavljac_oib = foo.extractTextFromWord(firstOib);

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

      const bottomOfLookup =
        index !== katBrojWords.length - 1
          ? foo.getBoundingBox(katBrojWords[index + 1], currentPage).top
          : currentWordBoundingBox.bottom + currentWordBoundingBox.height;

      const [extraWord] = foo.findWordsInBoundsWithRegex(/.*/, currentPage, {
        x1: currentWordBoundingBox.left,
        x2: currentWordBoundingBox.right,
        y1: currentWordBoundingBox.bottom,
        y2: bottomOfLookup,
      });
      if (extraWord && !extraWord[0]?.match(/ukupno/i)) {
        temp += foo.extractTextFromWord(extraWord);
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
      currentArtikl.kat_broj = formatted;

      const nazivWords = foo.findWordsInBoundsWithRegex(/.*/, currentPage, {
        x1: 0.15,
        x2: 0.375,
        y1: currentWordBoundingBox.top,
        y2: bottomOfLookup,
      });
      if (nazivWords?.length) {
        const nazivWordsText = nazivWords.map((word) =>
          foo.extractTextFromWord(word)
        );
        nazivWordsText.splice(1, 0, currentArtikl.kat_broj);
        nazivWordsText[0] = nazivWordsText[0].toString().toUpperCase();
        currentArtikl.naziv = nazivWordsText.join(" ");
        // while (true) {
        //   const token = currentArtikl.naziv?.match(/\s?([^\w\s\.\,])\s?/);
        //   if (!token) break;
        //   console.log("token: ", token[1]);
        //   const temp = currentArtikl.naziv
        //     ?.toString()
        //     .replace(`/\s?${token[1]}\s?/`, token[1]);
        //   currentArtikl.naziv = temp;
        // }
      }

      // find jedinicne mjere value

      const [jmjWord] = foo.findAdjacentWordsWithRegex(
        /.*/,
        currentPage,
        {
          element: currentWord,
        },
        { x1: 0.375, x2: 0.42 }
      );
      if (jmjWord) {
        currentArtikl.jmj = foo
          .extractTextFromWord(jmjWord)
          .toString()
          .toLowerCase();
      }

      //find kolicina words

      const [kolicinaWord] = foo.findAdjacentWordsWithRegex(
        /.*/,
        currentPage,
        {
          element: currentWord,
        },
        { x1: 0.42, x2: 0.5 }
      );
      if (kolicinaWord) {
        currentArtikl.kolicina = parseFloat(
          foo
            .extractTextFromWord(kolicinaWord)
            .replace(".", "")
            .replace(",", ".")
        );
      }

      //find vpc words
      const [vpcWord] = foo.findAdjacentWordsWithRegex(
        /.*/,
        currentPage,
        {
          element: currentWord,
        },
        { x1: 0.5, x2: 0.6 }
      );
      if (vpcWord) {
        currentArtikl.vpc = parseFloat(
          foo.extractTextFromWord(vpcWord).replace(".", "").replace(",", ".")
        );
      }

      //find rabat words
      const [rabatWord] = foo.findAdjacentWordsWithRegex(
        /.*/,
        currentPage,
        {
          element: currentWord,
        },
        { x1: 0.65, x2: 0.75 }
      );
      if (rabatWord) {
        currentArtikl.rabat = parseFloat(
          foo.extractTextFromWord(rabatWord).replace(".", "").replace(",", ".")
        );
      }
      //ignored because all items from this suplier have 25% PDV
      //find pdv value word, and from it calculate PDV_rate
      // const [pdvWord] = foo.findAdjacentWordsWithRegex(
      //   /.*/,
      //   currentPage,
      //   {
      //     element: currentWord,
      //   },
      //   { x1: 0.8, x2: 0.875 }
      // );
      // if (pdvWord) {
      //   currentArtikl.pdv_stopa = Math.round(
      //     (parseFloat(
      //       foo.extractTextFromWord(pdvWord).replace(".", "").replace(",", ".")
      //     ) /
      //       (((currentArtikl.vpc! * (100 - currentArtikl.rabat!)) / 100) *
      //         currentArtikl.kolicina!)) *
      //       100
      //   );
      // }
      returnObject.artikli.push(currentArtikl);
    });
  });

  return returnObject;
};
