const express = require('express');
const router = express.Router();
const c = require('../controllers/aiController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);
router.get('/', c.listTemplates);
router.post('/', c.createTemplate);
router.put('/:id', c.updateTemplate);
router.delete('/:id', c.deleteTemplate);
router.post('/:id/start', c.startTemplate);

module.exports = router;
