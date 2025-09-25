// API URL
const API_BASE_URL = 'http://localhost:8080/api/words';

// DOM Elements
const addWordForm = document.getElementById('addWordForm');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const clearSearchButton = document.getElementById('clearSearchButton');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// Search results elements
const searchResults = document.getElementById('searchResults');
const searchWordList = document.getElementById('searchWordList');

// Recently added section elements
const recentlyAddedSection = document.getElementById('recentlyAddedSection');
const recentlyAddedWord = document.getElementById('recentlyAddedWord');

// Navigation elements
const goToWordListButton = document.getElementById('goToWordListButton');

// Full Meaning Modal Elements (for search results)
const fullMeaningModal = document.getElementById('fullMeaningModal');
const fullMeaningTitle = document.getElementById('fullMeaningTitle');
const fullMeaningContent = document.getElementById('fullMeaningContent');
const closeMeaningButton = document.querySelector('.close-meaning');

// Statistics elements
const totalWordsElement = document.getElementById('totalWords');
const todayWordsElement = document.getElementById('todayWords');
const last7DaysElement = document.getElementById('last7Days');
const lastMonthElement = document.getElementById('lastMonth');

// Current state
let currentSearchResults = [];
let currentRecentlyAdded = null;

// Check if user is logged in
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/users/login', {
            method: 'GET'
        });

        if (response.ok) {
            const userData = await response.json();
            // Welcome mesajı kaldırıldı

            // Kullanıcı bilgilerini global değişkene kaydet
            window.currentUser = userData;

            return true;
        } else {
            window.location.href = '/login.html';
            return false;
        }
    } catch (error) {
        console.error('Login check failed:', error);
        return false;
    }
}

// Handle logout
async function handleLogout() {
    try {
        await fetch('/api/users/logout', {
            method: 'POST'
        });
        window.location.href = '/login.html';
    } catch (error) {
        showNotification('Çıkış yapılırken hata oluştu', true);
    }
}

// Kullanıcı profil düzenleme modalını aç
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (!modal) {
        return;
    }

    const nameInput = document.getElementById('editName');
    const emailInput = document.getElementById('editEmail');
    const profileUserInfo = document.getElementById('profileUserInfo');

    if (!nameInput || !emailInput || !profileUserInfo) {
        return;
    }

    try {
        // Global değişkenden kullanıcı bilgilerini al
        if (window.currentUser) {
            // Profil bilgilerini göster
            if (window.currentUser.name) {
                profileUserInfo.innerHTML = `<div>${window.currentUser.name}</div><div>${window.currentUser.email}</div>`;
            } else {
                profileUserInfo.innerHTML = `<div>${window.currentUser.email}</div>`;
            }

            // Form alanlarını doldur
            nameInput.value = window.currentUser.name || '';
            emailInput.value = window.currentUser.email || '';
        } else {
            return;
        }

        // Şifre alanlarını temizle
        document.getElementById('editPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('currentPassword').value = '';

        // Butonları devre dışı bırak
        document.getElementById('saveProfileBtn').disabled = true;
        document.getElementById('deleteAccountBtn').disabled = true;

        // Şifre onayı için event listener ekle
        document.getElementById('currentPassword').addEventListener('input', validatePasswordConfirmation);

        // Modalı göster
        modal.style.display = 'block';
    } catch (error) {
        showNotification('Profil düzenleme açılırken hata oluştu', true);
    }
}

// Şifre onayını doğrula ve butonları aktifleştir
function validatePasswordConfirmation() {
    const currentPasswordInput = document.getElementById('currentPassword');
    const saveButton = document.getElementById('saveProfileBtn');
    const deleteButton = document.getElementById('deleteAccountBtn');

    if (currentPasswordInput && currentPasswordInput.value.trim() !== '') {
        saveButton.disabled = false;
        deleteButton.disabled = false;
    } else {
        saveButton.disabled = true;
        deleteButton.disabled = true;
    }
}

// Kullanıcı profilini güncelle
async function updateUserProfile(event) {
    event.preventDefault();

    const name = document.getElementById('editName').value;
    const email = document.getElementById('editEmail').value;
    const password = document.getElementById('editPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const currentPassword = document.getElementById('currentPassword').value;

    // Şifre kontrolü
    if (password && password !== confirmPassword) {
        showNotification('Passwords do not match', true);
        return;
    }

    // Mevcut şifre kontrolü
    if (!currentPassword) {
        showNotification('Current password is required', true);
        return;
    }

    try {
        const response = await fetch('/api/users/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password: password || null, // Boşsa null gönder
                currentPassword // Mevcut şifreyi de gönder
            })
        });

        if (response.ok) {
            const data = await response.json();

            // Global kullanıcı bilgilerini güncelle
            window.currentUser = data;

            // Welcome mesajı kaldırıldı

            // Modalı kapat
            document.getElementById('editProfileModal').style.display = 'none';

            showNotification('Profile updated successfully');
        } else {
            const error = await response.text();
            showNotification(error, true);
        }
    } catch (error) {
        showNotification('An error occurred during update', true);
    }
}

// Kullanıcı hesabını sil
async function deleteUserAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
        return;
    }

    const currentPassword = document.getElementById('currentPassword').value;

    // Mevcut şifre kontrolü
    if (!currentPassword) {
        showNotification('Current password is required to delete account', true);
        return;
    }

    try {
        const response = await fetch('/api/users/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword
            })
        });

        if (response.ok) {
            showNotification('Your account has been deleted successfully');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        } else {
            const error = await response.text();
            showNotification(error, true);
        }
    } catch (error) {
        showNotification('An error occurred while deleting account', true);
    }
}

// Navigate to word list page
function goToWordList() {
    window.location.href = '/wordlist.html';
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Check login status first
    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) return;

    loadStatistics();

    // Event listeners with null checks
    if (addWordForm) addWordForm.addEventListener('submit', handleAddWord);
    if (searchButton) searchButton.addEventListener('click', handleSearch);
    if (clearSearchButton) clearSearchButton.addEventListener('click', handleClearSearch);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    if (closeMeaningButton) closeMeaningButton.addEventListener('click', closeMeaningModal);
    if (fullMeaningModal) {
        window.addEventListener('click', (e) => {
            if (e.target === fullMeaningModal) closeMeaningModal();
        });
    }

    // Logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);

    // Navigation button
    if (goToWordListButton) goToWordListButton.addEventListener('click', goToWordList);

    // Profil düzenleme event listener'ları
    const editProfileBtn = document.getElementById('editProfileButton');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', updateUserProfile);
    }

    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', deleteUserAccount);
    }

    // Modal kapatma
    const closeProfileModal = document.querySelector('.close-modal');
    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            document.getElementById('editProfileModal').style.display = 'none';
        });
    }

    // Modal dışına tıklandığında kapat
    window.addEventListener('click', (event) => {
        const profileModal = document.getElementById('editProfileModal');
        if (profileModal && event.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });
});



// Load statistics from API
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics`);
        if (!response.ok) throw new Error('Failed to fetch statistics');

        const stats = await response.json();
        if (totalWordsElement) totalWordsElement.textContent = stats.totalWords;
        if (todayWordsElement) todayWordsElement.textContent = stats.todayWords;
        if (last7DaysElement) last7DaysElement.textContent = stats.last7Days;
        if (lastMonthElement) lastMonthElement.textContent = stats.lastMonth;
    } catch (error) {
        console.error('Statistics error:', error);
        // Don't show notification for statistics errors on pages that don't have stats
    }
}

// Render word list for search results or recently added
function renderWordList(words, container) {
    container.innerHTML = '';

    if (words.length === 0) {
        container.innerHTML = '<p class="no-words">No words found.</p>';
        return;
    }

    words.forEach(word => {
        const wordCard = document.createElement('div');
        wordCard.className = 'word-card';

        // Add difficulty class to the card
        if (word.difficultyLevel) {
            wordCard.classList.add(`difficulty-${word.difficultyLevel}`);
        }

        const date = new Date(word.addedDate);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        // Kısa anlam (ilk cümle)
        const shortMeaning = word.meaning ? word.meaning.split('.')[0] + '.' : 'Not available';

        // Difficulty level işareti
        let difficultyBadge = '';
        if (word.difficultyLevel) {
            const difficultyIcons = {
                'easy': '<i class="fas fa-star" style="color: #ffd700;"></i>',
                'medium': '<i class="fas fa-star-half-alt" style="color: #ff8c00;"></i>',
                'hard': '<i class="fas fa-fire" style="color: #ff4757;"></i>'
            };
            difficultyBadge = `<span class="difficulty-badge difficulty-${word.difficultyLevel}" title="Difficulty: ${word.difficultyLevel}">
                ${difficultyIcons[word.difficultyLevel]} ${word.difficultyLevel.toUpperCase()}
            </span>`;
        }

        wordCard.innerHTML = `
            <h3>${word.english} ${difficultyBadge}</h3>
            <div class="word-info">
                <p>
                    <strong>Meaning:</strong>
                    <span class="short-meaning">${shortMeaning}</span>
                    <span class="full-meaning" style="display:none">${word.meaning || 'Not available'}</span>
                </p>
                <p><strong>Turkish:</strong> ${word.turkishMeaning || 'Not available'}</p>
                ${word.exampleUsage ? `<p><strong>Example:</strong> ${word.exampleUsage}</p>` : ''}
            </div>
            <div class="word-actions">
                <button class="action-btn show-more-btn" title="Show All Meanings">
                    <i class="fas fa-book-open"></i>
                </button>
            </div>
            <div class="word-date">Added: ${formattedDate}</div>
        `;

        container.appendChild(wordCard);

        // Add event listener for show more button
        const showMoreButton = wordCard.querySelector('.show-more-btn');
        showMoreButton.addEventListener('click', () => {
            showFullMeaningModal(word);
        });
    });
}

// Handle adding a new word
async function handleAddWord(e) {
    e.preventDefault();

    const englishWord = document.getElementById('english').value.trim();

    if (!englishWord) {
        showNotification('Please enter an English word', true);
        return;
    }

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ english: englishWord })
        });

        // Kelime zaten varsa onay iste
        if (response.status === 409) { // HTTP 409 Conflict
            const data = await response.json();

            if (data.exists) {
                const confirmAdd = confirm(data.message);

                if (confirmAdd) {
                    // Kullanıcı onayladı, kelimeyi zorla ekle
                    const forceAddResponse = await fetch(API_BASE_URL + '/force', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ english: englishWord })
                    });

                    if (!forceAddResponse.ok) throw new Error('Failed to add word');

                    const newWord = await forceAddResponse.json();
                    showNotification(`Word "${englishWord}" added successfully!`);

                    // Reset form and reload data
                    addWordForm.reset();
                    loadWords();
                    loadStatistics();
                }
                return;
            }
        }

        if (!response.ok) throw new Error('Failed to add word');

        const newWord = await response.json();
        showNotification(`Word "${englishWord}" added successfully!`);

        // Reset form and show recently added word
        addWordForm.reset();

        // Show recently added section with the new word
        currentRecentlyAdded = newWord;
        recentlyAddedSection.style.display = 'block';
        renderWordList([newWord], recentlyAddedWord);

        // Hide search results if visible
        searchResults.style.display = 'none';

        loadStatistics();
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Handle search
function handleSearch() {
    const query = searchInput.value.trim();

    if (!query) {
        searchResults.style.display = 'none';
        return;
    }

    // Kullanıcı ID'sini al
    const userId = window.currentUser ? window.currentUser.id : null;

    if (!userId) {
        showNotification('You need to be logged in to search', true);
        return;
    }

    fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}&userId=${userId}`)
        .then(response => {
            if (!response.ok) throw new Error('Search failed');
            return response.json();
        })
        .then(words => {
            currentSearchResults = words;
            searchResults.style.display = 'block';
            renderWordList(words, searchWordList);

            // Hide recently added section if visible
            recentlyAddedSection.style.display = 'none';
        })
        .catch(error => {
            showNotification(error.message, true);
        });
}

// Handle clear search
function handleClearSearch() {
    searchInput.value = '';
    searchResults.style.display = 'none';
    showNotification('Search cleared');
}



// Close meaning modal
function closeMeaningModal() {
    fullMeaningModal.style.display = 'none';
}

// Show full meaning modal
function showFullMeaningModal(word) {
    fullMeaningTitle.textContent = `"${word.english}" Meanings`;
    fullMeaningContent.innerHTML = '<p>Loading meanings...</p>';
    fullMeaningModal.style.display = 'block';

    // API'den tam anlamı al
    fetch(`${API_BASE_URL}/${word.id}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch full meaning');
            return response.json();
        })
        .then(data => {
            if (data.fullMeaning) {
                // Anlamları numaralandırarak göster
                const meanings = data.fullMeaning.split('. ').filter(m => m.trim() !== '');
                let html = '<ul>';
                meanings.forEach(meaning => {
                    html += `<li>${meaning}</li>`;
                });
                html += '</ul>';
                fullMeaningContent.innerHTML = html;
            } else {
                // Tam anlam yoksa, mevcut anlamı göster
                fullMeaningContent.innerHTML = `<p>${word.meaning}</p>`;
            }
        })
        .catch(error => {
            console.error('Error fetching full meaning:', error);
            fullMeaningContent.innerHTML = '<p class="error">Failed to fetch meanings. Please try again.</p>';
        });
}



// Chart objects
let timeChart = null;
let pieChart = null;

// Toggle chart visibility
function toggleChart(chartId) {
    const container = document.getElementById(chartId + 'Container');
    const button = event.target.closest('.chart-toggle-btn');

    if (container.style.display === 'none') {
        container.style.display = 'block';
        button.classList.add('active');

        // Initialize chart if not already done
        if (chartId === 'wordsTimeChart' && !timeChart) {
            initTimeChart();
        } else if (chartId === 'difficultyPieChart' && !pieChart) {
            initPieChart();
        }

        // Update chart with current data
        updateCharts();
    } else {
        container.style.display = 'none';
        button.classList.remove('active');
    }
}

// Initialize time chart
function initTimeChart() {
    const timeCtx = document.getElementById('wordsTimeChart').getContext('2d');
    timeChart = new Chart(timeCtx, {
        type: 'line',
        data: {
            labels: ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'],
            datasets: [{
                label: 'Words Added',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Initialize pie chart
function initPieChart() {
    const pieCtx = document.getElementById('difficultyPieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Easy', 'Medium', 'Hard', 'No Difficulty'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#ffd700',
                    '#ff8c00',
                    '#ff4757',
                    '#95a5a6'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Update charts with current data
async function updateCharts() {
    try {
        // Get chart data from API
        const response = await fetch(`${API_BASE_URL}/chart-data`);
        let chartData;

        if (response.ok) {
            chartData = await response.json();
        } else {
            // Use mock data if API endpoint doesn't exist
            chartData = {
                timeData: [1, 2, 0, 3, 1, 2, 4],
                difficultyData: [5, 3, 2, 10]
            };
        }

        // Update time chart
        if (timeChart && chartData.timeData) {
            timeChart.data.datasets[0].data = chartData.timeData;
            timeChart.update();
        }

        // Update pie chart
        if (pieChart && chartData.difficultyData) {
            pieChart.data.datasets[0].data = chartData.difficultyData;
            pieChart.update();
        }
    } catch (error) {
        console.error('Error updating charts:', error);
        // Use mock data on error
        if (timeChart) {
            timeChart.data.datasets[0].data = [1, 2, 0, 3, 1, 2, 4];
            timeChart.update();
        }
        if (pieChart) {
            pieChart.data.datasets[0].data = [5, 3, 2, 10];
            pieChart.update();
        }
    }
}

// Show notification
function showNotification(message, isError = false) {
    notificationMessage.textContent = message;
    notification.className = isError ? 'notification error show' : 'notification show';

    setTimeout(() => {
        notification.className = notification.className.replace('show', '');
    }, 3000);
}


