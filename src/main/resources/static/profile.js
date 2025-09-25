const API_BASE_URL = 'http://localhost:8080/api';

// DOM Elements
let backToHomeBtn, profileForm, profileTitle;
let profileName, profileEmail, currentPassword, newPassword, confirmPassword;
let updateProfileBtn, cancelBtn, deleteAccountBtn, loadingOverlay, messageContainer, messageContent;
// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    checkLoginStatus();
    setupEventListeners();
    loadUserProfile();
});

function initializeElements() {
    backToHomeBtn = document.getElementById('backToHomeBtn');
    profileForm = document.getElementById('profileForm');
    profileTitle = document.getElementById('profileTitle');

    profileName = document.getElementById('profileName');
    profileEmail = document.getElementById('profileEmail');
    currentPassword = document.getElementById('currentPassword');
    newPassword = document.getElementById('newPassword');
    confirmPassword = document.getElementById('confirmPassword');

    updateProfileBtn = document.getElementById('updateProfileBtn');
    cancelBtn = document.getElementById('cancelBtn');
    deleteAccountBtn = document.getElementById('deleteAccountBtn');
    loadingOverlay = document.getElementById('loadingOverlay');
    messageContainer = document.getElementById('messageContainer');
    messageContent = document.getElementById('messageContent');
}

function setupEventListeners() {
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', deleteAccount);
    }

    // Password confirmation validation
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordConfirmation);
    }

    if (newPassword) {
        newPassword.addEventListener('input', validatePasswordConfirmation);
    }

    if (currentPassword) {
        currentPassword.addEventListener('input', validateCurrentPassword);
    }
}

async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`);
        if (response.ok) {
            const user = await response.json();
            // User is logged in, continue
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        window.location.href = 'index.html';
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`);
        if (response.ok) {
            const user = await response.json();
            if (profileName) profileName.value = user.name || '';
            if (profileEmail) profileEmail.value = user.email || '';

            // Update profile title with user name
            if (profileTitle && user.name) {
                profileTitle.textContent = `👤 ${user.name}`;
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        showMessage('Error loading profile data', 'error');
    }
}

function validateCurrentPassword() {
    const currentPasswordValue = currentPassword.value.trim();
    const isValid = currentPasswordValue.length > 0;

    // Enable/disable buttons based on current password
    if (updateProfileBtn) {
        updateProfileBtn.disabled = !isValid;
    }
    if (deleteAccountBtn) {
        deleteAccountBtn.disabled = !isValid;
    }
}

async function updateProfile(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    showLoading(true);

    try {
        const formData = {
            name: profileName.value.trim(),
            email: profileEmail.value.trim(),
            currentPassword: currentPassword.value,
            password: newPassword.value || undefined
        };

        const response = await fetch(`${API_BASE_URL}/users/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showMessage('Profile updated successfully!', 'success');
            currentPassword.value = '';
            newPassword.value = '';
            confirmPassword.value = '';
        } else {
            const errorText = await response.text();
            showMessage(errorText || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Network error occurred', 'error');
    } finally {
        showLoading(false);
    }
}

function validateForm() {
    if (!profileName.value.trim()) {
        showMessage('Name is required', 'error');
        return false;
    }

    if (!profileEmail.value.trim()) {
        showMessage('Email is required', 'error');
        return false;
    }

    if (!currentPassword.value) {
        showMessage('Current password is required', 'error');
        return false;
    }

    if (newPassword.value && newPassword.value !== confirmPassword.value) {
        showMessage('New passwords do not match', 'error');
        return false;
    }

    if (newPassword.value && newPassword.value.length < 6) {
        showMessage('New password must be at least 6 characters', 'error');
        return false;
    }

    return true;
}

function validatePasswordConfirmation() {
    if (newPassword.value && confirmPassword.value) {
        if (newPassword.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    }
}

async function deleteAccount() {
    const currentPasswordValue = currentPassword.value.trim();

    if (!currentPasswordValue) {
        showMessage('Please enter your current password first', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/users/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword: currentPasswordValue })
        });

        if (response.ok) {
            showMessage('Account deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            const errorText = await response.text();
            showMessage(errorText || 'Failed to delete account', 'error');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showMessage('Network error occurred', 'error');
    } finally {
        showLoading(false);
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/users/logout`, { method: 'POST' });
    } catch (error) {
        console.error('Error during logout:', error);
    }
    window.location.href = 'index.html';
}

function showLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showMessage(message, type) {
    if (messageContent && messageContainer) {
        messageContent.textContent = message;
        messageContent.className = `message-content ${type}`;
        messageContainer.style.display = 'block';

        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}
