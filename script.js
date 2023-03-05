const boardSize = 16;
const numberMines = 40;

let board = [];
let mineLocations = [];
let gameOver = false;
let gameStart = false;

// Элемент поля с минами
let elemBoard = document.getElementById("board");
elemBoard.addEventListener("mousedown", downClickCellBoard);
window.addEventListener("mouseup", upClickCellBoard);

// Элемент содержащий окно всей игры
let elemFullGame = document.getElementById("minesweeper");
// Убираем выпадение контекстного меню браузера (правая кнопка мыши)
elemFullGame.addEventListener("contextmenu", event => {
    event.preventDefault();
});

// Элемент со смайликом
let elemSmile = document.getElementById("smile");
elemSmile.addEventListener("mousedown", () => {
    elemSmile.className = "smile default-down";
});
elemSmile.addEventListener("mouseup", () => {
    firstRenderBoard();
    clearStopwatch();
    renderCounterMines();
    changeNumber(000, pos3);
    changeNumber(000, pos4);
    changeNumber(000, pos5);
    gameOver = false;
    gameStart = false;
    elemSmile.className = "smile default";
});

// Ищем все элементы содержищие цифры
let pos0 = document.getElementById("pos_0");
let pos1 = document.getElementById("pos_1");
let pos2 = document.getElementById("pos_2");
let pos3 = document.getElementById("pos_3");
let pos4 = document.getElementById("pos_4");
let pos5 = document.getElementById("pos_5");

// Отображаем количество мин в счётчике мин
function renderCounterMines() {
    let countFlag = fractionTime(numberMines);
    changeNumber(countFlag[0], pos0);
    changeNumber(countFlag[1], pos1);
    changeNumber(countFlag[2], pos2);
}
renderCounterMines();

// Инициализируем игровое поле
function initBoard() {
    for (let i = 0; i < boardSize; i++) {
        board[i] = [];
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = {
                isMine: false,
                isFlagged: false,
                isRevealed: false,
                numberMines: 0,
            };
        }
    }
};

// Генерируем мины на игровом поле (рандомно)
function placeMines(event) {
    board[+event.target.dataset.row][event.target.dataset.column].isRevealed = true;
    for (let i = 0; i < numberMines; i++) {
        let row, column;
        do {
            row = Math.floor(Math.random() * boardSize);
            column = Math.floor(Math.random() * boardSize);
        } while (board[row][column].isMine || board[row][column].isRevealed);
        board[row][column].isMine = true;
        mineLocations.push([row, column]);
    }
};

// Считаем количество мин вокруг ячейки (мину в своей ячейке не учитывает)
function countNeighborMines(row, column) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const r = row + i;
            const c = column + j;
            if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) continue;
            if (board[r][c].isMine) count++;
        }
    }
    return count;
};

// Записываем в ячейку количество мин, окружающие её
function countAllNeighborMines() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            board[i][j].numberMines = countNeighborMines(i, j);
        }
    }
};

// Шаблон поля
function markupBoard(array) {
    return array.map((item, row) => {
        return item.map((item, column) => {
            return `<div 
                    class="cell mine_${item.isMine} flag_${item.isFlagged} closed" 
                    data-row=${row}
                    data-column=${column}
                    data-is-revealed=${item.isRevealed}
                    data-number-mines=${item.numberMines}
                    >
                </div>`
        }).join("");
    }).join("");
}

let allCells;
// Отображаем пустое поле
function firstRenderBoard() {
    initBoard();
    elemBoard.innerHTML = markupBoard(board);
    allCells = document.querySelectorAll(".cell");
}
firstRenderBoard();

// Заполняем поле без перерендеринга
function firstClickBoard(event) {
    placeMines(event);
    countAllNeighborMines();
    allCells.forEach(item => {
        let obj = board[item.dataset.row][item.dataset.column];
        item.className = `cell mine_${obj.isMine} flag_${obj.isFlagged} closed`;
        item.dataset.numberMines = obj.numberMines;
    })
    stopwatch();
    gameStart = true;
}

// Обрабатываем нажатие кнопки мыши на поле
function downClickCellBoard(event) {
    event.preventDefault();
    if (gameOver) return;
    if (event.button == 0) {
        if (event.target.dataset.isRevealed === "true"
            && event.target.dataset.numberMines !== "0"
            && !event.target.classList.contains("mine_true")
            && !event.target.classList.contains("flag_true")
            && !event.target.classList.contains("question")) {
            revealHideNeighborCells(event, true, false);
        }
        elemSmile.className = "smile scare";
        elemBoard.addEventListener("mouseover", overClickCellBoard);
        elemBoard.addEventListener("mouseout", outClickCellBoard);
        event.target.classList.remove("closed");
        event.target.classList.add("opened");
    }
}

// Временно отображает и скрывает соседние ячейки при движении по ячейкам содержащие номера
function revealHideNeighborCells(event, toggle, revealing) {
    let countFlag = 0;
    let countQuestion = 0;
    let row = +event.target.dataset.row;
    let column = +event.target.dataset.column;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const r = row + i;
            const c = column + j;
            if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) continue;
            let localElem = document.querySelector(`[data-row="${r}"][data-column="${c}"]`);
            if (localElem.classList.contains("flag_true")) countFlag++;
            if (localElem.classList.contains("question")) countQuestion++;
            if (localElem.dataset.isRevealed === "false") {
                if (!revealing) {
                    if (toggle) {
                        if (localElem.classList.contains("flag_true")) continue;
                        if (localElem.classList.contains("question")) continue;
                        localElem.classList.remove("closed");
                        localElem.classList.add("opened");
                    } else {
                        if (localElem.classList.contains("flag_true")) continue;
                        if (localElem.classList.contains("question")) continue;
                        localElem.classList.remove("opened");
                        localElem.classList.add("closed");
                    }
                } else {
                    if (localElem.classList.contains("flag_true")) continue;
                    if (localElem.classList.contains("question")) continue;
                    revealCell(localElem);
                }
            };
        }
    }
    return [countFlag, countQuestion];
}

// Обрабатываем отжатие кнопки мыши на поле
function upClickCellBoard(event) {
    let countFlag, countQuestion;
    
    if (gameOver) return;
    elemSmile.className = "smile default";
    elemBoard.removeEventListener("mouseover", overClickCellBoard);
    elemBoard.removeEventListener("mouseout", outClickCellBoard);
    if (event.target.classList.contains("cell")) {
        if (!gameStart) firstClickBoard(event);
        if (event.target.classList.contains("flag_true") && event.button == 0) return;
        if (event.target.classList.contains("question") && event.button == 0) return;
        if (event.target.dataset.isRevealed === "true"
            && event.target.dataset.numberMines !== "0"
            && !event.target.classList.contains("mine_true")
            && !event.target.classList.contains("flag_true")
            && !event.target.classList.contains("question")) {
            [countFlag, countQuestion] = revealHideNeighborCells(event, false);
        }
        if (+event.target.dataset.numberMines == countFlag && countQuestion == 0) {
            revealHideNeighborCells(event, false, true)
        }
        if (event.button == 0) revealCell(event.target);
        if (!event.target.classList.contains("opened") && event.button == 2) flaggedCell(event);
    }
}
// Обрабатываем движение мыши на поле - над ячейкой
function overClickCellBoard(event) {
    event.target.classList.remove("closed");
    event.target.classList.add("opened");
    if (event.target.dataset.isRevealed === "true"
        && event.target.dataset.numberMines !== "0"
        && !event.target.classList.contains("mine_true")
        && !event.target.classList.contains("flag_true")
        && !event.target.classList.contains("question")) {
        revealHideNeighborCells(event, true, false);
    }

}
// Обрабатываем движение мыши на поле - уход с ячейки
function outClickCellBoard(event) {
    if (event.target.dataset.isRevealed === "false") {
        event.target.classList.remove("opened");
        event.target.classList.add("closed");
    }
    if (event.target.dataset.isRevealed === "true"
        && event.target.dataset.numberMines !== "0"
        && !event.target.classList.contains("mine_true")
        && !event.target.classList.contains("flag_true")
        && !event.target.classList.contains("question")) {
        revealHideNeighborCells(event, false, false);
    }
}

// Обрабатываем правый клик мыши (установка флага и вопросительного знака)
function flaggedCell(event) {
    if (event.target.classList.contains("closed")) {
        event.target.classList.remove("closed");
        event.target.classList.remove("flag_false");
        event.target.classList.add("flag_true");
        countFlaggedCells();
        return
    };
    if (event.target.classList.contains("flag_true")) {
        event.target.classList.remove("flag_true");
        event.target.classList.add("flag_false");
        event.target.classList.add("question");
        countFlaggedCells();
        return
    };
    if (event.target.classList.contains("question")) {
        event.target.classList.remove("question");
        event.target.classList.add("closed");
        return
    };
}

// Обрабатываем левый клик мыши
function revealCell(elem) {
    if (elem.classList.contains("cell")) {
        if (!gameOver && elem.classList.contains("mine_true")) {
            gameOver = true;
            elem.classList.add("min_explosion");
            revealAllCellWithMine();
            clearStopwatch();
            return;
        }

        elem.classList.remove("closed");
        elem.dataset.isRevealed = true;

        if (elem.dataset.numberMines === "0") cascadingRevealCells(elem);

        function setNumberCellBackground(elem, number) {
            if (number === "0") {
                elem.classList.add("opened");
                return;
            }
            elem.classList.add(`number_mines_${number}`);
        }
        setNumberCellBackground(elem, elem.dataset.numberMines);
    }
    gameWin();
}
// Показываем карту мин (игра проиграна)
function revealAllCellWithMine() {
    cellsWithMine = document.querySelectorAll(".mine_true, .flag_true");
    cellsWithMine.forEach(item => {
        if (item.classList.contains("mine_true") && item.classList.contains("flag_true")) return;
        if (item.classList.contains("mine_true") && item.classList.contains("flag_false") && !item.classList.contains("min_explosion")) {
            item.classList.remove("question");
            item.classList.add("min_reveal");
        }
        if (item.classList.contains("mine_false") && item.classList.contains("flag_true")) {
            item.classList.remove("flag_true");
            item.classList.add("min_error");
        }
    });
    elemSmile.className = "smile lose";
}

// Рекурсивное открытие соседних ячеек при нажатии на пустую ячейку (без мин и цифр)
function cascadingRevealCells(elem) {
    // if (elem.classList.contains("mine_true")) return;
    // if (elem.dataset.numberMines !== "0") return;
    let row = +elem.dataset.row;
    let column = +elem.dataset.column;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const r = row + i;
            const c = column + j;
            if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) continue;
            if (board[r][c].isMine === true) return;
            if (board[r][c].numberMines !== 0) {
                if (board[r][c].isRevealed) continue;
                board[r][c].isRevealed = true;
                let elem = document.querySelector(`[data-row="${r}"][data-column="${c}"]`);
                elem.dataset.isRevealed = true;
                elem.classList.remove("closed");
                elem.classList.add(`number_mines_${elem.dataset.numberMines}`);
                continue;
            };
            if (board[r][c].numberMines == 0) {
                if (board[r][c].isRevealed) continue;
                board[r][c].isRevealed = true;
                let elem = document.querySelector(`[data-row="${r}"][data-column="${c}"]`);
                elem.dataset.isRevealed = true;
                elem.classList.remove("closed");
                elem.classList.add("opened");
                cascadingRevealCells(elem);
            }
        }
    }
}

function gameWin() {
    // let countClosedCells = document.querySelectorAll(".closed").length;
    let countRevealedCells = document.querySelectorAll('[data-is-revealed="true"]').length;
    if (allCells.length - countRevealedCells == numberMines) {
        gameOver = true;
        clearStopwatch();
        elemSmile.className = "smile win";
    } else {
        return
    }
}

// Обновляем счётчик мин
function countFlaggedCells() {
    cellsWithFlag = document.querySelectorAll(".flag_true").length;
    let countFlag = fractionTime(numberMines - cellsWithFlag);
    changeNumber(countFlag[0], pos0);
    changeNumber(countFlag[1], pos1);
    changeNumber(countFlag[2], pos2);
}

// Запускаем таймер
let timer;
function stopwatch() {
    let currentTime = 0;

    function start() {
        if (currentTime == 998) {
            clearInterval(timer);
        }
        currentTime++;
        let time = fractionTime(currentTime);

        changeNumber(time[0], pos3);
        changeNumber(time[1], pos4);
        changeNumber(time[2], pos5);
    }
    timer = setInterval(start, 1000);
}

// Останавливаем таймер
function clearStopwatch() {
    clearInterval(timer);
}

// Преобразуем значение таймера в строку с 3 символами
function fractionTime(value) {
    let stringValue;
    if (value < 10 && value >= 0) {
        stringValue = "00" + value;
    } else if (value > 9 && value < 100) {
        stringValue = "0" + value;
    } else if (value >= 100) {
        stringValue = String(value);
    } else if (value < 0 && value >= -9) {
        stringValue = "0" + value;
    } else if (value < -9 && value >= -99) {
        stringValue = String(value);
    } else if (value < -99) {
        stringValue = "-99";
    }
    return stringValue;
}

// Меняем класс элемента с цифрой (счётчик мин и таймер)
function changeNumber(number, elem) {
    elem.className = `number num${number}`
}