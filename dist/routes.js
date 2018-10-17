'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _drive = require('./drive');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import experts from './experts.json'

const router = new _express2.default.Router();

router.post('/slack/command/findexpert', async (req, res) => {
  try {
    const slackReqObj = req.body;
    const experts = await (0, _drive.getExpertsFromDrive)();
    const subjectExperts = experts[(0, _utils.formatSubject)(slackReqObj.text)];
    let expert;
    if (subjectExperts) {
      const randomIndex = Math.floor(Math.random() * subjectExperts.length);
      expert = subjectExperts[randomIndex];
    }

    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: expert ? `You should try asking @${expert} for help! Good luck!` : 'Sorry, we don\'t yet have an expert registered for that subject :/'
    };

    return res.json(response);
  } catch (err) {
    _utils.log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/command/addexpert', async (req, res) => {
  try {
    const slackReqObj = req.body;
    const subject = (0, _utils.formatSubject)(slackReqObj.text);
    const experts = await (0, _drive.getExpertsFromDrive)();
    if (experts[subject]) experts[subject].push(slackReqObj.user_name);else experts[subject] = [slackReqObj.user_name];
    (0, _drive.updateExpertsInDrive)(experts);

    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: `Thanks for adding yourself as an expert for ${slackReqObj.text}!`
    };

    return res.json(response);
  } catch (err) {
    _utils.log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

exports.default = router;