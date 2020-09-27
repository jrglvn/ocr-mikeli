"use strict";
const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

import { dispatch } from "./dispatch";

export async function parseDocument(file: {
  data: any;
  mimetype: "application/pdf" | "image/tiff" | "image/gif";
}) {
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
    };
    const request = {
      requests: [fileRequest],
    };
    const [result] = await client.batchAnnotateFiles(request);
    return result.responses[0].responses;
  }

  let visonRawResult = await batchAnnotateFiles();
  let pages = visonRawResult[0].fullTextAnnotation.pages;
  let textArray = visonRawResult[0].fullTextAnnotation.text.split(/\r?\n/);

  return [
    dispatch({ pages, textArray }),
    { pages, text: visonRawResult[0].fullTextAnnotation.text },
  ];
}
