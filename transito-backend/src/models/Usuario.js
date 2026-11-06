const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    nombreCompleto: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    username: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: 6
    },
    rol: {
        type: String,
        enum: ['ADMIN', 'EMPLEADO'],
        default: 'EMPLEADO'
    },
    estado: {
        type: Boolean,
        default: true // Permite desactivar usuarios sin eliminarlos
    }
}, {
    timestamps: true
});

// Encriptar contraseña antes de guardar en la BD
usuarioSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Método para comparar contraseñas en el Login
usuarioSchema.methods.compararPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);