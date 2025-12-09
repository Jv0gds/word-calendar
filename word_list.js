// word_list.js

let wordsData = JSON.parse(localStorage.getItem('wordsData')) || [];
let selectedTimestamps = [];

function getTargetDateFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('date');
}

function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function selectWord(timestamp, wordElement, isMultiSelect) {
    const index = selectedTimestamps.indexOf(timestamp);
    const allWordElements = document.querySelectorAll('#wordDetailsArea .word-list li');
    
    if (isMultiSelect) {
        if (index > -1) {
            selectedTimestamps.splice(index, 1);
            wordElement.classList.remove('selected');
        } else {
            selectedTimestamps.push(timestamp);
            wordElement.classList.add('selected');
        }
    } else {
        const isCurrentlySelected = selectedTimestamps.length === 1 && index > -1;

        allWordElements.forEach(li => {
            li.classList.remove('selected');
        });
        
        selectedTimestamps = [];
        
        if (!isCurrentlySelected) {
            selectedTimestamps.push(timestamp);
            wordElement.classList.add('selected');
        }
    }
    
    updateDeleteButtonText();
}

function updateDeleteButtonText() {
    const deleteBtn = document.querySelector('.delete-fixed-btn');
    if (deleteBtn) {
        const count = selectedTimestamps.length;
        deleteBtn.textContent = count > 0 ? `删除选中 (${count}) 🗑️` : '删除选中 🗑️';
    }
}

function showCustomConfirm(message, callback) {
    const modal = document.getElementById('customConfirmModal');
    const msgElement = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    msgElement.textContent = message;
    modal.classList.add('visible');

    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    confirmBtn.onclick = () => {
        modal.classList.remove('visible');
        callback(true);
    };

    cancelBtn.onclick = () => {
        modal.classList.remove('visible');
        callback(false);
    };
}

function triggerDeletion() {
    if (selectedTimestamps.length === 0) {
        alert("请先点击选择至少一个单词，然后才能进行删除操作！");
        return;
    }
    
    const count = selectedTimestamps.length;
    const selectedWord = wordsData.find(item => item.timestamp === selectedTimestamps[0]);
    const wordText = selectedWord && count === 1 ? `单词："${selectedWord.word}"` : `${count} 个单词`;
    const message = `确定要删除选中的 ${wordText} 吗？`;

    showCustomConfirm(message, (isConfirmed) => {
        if (!isConfirmed) {
            return;
        }

        wordsData = wordsData.filter(item => !selectedTimestamps.includes(item.timestamp));
        localStorage.setItem('wordsData', JSON.stringify(wordsData));
        selectedTimestamps = [];
        
        setTimeout(() => {
            renderWordList();
            renderRankingList();
            updateDeleteButtonText();
        }, 0);
    });
}

function renderRankingList() {
    const rankingListUl = document.getElementById('rankingList');
    rankingListUl.innerHTML = '';

    const wordCounts = wordsData.reduce((acc, item) => {
        const word = item.word;
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {});

    const sortedRanking = Object.entries(wordCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 15);

    sortedRanking.forEach(([word, count], index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${index + 1}. ${word}</span>
            <span>${count} 次</span>
        `;
        rankingListUl.appendChild(li);
    });
}

function openDefinition(word) {
    const searchUrl = `https://translate.google.com/?sl=auto&tl=zh-CN&text=${encodeURIComponent(word)}`;
    window.open(searchUrl, '_blank');
}

function renderWordList() {
    const targetDate = getTargetDateFromURL();
    const listHeader = document.getElementById('listHeader');
    const wordDetailsArea = document.getElementById('wordDetailsArea');
    wordDetailsArea.innerHTML = '';
    selectedTimestamps = [];

    if (!targetDate) {
        listHeader.textContent = '❌ 错误：未指定日期。';
        return;
    }

    listHeader.textContent = `📅 ${targetDate} 的单词列表 (A-Z)`;

    const wordsForThisDate = wordsData.filter(item => item.date === targetDate);

    if (wordsForThisDate.length === 0) {
        const noWords = document.createElement('p');
        noWords.textContent = '这一天没有添加任何单词。';
        noWords.style.textAlign = 'center';
        wordDetailsArea.appendChild(noWords);
        return;
    }

    wordsForThisDate.sort((a, b) => {
        const wordA = a.word.toLowerCase();
        const wordB = b.word.toLowerCase();
        if (wordA < wordB) return -1;
        if (wordA > wordB) return 1;
        return 0;
    });

    const groupedByLetter = wordsForThisDate.reduce((acc, currentItem) => {
        const firstLetter = currentItem.word.charAt(0).toUpperCase();
        if (!acc[firstLetter]) {
            acc[firstLetter] = [];
        }
        acc[firstLetter].push(currentItem);
        return acc;
    }, {});

    const sortedLetters = Object.keys(groupedByLetter).sort();
    sortedLetters.forEach(letter => {
        const letterGroupDiv = document.createElement('div');
        letterGroupDiv.className = 'letter-group';
        
        const letterHeader = document.createElement('h4');
        letterHeader.textContent = `首字母: ${letter}`;
        letterGroupDiv.appendChild(letterHeader);

        const wordListUl = document.createElement('ul');
        wordListUl.className = 'word-list';
        
        groupedByLetter[letter].forEach(item => {
            const wordLi = document.createElement('li');
            wordLi.textContent = item.word;
            
            wordLi.onclick = (event) => selectWord(item.timestamp, wordLi, event.ctrlKey || event.metaKey);
            
            wordLi.ondblclick = (event) => {
                event.preventDefault();
                openDefinition(item.word);
            };

            wordListUl.appendChild(wordLi);
        });
        
        letterGroupDiv.appendChild(wordListUl);
        wordDetailsArea.appendChild(letterGroupDiv);
    });
}

function goToCalendarPage() {
    window.location.href = 'calendar.html';
}

function goToHomePage() {
    window.location.href = 'index.html';
}

// 跳转到所有单词页面
function goToAllWordsPage() {
    window.location.href = 'all_words.html';
}

document.addEventListener('DOMContentLoaded', () => {
    renderWordList();
    renderRankingList();
    updateDeleteButtonText();
});


// ----------------------------------------------------
// 触发删除操作 (使用自定义模态框)
// ----------------------------------------------------
function triggerDeletion() {
    if (selectedTimestamps.length === 0) {
        alert("请先点击选择至少一个单词，然后才能进行删除操作！");
        return;
    }
    
    const count = selectedTimestamps.length;
    
    const selectedWord = wordsData.find(item => item.timestamp === selectedTimestamps[0]);
    const wordText = selectedWord && count === 1 ? `单词：“${selectedWord.word}”` : `${count} 个单词`;
    
    const message = `确定要删除选中的 ${wordText} 吗？`;

    // 调用自定义模态框，并通过回调函数处理结果
    showCustomConfirm(message, (isConfirmed) => {
        if (!isConfirmed) {
            // 用户点击了取消
            return;
        }

        // --- 异步执行删除和渲染 ---
        
        // 1. 执行删除 (同步操作)
        wordsData = wordsData.filter(item => !selectedTimestamps.includes(item.timestamp));
        localStorage.setItem('wordsData', JSON.stringify(wordsData));
        
        // 2. 重置选中状态 (同步操作)
        selectedTimestamps = [];
        
        // 3. 将高开销的渲染操作推入异步队列
        // 因为模态框是非阻塞的，这里使用 setTimeout(0) 已经是最佳实践，
        // 确保在主线程执行渲染前，所有状态更新和用户交互都已完成。
        setTimeout(() => {
            renderWordList();
            renderRankingList();
            updateDeleteButtonText();
        }, 0); 
    });
}
// ⚠️ 注意：HTML 中的 onclick 属性现在应该直接调用这个 triggerDeletion() 函数。


// ----------------------------------------------------
// 渲染单词排行榜 (保留原样)
// ----------------------------------------------------
function renderRankingList() {
    const rankingListUl = document.getElementById('rankingList');
    rankingListUl.innerHTML = '';

    const wordCounts = wordsData.reduce((acc, item) => {
        const word = item.word;
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {});

    const sortedRanking = Object.entries(wordCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 15); 

    sortedRanking.forEach(([word, count], index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${index + 1}. ${word}</span>
            <span>${count} 次</span>
        `;
        rankingListUl.appendChild(li);
    });
}


// ----------------------------------------------------
// 打开单词详细释义页面 (保留原样)
// ----------------------------------------------------
function openDefinition(word) {
    const searchUrl = `https://translate.google.com/?sl=auto&tl=zh-CN&text=${encodeURIComponent(word)}`;
    window.open(searchUrl, '_blank');
}


// ----------------------------------------------------
// 渲染列表逻辑 (修改：清空选中状态，绑定事件)
// ----------------------------------------------------
function renderWordList() {
    const targetDate = getTargetDateFromURL();
    const listHeader = document.getElementById('listHeader');
    const wordDetailsArea = document.getElementById('wordDetailsArea');
    wordDetailsArea.innerHTML = ''; 
    
    // 渲染时清空选中状态
    selectedTimestamps = []; 

    // ... (其他逻辑保持不变)

    if (!targetDate) {
        listHeader.textContent = '❌ 错误：未指定日期。';
        return;
    }

    listHeader.textContent = `📅 ${targetDate} 的单词列表 (A-Z)`;

    const wordsForThisDate = wordsData.filter(item => item.date === targetDate);

    if (wordsForThisDate.length === 0) {
        const noWords = document.createElement('p');
        noWords.textContent = '这一天没有添加任何单词。';
        noWords.style.textAlign = 'center';
        wordDetailsArea.appendChild(noWords);
        return;
    }

    wordsForThisDate.sort((a, b) => {
        const wordA = a.word.toLowerCase();
        const wordB = b.word.toLowerCase();
        if (wordA < wordB) return -1;
        if (wordA > wordB) return 1;
        return 0;
    });

    const groupedByLetter = wordsForThisDate.reduce((acc, currentItem) => {
        const firstLetter = currentItem.word.charAt(0).toUpperCase();
        if (!acc[firstLetter]) {
            acc[firstLetter] = [];
        }
        acc[firstLetter].push(currentItem);
        return acc;
    }, {});

    const sortedLetters = Object.keys(groupedByLetter).sort(); 
    sortedLetters.forEach(letter => {
        const letterGroupDiv = document.createElement('div');
        letterGroupDiv.className = 'letter-group';
        
        const letterHeader = document.createElement('h4');
        letterHeader.textContent = `首字母: ${letter}`;
        letterGroupDiv.appendChild(letterHeader);

        const wordListUl = document.createElement('ul');
        wordListUl.className = 'word-list';
        
        groupedByLetter[letter].forEach(item => {
            const wordLi = document.createElement('li');
            wordLi.textContent = item.word;
            
            // 关键修改：绑定单词点击事件，判断是否多选
            wordLi.onclick = (event) => selectWord(item.timestamp, wordLi, event.ctrlKey || event.metaKey);
            
            // 双击用于跳转到释义页面 (新增功能)
            wordLi.ondblclick = (event) => {
                event.preventDefault(); 
                openDefinition(item.word);
            };

            wordListUl.appendChild(wordLi);
        });
        
        letterGroupDiv.appendChild(wordListUl);
        wordDetailsArea.appendChild(letterGroupDiv);
    });
}

// 返回日历页面 (保持不变)
function goToCalendarPage() {
    window.location.href = 'calendar.html';
}

// 返回主页 (保持不变)
function goToHomePage() {
    window.location.href = 'index.html';
}

// 页面加载时执行渲染
document.addEventListener('DOMContentLoaded', () => {
    renderWordList();
    renderRankingList(); 
    updateDeleteButtonText(); // 确保加载时更新按钮文本
});