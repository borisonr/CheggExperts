'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initExpertsStore = initExpertsStore;
exports.updateExpertsInDrive = updateExpertsInDrive;
exports.getExpertsFromDrive = getExpertsFromDrive;

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const path = require('path');
const os = require('os');
const uuid = require('uuid');
const opn = require('opn');

const destroyer = require('server-destroy');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = 'token.json';
let DRIVE;

let fileId;

async function initExpertsStore() {
  await authorize(createExpertsStore);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(callback) {
  console.log(process.env.client_secret);
  const client_secret = process.env.client_secret;
  const client_id = process.env.client_id;
  const redirect_uri = process.env.redirect_uri;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
  //   oAuth2Client.setCredentials({
  // 	  access_token: process.env.access_token, 
  // 	  refresh_token: process.env.refresh_token,
  // 	  scope: "https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file",
  // 	  token_type: "Bearer",
  // 	  expiry_date: process.env.expiry_date
  //   });
  google.options({ auth: oAuth2Client });

  /**
   * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
   */
  await authenticate(SCOPES);
  async function authenticate(scopes) {
    return new Promise((resolve, reject) => {
      // grab the url that will be used for authorization
      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes.join(' ')
      });
      const server = _http2.default.createServer(async (req, res) => {
        try {
          if (req.url.indexOf('/oauth2callback') > -1) {
            const qs = querystring.parse(url.parse(req.url).query);
            res.end('Authentication successful! Please return to the console.');
            server.destroy();
            const { tokens } = await oAuth2Client.getToken(qs.code);
            oAuth2Client.credentials = tokens;
            resolve(oAuth2Client);
          }
        } catch (e) {
          reject(e);
        }
      }).listen(3000, () => {
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, { wait: false }).then(cp => cp.unref());
      });
      destroyer(server);
    });
  }
  callback(oAuth2Client);
}

/**
 * Store the experts table in Drive
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function createExpertsStore(auth) {
  const fileName = 'src/experts.json';
  DRIVE = google.drive({ version: 'v3', auth });
  const fileSize = fs.statSync(fileName).size;
  const fileMetadata = {
    'name': `CheggExperts${Date.now()}.docx`
  };

  const res = await DRIVE.files.create({ media: {
      body: fs.createReadStream(fileName)
    },
    resource: fileMetadata
  }, function (err, file) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      fileId = file.data.id;
    }
  });
}

async function updateExpertsInDrive(experts) {
  DRIVE.files.update({
    fileId,
    media: {
      body: experts
    }
  }, (err, file) => {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      console.log('updated experts successfully');
    }
  });
}

async function getExpertsFromDrive() {
  return new Promise(async (resolve, reject) => {
    const filePath = path.join(os.tmpdir(), uuid.v4());
    console.log(`writing to ${filePath}`);
    const dest = fs.createWriteStream(filePath);
    let progress = 0;
    const res = await DRIVE.files.get({ fileId, alt: 'media' }, function (err, file) {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        resolve(file.data);
      }
    });
  });
}