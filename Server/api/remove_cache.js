const { removeAllCache } = require("../controllers/dataFormatterController");

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  try {
    await removeAllCache();
    res.status(200).end('removeAllCache successfully');
  } catch (error) {
    console.error('Error removeAllCache:', error);
    res.status(500).end('Failed to removeAllCache');
  }
};
