import giftsData from '../../data/presentes.json';

const VALID_GIFT_IDS = new Set(
    giftsData.presentes.map(gift => Number(gift.id))
);

function generateInviteCode() {
    const random = crypto.randomUUID()
        .replace(/-/g, '')
        .substring(0, 8)
        .toUpperCase();

    return `ANIV-${random}`;
}

function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

function corsHeaders(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);

    if (!origin || !allowed.includes(origin)) {
        return null;
    }

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin'
    };
}

export class ReservationsStore {
    constructor(ctx, env) {
        this.ctx = ctx;
        this.env = env;
    }

    async fetch(request) {
        const url = new URL(request.url);

        // Consulta pública: retorna somente os IDs reservados.
        if (request.method === 'GET' && url.pathname === '/') {
            const reservations =
                await this.ctx.storage.get('reservations') || {};

            return json(Object.keys(reservations).map(Number));
        }

        // Consulta administrativa: retorna os detalhes das reservas.
        if (request.method === 'GET' && url.pathname === '/admin') {
            const reservations =
                await this.ctx.storage.get('reservations') || {};

            return json(Object.values(reservations));
        }

        if (request.method === 'POST' && url.pathname === '/') {
            let body;

            try {
                body = await request.json();
            } catch {
                return json({ error: 'JSON inválido.' }, 400);
            }

            const giftId = Number(body.giftId);
            const guestName = String(body.guestName || '').trim();

            if (!Number.isInteger(giftId) || giftId <= 0) {
                return json({ error: 'Presente inválido.' }, 400);
            }

            if (!VALID_GIFT_IDS.has(giftId)) {
                return json({
                    error: 'Este presente não está cadastrado.'
                }, 404);
            }

            if (!guestName || guestName.length > 100) {
                return json({ error: 'Nome inválido.' }, 400);
            }

            const result = await this.ctx.storage.transaction(
                async (txn) => {
                    const reservations =
                        await txn.get('reservations') || {};

                    if (reservations[giftId]) {
                        return { conflict: true };
                    }

                    const reservation = {
                        giftId,
                        guestName,
                        createdAt: new Date().toISOString()
                    };

                    reservations[giftId] = reservation;

                    await txn.put('reservations', reservations);

                    return { reservation };
                }
            );

            if (result.conflict) {
                return json({
                    error: 'Este presente já foi reservado.'
                }, 409);
            }

            return json({
                message: 'Reserva realizada com sucesso.',
                reservation: result.reservation
            }, 201);
        }

        if (request.method === 'DELETE') {
            const giftId = Number(url.pathname.split('/').pop());

            if (!Number.isInteger(giftId) || giftId <= 0) {
                return json({ error: 'Presente inválido.' }, 400);
            }

            const result = await this.ctx.storage.transaction(
                async (txn) => {
                    const reservations =
                        await txn.get('reservations') || {};

                    if (!reservations[giftId]) {
                        return false;
                    }

                    delete reservations[giftId];
                    await txn.put('reservations', reservations);

                    return true;
                }
            );

            if (!result) {
                return json({ error: 'Reserva não encontrada.' }, 404);
            }

            return json({ message: 'Reserva cancelada.' });
        }

        // Lista todos os convidados (somente administrador).
        if (request.method === 'GET' && url.pathname === '/guests/admin') {
            const guests = await this.ctx.storage.get('guests') || {};

            return json(Object.values(guests));
        }

        // Cadastra um novo convidado.
        if (request.method === 'POST' && url.pathname === '/guests/admin') {
            let body;

            try {
                body = await request.json();
            } catch {
                return json({ error: 'JSON inválido.' }, 400);
            }

            const name = String(body.name || '').trim();

            if (!name || name.length > 100) {
                return json({ error: 'Nome inválido.' }, 400);
            }

            const guests = await this.ctx.storage.get('guests') || {};

            let code;

            do {
                code = generateInviteCode();
            } while (guests[code]);

            const guest = {
                code,
                name,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: null
            };

            guests[code] = guest;

            await this.ctx.storage.put('guests', guests);

            return json({
                message: 'Convidado cadastrado com sucesso.',
                guest
            }, 201);
        }

        // Confirmação pública de presença pelo código individual.
        if (request.method === 'POST' && url.pathname === '/guests/confirm') {
            let body;

            try {
                body = await request.json();
            } catch {
                return json({ error: 'JSON inválido.' }, 400);
            }

            const code = String(body.code || '').trim().toUpperCase();
            const status = String(body.status || '').trim();

            if (!code || !/^ANIV-[A-F0-9]{8}$/.test(code)) {
                return json({ error: 'Código de convite inválido.' }, 400);
            }

            if (!['confirmed', 'declined'].includes(status)) {
                return json({ error: 'Resposta inválida.' }, 400);
            }

            const result = await this.ctx.storage.transaction(
                async (txn) => {
                    const guests = await txn.get('guests') || {};
                    const guest = guests[code];

                    if (!guest) {
                        return { notFound: true };
                    }

                    guest.status = status;
                    guest.updatedAt = new Date().toISOString();

                    guests[code] = guest;

                    await txn.put('guests', guests);

                    return {
                        status: guest.status
                    };
                }
            );

            if (result.notFound) {
                return json({ error: 'Convite não encontrado.' }, 404);
            }

            return json({
                message: 'Resposta registrada com sucesso.',
                guest: result
            });
        }
        return json({ error: 'Rota não encontrada.' }, 404);
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const headers = corsHeaders(request, env);

        if (!headers) {
            return json({ error: 'Origem não autorizada.' }, 403);
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers
            });
        }

        if (url.pathname === '/health' && request.method === 'GET') {
            return json({ status: 'ok' }, 200, headers);
        }

        if (
            !url.pathname.startsWith('/reservations') &&
            !url.pathname.startsWith('/guests')
        ) {
            return json({ error: 'Rota não encontrada.' }, 404, headers);
        }

        if (
            request.method === 'DELETE' ||
            (
                (
                    request.method === 'GET' ||
                    request.method === 'POST'
                ) &&
                (
                    url.pathname === '/reservations/admin' ||
                    url.pathname === '/guests/admin'
                )
            )
        ) {
            const authorization = request.headers.get('Authorization');
            const expected = `Bearer ${env.ADMIN_TOKEN}`;

            if (!env.ADMIN_TOKEN || authorization !== expected) {
                return json({ error: 'Não autorizado.' }, 401, headers);
            }
        }

        const id = env.RESERVATIONS.idFromName('main');
        const store = env.RESERVATIONS.get(id);

        const internalUrl = new URL(request.url);
        internalUrl.pathname = url.pathname.startsWith('/guests')
            ? url.pathname
            : (
                url.pathname === '/reservations'
                    ? '/'
                    : url.pathname.replace('/reservations', '')
            );

        const result = await store.fetch(
            new Request(internalUrl, request)
        );

        const responseHeaders = new Headers(result.headers);

        for (const [key, value] of Object.entries(headers)) {
            responseHeaders.set(key, value);
        }

        return new Response(result.body, {
            status: result.status,
            headers: responseHeaders
        });
    }
};
