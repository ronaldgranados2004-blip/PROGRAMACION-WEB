const Soat = require('../models/Soat');

const registrarSoatEmpleado = async (req, res) => {
    try {
        const {
            numeroReciboFisico,
            tipoDocumento,
            numeroDocumento,
            nombresApellidos,
            vehiculo,
            tramitadorInfo,
            metodoPagoPrincipal,
            valorCliente,
            montoAbonado,
            observaciones
        } = req.body;

        if (!numeroReciboFisico || !vehiculo?.placa || !valorCliente) {
            return res.status(400).json({ error: "Recibo físico, placa y valor total son obligatorios." });
        }

        const esSistecredito = metodoPagoPrincipal === 'Sistecredito';
        const primerAbono = montoAbonado !== undefined ? Number(montoAbonado) : Number(valorCliente);
        const saldoPendiente = valorCliente - primerAbono;
        const estadoPago = saldoPendiente <= 0 ? 'Cancelado' : 'Abonado';

        const nuevoSoat = new Soat({
            numeroReciboFisico,
            tipoDocumento,
            numeroDocumento,
            nombresApellidos,
            vehiculo: {
                placa: vehiculo.placa.toUpperCase(),
                tipoVehiculo: vehiculo.tipoVehiculo,
                aseguradora: vehiculo.aseguradora || ''
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

        const guardado = await nuevoSoat.save();
        res.status(201).json({ mensaje: "SOAT registrado con éxito", datos: guardado });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ error: "El número de recibo físico ya existe." });
        res.status(500).json({ error: error.message });
    }
};

const liquidarYEditarSoatAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { valorCliente, costoNetoSeguro, comisionTramitador } = req.body;

        const registro = await Soat.findById(id);
        if (!registro) return res.status(404).json({ error: "SOAT no encontrado." });

        if (valorCliente !== undefined) registro.transaccion.valorCliente = Number(valorCliente);
        const costoSeguro = costoNetoSeguro !== undefined ? Number(costoNetoSeguro) : registro.transaccion.costoNetoSeguro;
        const comision = comisionTramitador !== undefined ? Number(comisionTramitador) : registro.transaccion.comisionTramitador;

        const valorTotal = registro.transaccion.valorCliente;
        const gananciaContable = valorTotal - (costoSeguro + comision);
        const impactoCaja = registro.transaccion.esSistecredito ? 0 : gananciaContable;

        registro.transaccion.costoNetoSeguro = costoSeguro;
        registro.transaccion.comisionTramitador = comision;
        registro.transaccion.gananciaContable = gananciaContable;
        registro.transaccion.impactoEnCajaOperativa = impactoCaja;
        registro.estadoLiquidacion = 'Liquidado';

        const actualizado = await registro.save();
        res.status(200).json({ mensaje: "SOAT liquidado correctamente", datos: actualizado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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

module.exports = { registrarSoatEmpleado, liquidarYEditarSoatAdmin };