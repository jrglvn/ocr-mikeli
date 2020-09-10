import { extractAndFormatDate } from "./_shared";

export interface IEstablishmentReturnObject {
  license_number: string;
  company_name: string;
  expiry_date: string;
}

export const parseEstablishmentId = (
  data: Array<string>
): IEstablishmentReturnObject => {
  let establishmentInfo = {
    company_name: "",
    license_number: "",
    expiry_date: "",
  };

  // # get efective registration date, it's usually first occuring date & located in first ~20 entries
  for (let i = 0; i < 30; i++) {
    const result = extractAndFormatDate(data[i]);
    if (result) {
      establishmentInfo.expiry_date = result;
      break;
    }
  }

  //#2  CAPTURE NAME OF COMPANY
  for (let i = 0; i < 20; i++) {
    let temp = data[i].match(/Name\s*\:\s*(.*)/);
    if (temp) {
      temp[1] !== ""
        ? (establishmentInfo.company_name = temp[1])
        : (establishmentInfo.company_name = data[i + 1]);
      break;
    }
  }

  //#3 capture license_id of company

  return establishmentInfo;
};
