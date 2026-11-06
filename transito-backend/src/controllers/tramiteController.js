const TramiteTransito = require('../models/TramiteTransito');

// ==========================================
// 1. REGISTRO INICIAL EN VENTANILLA (EMPLEADO)
// ==========================================
const registrarTramiteEmpleado = async (req, res) => {
    try {
        const {
            numeroReciboFisico,
            tipoTramite,
            nombreTramitePersonalizado,
            placaVehiculo,
            tipoDocumento,
            numeroDocumento,
            nombresApellidos,
            tramitadorInfo,
            metodoPagoPrincipal,
            valorCliente,
            montoAbonado,
            observaciones
        } = req.body;

        if (!numeroReciboFisico || !tipoTramite || !placaVehiculo || !valorCliente) {
            return res.status(400).json({ 
                error: "El recibo físico, tipo de trámite, placa y valor total son obligatorios." 
            });
        }

        if (tipoTramite === 'OTRO' && (!nombreTramitePersonalizado || nombreTramitePersonalizado.trim() === '')) {
            return res.status(400).json({ 
                error: "Debe especificar el nombre del trámite personalizado cuando selecciona 'OTRO'." 
            });
        }

        const esSistecredito = metodoPagoPrincipal === 'Sistecredito';
        const primerAbono = montoAbonado !== undefined ? Number(montoAbonado) : Number(valorCliente);
        const saldoPendiente = valorCliente - primerAbono;
        const estadoPago = saldoPendiente <= 0 ? 'Cancelado' : 'Abonado';

        const nuevoTramite = new TramiteTransito({
            numeroReciboFisico,
            tipoTramite,
            nombreTramitePersonalizado: tipoTramite === 'OTRO' ? nombreTramitePersonalizado : '',
            placaVehiculo: placaVehiculo.toUpperCase(),
            tipoDocumento,
            numeroDocumento,
            nombresApellidos,
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
                historialAbonos: [
                    {
                        numeroReciboFisico,
                        monto: primerAbono,
                        metodoPago: metodoPagoPrincipal
                    }
                ]
            },
            observaciones
        });

        const guardado = await nuevoTramite.save();

        res.status(201).json({
            mensaje: "Trámite de tránsito registrado con éxito por ventanilla",
            datos: {
                _id: guardado._id,
                recibo: guardado.numeroReciboFisico,
                tipoTramite: guardado.tipoTramite,
                placa: guardado.placaVehiculo,
                titular: guardado.nombresApellidos,
                esSistecredito: guardado.transaccion.esSistecredito,
                valorTotal: guardado.transaccion.valorCliente,
                totalAbonado: guardado.transaccion.totalAbonado,
                saldoPendiente: guardado.transaccion.saldoPendiente,
                estadoPago: guardado.transaccion.estadoPago
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "El número de recibo físico ya existe en el sistema." });
        }
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 2. REGISTRAR ABONO POSTERIOR (EMPLEADO)
// ==========================================
const registrarAbonoTramite = async (req, res) => {
    try {
        const { id } = req.params;
        const { numeroReciboFisico, montoAbonado, metodoPago } = req.body;

        if (!numeroReciboFisico || !montoAbonado || !metodoPago) {
            return res.status(400).json({ error: "Faltan datos obligatorios para registrar el abono." });
        }

        const registro = await TramiteTransito.findById(id);
        if (!registro) {
            return res.status(404).json({ error: "Trámite no encontrado." });
        }

        const valorTotal = registro.transaccion.valorCliente;
        const nuevoTotalAbonado = registro.transaccion.totalAbonado + Number(montoAbonado);
        const nuevoSaldoPendiente = valorTotal - nuevoTotalAbonado;

        if (nuevoSaldoPendiente < 0) {
            return res.status(400).json({ error: "El abono supera el saldo pendiente del trámite." });
        }

        registro.transaccion.totalAbonado = nuevoTotalAbonado;
        registro.transaccion.saldoPendiente = nuevoSaldoPendiente;
        registro.transaccion.estadoPago = nuevoSaldoPendiente === 0 ? 'Cancelado' : 'Abonado';

        registro.transaccion.historialAbonos.push({
            numeroReciboFisico,
            monto: Number(montoAbonado),
            metodoPago
        });

        const actualizado = await registro.save();

        res.status(200).json({
            mensaje: "Abono registrado correctamente",
            estadoFinanciero: {
                valorTotal: actualizado.transaccion.valorCliente,
                totalAbonado: actualizado.transaccion.totalAbonado,
                saldoPendiente: actualizado.transaccion.saldoPendiente,
                estadoPago: actualizado.transaccion.estadoPago,
                historial: actualizado.transaccion.historialAbonos
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. EDICIÓN Y LIQUIDACIÓN COMPLETA (ADMINISTRADOR)
// ==========================================
const liquidarYEditarTramiteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            valorCliente, 
            derechosTransito, 
            costoDomicilioRadicacion, 
            costoImprontas, 
            comisionTramitador,
            tipoTramite,
            placaVehiculo 
        } = req.body;

        const registro = await TramiteTransito.findById(id);
        if (!registro) {
            return res.status(404).json({ error: "Trámite no encontrado." });
        }

        if (valorCliente !== undefined) registro.transaccion.valorCliente = Number(valorCliente);
        if (tipoTramite !== undefined) registro.tipoTramite = tipoTramite;
        if (placaVehiculo !== undefined) registro.placaVehiculo = placaVehiculo.toUpperCase();

        const dTransito = derechosTransito !== undefined ? Number(derechosTransito) : registro.transaccion.derechosTransito;
        const cDomicilio = costoDomicilioRadicacion !== undefined ? Number(costoDomicilioRadicacion) : registro.transaccion.costoDomicilioRadicacion;
        const cImprontas = costoImprontas !== undefined ? Number(costoImprontas) : registro.transaccion.costoImprontas;
        const comision = comisionTramitador !== undefined ? Number(comisionTramitador) : registro.transaccion.comisionTramitador;

        const totalGastos = dTransito + cDomicilio + cImprontas + comision;
        const valorTotalActual = registro.transaccion.valorCliente;
        
        const gananciaContable = valorTotalActual - totalGastos;
        const impactoCaja = registro.transaccion.esSistecredito ? 0 : gananciaContable;

        registro.transaccion.derechosTransito = dTransito;
        registro.transaccion.costoDomicilioRadicacion = cDomicilio;
        registro.transaccion.costoImprontas = cImprontas;
        registro.transaccion.comisionTramitador = comision;
        registro.transaccion.gananciaContable = gananciaContable;
        registro.transaccion.impactoEnCajaOperativa = impactoCaja;
        registro.estadoLiquidacion = 'Liquidado';

        const actualizado = await registro.save();

        res.status(200).json({
            mensaje: "Trámite de tránsito liquidado y actualizado correctamente por el Administrador",
            resumenFinanciero: {
                recibo: actualizado.numeroReciboFisico,
                tipoTramite: actualizado.tipoTramite,
                placa: actualizado.placaVehiculo,
                titular: actualizado.nombresApellidos,
                esSistecredito: actualizado.transaccion.esSistecredito,
                valorCliente: valorTotalActual,
                gastosTotales: totalGastos,
                gananciaContableCalculada: actualizado.transaccion.gananciaContable,
                impactoEnCajaOperativaHoy: actualizado.transaccion.impactoEnCajaOperativa,
                estadoLiquidacion: actualizado.estadoLiquidacion
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 4. ELIMINAR TRÁMITE / CLIENTE (Solo Admin)
// ==========================================
const eliminarTramite = async (req, res) => {
    try {
        const { id } = req.params;
        const tramiteEliminado = await TramiteTransito.findByIdAndDelete(id);

        if (!tramiteEliminado) {
            return res.status(404).json({ error: "El registro no existe o ya fue eliminado." });
        }

        res.status(200).json({ mensaje: "Registro eliminado correctamente con éxito." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// EXPORTACIÓN ÚNICA (TODAS LAS FUNCIONES)
// ==========================================
module.exports = {
    registrarTramiteEmpleado,
    registrarAbonoTramite,
    liquidarYEditarTramiteAdmin,
    eliminarTramite
};