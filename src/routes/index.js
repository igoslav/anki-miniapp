const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');

const userRoutes = require('./userRoutes');
const languagePairRoutes = require('./languagePairRoutes');
const cardRoutes = require('./cardRoutes');
const reviewRoutes = require('./reviewRoutes');
const exportRoutes = require('./exportRoutes');
const settingsRoutes = require('./settingsRoutes');
const tutorRoutes = require('./tutorRoutes');

const router = Router();

router.use('/api/user/:userId', authMiddleware);
router.use('/api/user/:userId', userRoutes);
router.use('/api/user/:userId', languagePairRoutes);
router.use('/api/user/:userId', cardRoutes);
router.use('/api/user/:userId', reviewRoutes);
router.use('/api/user/:userId', exportRoutes);
router.use('/api/user/:userId', settingsRoutes);
router.use('/api/user/:userId', tutorRoutes);

module.exports = router;
