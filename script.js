body {
    background-color: #f8f9fa;
    font-family: Arial, sans-serif;
}

.establishment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

/* Estilos para o botão flutuante e modal */
.floating-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 25px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    font-size: 14px;
    font-weight: bold;
    text-transform: uppercase;
}

.floating-button:hover {
    background-color: #45a049;
}

.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #f5f5f5;
    z-index: 1000;
    overflow-y: auto;
}

.modal-content {
    background-color: #f5f5f5;
    padding: 15px;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
}

.establishment-section {
    text-align: left;
    margin-bottom: 15px;
    padding: 5px 0;
}

.establishment-section h3 {
    font-size: 16px;
    margin: 0;
    color: #333;
}

.btn-alterar {
    width: 100%;
    padding: 8px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    margin-top: 8px;
    font-size: 14px;
}

.pedido-container {
    padding: 10px 0;
}

.pedido-container h2 {
    text-align: center;
    font-size: 20px;
    margin-bottom: 15px;
    color: #333;
}

.form-group {
    margin-bottom: 12px;
}

.form-group label {
    display: block;
    margin-bottom: 4px;
    color: #666;
    font-size: 14px;
}

.form-control {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    height: auto;
}

select.form-control {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
    padding-right: 30px;
}

.btn-imprimir {
    width: 100%;
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 14px;
    margin-top: 15px;
}

textarea.form-control {
    min-height: 60px;
    resize: vertical;
}

.form-control[type="number"] {
    -moz-appearance: textfield; /* Remove as setas em Firefox */
}

.form-control[type="number"]::-webkit-outer-spin-button,
.form-control[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Responsividade */
@media (max-width: 768px) {
    .modal-content {
        margin: 0;
        min-height: 100vh;
    }
    
    .form-control {
        font-size: 16px; /* Previne zoom em iOS */
    }
}
