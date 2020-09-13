import { extractAndFormatDate } from "./_shared";

export interface ITrade {
  license_number: string;
  company_name: string;
  expiry_date: string;
}

export const parseTradeLicense = (data: Array<string>): ITrade => {
  let returnObject = {
    license_number: "",
    company_name: "",
    expiry_date: "",
  } as ITrade;

  const licenseRegex = /^\d{5,6}$/;
  for (let i = 0; i < 10; i++) {
    const temp = data[i].match(licenseRegex);
    if (temp) {
      returnObject.license_number = temp[0];
      break;
    }
  }

  const nameRegex = /^.*Name$/i;
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(nameRegex);
    if (temp) {
      returnObject.company_name = data[i + 1];
      break;
    }
  }

  // #2 get efective registration date, it's usually first occuring date & located in first ~20 entries
  for (let i = 0; i < data.length; i++) {
    const result = extractAndFormatDate(data[i]);
    if (result) {
      returnObject.expiry_date = result;
      break;
    }
  }

  return returnObject;
};
