// main.js - Refactorizado

document.addEventListener("DOMContentLoaded", () => {
  // 1. Obtención de Elementos del DOM
  // ===================================
  const video = document.getElementById("qr-video");
  const fullName = document.getElementById("full-name");
  const phone = document.getElementById("phone");
  const email = document.getElementById("email");
  const vip = document.getElementById("vip");
  const takeout = document.getElementById("eat");
  const message = document.getElementById("message");
  const startScanButton = document.getElementById("start-scan");
  const registerButton = document.getElementById("register");
  const fetchLog = document.getElementById("fetch-log"); // Referencia segura aquí

  // 2. Variables de Estado
  // ======================
  let currentId = 0;
  let scanning = false;
  let lastScannedCode = "";

  // 3. Funciones Utilitarias
  // ========================

  /**
   * Agrega un mensaje al div de log.
   * @param {string} msg - El mensaje a loguear.
   */
  function logFetch(msg) {
    if (!fetchLog) return; // Chequeo de seguridad

    const now = new Date().toLocaleTimeString();
    fetchLog.innerHTML += `<p style="margin: 0; padding: 2px 0;">[${now}] ${msg}</p>`;
    // Desplazar hacia abajo
    fetchLog.scrollTop = fetchLog.scrollHeight;
  }

  /**
   * Limpia y actualiza los campos de información del usuario.
   * @param {object} user - Objeto con los datos del usuario.
   */
  function displayUserData(user) {
    currentId = user.id;
    fullName.textContent = user.nombre_completo;
    phone.textContent = user.telefono;
    email.textContent = user.email;
    vip.textContent = user.is_vip ? "Si" : "No";
    takeout.textContent = user.meal;
    message.textContent = ""; // Limpiar mensaje anterior

    // Limpiar clases y aplicar la nueva basada en la comida
    takeout.classList.remove('comida_chicken', 'comida_west_palm', 'comida_the_italian');
    const meal = user.meal.toUpperCase();

    if (meal.includes("CHICKEN")) {
      takeout.classList.add('comida_chicken');
    } else if (meal.includes("WEST PALM")) {
      takeout.classList.add('comida_west_palm');
    } else if (meal.includes("THE ITALIAN")) {
      takeout.classList.add('comida_the_italian');
    }
  }


  // 4. Lógica de Peticiones Fetch
  // =============================

  /**
   * Envía una petición PUT para registrar el evento del usuario.
   */
  registerButton.addEventListener("click", async () => {
    if (currentId === 0) {
      message.textContent = "¡Escanea un código QR primero!";
      return;
    }

    const url = "https://wscigna.gscloud.us/ws/suscripcion/event";
    const bodyData = { id: currentId };

    logFetch(`PUT Request: ${url} con body: ${JSON.stringify(bodyData)}`);

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const responseText = await response.text();
      logFetch(`PUT Response OK: ${responseText.substring(0, 50)}...`);

      const data = JSON.parse(responseText);
      if (data.code === 200) {
        message.textContent = "Registrado exitosamente";
        logFetch("Registro exitoso (Code 200).");
      } else {
        message.textContent = `Error al registrar: ${data.message || "Error desconocido"}`;
        logFetch(`Error en la API: ${data.message || "Code no 200"}`);
      }

    } catch (error) {
      logFetch(`PUT Error: ${error.message}`);
      message.textContent = `Error de red/servidor: ${error.message}`;
    }
  });

  /**
   * Obtiene los datos del usuario a partir del código QR escaneado.
   * @param {string} code - El código QR decodificado.
   */
  async function fetchUserData(code) {
    const baseUrl = "https://wscigna.gscloud.us/ws/suscripcion/code";
    const url = `${baseUrl}?code=${code}`;

    logFetch(`GET Request: ${url}`);

    try {
      const response = await fetch(url);
      const responseText = await response.text();

      logFetch(`GET Response OK: ${responseText.substring(0, 50)}...`);

      const data = JSON.parse(responseText);

      if (data.code === 200 && data.data) {
        displayUserData(data.data);
        logFetch(`Datos de usuario cargados para ID: ${data.data.id}`);
      } else {
        logFetch(`Error al obtener datos: ${data.message || "Code no 200"}`);
        message.textContent = `Error: ${data.message || "No se encontraron datos."}`;
        // Opcional: limpiar campos si hay un error en el QR
        currentId = 0;
        fullName.textContent = ''; phone.textContent = ''; email.textContent = ''; vip.textContent = ''; takeout.textContent = '';
      }

    } catch (error) {
      logFetch(`GET Error: ${error.message}`);
      message.textContent = `Error de red/servidor: ${error.message}`;
    } finally {
      // Detener el escaneo una vez que la petición se completa (éxito o error)
      stopScanning();
    }
  }

  // 5. Lógica de Escaneo QR (Cámara)
  // =================================

  /**
   * Detiene el video y la cámara.
   */
  function stopScanning() {
    if (!scanning) return;
    scanning = false;
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
    lastScannedCode = ""; // Resetear el código para permitir un nuevo escaneo
    logFetch("Escaneo finalizado.");
  }

  /**
   * Función principal para la detección continua de QR.
   */
  function scanQRCode() {
    if (!scanning) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code && code.data && code.data !== lastScannedCode) {
      const data = code.data;
      lastScannedCode = data;
      logFetch(`QR Detectado: ${data}`);
      fetchUserData(data); // Iniciar la petición GET
      // El stopScanning se llama dentro de fetchUserData.finally
    }

    // Seguir escaneando en el próximo frame
    requestAnimationFrame(scanQRCode);
  }

  /**
   * Inicializa la cámara y el proceso de escaneo.
   */
  startScanButton.addEventListener("click", () => {
    if (scanning) {
      stopScanning(); // Si ya está escaneando, detenerlo
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("La API de la cámara no es compatible con este navegador.");
      logFetch("ERROR: Cámara no soportada por el navegador.");
      return;
    }

    logFetch("Iniciando acceso a la cámara...");
    message.textContent = "Activando cámara...";

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
        scanning = true;
        message.textContent = "Cámara activa. Escaneando...";
        logFetch("Cámara accedida con éxito. Escaneo en curso.");

        // Iniciar el ciclo de escaneo una vez que el video esté listo
        video.addEventListener("loadedmetadata", () => {
          scanQRCode();
        }, { once: true });
      })
      .catch((err) => {
        console.error("Error accediendo a la cámara: ", err);
        logFetch(`ERROR: Error al acceder a la cámara: ${err.name} - ${err.message}`);
        message.textContent = "Error al acceder a la cámara. Revisa permisos.";
      });
  });

  // 6. Configuración Inicial
  // ========================
  logFetch("Aplicación inicializada. Esperando iniciar escaneo.");
});