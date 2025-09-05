document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("login-form");
    const goRegisterBtn = document.getElementById("go-register");

    if(loginForm){
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value.trim();

            // 사용자별 비밀번호 확인
            const storedPassword = localStorage.getItem(`user-${username}-password`);

            if(password === storedPassword){
                localStorage.setItem("loggedInUser", username); // 로그인 상태 저장
                window.location.href = "mypage.html";
            } else {
                alert("아이디 또는 비밀번호가 잘못되었습니다.");
            }
        });
    }

    if(goRegisterBtn){
        goRegisterBtn.addEventListener("click", function() {
            window.location.href = "signup.html";
        });
    }
});
