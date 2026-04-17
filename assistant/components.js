/**
 * Stellaris Academy - Universal Component Logic (components.js)
 * This script is shared across all portal pages to ensure a unified UI & functional experience.
 */

// --- 1. Global State & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    injectGlobalStyles();
    initAuth();
    initSidebar();
    initDarkMode();
    initToasts();
    injectUserInfo();
});

function injectGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Professional Midnight Academic Theme & Layout Reset */
        :root {
            --primary: #001e40;
            --primary-container: #003366;
            --secondary: #496177;
            --surface: #f8f9fa;
            --on-surface: #191c1d;
            --on-surface-variant: #43474f;
            --background: #ffffff;
            --outline-variant: rgba(195, 199, 209, 0.3);
            --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        :root.dark {
            --primary: #a7c8ff;
            --primary-container: #004a77;
            --secondary: #b0c9e3;
            --surface: #121416;
            --on-surface: #e1e3e4;
            --on-surface-variant: #c3c7d1;
            --background: #000000;
            --outline-variant: rgba(255, 255, 255, 0.1);
        }

        body {
            background-color: var(--background);
            color: var(--on-surface);
            transition: var(--transition);
        }

        .bg-surface { background-color: var(--surface); }
        .text-primary { color: var(--primary); }
        .text-on-surface { color: var(--on-surface); }
        .text-on-surface-variant { color: var(--on-surface-variant); }

        /* Inline Edit Styling */
        .inline-edit-input {
            @apply w-full bg-primary/5 dark:bg-primary/20 border-b-2 border-primary px-2 py-1 rounded-t-sm outline-none focus:bg-primary/10 transition-colors font-bold text-sm;
        }

        html, body {
            max-width: 100vw;
            overflow-x: hidden;
            scroll-behavior: smooth;
        }

        /* Standardized Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.02);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(0, 30, 64, 0.1);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 30, 64, 0.2);
        }

        /* Responsive Layout Fixes */
        .page-view {
            width: 100%;
            max-width: 80rem; /* 1280px */
            margin: 0 auto;
        }

        @media (max-width: 768px) {
            .hide-on-mobile { display: none !important; }
            .stack-on-mobile { flex-direction: column !important; }
            header { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
            h1 { font-size: 1.85rem !important; }
        }

        /* Interactive Elements */
        .unimplemented-btn, a[href="#"] {
            cursor: pointer;
        }

        .active-link {
            @apply bg-primary/5 text-primary font-bold border-r-4 border-primary shadow-sm;
        }
    `;
    document.head.appendChild(style);
}

// --- 2. Authentication & Role-Based Routing ---
function initAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isLoginPage = window.location.pathname.includes('reg/code.html') || window.location.pathname === '/' || window.location.pathname.endsWith('index.html');

    if (!currentUser && !isLoginPage) {
        // Not logged in and not on login page -> Redirect to login
        window.location.href = '../reg/code.html';
        return;
    }

    if (currentUser && isLoginPage) {
        // Already logged in and on login page -> Redirect to dashboard
        redirectToDashboard(currentUser.role);
    }
}

function redirectToDashboard(role) {
    const routeMap = {
        'head_manager': '../dean/code.html',
        'manager': '../manager/code.html',
        'teacher': '../teacher/code.html',
        'student': '../student/code.html',
        'secretary': '../secrtary/code.html'
    };
    window.location.href = routeMap[role] || '../reg/code.html';
}

// --- 3. Unified Dynamic Sidebar ---
function initSidebar() {
    const sidebarContainer = document.getElementById('global-sidebar');
    if (!sidebarContainer) return;

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const role = user.role;
    const links = getRoleLinks(role);

    sidebarContainer.className = "fixed left-0 top-0 h-full flex flex-col py-6 px-4 bg-[#f8f9fa] dark:bg-slate-950 text-[#001e40] dark:text-blue-400 font-manrope text-sm font-medium h-screen w-64 border-r border-transparent flex-shrink-0 z-50 transition-transform duration-300 -translate-x-full md:translate-x-0 shadow-2xl md:shadow-none";
    
    let linksHtml = '';
    links.forEach(link => {
        const isActive = link.active ? 'bg-[#edeeef] dark:bg-slate-800 font-bold border-r-4 border-[#001e40] dark:border-blue-400 scale-95' : 'text-[#4d657b] dark:text-slate-400 hover:text-[#001e40] dark:hover:text-white hover:bg-[#edeeef] dark:hover:bg-slate-800 scale-95';
        linksHtml += `
            <a class="flex items-center px-4 py-3 rounded-lg ${isActive} transition-all duration-200" href="${link.href}">
                <span class="material-symbols-outlined mr-3">${link.icon}</span>
                ${link.text}
            </a>
        `;
    });

    sidebarContainer.innerHTML = `
        <div class="mb-8 px-4 flex justify-between items-center">
            <div>
                <span class="text-xl font-bold text-[#001e40] dark:text-white tracking-tight"><a href="#">Stellaris</a></span>
                <div class="text-xs text-[#4d657b] mt-1">Institutional Portal</div>
            </div>
            <button id="mobile-sidebar-close" class="md:hidden text-outline hover:text-primary"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="flex-1 space-y-2">
            ${linksHtml}
        </div>
        <div class="mt-auto px-4">
            <button class="w-full bg-primary text-on-primary py-2 px-4 rounded-md font-medium text-sm flex items-center justify-center mb-6 bg-gradient-to-br from-primary to-primary-container unimplemented-btn">
                <span class="material-symbols-outlined mr-2 text-sm">add</span> Quick Action
            </button>
            <a class="flex items-center py-2 text-[#4d657b] hover:text-[#001e40] transition-colors unimplemented-btn" href="#">
                <span class="material-symbols-outlined mr-3">help_outline</span>
                Help Center
            </a>
            <button onclick="logout()" class="flex items-center py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold transition-colors mt-2">
                <span class="material-symbols-outlined mr-3">logout</span>
                Log Out
            </button>
        </div>
    `;

    // Responsive Overlay & Toggle Setup
    const overlayHTML = '<div id="sidebar-overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden opacity-0 transition-opacity duration-300 md:hidden"></div>';
    document.body.insertAdjacentHTML('beforeend', overlayHTML);
    const overlay = document.getElementById('sidebar-overlay');
    const closeBtn = document.getElementById('mobile-sidebar-close');

    const toggleSidebar = () => {
        const isOpen = !sidebarContainer.classList.contains('-translate-x-full');
        if (isOpen) {
            sidebarContainer.classList.add('-translate-x-full');
            overlay.classList.add('hidden', 'opacity-0');
        } else {
            sidebarContainer.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
        }
    };

    overlay.addEventListener('click', toggleSidebar);
    closeBtn.addEventListener('click', toggleSidebar);

    // Find all headers and inject a hamburger menu if not already present
    setTimeout(() => {
        const headers = document.querySelectorAll('header');
        headers.forEach(header => {
            const firstContainer = header.firstElementChild;
            if (firstContainer) {
                // Ensure the header contents shift appropriately or we just prepend a toggle button
                const toggleHTML = `
                    <button class="md:hidden mr-4 text-primary dark:text-blue-200 hover:bg-surface-variant p-2 rounded-md transition-colors mobile-sidebar-toggle">
                        <span class="material-symbols-outlined">menu</span>
                    </button>
                `;
                firstContainer.insertAdjacentHTML('afterbegin', toggleHTML);
            }
        });

        document.querySelectorAll('.mobile-sidebar-toggle').forEach(btn => {
            btn.addEventListener('click', toggleSidebar);
        });
    }, 100);
}

function getRoleLinks(role) {
    const common = [{ icon: 'dashboard', text: 'Dashboard', href: '#dashboard', active: true }];
    const roleMap = {
        'head_manager': [
            ...common,
            { icon: 'calendar_month', text: 'Master Schedule', href: '#master-schedule' },
            { icon: 'meeting_room', text: 'MPR Requests', href: '#mpr-requests' },
            { icon: 'room_preferences', text: 'Room Allocation', href: '#room-allocation' },
            { icon: 'group_work', text: 'Faculty Board', href: '#faculty-board' }
        ],
        'manager': [
            ...common,
            { icon: 'calendar_month', text: 'Branch Schedule', href: '#branch-schedule' },
            { icon: 'person_add', text: 'Approvals', href: '#approvals' },
            { icon: 'groups', text: 'Staffing', href: '#staffing' },
            { icon: 'inventory_2', text: 'Inventory', href: '#inventory' },
            { icon: 'bar_chart', text: 'Reports', href: '#reports' }
        ],
        'teacher': [
            ...common,
            { icon: 'meeting_room', text: 'Room Search', href: '#room-search' },
            { icon: 'event_available', text: 'My Bookings', href: '#my-bookings' },
            { icon: 'school', text: 'Student List', href: '#student-list' },
            { icon: 'calendar_month', text: 'Admin Calendar', href: '#admin-calendar' }
        ],
        'student': [
            ...common,
            { icon: 'calendar_view_week', text: 'My Schedule', href: '#my-schedule' },
            { icon: 'grade', text: 'Grades', href: '#grades' },
            { icon: 'library_books', text: 'Course Material', href: '#course-material' },
            { icon: 'how_to_reg', text: 'Registration', href: '#registration' }
        ],
        'secretary': [
            ...common,
            { icon: 'meeting_room', text: 'Incoming MPRs', href: '#incoming-mprs' },
            { icon: 'rule', text: 'Guidelines', href: '#guidelines' },
            { icon: 'help', text: 'Help Center', href: '#help-center' }
        ]
    };
    return roleMap[role] || common;
}

window.logout = function() {
    localStorage.removeItem('currentUser');
    window.location.href = '../reg/code.html';
};

// --- 4. Global Dark Mode & Name Injection ---
function initDarkMode() {
    const htmlElement = document.documentElement;
    const isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) htmlElement.classList.add('dark');
    else htmlElement.classList.remove('dark');

    // Attach to any theme-toggle buttons found on the page
    document.querySelectorAll('#theme-toggle, [data-theme-toggle]').forEach(btn => {
        const updateIcon = (dark) => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) icon.textContent = dark ? 'dark_mode' : 'light_mode';
        };
        
        updateIcon(htmlElement.classList.contains('dark'));

        btn.addEventListener('click', () => {
            htmlElement.classList.toggle('dark');
            const nowDark = htmlElement.classList.contains('dark');
            localStorage.setItem('theme', nowDark ? 'dark' : 'light');
            updateIcon(nowDark);
            
            // Dispatch event for components that might need to re-render with new colors
            window.dispatchEvent(new Event('themeChanged'));
        });
    });
}

function injectUserInfo() {
    const user = StateManager.getCurrentUser();
    if (!user) return;

    // Inject Name (Dynamic Greeting)
    document.querySelectorAll('.user-name-display').forEach(el => {
        el.innerText = `Welcome back, ${user.name}.`;
    });

    // Update Avatar Tooltips & Sources if needed
    document.querySelectorAll('img[alt*="Avatar"], img[alt*="Profile"]').forEach(img => {
        img.title = user.name;
    });
}

// Global Schedule Renderer Relay
window.renderSchedule = function() {
    // Check for dashboard specific schedule containers
    const dashContainer = document.getElementById('grid-schedule-container'); 
    if (dashContainer) {
        StateManager.renderGlobalSchedule('grid-schedule-container');
    }
    // Check for SPA specific one
    const centralContainer = document.getElementById('central-schedule-container');
    if (centralContainer) {
        StateManager.renderGlobalSchedule('central-schedule-container');
    }
};


// --- 5. Global Toast Module & Unimplemented Clicks ---
function initToasts() {
    const toastHTML = `
        <div id="global-toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-primary text-on-primary font-body font-semibold text-sm rounded-lg shadow-xl opacity-0 pointer-events-none transition-all duration-300 translate-y-4">
            Action coming soon in full release
        </div>
    `;
    if (!document.getElementById('global-toast')) {
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }

    window.showToast = function(message) {
        const toast = document.getElementById('global-toast');
        toast.innerText = message || "Feature coming soon.";
        toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
        toast.classList.add('opacity-100', 'translate-y-0');
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
            toast.classList.remove('opacity-100', 'translate-y-0');
        }, 3000);
    };

    // Global listener for unimplemented buttons (only intercept dummy hash #)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a[href="#"], button:not([id]), .unimplemented-btn, [onclick^="#"]');
        if (target) {
            // If it's a link to a router hash, ignore fake intercept
            const href = target.getAttribute('href') || target.getAttribute('onclick');
            if (href && href.startsWith('#') && href.length > 1 && !target.classList.contains('unimplemented-btn')) return;

            // Check if it's already handled by a script
            if (target.id === 'theme-toggle' || target.getAttribute('onclick')?.includes('logout') || target.classList.contains('handled')) return;
            if (target.tagName === 'BUTTON' && target.id) return;
            
            e.preventDefault();
            let actionName = target.innerText.trim();
            if (!actionName) {
                const icon = target.querySelector('.material-symbols-outlined');
                if (icon) actionName = icon.textContent.trim();
            }
            actionName = actionName.split('\n')[0].trim();
            if (actionName && actionName.length > 25) actionName = "This feature";
            if (!actionName) actionName = "Action";

            const user = StateManager.getCurrentUser();
            const roleName = user ? user.role.replace('_', ' ').toUpperCase() : 'USER';
            window.showToast(`[${roleName}] "${actionName}" currently in simulation. Full logic coming soon.`);
        }
    });
}


