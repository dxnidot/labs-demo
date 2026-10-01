CREATE TABLE movimientos (
    id UUID PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    fecha DATE NOT NULL,
    monto NUMERIC NOT NULL CHECK (monto > 0),
    moneda VARCHAR(3) NOT NULL CHECK (moneda IN ('MXN', 'USD')),
    comercio VARCHAR(150) NOT NULL CHECK (length(trim(comercio)) > 0),
    categoria VARCHAR(100) NOT NULL CHECK (length(trim(categoria)) > 0),
    card_id UUID NULL REFERENCES tarjetas(id) ON DELETE SET NULL,
    origen VARCHAR(12) NOT NULL CHECK (origen IN ('MANUAL', 'IMPORT', 'NOTIFICACION')),
    tipo VARCHAR(7) NOT NULL CHECK (tipo IN ('GASTO', 'INGRESO'))
);

CREATE INDEX idx_movimientos_owner_fecha ON movimientos (owner_sub, fecha);
