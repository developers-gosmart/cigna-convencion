// Verifica si el navegador soporta la API de medios
const video = document.getElementById("qr-video");
const fullName = document.getElementById("full-name");
const phone = document.getElementById("phone");
const email = document.getElementById("email");
const vip = document.getElementById("vip");
const takeout = document.getElementById("eat");
const message = document.getElementById("message");
var id = 0;
const startScanButton = document.getElementById("start-scan");
const registerButton = document.getElementById("register");
// NUEVO: Referencia al div del log
const fetchLog = document.getElementById("fetch-log");
var oldCode = "";

let scanning = false;

// NUEVO: Función para agregar mensajes al log
function logFetch(msg) {
  const now = new Date().toLocaleTimeString();
  fetchLog.innerHTML += `<p style="margin: 0; padding: 2px 0;">[${now}] ${msg}</p>`;
  // Desplazar hacia abajo
  fetchLog.scrollTop = fetchLog.scrollHeight;
}


registerButton.addEventListener("click", () => {
  const url = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion/event";
  const bodyData = { id: id };
  // Log antes de la petición
  logFetch(`PUT Request: ${url} con body: ${JSON.stringify(bodyData)}`);

  const params = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyData),
  };

  fetch(url, params)
    .then((response) => response.text())
    .then((response) => {
      // Log de la respuesta
      logFetch(`PUT Response OK: ${response.substring(0, 50)}...`);
      const data = JSON.parse(response);
      if (data.code == 200) message.textContent = "Registrado exitosamente";
    })
    // Log de errores
    .catch(error => {
      logFetch(`PUT Error: ${error.message}`);
    });
});

// Al hacer clic en el botón, iniciamos el escaneo QR
startScanButton.addEventListener("click", () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("La API de la cámara no es compatible con este navegador.");
    return;
  }

  // Log de inicio de cámara
  logFetch("Iniciando acceso a la cámara...");

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
      scanning = true;
      // Log de cámara exitosa
      logFetch("Cámara accedida con éxito. Escaneo en curso.");

      // Escuchar el video para detectar el QR usando la librería jsQR
      video.addEventListener("loadedmetadata", () => {
        scanQRCode();
      });
    })
    .catch((err) => {
      console.error("Error accediendo a la cámara: ", err);
      // Log de error de cámara
      logFetch(`ERROR: Error al acceder a la cámara: ${err.message}`);
    });
});

// Función para escanear el código QR
function scanQRCode() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, canvas.width, canvas.height);

  if (code) {
    let data = code.data;
    if (oldCode === data) return;
    else oldCode = data;

    // Log de código QR detectado
    logFetch(`QR Detectado: ${data}`);

    let baseUrl = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion/code";
    let params = {
      code: data,
    };

    // Construir la cadena de parámetros
    let queryString = new URLSearchParams(params).toString();
    let url = `${baseUrl}?${queryString}`;

    // Log antes de la petición GET
    logFetch(`GET Request: ${url}`);

    fetch(url)
      .then((response) => response.text())
      .then((response) => {
        // Log de la respuesta
        logFetch(`GET Response OK: ${response.substring(0, 50)}...`);

        takeout.classList.remove('comida_chicken');
        takeout.classList.remove('comida_west_palm');
        takeout.classList.remove('comida_the_italian');
        const data = JSON.parse(response);
        const user = data.data;
        id = user.id;
        fullName.textContent = user.nombre_completo;
        phone.textContent = user.telefono;
        email.textContent = user.email;
        vip.textContent = user.is_vip ? "Si" : "No";
        takeout.textContent = user.meal;
        if (user.meal.toUpperCase().includes("CHICKEN")) {
          takeout.classList.add('comida_chicken');
        } else if (user.meal.toUpperCase().includes("WEST PALM")) {
          takeout.classList.add('comida_west_palm');
        } else if (user.meal.toUpperCase().includes("THE ITALIAN")) {
          takeout.classList.add('comida_the_italian');
        }
        scanning = false;
        video.srcObject.getTracks().forEach((track) => track.stop());
        oldCode = "";
      })
      // Log de errores
      .catch(error => {
        logFetch(`GET Error: ${error.message}`);
      });
  }

  if (scanning) {
    requestAnimationFrame(scanQRCode);
  }

}