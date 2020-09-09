export interface ITradeLicenseReturnObject {
  license_number: string | null;
  company_name: string | null;
  expiry_date: string | null;
}

export const parseTradeLicense = (
  data: Array<string>
): ITradeLicenseReturnObject => {
  const tradeLicense = {
    license_number: null,
    company_name: null,
    expiry_date: null,
  } as ITradeLicenseReturnObject;

  const licenseRegex = /^\d{5,6}$/;
  for (let i = 0; i < 10; i++) {
    const temp = data[i].match(licenseRegex);
    if (temp) {
      tradeLicense.license_number = temp[0];
      break;
    }
  }

  const nameRegex = /^.*Name$/;
  for (let i = 0; i < 25; i++) {
    const temp = data[i].match(nameRegex);
    if (temp) {
      tradeLicense.company_name = data[i + 1];
      break;
    }
  }

  const expiryRegex = /^\d{2}[\W\D]\d{2}[\W\D]\d{4}$/;
  for (let i = 0; i < 30; i++) {
    const temp = data[i].match(expiryRegex);
    if (temp) {
      tradeLicense.expiry_date = temp[0];
      break;
    }
  }

  return tradeLicense;
};
