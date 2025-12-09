// all_words.js

let wordsData = JSON.parse(localStorage.getItem('wordsData')) || [];

// 渲染单词排行榜
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

// 打开谷歌翻译
function openDefinition(word) {
    const searchUrl = `https://translate.google.com/?sl=auto&tl=zh-CN&text=${encodeURIComponent(word)}`;
    window.open(searchUrl, '_blank');
}

// 渲染所有单词列表 (A-Z 分类)
function renderAllWords() {
    const allWordsArea = document.getElementById('allWordsArea');
    allWordsArea.innerHTML = '';

    if (wordsData.length === 0) {
        const noWords = document.createElement('p');
        noWords.textContent = '还没有添加任何单词。';
        noWords.style.textAlign = 'center';
        noWords.style.padding = '40px';
        noWords.style.color = 'var(--text-secondary)';
        allWordsArea.appendChild(noWords);
        return;
    }

    // 获取所有唯一单词
    const uniqueWordsSet = new Set(wordsData.map(item => item.word));
    const uniqueWordsArray = Array.from(uniqueWordsSet);

    // 更新统计数据
    document.getElementById('totalWords').textContent = wordsData.length;
    document.getElementById('uniqueWords').textContent = uniqueWordsArray.length;

    // 按字母顺序排序
    uniqueWordsArray.sort((a, b) => {
        const wordA = a.toLowerCase();
        const wordB = b.toLowerCase();
        if (wordA < wordB) return -1;
        if (wordA > wordB) return 1;
        return 0;
    });

    // 按首字母分组
    const groupedByLetter = uniqueWordsArray.reduce((acc, word) => {
        const firstLetter = word.charAt(0).toUpperCase();
        if (!acc[firstLetter]) {
            acc[firstLetter] = [];
        }
        acc[firstLetter].push(word);
        return acc;
    }, {});

    // 渲染分组结果
    const sortedLetters = Object.keys(groupedByLetter).sort();
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
            
            // 双击跳转到谷歌翻译
            wordLi.ondblclick = (event) => {
                event.preventDefault();
                openDefinition(word);
            };

            // 单击也可以跳转（可选）
            wordLi.onclick = () => {
                openDefinition(word);
            };

            wordListUl.appendChild(wordLi);
        });
        
        letterGroupDiv.appendChild(wordListUl);
        allWordsArea.appendChild(letterGroupDiv);
    });
}

// 返回日历页面
function goToCalendarPage() {
    window.location.href = 'calendar.html';
}

// 返回主页
function goToHomePage() {
    window.location.href = 'index.html';
}

// 页面加载时执行渲染
document.addEventListener('DOMContentLoaded', () => {
    renderAllWords();
    renderRankingList();
});