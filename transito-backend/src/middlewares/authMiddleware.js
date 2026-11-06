const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para verificar que el usuario está autenticado mediante el token JWT
const verificarAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token o el formato es incorrecto.' });
        }

        const token = authHeader.split(' ')[1];
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro_transito');
        
        const usuario = await Usuario.findById(decoded.id).select('-password');
        if (!usuario || !usuario.estado) {
            return res.status(401).json({ error: 'Token no válido o usuario inactivo.' });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

// Middleware para verificar que el usuario sea exclusivamente Administrador
const esAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de Administrador.' });
    }
};

module.exports = {
    verificarAuth,
    esAdmin
};