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
        unit: 'R$ '
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
        // Conecta ao WebSocket do RawBT
        const ws = new WebSocket('ws://127.0.0.1:1337/');
        
        ws.onopen = function() {
            // Envia o comando de impressão
            ws.send(JSON.stringify({
                type: 'print',
                content: textoImpressao
            }));
        };

        ws.onmessage = function(e) {
            const response = JSON.parse(e.data);
            if (response.status === 'success') {
                console.log('Impressão realizada com sucesso');
                
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
            } else {
                console.error('Erro na impressão:', response.error);
                alert('Erro ao imprimir. Verifique se a impressora está conectada.');
            }
            ws.close();
        };

        ws.onerror = function(error) {
            console.error('Erro no WebSocket:', error);
            alert('Erro ao conectar com a impressora. Verifique se o RawBT está instalado e em execução.');
            limparFormulario();
        };

    } catch (error) {
        console.error("Erro:", error);
        alert('Erro ao tentar imprimir. Verifique se o RawBT está instalado e em execução.');
        limparFormulario();
    }
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
