function imprimirPedido() {
    // Coleta os dados do formulário
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const produtos = document.getElementById('produtos').value;
    const pagamento = document.getElementById('pagamento').value;
    const endereco = document.getElementById('endereco').value;
    const valor = document.getElementById('valor').value;
    const estabelecimento = localStorage.getItem('establishmentName') || 'Estabelecimento';

    // Verifica campos obrigatórios
    if (!nome || !produtos || !pagamento || !endereco || !valor) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }

    // Cria conteúdo ESC/POS
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
        `Endereço: ${endereco}\n` +
        `Valor Total: ${valor}\n\n` +
        "\x1B\x61\x01" +      // Center alignment
        "=================\n" +
        "\x1B\x64\x02";       // Feed 2 lines

    // Converte ESC/POS para Base64 (com codificação binária segura)
    const base64 = escposToBase64(textoImpressao);

    // Monta o link para abrir o RawBT com conteúdo
    const intentLink = `intent://print/base64/${base64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end`;

    // Redireciona o navegador para o link (abre RawBT direto)
    window.location.href = intentLink;

    // Opcional: enviar o email depois
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
}

// Função auxiliar para converter ESC/POS string para Base64 corretamente
function escposToBase64(str) {
    const utf8 = unescape(encodeURIComponent(str));
    let binary = '';
    for (let i = 0; i < utf8.length; i++) {
        binary += String.fromCharCode(utf8.charCodeAt(i));
    }
    return btoa(binary);
}
