
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
