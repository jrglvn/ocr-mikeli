export type TKindOfDocument = "UNIMAR" | "VENICO" | "DTD";
import {} from "./documentParsers/_shared";

import { parseUnimar } from "./documentParsers/unimar";

export const dispatch = (data: {
  pages: Array<any>;
  textArray: Array<string>;
}): any => {
  //detect suplier and dispatch for parse

  let kind: TKindOfDocument | undefined;

  for (let i = 0; i < data.textArray.length; i++) {
    const regex_result = data.textArray[i].match(/(unimar|venico|dtd)/i);
    if (regex_result) {
      kind = regex_result[0].toString().toUpperCase() as TKindOfDocument;
      break;
    }
  }

  if (!kind) return;

  switch (kind) {
    case "UNIMAR":
      return parseUnimar(data);
  }
};
