const lotteryButton = document.getElementById('lottery');
const message = document.getElementById('message');

lotteryButton.addEventListener("click", () => {
    const url = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion/lottery";

    fetch(url)
        .then((response) => response.text())
        .then((response) => {
            const data = JSON.parse(response);
            if (data.code == 210) {
                Swal.fire({
                    title: "Participante",
                    html: `<h2><strong>${completarConCeros(10)} - ${data.data.nombre
                        } ${data.data.apellido}</strong></h2>`,
                    icon: "success",
                });
                $(".swal2-container").css('background-image', 'url("assets/image/7I2Io9.gif")');
            }
        });
});

function completarConCeros(cadena) {
    while (cadena.length < 3) {
        cadena = "0" + cadena;
    }
    return cadena;
}