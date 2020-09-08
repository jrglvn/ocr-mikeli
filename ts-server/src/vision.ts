"use strict";
const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

type TInput = {
  file: { data: any };
  options: {
    kind: "TRADE_LICENSE";
  };
};

export async function parsePDF(input: TInput) {
  const client = new ImageAnnotatorClient();

  async function batchAnnotateFiles() {
    const inputConfig = {
      mimeType: "application/pdf",
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

  return new Promise(async (resolve, reject) => {
    resolve(splitedResult);
  });
}
