document.addEventListener("DOMContentLoaded", () => {
  // -------------------
  // 1. HTML 요소 가져오기
  // -------------------
  const videoContainer = document.querySelector("#popular-videos-container");
  const sortBtnGroup = document.querySelector("#sort-btn-group");
  const searchForm = document.querySelector(".search");
  const searchInput = document.querySelector(".search-box input[type='text']");
  const keywordGroup = document.querySelector(".search-keyword");
  const addVideoBtn = document.querySelector("#add-video-btn");

  // 영상 재생 모달 요소
  const videoModal = document.querySelector("#videoModal");
  const youtubePlayer = document.querySelector("#youtube-player");

  // 영상 추가/수정 모달 요소
  const videoFormModalEl = document.querySelector("#video-form-modal");
  const videoFormModal = new bootstrap.Modal(videoFormModalEl);
  const videoForm = document.querySelector("#video-form");
  const videoFormLabel = document.querySelector("#video-form-modal-label");
  const videoIdInput = document.querySelector("#video-id-input");
  const videoUrlInput = document.querySelector("#video-url-input");
  const videoTitleInput = document.querySelector("#video-title-input");
  const videoChannelInput = document.querySelector("#video-channel-input");
  const videoPartInput = document.querySelector("#video-part-input");

  // 리뷰 관련 요소
  const reviewList = document.querySelector("#review-list");
  const reviewForm = document.querySelector("#review-form");
  const reviewInput = document.querySelector("#review-input");

  // -------------------
  // 2. 상태 및 데이터 관리 변수
  // -------------------
  let videos = []; // 모든 영상 데이터를 담는 원본 배열
  let currentVideoId = null; // 현재 열려있는 모달의 영상 ID
  let currentSortType = "latest"; // 현재 정렬 기준 (기본값: 최신순)

  // -------------------
  // 3. 데이터 영속성 관련 함수 (localStorage)
  // -------------------
  const getVideosFromStorage = () => JSON.parse(localStorage.getItem("videos") || "[]");
  const saveVideosToStorage = () => localStorage.setItem("videos", JSON.stringify(videos));
  const getReviewsFromStorage = (videoId) =>
    videoId ? JSON.parse(localStorage.getItem(`reviews_${videoId}`) || "[]") : [];
  const saveReviewsToStorage = (videoId, reviews) =>
    videoId && localStorage.setItem(`reviews_${videoId}`, JSON.stringify(reviews));

  // 유튜브 URL에서 고유 ID를 추출하는 함수
  const getVideoIdFromUrl = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return url.match(regex)?.[1] || null;
  };

  // -------------------
  // 4. 화면 업데이트 핵심 함수
  // -------------------
  function updateDisplay() {
    // 현재 검색어와 선택된 운동 부위를 가져옴
    const searchTerm = searchInput.value.toLowerCase();
    const selectedPart = document.querySelector(".search-keyword input[name='part']:checked").value;

    // 1단계: 필터링
    let filteredVideos = videos.filter((video) => {
      const partMatch =
        selectedPart === "all" || (video.part && video.part.toLowerCase() === selectedPart.toLowerCase());
      const searchMatch =
        !searchTerm ||
        video.title.toLowerCase().includes(searchTerm) ||
        video.channelName.toLowerCase().includes(searchTerm);
      return partMatch && searchMatch;
    });

    // 2단계: 정렬
    if (currentSortType === "views") {
      filteredVideos.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (currentSortType === "reviews") {
      filteredVideos.sort((a, b) => {
        const reviewCountB = getReviewsFromStorage(b.id).length;
        const reviewCountA = getReviewsFromStorage(a.id).length;
        return reviewCountB - reviewCountA;
      });
    }
    // 'latest' (최신순)는 원본 배열의 순서를 따르므로 별도 정렬이 필요 없음

    // 3단계: 최종 결과를 화면에 렌더링
    renderVideos(filteredVideos);
  }

  // -------------------
  // 5. 렌더링 함수 (HTML 생성)
  // -------------------
  function renderVideos(videoArray) {
    if (!videoContainer) return;
    videoContainer.innerHTML = "";
    videoArray.forEach((video) => {
      const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
      const cardHtml = `
                <div class="col">
                    <div class="card h-100">
                        <div style="position: relative;">
                             <img src="${thumbnailUrl}" class="card-img-top" alt="${
        video.title
      }" style="cursor: pointer;"
                                 data-bs-toggle="modal" data-bs-target="#videoModal" 
                                 data-video-url="${video.url}" data-video-id="${video.id}">
                            
                            <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;">
                                <button class="btn btn-light btn-sm" data-action="edit-video" data-id="${
                                  video.id
                                }">✏️</button>
                                <button class="btn btn-danger btn-sm" data-action="delete-video" data-id="${
                                  video.id
                                }">🗑️</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${video.title}</h5>
                            <p class="card-text">${video.channelName}</p>
                            <p class="card-text"><small class="text-muted">조회수 ${(
                              video.viewCount || 0
                            ).toLocaleString()}회</small></p>
                        </div>
                    </div>
                </div>`;
      videoContainer.insertAdjacentHTML("beforeend", cardHtml);
    });
  }

  function renderReviews(reviews) {
    if (!reviewList) return;
    reviewList.innerHTML = "";
    reviews.forEach((review) => {
      const reviewItem = document.createElement("div");
      reviewItem.className = "alert alert-light d-flex justify-content-between align-items-center";

      // 'isEditing' 상태에 따라 수정 UI 또는 일반 UI를 보여줌
      if (review.isEditing) {
        reviewItem.innerHTML = `
                    <input type="text" class="form-control" value="${review.text}" data-id="${review.id}">
                    <div>
                        <button class="btn btn-sm btn-success me-2" data-id="${review.id}" data-action="save-review">저장</button>
                        <button class="btn btn-sm btn-secondary" data-id="${review.id}" data-action="cancel-edit">취소</button>
                    </div>`;
      } else {
        reviewItem.innerHTML = `
                    <span>${review.text}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary me-2" data-id="${review.id}" data-action="edit-review">수정</button>
                        <button class="btn btn-sm btn-outline-danger" data-id="${review.id}" data-action="delete-review">삭제</button>
                    </div>`;
      }
      reviewList.appendChild(reviewItem);
    });
  }

  // -------------------
  // 6. 이벤트 리스너 설정
  // -------------------
  // 검색창 이벤트
  searchForm.addEventListener("submit", (e) => e.preventDefault()); // 엔터 시 새로고침 방지
  searchInput.addEventListener("input", updateDisplay); // 타이핑할 때마다 실시간 검색
  keywordGroup.addEventListener("change", updateDisplay); // 라디오 버튼 변경 시 필터링

  // 정렬 버튼 이벤트
  sortBtnGroup.addEventListener("click", (e) => {
    const target = e.target.closest(".sort-btn");
    if (!target) return;

    sortBtnGroup.querySelector(".active").classList.remove("active");
    target.classList.add("active");

    currentSortType = target.dataset.sort; // 정렬 상태 변경
    updateDisplay(); // 화면 업데이트
  });

  // '새 영상 추가' 버튼 이벤트
  addVideoBtn.addEventListener("click", () => {
    videoForm.reset(); // 폼 내용 초기화
    videoIdInput.value = ""; // 수정 모드용 ID 값 비우기
    videoFormLabel.textContent = "새 영상 추가";
  });

  // 영상 추가/수정 폼 제출 이벤트
  videoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = videoUrlInput.value;
    const newVideoId = getVideoIdFromUrl(url);
    const existingId = videoIdInput.value;

    const videoData = {
      id: existingId || newVideoId,
      title: videoTitleInput.value,
      part: videoPartInput.value,
      channelName: videoChannelInput.value,
      url: `https://www.youtube.com/embed/${existingId || newVideoId}`,
      viewCount: existingId ? videos.find((v) => v.id === existingId).viewCount : 0,
    };

    if (existingId) {
      // ID가 있으면 수정 모드
      const index = videos.findIndex((v) => v.id === existingId);
      if (index > -1) videos[index] = videoData;
    } else {
      // ID가 없으면 추가 모드
      if (newVideoId && !videos.some((v) => v.id === newVideoId)) {
        videos.unshift(videoData); // 새 영상을 맨 앞에 추가
      } else {
        alert("유효하지 않은 유튜브 URL이거나 이미 존재하는 영상입니다.");
        return;
      }
    }

    saveVideosToStorage();
    updateDisplay();
    videoFormModal.hide(); // 모달 닫기
  });

  // 영상 목록(카드) 내 이벤트 처리 (이벤트 위임)
  videoContainer.addEventListener("click", (e) => {
    // 수정/삭제 버튼 클릭 처리
    const button = e.target.closest("button");
    if (button) {
      const { action, id } = button.dataset;
      if (action === "delete-video") {
        if (confirm("정말로 이 영상을 삭제하시겠습니까?")) {
          videos = videos.filter((v) => v.id !== id);
          saveVideosToStorage();
          updateDisplay();
        }
      } else if (action === "edit-video") {
        const videoToEdit = videos.find((v) => v.id === id);
        if (videoToEdit) {
          videoFormLabel.textContent = "영상 정보 수정";
          videoIdInput.value = videoToEdit.id;
          videoUrlInput.value = `https://www.youtube.com/watch?v=${videoToEdit.id}`;
          videoTitleInput.value = videoToEdit.title;
          videoChannelInput.value = videoToEdit.channelName;
          videoPartInput.value = videoToEdit.part;
          videoFormModal.show(); // 수정 모달 열기
        }
      }
    }
  });

  // 영상 재생 모달 이벤트
  videoModal.addEventListener("show.bs.modal", (event) => {
    const cardImage = event.relatedTarget; // 모달을 연 이미지 태그
    if (cardImage && cardImage.matches("img")) {
      currentVideoId = cardImage.dataset.videoId;

      // 조회수 1 증가
      const videoToUpdate = videos.find((v) => v.id === currentVideoId);
      if (videoToUpdate) {
        videoToUpdate.viewCount = (videoToUpdate.viewCount || 0) + 1;
        saveVideosToStorage();
      }

      youtubePlayer.src = cardImage.dataset.videoUrl; // iframe에 영상 URL 설정
      renderReviews(getReviewsFromStorage(currentVideoId)); // 해당 영상의 리뷰 렌더링
    }
  });

  videoModal.addEventListener("hidden.bs.modal", () => {
    youtubePlayer.src = ""; // 모달이 닫히면 영상 재생 중지
    currentVideoId = null;
    updateDisplay(); // 조회수 변경된 것을 메인 화면에 반영
  });

  // 리뷰 폼 제출 이벤트
  reviewForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newReviewText = reviewInput.value.trim();
    if (newReviewText && currentVideoId) {
      const reviews = getReviewsFromStorage(currentVideoId);
      reviews.push({ id: Date.now(), text: newReviewText });
      saveReviewsToStorage(currentVideoId, reviews);
      renderReviews(reviews);
      reviewInput.value = "";
    }
  });

  // 리뷰 목록 내 버튼 클릭 이벤트 (이벤트 위임)
  reviewList.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button || !currentVideoId) return;

    const { action, id } = button.dataset;
    let reviews = getReviewsFromStorage(currentVideoId);
    const reviewId = parseInt(id);

    if (action === "delete-review") {
      reviews = reviews.filter((r) => r.id !== reviewId);
    } else if (action === "edit-review") {
      reviews = reviews.map((r) => ({ ...r, isEditing: r.id === reviewId }));
    } else if (action === "cancel-edit") {
      reviews = reviews.map((r) => ({ ...r, isEditing: false }));
    } else if (action === "save-review") {
      const inputEl = reviewList.querySelector(`input[data-id="${reviewId}"]`);
      const newText = inputEl.value.trim();
      if (newText) {
        const reviewToEdit = reviews.find((r) => r.id === reviewId);
        if (reviewToEdit) {
          reviewToEdit.text = newText;
          delete reviewToEdit.isEditing;
        }
      }
    }

    saveReviewsToStorage(currentVideoId, reviews);
    renderReviews(reviews);
  });

  // -------------------
  // 7. 앱 초기화
  // -------------------
  function initialize() {
    videos = getVideosFromStorage();
    // localStorage에 데이터가 있으면 바로 렌더링
    if (videos.length > 0) {
      updateDisplay();
    } else {
      // 없으면 video.json에서 초기 데이터 가져오기
      fetch("/data/video.json")
        .then((res) => res.json())
        .then((initialVideos) => {
          videos = initialVideos.map((video) => ({
            ...video,
            viewCount: Math.floor(Math.random() * 100000),
          }));
          saveVideosToStorage();
          updateDisplay();
        });
    }
  }

  initialize(); // 앱 실행!
});
