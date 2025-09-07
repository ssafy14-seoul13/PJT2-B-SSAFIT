document.addEventListener("DOMContentLoaded", () => {
    const $form = document.querySelector("form.search");
    const $text = $form?.querySelector('.search-box input[type="text"]');
    const $result =
        document.getElementById("search-result") ||
        (() => {
            // 결과 영역이 없으면 JS로 만들어서 폼 아래에 붙임
            const sec = document.createElement("section");
            sec.id = "search-result";
            sec.className = "search-result";
            $form.insertAdjacentElement("afterend", sec);
            return sec;
        })();
    $result.hidden = true;

    // HTML 라디오 value → JSON part 매핑
    // (라디오 값이 'upper'면 JSON의 '상체'와 비교)
    const PART_MAP = {
        all: "all",
        upper: "상체",
        lower: "하체",
        full: "전신",
        cardio: "유산소",
        strength: "근력",
        yoga: "요가",
        pilates: "필라테스"
    };

    let VIDEO_DATA = []; // /data/video.json 로드 결과 캐시

    // 1) 데이터 로드
    async function loadVideos() {
        if (VIDEO_DATA.length) return VIDEO_DATA; // 이미 불렀으면 재사용
        const res = await fetch("/data/video.json");
        if (!res.ok) throw new Error("영상 데이터를 불러오지 못했습니다.");
        VIDEO_DATA = await res.json();
        return VIDEO_DATA;
    }

    // 2) 필터 적용
    function applyFilter(videos, keyword, partValue) {
        const mappedPart = PART_MAP[partValue] || "all";
        const kw = keyword.trim().toLowerCase();

        return videos.filter((v) => {
            const inKeyword =
                kw === "" ||
                v.title.toLowerCase().includes(kw) ||
                v.channelName.toLowerCase().includes(kw) ||
                v.part.toLowerCase().includes(kw); // '전신' 같은 한글도 포함 검색 허용

            const inPart = (mappedPart !== "all" && v.part === mappedPart);

            return inKeyword && inPart;
        });
    }

    // 3) 결과 렌더링 (부트스트랩 카드 이용)
    function render(videos) {
        $result.hidden = false;
        if (!videos.length) {
            $result.innerHTML = `
          <p style="text-align:center; color:#666; margin:20px 0;">검색 결과가 없습니다.</p>
        `;
            return;
        }

        // 간단한 카드 그리드 (최대 4개만 노출. 미리보기 느낌)
        const top = videos.slice(0, 4);
        const cards = top
            .map(
                (v) => `
          <div class="card" style="max-width: 1000px; margin: 0 auto 12px; box-shadow: 0 1px 6px rgba(0,0,0,.06); border:1px solid #eee;">
            <div class="card-body d-flex gap-3 align-items-center">
              <div class="ratio ratio-16x9" style="max-width: 240px; min-width: 240px;">
                <iframe src="${v.url}" title="${v.title}" frameborder="0" allowfullscreen></iframe>
              </div>
              <div class="flex-grow-1">
                <h5 class="card-title" style="margin:0 0 6px;">${v.title}</h5>
                <div style="font-size:14px; color:#666; margin-bottom:8px;">채널: ${v.channelName}</div>
                <span style="display:inline-block; font-size:12px; padding:4px 10px; border:1px solid #bebebe; border-radius:16px;">${v.part}</span>
              </div>
              <div class="d-flex flex-column gap-2">
                <a class="btn btn-outline-secondary btn-sm" href="/pages/exercise_list.html">더 많은 영상</a>
                <a class="btn btn-dark btn-sm" href="${v.url}" target="_blank" rel="noopener">유튜브로 보기</a>
              </div>
            </div>
          </div>
        `
            )
            .join("");

        $result.innerHTML = `
        <h3 style="max-width:1000px;margin:20px auto 12px;">검색 결과 (${videos.length}건)</h3>
        ${cards}
      `;
    }

    // 4) 검색 실행(공통)
    async function doSearch() {
        const videos = await loadVideos();
        const keyword = $text?.value ?? "";
        const partValue = ($form.querySelector('input[name="part"]:checked')?.value) || "all";
        const filtered = applyFilter(videos, keyword, partValue);
        render(filtered);
    }

    // 5) 이벤트 바인딩
    // Enter/검색버튼: 폼 제출 막고 검색
    $form.addEventListener("submit", (e) => {
        e.preventDefault();
        doSearch();
    });

    // 라디오 클릭 시 즉시 반영
    $form.addEventListener("change", (e) => {
        if (e.target.name === "part") doSearch();
    });

    // 텍스트 입력 간단 반영
    $text?.addEventListener("input", () => {
        doSearch();
    });

    // 데이터만 미리 로드(선택)
    loadVideos().catch((err) => {
        console.error(err);
    });
});


/*
    인기 운동 영상 - 캐러셀
*/
async function initExerciseCarousel() {
    const res = await fetch("/data/video.json");
    if (!res.ok) return;
    const videos = await res.json();

    // 인기 영상 몇 개만 뽑자 (앞에서 4개 정도)
    const topVideos = videos.slice(0, 4);
    const $inner = document.getElementById("exercise-carousel-inner");
    if (!$inner) return;

    $inner.innerHTML = topVideos
        .map((v, idx) => {
            return `
          <div class="carousel-item ${idx === 0 ? "active" : ""}">
            <div class="d-flex justify-content-center" style="padding:20px;">
              <div class="card" style="width: 22rem; box-shadow:0 2px 6px rgba(0,0,0,.1);">
                <div class="ratio ratio-16x9">
                  <iframe src="${v.url}" title="${v.title}" frameborder="0" allowfullscreen></iframe>
                </div>
                <div class="card-body">
                  <h5 class="card-title">${v.title}</h5>
                  <p class="card-text" style="font-size:14px;color:#666;">채널: ${v.channelName}</p>
                  <span style="font-size:12px; padding:2px 8px; border:1px solid #ccc; border-radius:12px;">${v.part}</span>
                </div>
              </div>
            </div>
          </div>
        `;
        })
        .join("");
}

// DOM 준비 후 실행
document.addEventListener("DOMContentLoaded", () => {
    initExerciseCarousel();
});      