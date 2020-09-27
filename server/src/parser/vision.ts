"use strict";
const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

import { dispatch } from "./dispatch";

export interface IPage {
  pageData: any;
  text: string;
}

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

  let visionResult = await batchAnnotateFiles();

  const pages: Array<IPage> = [];
  visionResult.forEach((result) =>
    pages.push({
      pageData: result.fullTextAnnotation.pages[0],
      text: result.fullTextAnnotation.text,
    })
  );

  return [dispatch(pages), pages];
}
