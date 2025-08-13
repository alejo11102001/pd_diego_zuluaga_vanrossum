const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');

// DBsasa
const client = new Client({
    user: 'root',
    host: '168.119.183.3',
    database: 'pd_diego_zuluaga_vanrossum',
    password: 's7cq453mt2jnicTaQXKT',
    port: 5432,
});

async function loadUsersCSV() {
    try {
        await client.connect();

        const users = [];
        fs.createReadStream('./back-end/data/clients.csv')
        .pipe(csv())
        .on('data', (data) => {
            users.push(data);
        })
        .on('end', async () => {
            for (const user of users) {
                const query = `
                    INSERT INTO clients (name, number_identification, address, phone, email)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                const values = [
                    user.nombreCliente,
                    user.numeroIdentificacion,
                    user.direccion,
                    user.telefono,
                    user.correoElectronico
                ];
                await client.query(query, values);
            }
            console.log('success users');
            await client.end();
        });

    } catch (err) {
        console.error('Error loading patients:', err);
        await client.end();
    }
}

async function loadBillingsCSV() {
    try {
        await client.connect();

        const billings = [];
        fs.createReadStream('./back-end/data/billings.csv')
        .pipe(csv())
        .on('data', (data) => {
            billings.push(data);
        })
        .on('end', async () => {
            for (const billing of billings) {
                const query = `
                    INSERT INTO billings (number_billing, period_billing, amount_paid, client_id)
                    VALUES ($1, $2, $3, $4)
                `;
                const values = [
                    billing.numeroFactura,
                    billing.periodoFacturación,
                    billing.montoPagado,
                    billing.idCliente
                ];
                await client.query(query, values);
            }
            console.log('success billings');
            await client.end();
        });

    } catch (err) {
        console.error('Error loading doctors:', err);
        await client.end();
    }
}

async function loadTransactionsCSV() {
    try {
        await client.connect();

        const transactions = [];
        fs.createReadStream('./back-end/data/transactions.csv')
        .pipe(csv())
        .on('data', (data) => {
            transactions.push(data);
        })
        .on('end', async () => {
            for (const transaction of transactions) {
                const query = `
                    INSERT INTO transactions (transaction_datetime, status, type_transaction, plataform_method, billing_id)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                const values = [
                    transaction.FechaHoraTransacción,
                    transaction.EstadoTransacción,
                    transaction.TipoTransacción,
                    transaction.PlataformaUtilizada,
                    transaction.id_facturación
                ];
                await client.query(query, values);
            }
            console.log('success transactions');
            await client.end();
        });

    } catch (err) {
        console.error('Error loading appointments:', err);
        await client.end();
    }
}

const arg = process.argv[2]; // lo que escribiste después de loader.js

if (arg === 'users') {
    loadUsersCSV()
} else if (arg === 'billings') {
    loadBillingsCSV();
} else if (arg === 'transactions') {
    loadTransactionsCSV();
} else {
    console.log('Usa: node upload-csv.js [users|billings|transactions]');
}
