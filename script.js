function imprimirPedido() {
    // Coleta os dados do formulário
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const produtos = document.getElementById('produtos').value;
    const pagamento = document.getElementById('pagamento').value;
    const endereco = document.getElementById('endereco').value;
    const valor = document.getElementById('valor').value;
    const estabelecimento = localStorage.getItem('establishmentName') || 'Estabelecimento';

    // Verifica se todos os campos obrigatórios estão preenchidos
    if (!nome || !produtos || !pagamento || !endereco || !valor) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }

    // Formata o texto para impressão
    const textoImpressao = 
        "\x1B\x40" +          // Initialize printer
        "\x1B\x61\x01" +      // Center alignment
        estabelecimento + "\n\n" +
        "PEDIDO\n" +
        "=================\n\n" +
        "\x1B\x61\x00" +      // Left alignment
        `Nome: ${nome}\n` +
        `Telefone: ${telefone}\n\n` +
        `Produtos:\n${produtos}\n\n` +
        `Forma de Pagamento: ${pagamento}\n` +
        `Endereco: ${endereco}\n` +
        `Valor Total: ${valor}\n\n` +
        "\x1B\x61\x01" +      // Center alignment
        "=================\n" +
        "\x1B\x64\x02";       // Feed 2 lines

    try {
        // Cria um link temporário para acionar a impressão
        var link = document.createElement('a');
        link.href = 'rawbt:' + encodeURIComponent(textoImpressao);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Envia o email usando o serviço da ECTA
        const mensagemEmail = `
Novo pedido registrado:

Estabelecimento: ${estabelecimento}
Nome do Cliente: ${nome}
Telefone: ${telefone}
Produtos: ${produtos}
Forma de Pagamento: ${pagamento}
Endereço: ${endereco}
Valor Total: ${valor}
Data: ${new Date().toLocaleString()}
        `;

        fetch(`https://portal.ecta.com.br/gerenciamento/EnviarEmailEcta?Assunto=PEDIDO CAIXA CELULAR&Mensagem=${encodeURIComponent(mensagemEmail)}`)
            .then(response => {
                console.log("Email enviado com sucesso");
                limparFormulario();
            })
            .catch(error => {
                console.error("Erro ao enviar email:", error);
                limparFormulario();
            });

    } catch (error) {
        console.error("Erro:", error);
        alert('Erro ao tentar imprimir. Verifique se o RawBT está instalado e em execução.');
        limparFormulario();
    }
}
