if (document.title.trim() === "Register") {
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const fullNameInput = document.getElementById("fullName");
            const usernameInput = document.getElementById("itxtbox");
            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("ipassbox");
            const confirmPasswordInput = document.getElementById("confirmPassword");

            if (!fullNameInput || !usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
                alert("Registration form is not configured correctly.");
                return;
            }

            const fullName = fullNameInput.value.trim();
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!fullName || !username || !email || !password || !confirmPassword) {
                alert("Please fill in all fields.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            if (password.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }

            try {
                const response = await fetch("/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fullName, username, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Account created successfully!");
                    registerForm.reset();
                    window.location.href = "index.html";
                } else {
                    alert(data.message || "Registration failed.");
                }
            } catch (error) {
                console.error("Registration error:", error);
                alert("Cannot connect to the server.");
            }
        });
    }
}

if (document.title.trim() === "Login") {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("itxtbox");
    const passwordInput = document.getElementById("ipassbox");
    const rememberMe = document.getElementById("chkb2");

    const savedUsername = localStorage.getItem("cinnamorollRememberMe");

    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
        if (rememberMe) rememberMe.checked = true;
    }

    if (rememberMe) {
        rememberMe.addEventListener("change", function () {
            if (!rememberMe.checked) {
                localStorage.removeItem("cinnamorollRememberMe");
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            if (!usernameInput || !passwordInput) {
                alert("Login form is not configured correctly.");
                return;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username || !password) {
                alert("Please enter your username and password.");
                return;
            }

            try {
                const response = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    if (rememberMe && rememberMe.checked) {
                        localStorage.setItem("cinnamorollRememberMe", username);
                    } else {
                        localStorage.removeItem("cinnamorollRememberMe");
                    }

                    alert("Login successful!");
                    window.location.href = "home.html";
                } else {
                    alert(data.message || "Invalid username or password.");
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("Cannot connect to the server.");
            }
        });
    }
}

if (document.title.trim() === "Forgot Password") {
    const forgotForm = document.getElementById("forgotForm");
    const codeForm = document.getElementById("codeForm");
    const resetForm = document.getElementById("resetForm");
    const emailStep = document.getElementById("emailStep");
    const codeStep = document.getElementById("codeStep");
    const passwordStep = document.getElementById("passwordStep");
    const emailInput = document.getElementById("resetEmail");
    const codeInput = document.getElementById("resetCode");
    const sentEmail = document.getElementById("sentEmail");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");

    let resetEmail = "";
    let resetToken = "";

    if (forgotForm) {
        forgotForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const email = emailInput.value.trim().toLowerCase();

            if (!email) {
                alert("Please enter your email.");
                return;
            }

            try {
                const response = await fetch("/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    resetEmail = email;
                    sentEmail.textContent = email;
                    emailStep.style.display = "none";
                    codeStep.style.display = "block";
                    alert("Verification code sent to your email.");
                } else {
                    alert(data.message || "Unable to send verification code.");
                }
            } catch (error) {
                console.error("Forgot password error:", error);
                alert("Cannot connect to the server.");
            }
        });
    }

    if (codeForm) {
        codeForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const code = codeInput.value.trim();

            if (!/^\d{6}$/.test(code)) {
                alert("Please enter the 6-digit verification code.");
                return;
            }

            try {
                const response = await fetch("/verify-reset-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: resetEmail, code })
                });

                const data = await response.json();

                if (response.ok) {
                    resetToken = data.resetToken;
                    codeStep.style.display = "none";
                    passwordStep.style.display = "block";
                    alert("Code verified successfully!");
                } else {
                    alert(data.message || "Invalid verification code.");
                }
            } catch (error) {
                console.error("Code verification error:", error);
                alert("Cannot connect to the server.");
            }
        });
    }



if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmNewPassword").value;

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (!resetToken) {
            alert("Please verify the code first.");
            return;
        }

        try {
            const response = await fetch("/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    resetToken: resetToken,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            console.log("Reset password response:", data);

            if (!data.ok) {
                alert(data.error);
                return;
            }

            alert("Password changed successfully!");

            window.location.href = "index.html";

        } catch (error) {
            console.error("Reset password error:", error);
            alert("Unable to change password.");
        }
    });
}
}