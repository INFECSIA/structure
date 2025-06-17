const TreeManager = (() => {
    // Configuration
    const CONFIG = {
        MAX_DEPTH: 7,
        MAX_FILE_SIZE: 512000, // 500KB
        COLORS: [
            '#4CAF50', '#2196F3', '#ff9800', '#9c27b0',
            '#e91e63', '#009688', '#795548', '#ff0000'
        ],
        AUTOSAVE_DELAY: 1000,
        SEARCH_DELAY: 300
    };

    // State Management
    const state = {
        currentAction: null,
        selectedNode: null,
        draggedElement: null,
        undoStack: [],
        redoStack: [],
        searchTimeout: null,
        autosaveTimeout: null
    };

    // DOM Elements
    const DOM = {
        tree: document.getElementById('tree'),
        modal: document.getElementById('modal'),
        categoryName: document.getElementById('categoryName'),
        fileInput: document.getElementById('fileInput'),
        loader: document.getElementById('loader'),
        searchInput: document.getElementById('searchInput'),
        confirmBtn: document.getElementById('confirmBtn'),
        cancelBtn: document.getElementById('cancelBtn')
    };

    // Initialization
    const init = () => {
        bindEvents();
        initializeTree();
        setupKeyboardNavigation();
        setupDragAndDrop();
    };

    // Event Bindings
    const bindEvents = () => {
        // Button Events
        document.getElementById('addRootBtn').addEventListener('click', () => showModal('add-root'));
        document.getElementById('importBtn').addEventListener('click', () => DOM.fileInput.click());
        document.getElementById('exportTxt').addEventListener('click', () => exportTree('txt'));
        document.getElementById('exportHtml').addEventListener('click', () => exportTree('html'));
        document.getElementById('exportPdf').addEventListener('click', () => exportTree('pdf'));

        // Modal Events
        DOM.confirmBtn.addEventListener('click', handleConfirm);
        DOM.cancelBtn.addEventListener('click', hideModal);
        DOM.categoryName.addEventListener('keypress', e => {
            if (e.key === 'Enter') handleConfirm();
        });

        // File Import Event
        DOM.fileInput.addEventListener('change', handleFileUpload);

        // Search Event
        DOM.searchInput.addEventListener('input', debounce(handleSearch, CONFIG.SEARCH_DELAY));

        // Global Events
        document.addEventListener('click', handleExternalClick);
        document.addEventListener('keydown', handleKeyboardShortcuts);
    };

    // Tree Node Creation and Management
    const createNode = (name, isRoot = false) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.setAttribute('role', 'treeitem');
        li.setAttribute('aria-expanded', 'false');
        
        li.innerHTML = `
            <div class="node-content">
                <span>${sanitizeInput(name)}</span>
                <div class="node-actions">
                    <button class="action-btn" data-action="add" aria-label="Add child category">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="action-btn" data-action="edit" aria-label="Edit category">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" data-action="delete" aria-label="Delete category">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        setupNodeEventListeners(li);
        return li;
    };

    const setupNodeEventListeners = (node) => {
        node.addEventListener('dragstart', handleDragStart);
        node.addEventListener('dragover', handleDragOver);
        node.addEventListener('dragend', handleDragEnd);
        node.addEventListener('drop', handleDrop);
        node.querySelector('.node-actions').addEventListener('click', handleNodeActions);
    };

    // Drag and Drop Functionality
    const setupDragAndDrop = () => {
        const handleDragStart = function(e) {
            state.draggedElement = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            
            // Accessibility
            this.setAttribute('aria-grabbed', 'true');
        };

        const handleDragOver = function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const target = e.target.closest('li');
            if (!target || !isValidDropTarget(target)) return;
            
            clearDropTargets();
            target.classList.add('drop-target');
        };

        const handleDragEnd = function() {
            this.classList.remove('dragging');
            this.setAttribute('aria-grabbed', 'false');
            clearDropTargets();
        };

        const handleDrop = function(e) {
            e.preventDefault();
            const target = e.target.closest('li');
            if (!target || target === state.draggedElement || !isValidDropTarget(target)) return;

            const targetList = target.querySelector('ul') || createChildList(target);
            targetList.appendChild(state.draggedElement);
            target.setAttribute('aria-expanded', 'true');
            
            scheduleAutosave();
        };
    };

    // Node Actions
    const handleNodeActions = (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const node = button.closest('li');
        
        switch(action) {
            case 'add':
                if (getNodeDepth(node) >= CONFIG.MAX_DEPTH) {
                    showError(`Maximum depth of ${CONFIG.MAX_DEPTH} levels reached`);
                    return;
                }
                showModal('add-child', node);
                break;
            case 'edit':
                showModal('edit', node);
                break;
            case 'delete':
                deleteNode(node);
                break;
        }
    };

    // Tree Operations
    const addNode = (parent, name) => {
        const parentList = parent.querySelector('ul') || createChildList(parent);
        const newNode = createNode(name);
        parentList.appendChild(newNode);
        parent.setAttribute('aria-expanded', 'true');
        
        scheduleAutosave();
        return newNode;
    };

    const editNode = (node, newName) => {
        const nameSpan = node.querySelector('span');
        const oldName = nameSpan.textContent;
        nameSpan.textContent = sanitizeInput(newName);
        
        // Save state for undo
        saveState({
            type: 'edit',
            node: node,
            oldValue: oldName,
            newValue: newName
        });
        
        scheduleAutosave();
    };

    const deleteNode = (node) => {
        if (!confirm('Kateqoriyanı silmək istədiyinizə əminsiniz?')) return;
        
        // Save state for undo
        saveState({
            type: 'delete',
            node: node,
            parentNode: node.parentNode,
            nextSibling: node.nextSibling
        });
        
        node.remove();
        scheduleAutosave();
    };

    // Search Functionality
    const handleSearch = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const allNodes = DOM.tree.querySelectorAll('li');
        
        allNodes.forEach(node => {
            const text = node.querySelector('span').textContent.toLowerCase();
            const matches = text.includes(searchTerm);
            
            node.style.display = matches ? '' : 'none';
            if (matches) expandAncestors(node);
        });
    };

    // Import/Export Functionality
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            showError(`Maximum file size is ${CONFIG.MAX_FILE_SIZE / 1024}KB`);
            return;
        }

        showLoader();
        try {
            const content = await readFileContent(file);
            rebuildTreeFromText(content);
            scheduleAutosave();
        } catch (error) {
            showError('Error reading file');
            console.error(error);
        } finally {
            hideLoader();
            event.target.value = ''; // Reset file input
        }
    };

    const exportTree = async (format) => {
        const treeData = traverseTree(DOM.tree);
        if (!treeData.trim()) {
            showError('Cannot export empty tree');
            return;
        }

        try {
            switch(format) {
                case 'txt':
                    await downloadAsTxt(treeData);
                    break;
                case 'html':
                    await downloadAsHtml(treeData);
                    break;
                case 'pdf':
                    await generatePdf(treeData);
                    break;
                default:
                    throw new Error('Unsupported format');
            }
        } catch (error) {
            showError(`Error exporting as ${format.toUpperCase()}`);
            console.error(error);
        }
    };

    // Utility Functions
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const sanitizeInput = (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    };

    const showError = (message) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.setAttribute('role', 'alert');
        
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    };

    // Public API
    return {
        init,
        exportTree
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', TreeManager.init);
