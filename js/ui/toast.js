/**
 * UI - Toast Notification System
 * Non-intrusive feedback toast messages
 */
window.MARS_UI = window.MARS_UI || {};

class Toast {
    static show(message, type = 'info', duration = 3200) {
        let container = document.getElementById('mars-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mars-toast-container';
            container.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const bgColors = {
            info: 'bg-slate-900/90 text-sky-300 border-sky-400/40',
            success: 'bg-slate-900/90 text-emerald-300 border-emerald-400/40',
            warning: 'bg-slate-900/90 text-amber-300 border-amber-400/40',
            error: 'bg-slate-900/90 text-rose-300 border-rose-400/40'
        };

        const iconClass = {
            info: 'ph-info',
            success: 'ph-check-circle',
            warning: 'ph-warning',
            error: 'ph-x-circle'
        }[type] || 'ph-info';

        toast.className = `flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium shadow-2xl backdrop-blur-md transition-all duration-300 opacity-0 translate-y-2 pointer-events-auto ${bgColors[type] || bgColors.info}`;
        toast.innerHTML = `<i class="ph-bold ${iconClass} text-sm"></i><span>${message}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('opacity-0', 'translate-y-2');
            toast.classList.add('opacity-100', 'translate-y-0');
        });

        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

window.MARS_UI.Toast = Toast;
