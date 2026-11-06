const mongoose = require('mongoose');

const tramiteTransitoSchema = new mongoose.Schema({
    numeroReciboFisico: {
        type: String,
        required: [true, 'El número de recibo físico es obligatorio'],
        trim: true
    },
    tipoTramite: {
        type: String,
        required: [true, 'El tipo de trámite es obligatorio'],
        trim: true
    },
    nombresApellidos: {
        type: String,
        required: [true, 'El nombre del cliente es obligatorio'],
        trim: true
    },
    tipoDocumento: {
        type: String,
        enum: ['Cédula de Ciudadanía', 'Cédula de Extranjería', 'PPT', 'NIT', 'Pasaporte'],
        default: 'Cédula de Ciudadanía'
    },
    numeroDocumento: {
        type: String,
        required: [true, 'El número de documento es obligatorio'],
        trim: true
    },
    placaVehiculo: {
        type: String,
        trim: true,
        default: '' // Ya no es obligatoria (útil para RUNT y trámites sin vehículo)
    },
    fechaRegistro: {
        type: Date,
        default: Date.now // Asigna la fecha actual por defecto si no se especifica una histórica
    },
    // Dentro de tu schema transaccion en TramiteTransito.js:
transaccion: {
    valorCliente: { type: Number, required: true, min: 0 },
    totalAbonado: { type: Number, default: 0, min: 0 },
    saldoPendiente: { type: Number, default: 0 },
    costoCia: { type: Number, default: 0 },
    proveedorCia: { type: String, default: 'CIA Cali' }, // Ej: CIA Cali, CRC Balcanes, CIA VIP
    estadoPagoCia: { type: String, enum: ['Pendiente', 'Pagado'], default: 'Pendiente' }, // 👈 Estado de la deuda con el proveedor
    gananciaNeta: { type: Number, default: 0 },
    estadoPago: { type: String, enum: ['Abonado', 'Cancelado'], default: 'Abonado' }
},
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }
}, {
    timestamps: true // Crea automaticamente createdAt y updatedAt
});

module.exports = mongoose.model('TramiteTransito', tramiteTransitoSchema);