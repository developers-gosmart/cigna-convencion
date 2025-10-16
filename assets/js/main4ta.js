// Simulación de base de datos
const DATABASE = {
    '4074506676': {
        nombre: 'AINOHA IZA',
        telefono: '4074506676',
        email: 'kdiaz@plusinsurance.us',
        vip: true,
        comida: 'WEST PALM BOX LUNCH',
        registrado: false,
        horaRegistro: null
    },
    '1234567890': {
        nombre: 'Juan Pérez',
        telefono: '1234567890',
        email: 'juan@empower.com',
        vip: false,
        comida: 'STANDARD LUNCH',
        registrado: false,
        horaRegistro: null
    },
    '5551234567': {
        nombre: 'María García',
        telefono: '5551234567',
        email: 'maria@empower.com',
        vip: true,
        comida: 'MIAMI BOX LUNCH',
        registrado: false,
        horaRegistro: null
    }
};

// Variables de estado
let scanning = false;
let manualEntry = '';
let result = null;
let error = '';
let stats = { total: 0, checked: 0 };
let showStats = false;
let scanInterval = null;
let videoStream = null;
let deferredPrompt = null;
let cameraPermissionGranted = false;

// Variables para escaneo QR
let currentId = 0;
let lastScannedCode = "";

// Elementos del DOM
const installPrompt = document.getElementById('installPrompt');
const installButton = document.getElementById('installButton');
const offlineNotification = document.getElementById('offlineNotification');
const permissionRequest = document.getElementById('permissionRequest');
const allowCameraButton = document.getElementById('allowCameraButton');
const skipCameraButton = document.getElementById('skipCameraButton');
const statsToggle = document.getElementById('statsToggle');
const statsIcon = document.getElementById('statsIcon');
const statsContent = document.getElementById('statsContent');
const checkedCount = document.getElementById('checkedCount');
const totalCount = document.getElementById('totalCount');
const resultCard = document.getElementById('resultCard');
const successIcon = document.getElementById('successIcon');
const errorIcon = document.getElementById('errorIcon');
const successTitle = document.getElementById('successTitle');
const errorTitle = document.getElementById('errorTitle');
const resultName = document.getElementById('resultName');
const resultPhone = document.getElementById('resultPhone');
const resultEmail = document.getElementById('resultEmail');
const vipBadge = document.getElementById('vipBadge');
const generalBadge = document.getElementById('generalBadge');
const foodBadge = document.getElementById('foodBadge');
const resultTime = document.getElementById('resultTime');
const nextButton = document.getElementById('nextButton');
const scannerSection = document.getElementById('scannerSection');
const scannerContainer = document.getElementById('scannerContainer');
const videoPreview = document.getElementById('videoPreview');
const canvas = document.getElementById('canvas');
const stopButton = document.getElementById('stopButton');
const manualSection = document.getElementById('manualSection');
const scanButton = document.getElementById('scanButton');
const errorMessage = document.getElementById('errorMessage');

// Inicializar
updateStats();
checkCameraPermission();
setupPWA();

// Event listeners
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPrompt.style.display = 'block';
});

installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installPrompt.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

window.addEventListener('online', () => {
    offlineNotification.style.display = 'none';
});

window.addEventListener('offline', () => {
    offlineNotification.style.display = 'block';
});

allowCameraButton.addEventListener('click', requestCameraPermission);
skipCameraButton.addEventListener('click', skipCameraPermission);
statsToggle.addEventListener('click', toggleStats);
nextButton.addEventListener('click', resetResult);
scanButton.addEventListener('click', startCamera);
stopButton.addEventListener('click', stopCamera);

// Funciones PWA
function setupPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    }
}

// Funciones de permisos de cámara
function checkCameraPermission() {
    const permission = localStorage.getItem('cameraPermission');
    if (permission === 'granted') {
        cameraPermissionGranted = true;
        permissionRequest.style.display = 'none';
        scannerSection.classList.remove('hidden');
    } else if (permission === 'denied') {
        cameraPermissionGranted = false;
        permissionRequest.style.display = 'none';
        scannerSection.classList.remove('hidden');
    }
}

function requestCameraPermission() {
    localStorage.setItem('cameraPermission', 'granted');
    cameraPermissionGranted = true;
    permissionRequest.style.display = 'none';
    scannerSection.classList.remove('hidden');
    showMessage('Permiso de cámara concedido. Ahora puedes escanear códigos QR.');
}

function skipCameraPermission() {
    localStorage.setItem('cameraPermission', 'denied');
    cameraPermissionGranted = false;
    permissionRequest.style.display = 'none';
    scannerSection.classList.remove('hidden');
    showMessage('Puedes usar la entrada manual para buscar agentes.');
}

function showMessage(message) {
    errorMessage.textContent = message;
    errorMessage.style.background = 'rgba(34, 197, 94, 0.2)';
    errorMessage.style.border = '1px solid #22c55e';
    errorMessage.style.color = '#bbf7d0';
    errorMessage.classList.remove('hidden');

    setTimeout(() => {
        errorMessage.classList.add('hidden');
        errorMessage.style.background = '';
        errorMessage.style.border = '';
        errorMessage.style.color = '';
    }, 3000);
}

// Funciones de la aplicación
function updateStats() {
    const total = Object.keys(DATABASE).length;
    const checked = Object.values(DATABASE).filter(a => a.registrado).length;
    stats = { total, checked };

    checkedCount.textContent = checked;
    totalCount.textContent = total;
}

function toggleStats() {
    showStats = !showStats;
    if (showStats) {
        statsContent.classList.remove('hidden');
        statsIcon.classList.add('rotated');
    } else {
        statsContent.classList.add('hidden');
        statsIcon.classList.remove('rotated');
    }
}

async function startCamera() {
    if (!cameraPermissionGranted) {
        showError('No tienes permiso para usar la cámara. Por favor, permite el acceso.');
        return;
    }

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        videoPreview.srcObject = videoStream;
        videoPreview.play();
        scanning = true;
        error = '';
        hideError();

        scannerContainer.classList.remove('hidden');
        manualSection.classList.add('hidden');

        // Iniciar el ciclo de escaneo una vez que el video esté listo
        videoPreview.addEventListener("loadedmetadata", () => {
            scanQRCode();
        }, { once: true });

    } catch (err) {
        showError('No se pudo acceder a la cámara. Verifica los permisos o usa la entrada manual.');
    }
}

function stopCamera() {
    if (videoStream) {
        const tracks = videoStream.getTracks();
        tracks.forEach(track => track.stop());
        videoStream = null;
    }

    scanning = false;
    scannerContainer.classList.add('hidden');
    manualSection.classList.remove('hidden');
}

/**
 * Función principal para la detección continua de QR.
 */
function scanQRCode() {
    if (!scanning) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = videoPreview.videoWidth;
    canvas.height = videoPreview.videoHeight;
    context.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code && code.data && code.data !== lastScannedCode) {
        const data = code.data;
        lastScannedCode = data;
        console.log(`QR Detectado: ${data}`);

        // Procesar el código QR detectado llamando a la API
        fetchUserData(data);
    }

    // Seguir escaneando en el próximo frame si aún está escaneando
    if (scanning) {
        requestAnimationFrame(scanQRCode);
    }
}

/**
 * Obtiene los datos del usuario a partir del código QR escaneado.
 * @param {string} code - El código QR decodificado.
 */
async function fetchUserData(code) {
    const baseUrl = "https://wscigna.gscloud.us/ws/suscripcion/code";
    const url = `${baseUrl}?code=${code}`;

    console.log(`GET Request: ${url}`);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Respuesta completa de la API:', responseData);

        if (responseData.code === 200 && responseData.data) {
            // Convertir los datos de la API al formato interno de la aplicación
            const agente = {
                nombre: responseData.data.nombre_completo,
                telefono: responseData.data.telefono,
                email: responseData.data.email,
                vip: responseData.data.is_vip === 1,
                comida: responseData.data.meal,
                registrado: false,
                horaRegistro: null
            };

            // Mostrar los datos del agente
            displayUserData(agente);
            console.log(`Datos de usuario cargados para: ${agente.nombre}`);
        } else {
            console.log(`Error al obtener datos: ${responseData.message || "Code no 200"}`);
            showError(`Agente no encontrado en el sistema. Verifique el código QR escaneado.`);
        }

    } catch (error) {
        console.log(`GET Error: ${error.message}`);
        showError(`Error de red/servidor: ${error.message}`);
    } finally {
        // Detener el escaneo una vez que la petición se completa (éxito o error)
        stopCamera();
    }
}

/**
 * Muestra los datos del usuario obtenidos de la API
 * @param {Object} agente - Datos del agente en formato interno
 */
function displayUserData(agente) {
    // Verificar si el agente ya está registrado
    const telefono = agente.telefono;

    if (DATABASE[telefono] && DATABASE[telefono].registrado) {
        // Agente ya registrado
        showResult({
            success: false,
            message: 'Este agente ya fue registrado',
            agente: DATABASE[telefono]
        });
    } else {
        // Registrar al agente
        if (!DATABASE[telefono]) {
            // Agente nuevo, agregar a la base de datos
            DATABASE[telefono] = agente;
        }

        DATABASE[telefono].registrado = true;
        DATABASE[telefono].horaRegistro = new Date().toLocaleString('es-ES');

        showResult({
            success: true,
            agente: DATABASE[telefono]
        });

        // Actualizar estadísticas
        updateStats();
    }
}

function handleScanResult(code) {
    const agente = buscarAgente(code);
    if (agente) {
        registrarAsistencia(code);
    } else {
        showError('Código QR no reconocido. Agente no encontrado.');
    }
}

function buscarAgente(codigo) {
    return DATABASE[codigo] || null;
}

function registrarAsistencia(codigo) {
    const agente = DATABASE[codigo];
    if (agente && !agente.registrado) {
        agente.registrado = true;
        agente.horaRegistro = new Date().toLocaleString('es-ES');
        showResult({ success: true, agente });
        stopCamera();
        manualEntry = '';
    } else if (agente && agente.registrado) {
        showResult({ success: false, message: 'Este agente ya fue registrado', agente });
        stopCamera();
        manualEntry = '';
    }
}

function showResult(resultData) {
    result = resultData;
    scannerSection.classList.add('hidden');
    resultCard.classList.remove('hidden');

    if (resultData.success) {
        successIcon.classList.remove('hidden');
        successTitle.classList.remove('hidden');
        errorIcon.classList.add('hidden');
        errorTitle.classList.add('hidden');
        resultCard.className = 'result-card result-success';
    } else {
        successIcon.classList.add('hidden');
        successTitle.classList.add('hidden');
        errorIcon.classList.remove('hidden');
        errorTitle.classList.remove('hidden');
        resultCard.className = 'result-card result-error';
    }

    resultName.textContent = resultData.agente.nombre;
    resultPhone.textContent = resultData.agente.telefono;
    resultEmail.textContent = resultData.agente.email;

    if (resultData.agente.vip) {
        vipBadge.classList.remove('hidden');
        generalBadge.classList.add('hidden');
    } else {
        vipBadge.classList.add('hidden');
        generalBadge.classList.remove('hidden');
    }

    foodBadge.textContent = '🍴 ' + resultData.agente.comida;

    if (resultData.agente.horaRegistro) {
        resultTime.textContent = resultData.agente.horaRegistro;
    }

    updateStats();
}

function resetResult() {
    result = null;
    error = '';
    manualEntry = '';
    lastScannedCode = "";

    resultCard.classList.add('hidden');
    scannerSection.classList.remove('hidden');
    hideError();
}

function showError(message) {
    error = message;
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    error = '';
    errorMessage.classList.add('hidden');
}