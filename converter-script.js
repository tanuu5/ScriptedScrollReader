document.addEventListener('DOMContentLoaded', function() {
    // 要素を取得
    const inputText = document.getElementById('input-text');
    const previewArea = document.getElementById('preview-area');
    const convertBtn = document.getElementById('convert-btn');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const loadSampleBtn = document.getElementById('load-sample-btn');
    const titleInput = document.getElementById('title');
    const autoFuriganaCheckbox = document.getElementById('auto-furigana');
    const chapterPatternInput = document.getElementById('chapter-pattern');
    const advancedSettingsBtn = document.getElementById('advanced-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.querySelector('.close');
    const saveSettingsBtn = document.getElementById('save-settings');
    const resetSettingsBtn = document.getElementById('reset-settings');
    const customDictTextarea = document.getElementById('custom-dict');
    const excludePatternsInput = document.getElementById('exclude-patterns');
    const paragraphSeparatorSelect = document.getElementById('paragraph-separator');
    const successMessage = document.getElementById('success-message');

    // kuromoji.jsの初期化
    let tokenizer = null;
    let isTokenizerLoaded = false;
    
    // デフォルト設定
    const defaultSettings = {
        chapterPattern: '第(\\d+)章[:：](.+)',
        autoFurigana: true,
        customDict: {},
        excludePatterns: '(のだ|した|です|ます|でした|ました|である|ている|でも|けれど|から|まで|など|それ|これ|あれ|どれ|私|僕|俺|あなた|君|彼|彼女)',
        paragraphSeparator: 'both'
    };
    
    // 設定をローカルストレージから読み込む
    let settings = loadSettings();
    
    function loadSettings() {
        const savedSettings = localStorage.getItem('converterSettings');
        return savedSettings ? JSON.parse(savedSettings) : {...defaultSettings};
    }
    
    function saveSettings() {
        // 現在のUI値から設定を更新
        settings.chapterPattern = chapterPatternInput.value;
        settings.autoFurigana = autoFuriganaCheckbox.checked;
        settings.paragraphSeparator = paragraphSeparatorSelect.value;
        settings.excludePatterns = excludePatternsInput.value;
        
        // カスタム辞書を解析
        try {
            const dictText = customDictTextarea.value.trim();
            settings.customDict = dictText ? JSON.parse(dictText) : {};
        } catch (e) {
            alert('カスタム辞書のJSONフォーマットが正しくありません。デフォルト辞書を使用します。');
            settings.customDict = {};
        }
        
        // 設定を保存
        localStorage.setItem('converterSettings', JSON.stringify(settings));
    }
    
    // UI要素に設定を適用
    function applySettingsToUI() {
        chapterPatternInput.value = settings.chapterPattern;
        autoFuriganaCheckbox.checked = settings.autoFurigana;
        paragraphSeparatorSelect.value = settings.paragraphSeparator;
        excludePatternsInput.value = settings.excludePatterns;
        
        // カスタム辞書を整形して表示
        if (Object.keys(settings.customDict).length > 0) {
            customDictTextarea.value = JSON.stringify(settings.customDict, null, 2);
        } else {
            customDictTextarea.value = '';
        }
    }
    
    // 初期化時に設定をUIに適用
    applySettingsToUI();
    
    // Kuromojiの初期化
    function initTokenizer() {
        if (!isTokenizerLoaded) {
            kuromoji.builder({ dicPath: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/' }).build((err, _tokenizer) => {
                if (err) {
                    console.error('Tokenizer error:', err);
                    return;
                }
                
                tokenizer = _tokenizer;
                isTokenizerLoaded = true;
                console.log('Tokenizer loaded successfully');
                
                // 初期化完了後に変換ボタンを有効化
                convertBtn.disabled = false;
            });
        }
    }
    
    // ページロード時にトークナイザーを初期化
    initTokenizer();
    
    // プレーンテキストを解析して構造化する
    function parseText(text) {
        const title = titleInput.value.trim() || 'タイトルなし';
        const chapterRegex = new RegExp(settings.chapterPattern, 'g');
        
        // 章を検出
        const chapters = [];
        let matches;
        let lastIndex = 0;
        
        while ((matches = chapterRegex.exec(text)) !== null) {
            const chapterNumber = matches[1];
            const chapterTitle = matches[2].trim();
            const startIndex = matches.index;
            
            // 最初の章の前にテキストがある場合は序章として追加
            if (chapters.length === 0 && startIndex > 0) {
                chapters.push({
                    number: '0',
                    title: '序章',
                    content: text.substring(0, startIndex).trim()
                });
            }
            
            // 前の章の終わりを設定
            if (chapters.length > 0) {
                chapters[chapters.length - 1].content = text.substring(
                    lastIndex,
                    startIndex
                ).trim();
            }
            
            // 新しい章を追加
            chapters.push({
                number: chapterNumber,
                title: chapterTitle,
                startIndex: startIndex,
                content: '' // 後で設定
            });
            
            lastIndex = startIndex;
        }
        
        // 最後の章のコンテンツを設定
        if (chapters.length > 0) {
            chapters[chapters.length - 1].content = text.substring(
                lastIndex
            ).trim();
        } else {
            // 章が見つからない場合は全テキストを単一の章として扱う
            chapters.push({
                number: '1',
                title: 'テキスト',
                content: text.trim()
            });
        }
        
        return {
            title: title,
            chapters: chapters
        };
    }
    
    // 段落を分割する
    function splitIntoParagraphs(text) {
        switch (settings.paragraphSeparator) {
            case 'empty-line':
                return text.split(/\n\s*\n/).filter(p => p.trim() !== '');
            case 'indent':
                return text.split(/\n(?=\s)/).filter(p => p.trim() !== '');
            case 'both':
            default:
                // 空行または行頭の空白で分割
                return text.split(/\n\s*\n|\n(?=\s)/).filter(p => p.trim() !== '');
        }
    }
    
    // ふりがなを付ける
    function addFurigana(text) {
        if (!tokenizer || !settings.autoFurigana) {
            return text;
        }
        
        // 除外パターン
        const excludeRegex = new RegExp(settings.excludePatterns, 'g');
        
        // トークン化
        const tokens = tokenizer.tokenize(text);
        let result = '';
        
        tokens.forEach(token => {
            const surface = token.surface_form;
            // 漢字が含まれている場合
            if (/[\u4e00-\u9faf]/.test(surface) && !excludeRegex.test(surface)) {
                // カスタム辞書にあるか確認
                if (settings.customDict[surface]) {
                    result += `<ruby>${surface}<rt>${settings.customDict[surface]}</rt></ruby>`;
                } else if (token.reading !== '*' && token.reading !== surface) {
                    // 読みをカタカナからひらがなに変換
                    const reading = katakanaToHiragana(token.reading);
                    result += `<ruby>${surface}<rt>${reading}</rt></ruby>`;
                } else {
                    result += surface;
                }
            } else {
                result += surface;
            }
        });
        
        return result;
    }
    
    // カタカナをひらがなに変換
    function katakanaToHiragana(str) {
        return str.replace(/[\u30a1-\u30f6]/g, function(match) {
            const chr = match.charCodeAt(0) - 0x60;
            return String.fromCharCode(chr);
        });
    }
    
    // HTMLを生成
    function generateHTML(data) {
        let html = `<!-- 目次セクション -->\n<div class="toc">\n<h1>${data.title}<h1>\n<h3>目次</h3>\n<ul>\n`;
        
        // 目次を生成
        data.chapters.forEach((chapter, index) => {
            html += `<li><a href="#chapter${index + 1}">第${chapter.number}章：${chapter.title}</a></li>\n`;
        });
        
        html += `</ul>\n</div>\n\n<!-- 本文コンテンツ -->\n<div id="content" class="content">\n`;
        
        // 章ごとのコンテンツを生成
        data.chapters.forEach((chapter, index) => {
            html += `<h4 id="chapter${index + 1}">第${chapter.number}章：${chapter.title}</h4>\n`;
            
            // 段落に分割
            const paragraphs = splitIntoParagraphs(chapter.content);
            
            paragraphs.forEach(paragraph => {
                const trimmedParagraph = paragraph.trim();
                if (trimmedParagraph) {
                    // ふりがなを追加
                    const withFurigana = addFurigana(trimmedParagraph);
                    html += `<p>${withFurigana}</p>\n`;
                }
            });
        });
        
        html += `</div>`;
        return html;
    }
    
    // テキストを変換
    function convertText() {
        if (!inputText.value.trim()) {
            alert('テキストを入力してください。');
            return;
        }
        
        // トークナイザーの読み込みを確認
        if (settings.autoFurigana && !isTokenizerLoaded) {
            alert('辞書の読み込み中です。しばらくお待ちください。');
            return;
        }
        
        const text = inputText.value;
        const parsedData = parseText(text);
        const html = generateHTML(parsedData);
        
        // プレビューに表示
        previewArea.innerHTML = html;
        
        // 成功メッセージを表示
        showSuccessMessage();
        
        return html;
    }
    
    // 成功メッセージを表示
    function showSuccessMessage() {
        successMessage.style.display = 'block';
        successMessage.style.opacity = '1';
        
        setTimeout(() => {
            successMessage.style.opacity = '0';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 300);
        }, 3000);
    }
    
    // HTMLをダウンロード
    function downloadHTML() {
        const html = previewArea.innerHTML;
        if (!html) {
            alert('先にテキストを変換してください。');
            return;
        }
        
        const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = 'content.html';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }
    
    // HTMLをクリップボードにコピー
    function copyHTML() {
        const html = previewArea.innerHTML;
        if (!html) {
            alert('先にテキストを変換してください。');
            return;
        }
        
        navigator.clipboard.writeText(html).then(() => {
            showSuccessMessage();
        }).catch(err => {
            console.error('クリップボードへのコピーに失敗しました:', err);
            alert('クリップボードへのコピーに失敗しました。');
        });
    }
    
    // サンプルテキストを読み込む
    function loadSampleText() {
        inputText.value = `第1章：青空と少女

海の色は、まるで空の反映のようだった。
碧い波が静かに寄せ合い、砂浜に優しく触れる。
夏の日差しは強く、少女の肌に輝く汗の粒を作りだす。
彼女は瞳を閉じ、深い呼吸を繰り返す。
そう、この場所は彼女にとっての特別な逃避処だった。

第2章：海風と記憶

潮風が髪を撫で、心地よい涼しさを運ぶ。
少女は目を開け、遠く水平線を見つめる。
彼女の記憶には、同じような景色が焼き付けられていた。
それは幼い頃、家族と訪れた夏の日、初めて海を見た時のこと。
今はもう、その日のように手を繋ぐ家族はいない。
しかし、この場所が彼女に与える安らぎは変わらない。`;

        titleInput.value = "青い海の彼方";
    }
    
    // 入力フィールドをクリア
    function clearInput() {
        inputText.value = '';
        previewArea.innerHTML = '';
    }
    
    // モーダルの表示制御
    function openModal() {
        settingsModal.style.display = 'block';
    }
    
    function closeModal() {
        settingsModal.style.display = 'none';
    }
    
    // イベントリスナーの設定
    convertBtn.addEventListener('click', convertText);
    downloadBtn.addEventListener('click', downloadHTML);
    copyBtn.addEventListener('click', copyHTML);
    clearBtn.addEventListener('click', clearInput);
    loadSampleBtn.addEventListener('click', loadSampleText);
    advancedSettingsBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // 設定の保存とリセット
    saveSettingsBtn.addEventListener('click', function() {
        saveSettings();
        closeModal();
        showSuccessMessage();
    });
    
    resetSettingsBtn.addEventListener('click', function() {
        if (confirm('設定をデフォルトに戻しますか？')) {
            settings = {...defaultSettings};
            applySettingsToUI();
            localStorage.setItem('converterSettings', JSON.stringify(settings));
        }
    });
    
    // モーダルの外側をクリックして閉じる
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            closeModal();
        }
    });
    
    // ダークモード検出と適用
    function detectAndApplyDarkMode() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }
    
    detectAndApplyDarkMode();
});
