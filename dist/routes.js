'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _drive = require('./drive');

var _utils = require('./utils');

var _experts = require('./experts.json');

var _experts2 = _interopRequireDefault(_experts);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const router = new _express2.default.Router();

router.post('/slack/command/findexpert', async (req, res) => {
  try {
    const slackReqObj = req.body;
    // TODO figure out Drive OAuth
    // const experts = await getExpertsFromDrive()
    const subjectExperts = _experts2.default[(0, _utils.formatSubject)(slackReqObj.text)];
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
    // TODO figure out Drive OAuth
    // const experts = await getExpertsFromDrive()
    if (_experts2.default[subject]) subjectExperts.push(slackReqObj.user_name);else _experts2.default[subject] = [slackReqObj.user_name];
    (0, _drive.updateExpertsInDrive)(_experts2.default);

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