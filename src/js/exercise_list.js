document.addEventListener("DOMContentLoaded", () => {
  // 1. 요소 가져오기
  const videoContainer = document.querySelector("#popular-videos-container");
  const videoModal = document.querySelector("#videoModal");
  const youtubePlayer = document.querySelector("#youtube-player");

  // 영상 추가/수정 모달 관련 요소
  const videoFormModalEl = document.querySelector("#video-form-modal");
  const videoFormModal = new bootstrap.Modal(videoFormModalEl);
  const videoForm = document.querySelector("#video-form");
  const videoFormLabel = document.querySelector("#video-form-modal-label");
  const videoIdInput = document.querySelector("#video-id-input");
  const videoUrlInput = document.querySelector("#video-url-input");
  const videoTitleInput = document.querySelector("#video-title-input");
  const videoChannelInput = document.querySelector("#video-channel-input");
  const videoPartInput = document.querySelector("#video-part-input");
  const addVideoBtn = document.querySelector("#add-video-btn");

  // 리뷰 관련 요소
  const reviewList = document.querySelector("#review-list");
  const reviewForm = document.querySelector("#review-form");
  const reviewInput = document.querySelector("#review-input");

  let currentVideoId = null; // 현재 열린 영상 ID
  let videos = []; // 영상 데이터 배열

  // 2. 데이터 관리
  const getVideosFromStorage = () => JSON.parse(localStorage.getItem("videos") || "[]");
  const saveVideosToStorage = () => localStorage.setItem("videos", JSON.stringify(videos));
  const getReviewsFromStorage = (videoId) =>
    videoId ? JSON.parse(localStorage.getItem(`reviews_${videoId}`) || "[]") : [];
  const saveReviewsToStorage = (videoId, reviews) =>
    videoId && localStorage.setItem(`reviews_${videoId}`, JSON.stringify(reviews));

  const getVideoIdFromUrl = (url) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    return matches ? matches[1] : null;
  };

  // 3. 렌더링 함수
  function renderVideos() {
    if (!videoContainer) return;
    videoContainer.innerHTML = "";

    videos.forEach((video) => {
      const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
      const cardHtml = `
                <div class="col">
                    <div class="card h-100">
                        <div style="position: relative;">
                            <img src="${thumbnailUrl}" class="card-img-top" alt="${video.title}" style="cursor: pointer;"
                                 data-bs-toggle="modal" data-bs-target="#videoModal" 
                                 data-video-url="${video.url}" data-video-id="${video.id}">
                            
                            <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;">
                                <button class="btn btn-light btn-sm" data-action="edit-video" data-id="${video.id}">✏️</button>
                                <button class="btn btn-danger btn-sm" data-action="delete-video" data-id="${video.id}">🗑️</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${video.title}</h5>
                            <p class="card-text">${video.channelName}</p>
                        </div>
                    </div>
                </div>`;
      videoContainer.innerHTML += cardHtml;
    });
  }

  function renderReviews(reviews) {
    if (!reviewList) return;
    reviewList.innerHTML = "";
    reviews.forEach((review) => {
      const reviewItem = document.createElement("div");
      reviewItem.className = "alert alert-light d-flex justify-content-between align-items-center";

      // isEditing 속성을 확인하여 일반 모드와 수정 모드를 구분하여 렌더링
      if (review.isEditing) {
        reviewItem.innerHTML = `
                    <input type="text" class="form-control" value="${review.text}" data-id="${review.id}">
                    <div>
                        <button class="btn btn-sm btn-success me-2" data-id="${review.id}" data-action="save-review">저장</button>
                        <button class="btn btn-sm btn-secondary" data-id="${review.id}" data-action="cancel-edit">취소</button>
                    </div>
                `;
      } else {
        reviewItem.innerHTML = `
                    <span>${review.text}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary me-2" data-id="${review.id}" data-action="edit-review">수정</button>
                        <button class="btn btn-sm btn-outline-danger" data-id="${review.id}" data-action="delete-review">삭제</button>
                    </div>
                `;
      }
      reviewList.appendChild(reviewItem);
    });
  }

  // 4. 초기화 함수
  function initialize() {
    videos = getVideosFromStorage();
    if (videos.length > 0) {
      renderVideos();
    } else {
      fetch("/data/video.json")
        .then((res) => res.json())
        .then((initialVideos) => {
          videos = initialVideos;
          saveVideosToStorage();
          renderVideos();
        });
    }
  }

  // 5. 이벤트 리스너
  addVideoBtn.addEventListener("click", () => {
    videoForm.reset();
    videoIdInput.value = "";
    videoFormLabel.textContent = "새 영상 추가";
  });

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
    };

    if (existingId) {
      // 수정
      const index = videos.findIndex((v) => v.id === existingId);
      if (index > -1) videos[index] = videoData;
    } else {
      // 추가
      if (newVideoId && !videos.some((v) => v.id === newVideoId)) {
        videos.unshift(videoData);
      } else {
        alert("유효하지 않은 유튜브 URL이거나 이미 존재하는 영상입니다.");
        return;
      }
    }

    saveVideosToStorage();
    renderVideos();
    videoFormModal.hide();
  });

  videoContainer.addEventListener("click", (e) => {
    const targetButton = e.target.closest("button");
    if (targetButton) {
      // 수정, 삭제 버튼 처리
      const { action, id } = targetButton.dataset;
      if (action === "delete-video") {
        if (confirm("정말로 이 영상을 삭제하시겠습니까?")) {
          videos = videos.filter((v) => v.id !== id);
          saveVideosToStorage();
          renderVideos();
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
          videoFormModal.show();
        }
      }
    }
  });

  // 영상 재생 모달 이벤트 리스너
  videoModal.addEventListener("show.bs.modal", (event) => {
    const cardImage = event.relatedTarget; // 모달을 연 요소 (<img>)
    if (cardImage) {
      currentVideoId = cardImage.dataset.videoId;
      youtubePlayer.src = cardImage.dataset.videoUrl;

      const currentReviews = getReviewsFromStorage(currentVideoId);
      renderReviews(currentReviews);
    }
  });

  // 영상 재생 모달이 닫힐 때
  videoModal.addEventListener("hidden.bs.modal", () => {
    youtubePlayer.src = ""; // 영상 재생 중지
    currentVideoId = null;
  });

  // 리뷰 폼/리스트 이벤트 리스너
  if (reviewForm) {
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
  }

  if (reviewList) {
    reviewList.addEventListener("click", (e) => {
      const target = e.target.closest("button");
      if (!target || !currentVideoId) return;

      const { action, id } = target.dataset;
      let reviews = getReviewsFromStorage(currentVideoId);
      const reviewId = parseInt(id);

      if (action === "delete-review") {
        reviews = reviews.filter((r) => r.id !== reviewId);
        saveReviewsToStorage(currentVideoId, reviews);
        renderReviews(reviews);
      } else if (action === "edit-review") {
        // '수정' 버튼을 누르면 해당 리뷰 객체에 isEditing: true 속성을 추가
        reviews = reviews.map((r) => ({ ...r, isEditing: r.id === reviewId }));
        renderReviews(reviews); // 수정 UI로 다시 렌더링
      } else if (action === "cancel-edit") {
        // '취소' 버튼을 누르면 isEditing 속성을 제거하고 다시 렌더링
        reviews = reviews.map((r) => ({ ...r, isEditing: false }));
        renderReviews(reviews);
      } else if (action === "save-review") {
        // '저장' 버튼을 누르면 input 값을 찾아 내용 업데이트
        const inputEl = reviewList.querySelector(`input[data-id="${reviewId}"]`);
        const newText = inputEl.value.trim();

        if (newText) {
          const reviewToEdit = reviews.find((r) => r.id === reviewId);
          if (reviewToEdit) {
            reviewToEdit.text = newText;
            delete reviewToEdit.isEditing; // isEditing 속성 제거
            saveReviewsToStorage(currentVideoId, reviews);
            renderReviews(reviews); // 일반 UI로 다시 렌더링
          }
        }
      }
    });
  }

  // 앱 시작!
  initialize();
});
