
document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    const toggleWritingModeBtn = document.getElementById('toggleWritingMode');
    const saveBookmarkBtn = document.getElementById('saveBookmark');

    fetch('content.html')
                .then(response => response.text())
                .then(html => {
                    document.getElementById('content').innerHTML = html;
                })
                .catch(error => console.error('読み込みエラー:', error));

    // 縦書きと横書きの切り替えと設定の保存
    toggleWritingModeBtn.addEventListener('click', () => {
        content.classList.toggle('vertical');
        const mode = content.classList.contains('vertical') ? 'vertical' : 'horizontal';
        localStorage.setItem('writingMode', mode);

        // 縦書きに切り替えた場合、ページの最右上（一番上）にスクロール
        if (mode === 'vertical') {
            window.scrollTo(document.body.scrollWidth, 0);
        } else {
            // 横書きに切り替えた場合、ページの最上部にスクロール
            window.scrollTo(0, 0);
        }

        // しおり情報も更新
        //const scrollY = window.scrollY;
        //localStorage.setItem('bookmark', JSON.stringify({mode, scrollY}));
    });

    // しおり機能
    saveBookmarkBtn.addEventListener('click', () => {
        const mode = content.classList.contains('vertical') ? 'vertical' : 'horizontal';
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        localStorage.setItem('bookmark', JSON.stringify({mode, scrollX, scrollY}));
        showMessage("しおり🔖を挟みました！\n※端末に保存されます");
    });

    function showMessage(message) {
        const messageElement = document.getElementById('bookmarkMessage');
        messageElement.textContent = message; // メッセージ設定
        messageElement.style.display = 'block'; // 表示

        // 数秒後に非表示
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000); // 3000ミリ秒後に非表示
    }

    // しおりから読み込み
    const bookmarkData = JSON.parse(localStorage.getItem('bookmark'));
    if (bookmarkData) {
        if (bookmarkData.mode === 'vertical') {
            content.classList.add('vertical');
        } else {
            content.classList.remove('vertical');
        }
        window.scrollTo(bookmarkData.scrollX, bookmarkData.scrollY);
    }

    // 目次のリンクにスムーズスクロールを適用
    document.querySelectorAll('.toc a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // 行間の調整
    document.getElementById('largeLineHeight').addEventListener('click', () => {
        document.getElementById('content').style.lineHeight = '1.9'; // 行間大
        localStorage.setItem('lineHeight', '1.9'); // 行間設定を保存
    });

    document.getElementById('mediumLineHeight').addEventListener('click', () => {
        document.getElementById('content').style.lineHeight = '1.5'; // 行間中
        localStorage.setItem('lineHeight', '1.5'); // 行間設定を保存
    });

    document.getElementById('smallLineHeight').addEventListener('click', () => {
        document.getElementById('content').style.lineHeight = '1.1'; // 行間小
        localStorage.setItem('lineHeight', '1.1'); // 行間設定を保存
    });

    // 行間の読み込み
    const savedLineHeight = localStorage.getItem('lineHeight');
    if (savedLineHeight) {
        document.getElementById('content').style.lineHeight = savedLineHeight;
    }

    // 縦横表示設定の復元
    const savedMode = localStorage.getItem('writingMode');
    if (savedMode === 'vertical') {
        content.classList.add('vertical');
    } else {
        content.classList.remove('vertical');
    }

    // ヘルプイベント系
    const helpButton = document.getElementById('helpButton');
    const helpOverlay = document.getElementById('helpOverlay');

    // ヘルプボタンのクリックイベント
    helpButton.addEventListener('click', () => {
        helpOverlay.style.display = 'block';
    });

    // オーバーレイの外側をクリックしたときに閉じる
    helpOverlay.addEventListener('click', () => {
        helpOverlay.style.display = 'none';
    });
    
    // 情報ボタン系
    const infoButton = document.getElementById('infoButton');
    const infoOverlay = document.getElementById('infoOverlay');

    // 情報ボタンのクリックイベント
    infoButton.addEventListener('click', () => {
        infoOverlay.style.display = 'block';
    });

    // オーバーレイの外側をクリックしたときに閉じる
    infoOverlay.addEventListener('click', () => {
        infoOverlay.style.display = 'none';
    });

    // カラーテーマ変更用
    document.getElementById('defaultThemeButton').addEventListener('click', () => {
        document.body.className = ''; // 既存のテーマをクリア
    });

    document.getElementById('darkThemeButton').addEventListener('click', () => {
        document.body.className = 'dark-theme'; // ダークテーマを適用
    });

    document.getElementById('lightYellowThemeButton').addEventListener('click', () => {
        document.body.className = 'light-yellow-theme'; // 薄黄色の背景テーマを適用
    });
    
    // フォント切り替えボタン
    const fontChangeButton = document.getElementById('fontChangeButton');
    fontChangeButton.addEventListener('click', () => {
        // フォント切り替え処理
        changeFont();
    });
});

// フォント切り替え処理
function changeFont() {
    const content = document.getElementById('content');
    if (content.classList.contains('font1')) {
        content.classList.remove('font1');
        content.classList.add('font2');
    } else if (content.classList.contains('font2')) {
        content.classList.remove('font2');
        content.classList.add('font3');
    } else if (content.classList.contains('font3')) {
        content.classList.remove('font3');
        content.classList.add('font4');
    } else {
        content.classList.remove('font4');
        content.classList.add('font1');
    }

    // 現在のフォント名を取得して通知
    const currentFontName = getCurrentFontName();
    showFontChangeNotification(`フォントが ${currentFontName} に変更されました`);
}

function getCurrentFontName() {
    const content = document.getElementById('content');
    if (content.classList.contains('font1')) {
        return 'Noto Sans JP';  // または 'font1' の実際のフォント名
    } else if (content.classList.contains('font2')) {
        return 'Sawarabi Mincho';  // または 'font2' の実際のフォント名
    } else if (content.classList.contains('font3')) {
        return 'Kosugi Maru';  // または 'font3' の実際のフォント名
    } else {
        return 'デフォルトのフォント';  // デフォルトのフォント名
    }
}

function showFontChangeNotification(message) {
    const notification = document.getElementById('fontChangeNotification');
    notification.textContent = message;
    notification.style.display = 'block';

    // 数秒後に通知を非表示にする
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000); // 3000ミリ秒後に非表示
}

