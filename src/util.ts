import fs from "fs";
import readline from "readline";
import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import path from "path";

// Main function to handle the overall process
export async function getGmailAuth() {
  try {
    const credentialsPath = path.join(__dirname, "credentials.json");
    const credentials = await loadCredentials(credentialsPath);
    console.log(credentials);

    const auth = await authorize(credentials);
    const gmail = google.gmail({ version: "v1", auth });
    return gmail;
  } catch (err) {
    console.error("Error:", err);
  }
}

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
