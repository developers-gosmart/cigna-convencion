const lotteryButton = document.getElementById('lottery');
const message = document.getElementById('message');

lotteryButton.addEventListener("click", () => {
    const url = "https://wscigna.gosmartcrm.com:9000/ws/suscripcion/lottery";

    fetch(url)
        .then((response) => response.text())
        .then((response) => {
            const data = JSON.parse(response);
            if (data.code == 200) message.textContent = `el ganador es ${data.data.id}`;
        });
});