import {
  IEstablishmentReturnObject,
  parseEstablishmentId,
} from "./documentParsers/establishment";
import {
  ITradeLicenseReturnObject,
  parseTradeLicense,
} from "./documentParsers/tradeLicense";

export type TKindOfDocument =
  | "TRADE_LICENSE"
  | "VAT_CERTIFICATE"
  | "ESTABLISHMENT_ID";

export const parse = (
  kind: TKindOfDocument,
  data: Array<string>
): IEstablishmentReturnObject | ITradeLicenseReturnObject | any => {
  switch (kind) {
    case "TRADE_LICENSE":
      return parseTradeLicense(data);
    case "ESTABLISHMENT_ID":
      return parseEstablishmentId(data);
  }
};
