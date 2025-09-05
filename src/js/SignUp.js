document.addEventListener("DOMContentLoaded", function() {
    const signupForm = document.getElementById("signup-form");

    signupForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const username = document.getElementById("signup-username").value.trim();
        const password = document.getElementById("signup-password").value.trim();
        const passwordConfirm = document.getElementById("signup-password-confirm").value.trim();

        if(password !== passwordConfirm){
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        // 이미 존재하는 사용자 확인
        if(localStorage.getItem(`user-${username}-password`)){
            alert("이미 존재하는 아이디입니다.");
            return;
        }

        // 사용자별 비밀번호 저장
        localStorage.setItem(`user-${username}-password`, password);

        // 자동 로그인 처리
        localStorage.setItem("loggedInUser", username);

        alert("회원가입이 완료되었습니다.");
        window.location.href = "mypage.html"; // 회원가입 후 바로 마이페이지로 이동
    });
});
