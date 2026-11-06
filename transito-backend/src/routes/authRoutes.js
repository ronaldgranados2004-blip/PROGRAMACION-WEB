const express = require('express');
const router = express.Router();

// 1. Importamos TODAS las funciones del controlador de autenticación (incluyendo obtenerUsuarios)
const { 
    registrarUsuario, 
    login, 
    obtenerPerfil, 
    obtenerUsuarios, 
    actualizarCredencialesEmpleado 
} = require('../controllers/authController.js');

// 2. Importamos los middlewares de autenticación y roles con su extensión correcta
const { verificarAuth, esAdmin } = require('../middlewares/authMiddleware.js');

// 3. Definición de rutas públicas
router.post('/registro', registrarUsuario);
router.post('/login', login);

// 4. Definición de rutas protegidas
router.get('/perfil', verificarAuth, obtenerPerfil);

// 5. Rutas exclusivas para Administrador
router.get('/usuarios', verificarAuth, esAdmin, obtenerUsuarios);
router.put('/usuarios/:id', verificarAuth, esAdmin, actualizarCredencialesEmpleado);

module.exports = router;