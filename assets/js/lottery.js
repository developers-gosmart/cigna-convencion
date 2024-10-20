const lotteryButton = document.getElementById('lottery-button');
const winner = document.getElementById('winner');

lotteryButton.addEventListener("click", () => {
    const url = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion/lottery";

    winner.textContent = '';

    fetch(url)
        .then((response) => response.text())
        .then((response) => {
            const data = JSON.parse(response);
            if (data.code == 200) {
                winner.textContent = `${data.data.nombre
                    } ${data.data.apellido}`;
            }
        });
});