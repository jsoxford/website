const r2 = require('r2');
const latestEventURL = 'https://api.meetup.com/JSOxford/events?photo-host=public&page=1&sig_id=153356042&status=upcoming&sig=c84325a9b6088a155d3fdcd87512b07b7e8dfac1';

const sleep = count => {
  return new Promise(resolve => {
    setTimeout(() => resolve(), count);
  })
}

async function fetchMeetupDetails() {
  const req = await r2.get(latestEventURL);
  const result = await req.json;

  if (result && result[0]) {
    return {
      url: result[0].link,
      count: result[0].yes_rsvp_count
    };
  }

  // Ensure rate-limiting is respected
  const limitRemaining = (await req.response).headers.get('x-ratelimit-remaining');
  const resetTimeout = (await req.response).headers.get('x-ratelimit-reset');
  if (limitRemaining <= 3) {
    await sleep(resetTimeout);
  }

  return {
    url: 'https://www.meetup.com/JSOxford'
  };
}

module.exports = {
  fetchMeetupDetails
};
