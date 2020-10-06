import * as foo from "./_shared";
import { IPage } from "../";

export const parseMotomarine = (file): foo.IDocument | any => {
  const date = new Date();
  let returnObject = {
    dobavljac: "MOTOMARINE S.r.l.",
    oib: "00968120329",
    artikli: [],
  } as foo.IDocument;

  const lines: Array<string> = file.data.toString().split(/\r?\n/);
  returnObject.broj_racuna = lines[1].split(";")[3].replace(/"/g, "");
  returnObject.datum_racuna = lines[1]
    .split(";")[2]
    .replace(/["=]/g, "")
    .replace(/-/g, ".");

  const JMJ_TRANSLATE = {
    PZ: "kom",
    CF: "pak",
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].split(";");

    if (line?.length === 12) {
      const currentArtikal = {} as foo.IArtikl;
      currentArtikal.pdv_stopa = 25;
      currentArtikal.rabat = 0;
      currentArtikal.bar_code = "";
      currentArtikal.kat_broj = line[5].replace(/["=]/g, "");
      currentArtikal.naziv = line[6].replace(/"/g, "");
      currentArtikal.kolicina = parseFloat(
        line[8].replace(/\./g, "").replace(",", ".")
      );
      currentArtikal.vpc = parseFloat(
        line[9].replace(/\./g, "").replace(",", ".")
      );
      const jmj = line[7].replace(/"/g, "");
      currentArtikal.jmj = JMJ_TRANSLATE[jmj];

      returnObject.artikli.push(currentArtikal);
    }
  }

  return returnObject;
};
