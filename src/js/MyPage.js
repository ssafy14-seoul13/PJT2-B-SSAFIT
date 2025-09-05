document.addEventListener("DOMContentLoaded", function () {
    const loggedInUser = localStorage.getItem("loggedInUser");

    if (!loggedInUser) {
        alert("로그인이 필요합니다.");
        window.location.href = "login.html";
        return;
    }

    const userDisplay = document.getElementById("user-name");
    if (userDisplay) userDisplay.textContent = loggedInUser;

    // ===== 찜 목록 불러오기 =====
    const wishlistContainer = document.getElementById("wishlist-container");
    let wishlist = JSON.parse(localStorage.getItem(`${loggedInUser}-wishlist`)) || [];

    if (wishlistContainer) {
        wishlist.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            li.classList.add("list-group-item");
            wishlistContainer.appendChild(li);
        });
    }

    // ===== 찜 추가 버튼 =====
    const addWishlistBtn = document.getElementById("add-wishlist");
    if (addWishlistBtn) {
        addWishlistBtn.addEventListener("click", function () {
            const newItem = prompt("추가할 항목을 입력하세요");
            if (newItem) {
                wishlist.push(newItem);
                localStorage.setItem(`${loggedInUser}-wishlist`, JSON.stringify(wishlist));

                if (wishlistContainer) {
                    const li = document.createElement("li");
                    li.textContent = newItem;
                    li.classList.add("list-group-item");
                    wishlistContainer.appendChild(li);
                }
            }
        });
    }

    // ===== 로그아웃 =====
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("loggedInUser");
            alert("로그아웃 되었습니다.");
            window.location.href = "login.html";
        });
    }

    // ===== 계정 비활성화 =====
    const deactivateBtn = document.getElementById("deactivate-btn");
    if (deactivateBtn) {
        deactivateBtn.addEventListener("click", function () {
            if (confirm("정말 계정을 비활성화하시겠습니까?")) {
                const loggedInUser = localStorage.getItem("loggedInUser"); // 현재 로그인 사용자

                // 로그인 정보 삭제
                localStorage.removeItem("loggedInUser");

                // 사용자 관련 모든 데이터 삭제
                localStorage.removeItem(`${loggedInUser}-wishlist`);
                localStorage.removeItem(`user-${loggedInUser}-password`);
                localStorage.removeItem("username");
                localStorage.removeItem("password");

                alert("계정이 비활성화되었습니다.");
                window.location.href = "login.html"; // 로그인 페이지로 이동
            }
        });
    }

});
