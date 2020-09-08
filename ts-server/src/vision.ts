"use strict";
const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

export async function parsePDF(filePDF) {
  const client = new ImageAnnotatorClient();

  async function batchAnnotateFiles() {
    const inputConfig = {
      mimeType: "application/pdf",
      content: filePDF.data,
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
    try {
      const [result] = await client.batchAnnotateFiles(request);
      return result.responses[0].responses;
    } catch (error) {
      console.log(error);
      return { result: "error" };
    }
  }

  const result = await batchAnnotateFiles();
  const splitedResult = result[0].fullTextAnnotation.text.split(/\r?\n/);

  return result;
}
