const { Router } = require('express');
const { updateSettings } = require('../controllers/settingsController');

const router = Router({ mergeParams: true });

router.put('/settings', updateSettings);

module.exports = router;
