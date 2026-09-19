-- ============================================================
-- Esquema de base de datos para el Asistente Multi-Agente
-- Ejecuta esto en Supabase: Dashboard > SQL Editor > New query
-- ============================================================

-- Agente de Secretaría: tareas / pendientes
create table if not exists todos (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    due_date date,
    priority text default 'Medium', -- High | Medium | Low
    status text default 'pending',  -- pending | in_progress | done
    created_at timestamptz default now()
);

-- Agente de Secretaría: borradores de correo generados
create table if not exists email_drafts (
    id uuid primary key default gen_random_uuid(),
    recipient text,
    subject text,
    body text not null,
    status text default 'draft', -- draft | sent
    created_at timestamptz default now()
);

-- Agente Financiero: transacciones (manuales o por webhook bancario)
create table if not exists transactions (
    id uuid primary key default gen_random_uuid(),
    amount numeric not null,
    currency text default 'COP',
    category text,               -- alimentación, transporte, servicios, educación, ocio, otro
    merchant text,
    payment_method text,
    transaction_type text default 'expense', -- expense | income
    source text default 'manual',            -- manual | webhook_bank
    occurred_at timestamptz default now(),
    created_at timestamptz default now()
);

-- Agente Financiero: tarjetas de crédito
create table if not exists credit_cards (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    credit_limit numeric not null,
    balance numeric default 0,
    cut_off_day int,     -- día del mes en que corta el ciclo
    payment_due_day int, -- día del mes límite de pago
    created_at timestamptz default now()
);

-- Agente Financiero: metas de ahorro
create table if not exists savings_goals (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    target_amount numeric not null,
    current_amount numeric default 0,
    created_at timestamptz default now()
);

-- Historial de conversación con el orquestador (opcional, para auditoría)
create table if not exists conversation_log (
    id uuid primary key default gen_random_uuid(),
    user_text text,
    routed_agent text,
    agent_action text,
    reply_text text,
    created_at timestamptz default now()
);
