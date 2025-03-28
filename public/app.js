// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

// Base API URL
const API_BASE_URL = 'http://localhost:3000/api';

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Store token and redirect based on role
                localStorage.setItem('token', data.token);
                redirectBasedOnRole(data.user.role);
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        }
    });
}

// Handle registration form submission
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, role })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration');
        }
    });
}

// Handle forgot password form submission
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (response.ok) {
                alert('Password reset link sent to your email');
                window.location.href = 'login.html';
            } else {
                alert(data.error || 'Password reset request failed');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            alert('An error occurred during password reset');
        }
    });
}

// Redirect user based on their role
function redirectBasedOnRole(role) {
    switch(role) {
        case 'admin':
            window.location.href = 'admin/dashboard.html';
            break;
        case 'teacher':
            window.location.href = 'teacher/dashboard.html';
            break;
        case 'student':
            window.location.href = 'student/dashboard.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

// Check authentication status on protected pages
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !['/index.html', '/auth/login.html', '/auth/register.html', '/auth/forgot-password.html'].includes(window.location.pathname)) {
        window.location.href = 'auth/login.html';
    }
}

// Initialize auth check
checkAuth();
