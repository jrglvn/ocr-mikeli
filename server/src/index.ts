const express = require("express");

const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const app = express();

const port = 3001;

import { parseDocument } from "./parser/vision";

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

app.get("/", (req, res) => res.send("Hello World!"));

app.post("/upload", async (req, res) => {
  const file = req.files[Object.keys(req.files)[0]];
  const result = await parseDocument(file);
  res.status(200);
  res.send(result);
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
