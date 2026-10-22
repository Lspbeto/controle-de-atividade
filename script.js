document.addEventListener("DOMContentLoaded", () => {
    const statusCard = document.getElementById("status-card");
    const statusTitle = document.getElementById("status-title");
    const statusMessage = document.getElementById("status-message");
    const registerCard = document.getElementById("register-card");
    const formTitle = document.getElementById("form-title");
    const usersCard = document.getElementById("users-card");
    const userForm = document.getElementById("user-form");
    const userList = document.getElementById("user-list");
    const addMoreBtn = document.getElementById("add-more-btn");
    const clearBtn = document.getElementById("clear-btn");

    // Retrieve users from LocalStorage
    function getUsers() {
        const users = localStorage.getItem("users");
        return users ? JSON.parse(users) : [];
    }

    // Save users to LocalStorage
    function saveUsers(users) {
        localStorage.setItem("users", JSON.stringify(users));
    }

    // Check application state on load
    function checkInitialState() {
        const users = getUsers();

        if (users.length === 0) {
            statusTitle.textContent = "Nenhum usuário cadastrado";
            statusMessage.textContent = "É necessário cadastrar o primeiro usuário para utilizar o sistema.";
            formTitle.textContent = "Cadastrar Primeiro Usuário";
            
            statusCard.classList.remove("hidden");
            registerCard.classList.remove("hidden");
            usersCard.classList.add("hidden");
        } else {
            statusCard.classList.add("hidden");
            registerCard.classList.add("hidden");
            usersCard.classList.remove("hidden");
            renderUserList(users);
        }
    }

    // Render list of registered users
    function renderUserList(users) {
        userList.innerHTML = "";
        users.forEach((user, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${user.username} ${index === 0 ? "(Primeiro Usuário / Admin)" : ""}</strong>
                <span>${user.email}</span>
            `;
            userList.appendChild(li);
        });
    }

    // Handle user registration
    userForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!username || !email || !password) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        const users = getUsers();
        users.push({ username, email, password });
        saveUsers(users);

        userForm.reset();
        checkInitialState();
    });

    // Toggle form for adding more users
    addMoreBtn.addEventListener("click", () => {
        formTitle.textContent = "Cadastrar Novo Usuário";
        registerCard.classList.toggle("hidden");
    });

    // Clear all users (Resets state back to "first user")
    clearBtn.addEventListener("click", () => {
        if (confirm("Tem certeza que deseja apagar todos os usuários? O sistema voltará ao estado inicial.")) {
            localStorage.removeItem("users");
            checkInitialState();
        }
    });

    // Initialize application
    checkInitialState();
});