// src/routes/tramiteTransitoRoutes.js
const express = require('express');
const router = express.Router();

const { 
    registrarTramiteEmpleado, 
    registrarAbonoTramite,
    liquidarYEditarTramiteAdmin,
    obtenerTramites,
    eliminarTramite,
    cambiarEstadoPagoCia
} = require('../controllers/tramiteTransitoController');

const { verificarAuth, esAdmin } = require('../middlewares/authMiddleware');

// Rutas Generales de Trámites
router.get('/', verificarAuth, obtenerTramites);
router.post('/', verificarAuth, registrarTramiteEmpleado);
router.patch('/abono/:id', verificarAuth, registrarAbonoTramite);

// Ruta para cambiar estado de pago a proveedores (CIA / CRC / VIP)
router.patch('/pago-cia/:id', verificarAuth, esAdmin, cambiarEstadoPagoCia);

// Rutas exclusivas de Administración
router.put('/liquidar/:id', verificarAuth, esAdmin, liquidarYEditarTramiteAdmin);
router.delete('/:id', verificarAuth, esAdmin, eliminarTramite);

module.exports = router;