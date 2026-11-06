const express = require('express');
const router = express.Router();
const { registrarRuntEmpleado, liquidarYEditarRuntAdmin } = require('../controllers/runtController');
const { verificarAuth, esAdmin } = require('../middlewares/authMiddleware');

router.post('/', verificarAuth, registrarRuntEmpleado);
router.put('/liquidar/:id', verificarAuth, esAdmin, liquidarYEditarRuntAdmin);

module.exports = router;