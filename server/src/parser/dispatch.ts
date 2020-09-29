export type TKindOfDocument = "UNIMAR" | "VENICO" | "DTD";
import {} from "./documentParsers/_shared";
import { IPage } from "./vision";

import { parseUnimar } from "./documentParsers/unimar";
import { parseDtd } from "./documentParsers/dtd";

export const dispatch = (pages: Array<IPage>): any => {
  let kind: TKindOfDocument | undefined;

  const regex_result = pages[0].text.match(/(unimar|venico|dtd)/i);
  if (regex_result) {
    kind = regex_result[0].toString().toUpperCase() as TKindOfDocument;
  }

  if (!kind) return { document: "not identified" };

  switch (kind) {
    case "UNIMAR":
      return parseUnimar(pages);
    case "DTD":
      return parseDtd(pages);
  }
};
