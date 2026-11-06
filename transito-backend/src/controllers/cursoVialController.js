const CursoVial = require('../models/CursoVial');

const registrarCursoVialEmpleado = async (req, res) => {
    try {
        const {
            numeroReciboFisico,
            tipoDocumento,
            numeroDocumento,
            nombresApellidos,
            detallesCurso,
            tramitadorInfo,
            metodoPagoPrincipal,
            valorCliente,
            montoAbonado,
            observaciones
        } = req.body;

        if (!numeroReciboFisico || !detallesCurso?.tipoCurso || !valorCliente) {
            return res.status(400).json({ error: "Faltan datos obligatorios para el curso vial." });
        }

        const esSistecredito = metodoPagoPrincipal === 'Sistecredito';
        const primerAbono = montoAbonado !== undefined ? Number(montoAbonado) : Number(valorCliente);
        const saldoPendiente = valorCliente - primerAbono;
        const estadoPago = saldoPendiente <= 0 ? 'Cancelado' : 'Abonado';

        const nuevoCurso = new CursoVial({
            numeroReciboFisico,
            tipoDocumento,
            numeroDocumento,
            nombresApellidos,
            detallesCurso: {
                tipoCurso: detallesCurso.tipoCurso,
                escuelaAliada: detallesCurso.escuelaAliada || ''
            },
            tramitadorInfo: {
                esDeTramitador: tramitadorInfo?.esDeTramitador || false,
                nombreTramitador: tramitadorInfo?.esDeTramitador ? tramitadorInfo.nombreTramitador : ''
            },
            transaccion: {
                metodoPagoPrincipal,
                esSistecredito,
                valorCliente,
                totalAbonado: primerAbono,
                saldoPendiente: saldoPendiente > 0 ? saldoPendiente : 0,
                estadoPago,
                historialAbonos: [{ numeroReciboFisico, monto: primerAbono, metodoPago: metodoPagoPrincipal }]
            },
            observaciones
        });

        const guardado = await nuevoCurso.save();
        res.status(201).json({ mensaje: "Curso vial registrado con éxito", datos: guardado });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ error: "El recibo físico ya existe." });
        res.status(500).json({ error: error.message });
    }
};

const liquidarYEditarCursoAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { valorCliente, costoEscuelaAliada, comisionTramitador } = req.body;

        const registro = await CursoVial.findById(id);
        if (!registro) return res.status(404).json({ error: "Curso vial no encontrado." });

        if (valorCliente !== undefined) registro.transaccion.valorCliente = Number(valorCliente);
        const costoEscuela = costoEscuelaAliada !== undefined ? Number(costoEscuelaAliada) : registro.transaccion.costoEscuelaAliada;
        const comision = comisionTramitador !== undefined ? Number(comisionTramitador) : registro.transaccion.comisionTramitador;

        const valorTotal = registro.transaccion.valorCliente;
        const gananciaContable = valorTotal - (costoEscuela + comision);
        const impactoCaja = registro.transaccion.esSistecredito ? 0 : gananciaContable;

        registro.transaccion.costoEscuelaAliada = costoEscuela;
        registro.transaccion.comisionTramitador = comision;
        registro.transaccion.gananciaContable = gananciaContable;
        registro.transaccion.impactoEnCajaOperativa = impactoCaja;
        registro.estadoLiquidacion = 'Liquidado';

        const actualizado = await registro.save();
        res.status(200).json({ mensaje: "Curso vial liquidado correctamente", datos: actualizado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

    // Eliminar un trámite/cliente por ID (Solo Admin)
const eliminarTramite = async (req, res) => {
    try {
        const { id } = req.params;
        const tramiteEliminado = await Tramite.findByIdAndDelete(id);

        if (!tramiteEliminado) {
            return res.status(404).json({ error: "El registro no existe o ya fue eliminado." });
        }

        res.status(200).json({ mensaje: "Registro eliminado correctamente con éxito." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    // ... tus otras funciones
    eliminarTramite
};
};

module.exports = { registrarCursoVialEmpleado, liquidarYEditarCursoAdmin };