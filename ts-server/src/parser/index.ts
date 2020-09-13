import {
  IEstablishment,
  parseEstablishmentId,
} from "./documentParsers/establishment";
import { ITrade, parseTradeLicense } from "./documentParsers/tradeLicense";
import { IVat, parseVatCertificate } from "./documentParsers/vatCertificate";
import { ICoc, parseCoc } from "./documentParsers/coc";
import { IKyc, parseKyc } from "./documentParsers/kyc";

export type TKindOfDocument =
  | "TRADE_LICENSE"
  | "VAT_CERTIFICATE"
  | "ESTABLISHMENT_ID"
  | "COC"
  | "KYC";

export const dispatch = (
  kind: TKindOfDocument,
  data: Array<string>,
  rawResult: any
): IEstablishment | ITrade | IVat | ICoc | IKyc => {
  switch (kind) {
    case "TRADE_LICENSE":
      return parseTradeLicense(data);
    case "ESTABLISHMENT_ID":
      return parseEstablishmentId(data);
    case "VAT_CERTIFICATE":
      return parseVatCertificate(data, rawResult);
    case "COC":
      return parseCoc(data, rawResult);
    case "KYC":
      return parseKyc(data, rawResult);
  }
};
