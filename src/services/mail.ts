import fs from "fs";
import readline from "readline";
import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import path from "path";

// Main function to handle the overall process
export async function main() {
  try {
    const credentialsPath = path.join(__dirname, "credentials.json");
    const credentials = await loadCredentials(credentialsPath);
    console.log(credentials);

    const auth = await authorize(credentials);
    await listMessages(auth);
  } catch (err) {
    console.error("Error:", err);
  }
}

// Function to load credentials from a file
function loadCredentials(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, content) => {
      if (err) reject("Error loading client secret file: " + err);
      resolve(JSON.parse(content as unknown as string));
    });
  });
}

// Function to authorize with OAuth2
function authorize(credentials: any): Promise<OAuth2Client> {
  return new Promise((resolve, reject) => {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    console.log(redirect_uris);

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile("token.json", (err, token) => {
      if (err) {
        getAccessToken(oAuth2Client)
          .then((newToken) => {
            oAuth2Client.setCredentials(newToken);
            resolve(oAuth2Client);
          })
          .catch(reject);
      } else {
        oAuth2Client.setCredentials(JSON.parse(token as unknown as string));
        resolve(oAuth2Client);
      }
    });
  });
}

// Function to get a new access token
function getAccessToken(oAuth2Client: OAuth2Client): Promise<any> {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://mail.google.com/"]
    });
    console.log("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) reject("Error retrieving access token: " + err);
        fs.writeFile("token.json", JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log("Token stored to", "token.json");
        });
        resolve(token);
      });
    });
  });
}

// Function to list the latest 10 messages
function listMessages(auth: OAuth2Client): Promise<void> {
  return new Promise((resolve, reject) => {
    const gmail = google.gmail({ version: "v1", auth });
    gmail.users.messages.list(
      {
        userId: "me",
        maxResults: 10 // Get the latest 10 messages
      },
      (err, res) => {
        if (err) return reject("The API returned an error: " + err);
        const messages = res?.data.messages;
        if (!messages || messages.length === 0) {
          console.log("No messages found.");
          return resolve();
        }
        console.log("Messages:");
        messages.forEach((message) => {
          getMessage(auth, message.id!);
        });
        resolve();
      }
    );
  });
}

// Function to get details of a specific message
function getMessage(auth: OAuth2Client, messageId: string): void {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.messages.get(
    {
      userId: "me",
      id: messageId
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const message = res?.data;
      if (!message) return;

      console.log(`Message ID: ${messageId}`);
      console.log(`Snippet: ${message.snippet}`);
      console.log(
        `Date: ${
          message.payload?.headers?.find((header) => header.name === "Date")
            ?.value
        }`
      );
      console.log(
        `From: ${
          message.payload?.headers?.find((header) => header.name === "From")
            ?.value
        }`
      );
      console.log(
        `Subject: ${
          message.payload?.headers?.find((header) => header.name === "Subject")
            ?.value
        }`
      );
      console.log("--------------------------------------");
    }
  );
}
