const Licencia = require('../models/Licencia');
const TramiteTransito = require('../models/TramiteTransito');
// Importar los demás modelos que tengas (SOAT, Curso Vial, RUNT, etc.)

// ==========================================
// CONSULTAR CONSOLIDADO GENERAL / ARQUEO DE CAJA
// ==========================================
const obtenerConsolidadoGeneral = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        // Definir rango de fechas (por defecto el día de hoy)
        let inicio = fechaInicio ? new Date(fechaInicio) : new Date();
        inicio.setHours(0, 0, 0, 0);

        let fin = fechaFin ? new Date(fechaFin) : new Date();
        fin.setHours(23, 59, 59, 999);

        const filtroFecha = { createdAt: { $gte: inicio,$lte: fin } };

        // 1. Obtener registros de cada módulo en el rango de fechas
        const licencias = await Licencia.find(filtroFecha);
        const tramitesTransito = await TramiteTransito.find(filtroFecha);

        // 2. Consolidar todos los ítems en una lista unificada (Hoja General)
        const listaConsolidada = [];

        // Totales acumulados
        let totalRecaudadoCliente = 0;
        let totalGananciaContable = 0;
        let totalEfectivoEnCaja = 0;
        let totalSistecredito = 0;
        let totalGastosProveedores = 0;

        // Procesar Licencias
        licencias.forEach(item => {
            const cobroCliente = item.transaccion.valorCliente || 0;
            const abonoActual = item.transaccion.totalAbonado || 0;
            const ganancia = item.transaccion.gananciaContable || 0;
            const impactoCaja = item.transaccion.impactoEnCajaOperativa || 0;
            
            const gastosItem = (item.transaccion.costoEscuela || 0) + 
                               (item.transaccion.costoCRC || 0) + 
                               (item.transaccion.costoLamina || 0) + 
                               (item.transaccion.comisionTramitador || 0);

            totalRecaudadoCliente += abonoActual;
            totalGananciaContable += ganancia;
            totalEfectivoEnCaja += impactoCaja;
            if (item.transaccion.esSistecredito) totalSistecredito += cobroCliente;
            totalGastosProveedores += gastosItem;

            listaConsolidada.push({
                id: item._id,
                fecha: item.createdAt,
                recibo: item.numeroReciboFisico,
                modulo: 'Licencias',
                detalle: `${item.tipoServicio} - ${item.categoriasSeleccionadas.join(', ')}`,
                titular: item.nombresApellidos,
                metodoPago: item.transaccion.metodoPagoPrincipal,
                esSistecredito: item.transaccion.esSistecredito,
                valorCliente: cobroCliente,
                totalAbonado: abonoActual,
                saldoPendiente: item.transaccion.saldoPendiente,
                gastosProveedores: gastosItem,
                gananciaContable: ganancia,
                impactoCajaOperativa: impactoCaja,
                estadoLiquidacion: item.estadoLiquidacion
            });
        });

        // Procesar Trámites Tránsito
        tramitesTransito.forEach(item => {
            const cobroCliente = item.transaccion.valorCliente || 0;
            const abonoActual = item.transaccion.totalAbonado || 0;
            const ganancia = item.transaccion.gananciaContable || 0;
            const impactoCaja = item.transaccion.impactoEnCajaOperativa || 0;

            const gastosItem = (item.transaccion.derechosTransito || 0) + 
                               (item.transaccion.costoDomicilioRadicacion || 0) + 
                               (item.transaccion.costoImprontas || 0) + 
                               (item.transaccion.comisionTramitador || 0);

            totalRecaudadoCliente += abonoActual;
            totalGananciaContable += ganancia;
            totalEfectivoEnCaja += impactoCaja;
            if (item.transaccion.esSistecredito) totalSistecredito += cobroCliente;
            totalGastosProveedores += gastosItem;

            listaConsolidada.push({
                id: item._id,
                fecha: item.createdAt,
                recibo: item.numeroReciboFisico,
                modulo: 'Trámites Tránsito',
                detalle: `${item.tipoTramite} (${item.placaVehiculo})`,
                titular: item.nombresApellidos,
                metodoPago: item.transaccion.metodoPagoPrincipal,
                esSistecredito: item.transaccion.esSistecredito,
                valorCliente: cobroCliente,
                totalAbonado: abonoActual,
                saldoPendiente: item.transaccion.saldoPendiente,
                gastosProveedores: gastosItem,
                gananciaContable: ganancia,
                impactoCajaOperativa: impactoCaja,
                estadoLiquidacion: item.estadoLiquidacion
            });
        });

        // Ordenar la lista consolidada por fecha (más reciente primero)
        listaConsolidada.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        res.status(200).json({
            periodo: {
                desde: inicio,
                hasta: fin
            },
            resumenTotales: {
                totalTransacciones: listaConsolidada.length,
                totalCobradoClientes: totalRecaudadoCliente,
                totalGastosProveedores,
                totalGananciaContableLibros: totalGananciaContable,
                efectivoRealEnCajaHoy: totalEfectivoEnCaja,
                ventasPorSistecredito: totalSistecredito
            },
            hojaConsolidado: listaConsolidada
        });

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

module.exports = {
    obtenerConsolidadoGeneral
};