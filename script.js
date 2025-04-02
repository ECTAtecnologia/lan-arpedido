// Variável global para manter a conexão com a impressora
let printerConnection = {
    device: null,
    server: null,
    characteristic: null
};

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

    // Verifica disponibilidade do Bluetooth
    checkBluetoothAvailability().then(available => {
        if (!available) {
            console.log('Bluetooth não está disponível');
        }
    });
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

// Função para verificar se o Bluetooth está disponível
async function checkBluetoothAvailability() {
    try {
        const available = await navigator.bluetooth.getAvailability();
        return available;
    } catch (error) {
        console.error('Erro ao verificar Bluetooth:', error);
        return false;
    }
}

// Função para conectar à impressora
async function connectPrinter() {
    try {
        // Se já temos uma conexão ativa, tenta usá-la
        if (printerConnection.characteristic && 
            printerConnection.device && 
            printerConnection.device.gatt.connected) {
            return printerConnection.characteristic;
        }

        // Se temos um dispositivo mas a conexão caiu, tenta reconectar
        if (printerConnection.device) {
            try {
                const server = await printerConnection.device.gatt.connect();
                const services = await server.getPrimaryServices();
                for (const service of services) {
                    const characteristics = await service.getCharacteristics();
                    for (const char of characteristics) {
                        if (char.properties.writeWithoutResponse || char.properties.write) {
                            printerConnection.server = server;
                            printerConnection.characteristic = char;
                            return char;
                        }
                    }
                }
            } catch (reconnectError) {
                console.log('Falha na reconexão, iniciando nova conexão');
                printerConnection = { device: null, server: null, characteristic: null };
            }
        }

        // Se não temos conexão ou a reconexão falhou, faz nova conexão
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { namePrefix: 'MTP' },
                { namePrefix: 'Printer' },
                { namePrefix: 'ESP' },
                { namePrefix: 'BT' }
            ],
            optionalServices: ['1812', '1811', '1801', '180a', '180f']
        });

        const server = await device.gatt.connect();
        const services = await server.getPrimaryServices();
        let characteristic;

        for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
                if (char.properties.writeWithoutResponse || char.properties.write) {
                    characteristic = char;
                    break;
                }
            }
            if (characteristic) break;
        }

        if (!characteristic) {
            throw new Error('Característica de impressão não encontrada');
        }

        // Armazena a conexão
        printerConnection = {
            device: device,
            server: server,
            characteristic: characteristic
        };

        // Adiciona listener para quando a conexão cair
        device.addEventListener('gattserverdisconnected', async () => {
            console.log('Conexão Bluetooth perdida, tentando reconectar...');
            try {
                await connectPrinter();
            } catch (error) {
                console.error('Falha na reconexão automática:', error);
            }
        });

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

    try {
        // Verifica se o Bluetooth está disponível
        const bluetoothAvailable = await checkBluetoothAvailability();
        if (!bluetoothAvailable) {
            throw new Error('Bluetooth não está disponível');
        }

        // Limpa o formulário após validação
        limparFormulario();

        // Conecta à impressora
        const characteristic = await connectPrinter();

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
            `${new Date().toLocaleString()}\n` +
            "\x1B\x64\x02";       // Feed 2 lines

        // Converte o texto em bytes e envia para a impressora
        const encoder = new TextEncoder();
        const bytes = encoder.encode(textoImpressao);
        await characteristic.writeValue(bytes);

        // Envia o email
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
            .then(response => console.log("Email enviado com sucesso"))
            .catch(error => console.error("Erro ao enviar email:", error));

    } catch (error) {
        console.error("Erro:", error);
        alert('Erro ao tentar imprimir. Verifique se:\n1. Bluetooth está ligado\n2. A impressora está ligada e próxima');
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
