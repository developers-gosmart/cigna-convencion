const lotteryButton = document.getElementById('lottery-button');
const winnerElement = document.getElementById('winner'); // Cambié 'winner' a 'winnerElement' para evitar confusión con la variable dentro de la función

// Lista de nombres y apellidos genéricos para el efecto de conteo rápido
const names = ["Ricardo", "Andrea", "Carlos", "Isabella", "Javier", "Laura", "Miguel", "Sofía", "Fernando", "Elena", "Alejandro", "Valeria"];
const surnames = ["Gómez", "Rodríguez", "Pérez", "Martínez", "López", "González", "Díaz", "Sánchez", "Romero", "Torres", "Vargas", "Molina"];
const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ";

let intervalId = null; // Para almacenar el ID del intervalo y poder detenerlo

// Función para generar nombres/letras aleatorias para el efecto visual
function generateRandomText() {
    // Opción 1: Mezcla de letras aleatorias (más caótico)
    /*
    let randomText = '';
    for (let i = 0; i < 20; i++) {
        randomText += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomText;
    */

    // Opción 2: Nombres genéricos aleatorios (más legible)
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomSurname = surnames[Math.floor(Math.random() * surnames.length)];
    return `${randomName} ${randomSurname}`;
}

// Función principal de sorteo
lotteryButton.addEventListener("click", () => {
    const url = "https://wscigna.gscloud.us/ws/suscripcion/lottery";

    // 1. Limpiar el texto y empezar el efecto de parpadeo (si tu CSS lo maneja)
    winnerElement.textContent = '';
    winnerElement.classList.add('parpadea'); // Asegura que el parpadeo esté activo

    // 2. Iniciar el efecto de conteo rápido (cada 50ms)
    intervalId = setInterval(() => {
        winnerElement.textContent = generateRandomText();
    }, 50);

    // 3. Desactivar el botón para evitar clics múltiples durante el sorteo
    lotteryButton.disabled = true;

    // 4. Realizar la solicitud de la API
    fetch(url)
        .then((response) => response.text())
        .then((response) => {
            const data = JSON.parse(response);

            // 5. Establecer un temporizador para detener el efecto y mostrar el ganador final después de 5 segundos
            setTimeout(() => {
                // Detener el intervalo de texto aleatorio
                clearInterval(intervalId);

                // Mostrar el ganador real
                if (data.code == 200) {
                    winnerElement.textContent = `${data.data.nombre} ${data.data.apellido}`;
                } else {
                    winnerElement.textContent = 'Error al obtener ganador';
                }

                // Detener el parpadeo
                winnerElement.classList.remove('parpadea');

                // Reactivar el botón
                lotteryButton.disabled = false;
            }, 5000); // 5000 milisegundos = 5 segundos
        })
        .catch((error) => {
            console.error('Error:', error);

            // Si hay un error, detener el efecto y mostrar el mensaje de error inmediatamente
            clearInterval(intervalId);
            winnerElement.textContent = 'Error al obtener ganador';
            winnerElement.classList.remove('parpadea');
            lotteryButton.disabled = false;
        });
});