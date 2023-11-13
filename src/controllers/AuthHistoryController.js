const AuthHistory = require('../models/AuthHistory')

const getAuthHistory = async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
  
      const options = {
        order: [['createdAt', 'DESC']],
        where: {},
        limit,
        offset,
      };
  
      if (req.query.userId) {
        options.where.userId = req.query.userId;
      }
  
      if (req.query.type) {
        options.where.type = req.query.type;
      }
  
      const authHistoryList = await AuthHistory.findAndCountAll(options);
  
      res.json(authHistoryList);
    } catch (error) {
      console.error('Error fetching auth history:', error);
      res.status(API_RESULTS.ERR_GET_AUTH_HISTORY.status_code).json({ error: API_RESULTS.ERR_GET_AUTH_HISTORY.code });
    }
}

module.exports = { getAuthHistory }