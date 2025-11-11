import CONFIG from "../config";

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
};

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, password) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.error) throw new Error(result.message);
    localStorage.setItem("token", result.loginResult.token);
    console.log("Token tersimpan:", result.loginResult.token);

    return result;
  } catch (error) {
    console.error("Gagal login:", error);
    return { error: true, message: error.message };
  }
}

export async function register(name, email, password) {
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const result = await response.json();
    if (result.error) throw new Error(result.message);
    return result;
  } catch (error) {
    console.error("Gagal register:", error);
    return { error: true, message: error.message };
  }
}

export async function getData() {
  try {
    const response = await fetch(ENDPOINTS.STORIES, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error("Gagal mengambil data");
    return await response.json();
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil data:", error);
    return [];
  }
}

export async function postData(description, photo, lat, lon) {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);
  if (lat && lon) {
    formData.append("lat", lat);
    formData.append("lon", lon);
  }

  try {
    const response = await fetch(ENDPOINTS.STORIES, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gagal mengirim data: ${errText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Terjadi kesalahan saat menambahkan data:", error);
    return { error: true, message: error.message };
  }
}