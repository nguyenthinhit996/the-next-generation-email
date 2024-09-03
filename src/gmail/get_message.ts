import { z } from "zod";
import { GmailBaseToolParams, GmailBaseTool } from "./base";
import { GET_MESSAGE_DESCRIPTION } from "./descriptions";
import { gmail_v1 } from "googleapis";
import {
  decodeBase64Url,
  extractTextFromHtml,
  getBodyFromParts,
  truncateText
} from "../util";

export class GmailGetMessage extends GmailBaseTool {
  name = "gmail_get_message";

  schema = z.object({
    messageId: z.string()
  });

  description = GET_MESSAGE_DESCRIPTION;

  constructor(gmail: gmail_v1.Gmail, fields?: GmailBaseToolParams) {
    super(gmail, fields);
  }

  async _call(arg: z.output<typeof this.schema>) {
    const { messageId } = arg;

    const messageData = await this.gmail.users.messages.get({
      userId: "me",
      format: "full",
      id: messageId
    });

    console.log("GET_MESSAGE_DESCRIPTION", messageData);

    // const messageData = await this.gmail.users.messages.get({
    //   userId: "me",
    //   format: "full",
    //   id: message.id ?? ""
    // });

    // const { data } = message;

    // if (!data) {
    //   console.log("No data returned from Gmail");
    //   throw new Error("No data returned from Gmail");
    // }

    // const { payload } = data;

    // if (!payload) {
    //   console.log("No payload returned from Gmail");
    //   throw new Error("No payload returned from Gmail");
    // }

    // const { headers } = payload;

    // if (!headers) {
    //   console.log("No headers returned from Gmail");
    //   throw new Error("No headers returned from Gmail");
    // }

    // const subject = headers.find((header) => header.name === "Subject");

    // if (!subject) {
    //   console.log("No subject returned from Gmail");
    //   throw new Error("No subject returned from Gmail");
    // }

    // const body = headers.find((header) => header.name === "Body");

    // if (!body) {
    //   console.log("No body returned from Gmail");
    //   throw new Error("No body returned from Gmail");
    // }

    // const from = headers.find((header) => header.name === "From");

    // if (!from) {
    //   console.log("No from returned from Gmail");
    //   throw new Error("No from returned from Gmail");
    // }

    // const to = headers.find((header) => header.name === "To");

    // if (!to) {
    //   console.log("No to returned from Gmail");
    //   throw new Error("No to returned from Gmail");
    // }

    // const date = headers.find((header) => header.name === "Date");

    // if (!date) {
    //   console.log("No date returned from Gmail");
    //   throw new Error("No date returned from Gmail");
    // }

    // const messageIdHeader = headers.find(
    //   (header) => header.name === "Message-ID"
    // );

    // if (!messageIdHeader) {
    //   console.log("No messageIdHeader returned from Gmail");
    //   throw new Error("No message id returned from Gmail");
    // }

    const headers = messageData.data.payload?.headers || [];

    const subject = headers.find((header) => header.name === "Subject");
    const sender = headers.find((header) => header.name === "From");
    const to = headers.find((header) => header.name === "To");
    const date = headers.find((header) => header.name === "Date");
    const messageIdHeader = headers.find(
      (header) => header.name === "Message-ID"
    );

    console.log("messageData.data.payload?.parts", messageData.data.payload);
    let body = "";
    if (messageData.data.payload?.body) {
      // If body data exists directly on the payload
      body = decodeBase64Url(messageData.data.payload?.body.data || "");

      // If the MIME type is HTML, extract text from HTML
      if (messageData.data.payload?.mimeType === "text/html") {
        body = extractTextFromHtml(body);
      }
    } else if (messageData.data.payload?.parts) {
      const { textBody, htmlBody } = getBodyFromParts(
        messageData.data.payload?.parts
      );
      body = textBody || htmlBody;
    }

    return `Result for the prompt ${messageId} \n${JSON.stringify({
      subject: subject?.value,
      body: truncateText(body, 100),
      from: sender?.value,
      to: to?.value,
      date: date?.value,
      messageId: messageIdHeader?.value
    })}`;
  }
}
