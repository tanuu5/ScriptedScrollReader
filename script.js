document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    const toggleWritingModeBtn = document.getElementById('toggleWritingMode');
    const saveBookmarkBtn = document.getElementById('saveBookmark');
    const fontChangeBtn = document.getElementById('fontChangeButton');
    const fontNotification = document.getElementById('fontChangeNotification');
    const converterButton = document.getElementById('converterButton');
    
    // コンテンツの読み込み - fetchの代わりにasync/awaitを使用
    async function loadContent() {
        try {
            const response = await fetch('content.html');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const html = await response.text();
            content.innerHTML = html;
            
            // コンテンツが読み込まれた後に設定を適用
            applyStoredSettings();
            
            // 目次のリンクにスムーズスクロールを適用
            addTocEventListeners();
        } catch (error) {
            console.error('コンテンツ読み込みエラー:', error);
            content.innerHTML = '<p>コンテンツの読み込みに失敗しました。再読み込みしてください。</p>';
        }
    }
    
    // ページ設定の適用
    function applyStoredSettings() {
        // 縦横表示設定の復元
        const savedMode = localStorage.getItem('writingMode');
        if (savedMode === 'vertical') {
            content.classList.add('vertical');
        } else {
            content.classList.remove('vertical');
        }
        
        // 行間の読み込み
        const savedLineHeight = localStorage.getItem('lineHeight');
        if (savedLineHeight) {
            content.style.lineHeight = savedLineHeight;
        }
        
        // フォント設定の復元
        const savedFont = localStorage.getItem('fontClass');
        if (savedFont) {
            // 以前のフォント設定をすべて削除
            content.classList.remove('font1', 'font2', 'font3', 'font4');
            content.classList.add(savedFont);
        } else {
            // デフォルトフォントを設定
            content.classList.add('font1');
        }
        
        // テーマ設定の復元
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.className = savedTheme;
        }
        
        // しおりから読み込み
        const bookmarkData = JSON.parse(localStorage.getItem('bookmark'));
        if (bookmarkData) {
            if (bookmarkData.mode === 'vertical') {
                content.classList.add('vertical');
            } else {
                content.classList.remove('vertical');
            }
            // スムーズスクロールを無効にしてブックマーク位置に移動
            setTimeout(() => {
                window.scrollTo({
                    left: bookmarkData.scrollX,
                    top: bookmarkData.scrollY,
                    behavior: 'auto'
                });
            }, 100);
        }
    }
    
    // 目次のイベントリスナー追加
    function addTocEventListeners() {
        document.querySelectorAll('.toc a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // 縦書きと横書きの切り替えと設定の保存
    toggleWritingModeBtn.addEventListener('click', () => {
        content.classList.toggle('vertical');
        const mode = content.classList.contains('vertical') ? 'vertical' : 'horizontal';
        localStorage.setItem('writingMode', mode);

        // 書き込みモードに応じてスクロール位置を調整
        if (mode === 'vertical') {
            window.scrollTo({
                left: document.body.scrollWidth,
                top: 0,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo({
                left: 0,
                top: 0,
                behavior: 'smooth'
            });
        }

        showMessage(mode === 'vertical' ? "縦書きモードに変更しました" : "横書きモードに変更しました");
    });

    // しおり機能
    saveBookmarkBtn.addEventListener('click', () => {
        const mode = content.classList.contains('vertical') ? 'vertical' : 'horizontal';
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        localStorage.setItem('bookmark', JSON.stringify({mode, scrollX, scrollY}));
        showMessage("しおり🔖を挟みました！\n※端末に保存されます");
    });

    // メッセージ表示機能
    function showMessage(message) {
        const messageElement = document.getElementById('bookmarkMessage');
        messageElement.textContent = message;
        messageElement.style.display = 'block';

        // 非表示アニメーション
        messageElement.classList.add('show');
        
        // 数秒後に非表示
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 500); // フェードアウト後に非表示
        }, 3000);
    }

    // 行間の調整
    document.getElementById('largeLineHeight').addEventListener('click', () => {
        content.style.lineHeight = '1.9';
        localStorage.setItem('lineHeight', '1.9');
        showMessage("行間を大きくしました");
    });

    document.getElementById('mediumLineHeight').addEventListener('click', () => {
        content.style.lineHeight = '1.5';
        localStorage.setItem('lineHeight', '1.5');
        showMessage("行間を普通にしました");
    });

    document.getElementById('smallLineHeight').addEventListener('click', () => {
        content.style.lineHeight = '1.1';
        localStorage.setItem('lineHeight', '1.1');
        showMessage("行間を小さくしました");
    });

    // ヘルプと情報のオーバーレイ
    setupOverlay('helpButton', 'helpOverlay');
    setupOverlay('infoButton', 'infoOverlay');
    
    function setupOverlay(buttonId, overlayId) {
        const button = document.getElementById(buttonId);
        const overlay = document.getElementById(overlayId);
        
        button.addEventListener('click', () => {
            overlay.style.display = 'block';
            overlay.classList.add('fade-in');
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('fade-in');
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    overlay.classList.remove('fade-out');
                }, 300);
            }
        });

        // 閉じるボタンの機能
        const closeButton = overlay.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                overlay.classList.remove('fade-in');
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    overlay.classList.remove('fade-out');
                }, 300);
            });
        }
    }

    // カラーテーマ変更
    document.getElementById('defaultThemeButton').addEventListener('click', () => {
        document.body.className = '';
        localStorage.setItem('theme', '');
        showMessage("標準テーマに変更しました");
    });

    document.getElementById('darkThemeButton').addEventListener('click', () => {
        document.body.className = 'dark-theme';
        localStorage.setItem('theme', 'dark-theme');
        showMessage("ダークテーマに変更しました");
    });

    document.getElementById('lightYellowThemeButton').addEventListener('click', () => {
        document.body.className = 'light-yellow-theme';
        localStorage.setItem('theme', 'light-yellow-theme');
        showMessage("薄黄色テーマに変更しました");
    });
    
    // テキスト変換ツールへのリンク
    if (converterButton) {
        converterButton.addEventListener('click', () => {
            window.location.href = 'text-converter.html';
        });
    }
    
    // フォント切り替えボタン
    fontChangeBtn.addEventListener('click', changeFont);
    
    // フォント切り替え処理
    function changeFont() {
        let newFont = '';
        
        if (content.classList.contains('font1')) {
            content.classList.replace('font1', 'font2');
            newFont = 'font2';
        } else if (content.classList.contains('font2')) {
            content.classList.replace('font2', 'font3');
            newFont = 'font3';
        } else if (content.classList.contains('font3')) {
            content.classList.replace('font3', 'font4');
            newFont = 'font4';
        } else if (content.classList.contains('font4')) {
            content.classList.replace('font4', 'font1');
            newFont = 'font1';
        } else {
            // フォントクラスがない場合はfont1を追加
            content.classList.add('font1');
            newFont = 'font1';
        }
        
        // フォント設定を保存
        localStorage.setItem('fontClass', newFont);

        // 現在のフォント名を取得して通知
        const currentFontName = getCurrentFontName();
        showMessage(`フォントを ${currentFontName} に変更しました`);
    }

    function getCurrentFontName() {
        if (content.classList.contains('font1')) {
            return 'Noto Sans JP';
        } else if (content.classList.contains('font2')) {
            return 'Sawarabi Mincho';
        } else if (content.classList.contains('font3')) {
            return 'Kosugi Maru';
        } else if (content.classList.contains('font4')) {
            return '游ゴシック';
        } else {
            return 'デフォルトのフォント';
        }
    }
    
    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
        // Ctrl+Bでしおり
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            saveBookmarkBtn.click();
        }
        // Ctrl+Tで縦横切替
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            toggleWritingModeBtn.click();
        }
        // Ctrl+Fでフォント変更
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            fontChangeBtn.click();
        }
    });
    
    // タッチスワイプを検出する機能
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        
        // スワイプの方向と距離を計算
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // 左右のスワイプを検出（横書きモードでの章の移動など）
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
            if (diffX > 0) {
                // 右スワイプ - 前の章へ
                navigateChapter('prev');
            } else {
                // 左スワイプ - 次の章へ
                navigateChapter('next');
            }
        }
    }, false);
    
    // 章の移動機能
    function navigateChapter(direction) {
        const chapters = document.querySelectorAll('h4[id^="chapter"]');
        if (chapters.length < 2) return;
        
        // 現在表示されている章を特定
        let currentChapter = null;
        let minDistance = Infinity;
        
        chapters.forEach(chapter => {
            const rect = chapter.getBoundingClientRect();
            const distance = Math.abs(rect.top);
            if (distance < minDistance) {
                minDistance = distance;
                currentChapter = chapter;
            }
        });
        
        if (!currentChapter) return;
        
        // 現在の章のインデックスを取得
        let currentIndex = Array.from(chapters).indexOf(currentChapter);
        
        // 次または前の章へ移動
        if (direction === 'next' && currentIndex < chapters.length - 1) {
            chapters[currentIndex + 1].scrollIntoView({ behavior: 'smooth' });
        } else if (direction === 'prev' && currentIndex > 0) {
            chapters[currentIndex - 1].scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // コンテンツのロード開始
    loadContent();
});
