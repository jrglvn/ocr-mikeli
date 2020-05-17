"use strict";

function parsePDF(filePDF) {
  // Imports the Google Cloud client libraries
  const { ImageAnnotatorClient } = require("@google-cloud/vision").v1;

  // Instantiates a client
  const client = new ImageAnnotatorClient();

  // You can send multiple files to be annotated, this sample demonstrates how to do this with
  // one file. If you want to use multiple files, you have to create a request object for each file that you want annotated.
  async function batchAnnotateFiles() {
    // First Specify the input config with the file's path and its type.
    // Supported mime_type: application/pdf, image/tiff, image/gif
    // https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#inputconfig
    const inputConfig = {
      mimeType: "application/pdf",
      content: filePDF.data,
    };

    // Set the type of annotation you want to perform on the file
    // https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#google.cloud.vision.v1.Feature.Type
    const features = [{ type: "DOCUMENT_TEXT_DETECTION" }];

    // Build the request object for that one file. Note: for additional files you have to create
    // additional file request objects and store them in a list to be used below.
    // Since we are sending a file of type `application/pdf`, we can use the `pages` field to
    // specify which pages to process. The service can process up to 5 pages per document file.
    // https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#google.cloud.vision.v1.AnnotateFileRequest
    const fileRequest = {
      inputConfig: inputConfig,
      features: features,
      // Annotate the first two pages and the last one (max 5 pages)
      // First page starts at 1, and not 0. Last page is -1.
      pages: [],
    };

    // Add each `AnnotateFileRequest` object to the batch request.
    const request = {
      requests: [fileRequest],
    };

    // Make the synchronous batch request.
    const [result] = await client.batchAnnotateFiles(request);

    // Process the results, just get the first result, since only one file was sent in this
    // sample.

    return result.responses[0].responses;
  }

  return batchAnnotateFiles();
  // [END vision_batch_annotate_files]
}

module.exports = parsePDF;
