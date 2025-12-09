// 从 localStorage 加载单词数据
const wordsData = JSON.parse(localStorage.getItem('wordsData')) || [];

let currentYear, currentMonth; // 当前显示的年份和月份

// 获取单词数量的映射
function getWordCountsByDate() {
    const counts = {};
    wordsData.forEach(item => {
        counts[item.date] = (counts[item.date] || 0) + 1;
    });
    return counts;
}

// 根据单词数量获取颜色级别
function getColorLevel(count) {
    if (count === 0) return 'level-0';
    if (count <= 1) return 'level-1';
    if (count <= 3) return 'level-2';
    if (count <= 6) return 'level-3';
    if (count <= 10) return 'level-4';
    if (count <= 15) return 'level-5';
    if (count <= 20) return 'level-6';
    if (count <= 25) return 'level-7';
    return 'level-8'; // 超过25个单词
}

// 渲染日历
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = ''; // 清空日历

    const currentMonthYear = document.getElementById('currentMonthYear');
    currentMonthYear.textContent = `${currentYear}年 ${currentMonth + 1}月`;

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const numDays = lastDayOfMonth.getDate();
    const startWeekday = firstDayOfMonth.getDay(); // 0-周日, 1-周一...

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const weekdayDiv = document.createElement('div');
        weekdayDiv.className = 'calendar-weekday';
        weekdayDiv.textContent = day;
        calendarGrid.appendChild(weekdayDiv);
    });

    // 填充上月空白
    for (let i = 0; i < startWeekday; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }

    const today = new Date();
    const todayISO = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const wordCounts = getWordCountsByDate();

    // 填充本月日期
    for (let day = 1; day <= numDays; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isoDate = date.toISOString().split('T')[0]; // "YYYY-MM-DD"
        const count = wordCounts[isoDate] || 0;
        const colorLevelClass = getColorLevel(count);

        const dayDiv = document.createElement('div');
        dayDiv.className = `calendar-day ${colorLevelClass}`;
        dayDiv.dataset.date = isoDate; // 存储完整日期字符串

        if (isoDate === todayISO) {
            dayDiv.classList.add('today');
        }

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.className = 'day-number';
        dayNumberSpan.textContent = day;
        dayDiv.appendChild(dayNumberSpan);

        if (count > 0) {
            const wordCountSpan = document.createElement('span');
            wordCountSpan.className = 'word-count';
            wordCountSpan.textContent = count;
            dayDiv.appendChild(wordCountSpan);
        }

        dayDiv.addEventListener('click', () => showWordsForDate(isoDate));
        calendarGrid.appendChild(dayDiv);
    }

    // 隐藏单词详情区域
    document.getElementById('wordDetails').classList.remove('active');
}

// 改变月份
function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

// 显示某个日期的单词详情
function showWordsForDate(date) {
    const wordDetailsDiv = document.getElementById('wordDetails');
    wordDetailsDiv.innerHTML = ''; // 清空内容
    wordDetailsDiv.classList.add('active'); // 显示

    const wordsForThisDate = wordsData.filter(item => item.date === date);

    const detailHeader = document.createElement('h3');
    detailHeader.textContent = `📅 ${date} 的单词`;
    wordDetailsDiv.appendChild(detailHeader);

    if (wordsForThisDate.length === 0) {
        const noWords = document.createElement('p');
        noWords.textContent = '这一天没有添加任何单词。';
        noWords.style.textAlign = 'center';
        wordDetailsDiv.appendChild(noWords);
        return;
    }

    // 按字母排序
    wordsForThisDate.sort((a, b) => {
        const wordA = a.word.toLowerCase();
        const wordB = b.word.toLowerCase();
        if (wordA < wordB) return -1;
        if (wordA > wordB) return 1;
        return 0;
    });

    // 按首字母分组
    const groupedByLetter = wordsForThisDate.reduce((acc, currentItem) => {
        const firstLetter = currentItem.word.charAt(0).toUpperCase();
        if (!acc[firstLetter]) {
            acc[firstLetter] = [];
        }
        acc[firstLetter].push(currentItem.word);
        return acc;
    }, {});

    // 渲染分组结果
    const sortedLetters = Object.keys(groupedByLetter).sort(); // 确保 A-Z 顺序
    sortedLetters.forEach(letter => {
        const letterGroupDiv = document.createElement('div');
        letterGroupDiv.className = 'letter-group';
        
        const letterHeader = document.createElement('h4');
        letterHeader.textContent = `首字母: ${letter}`;
        letterGroupDiv.appendChild(letterHeader);

        const wordListUl = document.createElement('ul');
        wordListUl.className = 'word-list';
        groupedByLetter[letter].forEach(word => {
            const wordLi = document.createElement('li');
            wordLi.textContent = word;
            wordListUl.appendChild(wordLi);
        });
        letterGroupDiv.appendChild(wordListUl);
        wordDetailsDiv.appendChild(letterGroupDiv);
    });
}

// 返回主页
function goToHomePage() {
    window.location.href = 'index.html';
}

// ... (其他函数，如 getWordCountsByDate, getColorLevel, renderCalendar 等保持不变)

// 关键修改：不再在日历页面显示单词，而是跳转到第三页
function showWordsForDate(date) {
    // 隐藏单词详情区域（因为我们不再在这里显示）
    document.getElementById('wordDetails').classList.remove('active'); 

    // 使用 URLSearchParams 将日期作为查询参数传递给第三页
    // 格式：word_list.html?date=YYYY-MM-DD
    window.location.href = `word_list.html?date=${date}`;
}

// ... (changeMonth, goToHomePage, 初始化逻辑保持不变)
// 页面加载时初始化日历
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth(); // 0-11
    renderCalendar();
});