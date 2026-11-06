const Gasto = require('../models/Gasto');

// Registrar un nuevo gasto
const registrarGasto = async (req, res) => {
    try {
        const { descripcion, monto } = req.body;
        if (!descripcion || !monto) {
            return res.status(400).json({ error: "La descripción y el monto son obligatorios." });
        }

        const nuevoGasto = new Gasto({
            descripcion,
            monto: Number(monto),
            registradoPor: req.usuario._id
        });

        await nuevoGasto.save();
        res.status(201).json({ mensaje: "Gasto registrado con éxito", gasto: nuevoGasto });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener todos los gastos del mes / generales
const obtenerGastos = async (req, res) => {
    try {
        const gastos = await Gasto.find().sort({ createdAt: -1 });
        res.status(200).json(gastos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar un gasto
const eliminarGasto = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await Gasto.findByIdAndDelete(id);
        if (!eliminado) return res.status(404).json({ error: "Gasto no encontrado." });
        res.status(200).json({ mensaje: "Gasto eliminado correctamente." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { registrarGasto, obtenerGastos, eliminarGasto };