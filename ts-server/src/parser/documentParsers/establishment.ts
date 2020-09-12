import { extractAndFormatDate } from "./_shared";

export interface IEstablishmentReturnObject {
  company_name: string;
  expiry_date: string;
}

export const parseEstablishmentId = (
  data: Array<string>
): IEstablishmentReturnObject => {
  let establishmentInfo = {
    company_name: "",
    expiry_date: "",
  };

  // # get efective registration date, it's usually first occuring date & located in first ~20 entries
  for (let i = 0; i < data.length; i++) {
    const result = extractAndFormatDate(data[i]);
    if (result) {
      establishmentInfo.expiry_date = result;
      break;
    }
  }

  //#2  CAPTURE NAME OF COMPANY
  // if capture group next to name is empty, company name is in next line
  for (let i = 0; i < data.length; i++) {
    let temp = data[i].match(/Name\s*\:\s*(.*)/i);
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
