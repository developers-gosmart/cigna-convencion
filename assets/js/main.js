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
var oldCode = "";

let scanning = false;

registerButton.addEventListener("click", () => {
  const url = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion/event";
  const params = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: id,
    }),
  };

  fetch(url, params)
    .then((response) => response.text())
    .then((response) => {
      const data = JSON.parse(response);
      if (data.code == 200) message.textContent = "Registrado exitosamente";
    });
});

// Al hacer clic en el botón, iniciamos el escaneo QR
startScanButton.addEventListener("click", () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("La API de la cámara no es compatible con este navegador.");
    return;
  }

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
      scanning = true;

      // Escuchar el video para detectar el QR usando la librería jsQR
      video.addEventListener("loadedmetadata", () => {
        scanQRCode();
      });
    })
    .catch((err) => {
      console.error("Error accediendo a la cámara: ", err);
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

    let baseUrl = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion/code";
    let params = {
      code: data,
    };

    // Construir la cadena de parámetros
    let queryString = new URLSearchParams(params).toString();
    let url = `${baseUrl}?${queryString}`;

    fetch(url)
      .then((response) => response.text())
      .then((response) => {
        const data = JSON.parse(response);
        const user = data.data;
        id = user.id;
        fullName.textContent = user.nombre_completo;
        phone.textContent = user.telefono;
        email.textContent = user.email;
        vip.textContent = user.is_vip ? "Si" : "No";
        takeout.textContent = user.meal;
        scanning = false;
        video.srcObject.getTracks().forEach((track) => track.stop());
        oldCode = "";
      });
  }

  if (scanning) {
    requestAnimationFrame(scanQRCode);
  }
}
