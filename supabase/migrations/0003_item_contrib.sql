-- Adiciona a coluna de CRDT (PN-Counter por aparelho) nos itens do pedido.
-- Necessária para a resolução de conflito entre operadores simultâneos.

alter table public."orderItems" add column if not exists contrib jsonb;
