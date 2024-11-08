//pagination
document.addEventListener('DOMContentLoaded', function () {
    const table = document.getElementById('resultsTable');
    let items = Array.from(table.getElementsByTagName('tr')).slice(1);
    const itemsPerPage = 5;
    let currentPage = 0;
    let paginationContainer;

    function showPage(page) {
        items = Array.from(table.getElementsByTagName('tr')).slice(1);

        items.sort((a, b) => {
            const timeA = new Date(a.getAttribute('data-time').split('-').reverse().join('-'));
            const timeB = new Date(b.getAttribute('data-time').split('-').reverse().join('-'));
            return timeB - timeA; // Порядок убывания
        });

        const startIndex = page * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        items.forEach((item, index) => {
            item.style.display = (index >= startIndex && index < endIndex) ? '' : 'none';
        });

        updateActiveButtonStates();
    }

    function createPageButtons() {
        if (paginationContainer) {
            paginationContainer.remove();
        }

        const totalPages = Math.ceil(items.length / (itemsPerPage - 1));
        paginationContainer = document.createElement('div');
        paginationContainer.classList.add('pagination');
        table.parentNode.insertBefore(paginationContainer, table.nextSibling);

        for (let i = 0; i < totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i + 1;
            pageButton.classList.add('page-button');
            pageButton.addEventListener('click', () => {
                currentPage = i;
                showPage(currentPage);
            });
            paginationContainer.appendChild(pageButton);
        }
    }

    function updateActiveButtonStates() {
        const pageButtons = document.querySelectorAll('.pagination .page-button');
        pageButtons.forEach((button, index) => {
            if (index === currentPage) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function updatePagination() {
        createPageButtons();
        showPage(currentPage);
    }

    // Вызываем пагинацию при загрузке страницы
    updatePagination();

    //send-get
    let x = -10;
    let y = 10;
    let r = 0;

    function sendRequest() {
        const url = new URL('./fcgi-bin/FCGI_Server.jar', window.location.href);
        url.searchParams.set('x', x);
        url.searchParams.set('y', y);
        url.searchParams.set('r', r);

        fetch(url.href, {
            method: 'GET'
            // headers: {
            //     'Content-Type': 'application/x-www-form-urlencoded'
            // }
        })
            .then(response => {
                if (!response.ok) {
                    document.getElementById("status").innerText = "Ошибка сервера"
                }
                return response.text();
            })
            .then(result => {
                const newRow = table.insertRow(1);

                const xCell = newRow.insertCell(0);
                const yCell = newRow.insertCell(1);
                const rCell = newRow.insertCell(2);
                const answerCell = newRow.insertCell(3);
                const executionTimeCell = newRow.insertCell(4);
                const currentTimeCell = newRow.insertCell(5);

                xCell.innerText = x;
                yCell.innerText = y;
                rCell.innerText = r;

                const jsonResult = JSON.parse(result);
                currentTimeCell.innerText = jsonResult.currentTime;
                executionTimeCell.innerText = jsonResult.executionTime;
                answerCell.innerText = jsonResult.answer ? "Include" : "Not include";

                newRow.setAttribute('data-time', jsonResult.currentTime);

                // Обновляем пагинацию после добавления новой строки
                updatePagination();

            })
            .catch(error => {
                document.getElementById("status").innerText = "Ошибка"
            });
    }

    function removeError(element) {
        const errorElement = element.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    function createError(element, message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerText = message;
        element.parentNode.appendChild(errorElement);
    }

    //validation
    document.getElementById("submit").onclick = function () {

        const group1Checkboxes = document.querySelectorAll('input[name="x"]');
        const group2Checkboxes = document.querySelectorAll('input[name="R"]');

        let group1CheckedCount = 0;
        let group2CheckedCount = 0;

        group1Checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                group1CheckedCount++;
            }
        });

        group2Checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                group2CheckedCount++;
            }
        });

        group1Checkboxes.forEach(checkbox => {
            removeError(checkbox);
            if (!checkbox.checked && group1CheckedCount !== 1) {
                createError(group1Checkboxes[0], "Please select one option from X checkboxes");
            }
        });

        group2Checkboxes.forEach(checkbox => {
            removeError(checkbox);
            if (!checkbox.checked && group2CheckedCount !== 1) {
                createError(group2Checkboxes[0], "Please select one option from R checkboxes");
            }
        });

        if (group1CheckedCount !== 1 || group2CheckedCount !== 1) {
            return;
        }

        const checkXs = document.getElementsByName('x');
        for (const checkX of checkXs) {
            if (checkX.checked) {
                x = checkX.value;
                break;
            }
        }

        y = document.getElementById("yInput").value;
        removeError(document.getElementById("yInput"));
        let yValid = true;

        y = y.replace(',', '.');
        let numberPattern = /^-?\d+(\.\d{1,2})?$/;

        if (y == "") {
            createError(document.getElementById("yInput"), "Please enter the coordinate Y");
            yValid = false;

        } else if (!numberPattern.test(y)) {
            createError(document.getElementById("yInput"), "Y must be a number with at most 2 decimal places");
            yValid = false;
        
        } else {
            y = parseFloat(y);
        
            if (y < -5 || y > 3){
                createError(document.getElementById("yInput"), "Y must be an number between -5 to 3");
                yValid = false; 
            } 
        }

        if (!yValid){
            return;
        }

        const checkRs = document.getElementsByName('R');
        for (const checkR of checkRs) {
            if (checkR.checked) {
                r = checkR.value;
                break;
            }
        }
        removeError(document.getElementById("status"));
        sendRequest();
    }
});