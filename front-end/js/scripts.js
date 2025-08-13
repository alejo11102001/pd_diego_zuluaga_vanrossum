const tblClientBody = document.getElementById('tblClientsBody');
const formEditClient = document.getElementById('frmEditClient');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('frmClient');
    const msg  = document.getElementById('msg');

    if (!form) {
        console.error('No existe #frmClient en el DOM');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (msg) msg.innerHTML = '';

        const formData = new FormData(form);
        const payload = {
        name:  formData.get('name')?.trim(),
        number_identification: formData.get('identification')?.trim(),
        address:  formData.get('address')?.trim(),
        phone: formData.get('phone')?.trim(),
        email: formData.get('email')?.trim()
        
        };

        if (!payload.name || !payload.number_identification || !payload.address || !payload.phone || !payload.email) {
        if (msg) msg.innerHTML = `<div class="alert alert-danger">Completa todos los campos.</div>`;
        return;
        }

        try {
        const res = await fetch(APP_URL + '/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const text = await res.text()
            throw new Error(`HTTP ${res.status} ${text}`);set();
        }

        const data = await res.json().catch(()=> ({}));
        
        if (msg) {
            msg.innerHTML = `<div class="alert alert-success">cliente creado</div>`;
        }
        
        form.reset();

        } catch (err) {
        console.error('Error en POST:', err);
        if (msg) msg.innerHTML = `<div class="alert alert-danger">Error al crear cliente: ${err.message}</div>`;
        }
    });
});

// Nueva función para recargar la tabla (la usará la IIFE y también update/delete)
async function reloadClients() {
    const res = await fetch(APP_URL + '/users');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : (data.rows || []);

    if (!tblClientBody) return;
    tblClientBody.innerHTML = '';
    rows.forEach(client => {
        tblClientBody.innerHTML += `
        <tr>
            <td>${client.id}</td>
            <td>${client.name}</td>
            <td>${client.number_identification}</td>
            <td>${client.address}</td>
            <td>${client.phone}</td>
            <td>${client.email}</td>
            <td class="text-end">
            <button class="btn btn-sm btn-primary" data-action="edit" data-id="${client.id}" data-name="${client.name}">Editar</button>
            <button class="btn btn-sm btn-danger"  data-action="delete" data-id="${client.id}" data-name="${client.name}">Eliminar</button>
            </td>
        </tr>
        `;
    });
}

    //Mantienes tu IIFE auto-invocada para cargar al abrir
(async function index() {
    try {
        await reloadClients();   // solo llamamos la función auxiliar
    } catch (error) {
        console.error('Error en GET:', error);
    }
})();

// === API: solo fetch, sin tocar el DOM ===
async function updateClients(id, payload) {
    const res = await fetch(`${APP_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${text}`);
    }
    // devuelve el cliente actualizado
    return res.json().catch(() => ({}));
}

// DOM: solo orquesta lectura del form, llamada a la API y UI ===
window.addEventListener('DOMContentLoaded', () => {
    const frm = document.getElementById('frmEditClient');

    frm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
        const id    = document.getElementById('clientId').value;
        const name  = document.getElementById('clientName').value.trim();
        const number_identification = document.getElementById('clientIdentification').value.trim();
        const address  = document.getElementById('clientAddress').value.trim();
        const phone = document.getElementById('clientPhone').value.trim();
        const email = document.getElementById('clientEmail').value.trim();

        await updateClients(id, { name, number_identification, address, phone, email });

        // Cerrar modal
        bootstrap.Modal.getOrCreateInstance(
            document.getElementById('exampleModalClient')
        ).hide();

        // Refrescar tabla y avisar
        await reloadClients();
        alert('Cliente actualizado');

        } catch (err) {
        console.error('Error en PUT:', err);
        alert('No se pudo actualizar: ' + err.message);
        }
    });
});

// --- DELETE ---
async function deleteClient(id, name) {
    try {
        // usar el nombre que viene en el botón
        let nameLabel = name ? `"${name}"` : `#${id}`;

        // confirmar
        const ok = confirm(`¿Eliminar Cliente ${nameLabel}?`);
        if (!ok) return;

        // petición DELETE
        const res = await fetch(`${APP_URL}/users/${id}`, { method: 'DELETE' });
        if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${t}`);
        }

        await reloadClients();                  // refresca tabla
        // aviso
        alert(`Cliente ${nameLabel} eliminado`);

    } catch (error) {
        console.error('Error en DELETE:', error);
        alert('No se pudo eliminar: ' + error.message);
    }
}

// --- Delegación de eventos SOLO en la tabla de pacientes ---
if (tblClientBody) {
    tblClientBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button.btn-sm');
        if (!btn) return;

        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const action = btn.dataset.action;
        if (!id || !action) return;

        if (action === 'edit') {
            showClient(id);
        } else if (action === 'delete') {
            deleteClient(id, name);
        }
    });
}


async function showClient(id){
    try {
        const res = await fetch(`${APP_URL}/users/${id}`);
        if (!res.ok) {
            throw new Error(`Error HTTP ${res.status} al buscar el cliente.`);
        }
        const client = await res.json(); // client es un array: [{...}]

        console.log('Datos recibidos de la API:', client);

        // VOLVEMOS A USAR [0] PORQUE LA API DEVUELVE UN ARRAY

        document.getElementById('clientId').value = client[0].id;
        document.getElementById('clientName').value = client[0].name;
        document.getElementById('clientIdentification').value = client[0].number_identification;
        document.getElementById('clientAddress').value = client[0].address;
        document.getElementById('clientPhone').value = client[0].phone;
        document.getElementById('clientEmail').value = client[0].email;

        // Mostrar el modal
        const modalElement = document.getElementById('exampleModalClient');
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();

    } catch (error) {
        console.error('Error en showClient:', error);
        alert('No se pudieron cargar los datos del cliente.');
    }
}