const SHEET_API = 'https://script.google.com/macros/s/AKfycbxdxUvmwLS3_nETwGLk4J8ipPq2LYNSWyhJ2ZwVsEJQgONG11NSSX3jVaeqWCU1TXvE5g/exec';
const liffId = '2007421084-2OgzWbpV';

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loadingOverlay');

  try {
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const userId = profile.userId;

    const res = await fetch(`${SHEET_API}?action=check_admin&userId=${userId}`);
    const result = await res.json();

    if (result.isAdmin) {
      window.location.href = 'main_admin.html';
    } else {
      document.getElementById('userView').classList.remove('hidden');
    }

  } catch (err) {
    await liff.closeWindow();
  } finally {
    loading.classList.add('hidden');
  }
});

