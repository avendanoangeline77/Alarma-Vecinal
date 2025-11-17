// --- Configuraciones de Conexión de la Base ---
const BROKER_HOST = "10.56.13.2";
const BROKER_PORT_WS = 9001;
const CLIENT_ID = "base_monitoreo_" + parseInt(Math.random() * 1000, 10); 

// Tópicos de comunicación
const TOPIC_ALERTA_ENTRANTE = "alarma_vecinal/alerta_robo";
const TOPIC_CONFIRMACION_SALIENTE = "alarma_vecinal/confirmacion";

// Elementos del DOM
const estadoConexion = document.getElementById("estado-conexion");
const alertaDisplay = document.getElementById("alerta-display");


// --- Inicialización y Conexión ---
const client = new Paho.MQTT.Client(BROKER_HOST, BROKER_PORT_WS, CLIENT_ID);
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// 🟢 MODIFICACIÓN 1: Establecer el estado inicial y conectar.
estadoConexion.innerHTML = `Conexión: <span>Intentando conectar...</span>`;
estadoConexion.className = 'estado-desconectado'; // Clase inicial (Rojo/Offline)

client.connect({ onSuccess: onConnect, onFailure: onFailure, useSSL: false });

function onConnect() {
    // 🟢 MODIFICACIÓN 2: Actualizar la clase y el texto al conectarse.
    estadoConexion.className = 'estado-conectado';
    estadoConexion.innerHTML = `Conexión: <span>CONECTADA</span>`;
    
    // Aseguramos que el display de alerta esté en estado normal al inicio.
    alertaDisplay.className = 'estado-normal';
    alertaDisplay.innerHTML = `<h2>Sistema Activo | En Espera</h2>`;
    
    // La Base se suscribe al tópico de alerta
    client.subscribe(TOPIC_ALERTA_ENTRANTE); 
    console.log(`Suscrito a alertas: ${TOPIC_ALERTA_ENTRANTE}`);
}

function onFailure(response) {
    // 🟢 MODIFICACIÓN 3: Actualizar la clase y el texto al fallar la conexión.
    estadoConexion.className = 'estado-desconectado';
    estadoConexion.innerHTML = `Conexión: <span>FALLO (${response.errorMessage})</span>`;
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        // 🟢 MODIFICACIÓN 4: Actualizar la clase y el texto al perder la conexión.
        estadoConexion.className = 'estado-desconectado';
        estadoConexion.innerHTML = `Conexión: <span>PERDIDA</span>`;
    }
}

// --- Lógica de Alerta ---

function onMessageArrived(message) {
    const payload = message.payloadString;
    const topic = message.destinationName;

    // Solo reaccionar a la alerta entrante del vecino
    if (topic === TOPIC_ALERTA_ENTRANTE) {
        
        if (payload.includes("ALERTA: Robo")) {
            console.log(`¡Alerta recibida! Mostrando aviso: ${payload}`);

            // 🟢 MODIFICACIÓN 5: Cambiar la clase para activar el estilo de ALARMA.
            alertaDisplay.className = 'alerta-activa';
            alertaDisplay.innerHTML = `
                <h2>🚨 ¡ALERTA DE EMERGENCIA: ROBO! 🚨</h2>
                <p>AVISO RECIBIDO: <strong>${payload}</strong></p>
                <p>Confirmación enviada al dispositivo vecino...</p>
            `;
            
            // 2. Publicar la confirmación al ESP32
            const confirmacion = new Paho.MQTT.Message("BASE_RECIBIO");
            confirmacion.destinationName = TOPIC_CONFIRMACION_SALIENTE;
            client.send(confirmacion);
            console.log("Confirmación enviada al ESP32 en el tópico: " + TOPIC_CONFIRMACION_SALIENTE);

        } else if (payload === "DISPOSITIVO_ONLINE") {
             // Manejar el mensaje de estado inicial si es necesario
             console.log("ESP32 se ha conectado.");
        }
    }
}

function desactivarAlertaVisual() {
    // 🟢 MODIFICACIÓN 6: Restaurar la clase y el texto a estado normal.
    console.log("Alerta visual desactivada.");
    alertaDisplay.className = 'estado-normal';
    alertaDisplay.innerHTML = `<h2>Sistema Activo | En Espera</h2>`;
}