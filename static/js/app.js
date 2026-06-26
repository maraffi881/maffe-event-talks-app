document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releases = [];
    let selectedReleaseId = null;
    let activeTypeFilter = 'all';
    let searchQuery = '';
    const MAX_TWEET_LENGTH = 280;

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const filterChips = document.querySelectorAll('.filter-chip');
    const showingText = document.getElementById('showing-text');
    const lastUpdatedTime = document.getElementById('last-updated-time');
    
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const releasesContainer = document.getElementById('releases-container');
    
    // Composer Elements
    const composerSidebar = document.getElementById('composer-sidebar');
    const composerEmptyState = document.getElementById('composer-empty-state');
    const composerForm = document.getElementById('composer-form');
    const composerTypeBadge = document.getElementById('composer-type-badge');
    const composerDate = document.getElementById('composer-date');
    const composerSourceText = document.getElementById('composer-source-text');
    const tweetTextarea = document.getElementById('tweet-text');
    const charCounter = document.getElementById('char-counter');
    const progressCircle = document.getElementById('progress-circle');
    const tweetBtn = document.getElementById('tweet-btn');
    const clearSelectionBtn = document.getElementById('clear-selection');

    // Counts elements
    const countAll = document.getElementById('count-all');
    const countFeature = document.getElementById('count-feature');
    const countChange = document.getElementById('count-change');
    const countAnnouncement = document.getElementById('count-announcement');
    const countBreaking = document.getElementById('count-breaking');
    const countIssue = document.getElementById('count-issue');

    // SVG Progress Circle configuration
    const circleRadius = 10;
    const circumference = 2 * Math.PI * circleRadius;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;

    /* ==========================================================================
       Theme Toggle
       ========================================================================== */
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    });

    /* ==========================================================================
       Fetch & Parse Release Notes
       ========================================================================== */
    async function fetchReleases() {
        showLoading();
        refreshIcon.classList.add('fa-spin');
        refreshBtn.disabled = true;

        try {
            const response = await fetch('/api/releases');
            const result = await response.json();

            if (result.status === 'success') {
                // Add an ID to each release for selection matching
                releases = result.data.map((item, index) => ({
                    id: `release-${index}`,
                    ...item
                }));
                
                updateStats();
                renderReleases();
                showData();
                
                // Update checked time
                const now = new Date();
                lastUpdatedTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                showError(result.message || 'Failed to fetch release notes.');
            }
        } catch (error) {
            showError('Network error. Make sure the server is running and try again.');
        } finally {
            refreshIcon.classList.remove('fa-spin');
            refreshBtn.disabled = false;
        }
    }

    /* ==========================================================================
       Render & UI Management
       ========================================================================== */
    function showLoading() {
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        releasesContainer.classList.add('hidden');
        if (exportCsvBtn) exportCsvBtn.style.display = 'none';
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
        releasesContainer.classList.add('hidden');
        if (exportCsvBtn) exportCsvBtn.style.display = 'none';
    }

    function showData() {
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        releasesContainer.classList.remove('hidden');
        if (exportCsvBtn) exportCsvBtn.style.display = 'inline-flex';
    }

    function updateStats() {
        // Calculate counts
        const stats = {
            all: releases.length,
            Feature: 0,
            Change: 0,
            Announcement: 0,
            Breaking: 0,
            Issue: 0
        };

        releases.forEach(r => {
            if (stats[r.type] !== undefined) {
                stats[r.type]++;
            }
        });

        countAll.textContent = stats.all;
        countFeature.textContent = stats.Feature;
        countChange.textContent = stats.Change;
        countAnnouncement.textContent = stats.Announcement;
        countBreaking.textContent = stats.Breaking;
        countIssue.textContent = stats.Issue;
    }

    function renderReleases() {
        releasesContainer.innerHTML = '';
        
        const filtered = getFilteredReleases();
        
        showingText.textContent = `Showing ${filtered.length} updates`;

        if (filtered.length === 0) {
            releasesContainer.innerHTML = `
                <div class="loading-state" style="border-style: dashed; padding: 3rem;">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary);">No release notes matched your filters.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = `release-card ${selectedReleaseId === item.id ? 'selected' : ''}`;
            card.dataset.id = item.id;

            const typeLower = item.type.toLowerCase();
            
            card.innerHTML = `
                <div class="release-card-header">
                    <span class="type-badge ${typeLower}">${item.type}</span>
                    <span class="date-badge">${item.date}</span>
                </div>
                <div class="release-card-body">
                    ${item.content_html}
                </div>
                <div class="release-card-footer">
                    <span class="card-action-hint">
                        <i class="fa-regular ${selectedReleaseId === item.id ? 'fa-circle-check' : 'fa-circle'}"></i>
                        ${selectedReleaseId === item.id ? 'Selected' : 'Click to Select'}
                    </span>
                    <div style="display: flex; gap: 0.35rem;">
                        <button class="btn btn-secondary btn-xs copy-card-btn" data-id="${item.id}" title="Copy to Clipboard">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                        <button class="btn btn-secondary btn-xs inline-tweet-btn" data-id="${item.id}" title="Compose Tweet">
                            <i class="fa-brands fa-x-twitter"></i> Tweet
                        </button>
                    </div>
                </div>
            `;

            // Click card to select
            card.addEventListener('click', (e) => {
                // If they clicked on the tweet button, don't trigger normal toggle twice
                if (e.target.closest('.inline-tweet-btn')) return;
                
                selectRelease(item.id);
            });

            releasesContainer.appendChild(card);
        });

        // Add event listeners to inline tweet buttons
        releasesContainer.querySelectorAll('.inline-tweet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                selectRelease(id, true);
            });
        });

        // Add event listeners to copy buttons
        releasesContainer.querySelectorAll('.copy-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering card selection click
                const id = btn.getAttribute('data-id');
                const item = releases.find(r => r.id === id);
                if (item) {
                    copyToClipboard(item.content_text, btn);
                }
            });
        });
    }

    function getFilteredReleases() {
        return releases.filter(item => {
            // Category check
            if (activeTypeFilter !== 'all' && item.type !== activeTypeFilter) {
                return false;
            }
            
            // Search query check
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const typeMatch = item.type.toLowerCase().includes(q);
                const dateMatch = item.date.toLowerCase().includes(q);
                const contentMatch = item.content_text.toLowerCase().includes(q);
                return typeMatch || dateMatch || contentMatch;
            }

            return true;
        });
    }

    /* ==========================================================================
       Select Update / Tweet Composer Logic
       ========================================================================== */
    function selectRelease(id, focusComposer = false) {
        if (selectedReleaseId === id) {
            // Toggle off selection if clicked again
            selectedReleaseId = null;
            closeComposer();
        } else {
            selectedReleaseId = id;
            const item = releases.find(r => r.id === id);
            if (item) {
                openComposer(item);
                if (focusComposer) {
                    tweetTextarea.focus();
                }
            }
        }
        
        // Re-render to update the highlight borders & checkmarks
        renderReleases();
    }

    function openComposer(item) {
        composerEmptyState.classList.add('hidden');
        composerForm.classList.remove('hidden');

        // Setup badge and date
        composerTypeBadge.className = `type-badge ${item.type.toLowerCase()}`;
        composerTypeBadge.textContent = item.type;
        composerDate.textContent = item.date;
        composerSourceText.textContent = item.content_text;

        // Auto-generate tweet draft
        const tweetText = generateTweetDraft(item);
        tweetTextarea.value = tweetText;
        updateCharCounter();
    }

    function closeComposer() {
        composerEmptyState.classList.remove('hidden');
        composerForm.classList.add('hidden');
        selectedReleaseId = null;
    }

    function generateTweetDraft(item) {
        // Build base text components
        const prefix = `BigQuery Release [${item.type}] (${item.date}): `;
        const link = item.link ? ` ${item.link}` : '';
        const hashtags = ' #BigQuery #GoogleCloud';
        
        // Calculate max description length
        // 280 - prefix length - link length - hashtags length
        const maxDescLength = MAX_TWEET_LENGTH - prefix.length - link.length - hashtags.length - 3; // -3 for "..."

        let description = item.content_text;
        
        if (description.length > maxDescLength) {
            description = description.substring(0, maxDescLength) + '...';
        }

        return `${prefix}${description}${link}${hashtags}`;
    }

    function updateCharCounter() {
        const text = tweetTextarea.value;
        const len = text.length;
        
        charCounter.textContent = `${len} / ${MAX_TWEET_LENGTH}`;

        // Circular progress indicator
        const percentage = Math.min(len / MAX_TWEET_LENGTH, 1);
        const strokeDashoffset = circumference - (percentage * circumference);
        progressCircle.style.strokeDashoffset = strokeDashoffset;

        // Styling indicators when getting close
        if (len > MAX_TWEET_LENGTH) {
            progressCircle.style.stroke = '#ef4444'; // Red
            charCounter.style.color = '#ef4444';
            tweetBtn.disabled = true;
            tweetBtn.style.opacity = 0.5;
            tweetBtn.style.cursor = 'not-allowed';
        } else if (len > MAX_TWEET_LENGTH - 20) {
            progressCircle.style.stroke = '#f59e0b'; // Amber warning
            charCounter.style.color = '#f59e0b';
            tweetBtn.disabled = false;
            tweetBtn.style.opacity = 1;
            tweetBtn.style.cursor = 'pointer';
        } else {
            progressCircle.style.stroke = '#1d9bf0'; // Twitter blue
            charCounter.style.color = 'var(--text-muted)';
            tweetBtn.disabled = false;
            tweetBtn.style.opacity = 1;
            tweetBtn.style.cursor = 'pointer';
        }
    }

    /* ==========================================================================
       Event Listeners & Filtering
       ========================================================================== */
    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderReleases();
    });

    // Category filter chips
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            activeTypeFilter = chip.getAttribute('data-type');
            renderReleases();
        });
    });

    // Tweet textarea typing
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Share Tweet click
    tweetBtn.addEventListener('click', () => {
        const text = encodeURIComponent(tweetTextarea.value);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    });

    // Cancel Selection click
    clearSelectionBtn.addEventListener('click', () => {
        selectRelease(selectedReleaseId); // Toggle off selection
    });

    // Copy utility helper
    function copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    // Export to CSV utility
    function exportToCSV() {
        const filtered = getFilteredReleases();
        if (filtered.length === 0) return;

        const headers = ['Date', 'Type', 'Content', 'Link'];
        const csvRows = [headers.join(',')];

        filtered.forEach(item => {
            const cleanDate = `"${item.date.replace(/"/g, '""')}"`;
            const cleanType = `"${item.type.replace(/"/g, '""')}"`;
            const cleanContent = `"${item.content_text.replace(/"/g, '""')}"`;
            const cleanLink = `"${item.link.replace(/"/g, '""')}"`;
            
            csvRows.push([cleanDate, cleanType, cleanContent, cleanLink].join(','));
        });

        const csvContent = "\ufeff" + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bigquery_release_notes_${activeTypeFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Export CSV click
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }

    // Refresh clicks
    refreshBtn.addEventListener('click', fetchReleases);
    retryBtn.addEventListener('click', fetchReleases);

    // Initial Load
    fetchReleases();
});
