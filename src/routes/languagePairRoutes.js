const { Router } = require('express');
const { listPairs, addPair, switchActivePair } = require('../controllers/languagePairController');

const router = Router({ mergeParams: true });

router.get('/language-pairs', listPairs);
router.post('/language-pair', addPair);
router.put('/active-pair', switchActivePair);

module.exports = router;
