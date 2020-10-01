"use strict";
const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

export interface IPage {
  pageData: any;
  text: string;
}

export async function parseDocument(file: {
  data: any;
  mimetype: "application/pdf" | "image/tiff" | "image/gif";
}) {
  const client = new ImageAnnotatorClient();
  const inputConfig = {
    mimeType: file.mimetype,
    content: file.data,
  };
  const features = [{ type: "DOCUMENT_TEXT_DETECTION" }];
  const fileRequest = {
    inputConfig: inputConfig,
    features: features,
  };
  const request = {
    requests: [fileRequest],
  };
  const [visionResult] = await client.batchAnnotateFiles(request);

  const pages: Array<IPage> = [];
  visionResult.responses[0].responses.forEach((result) =>
    pages.push({
      pageData: result.fullTextAnnotation.pages[0],
      text: result.fullTextAnnotation.text,
    })
  );

  return [dispatch(pages), pages];
}

export type TKindOfDocument = "UNIMAR" | "VENICO" | "DTD";

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