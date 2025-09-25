// API URL
const API_BASE_URL = 'http://localhost:8080/api/words';

// DOM Elements
const wordListElement = document.getElementById('wordList');
const editModal = document.getElementById('editModal');
const editWordForm = document.getElementById('editWordForm');
const closeModalButton = document.querySelector('.close');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// Search elements
const searchInputWordlist = document.getElementById('searchInputWordlist');
const searchButtonWordlist = document.getElementById('searchButtonWordlist');
const clearSearchButtonWordlist = document.getElementById('clearSearchButtonWordlist');

// Full Meaning Modal Elements
const fullMeaningModal = document.getElementById('fullMeaningModal');
const fullMeaningTitle = document.getElementById('fullMeaningTitle');
const fullMeaningContent = document.getElementById('fullMeaningContent');
const closeMeaningButton = document.querySelector('.close-meaning');

// Filter buttons
const filterAllButton = document.getElementById('filterAll');
const filterEasyButton = document.getElementById('filterEasy');
const filterMediumButton = document.getElementById('filterMedium');
const filterHardButton = document.getElementById('filterHard');

// Sort buttons
const sortByDateButton = document.getElementById('sortByDate');
const sortByAlphabetButton = document.getElementById('sortByAlphabet');

// Statistics elements
const totalWordsElement = document.getElementById('totalWords');
const todayWordsElement = document.getElementById('todayWords');
const last7DaysElement = document.getElementById('last7Days');
const lastMonthElement = document.getElementById('lastMonth');

// Current state
let currentWords = [];
let allWords = []; // Store all words for search functionality
let currentSortMethod = 'date'; // 'date' or 'alphabet'
let currentFilter = 'all'; // 'all', 'easy', 'medium', 'hard'
let isSearchActive = false; // Track if search is active

// Chart objects
let timeChart = null;
let pieChart = null;

// Check if user is logged in
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/users/login', {
            method: 'GET'
        });

        if (response.ok) {
            const userData = await response.json();
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

// Navigate back to home
function goBackToHome() {
    window.location.href = '/index.html';
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Check login status first
    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) return;

    loadWords();
    loadStatistics();
    setupDifficultyRadioButtons();

    // Event listeners with null checks
    if (editWordForm) editWordForm.addEventListener('submit', handleEditWord);
    if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
    if (closeMeaningButton) closeMeaningButton.addEventListener('click', closeMeaningModal);
    if (editModal && fullMeaningModal) {
        window.addEventListener('click', (e) => {
            if (e.target === editModal) closeModal();
            if (e.target === fullMeaningModal) closeMeaningModal();
        });
    }

    // Search event listeners
    if (searchButtonWordlist) searchButtonWordlist.addEventListener('click', handleSearchWordlist);
    if (clearSearchButtonWordlist) clearSearchButtonWordlist.addEventListener('click', handleClearSearchWordlist);
    if (searchInputWordlist) {
        searchInputWordlist.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearchWordlist();
        });
    }

    // Logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);

    // Back to home button
    const backToHomeButton = document.getElementById('backToHomeButton');
    if (backToHomeButton) backToHomeButton.addEventListener('click', goBackToHome);

    // Sort buttons
    if (sortByDateButton) sortByDateButton.addEventListener('click', () => handleSort('date'));
    if (sortByAlphabetButton) sortByAlphabetButton.addEventListener('click', () => handleSort('alphabet'));

    // Filter buttons event listeners
    if (filterAllButton) filterAllButton.addEventListener('click', () => handleFilter('all'));
    if (filterEasyButton) filterEasyButton.addEventListener('click', () => handleFilter('easy'));
    if (filterMediumButton) filterMediumButton.addEventListener('click', () => handleFilter('medium'));
    if (filterHardButton) filterHardButton.addEventListener('click', () => handleFilter('hard'));
});

// Setup difficulty radio buttons
function setupDifficultyRadioButtons() {
    const difficultyRadios = document.querySelectorAll('input[name="difficultyRadio"]');
    const difficultySelect = document.getElementById('editDifficultyLevel');

    // When radio buttons change, update the hidden select
    difficultyRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            difficultySelect.value = this.value;
        });
    });
}

// Load words from API
async function loadWords() {
    try {
        // Kullanıcı ID'sini al
        const userId = window.currentUser ? window.currentUser.id : null;

        if (!userId) {
            showNotification('You need to be logged in to view words', true);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/sorted`);
        if (!response.ok) throw new Error('Failed to fetch words');

        allWords = await response.json(); // Store all words
        currentWords = [...allWords]; // Copy for current display
        renderWordList(currentWords);
        updateCharts(); // Update charts with the new data
    } catch (error) {
        showNotification(error.message, true);
    }
}

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
    }
}

// Render word list
function renderWordList(words) {
    if (!wordListElement) return;

    wordListElement.innerHTML = '';

    if (words.length === 0) {
        wordListElement.innerHTML = '<p class="no-words">No words found.</p>';
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
                <button class="action-btn edit-btn" data-id="${word.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${word.id}">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="action-btn show-more-btn" title="Show All Meanings">
                    <i class="fas fa-book-open"></i>
                </button>
            </div>
            <div class="word-date">Added: ${formattedDate}</div>
        `;

        wordListElement.appendChild(wordCard);

        // Add event listeners for edit and delete buttons
        const editButton = wordCard.querySelector('.edit-btn');
        const deleteButton = wordCard.querySelector('.delete-btn');
        const showMoreButton = wordCard.querySelector('.show-more-btn');

        editButton.addEventListener('click', () => openEditModal(word));
        deleteButton.addEventListener('click', () => handleDeleteWord(word.id));

        // Show More button event listener
        showMoreButton.addEventListener('click', () => {
            showFullMeaningModal(word);
        });
    });
}

// Handle sorting
function handleSort(method) {
    currentSortMethod = method;

    if (method === 'date') {
        sortByDateButton.classList.add('active');
        sortByAlphabetButton.classList.remove('active');

        // Reload from API to get date-sorted list
        if (currentFilter === 'all') {
            loadWords();
        } else {
            filterWordsByDifficulty(currentFilter);
        }
    } else {
        sortByDateButton.classList.remove('active');
        sortByAlphabetButton.classList.add('active');

        // Sort alphabetically
        const sortedWords = [...currentWords].sort((a, b) =>
            a.english.localeCompare(b.english)
        );
        renderWordList(sortedWords);
    }
}

// Handle filtering by difficulty
function handleFilter(difficulty) {
    currentFilter = difficulty;

    // Update active button
    [filterAllButton, filterEasyButton, filterMediumButton, filterHardButton].forEach(btn => {
        btn.classList.remove('active');
    });

    switch(difficulty) {
        case 'easy':
            filterEasyButton.classList.add('active');
            break;
        case 'medium':
            filterMediumButton.classList.add('active');
            break;
        case 'hard':
            filterHardButton.classList.add('active');
            break;
        default:
            filterAllButton.classList.add('active');
            break;
    }

    if (difficulty === 'all') {
        loadWords();
    } else {
        filterWordsByDifficulty(difficulty);
    }
}

// Filter words by difficulty
async function filterWordsByDifficulty(difficulty) {
    try {
        if (isSearchActive) {
            // If search is active, clear search first
            handleClearSearchWordlist();
        }

        const response = await fetch(`${API_BASE_URL}/filter?difficulty=${difficulty}`);
        if (!response.ok) throw new Error('Failed to filter words');

        allWords = await response.json(); // Update allWords for search
        currentWords = [...allWords]; // Copy for current display

        if (currentSortMethod === 'alphabet') {
            currentWords.sort((a, b) => a.english.localeCompare(b.english));
        }

        renderWordList(currentWords);
        updateCharts(); // Update charts with filtered data
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Open edit modal
function openEditModal(word) {
    document.getElementById('editWordId').value = word.id;
    document.getElementById('editEnglish').value = word.english;
    document.getElementById('editMeaning').value = word.meaning || '';
    document.getElementById('editTurkishMeaning').value = word.turkishMeaning || '';
    document.getElementById('editExampleUsage').value = word.exampleUsage || '';

    // Set difficulty level in hidden select
    const difficultySelect = document.getElementById('editDifficultyLevel');
    if (word.difficultyLevel) {
        difficultySelect.value = word.difficultyLevel;
    } else {
        difficultySelect.value = '';
    }

    // Set the corresponding radio button
    const difficultyValue = word.difficultyLevel || '';
    const radioSelector = difficultyValue ?
        `#${difficultyValue}Difficulty` :
        '#noDifficulty';

    // Uncheck all radios first
    document.querySelectorAll('input[name="difficultyRadio"]')
        .forEach(radio => radio.checked = false);

    // Check the appropriate radio
    const radioToCheck = document.querySelector(radioSelector);
    if (radioToCheck) {
        radioToCheck.checked = true;
    }

    editModal.style.display = 'block';
}

// Close modal
function closeModal() {
    editModal.style.display = 'none';
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

// Handle edit word
async function handleEditWord(e) {
    e.preventDefault();

    const wordId = document.getElementById('editWordId').value;
    const english = document.getElementById('editEnglish').value.trim();
    const meaning = document.getElementById('editMeaning').value.trim();
    const turkishMeaning = document.getElementById('editTurkishMeaning').value.trim();
    const exampleUsage = document.getElementById('editExampleUsage').value.trim();
    const difficultyLevel = document.getElementById('editDifficultyLevel').value;

    if (!english || !meaning || !turkishMeaning) {
        showNotification('Please fill in all required fields', true);
        return;
    }

    try {
        // Önce mevcut kelimeyi al
        const getResponse = await fetch(`${API_BASE_URL}/${wordId}`);
        if (!getResponse.ok) throw new Error('Failed to fetch word data');

        const existingWord = await getResponse.json();

        // Mevcut kelimeyi güncelle
        const response = await fetch(`${API_BASE_URL}/${wordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                english,
                meaning,
                turkishMeaning,
                exampleUsage,
                difficultyLevel,
                addedDate: existingWord.addedDate // Mevcut ekleme tarihini koru
            })
        });

        if (!response.ok) throw new Error('Failed to update word');

        showNotification(`Word "${english}" updated successfully!`);
        closeModal();
        loadWords(); // This will also update charts
        loadStatistics(); // İstatistikleri güncelle
    } catch (error) {
        showNotification(error.message, true);
    }
}

// Handle delete word
async function handleDeleteWord(wordId) {
    if (!confirm('Are you sure you want to delete this word?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${wordId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete word');

        showNotification('Word deleted successfully!');
        loadWords(); // This will also update charts
        loadStatistics();
    } catch (error) {
        showNotification(error.message, true);
    }
}

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

// Initialize time chart separately
function initTimeChart() {
    const timeCtx = document.getElementById('wordsTimeChart').getContext('2d');
    timeChart = new Chart(timeCtx, {
        type: 'line',
        data: {
            labels: ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'],
            datasets: [{
                label: 'Words Added',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Initialize pie chart separately
function initPieChart() {
    const pieCtx = document.getElementById('difficultyPieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut', // Changed from 'pie' to 'doughnut'
        data: {
            labels: ['Easy', 'Medium', 'Hard', 'Not Set'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#FFFF00', // Neon Yellow for Easy
                    '#FF6700', // Neon Orange for Medium
                    '#FF3131', // Neon Red for Hard
                    '#00BFFF'  // Neon Blue for Not Set
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1, // Make it more circular
            cutout: '70%', // This creates the donut hole (70% of radius - daha ince halka)
            plugins: {
                legend: {
                    position: 'right'
                }
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10
                }
            }
        }
    });
}

// Update charts with current data
function updateCharts() {
    if (!currentWords.length) return;

    // Update time chart - count words by day (only if chart exists)
    if (timeChart) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysCounts = Array(7).fill(0);

        currentWords.forEach(word => {
            const wordDate = new Date(word.addedDate);
            wordDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((today - wordDate) / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays < 7) {
                daysCounts[6 - diffDays]++;
            }
        });

        timeChart.data.datasets[0].data = daysCounts;
        timeChart.update();
    }

    // Update pie chart - count words by difficulty (only if chart exists)
    if (pieChart) {
        const difficultyCounts = {
            easy: 0,
            medium: 0,
            hard: 0,
            notSet: 0
        };

        currentWords.forEach(word => {
            if (!word.difficultyLevel) {
                difficultyCounts.notSet++;
            } else if (word.difficultyLevel === 'easy') {
                difficultyCounts.easy++;
            } else if (word.difficultyLevel === 'medium') {
                difficultyCounts.medium++;
            } else if (word.difficultyLevel === 'hard') {
                difficultyCounts.hard++;
            }
        });

        pieChart.data.datasets[0].data = [
            difficultyCounts.easy,
            difficultyCounts.medium,
            difficultyCounts.hard,
            difficultyCounts.notSet
        ];
        pieChart.update();
    }
}

// Handle search in wordlist
function handleSearchWordlist() {
    const query = searchInputWordlist.value.trim();

    if (!query) {
        handleClearSearchWordlist();
        return;
    }

    // Filter words based on search query
    const filteredWords = allWords.filter(word =>
        word.english.toLowerCase().includes(query.toLowerCase()) ||
        word.meaning.toLowerCase().includes(query.toLowerCase()) ||
        word.turkishMeaning.toLowerCase().includes(query.toLowerCase())
    );

    currentWords = filteredWords;
    isSearchActive = true;
    renderWordList(currentWords);

    // Update section title to show search results
    const sectionTitle = document.querySelector('.word-list-section h2');
    if (sectionTitle) {
        sectionTitle.innerHTML = `<i class="fas fa-search"></i> Search Results (${filteredWords.length} found)`;
    }

    showNotification(`Found ${filteredWords.length} words matching "${query}"`);
}

// Handle clear search in wordlist
function handleClearSearchWordlist() {
    searchInputWordlist.value = '';
    isSearchActive = false;

    // Restore original words based on current filter
    if (currentFilter === 'all') {
        currentWords = [...allWords];
    } else {
        // Re-apply current filter
        currentWords = allWords.filter(word =>
            word.difficultyLevel === currentFilter
        );
    }

    // Re-apply current sort
    if (currentSortMethod === 'alphabet') {
        currentWords.sort((a, b) => a.english.localeCompare(b.english));
    }

    renderWordList(currentWords);

    // Restore section title
    const sectionTitle = document.querySelector('.word-list-section h2');
    if (sectionTitle) {
        sectionTitle.innerHTML = '<i class="fas fa-book-open"></i> Word Collection';
    }

    showNotification('Search cleared');
}

// Show notification
function showNotification(message, isError = false) {
    notificationMessage.textContent = message;
    notification.className = isError ? 'notification error show' : 'notification show';

    setTimeout(() => {
        notification.className = notification.className.replace('show', '');
    }, 3000);
}
