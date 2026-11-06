const Licencia = require('../models/Licencia');

// ==========================================
// 1. REGISTRO INICIAL EN VENTANILLA (EMPLEADO)
// ==========================================
const registrarLicenciaEmpleado = async (req, res) => {
    try {
        const {
            numeroReciboFisico,
            tipoServicio,
            categoriasSeleccionadas,
            escuelaAsignada,
            modalidadInstruccion,
            tipoDocumento,
            numeroDocumento,
            nombresApellidos,
            tramitadorInfo,
            metodoPagoPrincipal,
            valorCliente,
            montoAbonado,
            observaciones
        } = req.body;

        if (!numeroReciboFisico || !valorCliente || !categoriasSeleccionadas || categoriasSeleccionadas.length === 0) {
            return res.status(400).json({ 
                error: "El recibo físico, valor total y al menos una categoría son obligatorios." 
            });
        }

        // Detección automática si es combo / doble categoría
        const esCombo = categoriasSeleccionadas.length > 1;

        // Si es DUPLICADO por defecto podemos preasignar la lámina si el admin lo desea,
        // pero se deja listo para que el Admin lo verifique/liquide.
        const esSistecredito = metodoPagoPrincipal === 'Sistecredito';
        const primerAbono = montoAbonado !== undefined ? Number(montoAbonado) : Number(valorCliente);
        const saldoPendiente = valorCliente - primerAbono;
        const estadoPago = saldoPendiente <= 0 ? 'Cancelado' : 'Abonado';

        const nuevaLicencia = new Licencia({
            numeroReciboFisico,
            tipoServicio: tipoServicio || 'LICENCIA_NUEVA',
            categoriasSeleccionadas: categoriasSeleccionadas.map(c => c.toUpperCase()),
            esCombo,
            escuelaAsignada: escuelaAsignada || 'Ninguna / Directo CRC',
            modalidadInstruccion: modalidadInstruccion || 'Completa',
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

        const guardado = await nuevaLicencia.save();

        res.status(201).json({
            mensaje: "Trámite registrado con éxito por ventanilla",
            datos: {
                _id: guardado._id,
                recibo: guardado.numeroReciboFisico,
                tipoServicio: guardado.tipoServicio,
                titular: guardado.nombresApellidos,
                categorias: guardado.categoriasSeleccionadas,
                esCombo: guardado.esCombo,
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
const registrarAbonoLicencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { numeroReciboFisico, montoAbonado, metodoPago } = req.body;

        if (!numeroReciboFisico || !montoAbonado || !metodoPago) {
            return res.status(400).json({ error: "Faltan datos obligatorios para registrar el abono." });
        }

        const registro = await Licencia.findById(id);
        if (!registro) {
            return res.status(404).json({ error: "Registro no encontrado." });
        }

        const valorTotal = registro.transaccion.valorCliente;
        const nuevoTotalAbonado = registro.transaccion.totalAbonado + Number(montoAbonado);
        const nuevoSaldoPendiente = valorTotal - nuevoTotalAbonado;

        if (nuevoSaldoPendiente < 0) {
            return res.status(400).json({ error: "El abono supera el saldo pendiente." });
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
const liquidarYEditarLicenciaAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            valorCliente, 
            costoEscuela, 
            costoCRC, 
            costoLamina, 
            comisionTramitador,
            escuelaAsignada,
            modalidadInstruccion,
            categoriasSeleccionadas,
            tipoServicio 
        } = req.body;

        const registro = await Licencia.findById(id);
        if (!registro) {
            return res.status(404).json({ error: "Registro no encontrado." });
        }

        if (valorCliente !== undefined) registro.transaccion.valorCliente = Number(valorCliente);
        if (escuelaAsignada !== undefined) registro.escuelaAsignada = escuelaAsignada;
        if (modalidadInstruccion !== undefined) registro.modalidadInstruccion = modalidadInstruccion;
        if (tipoServicio !== undefined) registro.tipoServicio = tipoServicio;
        if (categoriasSeleccionadas !== undefined) {
            registro.categoriasSeleccionadas = categoriasSeleccionadas.map(c => c.toUpperCase());
            registro.esCombo = registro.categoriasSeleccionadas.length > 1;
        }

        const cEscuela = costoEscuela !== undefined ? Number(costoEscuela) : registro.transaccion.costoEscuela;
        const cCRC = costoCRC !== undefined ? Number(costoCRC) : registro.transaccion.costoCRC;
        const cLamina = costoLamina !== undefined ? Number(costoLamina) : registro.transaccion.costoLamina;
        const comision = comisionTramitador !== undefined ? Number(comisionTramitador) : registro.transaccion.comisionTramitador;

        const totalGastos = cEscuela + cCRC + cLamina + comision;
        const valorTotalActual = registro.transaccion.valorCliente;
        
        const gananciaContable = valorTotalActual - totalGastos;
        const impactoCaja = registro.transaccion.esSistecredito ? 0 : gananciaContable;

        registro.transaccion.costoEscuela = cEscuela;
        registro.transaccion.costoCRC = cCRC;
        registro.transaccion.costoLamina = cLamina;
        registro.transaccion.comisionTramitador = comision;
        registro.transaccion.gananciaContable = gananciaContable;
        registro.transaccion.impactoEnCajaOperativa = impactoCaja;
        registro.estadoLiquidacion = 'Liquidado';

        const actualizado = await registro.save();

        res.status(200).json({
            mensaje: "Trámite de licencia liquidado y actualizado correctamente por el Administrador",
            resumenFinanciero: {
                recibo: actualizado.numeroReciboFisico,
                tipoServicio: actualizado.tipoServicio,
                titular: actualizado.nombresApellidos,
                categorias: actualizado.categoriasSeleccionadas,
                esCombo: actualizado.esCombo,
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

module.exports = {
    registrarLicenciaEmpleado,
    registrarAbonoLicencia,
    liquidarYEditarLicenciaAdmin
};