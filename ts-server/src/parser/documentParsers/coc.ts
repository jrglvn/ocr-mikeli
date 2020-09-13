import { extractAndFormatDate, extractVatNumber } from "./_shared";

export interface ICoc {
  policy_number: string;
  company_name: string;
  start_date: string;
  expiry_date: string;
}

export const parseCoc = (data: Array<string>, rawResult: any): ICoc | any => {
  let returnObject = {
    policy_number: "",
    company_name: "",
    start_date: "",
    expiry_date: "",
  } as ICoc;

  // #1 get tax registration number (usually its in first 20 entries)

  return returnObject;
  //   return returnObject;
};
