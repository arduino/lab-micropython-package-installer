document.addEventListener('DOMContentLoaded', () => {
    fetchPackages(); // Fetch packages when the app starts
    // Display all packages when the app starts
    performSearch();
    setupBoardSelection();
});

let selectedBoard = null;  // Variable to keep track of the selected board

async function fetchPackages() {
    try {
        const packages = await window.api.getPackages();
        console.log(packages);
        renderPackageList(packages, ''); // Render the fetched packages
    } catch (error) {
        console.error('Failed to fetch packages:', error);
    }
}

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

    window.api.getPackages().then(packages => {
        const filteredPackages = searchTerm === '' ? packages : packages.filter(pkg =>
            pkg.name.toLowerCase().includes(searchTerm) ||
            pkg.authors.some(author => author.toLowerCase().includes(searchTerm))
        );

        renderPackageList(filteredPackages, searchTerm);
        updateResultsCount(filteredPackages.length, searchTerm);
    });
}

function renderPackageList(packages, searchTerm) {
    const packageList = document.getElementById('package-list');    
    packageList.innerHTML = '';

    packages.forEach(pkg => {
        const isExactMatch = pkg.name.toLowerCase() === searchTerm;

        const packageItem = document.createElement('li');
        packageItem.className = 'package-item';
        packageItem.innerHTML = `
            <div class="package-info">
                <div class="package-title-container">
                    <div class="package-title">${pkg.name} by ${pkg.authors.join(', ')}</div>
                    ${isExactMatch ? `<span class="exact-match-tag">Exact Match</span>` : ''}
                </div>
                <div class="package-description">${pkg.description}</div>
                <div class="package-tags">
                    ${pkg.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="package-license">Licensed under ${pkg.license}</div>
            </div>
            <div class="package-buttons">
                <button class="install">Install</button>
                <button class="read-more">More info</button>
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
            openPackageInfo(pkg);
        });
    });
}

async function installPackage(packageName) {
    if (!selectedBoard) return;

    const statusField = document.getElementById('status');
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
    overlay.classList.add('show');

    statusField.textContent = `Installing ${packageName} on ${selectedBoard}...`;

    const result = await window.api.installPackage(packageName);

    if (result.success) {
        statusField.textContent = `${packageName} installation complete on ${selectedBoard}.`;
    } else {
        statusField.textContent = `Failed to install ${packageName}: ${result.error}`;
    }

    // Re-enable UI components
    searchField.disabled = false;
    githubUrlInput.disabled = false;
    boardItems.forEach(board => board.style.pointerEvents = 'auto');
    updateInstallButtonsState(); // Re-enable buttons only if a board is selected
    overlay.classList.remove('show');
}

function openPackageInfo(pkg) {
    alert(`More info about ${pkg.title}...`);
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
    const statusField = document.getElementById('status');
    const overlay = document.getElementById('overlay');
    const searchField = document.getElementById('search-field');
    const githubUrlInput = document.getElementById('github-url');
    const manualInstallButton = document.getElementById('manual-install-btn');
    const boardItems = document.querySelectorAll('.board-item');

    if (githubUrl.trim() === '') {
        alert('Please enter a valid GitHub URL.');
        return;
    }

    // Disable the same components during manual installation
    overlay.classList.add('show');
    searchField.disabled = true;
    githubUrlInput.disabled = true;
    manualInstallButton.disabled = true;
    boardItems.forEach(board => board.style.pointerEvents = 'none');

    statusField.textContent = `Installing from ${githubUrl} on ${selectedBoard}...`;

    // Simulate installation process
    setTimeout(() => {
        statusField.textContent = `Installation from ${githubUrl} complete on ${selectedBoard}.`;

        // Re-enable all components
        overlay.classList.remove('show');
        searchField.disabled = false;
        githubUrlInput.disabled = false;
        boardItems.forEach(board => board.style.pointerEvents = 'auto');

        // Only enable install buttons if a board is still selected
        updateInstallButtonsState();
    }, 2000);
}