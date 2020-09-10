import { extractAndFormatDate } from "./_shared";

export interface IVatCertificateReturnObject {
  license_number: string;
  company_name: string;
  expiry_date: string;
  tax_registration_number: string;
}

export const parseVatCertificate = (
  data: Array<string>
): IVatCertificateReturnObject | any => {
  let vatCertificateInfo = {
    company_name: "",
    license_number: "",
    expiry_date: "",
    tax_registration_number: "",
  };

  // #1 get tax registration number (usually its in first 20 entries)
  for (let i = 0; i < 30; i++) {
    const temp = data[i].match(/\d{15}/);
    if (temp) {
      vatCertificateInfo.tax_registration_number = temp[0];
      break;
    }
  }

  // #2 get efective registration date, it's usually first occuring date & located in first ~20 entries
  for (let i = 0; i < 30; i++) {
    const result = extractAndFormatDate(data[i]);
    if (result) {
      vatCertificateInfo.expiry_date = result;
      break;
    }
  }

  return vatCertificateInfo;
  //   return vatCertificateInfo;
};
