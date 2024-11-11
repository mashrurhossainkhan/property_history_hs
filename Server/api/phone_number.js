//const { bulkPhoneNumberApiCallCount } = require("../controllers/Logic/packageConditions");

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  try {
    //await bulkPhoneNumberApiCallCount();
    res.status(200).end('bulkPhoneNumberApiCallCount successfully');
  } catch (error) {
    console.error('Error bulkPhoneNumberApiCallCount:', error);
    res.status(500).end('Failed to bulkPhoneNumberApiCallCount');
  }
};
