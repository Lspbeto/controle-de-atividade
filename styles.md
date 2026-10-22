* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background-color: #f4f7f6;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

.container {
    width: 100%;
    max-width: 450px;
}

.card {
    background: #ffffff;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;
}

.hidden {
    display: none;
}

h2 {
    color: #333;
    margin-bottom: 15px;
    font-size: 1.5rem;
}

p {
    color: #666;
    font-size: 0.95rem;
    line-height: 1.4;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.card-header h2 {
    margin-bottom: 0;
}

.form-group {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 6px;
    color: #444;
    font-weight: 600;
    font-size: 0.9rem;
}

input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;
}

input:focus {
    outline: none;
    border-color: #4a90e2;
}

.btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-top: 10px;
}

.btn.primary {
    background-color: #4a90e2;
    color: white;
}

.btn.primary:hover {
    background-color: #357abd;
}

.btn.secondary {
    width: auto;
    padding: 6px 12px;
    font-size: 0.85rem;
    background-color: #e0e0e0;
    color: #333;
    margin-top: 0;
}

.btn.secondary:hover {
    background-color: #d0d0d0;
}

.btn.danger {
    background-color: #e74c3c;
    color: white;
}

.btn.danger:hover {
    background-color: #c0392b;
}

#user-list {
    list-style: none;
    margin-bottom: 20px;
}

#user-list li {
    padding: 12px;
    border-bottom: 1px solid #eee;
    display: flex;
    flex-direction: column;
}

#user-list li strong {
    color: #333;
}

#user-list li span {
    color: #777;
    font-size: 0.85rem;
}