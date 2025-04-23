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
        document.getElementById('establishment-name').value = savedName;
        document.getElementById('establishment-form').innerHTML = `
            <div class="establishment-header">
                <h2 style="font-size: 1rem;">Estabelecimento: ${savedName}</h2>
                <button onclick="resetEstablishmentName()" class="btn btn-sm btn-secondary" style="font-size: 0.8rem;">Alterar</button>
            </div>
        `;
    }
}

function openModal() {
    document.getElementById('pedidoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('pedidoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
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
        document.getElementById('establishment-form').innerHTML = `
            <div class="establishment-header">
                <h2 style="font-size: 1rem;">Estabelecimento: ${name}</h2>
                <button onclick="resetEstablishmentName()" class="btn btn-sm btn-secondary" style="font-size: 0.8rem;">Alterar</button>
            </div>
        `;
    } else {
        alert('Por favor, digite um nome válido');
    }
}

function resetEstablishmentName() {
    localStorage.removeItem('establishmentName');
    location.reload();
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
        // Formata o texto para impressão com comandos ESC/POS
        const textoImpressao = 
            '\x1B' + '\x40' +  // Inicializa a impressora
            '\x1B' + '\x61' + '\x01' +  // Centralizado
            estabelecimento + '\n\n' +
            'PEDIDO\n' +
            '=================\n\n' +
            '\x1B' + '\x61' + '\x00' +  // Alinhado à esquerda
            'Nome: ' + nome + '\n' +
            'Telefone: ' + telefone + '\n\n' +
            'Produtos:\n' + produtos + '\n\n' +
            'Forma de Pagamento: ' + pagamento + '\n' +
            'Endereco: ' + endereco + '\n' +
            'Valor Total: ' + valor + '\n\n' +
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
