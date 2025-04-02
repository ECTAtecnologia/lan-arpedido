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

// Funções do Modal
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

// Função auxiliar para converter texto em bytes
function textToBytes(text) {
    const encoder = new TextEncoder();
    return encoder.encode(text);
}

// Função para conectar à impressora
async function connectPrinter() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { namePrefix: 'MTP' },
                { namePrefix: 'Printer' },
                { namePrefix: 'ESP' },
                { namePrefix: 'BT' }
            ],
            optionalServices: [
                '49535343-FE7D-4AE5-8FA9-9FAFD205E455',
                '49535343-8841-43F4-A8D4-ECBE34729BB3',
                'E7810A71-73AE-499D-8C15-FAA9AEF0C3F2',
                '000018f0-0000-1000-8000-00805f9b34fb'
            ]
        });

        console.log('Dispositivo encontrado:', device.name);

        const server = await device.gatt.connect();
        console.log('Conectado ao servidor GATT');

        // Tenta diferentes serviços conhecidos
        let characteristic;
        try {
            // Tenta primeiro serviço
            const service1 = await server.getPrimaryService('49535343-FE7D-4AE5-8FA9-9FAFD205E455');
            characteristic = await service1.getCharacteristic('49535343-8841-43F4-A8D4-ECBE34729BB3');
        } catch (e1) {
            try {
                // Tenta segundo serviço
                const service2 = await server.getPrimaryService('E7810A71-73AE-499D-8C15-FAA9AEF0C3F2');
                const characteristics = await service2.getCharacteristics();
                characteristic = characteristics[0];
            } catch (e2) {
                // Tenta terceiro serviço
                const service3 = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
                characteristic = await service3.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
            }
        }

        if (!characteristic) {
            throw new Error('Não foi possível encontrar as características da impressora');
        }

        return characteristic;

    } catch (error) {
        console.error('Erro ao conectar com a impressora:', error);
        throw error;
    }
}

// Função para imprimir
async function imprimirPedido() {
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

    // Armazena os dados para uso posterior
    const dadosPedido = {
        nome, telefone, produtos, pagamento, endereco, valor, estabelecimento,
        data: new Date().toLocaleString()
    };

    // Limpa o formulário imediatamente
    limparFormulario();

    // Processa impressão e email em background
    processarPedidoBackground(dadosPedido);
}

// Função para processar o pedido em background
async function processarPedidoBackground(dados) {
    try {
        // Tenta conectar à impressora
        const characteristic = await connectPrinter();

        // Formata o texto para impressão
        const textoImpressao = 
            "\x1B\x40" +          // Initialize printer
            "\x1B\x61\x01" +      // Center alignment
            dados.estabelecimento + "\n\n" +
            "PEDIDO\n" +
            "=================\n\n" +
            "\x1B\x61\x00" +      // Left alignment
            `Nome: ${dados.nome}\n` +
            `Telefone: ${dados.telefone}\n\n` +
            `Produtos:\n${dados.produtos}\n\n` +
            `Forma de Pagamento: ${dados.pagamento}\n` +
            `Endereco: ${dados.endereco}\n` +
            `Valor Total: ${dados.valor}\n\n` +
            "\x1B\x61\x01" +      // Center alignment
            "=================\n" +
            `${dados.data}\n` +
            "\x1B\x64\x02";       // Feed 2 lines

        // Converte o texto em bytes e envia para a impressora
        const bytes = textToBytes(textoImpressao);
        
        // Tenta enviar em chunks menores
        const CHUNK_SIZE = 20;
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
            const chunk = bytes.slice(i, i + CHUNK_SIZE);
            await characteristic.writeValue(chunk);
            // Pequeno delay entre os chunks
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Envia o email em paralelo
        const mensagemEmail = `
Novo pedido registrado:

Estabelecimento: ${dados.estabelecimento}
Nome do Cliente: ${dados.nome}
Telefone: ${dados.telefone}
Produtos: ${dados.produtos}
Forma de Pagamento: ${dados.pagamento}
Endereço: ${dados.endereco}
Valor Total: ${dados.valor}
Data: ${dados.data}
        `;

        fetch(`https://portal.ecta.com.br/gerenciamento/EnviarEmailEcta?Assunto=PEDIDO CAIXA CELULAR&Mensagem=${encodeURIComponent(mensagemEmail)}`)
            .then(response => console.log("Email enviado com sucesso"))
            .catch(error => console.error("Erro ao enviar email:", error));

    } catch (error) {
        console.error("Erro:", error);
        alert('Erro ao processar pedido. Verifique se:\n1. Bluetooth está ligado\n2. A impressora está ligada e próxima\n3. A impressora está pareada');
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
