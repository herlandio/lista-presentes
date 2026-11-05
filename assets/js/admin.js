
const DATA_URL = 'data/presentes.json';

let giftData = null;

const form = document.getElementById('gift-form');
const giftsList = document.getElementById('gifts-list');
const message = document.getElementById('admin-message');

const fields = {
    id: document.getElementById('gift-id'),
    name: document.getElementById('gift-name'),
    description: document.getElementById('gift-description'),
    price: document.getElementById('gift-price'),
    image: document.getElementById('gift-image'),
    url: document.getElementById('gift-url'),
    availability: document.getElementById('gift-availability')
};

function showMessage(text, type = 'success') {
    message.textContent = text;
    message.className = `alert alert-${type}`;
}

function hideMessage() {
    message.className = 'alert d-none';
}

function resetForm() {
    form.reset();
    fields.id.value = '';
    fields.availability.value = 'true';

    document.getElementById('form-title').textContent =
        'Adicionar presente';

    document.getElementById('cancel-edit').classList.add('d-none');
}

function renderGifts() {
    giftsList.innerHTML = '';

    document.getElementById('gift-count').textContent =
        `${giftData.presentes.length} presentes`;

    if (giftData.presentes.length === 0) {
        giftsList.textContent = 'Nenhum presente cadastrado.';
        return;
    }

    giftData.presentes.forEach(gift => {
        const item = document.createElement('div');
        item.className =
            'd-flex flex-wrap justify-content-between align-items-center gap-3 border-bottom py-3';

        const info = document.createElement('div');

        const name = document.createElement('strong');
        name.textContent = gift.nome;

        const price = document.createElement('div');
        price.className = 'small text-secondary';

        price.textContent = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(gift.preco);

        info.append(name, price);

        const actions = document.createElement('div');
        actions.className = 'd-flex gap-2';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn btn-sm btn-outline-primary';
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', () => editGift(gift.id));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn btn-sm btn-outline-danger';
        deleteButton.textContent = 'Excluir';
        deleteButton.addEventListener('click', () => deleteGift(gift.id));

        actions.append(editButton, deleteButton);
        item.append(info, actions);

        giftsList.append(item);
    });
}

function editGift(id) {
    const gift = giftData.presentes.find(item => item.id === id);

    if (!gift) return;

    fields.id.value = gift.id;
    fields.name.value = gift.nome;
    fields.description.value = gift.descricao || '';
    fields.price.value = gift.preco;
    fields.image.value = gift.imagem;
    fields.url.value = gift.url;
    fields.availability.value = String(gift.disponivel !== false);

    document.getElementById('form-title').textContent =
        'Editar presente';

    document.getElementById('cancel-edit').classList.remove('d-none');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteGift(id) {
    const confirmed = window.confirm(
        'Deseja realmente excluir este presente?'
    );

    if (!confirmed) return;

    giftData.presentes = giftData.presentes.filter(
        gift => gift.id !== id
    );

    resetForm();
    renderGifts();
    showMessage('Presente removido. Baixe o JSON para aplicar a alteração.');
}

form.addEventListener('submit', event => {
    event.preventDefault();
    hideMessage();

    const gift = {
        nome: fields.name.value.trim(),
        descricao: fields.description.value.trim(),
        preco: Number(fields.price.value),
        imagem: fields.image.value.trim(),
        url: fields.url.value.trim(),
        disponivel: fields.availability.value === 'true'
    };

    if (
        !gift.nome ||
        !Number.isFinite(gift.preco) ||
        gift.preco < 0 ||
        !gift.imagem ||
        !gift.url
    ) {
        showMessage('Confira os dados do presente.', 'danger');
        return;
    }

    try {
        const imageUrl = new URL(gift.imagem);
        const storeUrl = new URL(gift.url);

        if (
            imageUrl.protocol !== 'https:' ||
            storeUrl.protocol !== 'https:'
        ) {
            throw new Error('Apenas HTTPS é permitido.');
        }
    } catch {
        showMessage('Informe URLs HTTPS válidas.', 'danger');
        return;
    }

    const id = fields.id.value;

    if (id) {
        const existing = giftData.presentes.find(
            item => item.id === Number(id)
        );

        if (!existing) return;

        Object.assign(existing, gift);
    } else {
        const nextId = giftData.presentes.reduce(
            (max, item) => Math.max(max, Number(item.id) || 0),
            0
        ) + 1;

        giftData.presentes.push({
            id: nextId,
            ...gift
        });
    }

    resetForm();
    renderGifts();

    showMessage('Presente atualizado! Baixe o JSON para salvar no GitHub.');
});

document.getElementById('cancel-edit').addEventListener(
    'click',
    resetForm
);

document.getElementById('download-json').addEventListener('click', () => {
    const json = JSON.stringify(giftData, null, 2);

    const blob = new Blob([json], {
        type: 'application/json'
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'presentes.json';

    document.body.append(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showMessage('Arquivo presentes.json gerado com sucesso!');
});

async function loadAdmin() {
    try {
        const response = await fetch(DATA_URL);

        if (!response.ok) {
            throw new Error('Erro ao carregar os dados.');
        }

        giftData = await response.json();

        if (!Array.isArray(giftData.presentes)) {
            throw new Error('Estrutura de presentes inválida.');
        }

        renderGifts();

    } catch (error) {
        giftsList.textContent = 'Não foi possível carregar os presentes.';
        showMessage(error.message, 'danger');
    }
}

loadAdmin();
