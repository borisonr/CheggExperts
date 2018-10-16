import express from 'express';
import { experts } from './experts';

import { log, formatSubject } from './utils';

const router = new express.Router();

router.post('/slack/command/findexpert', async (req, res) => {
  try {
    const slackReqObj = req.body;
    const expert = experts[formatSubject(slackReqObj.text)]

    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: `You should try asking ${expert} for help! Good luck!`,
    };

    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

export default router;
