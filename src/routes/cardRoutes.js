const { Router } = require('express');
const { addCard, importCards, updateCard, deleteCard, resetProgress } = require('../controllers/cardController');

const router = Router({ mergeParams: true });

router.post('/card', addCard);
router.post('/cards/import', importCards);
router.put('/card/:cardId', updateCard);
router.delete('/card/:cardId', deleteCard);
router.put('/card/:cardId/reset', resetProgress);

module.exports = router;
