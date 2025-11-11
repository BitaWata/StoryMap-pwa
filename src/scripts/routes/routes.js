import HomePage from "../pages/home/home-page";
import Login from "../pages/auth/login.js";
import Register from "../pages/auth/register.js";
import AddStory from "../pages/add/add-story.js";

const routes = {
  "/": new HomePage(),
  "/login": new Login(),
  "/register": new Register(),
  "/add": new AddStory(),
};

export default routes;