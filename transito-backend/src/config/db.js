const mongoose = require('mongoose');

const conectarDB = async () => {
    try {
        // Conecta usando la variable de entorno o una local por defecto
        const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/transito_db';
        
        await mongoose.connect(DB_URI);
        
        console.log('Base de datos conectada exitosamente a MongoDB');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error.message);
        process.exit(1); // Detiene la app si hay error crítico de conexión
    }
};

module.exports = conectarDB;