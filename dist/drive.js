'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.initExpertsStore = initExpertsStore;
exports.updateExpertsInDrive = updateExpertsInDrive;
exports.getExpertsFromDrive = getExpertsFromDrive;
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const path = require('path');
const os = require('os');
const uuid = require('uuid');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = 'token.json';
let DRIVE;

let fileId;

function initExpertsStore() {
	authorize(createExpertsStore);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
	const client_secret = process.env.client_secret;
	const client_id = process.env.client_id;
	const redirect_uris = process.env.redirect_uris;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
	oAuth2Client.setCredentials({
		access_token: process.env.access_token,
		refresh_token: process.env.refresh_token,
		scope: "https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file",
		token_type: "Bearer",
		expiry_date: process.env.expiry_date
	});
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