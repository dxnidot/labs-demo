CREATE TABLE tarjetas (
    id UUID PRIMARY KEY,
    owner_sub TEXT NOT NULL,
    alias VARCHAR(100) NOT NULL,
    ultimos4 CHAR(4) NOT NULL CHECK (ultimos4 ~ '^[0-9]{4}$'),
    dia_corte SMALLINT NOT NULL CHECK (dia_corte BETWEEN 1 AND 31),
    dia_pago SMALLINT NOT NULL CHECK (dia_pago BETWEEN 1 AND 31),
    permite_liquidar_msi_anticipado BOOLEAN NOT NULL,
    activa BOOLEAN NOT NULL
);

CREATE INDEX idx_tarjetas_owner_sub_activa ON tarjetas (owner_sub, activa);
