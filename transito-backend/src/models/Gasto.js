const mongoose = require('mongoose');

const gastoSchema = new mongoose.Schema({
    descripcion: { type: String, required: true },
    monto: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
    registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
}, { timestamps: true });

module.exports = mongoose.model('Gasto', gastoSchema);