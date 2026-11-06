const express = require('express');
const router = express.Router();
const { registrarGasto, obtenerGastos, eliminarGasto } = require('../controllers/gastoController');
const { verificarAuth, esAdmin } = require('../middlewares/authMiddleware');

router.get('/', verificarAuth, esAdmin, obtenerGastos);
router.post('/', verificarAuth, esAdmin, registrarGasto);
router.delete('/:id', verificarAuth, esAdmin, eliminarGasto);

module.exports = router;