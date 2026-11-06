const express = require('express');
const router = express.Router();
const { registrarCursoVialEmpleado, liquidarYEditarCursoAdmin } = require('../controllers/cursoVialController');
const { verificarAuth, esAdmin } = require('../middlewares/authMiddleware');

router.post('/', verificarAuth, registrarCursoVialEmpleado);
router.put('/liquidar/:id', verificarAuth, esAdmin, liquidarYEditarCursoAdmin);

module.exports = router;