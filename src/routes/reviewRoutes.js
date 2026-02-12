const { Router } = require('express');
const { submitReview } = require('../controllers/reviewController');

const router = Router({ mergeParams: true });

router.put('/card/:cardId/review', submitReview);

module.exports = router;
