create database pd_diego_zuluaga_vanrossum

CREATE TYPE status_transactions AS ENUM ('Completada', 'Fallida', 'Pendiente');
CREATE TYPE plataform_pay AS ENUM ('Nequi', 'Daviplata');

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    number_identification TEXT UNIQUE NOT NULL,
    address TEXT not NULL,
    phone	TEXT  NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_datetime timestamp not null,
    status status_transactions NOT NULL,
    type_transaction VARCHAR(255) not null,
    plataform_method plataform_pay NOT null,
    billing_id INT not null,
    
    
    FOREIGN KEY (billing_id) REFERENCES billings(id) ON DELETE CASCADE

);

CREATE TABLE billings (
    id SERIAL PRIMARY KEY,
    number_billing VARCHAR(255) NOT NULL,
    period_billing VARCHAR(255)  NOT NULL,
    amount_paid INT not null,
    client_id INT NOT NULL,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);