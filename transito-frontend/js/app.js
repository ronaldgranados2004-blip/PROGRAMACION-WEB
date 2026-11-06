const API_BASE_URL = 'http://localhost:4000/api'; // Puerto del backend

// Función para eliminar un trámite / cliente (Exclusivo Administrador)
async function eliminarRegistro(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) {
        return;
    }

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}/tramites/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // OBTENEMOS EL TEXTO CRUDO DE LO QUE DEVUELVE EL SERVIDOR
        const textoRespuesta = await response.text();
        console.log("--- RESPUESTA CRUDA DEL SERVIDOR ---");
        console.log("Status HTTP:", response.status);
        console.log("Contenido:", textoRespuesta);
        console.log("-------------------------------------");

        let datos;
        try {
            datos = JSON.parse(textoRespuesta);
        } catch (e) {
            alert(`El servidor devolvió HTML (Error ${response.status}). Revisa la consola del navegador para ver el detalle.`);
            return;
        }

        if (!response.ok) {
            alert(`Error al eliminar: ${datos.error || 'Desconocido'}`);
            return;
        }

        alert("¡Registro eliminado con éxito!");
        
        // Recargar la página para actualizar la tabla de trámites
        location.reload(); 

    } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor.");
    }
}