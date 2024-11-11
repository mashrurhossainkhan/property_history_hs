//const { bulk_Check_PhoneNumberApiCallCount } = require("../controllers/Logic/packageConditions");

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  try {
    //await bulk_Check_PhoneNumberApiCallCount();
    res.status(200).end('bulk_Check_PhoneNumberApiCallCount successfully');
  } catch (error) {
    console.error('Error bulk_Check_PhoneNumberApiCallCount:', error);
    res.status(500).end('Failed to bulk_Check_PhoneNumberApiCallCount');
  }
};
