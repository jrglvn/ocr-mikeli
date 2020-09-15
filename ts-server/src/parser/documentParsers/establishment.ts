import { extractAndFormatDate } from "./_shared";

export interface IEstablishment {
  is_valid: boolean;
  company_name: string;
  expiry_date: string;
  establishment_id: string;
}

export const parseEstablishmentId = (
  data: Array<string>
): IEstablishment | any => {
  let returnObject = {
    is_valid: true,
    company_name: "",
    expiry_date: "",
    establishment_id: "",
  };

  // # get efective registration date, it's usually first occuring date & located in first ~20 entries
  for (let i = 0; i < data.length; i++) {
    const result = extractAndFormatDate(data[i]);
    if (result) {
      returnObject.expiry_date = result;
      break;
    }
  }

  //#2  CAPTURE NAME OF COMPANY
  // if capture group next to name is empty, company name is in next line
  for (let i = 0; i < data.length; i++) {
    let temp = data[i].match(/Name\s*\:\s*(.*)/i);
    if (temp) {
      temp[1] !== ""
        ? (returnObject.company_name = temp[1])
        : (returnObject.company_name = data[i + 1]);
      break;
    }
  }

  //#3 capture establishment_id of company
  for (let i = 0; i < data.length; i++) {
    let temp = data[i].match(/\d[\W\D]\d[\W\D]\d{6}/);
    if (temp) {
      returnObject.establishment_id = temp[0];
      break;
    }
  }
  if (!returnObject.establishment_id) return { is_valid: false };

  return returnObject;
};
