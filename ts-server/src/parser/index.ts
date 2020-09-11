import {
  IEstablishmentReturnObject,
  parseEstablishmentId,
} from "./documentParsers/establishment";
import {
  ITradeLicenseReturnObject,
  parseTradeLicense,
} from "./documentParsers/tradeLicense";
import {
  IVatCertificateReturnObject,
  parseVatCertificate,
} from "./documentParsers/vatCertificate";

export type TKindOfDocument =
  | "TRADE_LICENSE"
  | "VAT_CERTIFICATE"
  | "ESTABLISHMENT_ID";

export const dispatch = (
  kind: TKindOfDocument,
  data: Array<string>,
  rawResult: any
): IEstablishmentReturnObject | ITradeLicenseReturnObject | any => {
  switch (kind) {
    case "TRADE_LICENSE":
      return parseTradeLicense(data);
    case "ESTABLISHMENT_ID":
      return parseEstablishmentId(data);
    case "VAT_CERTIFICATE":
      return parseVatCertificate(data, rawResult);
  }
};
