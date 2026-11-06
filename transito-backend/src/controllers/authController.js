const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Función auxiliar para generar JWT
const generarToken = (id, rol) => {
    return jwt.sign(
        { id, rol }, 
        process.env.JWT_SECRET || 'secreto_super_seguro_transito', 
        { expiresIn: '12h' }
    );
};

// 1. REGISTRAR USUARIO
const registrarUsuario = async (req, res) => {
    try {
        const { nombreCompleto, username, password, rol } = req.body;

        if (!nombreCompleto || !username || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        const existeUsuario = await Usuario.findOne({ username: username.toLowerCase() });
        if (existeUsuario) {
            return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
        }

        const nuevoUsuario = new Usuario({
            nombreCompleto,
            username,
            password,
            rol: rol || 'EMPLEADO'
        });

        await nuevoUsuario.save();

        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            usuario: {
                id: nuevoUsuario._id,
                nombreCompleto: nuevoUsuario.nombreCompleto,
                username: nuevoUsuario.username,
                rol: nuevoUsuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. INICIAR SESIÓN (LOGIN)
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Por favor ingresa usuario y contraseña.' });
        }

        const usuario = await Usuario.findOne({ username: username.toLowerCase() });
        if (!usuario) {
            return res.status(400).json({ error: 'Credenciales incorrectas (Usuario no encontrado).' });
        }

        if (!usuario.estado) {
            return res.status(403).json({ error: 'Usuario inactivo. Contacta al Administrador.' });
        }

        const passwordCorrecto = await usuario.compararPassword(password);
        if (!passwordCorrecto) {
            return res.status(400).json({ error: 'Credenciales incorrectas (Contraseña no válida).' });
        }

        const token = generarToken(usuario._id, usuario.rol);

        res.status(200).json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario._id,
                nombreCompleto: usuario.nombreCompleto,
                username: usuario.username,
                rol: usuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. OBTENER PERFIL ACTUAL
const obtenerPerfil = async (req, res) => {
    res.status(200).json({ usuario: req.usuario });
};

// 4. OBTENER TODOS LOS USUARIOS (Solo Admin)
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password');
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. ACTUALIZAR CREDENCIALES (Solo Admin)
const actualizarCredencialesEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevoUsername, nuevaPassword } = req.body;

        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        if (nuevoUsername) {
            usuario.username = nuevoUsername.toLowerCase();
        }
        
        if (nuevaPassword && nuevaPassword.trim() !== "") {
            usuario.password = nuevaPassword;
        }

        await usuario.save();
        res.status(200).json({ mensaje: "Credenciales actualizadas con éxito" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registrarUsuario,
    login,
    obtenerPerfil,
    obtenerUsuarios,
    actualizarCredencialesEmpleado
};