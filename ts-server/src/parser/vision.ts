"use strict";
const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

import { TKindOfDocument, parse } from ".";

type TInput = {
  file: { data: any; mimetype: "application/pdf" | "image/tiff" | "image/gif" };
  options: {
    kind: TKindOfDocument;
  };
};

export async function parseDocument(input: TInput) {
  const client = new ImageAnnotatorClient();

  async function batchAnnotateFiles() {
    const inputConfig = {
      mimeType: input.file.mimetype,
      content: input.file.data,
    };
    const features = [{ type: "DOCUMENT_TEXT_DETECTION" }];
    const fileRequest = {
      inputConfig: inputConfig,
      features: features,
      pages: [1],
    };
    const request = {
      requests: [fileRequest],
    };
    const [result] = await client.batchAnnotateFiles(request);
    return result.responses[0].responses;
  }

  const result = await batchAnnotateFiles();
  const fullTextArray = result[0].fullTextAnnotation.text.split(/\r?\n/);

  return parse(input.options.kind, fullTextArray);

  // return result;
}
