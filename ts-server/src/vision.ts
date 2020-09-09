"use strict";
const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

type TInput = {
  file: { data: any; mimetype: "application/pdf" | "image/tiff" | "image/gif" };
  options: {
    kind: "TRADE_LICENSE" | "VAT_CERTIFICATE" | "ESTABLISHMENT_ID";
  };
};

export async function parsePDF(input: TInput) {
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

  switch (input.options.kind) {
    case "TRADE_LICENSE": {
      const tradeLicense = {
        license_number: null,
        company_name: null,
        expiry_date: null,
      };

      const licenseRegex = /^\d{5,6}$/;
      for (let i = 0; i < 10; i++) {
        const temp = fullTextArray[i].match(licenseRegex);
        if (temp) {
          tradeLicense.license_number = temp[0];
          break;
        }
      }

      const nameRegex = /^.*Name$/;
      for (let i = 0; i < 25; i++) {
        const temp = fullTextArray[i].match(nameRegex);
        if (temp) {
          tradeLicense.company_name = fullTextArray[i + 1];
          break;
        }
      }

      const expiryRegex = /^..\/..\/....$/;
      for (let i = 0; i < 30; i++) {
        const temp = fullTextArray[i].match(expiryRegex);
        if (temp) {
          tradeLicense.expiry_date = temp[0];
          break;
        }
      }

      return { ...tradeLicense, fullTextArray };
    }

    case "ESTABLISHMENT_ID": {
      const establishmentId = {
        license_number: null,
        company_name: null,
        expiry_date: null,
      };
      return { ...establishmentId, fullTextArray };
    }
  }

  // return result;
}
