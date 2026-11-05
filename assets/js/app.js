
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
        const response = await fetch('data/presentes.json');

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

            const button = document.createElement('a');
            button.className = 'btn-gift';
            button.textContent = 'Comprar na loja';
            button.href = gift.url;
            button.target = '_blank';
            button.rel = 'noopener noreferrer';

            body.append(title, description, price, button);
            card.append(image, body);
            column.append(card);

            container.append(column);
        });

    } catch (error) {
        container.textContent = 'Não foi possível carregar os presentes.';
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
