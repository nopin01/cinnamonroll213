const API_BASE_URL = "http://localhost:3000";
const TOKEN_STORAGE_KEY = "cinnamorollToken";
const REMEMBERED_EMAIL_KEY = "cinnamorollRememberMe";

async function sendApiRequest(path, body) {
    const response = await fetch(`${API_BASE_URL}/api/auth${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await response.json();
    return { response, data };
}

if (document.title.trim() === "Register") {
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async event => {
            event.preventDefault();

            const fullName = document.getElementById("fullName").value.trim();
            const username = document.getElementById("itxtbox").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("ipassbox").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            try {
                const { response, data } = await sendApiRequest("/register", {
                    fullName,
                    username,
                    email,
                    password,
                    confirmPassword
                });

                if (!response.ok) {
                    alert(data.message || "Registration failed.");
                    return;
                }

                localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
                alert(data.message || "Account created successfully.");
                window.location.href = "home.html";
            } catch (error) {
                console.error("Registration error:", error);
                alert("Cannot connect to the server.");
            }
        });
    }
}

if (document.title.trim() === "Login") {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("itxtbox");
    const passwordInput = document.getElementById("ipassbox");
    const rememberMe = document.getElementById("chkb2");
    const emailLabel = loginForm && loginForm.querySelector("label");

    if (emailLabel) {
        const labelText = Array.from(emailLabel.childNodes).find(node =>
            node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );
        if (labelText) labelText.textContent = "Email ";
    }
    if (emailInput) {
        emailInput.type = "email";
        emailInput.autocomplete = "email";
    }

    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberMe) rememberMe.checked = true;
    }

    if (rememberMe) {
        rememberMe.addEventListener("change", () => {
            if (!rememberMe.checked) {
                localStorage.removeItem(REMEMBERED_EMAIL_KEY);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async event => {
            event.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            try {
                const { response, data } = await sendApiRequest("/login", { email, password });
                if (!response.ok) {
                    alert(data.message || "Invalid email or password.");
                    return;
                }

                localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
                if (rememberMe && rememberMe.checked) {
                    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
                } else {
                    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
                }

                alert(data.message || "Login successful.");
                window.location.href = "home.html";
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
    let resetEmail = "";
    let resetToken = "";

    if (forgotForm) {
        forgotForm.addEventListener("submit", async event => {
            event.preventDefault();
            resetEmail = emailInput.value.trim();

            try {
                const { response, data } = await sendApiRequest("/forgot-password", { email: resetEmail });
                if (!response.ok) {
                    alert(data.message || "Unable to send verification code.");
                    return;
                }
                sentEmail.textContent = resetEmail;
                emailStep.style.display = "none";
                codeStep.style.display = "block";
                alert(data.message);
            } catch (error) {
                console.error("Forgot password error:", error);
                alert("Cannot connect to the server.");
            }
        });
    }

    if (codeForm) {
        codeForm.addEventListener("submit", async event => {
            event.preventDefault();

            try {
                const { response, data } = await sendApiRequest("/verify-reset-code", {
                    email: resetEmail,
                    code: codeInput.value.trim()
                });
                if (!response.ok) {
                    alert(data.message || "Invalid verification code.");
                    return;
                }
                resetToken = data.resetToken;
                codeStep.style.display = "none";
                passwordStep.style.display = "block";
                alert(data.message);
            } catch (error) {
                console.error("Code verification error:", error);
                alert("Cannot connect to the server.");
            }
        });
    }

    if (resetForm) {
        resetForm.addEventListener("submit", async event => {
            event.preventDefault();
            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmNewPassword").value;

            if (newPassword !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }
            if (!resetToken) {
                alert("Please verify the code first.");
                return;
            }

            try {
                const { response, data } = await sendApiRequest("/reset-password", {
                    resetToken,
                    newPassword
                });
                if (!response.ok) {
                    alert(data.message || "Unable to change password.");
                    return;
                }
                alert(data.message || "Password changed successfully.");
                window.location.href = "index.html";
            } catch (error) {
                console.error("Reset password error:", error);
                alert("Cannot connect to the server.");
            }
        });
    }
}
