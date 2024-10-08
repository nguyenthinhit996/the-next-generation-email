import { gmail_v1, google } from "googleapis";
import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { getGmailAuth } from "../util";

export interface GmailBaseToolParams {
  credentials?: {
    clientEmail?: string;
    privateKey?: string;
    keyfile?: string;
    subject?: string;
  };
  scopes?: string[];
}

export abstract class GmailBaseTool extends StructuredTool {
  // private CredentialsSchema = z
  //   .object({
  //     clientEmail: z
  //       .string()
  //       .min(1)
  //       .default(getEnvironmentVariable("GMAIL_CLIENT_EMAIL") ?? ""),
  //     privateKey: z
  //       .string()
  //       .default(getEnvironmentVariable("GMAIL_PRIVATE_KEY") ?? ""),
  //     keyfile: z
  //       .string()
  //       .default(getEnvironmentVariable("GMAIL_KEYFILE") ?? ""),
  //     subject: z
  //       .string()
  //       .default(getEnvironmentVariable("GMAIL_SUBJECT") ?? ""),
  //   })
  //   .refine(
  //     (credentials) =>
  //       credentials.privateKey !== "" || credentials.keyfile !== "",
  //     {
  //       message:
  //         "Missing GMAIL_PRIVATE_KEY or GMAIL_KEYFILE to interact with Gmail",
  //     }
  //   );

  // private GmailBaseToolParamsSchema = z
  //   .object({
  //     credentials: this.CredentialsSchema.default({}),
  //     scopes: z.array(z.string()).default(["https://mail.google.com/"])
  //   })
  //   .default({});

  name = "Gmail";

  description = "A tool to send and view emails through Gmail";

  protected gmail: gmail_v1.Gmail;

  constructor(
    input_gmail: gmail_v1.Gmail,
    fields?: Partial<GmailBaseToolParams>
  ) {
    super(...arguments);
    this.gmail = input_gmail;
  }
}
