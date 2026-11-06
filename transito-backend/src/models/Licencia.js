const mongoose = require('mongoose');

const licenciaSchema = new mongoose.Schema({
    numeroReciboFisico: {
        type: String,
        required: [true, "El número de recibo físico es obligatorio"],
        trim: true,
        unique: true
    },
    tipoServicio: {
        type: String,
        required: true,
        enum: ['LICENCIA_NUEVA', 'RENOVACION', 'DUPLICADO', 'OTRA'],
        default: 'LICENCIA_NUEVA'
    },
    // El empleado ingresa las categorías (Ej: ["A2"], ["A2", "B1"], etc.)
    categoriasSeleccionadas: [{
        type: String,
        required: true,
        uppercase: true,
        trim: true
    }],
    esCombo: {
        type: Boolean,
        default: false
    },
    // Escuela obligatoria para procesos que lo requieran
    escuelaAsignada: {
        type: String,
        required: true,
        enum: ['Educandocali', 'Elite', 'Champions', 'Ninguna / Directo CRC'],
        default: 'Ninguna / Directo CRC'
    },
    // Modalidad interna limpia ("Completa" o "Especial")
    modalidadInstruccion: {
        type: String,
        required: true,
        enum: ['Completa', 'Especial', 'N/A'],
        default: 'Completa'
    },
    // Datos del Titular
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
    // Tramitador
    tramitadorInfo: {
        esDeTramitador: { type: Boolean, default: false },
        nombreTramitador: { type: String, trim: true, default: '' }
    },
    // Transacción y Financiero
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
            required: true // Cobro total pactado
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
        // Costos de Proveedores (Editables por el Administrador)
        costoEscuela: { type: Number, default: 0 },
        costoCRC: { type: Number, default: 0 },
        costoLamina: { type: Number, default: 0 }, // $166.000 si es una, $310.000 si es doble
        comisionTramitador: { type: Number, default: 0 },
        
        // Resultados Contables
        gananciaContable: { type: Number, default: null }, 
        impactoEnCajaOperativa: { type: Number, default: null } // 0 si es Sistecredito
    },
    estadoLiquidacion: {
        type: String,
        default: 'Pendiente Liquidar',
        enum: ['Pendiente Liquidar', 'Liquidado']
    },
    estadoTramite: {
        type: String,
        default: 'Inscrito',
        enum: ['Inscrito', 'Examenes Pendientes', 'Curso Pendiente', 'En Impresion', 'Completado', 'Anulado']
    },
    observaciones: { type: String, trim: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Licencia', licenciaSchema);