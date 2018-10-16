const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const path = require('path');
const os = require('os');
const uuid = require('uuid');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = 'token.json';
let DRIVE;

let fileId;

export function initExpertsStore() {
// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), createExpertsStore);
});
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Store the experts table in Drive
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function createExpertsStore(auth) {
  const fileName = 'src/experts.json'
  DRIVE = google.drive({version: 'v3', auth});
  const fileSize = fs.statSync(fileName).size;
  const fileMetadata = {
	'name': `CheggExperts${Date.now()}.docx`
  };

  const res = await DRIVE.files.create(
    { media: {
        body: fs.createReadStream(fileName),
	  },
	  resource: fileMetadata
    },
	function (err, file) {
		if (err) {
		  // Handle error
		  console.error(err);
		} else {
			fileId = file.data.id
		}
	  }
  );
}

export async function updateExpertsInDrive(experts){
	DRIVE.files.update(
		{
			fileId,
			media: {
				body: experts,
			  },
		},
		(err, file) => {
			if (err) {
				// Handle error
				console.error(err);
			  } else {
				  console.log('updated experts successfully')
			  }
		}
	)

}

export async function getExpertsFromDrive() {
	return new Promise(async (resolve, reject) => {
	  const filePath = path.join(os.tmpdir(), uuid.v4());
	  console.log(`writing to ${filePath}`);
	  const dest = fs.createWriteStream(filePath);
	  let progress = 0;
	  const res = await DRIVE.files.get(
		{fileId, alt: 'media'},
		function (err, file) {
			if (err) {
			  // Handle error
			  console.error(err);
			} else {
				resolve(file.data)
			}
		  }
	  );
	});
  }