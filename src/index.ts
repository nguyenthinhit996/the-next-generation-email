import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { run } from "./services/gmail";
import { main } from "./services/mail";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Node.js and Express!");
});

app.get("/mail/draft", async (req: Request, res: Response) => {
  const viewResult = await run();
  console.log("viewResult", viewResult);

  res.send(viewResult);
});

app.get("/test", async (req: Request, res: Response) => {
  const viewResult = await main();
  console.log("viewResult", viewResult);

  res.send(viewResult);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
