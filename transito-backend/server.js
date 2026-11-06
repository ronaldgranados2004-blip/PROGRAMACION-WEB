const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/transito-backend')
    .then(() => console.log('✅ Conectado exitosamente a MongoDB'))
    .catch((err) => console.error('❌ Error de conexión a MongoDB:', err));

// ==========================================
// IMPORTACIÓN DE RUTAS DE TODOS LOS MÓDULOS
// ==========================================
const authRoutes = require('./src/routes/authRoutes');
const licenciaRoutes = require('./src/routes/licenciaRoutes');
const tramiteTransitoRoutes = require('./src/routes/tramiteTransitoRoutes');
const soatRoutes = require('./src/routes/soatRoutes');
const cursoVialRoutes = require('./src/routes/cursoVialRoutes');
const runtRoutes = require('./src/routes/runtRoutes');
const consolidadoRoutes = require('./src/routes/consolidadoRoutes');
const gastoRoutes = require('./src/routes/gastoRoutes');

// ==========================================
// REGISTRO DE ENDPOINTS PRINCIPALES (API)
// ==========================================
app.use('/api/auth', authRoutes);                      // Login y Usuarios
app.use('/api/licencias', licenciaRoutes);             // Licencias de conducción
app.use('/api/tramites', tramiteTransitoRoutes);       // 👈 Corregido a '/api/tramites' para que coincida con el frontend
app.use('/api/soat', soatRoutes);                      // Pólizas SOAT
app.use('/api/curso-vial', cursoVialRoutes);          // Cursos viales
app.use('/api/runt', runtRoutes);                      // Trámites ante el RUNT
app.use('/api/consolidado', consolidadoRoutes);        // Caja diaria y reportes (Solo Admin)
app.use('/api/gastos', gastoRoutes);

// Ruta de prueba base
app.get('/', (req, res) => {
    res.send('Servidor del Sistema de Tránsito funcionando correctamente 🚀');
});



// Puerto de ejecución
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});