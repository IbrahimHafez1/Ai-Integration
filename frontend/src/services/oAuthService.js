export function redirectToSlack() {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/slack`;
}

export function redirectToGoogle() {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
}

export function redirectToZoho() {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/zoho`;
}
