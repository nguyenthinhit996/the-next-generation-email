import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { run } from "./services/gmail";
import { main } from "./services/mail";
import { isValidJSON, parseBacktickJSON } from "./util";

interface MailBody {
  query: string;
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Node.js and Express!");
});

app.post("/mail", async (req: Request<{}, {}, MailBody>, res: Response) => {
  const { query } = req.body; // Here, query is of type string

  console.log("Received query:", query);
  let viewResult = await run(query);
  let outputData = viewResult?.output;
  if (isValidJSON(viewResult?.output)) {
    outputData = parseBacktickJSON(viewResult?.output || "");
  }
  viewResult = { ...viewResult, output: outputData };
  res.send(viewResult);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
