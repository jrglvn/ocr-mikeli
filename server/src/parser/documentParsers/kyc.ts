import {
  extractAndFormatDate,
  extractVatNumber,
  findWordsContainingText,
  extractTextFromWord,
  findParagrapshContainingText,
  getBoundingBox,
  findWordsInBounds,
  getOffsetWords,
} from "./_shared";

export interface IKyc {
  is_valid: boolean;
  tax_registration_number: string;
  company_name: string;
  location: string;
  business_activity: string;
  legal_form: string;
  license_number: string;
  expiry_date: string;
  sign_date: string;
  contact_details: string;
  email: string;
  respresentative_name: string;
  designation: string;
}

export const parseKyc = (data: Array<string>, pages: any): IKyc | any => {
  let returnObject = {
    is_valid: false,
    tax_registration_number: "",
    license_number: "",
    company_name: "",
    location: "",
    business_activity: "",
    legal_form: "",
    expiry_date: "",
    sign_date: "",
    contact_details: "",
    respresentative_name: "",
    designation: "",
  } as IKyc;

  //# CHECK IF DOCUMENT IS VALID
  (function () {
    data.forEach((line) => {
      const regexResult = line.match(/kyc/i);
      if (regexResult && regexResult[0]) {
        returnObject.is_valid = true;
      }
    });
  })();

  if (!returnObject.is_valid) return { is_valid: false };

  // FULL LEGAL NAME
  // * find word with regex "full" from that word look at right and with found words generate full company name
  returnObject.company_name = getOffsetWords(pages, /full/i, 0, {
    x1: 0.3,
    x2: 0.8,
  });

  // LOCATION
  // * find word with regex "full" from that word look at right and with found words generate full company name
  returnObject.location = getOffsetWords(pages, /location/i, 0, {
    x1: 0.3,
    x2: 0.6,
  });

  // BUSINESS ACTIVITY
  returnObject.business_activity = getOffsetWords(pages, /activity/i, 0, {
    x1: 0.3,
    x2: 0.6,
  });

  // LEGAL FORM OF FIRM
  returnObject.legal_form = getOffsetWords(pages, /Specify\)/i, 0, {
    x1: 0.3,
    x2: 0.7,
  });

  // REPRESENTATIVE NAME
  returnObject.respresentative_name = getOffsetWords(
    pages,
    /Representative/,
    0,
    {
      x1: 0.3,
      x2: 0.5,
    }
  );

  // DESIGNATION
  returnObject.designation = getOffsetWords(pages, /designation/i, 0, {
    x1: 0.66,
    x2: 0.9,
  });

  //PHONE NUMBER  = CONTACT_DETAILS
  returnObject.contact_details = getOffsetWords(pages, /details/i, 1, {
    x1: 0.3,
    x2: 0.6,
  });

  //# DATES, find word object containing dates, if word bounding box is in top of page => date is expiry date,
  //otherwise it's assign date
  const dates: Array<any> = findParagrapshContainingText(
    pages,
    /\d{1,2}[\-\s]+[A-Z]\w{2}[\-\s]+\d{4}/
  );

  dates.forEach((date) => {
    const boundingBox = getBoundingBox(date.paragraph, date.page);
    boundingBox.avgY < 0.5
      ? (returnObject.expiry_date = date.result.replace(/\s/g, ""))
      : (returnObject.sign_date = date.result.replace(/\s/g, ""));
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

  //#5 email
  const emailRegex = /[\d\w\.]+\@[\d\w]+\.[\w]{2,}/i;
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].match(emailRegex);
    if (temp) {
      returnObject.email = temp[0].toLocaleLowerCase();
      break;
    }
  }

  return returnObject;
};
