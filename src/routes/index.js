const { Router } = require('express');

const userRoutes = require('./userRoutes');
const languagePairRoutes = require('./languagePairRoutes');
const cardRoutes = require('./cardRoutes');
const reviewRoutes = require('./reviewRoutes');
const exportRoutes = require('./exportRoutes');
const settingsRoutes = require('./settingsRoutes');

const router = Router();

router.use('/api/user/:userId', userRoutes);
router.use('/api/user/:userId', languagePairRoutes);
router.use('/api/user/:userId', cardRoutes);
router.use('/api/user/:userId', reviewRoutes);
router.use('/api/user/:userId', exportRoutes);
router.use('/api/user/:userId', settingsRoutes);

module.exports = router;
