import { login } from "../../data/api.js";

export default class Login {
  async render() {
    return `
      <section class="container">
        <h1>Login</h1>
        <form id="login-form" aria-label="Login Form">
          <label for="email">Email</label>
          <input id="email" type="email" required />

          <label for="password">Password</label>
          <input id="password" type="password" required />

          <button type="submit">Masuk</button>
          <p>Belum punya akun? <a href="#/register">Daftar</a></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector("#login-form");
    
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const userEmail = form.querySelector("#email").value;
      const userPassword = form.querySelector("#password").value;

      try {
        const res = await login(userEmail, userPassword);
        if (res.error) throw new Error(res.message);

        localStorage.setItem("isLoggedIn", "true");
        if (res.loginResult?.token) {
          localStorage.setItem("token", res.loginResult.token);
        }

        alert("Login berhasil!");
        location.hash = "/";
      } catch (err) {
        alert("Login gagal: " + err.message);
      }
    });
  }
}