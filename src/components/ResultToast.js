import './ResultToast.css';

export function showResultToast(message) {
  let toast = document.getElementById('dots-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dots-toast';
    toast.className = 'dots-toast';
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}