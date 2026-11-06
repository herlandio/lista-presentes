const AppAlerts = (() => {
    const icons = {
        success: 'success',
        danger: 'error',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    const show = (message, type = 'success') => {
        const icon = icons[type] || 'info';

        if (!window.Swal) {
            window.alert(message);
            return;
        }

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon,
            title: message,
            showConfirmButton: false,
            timer: icon === 'error' ? 4500 : 3200,
            timerProgressBar: true,
            didOpen: toast => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
    };

    const confirm = async ({
        title,
        text,
        confirmButtonText = 'Confirmar',
        cancelButtonText = 'Cancelar',
        icon = 'warning'
    }) => {
        if (!window.Swal) {
            return window.confirm(text || title);
        }

        const result = await Swal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText,
            reverseButtons: true,
            focusCancel: true
        });

        return result.isConfirmed;
    };

    const prompt = async ({
        title,
        inputLabel,
        inputPlaceholder,
        inputValue = ''
    }) => {
        if (!window.Swal) {
            return window.prompt(inputLabel || title, inputValue);
        }

        const result = await Swal.fire({
            title,
            input: 'text',
            inputLabel,
            inputPlaceholder,
            inputValue,
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            inputValidator: value =>
                value && value.trim()
                    ? null
                    : 'Informe um nome válido.'
        });

        return result.isConfirmed ? result.value.trim() : null;
    };

    return {
        show,
        success: message => show(message, 'success'),
        error: message => show(message, 'danger'),
        warning: message => show(message, 'warning'),
        info: message => show(message, 'info'),
        confirm,
        prompt
    };
})();
