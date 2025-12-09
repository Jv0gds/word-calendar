// 从 localStorage 加载单词数据
let wordsData = JSON.parse(localStorage.getItem('wordsData')) || [];

// 辅助函数：获取今天的日期 (YYYY-MM-DD 格式)
function getCurrentISODate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 添加单词到数组并保存到 localStorage
function addWord() {
    const wordInput = document.getElementById('wordInput');
    
    const word = wordInput.value.trim();
    const date = getCurrentISODate();

    if (word === "") {
        alert("请输入单词！");
        return;
    }

    wordsData.push({
        word: word,
        date: date,
        timestamp: new Date().getTime()
    });

    // 保存到 localStorage
    localStorage.setItem('wordsData', JSON.stringify(wordsData));

    // 清空输入框
    wordInput.value = "";
    
    // 更新主页面的显示
    renderMainPageWords();
}

// 在主页面显示所有单词（简单的列表，按最近添加顺序）
function renderMainPageWords() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (wordsData.length === 0) {
        resultsDiv.textContent = '还没有添加任何单词。';
        return;
    }

    const ul = document.createElement('ul');
    const sortedWords = [...wordsData].sort((a, b) => b.timestamp - a.timestamp);

    sortedWords.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.word} (${item.date})`;
        ul.appendChild(li);
    });
    resultsDiv.appendChild(ul);
}

// 跳转到日历页面
function goToCalendarPage() {
    window.location.href = 'calendar.html';
}

// 跳转到所有单词页面
function goToAllWordsPage() {
    window.location.href = 'all_words.html';
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    renderMainPageWords();
});

function handleEnter(event) {
    if (event.key === 'Enter') {
        addWord();
    }
}