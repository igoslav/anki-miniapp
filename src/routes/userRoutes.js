const { Router } = require('express');
const { getUser } = require('../controllers/userController');

const router = Router({ mergeParams: true });

router.get('/', getUser);

module.exports = router;
