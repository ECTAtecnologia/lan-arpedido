window.onload = function() {
    // Máscara para telefone
    var telefoneInput = document.getElementById('telefone');
    VMasker(telefoneInput).maskPattern('(99) 99999-9999');

    // Máscara para valor em reais
    var valorInput = document.getElementById('valor');
    VMasker(valorInput).maskMoney({
        precision: 2,
        separator: ',',
        delimiter: '.',
        unit: 'R$ ',
        zeroCents: true
    });

    // Carrega o nome do estabelecimento se existir
    const savedName = localStorage.getItem('establishmentName');
    if (savedName) {
        document.getElementById('establishment-display').textContent = savedName;
    } else {
        document.getElementById('establishment-form').style.display = 'block';
    }
}

function openModal() {
    const modal = document.getElementById('pedidoModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('pedidoModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Fecha o modal se clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById('pedidoModal');
    if (event.target == modal) {
        closeModal();
    }
}

function saveEstablishmentName() {
    const input = document.getElementById('establishment-name');
    const name = input.value.trim();
    
    if (name) {
        localStorage.setItem('establishmentName', name);
        document.getElementById('establishment-display').textContent = name;
        document.getElementById('establishment-form').style.display = 'none';
    } else {
        alert('Por favor, digite um nome válido');
    }
}

function resetEstablishmentName() {
    document.getElementById('establishment-form').style.display = 'block';
    document.getElementById('establishment-name').value = '';
    document.getElementById('establishment-name').focus();
}

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
        // Formata o texto para impressão usando \r\n para quebra de linha
        const textoImpressao = 
            '//print?text=' +
            estabelecimento + '\r\n' +
            '\r\n' +
            'PEDIDO' + '\r\n' +
            '===================' + '\r\n' +
            '\r\n' +
            'Nome: ' + nome + '\r\n' +
            'Telefone: ' + telefone + '\r\n' +
            '\r\n' +
            'Produtos:' + '\r\n' + 
            produtos + '\r\n' +
            '\r\n' +
            'Forma de Pagamento: ' + pagamento + '\r\n' +
            'Endereco: ' + endereco + '\r\n' +
            'Valor Total: R$ ' + valor + '\r\n' +
            '\r\n' +
            '===================' + '\r\n';

        // Codifica o texto para URL
        const textoCodeado = encodeURIComponent(textoImpressao);

        // Simplificando a chamada do RawBT
        if (typeof window.Android !== 'undefined') {
            window.Android.print(textoImpressao);
            enviarEmail();
        } else {
            window.location.href = `rawbt:${textoCodeado}`;
            setTimeout(enviarEmail, 1000);
        }

    } catch (error) {
        console.error("Erro:", error);
        alert('Erro ao tentar imprimir. Verifique se o RawBT está instalado e configurado corretamente.');
    }
}

function enviarEmail() {
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value;
    const produtos = document.getElementById('produtos').value;
    const pagamento = document.getElementById('pagamento').value;
    const endereco = document.getElementById('endereco').value;
    const valor = document.getElementById('valor').value;
    const estabelecimento = localStorage.getItem('establishmentName') || 'Estabelecimento';

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

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://portal.ecta.com.br/gerenciamento/EnviarEmailEcta?Assunto=PEDIDO CAIXA CELULAR&Mensagem=${encodeURIComponent(mensagemEmail)}`, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            console.log("Email enviado com sucesso");
            limparFormulario();
        } else {
            console.error("Erro ao enviar email");
            limparFormulario();
        }
    };
    
    xhr.onerror = function() {
        console.error("Erro ao enviar email");
        limparFormulario();
    };
    
    xhr.send();
}

function limparFormulario() {
    document.getElementById('nome').value = '';
    document.getElementById('telefone').value = '';
    document.getElementById('produtos').value = '';
    document.getElementById('pagamento').value = '';
    document.getElementById('endereco').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('nome').focus();
    closeModal();
}
