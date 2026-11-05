const ReservationService = {
    async getReservedGiftIds() {
        const response = await fetch(
            `${APP_CONFIG.api.baseUrl}/reservations`
        );

        if (!response.ok) {
            throw new Error('Não foi possível consultar as reservas.');
        }

        return await response.json();
    },

    async reserveGift(giftId, guestName) {
        const response = await fetch(
            `${APP_CONFIG.api.baseUrl}/reservations`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    giftId,
                    guestName
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || 'Não foi possível realizar a reserva.'
            );
        }

        return data;
    }
};