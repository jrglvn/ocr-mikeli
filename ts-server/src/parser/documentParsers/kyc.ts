import {
  extractAndFormatDate,
  extractVatNumber,
  findWordObject,
  getBoundingBox,
} from "./_shared";

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

  //#2 dates, find word object containing dates, if word bounding box is in top of page => date is expiry date,
  //otherwise it's assign date
  const dates: Array<any> = findWordObject(
    rawResult,
    /\d{1,2}[\-\s]+[A-Z]\w{2}[\-\s]+\d{4}/
  );

  dates.forEach((date) => {
    const boundingBox = getBoundingBox(rawResult, date.element);
    boundingBox.avgYnormalized < 0.5
      ? (returnObject.expiry_date = date.text.replace(/\s/g, ""))
      : (returnObject.sign_date = date.text.replace(/\s/g, ""));
  });

  //#3 license number
  const licenseRegex = /\d{5,6}/;
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(licenseRegex);
    if (temp) {
      returnObject.license_number = temp[0];
      break;
    }
  }

  //#3 TRN
  const trnRegex = /\d{15}/;
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

  //#

  return returnObject;
};
