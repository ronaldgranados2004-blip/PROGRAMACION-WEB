const express = require('express');
const router = express.Router();
const { registrarSoatEmpleado, liquidarYEditarSoatAdmin } = require('../controllers/soatController');
const { verificarAuth, esAdmin } = require('../middlewares/authMiddleware');

router.post('/', verificarAuth, registrarSoatEmpleado);
router.put('/liquidar/:id', verificarAuth, esAdmin, liquidarYEditarSoatAdmin);

module.exports = router;