let boardRow = 16;
let boardColumn = 16;

let numberMines = 40;

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
elemSmile.addEventListener("mouseup", reloadGame);

// Ищем все элементы содержищие цифры
let pos0 = document.getElementById("pos_0");
let pos1 = document.getElementById("pos_1");
let pos2 = document.getElementById("pos_2");
let pos3 = document.getElementById("pos_3");
let pos4 = document.getElementById("pos_4");
let pos5 = document.getElementById("pos_5");

//Элемент с радио кнопками
let radioBtns = document.querySelector(".difficulty");
console.log(radioBtns)
radioBtns.addEventListener("change", (event) => {
    if (event.target.name === "difficulty") {
        changeDifficulty(event.target.value);
    }
});

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
    board = [];
    for (let i = 0; i < boardRow; i++) {
        board[i] = [];
        for (let j = 0; j < boardColumn; j++) {
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
            row = Math.floor(Math.random() * boardRow);
            column = Math.floor(Math.random() * boardColumn);
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
            if (r < 0 || r >= boardRow || c < 0 || c >= boardColumn) continue;
            if (board[r][c].isMine) count++;
        }
    }
    return count;
};

// Записываем в ячейку количество мин, окружающие её
function countAllNeighborMines() {
    for (let i = 0; i < boardRow; i++) {
        for (let j = 0; j < boardColumn; j++) {
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
    radioBtns.classList.add("disable");
}

function reloadGame() {
    firstRenderBoard();
    clearStopwatch();
    renderCounterMines();
    changeNumber(000, pos3);
    changeNumber(000, pos4);
    changeNumber(000, pos5);
    gameOver = false;
    gameStart = false;
    elemSmile.className = "smile default";
    radioBtns.classList.remove("disable");
}

let leftClick, rightClick;
// Обрабатываем нажатие кнопки мыши на поле
function downClickCellBoard(event) {
    event.preventDefault();
    if (gameOver) return;
    if (event.target.classList.contains("flag_true")) return;
    if (event.button == 2) rightClick = true;
    if (event.button == 0) {
        elemSmile.className = "smile scare";
        if (event.target.dataset.isRevealed === "true"
            && event.target.dataset.numberMines !== "0"
            && !event.target.classList.contains("mine_true")
            && !event.target.classList.contains("flag_true")
            && !event.target.classList.contains("question")) {
            leftClick = true;
            revealHideNeighborCells(event, true, false);
        }
        elemBoard.addEventListener("mouseover", overClickCellBoard);
        elemBoard.addEventListener("mouseout", outClickCellBoard);
        if (event.target.classList.contains("question")) {
            event.target.classList.remove("question");
            event.target.classList.add("question-down");
            return;
        }
        event.target.classList.remove("closed");
        event.target.classList.add("opened");
    }
}

// Обрабатываем отжатие кнопки мыши на поле
function upClickCellBoard(event) {
    let countFlag;
    if (gameOver) return;
    elemSmile.className = "smile default";
    elemBoard.removeEventListener("mouseover", overClickCellBoard);
    elemBoard.removeEventListener("mouseout", outClickCellBoard);
    if (event.target.classList.contains("cell")) {
        // Первое нажатие на поле
        if (!gameStart) firstClickBoard(event);
        // Нажатие на ячейку с флагом левой кнопкой
        if (event.target.classList.contains("flag_true") && event.button == 0) return;
        // Нажатие на открытую ячейку с цифрой левой кнопкой мыши
        if (event.target.dataset.isRevealed === "true"
            && event.target.dataset.numberMines !== "0"
            && !event.target.classList.contains("mine_true")
            && !event.target.classList.contains("flag_true")
            && !event.target.classList.contains("question")) {
            countFlag = revealHideNeighborCells(event, false);
        }
        // Нажатие на открытую ячейку с цифрой левой и правой кнопкой мыши
        if (+event.target.dataset.numberMines == countFlag && leftClick && rightClick) {
            leftClick = false;
            rightClick = false;
            revealHideNeighborCells(event, false, true)
            return;
        }
        leftClick = false;
        rightClick = false;
        // Открытие ячейки
        if (event.button == 0) revealCell(event.target);
        // Нажатие правой кнопкой мыши на закрытую ячейку
        if (event.target.dataset.isRevealed === "false" && event.button == 2) flaggedCell(event);
    }
}
// Обрабатываем движение мыши на поле - над ячейкой
function overClickCellBoard(event) {
    // Если вопрос
    if (event.target.classList.contains("question")) {
        event.target.classList.remove("question");
        event.target.classList.add("question-down");
        return;
    }
    // Если приоткрыт
    if (event.target.dataset.isRevealed === "false" && !event.target.classList.contains("flag_true")) {
        event.target.classList.remove("closed");
        event.target.classList.add("opened");
        return;
    }
    // Если открыт и там цифра
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
    // Если вопрос
    if (event.target.classList.contains("question-down")) {
        event.target.classList.remove("question-down");
        event.target.classList.add("question");
        return;
    }
    // Если просто закрыт (приоткрытие)
    if (event.target.dataset.isRevealed === "false" && !event.target.classList.contains("flag_true")) {
        event.target.classList.remove("opened");
        event.target.classList.add("closed");
        return;
    }
    // Если открыт и там цифра
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
        return;
    };
    if (event.target.classList.contains("flag_true")) {
        event.target.classList.remove("flag_true");
        event.target.classList.add("flag_false");
        event.target.classList.add("question");
        countFlaggedCells();
        return;
    };
    if (event.target.classList.contains("question")) {
        event.target.classList.remove("question");
        event.target.classList.add("closed");
        return;
    };
}

// Обрабатываем левый клик мыши
function revealCell(elem) {
    if (elem.classList.contains("cell")) {
        //Клик по мине
        if (!gameOver && elem.classList.contains("mine_true")) {
            gameOver = true;
            elem.classList.remove("question-down");
            elem.classList.add("min_explosion");
            revealAllCellWithMine();
            clearStopwatch();
            return;
        }
        // Клик не по мине
        elem.classList.remove("closed");
        elem.dataset.isRevealed = true;
        // Без цифр - запускается рекурсия
        if (elem.dataset.numberMines === "0") {
            elem.classList.add("opened");
            cascadeRevealingCells(elem);
        }
        // С цифрой - просто открываем
        if (elem.dataset.numberMines !== "0") {
            elem.classList.remove("opened");
            elem.classList.remove("question-down");
            elem.classList.add(`number_mines_${elem.dataset.numberMines}`);
        }
    }
    gameWin();
}

// Временно отображает и скрывает соседние ячейки при движении по ячейкам содержащие номера
function revealHideNeighborCells(event, toggle, revealing) {
    let countFlag = 0;
    let row = +event.target.dataset.row;
    let column = +event.target.dataset.column;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const r = row + i;
            const c = column + j;
            if (r < 0 || r >= boardRow || c < 0 || c >= boardColumn) continue;
            let localElem = document.querySelector(`[data-row="${r}"][data-column="${c}"]`);
            if (localElem.classList.contains("flag_true")) countFlag++;
            if (localElem.dataset.isRevealed === "false") {
                if (!revealing) {
                    if (toggle) {
                        if (localElem.classList.contains("flag_true")) continue;
                        if (localElem.classList.contains("question")) {
                            localElem.classList.remove("question");
                            localElem.classList.add("question-down");
                            continue;
                        };
                        localElem.classList.remove("closed");
                        localElem.classList.add("opened");
                    } else {
                        if (localElem.classList.contains("flag_true")) continue;
                        if (localElem.classList.contains("question-down")) {
                            localElem.classList.remove("question-down");
                            localElem.classList.add("question");
                            continue;
                        }
                        localElem.classList.remove("opened");
                        localElem.classList.add("closed");
                    }
                } else {
                    if (localElem.classList.contains("flag_true")) continue;
                    revealCell(localElem);
                }
            };
        }
    }
    return countFlag;
}

// Рекурсивное открытие соседних ячеек при нажатии на пустую ячейку (без мин и цифр)
function cascadeRevealingCells(elem) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const r = +elem.dataset.row + i;
            const c = +elem.dataset.column + j;
            if (r < 0 || r >= boardRow || c < 0 || c >= boardColumn) continue;
            if (board[r][c].isMine === true) return;
            if (board[r][c].isRevealed) continue;
            let newElem = document.querySelector(`[data-row="${r}"][data-column="${c}"]`);
            board[r][c].isRevealed = true;
            newElem.dataset.isRevealed = true;
            newElem.classList.remove("closed");
            newElem.classList.remove("question");
            if (board[r][c].numberMines !== 0) {
                newElem.classList.add(`number_mines_${newElem.dataset.numberMines}`);
                continue;
            };
            if (board[r][c].numberMines == 0) {
                newElem.classList.add("opened");
                cascadeRevealingCells(newElem);
            }
        }
    }
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
    gameStart = false;
    radioBtns.classList.remove("disable");
}

// Сравниваем количество закрытых ячеек с количеством мин (победа в игре)
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

//Меняем сложность игры
function changeDifficulty(value) {
    switch (value) {
        case "beginner":
            boardRow = 10;
            boardColumn = 10;
            numberMines = 10;
            elemBoard.className = "beginner";
            break;
        case "amateur":
            boardRow = 16;
            boardColumn = 16;
            numberMines = 40;
            elemBoard.className = "amateur";
            break;
        case "professional":
            boardRow = 16;
            boardColumn = 30;
            numberMines = 99;
            elemBoard.className = "professional";
            break;
    }
    reloadGame();
}