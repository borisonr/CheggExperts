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

async function initExpertsStore() {
	authorize();
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize() {
	const client_secret = process.env.client_secret;
	const client_id = process.env.client_id;
	const redirect_uri = process.env.redirect_uri;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
	oAuth2Client.setCredentials({
		access_token: process.env.access_token,
		refresh_token: process.env.refresh_token,
		scope: "https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file",
		token_type: "Bearer",
		expiry_date: process.env.expiry_date
	});
	DRIVE = google.drive({ version: 'v3', auth: oAuth2Client });
}

async function updateExpertsInDrive(experts) {
	DRIVE.files.update({
		fileId: process.env.file_id,
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
		const dest = fs.createWriteStream(filePath);
		let progress = 0;
		const res = await DRIVE.files.get({ fileId: process.env.file_id, alt: 'media' }, function (err, file) {
			if (err) {
				// Handle error
				console.error(err);
			} else {
				resolve(file.data);
			}
		});
	});
}