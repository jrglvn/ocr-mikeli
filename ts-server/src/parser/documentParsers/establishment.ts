export interface IEstablishmentReturnObject {
  license_number: string | null;
  company_name: string | null;
  expiry_date: string | null;
}

export const parseEstablishmentId = (
  data: Array<string>
): IEstablishmentReturnObject => {
  const establishmentId: IEstablishmentReturnObject = {
    license_number: null,
    company_name: null,
    expiry_date: null,
  };

  const expiryRegex = /\d{2,4}[\W\D]+\d{2}[\W\D]+\d{2,4}/;
  for (let i = 0; i < 30; i++) {
    const temp = data[i].match(expiryRegex);
    if (temp) {
      establishmentId.expiry_date = temp[0];
      break;
    }
  }
  establishmentId.expiry_date?.replace(/[\W\D]+/, ".");
  console.log(establishmentId);

  return establishmentId;
};
