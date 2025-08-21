// API endpoints
const API_BASE = 'api/';
const API = {
    transactions: API_BASE + 'transactions.php',
    weeks: API_BASE + 'weeks.php',
    categories: API_BASE + 'categories.php',
    contracts: API_BASE + 'contracts.php',
    clients: API_BASE + 'clients.php'
};

// Database functions using API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(endpoint, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Error en la solicitud');
        }
        
        return result;
    } catch (error) {
        console.error('Error en API call:', error);
        alert('Error: ' + error.message);
        throw error;
    }
}

// Data management functions
async function getData(endpoint) {
    try {
        const result = await apiCall(endpoint);
        return result.data || [];
    } catch (error) {
        return [];
    }
}

async function saveData(endpoint, data) {
    return await apiCall(endpoint, 'POST', data);
}

async function deleteData(endpoint, id) {
    return await apiCall(`${endpoint}?id=${id}`, 'DELETE');
}

async function addTransaction(transaction) {
    return await saveData(API.transactions, transaction);
}

async function getTransactionsByWeek(weekId) {
    const transactions = await getData(API.transactions);
    return transactions.filter(t => t.week_id == weekId);
}

async function addWeek(week) {
    return await saveData(API.weeks, week);
}

async function addContract(contract) {
    return await saveData(API.contracts, contract);
}

async function getCurrentWeek() {
    const weeks = await getData(API.weeks);
    if (weeks.length === 0) return null;
    
    // Try to find the week that contains the current date
    const today = new Date();
    return weeks.find(week => {
        const start = new Date(week.start_date);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return today >= start && today <= end;
    }) || weeks[weeks.length - 1]; // Return the last week if no current week found
}

// UI Functions
async function updateUI() {
    await updateWeeksDropdown();
    await updateCategoriesDropdown();
    await updateTransactionsTable();
    await updateDashboard();
    await updateContractsTable();
    await updateClientsTable();
}

async function updateWeeksDropdown() {
    const weeks = await getData(API.weeks);
    const weekSelect = document.getElementById('week-select');
    const filterWeek = document.getElementById('filter-week');
    const transactionWeek = document.getElementById('transaction-week');
    
    // Clear existing options
    weekSelect.innerHTML = '';
    filterWeek.innerHTML = '<option value="all">Todas las semanas</option>';
    transactionWeek.innerHTML = '';
    
    if (weeks.length === 0) {
        weekSelect.innerHTML = '<option value="">No hay semanas</option>';
        return;
    }
    
    // Add weeks to dropdowns
    weeks.forEach(week => {
        const startDate = new Date(week.start_date);
        const optionText = `Semana ${formatDate(startDate)}`;
        
        const option = document.createElement('option');
        option.value = week.id;
        option.textContent = optionText;
        weekSelect.appendChild(option);
        
        const filterOption = option.cloneNode(true);
        filterWeek.appendChild(filterOption);
        
        const transactionOption = option.cloneNode(true);
        transactionWeek.appendChild(transactionOption);
    });
    
    // Select current week
    const currentWeek = await getCurrentWeek();
    if (currentWeek) {
        weekSelect.value = currentWeek.id;
    } else if (weeks.length > 0) {
        weekSelect.value = weeks[0].id;
    }
}

async function updateCategoriesDropdown() {
    const categories = await getData(API.categories);
    const categorySelect = document.getElementById('transaction-category');
    const filterCategory = document.getElementById('filter-category');
    
    // Clear existing options
    categorySelect.innerHTML = '';
    filterCategory.innerHTML = '<option value="all">Todas las categorías</option>';
    
    // Add categories to dropdowns
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categorySelect.appendChild(option);
        
        const filterOption = option.cloneNode(true);
        filterCategory.appendChild(filterOption);
    });
}

async function updateTransactionsTable() {
    const transactions = await getData(API.transactions);
    const tableBody = document.querySelector('#transactions-table tbody');
    const filterType = document.getElementById('filter-type').value;
    const filterCategory = document.getElementById('filter-category').value;
    const filterWeek = document.getElementById('filter-week').value;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Filter transactions
    let filteredTransactions = transactions;
    
    if (filterType !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
    }
    
    if (filterCategory !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.category_id == filterCategory);
    }
    
    if (filterWeek !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.week_id == filterWeek);
    }
    
    // Add transactions to table
    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay transacciones</td></tr>';
        return;
    }
    
    const categories = await getData(API.categories);
    
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        const category = categories.find(c => c.id == transaction.category_id);
        
        row.innerHTML = `
            <td>${formatDate(new Date(transaction.date))}</td>
            <td>${transaction.description}</td>
            <td>${category ? category.name : 'N/A'}</td>
            <td>${transaction.type === 'income' ? 'Ingreso' : 'Gasto'}</td>
            <td class="${transaction.type === 'income' ? 'income' : 'expense'}">${transaction.type === 'income' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm delete-transaction" data-id="${transaction.id}">Eliminar</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-transaction').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            deleteTransaction(transactionId);
        });
    });
}

async function updateContractsTable() {
    const contracts = await getData(API.contracts);
    const tableBody = document.querySelector('#contracts-table tbody');
    const searchTerm = document.getElementById('search-contract').value.toLowerCase();
    const filterStatus = document.getElementById('filter-status').value;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Filter contracts
    let filteredContracts = contracts;
    
    if (searchTerm) {
        filteredContracts = filteredContracts.filter(contract => 
            contract.client_name.toLowerCase().includes(searchTerm) ||
            contract.folio.toLowerCase().includes(searchTerm) ||
            contract.status.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filterStatus !== 'all') {
        filteredContracts = filteredContracts.filter(contract => contract.status === filterStatus);
    }
    
    // Add contracts to table
    if (filteredContracts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay contratos</td></tr>';
        return;
    }
    
    filteredContracts.forEach(contract => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${contract.folio}</td>
            <td>${contract.client_name}</td>
            <td>$${parseFloat(contract.amount).toFixed(2)}</td>
            <td>${formatDate(new Date(contract.start_date))}</td>
            <td><span class="badge ${getStatusBadgeClass(contract.status)}">${contract.status}</span></td>
            <td>
                <button class="btn btn-info btn-sm view-contract" data-id="${contract.id}">Ver</button>
                <button class="btn btn-danger btn-sm delete-contract" data-id="${contract.id}">Eliminar</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-contract').forEach(button => {
        button.addEventListener('click', function() {
            const contractId = this.getAttribute('data-id');
            viewContract(contractId);
        });
    });
    
    document.querySelectorAll('.delete-contract').forEach(button => {
        button.addEventListener('click', function() {
            const contractId = this.getAttribute('data-id');
            deleteContract(contractId);
        });
    });
}

async function updateClientsTable() {
    const clients = await getData(API.clients);
    const tableBody = document.querySelector('#clients-table tbody');
    const searchTerm = document.getElementById('search-client').value.toLowerCase();
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Filter clients
    let filteredClients = clients;
    
    if (searchTerm) {
        filteredClients = filteredClients.filter(client => 
            client.name.toLowerCase().includes(searchTerm) ||
            client.cellphone.toLowerCase().includes(searchTerm) ||
            (client.email && client.email.toLowerCase().includes(searchTerm))
        );
    }
    
    // Add clients to table
    if (filteredClients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay clientes</td></tr>';
        return;
    }
    
    const contracts = await getData(API.contracts);
    
    filteredClients.forEach(client => {
        const row = document.createElement('tr');
        
        // Count contracts for this client
        const clientContracts = contracts.filter(c => c.client_id === client.id);
        
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.cellphone}</td>
            <td>${client.email || 'N/A'}</td>
            <td>${clientContracts.length}</td>
            <td>
                <button class="btn btn-info btn-sm view-client" data-id="${client.id}">Ver</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

async function updateDashboard() {
    const weekSelect = document.getElementById('week-select');
    const weekId = weekSelect.value;
    
    if (!weekId) {
        document.getElementById('week-income').textContent = '$0.00';
        document.getElementById('week-expenses').textContent = '$0.00';
        document.getElementById('week-balance').textContent = '$0.00';
        document.getElementById('week-budget').textContent = '$0.00';
        return;
    }
    
    const transactions = await getData(API.transactions);
    const weeks = await getData(API.weeks);
    const week = weeks.find(w => w.id == weekId);
    
    if (!week) return;
    
    const weekTransactions = transactions.filter(t => t.week_id == weekId);
    const income = weekTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenses = weekTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = income - expenses;
    const budgetLeft = parseFloat(week.budget) - expenses;
    
    document.getElementById('week-income').textContent = `$${income.toFixed(2)}`;
    document.getElementById('week-expenses').textContent = `$${expenses.toFixed(2)}`;
    document.getElementById('week-balance').textContent = `$${balance.toFixed(2)}`;
    document.getElementById('week-budget').textContent = `$${budgetLeft.toFixed(2)}`;
    
    // Update recent transactions
    const recentTransactionsBody = document.querySelector('#recent-transactions tbody');
    recentTransactionsBody.innerHTML = '';
    
    const recentTransactions = weekTransactions.slice(-5).reverse();
    
    if (recentTransactions.length === 0) {
        recentTransactionsBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay transacciones esta semana</td></tr>';
        return;
    }
    
    const categories = await getData(API.categories);
    
    recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        const category = categories.find(c => c.id == transaction.category_id);
        
        row.innerHTML = `
            <td>${formatDate(new Date(transaction.date))}</td>
            <td>${transaction.description}</td>
            <td>${category ? category.name : 'N/A'}</td>
            <td>${transaction.type === 'income' ? 'Ingreso' : 'Gasto'}</td>
            <td class="${transaction.type === 'income' ? 'income' : 'expense'}">${transaction.type === 'income' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}</td>
        `;
        
        recentTransactionsBody.appendChild(row);
    });
}

async function deleteTransaction(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;
    
    try {
        await deleteData(API.transactions, id);
        updateUI();
        alert('Transacción eliminada correctamente');
    } catch (error) {
        alert('Error al eliminar la transacción: ' + error.message);
    }
}

async function deleteContract(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este contrato?')) return;
    
    try {
        await deleteData(API.contracts, id);
        updateUI();
        alert('Contrato eliminado correctamente');
    } catch (error) {
        alert('Error al eliminar el contrato: ' + error.message);
    }
}

async function viewContract(id) {
    try {
        const contracts = await getData(API.contracts);
        const contract = contracts.find(c => c.id == id);
        
        if (!contract) {
            alert('Contrato no encontrado');
            return;
        }
        
        const modal = document.getElementById('view-contract-modal');
        const details = document.getElementById('contract-details');
        
        details.innerHTML = `
            <div class="contract-section">
                <h3>Información del Contrato</h3>
                <p><strong>Folio:</strong> ${contract.folio}</p>
                <p><strong>Monto:</strong> $${parseFloat(contract.amount).toFixed(2)}</p>
                <p><strong>Tasa de interés:</strong> ${contract.interest}%</p>
                <p><strong>Plazo:</strong> ${contract.term} semanas</p>
                <p><strong>Pago semanal:</strong> $${parseFloat(contract.weekly_payment).toFixed(2)}</p>
                <p><strong>Fecha de inicio:</strong> ${formatDate(new Date(contract.start_date))}</p>
                <p><strong>Estado:</strong> <span class="badge ${getStatusBadgeClass(contract.status)}">${contract.status}</span></p>
            </div>
            
            <div class="contract-section">
                <h3>Información del Cliente</h3>
                <p><strong>Nombre:</strong> ${contract.client_name}</p>
                <p><strong>Teléfono celular:</strong> ${contract.client_cellphone}</p>
            </div>
        `;
        
        modal.style.display = 'flex';
    } catch (error) {
        alert('Error al cargar el contrato: ' + error.message);
    }
}

function formatDate(date) {
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'activo': return 'bg-success';
        case 'pendiente': return 'bg-warning';
        case 'completado': return 'bg-info';
        case 'cancelado': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function calculateWeeklyPayment(amount, interest, term) {
    const weeklyRate = interest / 100 / 52;
    if (weeklyRate === 0) return amount / term;
    return (amount * weeklyRate) / (1 - Math.pow(1 + weeklyRate, -term));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Update UI with data
    updateUI();
    
    // Navigation
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section') + '-section';
            document.querySelectorAll('.content > div').forEach(div => {
                div.classList.add('hidden');
            });
            document.getElementById(sectionId).classList.remove('hidden');
        });
    });
    
    // Modal handling
    const transactionModal = document.getElementById('transaction-modal');
    const weekModal = document.getElementById('week-modal');
    const contractModal = document.getElementById('contract-modal');
    const viewContractModal = document.getElementById('view-contract-modal');
    const logoutModal = document.getElementById('logout-modal');
    
    document.getElementById('add-transaction-btn').addEventListener('click', function() {
        transactionModal.style.display = 'flex';
    });
    
    document.getElementById('add-week-btn').addEventListener('click', function() {
        weekModal.style.display = 'flex';
    });
    
    document.getElementById('add-contract-btn').addEventListener('click', function() {
        contractModal.style.display = 'flex';
    });
    
    document.getElementById('view-contracts-btn').addEventListener('click', function() {
        updateContractsTable();
    });
    
    document.getElementById('add-client-btn').addEventListener('click', function() {
        // For simplicity, we'll just open the contract modal
        // In a real application, you might have a separate client form
        contractModal.style.display = 'flex';
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logoutModal.style.display = 'flex';
    });
    
    // Logout confirmation
    document.getElementById('confirm-logout').addEventListener('click', function() {
        // In a real application, you would call a logout API
        alert('Sesión cerrada');
        logoutModal.style.display = 'none';
    });
    
    // Cancel logout
    document.getElementById('cancel-logout').addEventListener('click', function() {
        logoutModal.style.display = 'none';
    });
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            transactionModal.style.display = 'none';
            weekModal.style.display = 'none';
            contractModal.style.display = 'none';
            viewContractModal.style.display = 'none';
            logoutModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === transactionModal) {
            transactionModal.style.display = 'none';
        }
        if (e.target === weekModal) {
            weekModal.style.display = 'none';
        }
        if (e.target === contractModal) {
            contractModal.style.display = 'none';
        }
        if (e.target === viewContractModal) {
            viewContractModal.style.display = 'none';
        }
        if (e.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    });
    
    // Tab navigation in contract form
    document.querySelectorAll('.next-tab').forEach(button => {
        button.addEventListener('click', function() {
            const currentTab = this.closest('.tab-content');
            const nextTabId = this.getAttribute('data-next');
            
            currentTab.classList.remove('active');
            document.getElementById(nextTabId).classList.add('active');
            
            // Update tabs UI
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(`.tab[data-tab="${nextTabId}"]`).classList.add('active');
        });
    });
    
    document.querySelectorAll('.prev-tab').forEach(button => {
        button.addEventListener('click', function() {
            const currentTab = this.closest('.tab-content');
            const prevTabId = this.getAttribute('data-prev');
            
            currentTab.classList.remove('active');
            document.getElementById(prevTabId).classList.add('active');
            
            // Update tabs UI
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(`.tab[data-tab="${prevTabId}"]`).classList.add('active');
        });
    });
    
    // Tab clicks
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update tabs UI
            document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Calculate weekly payment when amount, interest or term changes
    document.getElementById('contract-amount').addEventListener('input', calculatePayment);
    document.getElementById('contract-interest').addEventListener('input', calculatePayment);
    document.getElementById('contract-term').addEventListener('input', calculatePayment);
    
    function calculatePayment() {
        const amount = parseFloat(document.getElementById('contract-amount').value) || 0;
        const interest = parseFloat(document.getElementById('contract-interest').value) || 0;
        const term = parseInt(document.getElementById('contract-term').value) || 1;
        
        const weeklyPayment = calculateWeeklyPayment(amount, interest, term);
        document.getElementById('contract-weekly-payment').value = weeklyPayment.toFixed(2);
    }
    
    // Form submissions
    document.getElementById('transaction-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const transaction = {
            date: document.getElementById('transaction-date').value,
            description: document.getElementById('transaction-description').value,
            type: document.getElementById('transaction-type').value,
            category_id: parseInt(document.getElementById('transaction-category').value),
            amount: parseFloat(document.getElementById('transaction-amount').value),
            week_id: parseInt(document.getElementById('transaction-week').value)
        };
        
        try {
            await addTransaction(transaction);
            updateUI();
            
            // Reset form and close modal
            this.reset();
            transactionModal.style.display = 'none';
            
            alert('Transacción agregada correctamente!');
        } catch (error) {
            alert('Error al agregar la transacción: ' + error.message);
        }
    });
    
    document.getElementById('week-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const week = {
            start_date: document.getElementById('week-start').value,
            budget: parseFloat(document.getElementById('week-budget-input').value)
        };
        
        try {
            await addWeek(week);
            updateUI();
            
            // Reset form and close modal
            this.reset();
            weekModal.style.display = 'none';
            
            alert('Semana financiera creada correctamente!');
        } catch (error) {
            alert('Error al crear la semana: ' + error.message);
        }
    });
    
    document.getElementById('contract-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const contract = {
            client: {
                name: document.getElementById('client-name').value,
                birthdate: document.getElementById('client-birthdate').value,
                voter_id: document.getElementById('client-voter-id').value,
                address: document.getElementById('client-address').value,
                neighborhood: document.getElementById('client-neighborhood').value,
                zip: document.getElementById('client-zip').value,
                municipality: document.getElementById('client-municipality').value,
                state: document.getElementById('client-state').value,
                phone: document.getElementById('client-phone').value,
                cellphone: document.getElementById('client-cellphone').value,
                message_phone: document.getElementById('client-message-phone').value,
                email: document.getElementById('client-email').value,
                assignment: document.getElementById('client-assignment').value,
                promoter: document.getElementById('client-promoter').value,
                supervisor: document.getElementById('client-supervisor').value,
                executive: document.getElementById('client-executive').value
            },
            aval: {
                name: document.getElementById('aval-name').value,
                birthdate: document.getElementById('aval-birthdate').value,
                voter_id: document.getElementById('aval-voter-id').value,
                address: document.getElementById('aval-address').value,
                neighborhood: document.getElementById('aval-neighborhood').value,
                zip: document.getElementById('aval-zip').value,
                municipality: document.getElementById('aval-municipality').value,
                state: document.getElementById('aval-state').value,
                phone: document.getElementById('aval-phone').value,
                cellphone: document.getElementById('aval-cellphone').value,
                message_phone: document.getElementById('aval-message-phone').value,
                email: document.getElementById('aval-email').value,
                group: document.getElementById('aval-group').value
            },
            amount: parseFloat(document.getElementById('contract-amount').value),
            interest: parseFloat(document.getElementById('contract-interest').value),
            term: parseInt(document.getElementById('contract-term').value),
            weekly_payment: parseFloat(document.getElementById('contract-weekly-payment').value),
            start_date: document.getElementById('contract-start-date').value,
            status: document.getElementById('contract-status').value
        };
        
        try {
            await addContract(contract);
            updateUI();
            
            // Reset form and close modal
            this.reset();
            contractModal.style.display = 'none';
            
            alert('Contrato agregado correctamente!');
        } catch (error) {
            alert('Error al agregar el contrato: ' + error.message);
        }
    });
    
    // Week navigation
    document.getElementById('prev-week').addEventListener('click', function() {
        const weekSelect = document.getElementById('week-select');
        const currentIndex = Array.from(weekSelect.options).findIndex(option => option.value === weekSelect.value);
        if (currentIndex > 0) {
            weekSelect.selectedIndex = currentIndex - 1;
            updateDashboard();
        }
    });
    
    document.getElementById('next-week').addEventListener('click', function() {
        const weekSelect = document.getElementById('week-select');
        const currentIndex = Array.from(weekSelect.options).findIndex(option => option.value === weekSelect.value);
        if (currentIndex < weekSelect.options.length - 1) {
            weekSelect.selectedIndex = currentIndex + 1;
            updateDashboard();
        }
    });
    
    // Filter changes
    document.getElementById('filter-type').addEventListener('change', updateTransactionsTable);
    document.getElementById('filter-category').addEventListener('change', updateTransactionsTable);
    document.getElementById('filter-week').addEventListener('change', updateTransactionsTable);
    document.getElementById('filter-status').addEventListener('change', updateContractsTable);
    
    // Search functionality
    document.getElementById('search-btn').addEventListener('click', updateContractsTable);
    document.getElementById('search-contract').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            updateContractsTable();
        }
    });
    
    document.getElementById('search-client-btn').addEventListener('click', updateClientsTable);
    document.getElementById('search-client').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            updateClientsTable();
        }
    });
    
    // Week selection change
    document.getElementById('week-select').addEventListener('change', updateDashboard);
});