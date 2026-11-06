const mongoose = require('mongoose');

const cursoVialSchema = new mongoose.Schema({
    numeroReciboFisico: {
        type: String,
        required: [true, "El número de recibo físico es obligatorio"],
        trim: true,
        unique: true
    },
    tipoTramite: {
        type: String,
        default: 'CURSO_VIAL',
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
    detallesCurso: {
        tipoCurso: {
            type: String,
            required: true, // Ej: Infracciones de tránsito, Sensibilización, etc.
            trim: true
        },
        escuelaAliada: {
            type: String,
            trim: true,
            default: '' // Centro de enseñanza o academia asociada
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
        costoEscuelaAliada: {
            type: Number,
            default: 0 // Lo que cobra la escuela o centro por el curso
        },
        comisionTramitador: {
            type: Number,
            default: 0 
        },
        gananciaContable: {
            type: Number,
            default: null // Calculado: valorCliente - (costoEscuelaAliada + comisionTramitador)
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
        default: 'Inscrito',
        enum: ['Inscrito', 'Realizado', 'Certificado', 'Anulado']
    },
    observaciones: { type: String, trim: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('CursoVial', cursoVialSchema);