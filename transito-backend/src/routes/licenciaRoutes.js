const express = require('express');
const router = express.Router();

const { 
    registrarLicenciaEmpleado, 
    registrarAbonoLicencia,
    liquidarYEditarLicenciaAdmin 
} = require('../controllers/licenciaController');

// Importar los middlewares de seguridad
const { verificarAuth, esAdmin } = require('../middlewares/authMiddleware');

// Empleados o Admins pueden registrar y abonar (deben estar logueados)
router.post('/', verificarAuth, registrarLicenciaEmpleado);
router.patch('/abono/:id', verificarAuth, registrarAbonoLicencia);

// 🔒 SOLO EL ADMINISTRADOR puede liquidar y editar costos
router.put('/liquidar/:id', verificarAuth, esAdmin, liquidarYEditarLicenciaAdmin);

module.exports = router;