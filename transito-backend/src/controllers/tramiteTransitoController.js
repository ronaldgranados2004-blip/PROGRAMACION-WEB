const TramiteTransito = require('../models/TramiteTransito');

// ==========================================
// 1. REGISTRO INICIAL EN VENTANILLA (EMPLEADO)
// ==========================================
const registrarTramiteEmpleado = async (req, res) => {
    try {
        const { 
            numeroReciboFisico, 
            tipoTramite, 
            nombresApellidos, 
            tipoDocumento, 
            numeroDocumento, 
            placaVehiculo, 
            fechaRegistro, 
            transaccion 
        } = req.body;

        if (!numeroReciboFisico || !tipoTramite || !transaccion?.valorCliente) {
            return res.status(400).json({ 
                error: "El número de recibo físico, tipo de trámite y valor total son obligatorios." 
            });
        }

        // 🟢 Asignación de Costos y Proveedor (DENTRO de la función)
        let costoCia = 0;
        let proveedorCia = 'CIA Cali';

        if (tipoTramite.includes('Inscripción RUNT')) {
            costoCia = 32000;
            proveedorCia = 'CIA Cali (RUNT)';
        } else if (tipoTramite.includes('Actualización de Datos')) {
            costoCia = 16000;
            proveedorCia = 'CIA Cali (RUNT)';
        } else if (tipoTramite.includes('Examen')) {
            costoCia = 0; 
            proveedorCia = 'CRC Balcanes (Exámenes)';
        } else if (tipoTramite.includes('Curso Vial')) {
            costoCia = 0; 
            proveedorCia = 'CIA VIP (Curso Vial)';
        }

        const valorCliente = Number(transaccion.valorCliente);
        const totalAbonado = Number(transaccion.totalAbonado || 0);
        const saldoPendiente = valorCliente - totalAbonado;
        const gananciaNeta = valorCliente - costoCia;

        const nuevoTramite = new TramiteTransito({
            numeroReciboFisico,
            tipoTramite,
            nombresApellidos,
            tipoDocumento,
            numeroDocumento,
            placaVehiculo: placaVehiculo || '',
            fechaRegistro: fechaRegistro ? new Date(fechaRegistro) : undefined,
            transaccion: {
                valorCliente,
                totalAbonado,
                saldoPendiente,
                costoCia,
                proveedorCia,
                estadoPagoCia: 'Pendiente',
                gananciaNeta,
                estadoPago: saldoPendiente <= 0 ? 'Cancelado' : 'Abonado'
            },
            creadoPor: req.usuario._id
        });

        await nuevoTramite.save();
        res.status(201).json({ mensaje: "Trámite registrado con éxito", tramite: nuevoTramite });
    } catch (error) {
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
// 5. OBTENER TRÁMITES
// ==========================================
const obtenerTramites = async (req, res) => {
    try {
        const { busqueda } = req.query;
        let filtro = {};

        if (busqueda) {
            filtro = {
                $or: [
                    { numeroReciboFisico: { $regex: busqueda, $options: 'i' } },
                    { nombresApellidos: { $regex: busqueda, $options: 'i' } },
                    { numeroDocumento: { $regex: busqueda, $options: 'i' } },
                    { placaVehiculo: { $regex: busqueda, $options: 'i' } }
                ]
            };
        }

        const tramites = await TramiteTransito.find(filtro).sort({ createdAt: -1 });
        res.status(200).json(tramites);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 6. CAMBIAR ESTADO DE PAGO AL PROVEEDOR (CIA/CRC/VIP)
// ==========================================
const cambiarEstadoPagoCia = async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoPagoCia } = req.body; // 'Pendiente' o 'Pagado'

        const tramite = await TramiteTransito.findById(id);
        if (!tramite) return res.status(404).json({ error: "Trámite no encontrado." });

        tramite.transaccion.estadoPagoCia = estadoPagoCia;
        await tramite.save();

        res.status(200).json({ mensaje: "Estado de pago al proveedor actualizado", tramite });
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
    eliminarTramite,
    obtenerTramites,
    cambiarEstadoPagoCia
};