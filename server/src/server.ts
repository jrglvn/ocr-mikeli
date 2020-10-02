const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const app = express();
import { documentToCSV } from "./parser/documentParsers/_shared";
const port = 3001;

import * as fs from "fs";
import { parseDocument } from "./parser";

// enable files upload
app.use(
  fileUpload({
    createParentPath: true,
  })
);

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/upload", async (req, res) => {
  const file = req.files[Object.keys(req.files)[0]];
  const result = await parseDocument(file);

  if (!result[0].error) {
    const csv = documentToCSV(result[0]);
    fs.writeFile(
      `primke/${result[0].dobavljac.split(" ")[0]}_${
        result[0].broj_racuna.split(/\W/)[0]
      }.csv`,
      csv,
      () => {
        console.log(
          `kreirana nova datoteka: ${result[0].dobavljac.split(" ")[0]}_${
            result[0].broj_racuna.split(/\W/)[0]
          }.csv`
        );
      }
    );
  } else console.log("neispravna datoteka");
  res.status(200);
  res.send(result);
});

app.listen(port, () =>
  console.log(`program pokrenut, čekanje ulaznog dokumenta...`)
);
