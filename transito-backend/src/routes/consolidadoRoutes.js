const express = require('express');
const router = express.Router();

const { obtenerConsolidadoGeneral } = require('../controllers/consolidadoController');
const { verificarAuth, esAdmin } = require('../middlewares/authMiddleware');

// 🔒 TODO el consolidado y arqueo de caja requiere que sea Administrador
router.get('/', verificarAuth, esAdmin, obtenerConsolidadoGeneral);

module.exports = router;