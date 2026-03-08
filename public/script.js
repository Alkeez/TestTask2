document.addEventListener('DOMContentLoaded', () => {
    // Элементы DOM
    const tableBody = document.getElementById('employees-body');
    const modal = document.getElementById('modal');
    const form = document.getElementById('employee-form');
    const modalTitle = document.getElementById('modal-title');
    
    // Фильтры
    const searchInput = document.getElementById('search-input');
    const filterDep = document.getElementById('filter-department');
    const filterPos = document.getElementById('filter-position');
    
    // Поля формы
    const empIdInput = document.getElementById('emp-id');
    const empNameInput = document.getElementById('emp-name');
    const empBirthInput = document.getElementById('emp-birth');
    const empPassportInput = document.getElementById('emp-passport');
    const empContactInput = document.getElementById('emp-contact');
    const empAddressInput = document.getElementById('emp-address');
    const empDepInput = document.getElementById('emp-department');
    const empPosInput = document.getElementById('emp-position');
    const empSalaryInput = document.getElementById('emp-salary');
    const empHireInput = document.getElementById('emp-hire');

    // Базовый URL API
    const API_URL = '/api';

    // 1. Инициализация: Загрузка отделов и сотрудников
    loadDepartments();
    loadPositions();
    loadEmployees();

    // Обработчики событий
    document.getElementById('btn-add-employee').addEventListener('click', () => {
        openModal();
    });

    document.querySelector('.close-btn').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', handleFormSubmit);

    // Фильтрация (на каждое изменение перезагружаем таблицу)
    searchInput.addEventListener('input', loadEmployees);
    filterDep.addEventListener('change', loadEmployees);
    filterPos.addEventListener('change', loadEmployees);

    // --- Функции ---

    async function loadEmployees() {
        // Собираем параметры фильтрации
        const search = searchInput.value;
        const dep = filterDep.value;
        const pos = filterPos.value;
        
        let url = `${API_URL}/employees?`;
        if (search) url += `search=${search}&`;
        if (dep) url += `department_id=${dep}&`;
        if (pos) url += `position_id=${pos}&`;

        try {
            const res = await fetch(url);
            const employees = await res.json();
            renderTable(employees);
        } catch (err) {
            console.error('Ошибка загрузки сотрудников:', err);
        }
    }

    function renderTable(employees) {
        tableBody.innerHTML = '';
        employees.forEach(emp => {
            const tr = document.createElement('tr');
            
            // Если уволен, подсвечиваем строку или меняем стиль
            if (emp.is_fired) {
                tr.style.backgroundColor = '#ffefef';
            }

            tr.innerHTML = `
                <td>${emp.full_name}</td>
                <td>${formatDate(emp.birth_date)}</td>
                <td>${emp.passport}</td>
                <td>${emp.contact_info || ''}</td>
                <td>${emp.address || ''}</td>
                <td>${emp.department_name || ''}</td>
                <td>${emp.position_name || ''}</td>
                <td>${emp.salary} руб.</td>
                <td>${formatDate(emp.hire_date)}</td>
                <td class="${emp.is_fired ? 'status-fired' : 'status-active'}">
                    ${emp.is_fired ? 'УВОЛЕН' : 'Работает'}
                </td>
                <td>
                    ${emp.is_fired 
                        ? '<span class="btn-fired btn-action">Недоступно</span>' 
                        : `<button class="btn-edit btn-action" onclick="editEmployee(${emp.id})">Ред.</button>
                           <button class="btn-fire btn-action" onclick="fireEmployee(${emp.id})">Уволить</button>`
                    }
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    async function loadDepartments() {
        const res = await fetch(`${API_URL}/departments`);
        const data = await res.json();
        // Заполняем фильтр
        data.forEach(d => {
            const opt1 = new Option(d.name, d.id);
            filterDep.appendChild(opt1);
            
            // Заполняем форму
            const opt2 = new Option(d.name, d.id);
            empDepInput.appendChild(opt2);
        });
    }

    async function loadPositions() {
        const res = await fetch(`${API_URL}/positions`);
        const data = await res.json();
        data.forEach(p => {
            const opt = new Option(p.name, p.id);
            empPosInput.appendChild(opt);
        });
    }

    function openModal(employee = null) {
        form.reset();
        empIdInput.value = '';
        
        if (employee) {
            modalTitle.textContent = 'Редактировать сотрудника';
            empIdInput.value = employee.id;
            empNameInput.value = employee.full_name;
            empBirthInput.value = employee.birth_date ? employee.birth_date.split('T')[0] : '';
            empPassportInput.value = employee.passport;
            empContactInput.value = employee.contact_info;
            empAddressInput.value = employee.address;
            empDepInput.value = employee.department_id;
            empPosInput.value = employee.position_id;
            empSalaryInput.value = employee.salary;
            empHireInput.value = employee.hire_date ? employee.hire_date.split('T')[0] : '';
        } else {
            modalTitle.textContent = 'Новый сотрудник';
        }
        
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    // Делаем функции глобальными для onclick в HTML
    window.editEmployee = async (id) => {
        const res = await fetch(`${API_URL}/employees`);
        const employees = await res.json();
        const emp = employees.find(e => e.id === id);
        if (emp) openModal(emp);
    };

    window.fireEmployee = async (id) => {
        if (confirm('Вы уверены, что хотите уволить этого сотрудника?')) {
            try {
                await fetch(`${API_URL}/employees/${id}/fire`, { method: 'PUT' });
                loadEmployees();
            } catch (err) {
                console.error(err);
            }
        }
    };

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const id = empIdInput.value;
        const employeeData = {
            full_name: empNameInput.value,
            birth_date: empBirthInput.value,
            passport: empPassportInput.value,
            contact_info: empContactInput.value,
            address: empAddressInput.value,
            department_id: empDepInput.value,
            position_id: empPosInput.value,
            salary: empSalaryInput.value,
            hire_date: empHireInput.value
        };

        let url = `${API_URL}/employees`;
        let method = 'POST';

        if (id) {
            url = `${API_URL}/employees/${id}`;
            method = 'PUT';
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            });

            if (res.ok) {
                closeModal();
                loadEmployees();
            } else {
                const errData = await res.json();
                alert(`Ошибка: ${errData.message || 'Не удалось сохранить'}`);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU');
    }
});