// Função para conectar à impressora
async function connectPrinter() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { namePrefix: 'MTP' }
            ],
            optionalServices: [
                '49535343-FE7D-4AE5-8FA9-9FAFD205E455',
                '49535343-8841-43F4-A8D4-ECBE34729BB3',
                'E7810A71-73AE-499D-8C15-FAA9AEF0C3F2'
            ]
        });

        console.log('Dispositivo encontrado:', device.name);

        const server = await device.gatt.connect();
        console.log('Conectado ao servidor GATT');

        // Tenta o primeiro serviço
        try {
            const service = await server.getPrimaryService('49535343-FE7D-4AE5-8FA9-9FAFD205E455');
            const characteristic = await service.getCharacteristic('49535343-8841-43F4-A8D4-ECBE34729BB3');
            return characteristic;
        } catch (e) {
            console.log('Tentando serviço alternativo...');
            // Tenta o segundo serviço
            const service = await server.getPrimaryService('E7810A71-73AE-499D-8C15-FAA9AEF0C3F2');
            const characteristics = await service.getCharacteristics();
            return characteristics[0];
        }
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
            "\x1B\x64\x02" +      // Feed 2 lines
            "\x1D\x56\x41\x00";   // Cut paper

        // Converte o texto em bytes e envia para a impressora
        const encoder = new TextEncoder();
        const bytes = encoder.encode(textoImpressao);
        
        // Tenta enviar em chunks menores se necessário
        const CHUNK_SIZE = 20;
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
            const chunk = bytes.slice(i, i + CHUNK_SIZE);
            await characteristic.writeValue(chunk);
            // Pequeno delay entre os chunks
            await new Promise(resolve => setTimeout(resolve, 50));
        }

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
