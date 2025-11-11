import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
    this.#setupLogout(); 
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  #setupLogout() {
    document.body.addEventListener("click", (event) => {
      if (event.target.id === "logout-link") {
        event.preventDefault();
        localStorage.removeItem("isLoggedIn");
        alert("Anda telah keluar dari aplikasi.");
        window.location.hash = "#/login";
      }
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        this.#content.innerHTML = `<div class="page">${await page.render()}</div>`;

        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const logoutLink = document.getElementById("logout-link");
        if (logoutLink) {
          logoutLink.style.display = isLoggedIn ? "block" : "none";
        }

        requestAnimationFrame(() => {
          this.#content.querySelector(".page").classList.add("active");
        });
        await page.afterRender();
      });
    } else {
      this.#content.innerHTML = `<div class="page">${await page.render()}</div>`;

      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      const logoutLink = document.getElementById("logout-link");
      if (logoutLink) {
        logoutLink.style.display = isLoggedIn ? "block" : "none";
      }

      requestAnimationFrame(() => {
        this.#content.querySelector(".page").classList.add("active");
      });

      await page.afterRender();
    }
  }
}

export default App;