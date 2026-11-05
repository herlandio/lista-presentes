const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatDate = (value) => {
    if (!value) return 'Data a definir';

    const [year, month, day] = value.split('-');

    return `${day}/${month}/${year}`;
};

async function loadGifts() {
    const container = document.getElementById('gifts-container');

    try {
        const [response, reservedIds] = await Promise.all([
            fetch('data/presentes.json'),
            ReservationService.getReservedGiftIds()
        ]);

        if (!response.ok) {
            throw new Error('Não foi possível carregar a lista.');
        }

        const data = await response.json();

        document.getElementById('birthday-title').textContent =
            data.aniversariante.titulo;

        document.getElementById('birthday-message').textContent =
            data.aniversariante.mensagem;

        document.getElementById('birthday-date').textContent =
            formatDate(data.aniversariante.data);

        container.innerHTML = '';

        data.presentes.forEach(gift => {
            const column = document.createElement('div');
            column.className = 'col-12 col-sm-6 col-lg-4';

            const card = document.createElement('article');
            card.className = 'card gift-card';

            const image = document.createElement('img');
            image.className = 'gift-image';
            image.src = gift.imagem;
            image.alt = gift.nome;

            const body = document.createElement('div');
            body.className = 'card-body';

            const title = document.createElement('h3');
            title.textContent = gift.nome;

            const description = document.createElement('p');
            description.className = 'gift-description';
            description.textContent = gift.descricao;

            const price = document.createElement('div');
            price.className = 'gift-price';
            price.textContent = formatCurrency(gift.preco);

            const actions = document.createElement('div');
            actions.className = 'd-grid gap-2';

            const isReserved =
                reservedIds.includes(Number(gift.id)) ||
                gift.disponivel === false;

            const reserveButton = document.createElement('button');

            reserveButton.type = 'button';
            reserveButton.className = 'btn-gift';

            if (isReserved) {
                reserveButton.textContent = 'Presente escolhido';
                reserveButton.disabled = true;
            } else {
                reserveButton.textContent = 'Reservar presente';

                reserveButton.addEventListener('click', async () => {
                    const guestName = prompt('Qual é o seu nome?');

                    if (!guestName || !guestName.trim()) {
                        return;
                    }

                    reserveButton.disabled = true;
                    reserveButton.textContent = 'Reservando...';

                    try {
                        await ReservationService.reserveGift(
                            gift.id,
                            guestName.trim()
                        );

                        reserveButton.textContent = 'Presente escolhido';

                        alert(
                            'Reserva realizada com sucesso! Obrigado pelo carinho!'
                        );

                    } catch (error) {
                        if (error.message.includes('já foi reservado')) {
                            reserveButton.textContent = 'Presente escolhido';

                            alert(
                                'Este presente acabou de ser reservado por outra pessoa.'
                            );
                        } else {
                            reserveButton.disabled = false;
                            reserveButton.textContent = 'Reservar presente';

                            alert(error.message);
                        }
                    }
                });
            }

            const storeButton = document.createElement('a');

            storeButton.className = 'btn btn-outline-secondary';
            storeButton.textContent = 'Ver produto na loja';
            storeButton.href = gift.url;
            storeButton.target = '_blank';
            storeButton.rel = 'noopener noreferrer';

            actions.append(reserveButton, storeButton);

            body.append(title, description, price, actions);
            card.append(image, body);
            column.append(card);

            container.append(column);
        });

    } catch (error) {
        container.textContent =
            'Não foi possível carregar os presentes e consultar as reservas. Tente novamente mais tarde.';

        console.error(error);
    }
}

loadGifts();


const shareButton = document.getElementById('share-button');
const copyButton = document.getElementById('copy-button');
const copyFeedback = document.getElementById('copy-feedback');

const getShareMessage = () => {
    const title = document.getElementById('birthday-title').textContent;

    return `Confira minha lista de presentes: ${title} ${window.location.href}`;
};

shareButton.addEventListener('click', async () => {
    const shareData = {
        title: document.title,
        text: getShareMessage(),
        url: window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Erro ao compartilhar:', error);
            }
        }

        return;
    }

    const whatsappUrl =
        `https://wa.me/?text=${encodeURIComponent(getShareMessage())}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
});

copyButton.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(window.location.href);

        copyFeedback.textContent = 'Link copiado com sucesso!';
    } catch (error) {
        copyFeedback.textContent =
            'Não foi possível copiar automaticamente o link.';
    }
});