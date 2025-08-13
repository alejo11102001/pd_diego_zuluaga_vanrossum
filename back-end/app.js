const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors())

// Configura tu conexión a PostgreSQL
const pool = new Pool({
    user: 'root',
    host: '168.119.183.3',
    database: 'pd_diego_zuluaga_vanrossum',
    password: 's7cq453mt2jnicTaQXKT',
    port: 5432
});

//USERS

app.get("/users", async (req, res) => {
    try {
        let result = await pool.query("SELECT * FROM clients order by id asc");
        return res.json(result);
    } catch (error) {
        res.status(500).json({error : 'error'})
    }
});

app.get("/users/:id", async (req, res) => {
    try {
        let result = await pool.query("SELECT * FROM clients WHERE id = $1", [req.params.id]);
        return res.json(result.rows);
    } catch (error) {
        res.status(500).json({error : 'error'})
    }
});

app.post('/users', async (req, res) => {
    const { name, number_identification, address, phone, email } = req.body;
    try {
        const result = await pool.query(
        'INSERT INTO clients (name, number_identification, address, phone, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, number_identification, address, phone, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el cliente' });
    }
});

app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, number_identification, address, phone, email } = req.body;
    try {
        const result = await pool.query(
            'UPDATE clients SET name = $1, number_identification = $2, address = $3, phone = $4, email = $5 WHERE id = $6 RETURNING *',
            [name, number_identification, address, phone, email, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'cliente no encontrado' });
        }
        res.json({ message: 'cliente actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el cliente' });
    }
});

app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'cliente no encontrado' });
        res.json({ mensaje: 'cliente eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el cliente' });
    }
});

//CONSULTAS AVANZADAS

// A) Total pagado por cada cliente
app.get('/reports/clients/total-paid', async (req, res) => {
  try {
    const q = `
      SELECT
        c.id AS client_id,
        c.name AS client_name,
        COALESCE(SUM(b.amount_paid), 0) AS total_paid
      FROM clients c
      LEFT JOIN billings b ON b.client_id = c.id
      GROUP BY c.id, c.name
      ORDER BY total_paid DESC, client_name ASC;
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// B) Facturas pendientes con info de cliente y última transacción asociada
// Definición: pendiente = su última transacción NO es 'Completada' (o no tiene transacciones)
app.get('/reports/billings/pending', async (req, res) => {
  try {
    const q = `
      WITH last_tx AS (
        SELECT DISTINCT ON (t.billing_id)
               t.billing_id, t.id AS transaction_id, t.status, 
               t.plataform_method, t.transaction_datetime
        FROM transactions t
        ORDER BY t.billing_id, t.transaction_datetime DESC
      )
      SELECT
        b.id AS billing_id,
        b.number_billing,
        b.period_billing,
        b.amount_paid,
        c.id AS client_id,
        c.name AS client_name,
        lt.transaction_id,
        lt.status AS transaction_status,
        lt.plataform_method AS transaction_platform,
        lt.transaction_datetime AS transaction_date
      FROM billings b
      JOIN clients c ON c.id = b.client_id
      LEFT JOIN last_tx lt ON lt.billing_id = b.id
      WHERE COALESCE(lt.status, 'Pendiente') <> 'Completada'
      ORDER BY b.id;
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// C) Listado de transacciones por plataforma (Nequi | Daviplata)
app.get('/reports/transactions/by-platform/:plataform_method', async (req, res) => {
  try {
    const { platform } = req.params;
    const q = `
      SELECT
        t.id,
        t.transaction_datetime,
        t.status,
        t.type_transaction,
        t.plataform_method,
        t.billing_id,
        b.number_billing,
        c.name AS client_name
      FROM transactions t
      JOIN billings b ON b.id = t.billing_id
      JOIN clients c ON c.id = b.id
      WHERE t.plataform_method = $1
      ORDER BY t.transaction_datetime DESC;
    `;
    const { rows } = await pool.query(q, [platform]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});