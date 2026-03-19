// Habit Tracker Application with Advanced Features

class HabitTracker {
    constructor() {
        this.habits = this.loadHabits();
        this.lineChart = null;
        this.pieChart = null;
        this.currentChartRange = 7;
        this.lastSaveTime = this.loadLastSaveTime();
        this.initializeEventListeners();
        this.renderHabits();
        this.updateStats();
        this.initializeCharts();
        this.setupAutoSave();
    }

    initializeEventListeners() {
        document.getElementById('addBtn').addEventListener('click', () => this.addHabit());
        document.getElementById('habitInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addHabit();
        });

        // Header buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.manualSave());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        document.getElementById('resetBtn').addEventListener('click', () => this.resetAllData());
        document.getElementById('fileInput').addEventListener('change', (e) => this.importData(e));

        // Quick actions
        document.getElementById('completeAllBtn').addEventListener('click', () => this.completeAllToday());
        document.getElementById('resetTodayBtn').addEventListener('click', () => this.resetTodayProgress());
        document.getElementById('sortBtn').addEventListener('click', () => this.sortByStreak());

        // Search and filter
        document.getElementById('searchInput').addEventListener('input', () => this.filterHabits());
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterHabits());

        // Chart range buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentChartRange = parseInt(e.target.dataset.range);
                this.updateLineChart();
            });
        });

        // Help modal
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeBtn = document.querySelector('.close');

        helpBtn.addEventListener('click', () => {
            helpModal.classList.add('show');
        });

        closeBtn.addEventListener('click', () => {
            helpModal.classList.remove('show');
        });

        window.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.classList.remove('show');
            }
        });

        // Auto-save on before unload
        window.addEventListener('beforeunload', () => this.saveHabits());
    }

    addHabit() {
        const input = document.getElementById('habitInput');
        const category = document.getElementById('categorySelect').value;
        const habitName = input.value.trim();

        if (!habitName) {
            this.showToast('Please enter a habit name', 'error');
            return;
        }

        const newHabit = {
            id: Date.now(),
            name: habitName,
            category: category,
            createdDate: new Date().toISOString(),
            completedDates: [],
            streak: 0
        };

        this.habits.push(newHabit);
        this.saveHabits();
        this.renderHabits();
        this.updateStats();
        this.updateCharts();
        
        input.value = '';
        input.focus();
        this.showToast(`✅ Habit "${habitName}" added successfully!`, 'success');
    }

    deleteHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
            this.habits = this.habits.filter(habit => habit.id !== id);
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            this.updateCharts();
            this.showToast('Habit deleted', 'success');
        }
    }

    toggleHabitCompletion(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        const today = this.getDateString(new Date());
        const index = habit.completedDates.indexOf(today);

        if (index > -1) {
            habit.completedDates.splice(index, 1);
            this.showToast(`${habit.name} marked incomplete`, 'info');
        } else {
            habit.completedDates.push(today);
            this.showToast(`✅ Great! ${habit.name} completed!`, 'success');
        }

        habit.streak = this.calculateStreak(habit);
        this.saveHabits();
        this.renderHabits();
        this.updateStats();
        this.updateCharts();
    }

    completeAllToday() {
        const today = this.getDateString(new Date());
        let count = 0;

        this.habits.forEach(habit => {
            if (!habit.completedDates.includes(today)) {
                habit.completedDates.push(today);
                habit.streak = this.calculateStreak(habit);
                count++;
            }
        });

        if (count > 0) {
            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            this.updateCharts();
            this.showToast(`✅ Completed ${count} habits!`, 'success');
        } else {
            this.showToast('All habits already completed today!', 'info');
        }
    }

    resetTodayProgress() {
        if (confirm('Reset all habits for today?')) {
            const today = this.getDateString(new Date());
            this.habits.forEach(habit => {
                const index = habit.completedDates.indexOf(today);
                if (index > -1) {
                    habit.completedDates.splice(index, 1);
                    habit.streak = this.calculateStreak(habit);
                }
            });

            this.saveHabits();
            this.renderHabits();
            this.updateStats();
            this.updateCharts();
            this.showToast("Today's progress reset", 'success');
        }
    }

    sortByStreak() {
        this.habits.sort((a, b) => b.streak - a.streak);
        this.renderHabits();
        this.showToast('Sorted by streak!', 'info');
    }

    filterHabits() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;

        document.querySelectorAll('.habit-item').forEach(item => {
            const habitName = item.querySelector('.habit-name').textContent.toLowerCase();
            const categoryBadge = item.querySelector('.category-badge').textContent;

            const matchesSearch = habitName.includes(searchTerm);
            const matchesCategory = categoryFilter === 'all' || categoryBadge.toLowerCase() === categoryFilter;

            item.classList.toggle('hidden', !(matchesSearch && matchesCategory));
        });
    }

    calculateStreak(habit) {
        if (habit.completedDates.length === 0) return 0;

        const sortedDates = habit.completedDates.sort().reverse();
        let streak = 0;
        let currentDate = new Date();

        for (let i = 0; i < sortedDates.length; i++) {
            const checkDate = new Date(sortedDates[i]);
            const expectedDate = new Date(currentDate);
            expectedDate.setDate(expectedDate.getDate() - i);

            if (this.getDateString(checkDate) !== this.getDateString(expectedDate)) {
                break;
            }
            streak++;
        }

        return streak;
    }

    isCompletedToday(habit) {
        const today = this.getDateString(new Date());
        return habit.completedDates.includes(today);
    }

    getDateString(date) {
        return date.toISOString().split('T')[0];
    }

    getProgressPercentage(habit) {
        if (habit.completedDates.length === 0) return 0;
        
        const createdDate = new Date(habit.createdDate);
        const today = new Date();
        const daysSinceCreation = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)) + 1;
        
        return Math.min(100, Math.round((habit.completedDates.length / daysSinceCreation) * 100));
    }

    initializeCharts() {
        this.initializeLineChart();
        this.initializePieChart();
    }

    initializeLineChart() {
        const ctx = document.getElementById('progressChart').getContext('2d');
        this.lineChart = new Chart(ctx, {
            type: 'line',
            data: this.getLineChartData(this.currentChartRange),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 12, weight: '600' },
                            color: '#6b7280',
                            padding: 15
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: this.habits.length || 1,
                        ticks: {
                            stepSize: 1,
                            color: '#6b7280'
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#6b7280' }
                    }
                }
            }
        });
    }

    initializePieChart() {
        const ctx = document.getElementById('completionChart').getContext('2d');
        const today = this.getDateString(new Date());
        const completed = this.habits.filter(h => h.completedDates.includes(today)).length;
        const pending = this.habits.length - completed;

        this.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [completed, pending],
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b'
                    ],
                    borderColor: ['#ffffff', '#ffffff'],
                    borderWidth: 2
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

    getLineChartData(days) {
        const labels = [];
        const completionData = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.getDateString(date);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

            const completedCount = this.habits.filter(habit => 
                habit.completedDates.includes(dateStr)
            ).length;
            completionData.push(completedCount);
        }

        return {
            labels: labels,
            datasets: [{
                label: 'Habits Completed',
                data: completionData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        };
    }

    updateCharts() {
        this.updateLineChart();
        this.updatePieChart();
    }

    updateLineChart() {
        if (this.lineChart) {
            this.lineChart.data = this.getLineChartData(this.currentChartRange);
            this.lineChart.update();
        }
    }

    updatePieChart() {
        if (this.pieChart) {
            const today = this.getDateString(new Date());
            const completed = this.habits.filter(h => h.completedDates.includes(today)).length;
            const pending = this.habits.length - completed;
            
            this.pieChart.data.datasets[0].data = [completed, pending];
            this.pieChart.update();
        }
    }

    renderHabits() {
        const habitsList = document.getElementById('habitsList');
        
        if (this.habits.length === 0) {
            habitsList.innerHTML = '<p class="empty-message">No habits yet. Add one to get started!</p>';
            return;
        }

        habitsList.innerHTML = this.habits.map(habit => {
            const isCompleted = this.isCompletedToday(habit);
            const progress = this.getProgressPercentage(habit);
            
            return `
                <div class="habit-item ${isCompleted ? 'completed' : ''}">
                    <div class="habit-info">
                        <div class="habit-name">${this.escapeHtml(habit.name)}</div>
                        <div class="habit-meta">
                            <span class="category-badge ${habit.category}">${habit.category}</span>
                            <span>Completed: ${habit.completedDates.length} days</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="habit-streak">
                        <div class="streak-number">🔥 ${habit.streak}</div>
                        <div class="streak-label">Streak</div>
                    </div>
                    <div class="habit-actions">
                        <button class="btn btn-check" onclick="app.toggleHabitCompletion(${habit.id})">
                            ${isCompleted ? '✓ Done' : 'Mark Done'}
                        </button>
                        <button class="btn btn-delete" onclick="app.deleteHabit(${habit.id})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const totalHabits = this.habits.length;
        const today = this.getDateString(new Date());
        const completedToday = this.habits.filter(h => h.completedDates.includes(today)).length;
        const maxStreak = this.habits.reduce((max, h) => Math.max(max, h.streak), 0);

        document.getElementById('totalHabits').textContent = totalHabits;
        document.getElementById('completedToday').textContent = completedToday;
        document.getElementById('currentStreak').textContent = maxStreak;

        // Calculate weekly average
        const weeklyAverage = this.calculateWeeklyAverage();
        document.getElementById('weeklyAverage').textContent = Math.round(weeklyAverage) + '%';

        // Insights
        this.updateInsights();
    }

    calculateWeeklyAverage() {
        if (this.habits.length === 0) return 0;
        
        const today = new Date();
        let totalCompletions = 0;

        this.habits.forEach(habit => {
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = this.getDateString(date);
                
                if (habit.completedDates.includes(dateStr)) {
                    totalCompletions++;
                }
            }
        });

        return (totalCompletions / (this.habits.length * 7)) * 100;
    }

    updateInsights() {
        // Most consistent habit
        const mostConsistent = this.habits.reduce((max, h) => 
            h.streak > (max?.streak || 0) ? h : max, null);
        document.getElementById('mostConsistent').textContent = 
            mostConsistent ? mostConsistent.name : '-';

        // Total completions
        const totalCompletions = this.habits.reduce((sum, h) => 
            sum + h.completedDates.length, 0);
        document.getElementById('totalCompletions').textContent = totalCompletions;

        // Best day
        const bestDay = this.findBestDay();
        document.getElementById('bestDay').textContent = bestDay;

        // Success rate
        const successRate = this.calculateSuccessRate();
        document.getElementById('successRate').textContent = Math.round(successRate) + '%';
    }

    findBestDay() {
        const dayCounts = {};
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        this.habits.forEach(habit => {
            habit.completedDates.forEach(dateStr => {
                const date = new Date(dateStr);
                const dayName = days[date.getDay()];
                dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
            });
        });

        let bestDay = '-';
        let maxCount = 0;
        for (const [day, count] of Object.entries(dayCounts)) {
            if (count > maxCount) {
                maxCount = count;
                bestDay = day;
            }
        }

        return bestDay;
    }

    calculateSuccessRate() {
        if (this.habits.length === 0) return 0;

        const today = new Date();
        let totalPossible = 0;
        let totalCompleted = 0;

        this.habits.forEach(habit => {
            const createdDate = new Date(habit.createdDate);
            const daysSinceCreation = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)) + 1;
            
            totalPossible += daysSinceCreation;
            totalCompleted += habit.completedDates.length;
        });

        return (totalCompleted / totalPossible) * 100;
    }

    manualSave() {
        this.saveHabits();
        this.showToast('✅ All changes saved successfully!', 'success');
    }

    exportData() {
        const dataToExport = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            habits: this.habits
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showToast('✅ Data exported successfully!', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.habits || !Array.isArray(importedData.habits)) {
                    throw new Error('Invalid file format');
                }

                if (confirm('This will replace your current habits. Continue?')) {
                    this.habits = importedData.habits;
                    this.saveHabits();
                    this.renderHabits();
                    this.updateStats();
                    this.updateCharts();
                    this.showToast('✅ Data imported successfully!', 'success');
                }
            } catch (error) {
                this.showToast('❌ Error importing file: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    resetAllData() {
        if (confirm('⚠️ This will delete ALL your habits. Are you absolutely sure?')) {
            if (confirm('Last confirmation: This cannot be undone!')) {
                this.habits = [];
                this.saveHabits();
                this.renderHabits();
                this.updateStats();
                this.updateCharts();
                this.showToast('🗑️ All data has been reset!', 'success');
            }
        }
    }

    setupAutoSave() {
        setInterval(() => {
            this.saveHabits();
        }, 5 * 60 * 1000);
    }

    saveHabits() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
        localStorage.setItem('lastSaveTime', new Date().toISOString());
    }

    loadHabits() {
        const stored = localStorage.getItem('habits');
        return stored ? JSON.parse(stored) : [];
    }

    loadLastSaveTime() {
        return localStorage.getItem('lastSaveTime') || null;
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const app = new HabitTracker();