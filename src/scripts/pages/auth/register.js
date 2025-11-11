import { register} from "../../data/api.js";

export default class RegisterPage {
  async render() {
    return `
      <section class="container">
        <h1>Register</h1>
        <form id="register-form" aria-label="Register Form">
          <label for="name">Nama</label>
          <input id="name" type="text" required />

          <label for="email">Email</label>
          <input id="email" type="email" required />

          <label for="password">Password</label>
          <input id="password" type="password" required />

          <button type="submit">Daftar</button>
          <p>Sudah punya akun? <a href="#/login">Masuk</a></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector("#register-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameVal = form.querySelector("#name").value;
      const emailVal = form.querySelector("#email").value;
      const passwordVal = form.querySelector("#password").value;

      const result = await registerUser(nameVal, emailVal, passwordVal);

      if (result.error) {
        alert("Registrasi gagal: " + result.message);
      } else {
        alert("Registrasi berhasil! Silakan login.");
        location.hash = "/login";
      }
    });
  }
}