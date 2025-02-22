const TreeManager = (() => {
    const CONFIG = {
        MAX_DEPTH: 7,
        COLORS: [
            '#4CAF50', '#2196F3', '#ff9800',
            '#9c27b0', '#e91e63', '#009688',
            '#795548', '#ff0000'
        ]
    };

    let state = {
        currentAction: null,
        selectedNode: null,
        draggedElement: null,
        undoStack: [],
        redoStack: [],
        searchTimeout: null
    };

    const DOM = {
        tree: document.getElementById('tree'),
        modal: document.getElementById('modal'),
        categoryName: document.getElementById('categoryName'),
        fileInput: document.getElementById('fileInput'),
        loader: document.getElementById('loader'),
        searchInput: document.getElementById('searchInput')
    };

    const init = () => {
        bindEvents();
        initializeTree();
        initializeSearch();
    };

    const bindEvents = () => {
        document.getElementById('addRootBtn').addEventListener('click', () => showModal('add-root'));
        document.getElementById('importBtn').addEventListener('click', () => DOM.fileInput.click());
        document.getElementById('exportTxt').addEventListener('click', () => exportTree('txt'));
        document.getElementById('exportHtml').addEventListener('click', () => exportTree('html'));
        document.getElementById('exportPdf').addEventListener('click', () => exportTree('pdf'));

        document.getElementById('confirmBtn').addEventListener('click', handleConfirm);
        document.getElementById('cancelBtn').addEventListener('click', hideModal);

        DOM.fileInput.addEventListener('change', handleFileUpload);

        document.addEventListener('click', handleExternalClick);
        document.addEventListener('keydown', handleKeyboardShortcuts);

        DOM.searchInput.addEventListener('input', handleSearch);
    };

    const initializeTree = () => {
        if (localStorage.treeData) {
            rebuildTreeFromText(localStorage.treeData);
        }
    };

    const handleDragStart = function(e) {
        state.draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const target = e.target.closest('li');
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
        target?.classList.add('drop-target');
    };

    const handleDragEnd = function() {
        this.classList.remove('dragging');
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    };

    const handleDrop = function(e) {
        e.preventDefault();
        const target = e.target.closest('li');
        if (!target || target === state.draggedElement) return;

        const targetList = target.querySelector('ul') || createChildList(target);
        targetList.appendChild(state.draggedElement);
        targetList.classList.add('expanded');
        saveTreeState();
    };

    const createNode = (name) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.innerHTML = `
            <div class="node-content">
                <span>${sanitizeInput(name)}</span>
                <div class="node-actions">
                    <button class="action-btn" data-action="add"><i class="fas fa-plus"></i></button>
                    <button class="action-btn" data-action="edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" data-action="delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('dragend', handleDragEnd);
        li.addEventListener('drop', handleDrop);
        li.querySelector('.node-actions').addEventListener('click', handleNodeActions);
        return li;
    };

    const handleNodeActions = (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const node = button.closest('li');
        switch(action) {
            case 'add':
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

    const addNode = (parent, name) => {
        const parentList = parent.querySelector('ul') || createChildList(parent);
        parentList.appendChild(createNode(name));
        parentList.classList.add('expanded');
        saveTreeState();
    };

    const editNode = (node, newName) => {
        node.querySelector('span').textContent = sanitizeInput(newName);
        saveTreeState();
    };

    const deleteNode = (node) => {
        if (confirm('Kateqoriyanı silmək istədiyinizə əminsiniz?')) {
            node.remove();
            reorganizeTreeStructure();
            saveTreeState();
        }
    };

    const createChildList = (parent) => {
        const ul = document.createElement('ul');
        parent.appendChild(ul);
        return ul;
    };

    const showModal = (action, node = null) => {
        state.currentAction = action;
        state.selectedNode = node;
        DOM.modal.style.display = 'flex';
        DOM.categoryName.focus();
    };

    const hideModal = () => {
        DOM.modal.style.display = 'none';
        DOM.categoryName.value = '';
    };

    const handleConfirm = () => {
        const name = DOM.categoryName.value.trim();
        if (!name) return;
        switch(state.currentAction) {
            case 'add-root':
                DOM.tree.appendChild(createNode(name));
                break;
            case 'add-child':
                addNode(state.selectedNode, name);
                break;
            case 'edit':
                editNode(state.selectedNode, name);
                break;
        }
        hideModal();
    };

    const exportTree = (format) => {
        const treeData = traverseTree(DOM.tree);
        if (!treeData.trim()) return alert('Eksport üçün ağac boş ola bilməz!');
        switch(format) {
            case 'txt': downloadAsTxt(treeData); break;
            case 'html': downloadAsHTML(treeData); break;
            case 'pdf': generatePDF(treeData); break;
        }
    };

    const traverseTree = (node, level = 0) => {
        return Array.from(node.children).reduce((acc, child) => {
            if (child.tagName === 'LI') {
                acc += '\t'.repeat(level) + child.querySelector('span').textContent + '\n';
                const sublist = child.querySelector('ul');
                if (sublist) acc += traverseTree(sublist, level + 1);
            }
            return acc;
        }, '');
    };

    const downloadAsTxt = (data) => {
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `category_tree_${Date.now()}.txt`;
        a.click();
    };

    const downloadAsHTML = (data) => {
        const htmlContent = `<!DOCTYPE html>
        <html>
        <head>
            <title>Kateqoriya Ağacı</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                ul { list-style: none; padding-left: 20px; }
                li { margin: 5px 0; }
                ${CONFIG.COLORS.map((color, index) => 
                    `.level-${index} { color: ${color}; }`
                ).join('\n')}
            </style>
        </head>
        <body>
            <ul>${convertToHTML(data)}</ul>
        </body>
        </html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `category_tree_${Date.now()}.html`;
        a.click();
    };

    const generatePDF = (data) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(12);
        let y = 20;
        data.split('\n').forEach(line => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            const level = (line.match(/\t/g) || []).length;
            const name = line.trim();
            doc.setTextColor(...hexToRgb(CONFIG.COLORS[Math.min(level, 7)]));
            doc.text(`${'    '.repeat(level)}• ${name}`, 10, y);
            y += 10;
        });
        doc.save(`category_tree_${Date.now()}.pdf`);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 512000) {
            alert('Maksimum fayl ölçüsü 500KB-dır!');
            return;
        }
        showLoader();
        const reader = new FileReader();
        reader.onload = (e) => {
            rebuildTreeFromText(e.target.result);
            hideLoader();
            saveTreeState();
        };
        reader.readAsText(file);
    };

    const rebuildTreeFromText = (text) => {
        DOM.tree.innerHTML = '';
        let lastNode = null;
        let lastLevel = -1;
        text.split('\n').forEach(line => {
            const level = (line.match(/\t/g) || []).length;
            const name = line.trim();
            if (!name) return;
            if (level === 0) {
                lastNode = createNode(name);
                DOM.tree.appendChild(lastNode);
                lastLevel = 0;
            } else {
                while (lastLevel >= level && lastNode) {
                    lastNode = lastNode.parentElement?.closest('li');
                    lastLevel--;
                }
                if (lastNode) {
                    addNode(lastNode, name);
                    lastLevel = level;
                }
            }
        });
    };

    const initializeSearch = () => {
        const searchInput = DOM.searchInput;
        searchInput.addEventListener('input', debounce((e) => {
            const searchTerm = e.target.value.toLowerCase();
            searchNodes(searchTerm);
        }, 300));
    };

    const searchNodes = (term) => {
        const allNodes = DOM.tree.querySelectorAll('li span');
        allNodes.forEach(node => {
            const text = node.textContent.toLowerCase();
            const li = node.closest('li');
            if (text.includes(term)) {
                li.style.display = '';
                highlightAncestors(li);
            } else {
                li.style.display = 'none';
            }
        });
    };

    const highlightAncestors = (node) => {
        let current = node;
        while (current && current !== DOM.tree) {
            if (current.tagName === 'LI') {
                current.style.display = '';
            }
            current = current.parentElement;
        }
    };

    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const sanitizeInput = (input) => {
        return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    const showLoader = () => {
        DOM.loader.style.display = 'block';
    };

    const hideLoader = () => {
        DOM.loader.style.display = 'none';
    };

    const saveTreeState = () => {
        localStorage.treeData = traverseTree(DOM.tree);
    };

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', TreeManager.init);