document.getElementById('addUserBtn').addEventListener('click', () => {
    const formContainer = document.getElementById('addUserFormContainer');
    formContainer.style.display = 'block';
});

// Handle adding a new user
document.getElementById('addUserForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const response = await fetch('/add-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });
        const result = await response.json();
        alert(result.message);
        
        document.getElementById('addUserFormContainer').style.display = 'none';
        fetchUsers(); // Reload user list
    } catch (error) {
        console.error('Error adding user:', error);
    }
});

// Fetch users and their fee data
async function fetchUsers() {
    try {
        const response = await fetch('/users-fees');
        const users = await response.json();

        const userFeesTable = document.getElementById('userFees');
        userFeesTable.innerHTML = ''; // Clear existing rows

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.password}</td> <!-- Displaying password (for testing) -->
                <td>${user.feeType}</td>
                <td>${user.amount}</td>
                <td>${user.status}</td>
                <td><button class="edit-btn" data-id="${user.id}">Edit</button></td>
            `;
            userFeesTable.appendChild(row);
        });

        // Add event listeners to Edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.dataset.id;
                showEditForm(userId);
            });
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Fetch the list of users when the page loads
document.addEventListener('DOMContentLoaded', fetchUsers);
