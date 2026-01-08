document.addEventListener("DOMContentLoaded", () => {
    // 요소 가져오기
    const bookContent = document.getElementById("book-content");
    const topBarTitle = document.getElementById("top-bar-title");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const sidebarList = document.getElementById("sidebar-toc-list");
    const toast = document.getElementById("toast");

    // 버튼들
    const btnMenu = document.getElementById("btn-menu-toggle");
    const btnCloseSidebar = document.getElementById("btn-close-sidebar");
    
    // 폰트 조절 관련
    const btnFontToggle = document.getElementById("btn-font-toggle");
    const fontPanel = document.getElementById("font-settings-panel");
    const btnFontInc = document.getElementById("btn-font-increase");
    const btnFontDec = document.getElementById("btn-font-decrease");
    const txtFontSize = document.getElementById("current-font-size");
    
    let currentFontSize = 18; // 기본 폰트 크기

    // 모달 관련
    const modalOverlay = document.getElementById("modal-overlay");
    const modalTitle = document.getElementById("modal-title");
    const modalText = document.getElementById("modal-text");
    const btnCloseModal = document.getElementById("btn-close-modal");

    // 1. 데이터 불러오기
    fetch('content.json')
        .then(res => res.json())
        .then(data => {
            initBook(data);
        })
        .catch(err => console.error(err));

    function initBook(data) {
        document.title = data.bookTitle;
        topBarTitle.textContent = data.bookTitle;

        // 1. 본문 렌더링 (표지 + 챕터)
        renderContent(data);

        // 2. 목차(사이드바) 렌더링
        renderSidebarTOC(data);

        // 3. 주석 연결
        setupFootnotes();
    }

    // 본문 그리기
    function renderContent(data) {
        // 표지 추가
        if(data.coverImage) {
            const coverDiv = document.createElement("div");
            coverDiv.className = "cover-container";
            coverDiv.innerHTML = `
                <img src="${data.coverImage}" alt="표지">
                <h2>${data.bookTitle}</h2>
                <p class="author-name">${data.author}</p>
                
                <div class="cover-credits">
                    <p class="credit-main">${data.translator || ''}</p>
                    <p class="credit-sub">${data.copyright || ''}</p>
                    <p class="credit-warn">이 번역물의 무단 전재 및 배포를 금합니다.</p>
                </div>
            `;
            bookContent.appendChild(coverDiv);
        }

        // 챕터 추가
        data.chapters.forEach(chapter => {
            if (chapter.isTranslated) {
                const article = document.createElement("article");
                article.className = "chapter";
                article.id = chapter.id;

                const h2 = document.createElement("h2");
                h2.textContent = chapter.title;
                article.appendChild(h2);

                chapter.paragraphs.forEach(text => {
                    const p = document.createElement("p");
                    p.innerHTML = text;
                    article.appendChild(p);
                });
                bookContent.appendChild(article);
            }
        });
    }

    // 사이드바 목차 만들기
    function renderSidebarTOC(data) {
        data.chapters.forEach(chapter => {
            const li = document.createElement("li");
            li.className = "toc-item";
            li.textContent = chapter.title;

            if (!chapter.isTranslated) {
                li.classList.add("not-translated");
                li.textContent += " (번역 중)";
            }

            li.addEventListener("click", () => {
                if (chapter.isTranslated) {
                    const target = document.getElementById(chapter.id);
                    if (target) {
                        closeSidebar(); // 이동 전 사이드바 닫기
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    showToast("아직 번역 중인 파트입니다.");
                }
            });

            sidebarList.appendChild(li);
        });
    }

    // --- 기능 구현 ---

    // 1. 사이드바 열기/닫기
    function openSidebar() {
        sidebar.classList.add("open");
        sidebarOverlay.classList.remove("hidden");
        document.body.style.overflow = "hidden"; // 배경 스크롤 막기
        fontPanel.classList.add("hidden"); // 폰트 패널 켜져있으면 끄기
    }

    function closeSidebar() {
        sidebar.classList.remove("open");
        sidebarOverlay.classList.add("hidden");
        document.body.style.overflow = "auto";
    }

    btnMenu.addEventListener("click", openSidebar);
    btnCloseSidebar.addEventListener("click", closeSidebar);
    sidebarOverlay.addEventListener("click", closeSidebar);

    // 2. 폰트 크기 조절
    btnFontToggle.addEventListener("click", () => {
        fontPanel.classList.toggle("hidden");
    });

    function updateFontSize() {
        document.body.style.fontSize = currentFontSize + "px";
        // 퍼센트로 표시 (18px 기준)
        const percent = Math.round((currentFontSize / 18) * 100);
        txtFontSize.textContent = percent + "%";
    }

    btnFontInc.addEventListener("click", () => {
        if(currentFontSize < 30) {
            currentFontSize += 2;
            updateFontSize();
        }
    });

    btnFontDec.addEventListener("click", () => {
        if(currentFontSize > 12) {
            currentFontSize -= 2;
            updateFontSize();
        }
    });

    // 3. 주석 기능
    function setupFootnotes() {
        document.querySelectorAll(".footnote-word").forEach(word => {
            word.addEventListener("click", () => {
                modalTitle.textContent = word.innerText;
                modalText.innerHTML = word.getAttribute("data-note");
                modalOverlay.classList.remove("hidden");
                // 모달 뜰 때 사이드바 닫기
                if(sidebar.classList.contains("open")) closeSidebar();
            });
        });
    }

    // 모달 닫기
    const closeModal = () => modalOverlay.classList.add("hidden");
    btnCloseModal.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", (e) => {
        if(e.target === modalOverlay) closeModal();
    });

    // 토스트 메시지
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove("hidden");
        setTimeout(() => toast.classList.add("hidden"), 2000);
    }
});

// 1. 마우스 오른쪽 클릭 차단
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    // alert("우클릭은 사용할 수 없습니다."); // 필요하면 주석 해제
});

// 2. 드래그 시작 차단 (이미지 끌기 등)
document.addEventListener('dragstart', function(e) {
    e.preventDefault();
});

// 3. 단축키 차단 (Ctrl+C, Ctrl+A, Ctrl+S, F12 등)
document.addEventListener('keydown', function(e) {
    // Ctrl(윈도우) 또는 Meta(맥 command) 키가 눌렸을 때
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'c': // 복사
            case 'a': // 전체 선택
            case 's': // 저장
            case 'p': // 인쇄
                e.preventDefault();
                // alert("복사 및 저장이 금지되어 있습니다.");
                break;
        }
    }
    
    if (e.key === 'F12') {
        e.preventDefault();
    }
});
