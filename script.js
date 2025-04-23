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

    try {
        // Formata o texto para impressão com comandos ESC/POS
        const textoImpressao = 
            '\x1B' + '\x40' +  // Inicializa a impressora
            '\x1B' + '\x61' + '\x01' +  // Centralizado
            estabelecimento + '\n\n' +
            'PEDIDO\n' +
            '=================\n\n' +
            '\x1B' + '\x61' + '\x00' +  // Alinhado à esquerda
            'Nome:\n' + 
            nome + '\n\n' +
            'Telefone:\n' + 
            telefone + '\n\n' +
            'Produtos:\n' + 
            produtos + '\n\n' +
            'Forma de Pagamento:\n' + 
            pagamento + '\n\n' +
            'Endereco:\n' + 
            endereco + '\n\n' +
            'Valor Total:\n' + 
            valor + '\n\n' +
            '\x1B' + '\x61' + '\x01' +  // Centralizado
            '=================\n' +
            new Date().toLocaleString() + '\n' +
            '\x1B' + '\x64' + '\x02' +  // Avança 2 linhas
            '\x1B' + '\x69';  // Corta o papel

        // Simplificando a chamada do RawBT
        if (typeof window.Android !== 'undefined') {
            // Versão Android
            window.Android.print(textoImpressao);
            enviarEmail();
        } else {
            // Versão Web
            window.location.href = `rawbt:${textoImpressao}`;
            setTimeout(enviarEmail, 1000); // Aguarda 1 segundo antes de enviar o email
        }

    } catch (error) {
        console.error("Erro:", error);
        alert('Erro ao tentar imprimir. Verifique se o RawBT está instalado e configurado corretamente.');
    }
}
