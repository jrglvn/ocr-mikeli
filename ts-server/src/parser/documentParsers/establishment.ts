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

  //#1  CAPTURE EXPIRY DATE
  //search for first date in result array of strings
  const expiryRegex = /\d{2,4}[\W\D]+\d{2}[\W\D]+\d{2,4}/;
  for (let i = 0; i < 30; i++) {
    let temp = data[i].match(expiryRegex);
    if (temp) {
      establishmentInfo.expiry_date = temp[0].replace(/[\W\D]+/g, "/"); //replace multiple // or \\
      break;
    }
  }
  //because of arabic text direction sometimes google vision returns inversed date order
  //if years is on first position change order of items inside string
  if (establishmentInfo.expiry_date.match(/^\d{4}/)) {
    const date = establishmentInfo.expiry_date.match(
      /(\d{4})\/(\d{2})\/(\d{2})/
    );
    if (date)
      establishmentInfo.expiry_date = `${date[3]}/${date[2]}/${date[1]}`;
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
