import { db, appId, escapeHTML, state } from './firebase-init.js';
import { deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

function normalizeInstagramUrl(value) {
    try {
        const parsed = new URL(value || '');
        if (!/^https?:$/.test(parsed.protocol)) return '';
        if (!(parsed.hostname === 'instagram.com' || parsed.hostname.endsWith('.instagram.com'))) return '';
        if (!/^\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/.test(parsed.pathname)) return '';
        return 'https://www.instagram.com' + parsed.pathname.replace(/\/$/, '') + '/';
    } catch (_) { return ''; }
}

export function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    if (!grid.dataset.deleteHandlerReady) {
        grid.dataset.deleteHandlerReady = 'true';
        grid.addEventListener('click', event => {
            const button = event.target.closest('[data-gallery-delete]');
            if (button) window.deleteGalleryPhoto(button.dataset.galleryDelete);
        });
    }
    if (!state.gallery.length) {
        grid.innerHTML = '<div class="col-span-full bg-white/90 p-8 rounded-3xl text-center text-stone-400 border border-stone-200">Nenhum post cadastrado. Os posts adicionados pelo painel aparecerão aqui.</div>';
        return;
    }
    grid.innerHTML = state.gallery.map(g => {
        const url = normalizeInstagramUrl(g.instagramUrl);
        if (!url) return '';
        const caption = escapeHTML(g.caption || 'Momento especial do casal 💍');
        const image = g.imageUrl ? '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="block h-56 bg-stone-100 overflow-hidden"><img src="' + escapeHTML(g.imageUrl) + '" alt="' + caption + '" loading="lazy" class="w-full h-full object-cover" onerror="this.parentElement.remove()"></a>' : '';
        const adminTools = state.isAdminLoggedIn
            ? '<div class="absolute top-3 right-3 z-30"><button type="button" data-gallery-delete="' + escapeHTML(g.id) + '" class="px-2.5 py-1 bg-red-600 text-white rounded-xl text-xs font-bold shadow cursor-pointer hover:bg-red-700">Excluir</button></div>'
            : '';
        return '<article class="bg-white rounded-3xl overflow-hidden border border-stone-200 shadow-sm flex flex-col group relative min-w-0">' +
            adminTools + image +
            '<div class="p-3 min-w-0"><blockquote class="instagram-media" data-instgrm-permalink="' + url + '" data-instgrm-version="14" data-instgrm-captioned style="background:#fff;border:0;border-radius:12px;box-shadow:none;margin:0 auto;max-width:540px;min-width:0;width:100%;"><a href="' + url + '" target="_blank" rel="noopener noreferrer">Ver esta publicação no Instagram</a></blockquote>' +
            '<p class="text-xs text-stone-600 mt-2 line-clamp-3">' + caption + '</p>' +
            '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex w-full justify-center items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors"><i data-lucide="instagram" class="w-4 h-4"></i> Abrir post no Instagram</a></div></article>';
    }).join('');

    if (window.lucide) lucide.createIcons();
    const processEmbeds = () => { try { window.instgrm?.Embeds?.process(); } catch (_) {} };
    if (window.instgrm?.Embeds) processEmbeds();
    else {
        let script = document.getElementById('instagram-embed-script');
        if (!script) {
            script = document.createElement('script');
            script.id = 'instagram-embed-script';
            script.async = true;
            script.src = 'https://www.instagram.com/embed.js';
            document.head.appendChild(script);
        }
        script.addEventListener('load', processEmbeds, { once: true });
    }
}

window.deleteGalleryPhoto = (id) => {
    window.openDeleteModal('Deseja realmente remover este post da galeria?', async () => {
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gallery', id));
            window.showToast('Post removido com sucesso!');
        } catch (_) { window.showToast('Erro ao excluir post.', true); }
    });
};
