import { z } from "zod";
import { GmailBaseTool, GmailBaseToolParams } from "./base";
import { CREATE_DRAFT_DESCRIPTION } from "./descriptions";
import { gmail_v1 } from "googleapis";

export class GmailCreateDraft extends GmailBaseTool {
  name = "create_gmail_draft";

  schema = z.object({
    message: z.string(),
    to: z.array(z.string()),
    subject: z.string(),
    cc: z.optional(
      z.array(z.string()).describe("to show someone into this email")
    ),
    bcc: z.array(z.string()).optional()
  });

  description = CREATE_DRAFT_DESCRIPTION;

  constructor(gmail: gmail_v1.Gmail, fields?: GmailBaseToolParams) {
    super(gmail, fields);
  }

  private prepareDraftMessage(
    message: string,
    to: string[],
    subject: string,
    cc?: string[],
    bcc?: string[]
  ) {
    const draftMessage = {
      message: {
        raw: ""
      }
    };

    const email = [
      `To: ${to.join(", ")}`,
      `Subject: ${subject}`,
      cc ? `Cc: ${cc.join(", ")}` : "",
      bcc ? `Bcc: ${bcc.join(", ")}` : "",
      "",
      message
    ].join("\n");

    draftMessage.message.raw = Buffer.from(email).toString("base64url");

    return draftMessage;
  }

  async _call(arg: z.output<typeof this.schema>) {
    const { message, to, subject, cc, bcc } = arg;
    const create_message = this.prepareDraftMessage(
      message,
      to,
      subject,
      cc,
      bcc
    );

    const response = await this.gmail.users.drafts.create({
      userId: "me",
      requestBody: create_message
    });

    return `Draft created. Draft Id: ${response.data.id}`;
  }
}

export type CreateDraftSchema = {
  message: string;
  to: string[];
  subject: string;
  cc?: string[];
  bcc?: string[];
};
