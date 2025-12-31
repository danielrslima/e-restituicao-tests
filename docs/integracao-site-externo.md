# Integração com Site Externo (restituicaoia.com.br)

## Campos do Formulário Identificados

### Dados Pessoais
- `nomecompleto` - Nome Completo
- `email` - Email
- `fone` - Número de telefone
- `cpf` - CPF
- `borndate` - Data de Nascimento
- `processo` - Número do Processo
- `vara` - Vara (número)
- `comarca` - Comarca

### Dados da Fonte Pagadora
- `fontePagadora` - Nome da Fonte Pagadora
- `cnpj` - CNPJ

### Dados do Cálculo
- `INSS` - INSS Reclamante (Opcional) - formato "R$ 0,00"
- `bruto` - Valor Bruto Homologado - formato "R$ 0,00"
- `trib` - Valor Tributável Homologado - formato "R$ 0,00"
- `meses` - Número de Meses

### Seletores de Quantidade
- `alvaraOptions` - Quantidade de Alvarás (1-10)
- `darfOptions` - Quantidade de DARFs (1-10)
- `honorariosOptions` - Quantidade de Honorários (1-10)

### Campos Dinâmicos (gerados após seleção)
Para cada alvará, DARF e honorário selecionado, são gerados campos dinâmicos:
- Alvarás: valor e data
- DARFs: valor e data
- Honorários: valor e data

### Botões de Rádio (DESCONSIDERADOS)
- "ANOS DIFERENTES" / "MESMO ANO" - Serão ignorados, pois nosso sistema detecta automaticamente

## Próximo Passo
Analisar o código JavaScript para ver como os dados são enviados ao clicar em "Calcular".
