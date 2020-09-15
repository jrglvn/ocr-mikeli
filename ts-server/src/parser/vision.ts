"use strict";
const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

import { TKindOfDocument, dispatch } from ".";

export async function parseDocument(
  file: {
    data: any;
    mimetype: "application/pdf" | "image/tiff" | "image/gif";
  },
  kind: TKindOfDocument
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
      pages: [1, 2, 3, 4, 5],
    };
    const request = {
      requests: [fileRequest],
    };
    const [result] = await client.batchAnnotateFiles(request);
    return result.responses[0].responses;
  }

  let result = await batchAnnotateFiles();
  let pages = result[0].fullTextAnnotation.pages;
  pages.forEach((page) => {
    const kArray: Array<number> = [];
    page.blocks.forEach((block) => {
      const vertices = block.boundingBox.normalizedVertices.length
        ? block.boundingBox.normalizedVertices
        : block.boundingBox.vertices;
      kArray.push(
        (vertices[1].y - vertices[0].y) / (vertices[1].x - vertices[0].x)
      );
    });
    let sum = kArray.reduce((acc, current) => (acc += current)) / kArray.length;
    page.kFactor = sum;
  });

  const textToArray = result[0].fullTextAnnotation.text.split(/\r?\n/);
  return [dispatch(kind, textToArray, pages), result];
}
