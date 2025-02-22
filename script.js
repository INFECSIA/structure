:root {
    --primary-color: #4CAF50;
    --secondary-color: #2196F3;
    --danger-color: #f44336;
    --warning-color: #ff9800;
    --success-color: #8BC34A;
    --info-color: #00BCD4;
    --text-color: #333;
    --text-light: #666;
    --text-lighter: #999;
    --bg-color: #f0f2f5;
    --bg-light: #ffffff;
    --bg-dark: #e0e0e0;
    --border-color: #ddd;
    --border-radius: 8px;
    --shadow: 0 8px 30px rgba(0,0,0,0.12);
    --shadow-light: 0 4px 12px rgba(0,0,0,0.08);
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --font-family: 'Segoe UI', system-ui, sans-serif;
    --font-size-sm: 14px;
    --font-size-md: 16px;
    --font-size-lg: 18px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-family);
    font-size: var(--font-size-md);
    color: var(--text-color);
    background: var(--bg-color);
    line-height: 1.6;
    padding: var(--spacing-xl);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-md);
}

.tree-container {
    background: var(--bg-light);
    border-radius: var(--border-radius);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow);
    position: relative;
}

.export-controls {
    position: absolute;
    top: var(--spacing-md);
    right: var(--spacing-md);
    display: flex;
    gap: var(--spacing-sm);
}

.import-export-btn, .add-root-btn, .action-btn, .modal-btn {
    cursor: pointer;
    transition: all 0.3s;
}

.import-export-btn {
    background: var(--secondary-color);
    color: white;
    border: none;
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
}

.import-export-btn:hover {
    opacity: 0.9;
}

.add-root-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--border-radius);
    margin-bottom: var(--spacing-xl);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.add-root-btn:hover {
    filter: brightness(0.9);
}

.tree {
    list-style: none;
    padding-left: 0;
    min-height: 100px;
}

.tree li {
    position: relative;
    padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 35px;
    margin: var(--spacing-xs) 0;
    background: var(--bg-light);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    cursor: move;
    user-select: none;
    transition: all 0.3s ease;
}

.tree li:hover {
    background: var(--bg-dark);
    border-color: var(--secondary-color);
}

.tree li::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color);
}

.tree > li::before { background: var(--primary-color); }
.tree ul li::before { background: var(--secondary-color); }
.tree ul ul li::before { background: var(--warning-color); }
.tree ul ul ul li::before { background: #9c27b0; }
.tree ul ul ul ul li::before { background: #e91e63; }
.tree ul ul ul ul ul li::before { background: #009688; }
.tree ul ul ul ul ul ul li::before { background: #795548; }

.tree ul {
    padding-left: 30px;
    margin-left: 0;
    border-left: 2px solid var(--border-color);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.tree .expanded {
    max-height: 1000px;
}

.node-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.node-actions {
    display: flex;
    gap: var(--spacing-xs);
}

.action-btn {
    background: none;
    border: none;
    padding: var(--spacing-xs);
    border-radius: 5px;
    color: var(--text-light);
    font-size: var(--font-size-sm);
}

.action-btn:hover {
    background: rgba(0,0,0,0.1);
    color: var(--text-color);
}

.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: var(--bg-light);
    padding: var(--spacing-xl);
    border-radius: var(--border-radius);
    width: 400px;
    max-width: 90%;
    box-shadow: var(--shadow);
}

.modal-input {
    width: 100%;
    padding: var(--spacing-sm);
    margin: var(--spacing-md) 0;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: var(--font-size-md);
}

.modal-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: flex-end;
}

.confirm-btn {
    background: var(--primary-color);
    color: white;
}

.cancel-btn {
    background: var(--danger-color);
    color: white;
}

.modal-btn:hover {
    filter: brightness(0.9);
}

.loading-indicator {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--secondary-color);
    color: white;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: 20px;
    display: none;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { opacity: 0.8; }
    50% { opacity: 1; }
    100% { opacity: 0.8; }
}

@media (max-width: 768px) {
    body {
        padding: var(--spacing-md);
    }
    
    .tree-container {
        padding: var(--spacing-md);
    }

    .export-controls {
        position: static;
        justify-content: flex-end;
        margin-bottom: var(--spacing-md);
    }

    .tree li {
        padding: var(--spacing-xs) var(--spacing-sm) var(--spacing-xs) 30px;
    }
    
    .modal-content {
        width: 90%;
        padding: var(--spacing-md);
    }
}

@media (max-width: 480px) {
    .import-export-btn span {
        display: none;
    }
    
    .node-actions {
        gap: var(--spacing-xs);
    }
    
    .action-btn {
        padding: var(--spacing-xs);
    }
}
