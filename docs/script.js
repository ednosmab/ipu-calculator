document.addEventListener('DOMContentLoaded', () => {
    const contentEl = document.getElementById('content');
    const navMenuEl = document.getElementById('nav-menu');
    const menuToggleBtn = document.getElementById('menu-toggle'); // Botão mobile
    const closeMenuBtn = document.getElementById('close-menu'); // Fechar mobile
    const collapseSidebarBtn = document.getElementById('collapse-sidebar'); // Recolher desktop
    const expandSidebarBtn = document.getElementById('expand-sidebar'); // Expandir desktop
    const sidebar = document.getElementById('sidebar');
    const contentArea = document.getElementById('content-area');
    const overlay = document.getElementById('overlay');

    let chapters = [];

    // Lógica Mobile
    function toggleMobileMenu() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }

    menuToggleBtn.addEventListener('click', toggleMobileMenu);
    closeMenuBtn.addEventListener('click', toggleMobileMenu);
    overlay.addEventListener('click', toggleMobileMenu);

    // Lógica Desktop (Collapse/Expand)
    function collapseSidebar() {
        sidebar.classList.add('collapsed');
        contentArea.classList.add('expanded');
        expandSidebarBtn.classList.remove('hidden');
    }

    function expandSidebar() {
        sidebar.classList.remove('collapsed');
        contentArea.classList.remove('expanded');
        expandSidebarBtn.classList.add('hidden');
    }

    collapseSidebarBtn.addEventListener('click', collapseSidebar);
    expandSidebarBtn.addEventListener('click', expandSidebar);

    // Carrega o markdown diretamente da variável global injetada por data.js
    if (typeof markdownContent !== 'undefined') {
        processMarkdown(markdownContent);
    } else {
        contentEl.innerHTML = `<div style="color: var(--error)">Erro: Variável markdownContent não encontrada. Certifique-se de que data.js foi carregado corretamente.</div>`;
    }

    function processMarkdown(markdown) {
        // Separa o texto pelo "## " no início de uma linha
        const sections = markdown.split(/\n(?=## )/);
        
        // Seção 0 = Introdução
        chapters.push({
            id: 'introducao',
            title: 'Introdução',
            content: sections[0]
        });

        for (let i = 1; i < sections.length; i++) {
            const section = sections[i];
            const firstLineEnd = section.indexOf('\n');
            const headerLine = firstLineEnd !== -1 ? section.substring(0, firstLineEnd) : section;
            
            const title = headerLine.replace(/^##\s+/, '').trim();
            const id = createSlug(title);
            
            if (id === 'indice') continue;

            chapters.push({
                id,
                title,
                content: section
            });
        }

        buildNavigation();
        handleRoute();
    }

    function createSlug(text) {
        return text.toString().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    function buildNavigation() {
        navMenuEl.innerHTML = '';
        
        chapters.forEach(chapter => {
            const link = document.createElement('a');
            link.href = `#${chapter.id}`;
            link.className = 'nav-link';
            link.textContent = chapter.title;
            link.dataset.id = chapter.id;
            
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    toggleMobileMenu();
                }
            });

            navMenuEl.appendChild(link);
        });
    }

    function renderChapter(id) {
        const chapter = chapters.find(c => c.id === id) || chapters[0];
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.id === chapter.id) {
                link.classList.add('active');
            }
        });

        let html = marked.parse(chapter.content);

        // Se for a introdução, adiciona o ícone no topo do conteúdo
        if (id === 'introducao') {
            const logoHtml = `
            <div class="intro-logo-container">
                <img src="favicon.ico" alt="IPU Calculator Ícone" class="intro-logo">
            </div>`;
            html = logoHtml + html;
        }

        contentEl.innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleRoute() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            renderChapter(hash);
        } else {
            renderChapter(chapters[0].id);
        }
    }

    window.addEventListener('hashchange', handleRoute);
});
