
let giftData = {
    presentes: []
};

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

async function giftApiRequest(path, options = {}) {
    const token = adminToken.value.trim();

    if (!token) {
        throw new Error('Informe o token administrativo na seção de reservas.');
    }

    const response = await fetch(
        `${APP_CONFIG.api.baseUrl}${path}`,
        {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (response.status === 401) {
        throw new Error('Token administrativo inválido.');
    }

    if (!response.ok) {
        throw new Error(
            data.error || 'Não foi possível realizar a operação.'
        );
    }

    return data;
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

        const availability = document.createElement('small');
        availability.className = 'd-block text-secondary';

        availability.textContent = gift.disponivel
            ? 'Disponível'
            : 'Indisponível';

        info.append(name, price, availability);

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
    const gift = giftData.presentes.find(
        item => Number(item.id) === Number(id)
    );

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

async function deleteGift(id) {
    const confirmed = window.confirm(
        'Deseja realmente excluir este presente?'
    );

    if (!confirmed) return;

    try {
        await giftApiRequest(`/gifts/admin/${id}`, {
            method: 'DELETE'
        });

        resetForm();

        showMessage('Presente excluído com sucesso.');

        await loadAdmin();

    } catch (error) {
        showMessage(error.message, 'danger');
    }
}

form.addEventListener('submit', async event => {
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
            !['https:', 'http:'].includes(imageUrl.protocol) ||
            !['https:', 'http:'].includes(storeUrl.protocol)
        ) {
            throw new Error('Protocolo inválido.');
        }
    } catch {
        showMessage('Informe URLs HTTP ou HTTPS válidas.', 'danger');
        return;
    }

    const id = fields.id.value;
    const submitButton = form.querySelector('[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    try {
        if (id) {
            await giftApiRequest(`/gifts/admin/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gift)
            });

            showMessage('Presente atualizado com sucesso.');
        } else {
            await giftApiRequest('/gifts/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gift)
            });

            showMessage('Presente cadastrado com sucesso.');
        }

        resetForm();

        await loadAdmin();

    } catch (error) {
        showMessage(error.message, 'danger');

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar presente';
    }
});

document.getElementById('cancel-edit').addEventListener(
    'click',
    resetForm
);

async function loadAdmin() {
    try {
        const gifts = await giftApiRequest('/gifts/admin');

        if (!Array.isArray(gifts)) {
            throw new Error('Resposta inválida da API.');
        }

        giftData.presentes = gifts;

        renderGifts();

    } catch (error) {
        giftsList.textContent = 'Não foi possível carregar os presentes.';
        showMessage(error.message, 'danger');
    }
}

document.getElementById('load-reservations').addEventListener(
    'click',
    loadAdmin
);

// ========================================
// GERENCIAMENTO DE RESERVAS
// ========================================

const adminToken = document.getElementById('admin-token');
const loadReservationsButton = document.getElementById('load-reservations');
const reservationsList = document.getElementById('reservations-list');
const reservationsMessage = document.getElementById('reservations-message');

function showReservationMessage(text, type = 'success') {
    reservationsMessage.textContent = text;
    reservationsMessage.className = `alert alert-${type} mt-3`;
}

function clearReservationMessage() {
    reservationsMessage.textContent = '';
    reservationsMessage.className = 'mt-3';
}

async function fetchReservations() {
    const token = adminToken.value.trim();

    if (!token) {
        showReservationMessage(
            'Informe o token administrativo.',
            'warning'
        );
        return;
    }

    clearReservationMessage();

    loadReservationsButton.disabled = true;
    loadReservationsButton.textContent = 'Consultando...';

    try {
        const response = await fetch(
            `${APP_CONFIG.api.baseUrl}/reservations/admin`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            throw new Error('Token administrativo inválido.');
        }

        if (!response.ok) {
            throw new Error(
                data.error || 'Não foi possível consultar as reservas.'
            );
        }

        renderReservations(data);

    } catch (error) {
        reservationsList.textContent = '';
        showReservationMessage(error.message, 'danger');

    } finally {
        loadReservationsButton.disabled = false;
        loadReservationsButton.textContent = 'Consultar reservas';
    }
}

function renderReservations(reservations) {
    reservationsList.innerHTML = '';

    if (reservations.length === 0) {
        reservationsList.textContent = 'Nenhuma reserva realizada.';
        return;
    }

    reservations.forEach(reservation => {
        const gift = giftData.presentes.find(
            item => Number(item.id) === Number(reservation.giftId)
        );

        const item = document.createElement('div');
        item.className = 'd-flex justify-content-between align-items-center gap-3 border rounded p-3 mb-3';

        const name = document.createElement('strong');
        name.textContent = gift
            ? gift.nome
            : `Presente ID ${reservation.giftId}`;

        const guest = document.createElement('p');
        guest.className = 'mb-1';
        guest.textContent = `Convidado: ${reservation.guestName}`;

        const date = document.createElement('small');
        date.className = 'text-secondary';
        date.textContent =
            `Reservado em: ${new Date(reservation.createdAt).toLocaleString('pt-BR')}`;

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn btn-sm btn-outline-danger mt-2';
        cancelButton.textContent = 'Cancelar reserva';

        cancelButton.addEventListener('click', () => {
            cancelReservation(reservation.id, cancelButton);
        });

        const details = document.createElement('div');
        details.className = 'flex-grow-1';

        details.append(name, guest, date);

        cancelButton.classList.add('flex-shrink-0');

        item.append(details, cancelButton);
        reservationsList.append(item);
    });
}

async function cancelReservation(reservationId, button) {
    const confirmed = window.confirm(
        'Deseja realmente cancelar esta reserva?'
    );

    if (!confirmed) return;

    const token = adminToken.value.trim();

    button.disabled = true;
    button.textContent = 'Cancelando...';

    try {
        const response = await fetch(
            `${APP_CONFIG.api.baseUrl}/reservations/${reservationId}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || 'Não foi possível cancelar a reserva.'
            );
        }

        showReservationMessage('Reserva cancelada com sucesso.');

        await fetchReservations();

    } catch (error) {
        button.disabled = false;
        button.textContent = 'Cancelar reserva';

        showReservationMessage(error.message, 'danger');
    }
}

loadReservationsButton.addEventListener('click', fetchReservations);
// ========================================
// GERENCIAMENTO DE CONVIDADOS (RSVP)
// ========================================

const loadGuestsButton = document.getElementById('load-guests');
const guestsList = document.getElementById('guests-list');
const guestMessage = document.getElementById('guest-message');

function showGuestMessage(text, type = 'success') {
    guestMessage.textContent = text;
    guestMessage.className = `alert alert-${type} mt-3`;
}

function clearGuestMessage() {
    guestMessage.textContent = '';
    guestMessage.className = 'mt-3';
}

async function guestApiRequest(path, options = {}) {
    const token = adminToken.value.trim();

    if (!token) {
        throw new Error('Informe o token administrativo.');
    }

    const response = await fetch(
        `${APP_CONFIG.api.baseUrl}${path}`,
        {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (response.status === 401) {
        throw new Error('Token administrativo inválido.');
    }

    if (!response.ok) {
        throw new Error(
            data.error || 'Não foi possível realizar a operação.'
        );
    }

    return data;
}

async function fetchGuests() {
    clearGuestMessage();

    loadGuestsButton.disabled = true;
    loadGuestsButton.textContent = 'Consultando...';

    try {
        const guests = await guestApiRequest('/guests/admin');

        renderGuests(guests);

    } catch (error) {
        guestsList.textContent = '';
        showGuestMessage(error.message, 'danger');

    } finally {
        loadGuestsButton.disabled = false;
        loadGuestsButton.textContent = 'Atualizar lista';
    }
}

function renderGuests(guests) {
    guestsList.innerHTML = '';

    const confirmed = guests.filter(
        guest => guest.status === 'confirmed'
    ).length;

    const declined = guests.filter(
        guest => guest.status === 'declined'
    ).length;

    const pending = guests.filter(
        guest => guest.status === 'pending'
    ).length;

    document.getElementById('guest-confirmed-count').textContent = confirmed;
    document.getElementById('guest-declined-count').textContent = declined;
    document.getElementById('guest-pending-count').textContent = pending;

    if (guests.length === 0) {
        guestsList.textContent = 'Nenhum convidado cadastrado.';
        return;
    }

    guests.forEach(guest => {
        const item = document.createElement('div');
        item.className = 'border rounded p-3 mb-3';

        const header = document.createElement('div');
        header.className = 'd-flex flex-wrap justify-content-between gap-2';

        const name = document.createElement('strong');
        name.textContent = guest.name;

        const status = document.createElement('span');
        status.className = 'badge';

        const statusLabels = {
            confirmed: 'Confirmado',
            declined: 'Não comparecerá',
            pending: 'Pendente'
        };

        const statusClasses = {
            confirmed: 'text-bg-success',
            declined: 'text-bg-danger',
            pending: 'text-bg-secondary'
        };

        status.textContent = statusLabels[guest.status] || 'Desconhecido';
        status.classList.add(
            statusClasses[guest.status] || 'text-bg-secondary'
        );

        header.append(name, status);

        const updated = document.createElement('small');
        updated.className = 'd-block text-secondary mt-2';

        if (guest.updatedAt) {
            updated.textContent =
                `Última resposta: ${new Date(guest.updatedAt).toLocaleString('pt-BR')}`;
        } else {
            updated.textContent = 'Aguardando resposta.';
        }

        item.append(header, updated);
        guestsList.append(item);
    });
}

loadGuestsButton.addEventListener('click', fetchGuests);

// ========================================
// CONFIGURAÇÕES DO ANIVERSÁRIO
// ========================================

const settingsForm = document.getElementById('settings-form');
const settingsName = document.getElementById('birthday-name');
const settingsDate = document.getElementById('birthday-date-input');
const settingsTitle = document.getElementById('birthday-title-input');
const settingsMessage = document.getElementById('birthday-message-input');
const settingsFeedback = document.getElementById('settings-message');
const saveSettingsButton = document.getElementById('save-settings');

function showSettingsMessage(message, type = 'success') {
    settingsFeedback.innerHTML = `
        <div class="alert alert-${type} mb-0" role="alert">
            ${message}
        </div>
    `;
}

async function loadSettings() {
    try {
        const response = await fetch(
            `${APP_CONFIG.api.baseUrl}/settings`
        );

        const settings = await response.json();

        if (!response.ok) {
            throw new Error('Não foi possível carregar as configurações.');
        }

        settingsName.value = settings.nome || '';
        settingsDate.value = settings.data || '';
        settingsTitle.value = settings.titulo || '';
        settingsMessage.value = settings.mensagem || '';

    } catch (error) {
        showSettingsMessage(error.message, 'danger');
    }
}

settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token = adminToken.value.trim();

    if (!token) {
        showSettingsMessage('Informe o token administrativo.', 'warning');
        return;
    }

    saveSettingsButton.disabled = true;
    saveSettingsButton.textContent = 'Salvando...';

    try {
        const response = await fetch(
            `${APP_CONFIG.api.baseUrl}/settings/admin`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: settingsName.value.trim(),
                    data: settingsDate.value,
                    titulo: settingsTitle.value.trim(),
                    mensagem: settingsMessage.value.trim()
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Não foi possível salvar as configurações.');
        }

        showSettingsMessage('Configurações salvas com sucesso!');

    } catch (error) {
        showSettingsMessage(error.message, 'danger');
    } finally {
        saveSettingsButton.disabled = false;
        saveSettingsButton.textContent = 'Salvar configurações';
    }
});

loadSettings();