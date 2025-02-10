import { PacmanTestSuite } from './pacmanTests.js';

class TestRunner {
    constructor() {
        this.testSuite = new PacmanTestSuite();
        this.resultsElement = document.getElementById('test-results');
        this.logElement = document.getElementById('test-log');
        
        // Override console.log for test logging
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog.apply(console, args);
            this.logToUI(args.join(' '));
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('run-tests').addEventListener('click', () => {
            this.runTests();
        });

        document.getElementById('toggle-results').addEventListener('click', () => {
            this.resultsElement.style.display = 
                this.resultsElement.style.display === 'none' ? 'block' : 'none';
        });
    }

    logToUI(message) {
        const logLine = document.createElement('div');
        logLine.textContent = message;
        if (message.includes('✅')) logLine.classList.add('pass');
        if (message.includes('❌')) logLine.classList.add('fail');
        this.logElement.appendChild(logLine);
        this.logElement.scrollTop = this.logElement.scrollHeight;
    }

    async runTests() {
        this.logElement.innerHTML = '';
        this.resultsElement.innerHTML = '<h2>Running tests...</h2>';
        
        try {
            await this.testSuite.runAllTests();
            this.displayResults();
        } catch (error) {
            console.error('Test error:', error);
            this.resultsElement.innerHTML = `<h2>Test Error</h2><pre>${error.message}</pre>`;
        }
    }

    displayResults() {
        const results = this.testSuite.results;
        let html = '<h2>Test Results</h2>';

        const formatCategory = (category, title) => {
            html += `<h3>${title}</h3><ul>`;
            for (const [test, passed] of Object.entries(results[category])) {
                const status = passed ? '✅ PASS' : '❌ FAIL';
                const className = passed ? 'pass' : 'fail';
                html += `<li class="${className}">${test}: ${status}</li>`;
            }
            html += '</ul>';
        };

        formatCategory('functional', 'Functional Tests');
        formatCategory('performance', 'Performance Tests');
        formatCategory('bonus', 'Bonus Features');

        this.resultsElement.innerHTML = html;
    }
}

// Initialize test runner
window.addEventListener('load', () => {
    window.testRunner = new TestRunner();
});