const mongoose = require('mongoose');

const soatSchema = new mongoose.Schema({
    numeroReciboFisico: {
        type: String,
        required: [true, "El número de recibo físico es obligatorio"],
        trim: true,
        unique: true
    },
    tipoTramite: {
        type: String,
        default: 'SOAT',
        required: true
    },
    tipoDocumento: {
        type: String,
        required: true,
        enum: ['CC', 'CE', 'PPT', 'NIT', 'Pasaporte']
    },
    numeroDocumento: {
        type: String,
        required: true,
        trim: true
    },
    nombresApellidos: {
        type: String,
        required: true,
        trim: true
    },
    vehiculo: {
        placa: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },
        tipoVehiculo: {
            type: String,
            required: true,
            enum: ['Automovil', 'Moto', 'Camioneta', 'Camion', 'Otro']
        },
        aseguradora: {
            type: String,
            trim: true,
            default: ''
        }
    },
    tramitadorInfo: {
        esDeTramitador: { type: Boolean, default: false },
        nombreTramitador: { type: String, trim: true, default: '' }
    },
    transaccion: {
        metodoPagoPrincipal: {
            type: String,
            enum: ['Efectivo', 'Nequi', 'Bancolombia', 'Sistecredito', 'Mixto'],
            required: true
        },
        esSistecredito: {
            type: Boolean,
            default: false
        },
        valorCliente: {
            type: Number,
            required: true // Valor total cobrado al cliente
        },
        totalAbonado: {
            type: Number,
            default: 0 
        },
        saldoPendiente: {
            type: Number,
            default: 0 
        },
        estadoPago: {
            type: String,
            enum: ['Abonado', 'Cancelado'],
            default: 'Abonado'
        },
        historialAbonos: [
            {
                numeroReciboFisico: { type: String, required: true },
                monto: { type: Number, required: true },
                metodoPago: { type: String, required: true },
                fecha: { type: Date, default: Date.now }
            }
        ],
        // Liquidación de costos por el Administrador
        costoNetoSeguro: {
            type: Number,
            default: 0 
        },
        comisionTramitador: {
            type: Number,
            default: 0 
        },
        gananciaContable: {
            type: Number,
            default: null // Calculado: valorCliente - (costoNetoSeguro + comisionTramitador)
        },
        impactoEnCajaOperativa: {
            type: Number,
            default: null // 0 si es Sistecredito
        }
    },
    estadoLiquidacion: {
        type: String,
        default: 'Pendiente Liquidar',
        enum: ['Pendiente Liquidar', 'Liquidado']
    },
    estadoTramite: {
        type: String,
        default: 'Emitido',
        enum: ['Pendiente', 'Emitido', 'Anulado']
    },
    observaciones: { type: String, trim: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Soat', soatSchema);