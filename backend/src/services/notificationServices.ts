import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import tokenService from './tokenService.js';
import readline from 'readline';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  providerConfig: {
    provider: 'gmail';
    userId: string;
  };
}

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!,
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function getTokens() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('Visit this URL to authorize:', authUrl);

  rl.question('Paste the code here: ', async (code) => {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log({ tokens });
    // Get the user's email address
    const oauth2 = google.oauth2({ auth: oAuth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();

    const email = userInfo.data.email;
    console.log({ email });
    if (!email) {
      console.error('Failed to get user email');
      rl.close();
      return;
    }

    console.log('\n✅ Store this in your DB:');
    console.log({
      provider: 'google',
      userId: 'ibrahimhafez24@gmail.com',
      refreshToken: tokens.refresh_token,
    });

    rl.close();
  });
}

getTokens();

export async function sendEmail(options: EmailOptions) {
  return sendViaGmail(options);
}

async function sendViaGmail(options: EmailOptions) {
  const tokenDoc = await tokenService.getTokens('google', options.providerConfig.userId);
  console.log({ tokenDoc });
  if (!tokenDoc) throw new Error('No Google tokens found for user');

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  );
  oAuth2Client.setCredentials({
    refresh_token: tokenDoc.refreshToken!,
  });

  const { token: accessToken } = await oAuth2Client.getAccessToken();
  if (!accessToken) throw new Error('Failed to get Gmail access token');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: tokenDoc.userId as string,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: tokenDoc.refreshToken,
      accessToken,
    },
  });

  const mailOptions = {
    from: `“No‐Reply” <${tokenDoc.userId}>`,
    to: options.to,
    subject: options.subject,
    text: options.body,
    html: `<p>${options.body}</p>`,
  };

  return transporter.sendMail(mailOptions);
}

export default { sendEmail };
