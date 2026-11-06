
let giftData = {
    presentes: []
};

const form = document.getElementById('gift-form');
const giftsList = document.getElementById('gifts-list');
const message = document.getElementById('admin-message');
const addGiftButton = document.getElementById('add-gift-button');
const giftFormMessage = document.getElementById('gift-form-message');
const giftModalElement = document.getElementById('gift-modal');
const giftModal = new bootstrap.Modal(giftModalElement);
const giftsPagination = document.getElementById('gifts-pagination');
const giftsPaginationList = giftsPagination.querySelector('ul');

const GIFTS_PER_PAGE = 10;

let giftsCurrentPage = 1;

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

function renderPagination(
    container,
    list,
    currentPage,
    totalPages,
    onChange
) {
    list.innerHTML = '';

    if (totalPages <= 1) {
        container.classList.add('d-none');
        return;
    }

    container.classList.remove('d-none');

    const createPageItem = (
        label,
        page,
        { disabled = false, active = false } = {}
    ) => {
        const item = document.createElement('li');
        item.className = 'page-item';

        if (disabled) item.classList.add('disabled');
        if (active) item.classList.add('active');

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'page-link';
        button.textContent = label;
        button.disabled = disabled;

        button.addEventListener('click', () => {
            if (disabled || page === currentPage) return;

            onChange(page);
        });

        item.append(button);

        return item;
    };

    list.append(
        createPageItem('Anterior', currentPage - 1, {
            disabled: currentPage === 1
        })
    );

    const startPage = Math.max(
        1,
        Math.min(currentPage - 2, totalPages - 4)
    );
    const endPage = Math.min(totalPages, startPage + 4);

    for (let page = startPage; page <= endPage; page += 1) {
        list.append(
            createPageItem(String(page), page, {
                active: page === currentPage
            })
        );
    }

    list.append(
        createPageItem('Próxima', currentPage + 1, {
            disabled: currentPage === totalPages
        })
    );
}

function showGiftFormMessage(text, type = 'danger') {
    giftFormMessage.textContent = text;
    giftFormMessage.className = `alert alert-${type} mt-3`;
}

function hideGiftFormMessage() {
    giftFormMessage.textContent = '';
    giftFormMessage.className = 'alert d-none mt-3';
}

function resetForm() {
    form.reset();
    fields.id.value = '';
    fields.availability.value = 'true';

    document.getElementById('gift-modal-title').textContent =
        'Adicionar presente';

    document.getElementById('cancel-edit').classList.add('d-none');

    hideGiftFormMessage();
}

addGiftButton.addEventListener('click', () => {
    resetForm();
    giftModal.show();
});

giftModalElement.addEventListener('hidden.bs.modal', () => {
    resetForm();
});

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
        giftsPagination.classList.add('d-none');
        giftsPaginationList.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(
        giftData.presentes.length / GIFTS_PER_PAGE
    );

    giftsCurrentPage = Math.min(
        Math.max(giftsCurrentPage, 1),
        totalPages
    );

    const startIndex = (giftsCurrentPage - 1) * GIFTS_PER_PAGE;

    const paginatedGifts = giftData.presentes.slice(
        startIndex,
        startIndex + GIFTS_PER_PAGE
    );

    paginatedGifts.forEach(gift => {
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

    renderPagination(
        giftsPagination,
        giftsPaginationList,
        giftsCurrentPage,
        totalPages,
        page => {
            giftsCurrentPage = page;
            renderGifts();
        }
    );
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

    document.getElementById('gift-modal-title').textContent =
        'Editar presente';

    document.getElementById('cancel-edit').classList.remove('d-none');

    hideGiftFormMessage();

    giftModal.show();
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
    hideGiftFormMessage();

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
        showGiftFormMessage('Confira os dados do presente.');
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
        showGiftFormMessage('Informe URLs HTTP ou HTTPS válidas.');
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
        } else {
            await giftApiRequest('/gifts/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gift)
            });
        }

        giftModal.hide();

        resetForm();

        await loadAdmin();

        showMessage(
            id
                ? 'Presente atualizado com sucesso.'
                : 'Presente cadastrado com sucesso.'
        );

    } catch (error) {
        showGiftFormMessage(error.message);

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar presente';
    }
});

document.getElementById('cancel-edit').addEventListener(
    'click',
    () => giftModal.hide()
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
const reservationsPagination = document.getElementById('reservations-pagination');
const reservationsPaginationList = reservationsPagination.querySelector('ul');

const RESERVATIONS_PER_PAGE = 10;

let reservationsData = [];
let reservationsCurrentPage = 1;

const adminAccessSection = document.getElementById('admin-access');
const adminAccessForm = document.getElementById('admin-access-form');
const adminAccessMessage = document.getElementById('admin-access-message');
const adminAccessSubmit = document.getElementById('admin-access-submit');
const adminContentView = document.getElementById('admin-content');
const adminLogoutButton = document.getElementById('admin-logout');

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

        reservationsData = data;

        renderReservations();

    } catch (error) {
        reservationsList.textContent = '';
        reservationsPagination.classList.add('d-none');
        showReservationMessage(error.message, 'danger');

    } finally {
        loadReservationsButton.disabled = false;
        loadReservationsButton.textContent = 'Atualizar reservas';
    }
}

function renderReservations() {
    const reservations = reservationsData;

    reservationsList.innerHTML = '';

    if (reservations.length === 0) {
        reservationsList.textContent = 'Nenhuma reserva realizada.';
        reservationsPagination.classList.add('d-none');
        reservationsPaginationList.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(
        reservations.length / RESERVATIONS_PER_PAGE
    );

    reservationsCurrentPage = Math.min(
        Math.max(reservationsCurrentPage, 1),
        totalPages
    );

    const startIndex =
        (reservationsCurrentPage - 1) * RESERVATIONS_PER_PAGE;

    const paginatedReservations = reservations.slice(
        startIndex,
        startIndex + RESERVATIONS_PER_PAGE
    );

    paginatedReservations.forEach(reservation => {
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

    renderPagination(
        reservationsPagination,
        reservationsPaginationList,
        reservationsCurrentPage,
        totalPages,
        page => {
            reservationsCurrentPage = page;
            renderReservations();
        }
    );
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
const guestTotalCount = document.getElementById('guest-total-count');
const guestConfirmedCount = document.getElementById('guest-confirmed-count');
const guestDeclinedCount = document.getElementById('guest-declined-count');
const guestPendingCount = document.getElementById('guest-pending-count');
const guestSearchInput = document.getElementById('guest-search');
const guestStatusFilter = document.getElementById('guest-status-filter');
const guestsPagination = document.getElementById('guests-pagination');
const guestsPaginationList = guestsPagination.querySelector('ul');

const GUESTS_PER_PAGE = 10;

let guestData = [];
let guestCurrentPage = 1;

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

        guestData = guests;

        renderGuests();

        return true;

    } catch (error) {
        guestsList.textContent = '';
        showGuestMessage(error.message, 'danger');

        return false;

    } finally {
        loadGuestsButton.disabled = false;
        loadGuestsButton.textContent = 'Atualizar lista';
    }
}

function normalizeGuestName(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function renderGuestPagination(totalPages) {
    renderPagination(
        guestsPagination,
        guestsPaginationList,
        guestCurrentPage,
        totalPages,
        page => {
            guestCurrentPage = page;
            renderGuests();
        }
    );
}

function renderGuests() {
    const guests = guestData;

    const confirmed = guests.filter(
        guest => guest.status === 'confirmed'
    ).length;

    const declined = guests.filter(
        guest => guest.status === 'declined'
    ).length;

    const pending = guests.filter(
        guest => guest.status === 'pending'
    ).length;

    guestTotalCount.textContent = guests.length;
    guestConfirmedCount.textContent = confirmed;
    guestDeclinedCount.textContent = declined;
    guestPendingCount.textContent = pending;

    guestsList.innerHTML = '';

    if (guests.length === 0) {
        guestsList.textContent = 'Nenhum convidado cadastrado.';
        renderGuestPagination(0);
        return;
    }

    const searchTerm = normalizeGuestName(guestSearchInput.value.trim());
    const statusFilter = guestStatusFilter.value;

    const filteredGuests = guests.filter(guest => {
        const matchesSearch =
            !searchTerm ||
            normalizeGuestName(guest.name).includes(searchTerm);

        const matchesStatus =
            statusFilter === 'all' || guest.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (filteredGuests.length === 0) {
        guestsList.textContent = 'Nenhum convidado encontrado.';
        renderGuestPagination(0);
        return;
    }

    const totalPages = Math.ceil(
        filteredGuests.length / GUESTS_PER_PAGE
    );

    guestCurrentPage = Math.min(
        Math.max(guestCurrentPage, 1),
        totalPages
    );

    const startIndex = (guestCurrentPage - 1) * GUESTS_PER_PAGE;

    const paginatedGuests = filteredGuests.slice(
        startIndex,
        startIndex + GUESTS_PER_PAGE
    );

    paginatedGuests.forEach(guest => {
        const item = document.createElement('div');
        item.className = 'border rounded p-3';

        const header = document.createElement('div');
        header.className =
            'd-flex flex-wrap justify-content-between align-items-start gap-2';

        const name = document.createElement('strong');
        name.className = 'fs-6';
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
        updated.className = 'd-block text-secondary mt-1';

        if (guest.updatedAt) {
            updated.textContent =
                `Última resposta: ${new Date(guest.updatedAt).toLocaleString('pt-BR')}`;
        } else {
            updated.textContent = 'Aguardando resposta.';
        }

        const actions = document.createElement('div');
        actions.className = 'd-flex justify-content-end mt-2';

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn btn-sm btn-outline-danger';
        deleteButton.textContent = 'Excluir';

        deleteButton.addEventListener('click', () => {
            deleteGuest(guest.id, deleteButton);
        });

        actions.append(deleteButton);

        item.append(header, updated, actions);
        guestsList.append(item);
    });

    renderGuestPagination(totalPages);
}

async function deleteGuest(guestId, button) {
    const confirmed = window.confirm(
        'Deseja realmente excluir este convidado?'
    );

    if (!confirmed) return;

    button.disabled = true;
    button.textContent = 'Excluindo...';

    try {
        await guestApiRequest(
            `/guests/admin/${encodeURIComponent(guestId)}`,
            { method: 'DELETE' }
        );

        const updated = await fetchGuests();

        if (updated) {
            showGuestMessage('Convidado excluído com sucesso.');
        }

    } catch (error) {
        button.disabled = false;
        button.textContent = 'Excluir';

        showGuestMessage(error.message, 'danger');
    }
}

loadGuestsButton.addEventListener('click', fetchGuests);

guestSearchInput.addEventListener('input', () => {
    guestCurrentPage = 1;
    renderGuests();
});

guestStatusFilter.addEventListener('change', () => {
    guestCurrentPage = 1;
    renderGuests();
});

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
const openSettingsButton = document.getElementById('open-settings-button');
const settingsFormMessage = document.getElementById('settings-form-message');
const settingsModalElement = document.getElementById('settings-modal');
const settingsModal = new bootstrap.Modal(settingsModalElement);

function showSettingsMessage(message, type = 'success') {
    settingsFeedback.textContent = message;
    settingsFeedback.className = `alert alert-${type} mb-0`;
}

function showSettingsFormMessage(message, type = 'danger') {
    settingsFormMessage.textContent = message;
    settingsFormMessage.className = `alert alert-${type} mt-3`;
}

function hideSettingsFormMessage() {
    settingsFormMessage.textContent = '';
    settingsFormMessage.className = 'alert d-none mt-3';
}

openSettingsButton.addEventListener('click', () => {
    hideSettingsFormMessage();
    settingsModal.show();
});

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
        showSettingsFormMessage('Informe o token administrativo.', 'warning');
        return;
    }

    hideSettingsFormMessage();

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

        settingsModal.hide();

        showSettingsMessage('Configurações salvas com sucesso!');

    } catch (error) {
        showSettingsFormMessage(error.message);
    } finally {
        saveSettingsButton.disabled = false;
        saveSettingsButton.textContent = 'Salvar configurações';
    }
});

function showAccessMessage(text, type = 'success') {
    adminAccessMessage.textContent = text;
    adminAccessMessage.className = `alert alert-${type} mt-3`;
}

function clearAccessMessage() {
    adminAccessMessage.textContent = '';
    adminAccessMessage.className = 'mt-3';
}

const ADMIN_TOKEN_COOKIE = 'lista_presentes_admin_token';

function setCookie(name, value) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';

    document.cookie =
        `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict${secure}`;
}

function getCookie(name) {
    const prefix = `${name}=`;

    const entry = document.cookie
        .split('; ')
        .find(item => item.startsWith(prefix));

    return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function deleteCookie(name) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';

    document.cookie =
        `${name}=; path=/; max-age=0; SameSite=Strict${secure}`;
}

async function loadAdminContent() {
    await loadAdmin();

    await Promise.all([
        fetchReservations(),
        fetchGuests(),
        loadSettings()
    ]);
}

async function enterAdmin(token) {
    clearAccessMessage();

    adminAccessSubmit.disabled = true;
    adminAccessSubmit.textContent = 'Validando...';

    try {
        const response = await fetch(
            `${APP_CONFIG.api.baseUrl}/reservations/admin`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.status === 401) {
            throw new Error('Token administrativo inválido.');
        }

        if (!response.ok) {
            throw new Error('Não foi possível validar o token.');
        }

        setCookie(ADMIN_TOKEN_COOKIE, token);

        adminAccessSection.classList.add('d-none');
        adminContentView.classList.remove('d-none');
        adminLogoutButton.classList.remove('d-none');

        await loadAdminContent();

    } catch (error) {
        deleteCookie(ADMIN_TOKEN_COOKIE);

        adminAccessSection.classList.remove('d-none');
        adminContentView.classList.add('d-none');
        adminLogoutButton.classList.add('d-none');

        showAccessMessage(error.message, 'danger');

    } finally {
        adminAccessSubmit.disabled = false;
        adminAccessSubmit.textContent = 'Acessar painel';
    }
}

adminAccessForm.addEventListener('submit', async event => {
    event.preventDefault();

    const token = adminToken.value.trim();

    if (!token) {
        showAccessMessage('Informe o token administrativo.', 'warning');
        return;
    }

    await enterAdmin(token);
});

adminLogoutButton.addEventListener('click', () => {
    deleteCookie(ADMIN_TOKEN_COOKIE);

    adminAccessForm.reset();
    clearAccessMessage();

    adminAccessSection.classList.remove('d-none');
    adminContentView.classList.add('d-none');
    adminLogoutButton.classList.add('d-none');

    giftData.presentes = [];
    giftsCurrentPage = 1;
    giftsList.innerHTML = 'Carregando presentes...';
    giftsPagination.classList.add('d-none');
    giftsPaginationList.innerHTML = '';

    reservationsData = [];
    reservationsCurrentPage = 1;
    reservationsList.textContent = 'Nenhuma reserva carregada.';
    reservationsPagination.classList.add('d-none');
    reservationsPaginationList.innerHTML = '';

    guestData = [];
    guestCurrentPage = 1;
    guestSearchInput.value = '';
    guestStatusFilter.value = 'all';
    guestsList.textContent = 'Nenhum convidado carregado.';
    guestsPagination.classList.add('d-none');
    guestsPaginationList.innerHTML = '';

    guestTotalCount.textContent = '0';
    guestConfirmedCount.textContent = '0';
    guestDeclinedCount.textContent = '0';
    guestPendingCount.textContent = '0';
});

const storedAdminToken = getCookie(ADMIN_TOKEN_COOKIE);

if (storedAdminToken) {
    adminToken.value = storedAdminToken;

    enterAdmin(storedAdminToken);
}