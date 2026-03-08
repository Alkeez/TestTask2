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

    // 1. Инициализация
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

    // Фильтрация
    searchInput.addEventListener('input', loadEmployees);
    filterDep.addEventListener('change', loadEmployees);
    filterPos.addEventListener('change', loadEmployees);

    // --- Маски ввода (автоматическое форматирование) ---
    
    // Маска паспорта: 1234 567890
    empPassportInput.addEventListener('input', function(e) {
        // Удаляем все кроме цифр
        let value = e.target.value.replace(/\D/g, '');
        // Ограничиваем длину 10 цифрами
        if (value.length > 10) value = value.substring(0, 10);
        
        // Если ввели больше 4 цифр, ставим пробел
        if (value.length > 4) {
            value = value.substring(0, 4) + ' ' + value.substring(4);
        }
        e.target.value = value;
    });

    // Маска телефона: +7 (999) 123-45-67
    empContactInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // Убираем все кроме цифр
        
        // Если пользователь стер всё, оставляем пустым
        if (!value) {
            e.target.value = '';
            return;
        }

        // Формируем маску
        let formattedValue = '';
        
        if (value[0] === '7' || value[0] === '8') {
            formattedValue = '+7 ';
            if (value.length > 1) {
                formattedValue += '(' + value.substring(1, 4);
            }
            if (value.length > 4) {
                formattedValue += ') ' + value.substring(4, 7);
            }
            if (value.length > 7) {
                formattedValue += '-' + value.substring(7, 9);
            }
            if (value.length > 9) {
                formattedValue += '-' + value.substring(9, 11);
            }
        } else {
            // Если начинают ввод с 9 и т.д., добавляем 7 автоматически
            formattedValue = '+7 (' + value.substring(0, 3);
            if (value.length > 3) formattedValue += ') ' + value.substring(3, 6);
            if (value.length > 6) formattedValue += '-' + value.substring(6, 8);
            if (value.length > 8) formattedValue += '-' + value.substring(8, 10);
        }
        
        e.target.value = formattedValue;
    });


    // --- Функции ---

    async function loadEmployees() {
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
        });
        
        // Заполняем форму
        data.forEach(d => {
            const opt2 = new Option(d.name, d.id);
            empDepInput.appendChild(opt2);
        });
    }

    async function loadPositions() {
        const res = await fetch(`${API_URL}/positions`);
        const data = await res.json();
        
        // 1. Заполняем фильтр (это было пропущено)
        data.forEach(p => {
            const opt = new Option(p.name, p.id);
            filterPos.appendChild(opt);
        });

        // 2. Заполняем форму
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
            
            // Правильная обработка даты (без смещения таймзоны)
            empBirthInput.value = employee.birth_date ? employee.birth_date.split('T')[0] : '';
            empHireInput.value = employee.hire_date ? employee.hire_date.split('T')[0] : '';
            
            empPassportInput.value = employee.passport;
            empContactInput.value = employee.contact_info || '';
            empAddressInput.value = employee.address || '';
            
            // Установка значений в Select (преобразуем к строке для надежности)
            empDepInput.value = String(employee.department_id);
            empPosInput.value = String(employee.position_id);
            
            empSalaryInput.value = employee.salary;
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
        // Получаем данные сотрудника
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

    // Исправленная функция даты (чтобы не было смещения на 1 день)
    function formatDate(dateStr) {
        if (!dateStr) return '';
        // Берем только часть даты YYYY-MM-DD
        const datePart = dateStr.split('T')[0];
        const [year, month, day] = datePart.split('-');
        return `${day}.${month}.${year}`;
    }
});