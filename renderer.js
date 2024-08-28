let cachedPackages = []; // Global variable to cache packages

// Fetch package list once on app load and cache it
document.addEventListener('DOMContentLoaded', async () => {
    const packageList = document.getElementById('package-list');

    // Show loading spinner
    packageList.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const packages = await window.api.getPackages();
        cachedPackages = packages;
        renderPackageList(cachedPackages, ''); // Render the fetched packages
        performSearch(); // Initial render with all packages
        setupBoardSelection();
    } catch (error) {
        console.error('Error fetching packages:', error);
        document.getElementById('package-list').innerHTML = '<p>Error loading packages.</p>';
    }
});

let selectedBoard = null;  // Variable to keep track of the selected board


function setupBoardSelection() {
    const boardItems = document.querySelectorAll('.board-item');

    boardItems.forEach(board => {
        board.addEventListener('click', () => {
            // Unselect all boards
            boardItems.forEach(b => b.classList.remove('selected'));

            // Mark the clicked board as selected
            board.classList.add('selected');
            selectedBoard = board.textContent;

            // Enable the install buttons if a board is selected
            updateInstallButtonsState();
        });
    });

    // Disable the install buttons if no board is selected on page load
    updateInstallButtonsState();
}

function updateInstallButtonsState() {
    const installButtons = document.querySelectorAll('.install');
    const manualInstallButton = document.getElementById('manual-install-btn');

    // Disable or enable buttons based on board selection
    const buttonsDisabled = !selectedBoard;

    installButtons.forEach(button => button.disabled = buttonsDisabled);
    manualInstallButton.disabled = buttonsDisabled;
}

function performSearch() {
    const searchField = document.getElementById('search-field');
    const searchTerm = searchField.value.toLowerCase();

    // Use cached package list for filtering
    const filteredPackages = searchTerm === '' ? cachedPackages : cachedPackages.filter(pkg =>
        pkg.name.toLowerCase().includes(searchTerm) ||
        (pkg.author && pkg.author.toLowerCase().includes(searchTerm))
    );

    renderPackageList(filteredPackages, searchTerm);
    updateResultsCount(filteredPackages.length, searchTerm);
}

function renderPackageList(packages, searchTerm) {
    const packageList = document.getElementById('package-list');
    packageList.innerHTML = '';

    packages.forEach(pkg => {
        const isExactMatch = pkg.name.toLowerCase() === searchTerm;

        const packageItem = document.createElement('li');
        packageItem.className = 'package-item';

        let authorHTML = pkg.author ? ` by ${pkg.author}` : '';
        let descriptionHTML = pkg.description ? `<div class="package-description">${pkg.description}</div>` : '';
        let tagsHTML = pkg.tags && pkg.tags.length ? `<div class="package-tags">${pkg.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : '';
        let licenseHTML = pkg.license ? `<div class="package-license">Licensed under ${pkg.license}</div>` : '';

        packageItem.innerHTML = `
            <div class="package-info">
                <div class="package-title-container">
                    <div class="package-title">${pkg.name}${authorHTML}</div>
                    ${isExactMatch ? `<span class="exact-match-tag">Exact Match</span>` : ''}
                </div>
                ${descriptionHTML}
                ${tagsHTML}
                ${licenseHTML}
            </div>
            <div class="package-buttons">
                <button class="install primary">Install</button>
                <button class="read-more link">More info</button>
            </div>
        `;

        packageList.appendChild(packageItem);

        const divider = document.createElement('div');
        divider.className = 'package-divider';
        packageList.appendChild(divider);

        const installButton = packageItem.querySelector('.install');
        const moreInfoButton = packageItem.querySelector('.read-more');

        installButton.addEventListener('click', () => {
            installPackage(pkg.name);
        });

        moreInfoButton.addEventListener('click', () => {
            openPackageInfo(pkg.url);
        });
    });
}

async function installPackage(packageName) {
    if (!selectedBoard) return;

    const overlay = document.getElementById('overlay');
    const installButtons = document.querySelectorAll('.install');
    const searchField = document.getElementById('search-field');
    const githubUrlInput = document.getElementById('github-url');
    const manualInstallButton = document.getElementById('manual-install-btn');
    const boardItems = document.querySelectorAll('.board-item');

    // Disable UI components
    installButtons.forEach(button => button.disabled = true);
    searchField.disabled = true;
    githubUrlInput.disabled = true;
    manualInstallButton.disabled = true;
    boardItems.forEach(board => board.style.pointerEvents = 'none');
    showOverlay();

    showStatus(`Installing ${packageName} on ${selectedBoard}...`);

    const result = await window.api.installPackage(packageName);

    if (result.success) {
        showStatus(`${packageName} installation complete on ${selectedBoard}. ✅`);
    } else {
        showStatus(`Failed to install ${packageName}: ${result.error}`);
    }

    // Re-enable UI components
    searchField.disabled = false;
    githubUrlInput.disabled = false;
    boardItems.forEach(board => board.style.pointerEvents = 'auto');
    updateInstallButtonsState(); // Re-enable buttons only if a board is selected
    hideOverlay();
}

function openPackageInfo(url) {
    if (url) {
        window.open(url, '_blank'); // Opens the URL in a new browser tab
    } else {
        alert('No information available for this package.');
    }
}

function updateResultsCount(count, searchTerm) {
    const resultsCount = document.getElementById('results-count');
    if (searchTerm) {
        resultsCount.textContent = `${count} package${count !== 1 ? 's' : ''} found`;
        resultsCount.style.display = 'block';
    } else {
        resultsCount.style.display = 'none';
    }
}

function getPackages() {
    return [
        {
            title: "Example Package 1",
            author: "Arduino",
            description: "A Python client for the Arduino IoT cloud.",
            tags: ["cloud", "iot"],
            license: "MIT"
        },
        {
            title: "Example Package 2",
            author: "OpenAI",
            description: "A package for advanced language models.",
            tags: ["AI", "NLP"],
            license: "Apache-2.0"
        },
        // Add more packages here
    ];
}

function toggleAdvancedOptions() {
    const advancedOptions = document.getElementById('advanced-options');
    const disclosureIcon = document.getElementById('disclosure-icon');
    
    if (advancedOptions.style.display === 'none') {
        advancedOptions.style.display = 'block';
        disclosureIcon.innerHTML = '&#9662;'; // Downward-pointing triangle (▼)
    } else {
        advancedOptions.style.display = 'none';
        disclosureIcon.innerHTML = '&#9656;'; // Right-pointing triangle (▶)
    }
}

function manualInstall() {
    if (!selectedBoard) return; // Safety check

    const githubUrl = document.getElementById('github-url').value;
    const searchField = document.getElementById('search-field');
    const githubUrlInput = document.getElementById('github-url');
    const manualInstallButton = document.getElementById('manual-install-btn');
    const boardItems = document.querySelectorAll('.board-item');

    if (githubUrl.trim() === '') {
        alert('Please enter a valid GitHub URL.');
        return;
    }

    // Disable the same components during manual installation
    showOverlay();
    searchField.disabled = true;
    githubUrlInput.disabled = true;
    manualInstallButton.disabled = true;
    boardItems.forEach(board => board.style.pointerEvents = 'none');

    showStatus(`Installing from ${githubUrl} on ${selectedBoard}...`);

    // Simulate installation process
    setTimeout(() => {
        showStatus(`Installation from ${githubUrl} complete on ${selectedBoard}.`);

        // Re-enable all components
        hideOverlay();
        searchField.disabled = false;
        githubUrlInput.disabled = false;
        boardItems.forEach(board => board.style.pointerEvents = 'auto');

        // Only enable install buttons if a board is still selected
        updateInstallButtonsState();
    }, 2000);
}

function showStatus(message) {
    const statusBar = document.getElementById('status-bar');
    const statusMessage = document.getElementById('status-message');

    statusMessage.textContent = message;
    statusBar.style.display = 'block';

    // Add the visible class to trigger the slide down effect
    setTimeout(() => {
        statusBar.classList.add('visible');
    }, 10);

    // Automatically hide the status after 3 seconds
    setTimeout(hideStatus, 3000);
}

function hideStatus() {
    const statusBar = document.getElementById('status-bar');

    // Remove the visible class to trigger the slide-up effect
    statusBar.classList.remove('visible');

    // After the transition ends, hide the element
    setTimeout(() => {
        statusBar.style.display = 'none';
    }, 300); // Match this duration with the CSS transition duration
}

function showOverlay() {
    const overlay = document.getElementById('overlay');
    
    // Display the overlay and then trigger the fade-in effect
    overlay.style.display = 'block';
    
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
}

function hideOverlay() {
    const overlay = document.getElementById('overlay');
    
    // Trigger the fade-out effect
    overlay.classList.remove('visible');
    
    // After the fade-out transition ends, hide the element
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 500); // Match this duration with the CSS transition duration
}