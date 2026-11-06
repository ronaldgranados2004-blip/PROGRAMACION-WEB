// src/routes/tramiteRoutes.js
const express = require('express');
const router = express.Router();
const { eliminarTramite } = require('../controllers/tramiteController');
const { verificarAuth, esAdmin } = require('../middlewares/auth'); // Ajusta según tus middlewares

// ✅ La URL final resultará en: DELETE http://localhost:4000/api/tramites/:id
router.delete('/:id', verificarAuth, esAdmin, eliminarTramite);

module.exports = router;