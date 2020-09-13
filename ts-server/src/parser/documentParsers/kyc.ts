import { extractAndFormatDate, extractVatNumber } from "./_shared";

export interface IKyc {
  tax_registration_number: string;
  company_name: string;
  license_number: string;
  expiry_date: string;
  sign_date: string;
  contact_details: string;
  email: string;
  respresentative_name: string;
}

export const parseKyc = (data: Array<string>, rawResult: any): IKyc | any => {
  let returnObject = {
    tax_registration_number: "",
    license_number: "",
    company_name: "",
    expiry_date: "",
    sign_date: "",
    contact_details: "",
    respresentative_name: "",
  } as IKyc;

  //#1 full legal name
  const nameRegex = /full legal name/i;
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(nameRegex);
    if (temp) {
      returnObject.company_name = data[i + 1];
      break;
    }
  }

  //#2 expiry & sign date
  const dateRegex = /\d{1,2}\-[A-Z]\w{2}\-\d{4}/i;
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(dateRegex);
    if (temp) {
      returnObject.expiry_date
        ? (returnObject.sign_date = temp[0])
        : (returnObject.expiry_date = temp[0]);
    }
  }

  //#3 license number
  const licenseRegex = /\d{5,6}/i;
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(licenseRegex);
    if (temp) {
      returnObject.license_number = temp[0];
      break;
    }
  }

  //#3 TRN
  const trnRegex = /\d{15}/i;
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(trnRegex);
    if (temp) {
      returnObject.tax_registration_number = temp[0];
      break;
    }
  }

  //#4 phone number aka contact_details

  const contactRegex = /contact details([\s\d]*)/i;
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(contactRegex);
    if (temp) {
      if (temp[1] !== "") {
        returnObject.contact_details = temp[1].trim();
      } else {
        returnObject.contact_details = data[i + 1];
      }

      break;
    }
  }

  //#5 email
  const emailRegex = /[\d\w\.]+\@[\d\w]+\.[\w]{2,}/i;
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(emailRegex);
    if (temp) {
      returnObject.email = temp[0].toLocaleLowerCase();
      break;
    }
  }

  //#6 representative name
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(/Representative/);
    if (temp) {
      const name = data[i + 1].match(/(?:Name\s?)?(.*)/i);
      if (name && name[1])
        returnObject.respresentative_name = name[1]
          .replace(/\sdesignation/i, "")
          .trim();
      break;
    }
  }

  return returnObject;
};
