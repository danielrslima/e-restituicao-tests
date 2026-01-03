-- Comparar os dois cálculos de Ana Carmen
SELECT 
  id,
  nome_cliente,
  total_irpf,
  total_atualizado,
  created_at,
  bruto_homologado,
  tributavel_homologado,
  numero_meses
FROM calculos 
WHERE cpf = '267.035.801-20'
AND nome_cliente LIKE '%ANA%'
ORDER BY created_at DESC
LIMIT 5;
