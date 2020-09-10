"use strict";
const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

import { TKindOfDocument, dispatch } from ".";

export async function parseDocument(
  file: {
    data: any;
    mimetype: "application/pdf" | "image/tiff" | "image/gif";
  },
  options: { kind: TKindOfDocument }
) {
  const client = new ImageAnnotatorClient();

  async function batchAnnotateFiles() {
    const inputConfig = {
      mimeType: file.mimetype,
      content: file.data,
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
  const textToArray = result[0].fullTextAnnotation.text.split(/\r?\n/);

  return dispatch(options.kind, textToArray);

  // return result;
}
