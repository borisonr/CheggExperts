import express from 'express';
import { getExpertsFromDrive, updateExpertsInDrive } from './drive';

import { log, formatSubject } from './utils';

const router = new express.Router();

const errorResponse = channel => ({
  response_type: 'in_channel',
  channel: channel,
  text: `Sorry, that is not a valid subject, please try typing a string of alphanumeric characters!`
});

router.post('/slack/command/findexpert', async (req, res) => {
  try {
    const slackReqObj = req.body;

    if(typeof slackReqObj.text !== 'string') return res.json(errorResponse(channel));

    const experts = await getExpertsFromDrive()
    const subjectExperts = experts[formatSubject(slackReqObj.text)];
    let expert;
    if(subjectExperts) {
      const randomIndex = Math.floor(Math.random() * subjectExperts.length) 
      expert = subjectExperts[randomIndex]
    }

    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: expert ? `You should try asking @${expert} for help! Good luck!` : 'Sorry, we don\'t yet have an expert registered for that subject :/',
    };

    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/command/listsubjects', async (req, res) => {
  try {
    const slackReqObj = req.body;
    const experts = await getExpertsFromDrive()
    const subjects = Object.keys(experts).sort().join(', ')

    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: `Here's a list of all the experts we have at Chegg: ${subjects}`
    };

    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/command/addexpert', async (req, res) => {
  try {
    const slackReqObj = req.body;

    if(typeof slackReqObj.text !== 'string') return res.json(errorResponse(channel));

    const subject = formatSubject(slackReqObj.text)
    const experts = await getExpertsFromDrive()
    if(experts[subject]) experts[subject].push(slackReqObj.user_name)
    else experts[subject] = [slackReqObj.user_name]
    updateExpertsInDrive(experts)

    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: `Thanks for adding yourself as an expert for ${slackReqObj.text}!`,
    };

    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

export default router;
