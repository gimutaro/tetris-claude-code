const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

const TETROMINOS = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00f0f0'
    },
    O: {
        shape: [[1, 1], [1, 1]],
        color: '#f0f000'
    },
    T: {
        shape: [[0, 1, 0], [1, 1, 1]],
        color: '#a000f0'
    },
    S: {
        shape: [[0, 1, 1], [1, 1, 0]],
        color: '#00f000'
    },
    Z: {
        shape: [[1, 1, 0], [0, 1, 1]],
        color: '#f00000'
    },
    J: {
        shape: [[1, 0, 0], [1, 1, 1]],
        color: '#0000f0'
    },
    L: {
        shape: [[0, 0, 1], [1, 1, 1]],
        color: '#f0a000'
    }
};

class Tetris {
    constructor() {
        this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = 1000;
        this.lastDrop = 0;
        
        this.init();
    }
    
    init() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        this.spawnPiece();
        this.spawnPiece();
        this.draw();
    }
    
    start() {
        this.board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = 1000;
        this.updateScore();
        this.spawnPiece();
        this.spawnPiece();
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameOver) {
            this.paused = !this.paused;
            if (!this.paused) {
                this.gameLoop();
            }
        }
    }
    
    gameLoop() {
        if (this.gameOver || this.paused) return;
        
        const now = Date.now();
        if (now - this.lastDrop > this.dropInterval) {
            this.drop();
            this.lastDrop = now;
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    spawnPiece() {
        const pieces = Object.keys(TETROMINOS);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            this.currentPiece = this.createPiece(randomPiece);
        }
        
        this.nextPiece = this.createPiece(randomPiece);
        
        if (this.collision()) {
            this.gameOver = true;
            alert('Game Over! Score: ' + this.score);
        }
    }
    
    createPiece(type) {
        return {
            type: type,
            shape: TETROMINOS[type].shape,
            color: TETROMINOS[type].color,
            x: Math.floor(COLS / 2) - Math.floor(TETROMINOS[type].shape[0].length / 2),
            y: 0
        };
    }
    
    drop() {
        this.currentPiece.y++;
        if (this.collision()) {
            this.currentPiece.y--;
            this.lockPiece();
            this.clearLines();
            this.spawnPiece();
        }
    }
    
    hardDrop() {
        while (!this.collision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.lockPiece();
        this.clearLines();
        this.spawnPiece();
    }
    
    move(dir) {
        this.currentPiece.x += dir;
        if (this.collision()) {
            this.currentPiece.x -= dir;
        }
    }
    
    rotate() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[row.length - 1 - i])
        ).reverse();
        const previousShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.collision()) {
            this.currentPiece.shape = previousShape;
        }
    }
    
    collision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                        return true;
                    }
                    
                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateScore();
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(ctx, x, y, this.board[y][x]);
                }
            }
        }
        
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(ctx, this.currentPiece.x + x, this.currentPiece.y + y, this.currentPiece.color);
                    }
                }
            }
        }
        
        this.drawGrid();
        this.drawNextPiece();
    }
    
    drawBlock(context, x, y, color) {
        context.fillStyle = color;
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        
        context.fillStyle = 'rgba(255, 255, 255, 0.1)';
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, 3);
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, 3, BLOCK_SIZE - 1);
    }
    
    drawGrid() {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        
        for (let x = 1; x < COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 1; y < ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(canvas.width, y * BLOCK_SIZE);
            ctx.stroke();
        }
    }
    
    drawNextPiece() {
        nextCtx.fillStyle = '#111';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        if (this.nextPiece) {
            const blockSize = 20;
            const offsetX = (nextCanvas.width - this.nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (nextCanvas.height - this.nextPiece.shape.length * blockSize) / 2;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        nextCtx.fillStyle = this.nextPiece.color;
                        nextCtx.fillRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize - 1, blockSize - 1);
                    }
                }
            }
        }
    }
    
    handleKeyPress(e) {
        if (this.gameOver || this.paused) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.move(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.move(1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.drop();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotate();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
        }
    }
}

const game = new Tetris();