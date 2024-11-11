// api/cron.js

const { removeAllCache } = require('../controllers/dataFormatterController');
const { processStart } =  require('../controllers/dataSyncController');
const { bulk_Check_PhoneNumberApiCallCount, bulkPhoneNumberApiCallCount } = require('../controllers/Logic/packageConditions');

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  try {
    //console.log('Cron job started: Syncing subscriptions to HubSpot');

    // await bulk_Check_PhoneNumberApiCallCount();
    // console.log('Cron job started: bulk_Check_PhoneNumberApiCallCount');

    // await bulkPhoneNumberApiCallCount();
    // console.log('Cron job started: bulkPhoneNumberApiCallCount');

    // await removeAllCache(); //removing cache in phone_number main func
    // console.log('Cron job started: removeAllCache');

    processStart();
    res.status(200).end('Subscriptions synced successfully');
  } catch (error) {
    console.error('Error syncing subscriptions:', error);
    res.status(500).end('Failed to sync subscriptions');
  }
};

