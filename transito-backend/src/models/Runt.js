const mongoose = require('mongoose');

const runtSchema = new mongoose.Schema({
    numeroReciboFisico: {
        type: String,
        required: [true, "El número de recibo físico es obligatorio"],
        trim: true,
        unique: true
    },
    tipoTramite: {
        type: String,
        default: 'RUNT',
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
    gestionRunt: {
        tipoGestion: {
            type: String,
            required: true, // Ej: Inscripción de persona, Actualización de datos, etc.
            trim: true
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
        costoNetoRunt: {
            type: Number,
            default: 0 // El valor oficial de la tarifa o costo operativo RUNT
        },
        comisionTramitador: {
            type: Number,
            default: 0 
        },
        gananciaContable: {
            type: Number,
            default: null // Calculado: valorCliente - (costoNetoRunt + comisionTramitador)
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
        default: 'Completado',
        enum: ['En Proceso', 'Completado', 'Anulado']
    },
    observaciones: { type: String, trim: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Runt', runtSchema);