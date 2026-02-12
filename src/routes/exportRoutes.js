const { Router } = require('express');
const { exportData, exportToChat } = require('../controllers/exportController');

const router = Router({ mergeParams: true });

router.get('/export', exportData);
router.post('/export-to-chat', exportToChat);

module.exports = router;
