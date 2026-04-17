/**
 * Stellaris Academy - State & Router Manager
 * Centralizes localStorage operations and SPA view switching.
 */

window.StateManager = {
    // --- 1. User Data & Authentication ---
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    },
    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    },
    updateUserStatus(userId, status) {
        const users = this.getUsers();
        const user = users.find(u => u.id == userId);
        if (user) {
            user.status = status;
            localStorage.setItem('users', JSON.stringify(users));
            this.emit('UsersUpdated');
        }
    },

    // --- 2. Master Schedule API ---
    getSchedule() {
        const defaultSchedule = {
            'mon-9': { title: 'Calculus III', room: 'Math 301', prof: 'Dr. Jones', color: 'primary' },
            'tue-10:30': { title: 'Adv. Quantum', room: 'Phys 410', prof: 'Dr. Marcus Johnson', color: 'secondary' },
            'wed-9': { title: 'Calculus III', room: 'Math 301', prof: 'Dr. Jones', color: 'primary' },
            'thu-10:30': { title: 'Adv. Quantum', room: 'Phys 410', prof: 'Dr. Marcus Johnson', color: 'secondary' },
            'fri-9': { title: 'Calculus III', room: 'Math 301', prof: 'Dr. Jones', color: 'primary' },
            'mon-1': { title: 'Modern Lit', room: 'Eng 205', prof: 'Prof. Smith', color: 'surface' },
            'wed-1': { title: 'Modern Lit', room: 'Eng 205', prof: 'Prof. Smith', color: 'surface' }
        };
        return JSON.parse(localStorage.getItem('masterSchedule')) || defaultSchedule;
    },
    updateSchedule(slotId, newClassData) {
        const schedule = this.getSchedule();
        schedule[slotId] = newClassData;
        localStorage.setItem('masterSchedule', JSON.stringify(schedule));
        this.emit('ScheduleUpdated');
    },

    // --- 3. Requests Workflow API ---
    getRequests() {
        return JSON.parse(localStorage.getItem('roomRequests')) || [];
    },
    createRequest(requestParams) {
        const reqs = this.getRequests();
        reqs.push({
            id: Date.now(),
            ...requestParams
        });
        localStorage.setItem('roomRequests', JSON.stringify(reqs));
        this.emit('RequestsUpdated');
    },
    updateRequestStatus(reqId, status) {
        const reqs = this.getRequests();
        const idx = reqs.findIndex(r => r.id == reqId);
        if (idx !== -1) {
            reqs[idx].status = status;
            localStorage.setItem('roomRequests', JSON.stringify(reqs));
            
            // Generate cross-role notifications
            if (status === 'Approved') {
                this.createNotification('secretary', `Manager has Approved the room request for ${reqs[idx].name}.`);
                this.createNotification('teacher', `Your request for ${reqs[idx].name} has been Approved.`);
            }
            if (status === 'Denied') {
                this.createNotification('teacher', `Your request for ${reqs[idx].name} has been Denied.`);
            }

            this.emit('RequestsUpdated');
            return true;
        }
        return false;
    },

    updateRequest(reqId, newData) {
        const reqs = this.getRequests();
        const idx = reqs.findIndex(r => r.id == reqId);
        if (idx !== -1) {
            reqs[idx] = { ...reqs[idx], ...newData };
            localStorage.setItem('roomRequests', JSON.stringify(reqs));
            this.emit('RequestsUpdated');
            return true;
        }
        return false;
    },

    // --- 4. Messaging System API (3-Way) ---
    getMessages() {
        return JSON.parse(localStorage.getItem('teacherMessages')) || [];
    },
    createMessage(content, sender = 'Teacher') {
        const msgs = this.getMessages();
        const newMsg = {
            id: Date.now(),
            content: content,
            sender: sender,
            timestamp: new Date().toISOString(),
            status: 'Pending'
        };
        msgs.push(newMsg);
        localStorage.setItem('teacherMessages', JSON.stringify(msgs));
        
        // Notify Dean
        this.createNotification('head_manager', `New Message from ${sender}: ${content.substring(0, 20)}...`);
        this.emit('MessagesUpdated');
        return newMsg;
    },
    updateMessageStatus(msgId, status) {
        const msgs = this.getMessages();
        const idx = msgs.findIndex(m => m.id == msgId);
        if (idx !== -1) {
            msgs[idx].status = status;
            localStorage.setItem('teacherMessages', JSON.stringify(msgs));
            
            // Notify Teacher & Secretary
            if (status === 'Approved' || status === 'Rejected') {
                this.createNotification('teacher', `The Dean has ${status} your request.`);
                this.createNotification('secretary', `Institutional Decision: Request #${msgId} was ${status} by Dean.`);
            }
            
            this.emit('MessagesUpdated');
            return true;
        }
        return false;
    },

    // --- 4. Notifications API ---
    getNotifications(roleKey) {
        // roleKey e.g. 'secretary', 'teacher', 'manager'
        return JSON.parse(localStorage.getItem(`${roleKey}Notifs`)) || [];
    },
    createNotification(roleKey, message) {
        const notifs = this.getNotifications(roleKey);
        notifs.push({
            id: Date.now(),
            text: message,
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem(`${roleKey}Notifs`, JSON.stringify(notifs));
        this.emit(`${roleKey}NotifsUpdated`);
    },
    clearNotifications(roleKey) {
        localStorage.removeItem(`${roleKey}Notifs`);
        this.emit(`${roleKey}NotifsUpdated`);
    },

    // --- 5. Event Emitter Logic ---
    events: {},
    on(event, listener) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(listener);
    },
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }
};

// Cross-Tab Synchronization Logic
window.addEventListener('storage', (e) => {
    if (e.key === 'teacherMessages' || e.key === 'roomRequests' || e.key.includes('Notifs')) {
        // Trigger global emits to update local views in all tabs
        if (e.key === 'teacherMessages') StateManager.emit('MessagesUpdated');
        if (e.key === 'roomRequests') StateManager.emit('RequestsUpdated');
        if (e.key.includes('Notifs')) {
            const role = e.key.replace('Notifs', '');
            StateManager.emit(`${role}NotifsUpdated`);
        }
    }
});

/**
 * Single Page Application Router
 * Switches views dynamically securely maintaining events.
 */
window.Router = {
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        // Small delay to allow DOM to finish rendering
        setTimeout(() => this.handleRoute(), 100);
    },
    navigate(hash) {
        window.location.hash = hash;
    },
    handleRoute() {
        const hash = window.location.hash || '#dashboard';
        const targetViewId = 'view-' + hash.substring(1);
        
        const allViews = document.querySelectorAll('.page-view');
        let viewFound = false;

        allViews.forEach(view => {
            if (view.id === targetViewId) {
                view.classList.remove('hidden');
                viewFound = true;
            } else {
                view.classList.add('hidden');
            }
        });

        // Update active class on sidebar
        document.querySelectorAll('#global-sidebar a').forEach(a => {
            const isMatch = a.getAttribute('href') === hash;
            if (isMatch) {
                a.classList.add('bg-[#edeeef]', 'dark:bg-slate-800', 'font-bold', 'border-r-4', 'border-[#001e40]', 'dark:border-blue-400');
                a.classList.remove('text-[#4d657b]', 'dark:text-slate-400', 'hover:bg-[#edeeef]');
            } else {
                a.classList.remove('bg-[#edeeef]', 'dark:bg-slate-800', 'font-bold', 'border-r-4', 'border-[#001e40]', 'dark:border-blue-400');
                a.classList.add('text-[#4d657b]', 'dark:text-slate-400', 'hover:bg-[#edeeef]');
            }
        });

        // Close mobile overlay on route change
        const overlay = document.getElementById('sidebar-overlay');
        const sidebarContainer = document.getElementById('global-sidebar');
        if (overlay && !overlay.classList.contains('hidden')) {
            sidebarContainer.classList.add('-translate-x-full');
            overlay.classList.add('hidden', 'opacity-0');
        }

        // If the route doesn't exist, build a placeholder view dynamically!
        if (!viewFound) {
            this.generateMockView(hash.substring(1), targetViewId);
        } else {
            // If it's the dashboard or schedule, we might need to re-run role-specific logic
            if (hash === '#master-schedule' || hash === '#branch-schedule' || hash === '#my-schedule') {
                if (typeof window.renderSchedule === 'function') window.renderSchedule();
            }
        }
        
        window.scrollTo({top:0, behavior:'smooth'});
    },

    generateMockView(viewName, viewId) {
        const mainContainer = document.querySelector('main');
        if (!mainContainer) return;

        // Try to run a specific view generator if it exists (e.g. generate_inventory_view)
        const generatorName = `generate_${viewName.replace(/-/g, '_')}_view`;
        if (this[generatorName]) {
            this[generatorName](viewId, mainContainer);
            return;
        }

        // Default Generic View
        const capitalized = viewName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const html = `
            <div id="${viewId}" class="page-view animate-in fade-in zoom-in duration-300">
                <section class="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_40px_rgba(0,27,60,0.06)] border border-outline-variant/15 text-center mt-12 py-24">
                    <div class="inline-flex items-center justify-center w-20 h-20 bg-primary/5 rounded-full text-primary mb-6">
                        <span class="material-symbols-outlined text-4xl">view_kanban</span>
                    </div>
                    <h2 class="text-3xl font-headline font-bold text-primary mb-3">${capitalized}</h2>
                    <p class="text-on-surface-variant max-w-lg mx-auto leading-relaxed italic">This specialized module is being prepared for your account. Please check back shortly for full access.</p>
                </section>
            </div>
        `;
        mainContainer.insertAdjacentHTML('beforeend', html);
    },

    // --- MOCKED VIEW GENERATORS ---

    generate_inventory_view(id, container) {
        const items = [
            { id: 1, name: 'Smart Projector X-200', room: 'L-101', status: 'In Use', lastCheck: '2 days ago' },
            { id: 2, name: 'Laboratory Microscope', room: 'Bio-Lab', status: 'Maintenance', lastCheck: 'Today' },
            { id: 3, name: 'Advanced DSLR Camera', room: 'Media Hub', status: 'Available', lastCheck: '5 days ago' },
            { id: 4, name: 'Logic Analyzer Kit', room: 'Eng-Lab', status: 'Available', lastCheck: '1 week ago' },
        ];
        const html = `
            <div id="${id}" class="page-view animate-in fade-in duration-300">
                <div class="mb-8">
                    <h2 class="text-3xl font-headline font-bold text-primary">Equipment Inventory</h2>
                    <p class="text-on-surface-variant">Track and manage high-value assets across campus facilities.</p>
                </div>
                <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/15 overflow-hidden shadow-sm">
                    <table class="w-full text-left">
                        <thead class="bg-surface-container-low/50 font-label text-xs uppercase tracking-wider text-on-surface-variant">
                            <tr>
                                <th class="p-4">Item Name</th>
                                <th class="p-4">Location</th>
                                <th class="p-4">Status</th>
                                <th class="p-4">Last Health Check</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-outline-variant/10 text-sm">
                            ${items.map(i => `
                                <tr class="hover:bg-primary/5 transition-colors">
                                    <td class="p-4 font-bold text-primary">${i.name}</td>
                                    <td class="p-4">${i.room}</td>
                                    <td class="p-4">
                                        <span class="px-2 py-1 rounded-full text-[10px] font-bold ${i.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-primary-fixed text-on-primary-fixed-variant'}">${i.status}</span>
                                    </td>
                                    <td class="p-4 text-on-surface-variant">${i.lastCheck}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    generate_reports_view(id, container) {
        const html = `
            <div id="${id}" class="page-view animate-in fade-in duration-300">
                <div class="mb-8">
                    <h2 class="text-3xl font-headline font-bold text-primary">Institutional Analytics</h2>
                    <p class="text-on-surface-variant">Real-time performance metrics and facility utilization trends.</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-sm">
                        <h3 class="font-bold text-primary mb-6">Room Occupancy (Weekly)</h3>
                        <div class="flex items-end gap-3 h-48 px-4">
                            <div class="flex-1 bg-primary rounded-t-md" style="height: 60%"></div>
                            <div class="flex-1 bg-primary rounded-t-md" style="height: 40%"></div>
                            <div class="flex-1 bg-primary/40 rounded-t-md" style="height: 85%"></div>
                            <div class="flex-1 bg-primary rounded-t-md" style="height: 70%"></div>
                            <div class="flex-1 bg-secondary rounded-t-md" style="height: 30%"></div>
                            <div class="flex-1 bg-tertiary-fixed rounded-t-md" style="height: 15%"></div>
                        </div>
                        <div class="flex justify-between mt-4 text-[10px] text-outline px-4 font-bold">
                            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
                        </div>
                    </div>
                    <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-sm">
                        <h3 class="font-bold text-primary mb-6">Student Enrollment Growth</h3>
                        <div class="space-y-6">
                            ${['Engineering', 'Medicine', 'Literature'].map((dept, i) => `
                                <div>
                                    <div class="flex justify-between text-xs font-bold mb-2">
                                        <span>${dept}</span>
                                        <span>${90 - (i*15)}%</span>
                                    </div>
                                    <div class="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                                        <div class="bg-primary h-full rounded-full" style="width: ${90 - (i*15)}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    generate_staffing_view(id, container) {
        const staff = [
            { name: 'Dr. Marcus Johnson', role: 'Senior Professor', dept: 'Science', status: 'On Campus' },
            { name: 'Sarah Miller', role: 'Admin Secretary', dept: 'Registrar', status: 'Remote' },
            { name: 'James Wilson', role: 'Lab Assistant', dept: 'Engineering', status: 'On Campus' },
            { name: 'Emily Chen', role: 'Student Liaison', dept: 'Outreach', status: 'Offline' }
        ];
        const html = `
            <div id="${id}" class="page-view animate-in fade-in duration-300">
                <div class="mb-8">
                    <h2 class="text-3xl font-headline font-bold text-primary">Staff Directory</h2>
                    <p class="text-on-surface-variant">Operational status and contact directory for active personnel.</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${staff.map(s => `
                        <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-sm text-center">
                            <div class="w-16 h-16 bg-primary-container/20 rounded-full mx-auto mb-4 flex items-center justify-center text-primary font-bold text-xl">
                                ${s.name[0]}
                            </div>
                            <h4 class="font-bold text-primary truncate">${s.name}</h4>
                            <p class="text-xs text-on-surface-variant mb-3">${s.role} • ${s.dept}</p>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'On Campus' ? 'bg-green-100 text-green-700' : 'bg-surface-variant text-on-surface-variant'}">${s.status}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    generate_grades_view(id, container) {
        const courses = [
            { code: 'QM-410', name: 'Advanced Quantum Mechanics', credit: 4, grade: 'A', gpa: 4.0 },
            { code: 'MA-301', name: 'Calculus III: Vector analysis', credit: 3, grade: 'A-', gpa: 3.7 },
            { code: 'EN-205', name: 'Modern Literature', credit: 3, grade: 'B+', gpa: 3.3 },
            { code: 'PY-101', name: 'Intro to Philosophy', credit: 2, grade: 'A', gpa: 4.0 }
        ];
        const html = `
            <div id="${id}" class="page-view animate-in fade-in duration-300">
                <div class="mb-8 flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-headline font-bold text-primary">Academic Transcript</h2>
                        <p class="text-on-surface-variant">Current semester performance and cumulative metrics.</p>
                    </div>
                    <div class="text-right">
                        <div class="text-xs font-bold text-outline uppercase tracking-widest">Cumulative GPA</div>
                        <div class="text-4xl font-headline font-extrabold text-primary">3.82</div>
                    </div>
                </div>
                <div class="space-y-4">
                    ${courses.map(c => `
                        <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 flex justify-between items-center shadow-sm">
                            <div>
                                <h4 class="font-bold text-primary">${c.name}</h4>
                                <p class="text-xs text-on-surface-variant font-medium">${c.code} • ${c.credit} Credits</p>
                            </div>
                            <div class="flex items-center gap-8">
                                <div class="text-center">
                                    <div class="text-[10px] font-bold text-outline uppercase">Grade</div>
                                    <div class="text-xl font-bold text-primary">${c.grade}</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-[10px] font-bold text-outline uppercase">GPA</div>
                                    <div class="text-xl font-bold text-primary">${c.gpa.toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    generate_course_material_view(id, container) {
        const materials = [
            { id: 1, type: 'pdf', name: 'Quantum Electrodynamics Notes', size: '4.2 MB' },
            { id: 2, type: 'video', name: 'Lecture 12: Particle Physics', size: '128 MB' },
            { id: 3, type: 'zip', name: 'Problem Set 5 - Solutions', size: '1.5 MB' },
            { id: 4, type: 'pdf', name: 'Syllabus - Spring 2026', size: '0.8 MB' }
        ];
        const html = `
            <div id="${id}" class="page-view animate-in fade-in duration-300">
                <div class="mb-8">
                    <h2 class="text-3xl font-headline font-bold text-primary">Course Material</h2>
                    <p class="text-on-surface-variant">Access digital resources, lecture recordings, and study guides.</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${materials.map(m => `
                        <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/15 flex items-center justify-between hover:bg-primary/5 transition-all cursor-pointer group">
                            <div class="flex items-center gap-4">
                                <span class="material-symbols-outlined text-3xl text-primary/40 group-hover:text-primary transition-colors">${m.type === 'video' ? 'movie' : 'description'}</span>
                                <div>
                                    <h4 class="font-bold text-primary">${m.name}</h4>
                                    <p class="text-xs text-on-surface-variant uppercase font-bold tracking-widest">${m.type} • ${m.size}</p>
                                </div>
                            </div>
                            <span class="material-symbols-outlined text-outline group-hover:text-primary">download</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    generate_registration_view(id, container) {
        const html = `
            <div id="${id}" class="page-view animate-in fade-in duration-300">
                <div class="mb-8">
                    <h2 class="text-3xl font-headline font-bold text-primary">Course Registration</h2>
                    <p class="text-on-surface-variant">Enroll in upcoming courses and manage your academic degree path.</p>
                </div>
                <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-8 text-center py-20">
                    <div class="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                        <span class="material-symbols-outlined text-4xl">how_to_reg</span>
                    </div>
                    <h3 class="text-xl font-bold text-primary mb-2">Registration Period Closed</h3>
                    <p class="text-on-surface-variant max-w-sm mx-auto mb-8 text-sm">Priority registration for the Spring term concluded on Oct 10th. Please contact your academic advisor for late enrollment exceptions.</p>
                    <button class="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-primary-container transition-all unimplemented-btn">Contact Advisor</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    generate_room_search_view(id, container) {
        const html = `
            <div id="${id}" class="page-view animate-in fade-in duration-300">
                <div class="mb-8">
                    <h2 class="text-3xl font-headline font-bold text-primary">Room Availability Search</h2>
                    <p class="text-on-surface-variant">Find and book available academic spaces across all campus wings.</p>
                </div>
                <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-8 shadow-sm">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div>
                            <label class="block text-xs font-bold text-outline uppercase mb-2">Building</label>
                            <select class="w-full bg-surface p-3 rounded-lg border-outline-variant/20 focus:ring-primary h-12">
                                <option>All Buildings</option>
                                <option>Science Block</option>
                                <option>Arts Wing</option>
                                <option>Engineering</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-outline uppercase mb-2">Date</label>
                            <input type="date" class="w-full bg-surface p-3 rounded-lg border-outline-variant/20 focus:ring-primary h-12">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-outline uppercase mb-2">Capacity</label>
                            <input type="number" placeholder="Min. people" class="w-full bg-surface p-3 rounded-lg border-outline-variant/20 focus:ring-primary h-12">
                        </div>
                        <div class="flex items-end">
                            <button class="w-full bg-primary text-on-primary h-12 rounded-lg font-bold shadow hover:bg-primary-container transition-all">Search Availability</button>
                        </div>
                    </div>
                    <div class="border-t border-outline-variant/10 pt-8 text-center text-on-surface-variant italic py-12">
                        Adjust filters above to see real-time availability.
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    generate_help_center_view(id, container) {
        const html = `
            <div id="${id}" class="page-view animate-in fade-in duration-300">
                <div class="mb-8">
                    <h2 class="text-3xl font-headline font-bold text-primary">Help & Support Center</h2>
                    <p class="text-on-surface-variant">Get assistance with scheduling, facility access, and portal tools.</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15 text-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer unimplemented-btn">
                        <span class="material-symbols-outlined text-4xl text-primary mb-4">description</span>
                        <h4 class="font-bold text-primary mb-2">User Guides</h4>
                        <p class="text-xs text-on-surface-variant">Step-by-step documentation for all features.</p>
                    </div>
                    <div class="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15 text-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer unimplemented-btn">
                        <span class="material-symbols-outlined text-4xl text-secondary mb-4">support_agent</span>
                        <h4 class="font-bold text-primary mb-2">Contact Support</h4>
                        <p class="text-xs text-on-surface-variant">Direct line to our technical assistance team.</p>
                    </div>
                    <div class="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/15 text-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer unimplemented-btn">
                        <span class="material-symbols-outlined text-4xl text-tertiary mb-4">chat</span>
                        <h4 class="font-bold text-primary mb-2">Report Issue</h4>
                        <p class="text-xs text-on-surface-variant">Submit a ticket for facility or app issues.</p>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    },

    generate_admin_calendar_view(id, container) {
        // Alias to master schedule
        this.generate_master_schedule_view(id, container);
    },

    generate_master_schedule_view(id, container) {
        const html = `
            <div id="${id}" class="page-view animate-in fade-in duration-300">
                <div class="mb-8 flex justify-between items-end">
                    <div>
                        <h2 class="text-3xl font-headline font-bold text-primary">Master Academic Planner</h2>
                        <p class="text-on-surface-variant">Comprehensive view of all campus scheduling and resource allocation.</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="bg-surface-container text-on-surface-variant px-4 py-2 rounded-lg text-sm font-bold border border-outline-variant/15 hover:bg-surface-container-high transition-all">Download PDF</button>
                    </div>
                </div>
                <div id="central-schedule-container"></div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
        this.renderGlobalSchedule('central-schedule-container');
    },

    // --- SHARED RENDER LOGIC ---

    renderGlobalSchedule(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const schedule = this.getSchedule();
        const user = this.getCurrentUser();
        const canEdit = user && (user.role === 'manager' || user.role === 'head_manager');

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const slots = ['9', '10:30', '1'];
        const times = ['9:00 AM', '10:30 AM', '1:00 PM'];

        let html = `
            <div class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/15 shadow-sm">
                <div class="grid grid-cols-6 bg-surface-container-low/50 border-b border-outline-variant/15 font-label text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    <div class="p-4 text-right border-r border-outline-variant/10">Time</div>
                    ${days.map(d => `<div class="p-4 text-center border-r border-outline-variant/10 last:border-r-0">${d}</div>`).join('')}
                </div>
                <div class="divide-y divide-outline-variant/10">
                    ${slots.map((s, idx) => `
                        <div class="grid grid-cols-6 hover:bg-primary/5 transition-colors">
                            <div class="p-4 text-right text-xs text-outline font-bold border-r border-outline-variant/10 bg-surface/30">${times[idx]}</div>
                            ${days.map(day => {
                                const key = `${day.toLowerCase()}-${s}`;
                                const item = schedule[key];
                                let innerHtml = '';
                                if (item) {
                                    let colorClass = 'bg-primary-fixed text-on-primary-fixed-variant border-primary-fixed-dim/30';
                                    if (item.color === 'secondary') colorClass = 'bg-secondary-container text-on-secondary-container border-secondary-fixed-dim/30';
                                    else if (item.color === 'surface') colorClass = 'bg-surface-container-high/50 text-on-surface-variant border-outline-variant/20';

                                    innerHtml = `
                                        <div class="p-3 rounded-lg h-full border ${colorClass} shadow-sm group relative">
                                            <div class="font-bold text-sm leading-tight">${item.title}</div>
                                            <div class="text-[10px] opacity-80 mt-1 uppercase font-extrabold flex items-center gap-1">
                                                <span class="material-symbols-outlined text-[12px]">location_on</span> ${item.room}
                                            </div>
                                            ${canEdit ? `
                                                <button onclick="StateManager.openScheduleEdit('${key}')" class="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-outline-variant/20">
                                                    <span class="material-symbols-outlined text-[14px]">edit</span>
                                                </button>
                                            ` : ''}
                                        </div>
                                    `;
                                } else if (canEdit) {
                                     innerHtml = `
                                        <button onclick="StateManager.openScheduleEdit('${key}')" class="w-full h-full min-h-[60px] flex items-center justify-center text-outline/30 hover:text-primary transition-colors">
                                            <span class="material-symbols-outlined">add_circle</span>
                                        </button>
                                     `;
                                }
                                return `<div class="p-2 border-r border-outline-variant/10 last:border-r-0">${innerHtml}</div>`;
                            }).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.innerHTML = html;
    },

    openScheduleEdit(key) {
        const schedule = this.getSchedule();
        const data = schedule[key] || { title: '', room: '', prof: '', color: 'primary' };
        const modalHtml = `
            <div id="schedule-modal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
                <div class="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm p-6 transform animate-in zoom-in duration-300">
                    <h2 class="text-xl font-headline font-bold text-primary mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined">edit_calendar</span> Edit Slot: ${key.toUpperCase()}
                    </h2>
                    <div class="space-y-4 font-body">
                        <div>
                            <label class="block text-xs font-bold text-outline uppercase mb-1">Class Title</label>
                            <input id="edit-title" value="${data.title}" class="w-full bg-surface-container rounded-lg border-none px-4 py-2 text-sm focus:ring-2 focus:ring-primary">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-outline uppercase mb-1">Room</label>
                            <input id="edit-room" value="${data.room}" class="w-full bg-surface-container rounded-lg border-none px-4 py-2 text-sm focus:ring-2 focus:ring-primary">
                        </div>
                         <div>
                            <label class="block text-xs font-bold text-outline uppercase mb-1">Theme</label>
                            <select id="edit-color" class="w-full bg-surface-container rounded-lg border-none px-4 py-2 text-sm focus:ring-2 focus:ring-primary">
                                <option value="primary" ${data.color === 'primary' ? 'selected' : ''}>Academic (Blue)</option>
                                <option value="secondary" ${data.color === 'secondary' ? 'selected' : ''}>Laboratory (Cyan)</option>
                                <option value="surface" ${data.color === 'surface' ? 'selected' : ''}>Elective (Grey)</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 mt-8">
                        <button onclick="document.getElementById('schedule-modal').remove()" class="px-4 py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">Cancel</button>
                        <button id="save-slot-btn" class="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-lg hover:bg-primary-container transition-all">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('save-slot-btn').addEventListener('click', () => {
             const newData = {
                title: document.getElementById('edit-title').value,
                room: document.getElementById('edit-room').value,
                color: document.getElementById('edit-color').value,
                prof: data.prof || 'Staff'
             };
             this.updateSchedule(key, newData);
             document.getElementById('schedule-modal').remove();
             if (window.showToast) window.showToast("Schedule updated successfully.");
             
             // Refresh views that might be showing the schedule
             const currentHash = window.location.hash;
             if (currentHash.includes('schedule') || currentHash === '#dashboard' || currentHash === '') {
                 // Try to call the local renderSchedule if it's currently visible
                 if (typeof window.renderSchedule === 'function') window.renderSchedule();
                 // Also refresh global one if present
                 this.renderGlobalSchedule('central-schedule-container');
             }
        });
    }
};



// Initialize Router on boot
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
});
