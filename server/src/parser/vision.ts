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
