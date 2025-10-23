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
    const viewParam = lotteryButton.getAttribute('data-view');
    const urlBase = "https://wscigna.gscloud.us/ws/suscripcion/lottery";
    const url = viewParam ? `${urlBase}?vip=${viewParam}` : urlBase;

    winnerElement.textContent = '';
    winnerElement.classList.add('parpadea'); // Asegura que el parpadeo esté activo

    lotteryButton.disabled = true;

    // 4. Realizar la solicitud de la API
    fetch(url)
        .then((response) => response.text())
        .then((response) => {
            const data = JSON.parse(response);

            clearInterval(intervalId);

            // Mostrar el ganador real
            if (data.code == 200) {
                winnerElement.textContent = truncarTexto(`${data.data.nombre} ${data.data.apellido}`);
            } else {
                winnerElement.textContent = 'Error al obtener ganador';
            }

            // Detener el parpadeo
            winnerElement.classList.remove('parpadea');
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

function truncarTexto(texto, maxCaracteres = 25) {
    if (texto.length > maxCaracteres) {
        return texto.substring(0, maxCaracteres) + '...';
    }
    return texto;
}