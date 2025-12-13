// ==============================================
// COMPLETE ANNOUNCEMENT SYSTEM FOR FIREBASE
// ==============================================

// Global Announcement Manager Class
class AnnouncementManager {
    constructor() {
        this.db = null;
        this.announcementsCollection = null;
        this.storage = null;
        this.landingAnnouncements = [];
        this.dashboardAnnouncements = [];
        this.allAnnouncements = [];
        this.currentSlide = 0; // For landing slideshow
        this.dashboardSlide = 0; // For dashboard slideshow
        this.slideInterval = null;
        this.dashboardInterval = null; // Separate interval for dashboard
        this.isAdmin = false;
        this.currentMediaType = 'gallery';
        this.selectedFile = null;
        this.editMode = false;
        this.currentEditId = null;
        
        // Don't initialize immediately, wait for DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // DOM already loaded, initialize immediately
            this.init();
        }
    }
    
    async init() {
        try {
            console.log('Initializing Announcement Manager...');
            
            // Step 1: Wait for Firebase to be ready
            await this.waitForFirebase();
            
            // Step 2: Initialize Firebase services
            await this.initFirebaseServices();
            
            // Step 3: Inject CSS for dashboard slideshow
            this.injectDashboardSlideshowCSS();
            
            // Step 4: Check admin status
            this.checkAdminStatus();
            
            // Step 5: Setup event listeners
            this.setupEventListeners();
            
            // Step 6: Load all announcements
            await this.loadAllAnnouncements();
            
            // Step 7: Start slideshow if needed
            if (this.landingAnnouncements.length > 1) {
                this.startSlideshow();
            }
            
            if (this.dashboardAnnouncements.length > 1) {
                this.startDashboardSlideshow();
            }
            
            console.log('Announcement Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Announcement Manager:', error);
            console.error('Error details:', error.message, error.stack);
            
            // Show user-friendly error
            this.showNotification('Announcement system initialization failed. Please refresh the page.', 'error');
            
            // Show fallback content
            this.showFallbackAnnouncements();
        }
    }
    
    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkFirebase = () => {
                attempts++;
                
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    console.log('Firebase is ready');
                    resolve();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    reject(new Error('Firebase not available after ' + maxAttempts + ' attempts'));
                    return;
                }
                
                console.log('Waiting for Firebase... attempt ' + attempts);
                setTimeout(checkFirebase, 500);
            };
            
            checkFirebase();
        });
    }
    
    async initFirebaseServices() {
        try {
            // Get the Firebase app instance
            const firebaseApp = firebase.app();
            
            // Initialize Firestore
            this.db = firebaseApp.firestore();
            
            // Initialize Storage
            this.storage = firebaseApp.storage();
            
            // Set up announcements collection
            this.announcementsCollection = this.db.collection('announcements');
            
            console.log('Firebase services initialized');
            
        } catch (error) {
            console.error('Error initializing Firebase services:', error);
            throw new Error('Failed to initialize Firebase services: ' + error.message);
        }
    }
    
    // ==============================================
    // LOAD ANNOUNCEMENTS
    // ==============================================
    
    async loadAllAnnouncements() {
        try {
            console.log('Loading announcements from Firestore...');
            
            let snapshot;
            try {
                // First try simple query
                snapshot = await this.announcementsCollection.get();
            } catch (error) {
                console.error('Firestore error:', error);
                throw error;
            }
            
            this.landingAnnouncements = [];
            this.dashboardAnnouncements = [];
            this.allAnnouncements = [];
            
            snapshot.forEach(doc => {
                try {
                    const data = doc.data();
                    const announcement = {
                        id: doc.id,
                        title: data.title || 'No Title',
                        content: data.content || '',
                        type: data.type || 'dashboard',
                        mediaType: data.mediaType || null,
                        mediaUrl: data.mediaUrl || null,
                        priority: data.priority || 'medium',
                        isActive: data.isActive !== undefined ? data.isActive : true,
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
                        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
                        createdBy: data.createdBy || 'admin'
                    };
                    
                    // Only show active announcements
                    if (announcement.isActive) {
                        this.allAnnouncements.push(announcement);
                        
                        if (announcement.type === 'landing') {
                            this.landingAnnouncements.push(announcement);
                        } else if (announcement.type === 'dashboard') {
                            this.dashboardAnnouncements.push(announcement);
                        }
                    }
                    
                } catch (parseError) {
                    console.error('Error parsing announcement:', parseError);
                }
            });
            
            // Sort by date (newest first)
            this.landingAnnouncements.sort((a, b) => b.createdAt - a.createdAt);
            this.dashboardAnnouncements.sort((a, b) => b.createdAt - a.createdAt);
            this.allAnnouncements.sort((a, b) => b.createdAt - a.createdAt);
            
            // Reset slideshow positions
            this.currentSlide = 0;
            this.dashboardSlide = 0;
            
            // Render announcements
            this.renderLandingAnnouncements();
            this.renderDashboardAnnouncements();
            this.renderManagementList();
            
            console.log(`Loaded ${this.allAnnouncements.length} announcements`);
            console.log(`Dashboard announcements: ${this.dashboardAnnouncements.length}`);
            console.log(`Landing announcements: ${this.landingAnnouncements.length}`);
            
        } catch (error) {
            console.error('Error loading announcements:', error);
            this.showFallbackAnnouncements();
        }
    }
    
    showFallbackAnnouncements() {
        // Landing page fallback
        const slidesTrack = document.getElementById('landingSlidesTrack');
        if (slidesTrack) {
            slidesTrack.innerHTML = `
                <div class="announcement-slide">
                    <div class="slide-content">
                        <h3>Welcome to Tanzania Mining Investment</h3>
                        <p>Stay tuned for important updates and announcements.</p>
                    </div>
                </div>
            `;
        }
        
        // Dashboard fallback
        const dashboardContainer = document.getElementById('dashboardAnnouncementsList');
        if (dashboardContainer) {
            dashboardContainer.innerHTML = `
                <div class="no-announcements">
                    <i class="fas fa-info-circle"></i>
                    <p>Announcements will appear here</p>
                </div>
            `;
        }
    }
    
    // ==============================================
    // RENDER ANNOUNCEMENTS
    // ==============================================
    
    renderLandingAnnouncements() {
        const slidesTrack = document.getElementById('landingSlidesTrack');
        const slidesDots = document.getElementById('landingSlidesDots');
        
        if (!slidesTrack) {
            console.log('Landing slides track not found');
            return;
        }
        
        if (this.landingAnnouncements.length === 0) {
            slidesTrack.innerHTML = `
                <div class="announcement-slide">
                    <div class="slide-content">
                        <h3>Welcome to Tanzania Mining Investment</h3>
                        <p>No announcements at the moment. Check back soon!</p>
                    </div>
                </div>
            `;
            if (slidesDots) slidesDots.innerHTML = '';
            return;
        }
        
        slidesTrack.innerHTML = '';
        if (slidesDots) slidesDots.innerHTML = '';
        
        this.landingAnnouncements.forEach((announcement, index) => {
            // Create slide
            const slide = document.createElement('div');
            slide.className = 'announcement-slide';
            
            let mediaHtml = '';
            if (announcement.mediaUrl) {
                mediaHtml = this.renderMediaElement(announcement, true);
            }
            
            slide.innerHTML = `
                ${mediaHtml}
                <div class="slide-content">
                    <span class="priority-badge priority-${announcement.priority}">
                        ${announcement.priority.toUpperCase()}
                    </span>
                    <h3>${this.escapeHtml(announcement.title)}</h3>
                    <p>${this.escapeHtml(announcement.content)}</p>
                    <div class="announcement-timestamp">
                        <i class="far fa-clock"></i>
                        ${this.formatDate(announcement.createdAt)}
                    </div>
                    <!-- Centered Date -->
                    <div class="center-date">
                        <i class="far fa-calendar"></i>
                        Posted: ${this.formatFullDate(announcement.createdAt)}
                    </div>
                </div>
            `;
            
            slidesTrack.appendChild(slide);
            
            // Create dot if container exists
            if (slidesDots) {
                const dot = document.createElement('div');
                dot.className = `slideshow-dot ${index === 0 ? 'active' : ''}`;
                dot.onclick = () => this.goToSlide(index);
                slidesDots.appendChild(dot);
            }
        });
        
        this.updateSlideshow();
    }
    
    renderDashboardAnnouncements() {
        const container = document.getElementById('dashboardAnnouncementsList');
        if (!container) {
            console.log('Dashboard announcements container not found');
            return;
        }
        
        if (this.dashboardAnnouncements.length === 0) {
            container.innerHTML = `
                <div class="no-announcements">
                    <i class="fas fa-info-circle"></i>
                    <p>No announcements at the moment</p>
                </div>
            `;
            return;
        }
        
        // If only one announcement, show it without slideshow
        if (this.dashboardAnnouncements.length === 1) {
            const announcement = this.dashboardAnnouncements[0];
            container.innerHTML = this.createDashboardAnnouncementHTML(announcement);
        } else {
            // Create slideshow for multiple announcements
            container.innerHTML = this.createDashboardSlideshowHTML();
            
            // Start dashboard slideshow
            this.startDashboardSlideshow();
        }
    }
    
    createDashboardSlideshowHTML() {
        return `
            <div class="dashboard-slideshow-container">
                <div class="dashboard-slides-track" id="dashboardSlidesTrack">
                    ${this.dashboardAnnouncements.map((announcement, index) => `
                        <div class="dashboard-slide ${index === 0 ? 'active' : ''}">
                            ${this.createDashboardSlideContent(announcement)}
                        </div>
                    `).join('')}
                </div>
                
                ${this.dashboardAnnouncements.length > 1 ? `
                    <div class="dashboard-slideshow-controls">
                        <button class="slideshow-btn prev-btn" onclick="announcementManager.changeDashboardSlide(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        
                        <div class="dashboard-slides-dots" id="dashboardSlidesDots">
                            ${this.dashboardAnnouncements.map((_, index) => `
                                <div class="slideshow-dot ${index === 0 ? 'active' : ''}" 
                                     onclick="announcementManager.goToDashboardSlide(${index})"></div>
                            `).join('')}
                        </div>
                        
                        <button class="slideshow-btn next-btn" onclick="announcementManager.changeDashboardSlide(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="dashboard-slideshow-info">
                        <span id="dashboardSlideCounter">1 of ${this.dashboardAnnouncements.length}</span>
                        <button class="btn-pause" onclick="announcementManager.toggleDashboardSlideshow()">
                            <i class="fas fa-pause" id="dashboardPauseIcon"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    createDashboardSlideContent(announcement) {
        let mediaHtml = '';
        if (announcement.mediaUrl) {
            mediaHtml = this.renderMediaElement(announcement, true);
        }
        
        return `
            ${mediaHtml}
            <div class="dashboard-slide-content">
                <div class="slide-header">
                    <span class="priority-badge priority-${announcement.priority}">
                        ${announcement.priority.toUpperCase()}
                    </span>
                    <h3>${this.escapeHtml(announcement.title)}</h3>
                </div>
                
                <div class="slide-body">
                    <p>${this.escapeHtml(announcement.content)}</p>
                </div>
                
                <div class="slide-footer">
                    <div class="announcement-timestamp">
                        <i class="far fa-clock"></i>
                        ${this.formatDate(announcement.createdAt)}
                    </div>
                    
                    <div class="center-date">
                        <i class="far fa-calendar"></i>
                        Posted: ${this.formatFullDate(announcement.createdAt)}
                    </div>
                </div>
                
                ${this.isAdmin ? `
                    <div class="dashboard-announcement-actions">
                        <button class="action-btn btn-edit" onclick="announcementManager.editAnnouncement('${announcement.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn btn-toggle" onclick="announcementManager.toggleAnnouncement('${announcement.id}', ${!announcement.isActive})">
                            <i class="fas fa-power-off"></i> ${announcement.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="action-btn btn-delete" onclick="announcementManager.deleteAnnouncement('${announcement.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    createDashboardAnnouncementHTML(announcement) {
        let mediaHtml = '';
        if (announcement.mediaUrl) {
            mediaHtml = this.renderMediaElement(announcement, true);
        }
        
        return `
            <div class="dashboard-single-announcement">
                ${mediaHtml}
                <div class="dashboard-announcement-content">
                    <div class="announcement-header">
                        <h3>${this.escapeHtml(announcement.title)}</h3>
                        <span class="priority-badge priority-${announcement.priority}">
                            ${announcement.priority.toUpperCase()}
                        </span>
                    </div>
                    
                    <div class="announcement-body">
                        <p>${this.escapeHtml(announcement.content)}</p>
                    </div>
                    
                    <div class="announcement-footer">
                        <div class="announcement-timestamp">
                            <i class="far fa-clock"></i>
                            ${this.formatDate(announcement.createdAt)}
                        </div>
                        
                        <div class="center-date">
                            <i class="far fa-calendar"></i>
                            Posted: ${this.formatFullDate(announcement.createdAt)}
                        </div>
                    </div>
                    
                    ${this.isAdmin ? `
                        <div class="dashboard-announcement-actions">
                            <button class="action-btn btn-edit" onclick="announcementManager.editAnnouncement('${announcement.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="action-btn btn-toggle" onclick="announcementManager.toggleAnnouncement('${announcement.id}', ${!announcement.isActive})">
                                <i class="fas fa-power-off"></i> ${announcement.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="action-btn btn-delete" onclick="announcementManager.deleteAnnouncement('${announcement.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    renderMediaElement(announcement, isSlideshow = false) {
        if (!announcement.mediaUrl) return '';
        
        const mediaType = announcement.mediaType || this.detectMediaType(announcement.mediaUrl);
        
        switch (mediaType) {
            case 'video':
                if (isSlideshow) {
                    return `
                        <div class="slide-media">
                            <video autoplay loop muted playsinline>
                                <source src="${announcement.mediaUrl}" type="video/mp4">
                            </video>
                        </div>
                    `;
                } else {
                    return `
                        <div class="announcement-media">
                            <video controls>
                                <source src="${announcement.mediaUrl}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                }
                
            case 'youtube':
                const videoId = this.extractYouTubeId(announcement.mediaUrl);
                if (videoId) {
                    if (isSlideshow) {
                        return `
                            <div class="slide-media">
                                <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}" 
                                        frameborder="0" 
                                        allow="autoplay; encrypted-media" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="announcement-media">
                                <iframe src="https://www.youtube.com/embed/${videoId}" 
                                        frameborder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowfullscreen>
                                </iframe>
                            </div>
                        `;
                    }
                }
                return '';
                
            default: // image
                if (isSlideshow) {
                    return `<div class="slide-media"><img src="${announcement.mediaUrl}" alt="${this.escapeHtml(announcement.title)}"></div>`;
                } else {
                    return `
                        <div class="announcement-media">
                            <img src="${announcement.mediaUrl}" alt="${this.escapeHtml(announcement.title)}">
                        </div>
                    `;
                }
        }
    }
    
    // ==============================================
    // CREATE ANNOUNCEMENT - FIXED VERSION
    // ==============================================

    async createAnnouncement(formData) {
        try {
            console.log('Creating announcement with data:', formData);
            
            // Validate form data
            if (!formData.title || !formData.content || !formData.type) {
                this.showNotification('Please fill all required fields', 'error');
                return null;
            }
            
            // DEBUG: Log the type to ensure it's correct
            console.log('Announcement type being saved:', formData.type);
            
            // Prepare announcement data
            const announcementData = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                type: formData.type, // This should be 'dashboard' or 'landing'
                priority: formData.priority || 'medium',
                isActive: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.getCurrentUserId()
            };
            
            // Handle media
            let mediaUrl = null;
            let mediaType = null;
            
            if (this.currentMediaType === 'gallery' && this.selectedFile) {
                try {
                    const dataUrl = await this.convertFileToDataURL(this.selectedFile);
                    mediaUrl = dataUrl;
                    mediaType = this.selectedFile.type.startsWith('video/') ? 'video' : 'image';
                    console.log('File converted to data URL');
                } catch (fileError) {
                    console.error('Error handling file:', fileError);
                    this.showNotification('Error processing file', 'error');
                    return null;
                }
            } else if (this.currentMediaType === 'url') {
                const urlInput = document.getElementById('mediaUrlInput');
                const url = urlInput ? urlInput.value.trim() : '';
                if (url) {
                    mediaUrl = url;
                    mediaType = document.querySelector('input[name="urlType"]:checked')?.value || 'image';
                }
            }
            
            // Add media data to announcement
            if (mediaUrl) {
                announcementData.mediaUrl = mediaUrl;
                announcementData.mediaType = mediaType;
            }
            
            console.log('Saving announcement to Firestore:', announcementData);
            
            // Add to Firestore
            const docRef = await this.announcementsCollection.add(announcementData);
            
            console.log('Announcement created with ID:', docRef.id);
            
            this.showNotification('Announcement published successfully!', 'success');
            
            // Reset form
            this.resetCreateForm();
            
            // Reload announcements after a short delay
            setTimeout(() => {
                this.loadAllAnnouncements();
            }, 1000);
            
            // Switch to manage tab to see the new announcement
            this.switchTab('manage');
            
            return docRef.id;
            
        } catch (error) {
            console.error('Error creating announcement:', error);
            console.error('Error details:', error.message, error.stack);
            
            let errorMessage = 'Error creating announcement';
            if (error.message.includes('permission')) {
                errorMessage = 'Permission denied. You may need admin rights.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            } else {
                errorMessage = `Error: ${error.message}`;
            }
            
            this.showNotification(errorMessage, 'error');
            return null;
        }
    }
    
    // Helper function to convert file to data URL
    convertFileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    
    async uploadFileToStorage(file) {
        try {
            // Create a unique filename
            const timestamp = Date.now();
            const extension = file.name.split('.').pop();
            const filename = `announcements/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
            
            // Create storage reference
            const storageRef = this.storage.ref(filename);
            
            // Upload file
            const uploadTask = storageRef.put(file);
            
            // Wait for upload to complete
            await uploadTask;
            
            // Get download URL
            const downloadURL = await storageRef.getDownloadURL();
            
            // Determine media type
            const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
            
            return { mediaUrl: downloadURL, mediaType };
            
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
    
    // ==============================================
    // UPDATE ANNOUNCEMENT
    // ==============================================
    
    async updateAnnouncement(announcementId, formData) {
        try {
            // Validate form data
            if (!formData.title || !formData.content || !formData.type) {
                this.showNotification('Please fill all required fields', 'error');
                return false;
            }
            
            // Prepare update data
            const updateData = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                type: formData.type,
                priority: formData.priority,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Handle media
            if (this.currentMediaType === 'gallery' && this.selectedFile) {
                // Upload new file
                const { mediaUrl, mediaType } = await this.uploadFileToStorage(this.selectedFile);
                updateData.mediaUrl = mediaUrl;
                updateData.mediaType = mediaType;
                
            } else if (this.currentMediaType === 'url') {
                const urlInput = document.getElementById('mediaUrlInput');
                const url = urlInput ? urlInput.value.trim() : '';
                if (url) {
                    updateData.mediaUrl = url;
                    updateData.mediaType = document.querySelector('input[name="urlType"]:checked')?.value || 'image';
                } else {
                    updateData.mediaUrl = null;
                    updateData.mediaType = null;
                }
            } else if (this.currentMediaType === 'none') {
                updateData.mediaUrl = null;
                updateData.mediaType = null;
            }
            
            // Update in Firestore
            await this.announcementsCollection.doc(announcementId).update(updateData);
            
            this.showNotification('Announcement updated successfully!', 'success');
            
            // Reset form
            this.resetCreateForm();
            
            // Reload announcements
            await this.loadAllAnnouncements();
            
            return true;
            
        } catch (error) {
            console.error('Error updating announcement:', error);
            this.showNotification('Error updating announcement: ' + error.message, 'error');
            return false;
        }
    }
    
    // ==============================================
    // DELETE ANNOUNCEMENT
    // ==============================================
    
    async deleteAnnouncement(announcementId) {
        if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
            return;
        }
        
        try {
            await this.announcementsCollection.doc(announcementId).delete();
            
            this.showNotification('Announcement deleted successfully!', 'success');
            
            // Reload announcements
            await this.loadAllAnnouncements();
            
        } catch (error) {
            console.error('Error deleting announcement:', error);
            this.showNotification('Error deleting announcement', 'error');
        }
    }
    
    // ==============================================
    // TOGGLE ANNOUNCEMENT STATUS
    // ==============================================
    
    async toggleAnnouncement(announcementId, newStatus) {
        try {
            await this.announcementsCollection.doc(announcementId).update({
                isActive: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showNotification(`Announcement ${newStatus ? 'activated' : 'deactivated'}!`, 'success');
            
            // Reload announcements
            await this.loadAllAnnouncements();
            
        } catch (error) {
            console.error('Error toggling announcement:', error);
            this.showNotification('Error updating announcement', 'error');
        }
    }
    
    // ==============================================
    // GALLERY UPLOAD FUNCTIONS
    // ==============================================
    
    setupGalleryUpload() {
        const galleryFileInput = document.getElementById('galleryFileInput');
        const dragDropArea = document.getElementById('dragDropArea');
        
        if (!galleryFileInput) return;
        
        // Click to choose from gallery
        if (dragDropArea) {
            dragDropArea.addEventListener('click', (e) => {
                e.preventDefault();
                galleryFileInput.click();
            });
        }
        
        // File selection handler
        galleryFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
        
        // Drag and drop functionality
        if (dragDropArea) {
            dragDropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropArea.classList.add('dragover');
            });
            
            dragDropArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropArea.classList.remove('dragover');
            });
            
            dragDropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDropArea.classList.remove('dragover');
                
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    this.handleFileSelect(e.dataTransfer.files[0]);
                }
            });
        }
    }
    
    handleFileSelect(file) {
        if (!file) return;
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('File size must be less than 5MB', 'error');
            return;
        }
        
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            this.showNotification('Invalid file type. Please use JPG, PNG, GIF, or MP4', 'error');
            return;
        }
        
        this.selectedFile = file;
        this.previewSelectedFile(file);
        this.showNotification('File selected successfully', 'success');
    }
    
    previewSelectedFile(file) {
        const previewContainer = document.getElementById('galleryPreview');
        if (!previewContainer) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = '';
            
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            if (file.type.startsWith('image/')) {
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-preview" onclick="announcementManager.removePreview()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="file-info">
                        <span>${this.escapeHtml(file.name)}</span>
                        <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                `;
            } else if (file.type.startsWith('video/')) {
                previewItem.innerHTML = `
                    <video controls>
                        <source src="${e.target.result}" type="${file.type}">
                        Your browser does not support the video tag.
                    </video>
                    <button type="button" class="remove-preview" onclick="announcementManager.removePreview()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="file-info">
                        <span>${this.escapeHtml(file.name)}</span>
                        <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </div>
                `;
            }
            
            previewContainer.appendChild(previewItem);
        };
        
        reader.onerror = () => {
            this.showNotification('Error reading file', 'error');
        };
        
        reader.readAsDataURL(file);
    }
    
    removePreview() {
        this.selectedFile = null;
        const previewContainer = document.getElementById('galleryPreview');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="preview-placeholder">
                    <i class="fas fa-image"></i>
                    <p>No file selected</p>
                </div>
            `;
        }
        
        const fileInput = document.getElementById('galleryFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }
    
    // ==============================================
    // ANNOUNCEMENT MANAGEMENT LIST
    // ==============================================
    
    renderManagementList() {
        const grid = document.getElementById('announcementsGrid');
        if (!grid) return;
        
        if (this.allAnnouncements.length === 0) {
            grid.innerHTML = `
                <div class="no-announcements">
                    <i class="fas fa-inbox"></i>
                    <p>No announcements found</p>
                    <button class="btn btn-primary" onclick="announcementManager.switchTab('create')">
                        <i class="fas fa-plus"></i> Create First Announcement
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.allAnnouncements.map(announcement => `
            <div class="announcement-card ${announcement.priority || 'medium'}">
                <div class="announcement-header">
                    <h4 class="announcement-title">${this.escapeHtml(announcement.title || 'Untitled')}</h4>
                    <span class="announcement-type-badge">
                        ${announcement.type === 'landing' ? 'Landing Page' : 'Dashboard'}
                    </span>
                </div>
                
                <div class="announcement-content">
                    ${this.escapeHtml((announcement.content || '').length > 150 ? 
                      (announcement.content || '').substring(0, 150) + '...' : 
                      announcement.content || '')}
                </div>
                
                ${announcement.mediaUrl ? `
                    <div class="announcement-media-indicator">
                        <i class="fas fa-${announcement.mediaType === 'video' || announcement.mediaType === 'youtube' ? 'video' : 'image'}"></i>
                        Includes ${announcement.mediaType === 'youtube' ? 'YouTube video' : announcement.mediaType || 'media'}
                    </div>
                ` : ''}
                
                <div class="announcement-meta">
                    <span class="announcement-status ${announcement.isActive ? 'status-active' : 'status-inactive'}">
                        ${announcement.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div class="announcement-date">
                        <i class="far fa-calendar"></i>
                        ${this.formatDate(announcement.createdAt)}
                    </div>
                </div>
                
                <!-- Centered Post Date -->
                <div class="center-date">
                    <i class="far fa-clock"></i>
                    Posted on: ${this.formatFullDate(announcement.createdAt)}
                </div>
                
                <div class="announcement-actions">
                    <button class="action-btn btn-edit" onclick="announcementManager.editAnnouncement('${announcement.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn btn-toggle" onclick="announcementManager.toggleAnnouncement('${announcement.id}', ${!announcement.isActive})">
                        <i class="fas fa-power-off"></i> ${announcement.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="action-btn btn-delete" onclick="announcementManager.deleteAnnouncement('${announcement.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        this.updateStats();
    }
    
    updateStats() {
        const activeCount = this.allAnnouncements.filter(a => a.isActive).length;
        const totalCount = this.allAnnouncements.length;
        
        const activeElement = document.getElementById('activeCount');
        const totalElement = document.getElementById('totalCount');
        
        if (activeElement) activeElement.textContent = `${activeCount} Active`;
        if (totalElement) totalElement.textContent = `${totalCount} Total`;
    }
    
    filterAnnouncements() {
        const searchTerm = document.getElementById('announcementSearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('typeFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        
        let filtered = [...this.allAnnouncements];
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(announcement => 
                (announcement.title || '').toLowerCase().includes(searchTerm) ||
                (announcement.content || '').toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply type filter
        if (typeFilter) {
            filtered = filtered.filter(announcement => announcement.type === typeFilter);
        }
        
        // Apply status filter
        if (statusFilter) {
            const isActive = statusFilter === 'active';
            filtered = filtered.filter(announcement => announcement.isActive === isActive);
        }
        
        this.renderFilteredList(filtered);
    }
    
    renderFilteredList(announcements) {
        const grid = document.getElementById('announcementsGrid');
        if (!grid) return;
        
        if (announcements.length === 0) {
            grid.innerHTML = `
                <div class="no-announcements">
                    <i class="fas fa-search"></i>
                    <p>No announcements match your filters</p>
                </div>
            `;
            return;
        }
        
        // Temporarily replace allAnnouncements with filtered list for rendering
        const originalList = this.allAnnouncements;
        this.allAnnouncements = announcements;
        this.renderManagementList();
        this.allAnnouncements = originalList;
    }
    
    // ==============================================
    // EDIT ANNOUNCEMENT
    // ==============================================
    
    async editAnnouncement(announcementId) {
        try {
            const doc = await this.announcementsCollection.doc(announcementId).get();
            if (!doc.exists) {
                this.showNotification('Announcement not found', 'error');
                return;
            }
            
            const announcement = doc.data();
            this.editMode = true;
            this.currentEditId = announcementId;
            
            // Switch to create tab
            this.switchTab('create');
            
            // Fill form with existing data
            document.getElementById('enhancedTitle').value = announcement.title || '';
            document.getElementById('enhancedContent').value = announcement.content || '';
            document.getElementById('enhancedType').value = announcement.type || 'dashboard';
            document.getElementById('enhancedPriority').value = announcement.priority || 'medium';
            
            // Set post date if exists
            if (announcement.createdAt) {
                const date = new Date(announcement.createdAt.toDate());
                const formattedDate = date.toISOString().slice(0, 16);
                document.getElementById('postDate').value = formattedDate;
                this.updateDateDisplay();
            }
            
            // Handle media
            if (announcement.mediaUrl) {
                // Switch to URL tab
                this.switchMediaTab('url');
                
                document.getElementById('mediaUrlInput').value = announcement.mediaUrl || '';
                
                const mediaType = announcement.mediaType || 'image';
                const radioBtn = document.querySelector(`input[name="urlType"][value="${mediaType}"]`);
                if (radioBtn) {
                    radioBtn.checked = true;
                    this.previewMediaURL(announcement.mediaUrl, mediaType);
                }
            } else {
                // Switch to none tab
                this.switchMediaTab('none');
            }
            
            // Update submit button
            const submitBtn = document.querySelector('#enhancedAnnouncementForm button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Announcement';
            
            this.showNotification('Edit mode activated', 'info');
            
        } catch (error) {
            console.error('Error loading announcement for edit:', error);
            this.showNotification('Error loading announcement', 'error');
        }
    }
    
    // ==============================================
    // LANDING SLIDESHOW FUNCTIONS
    // ==============================================
    
    startSlideshow() {
        if (this.landingAnnouncements.length <= 1) return;
        
        clearInterval(this.slideInterval);
        this.slideInterval = setInterval(() => {
            this.changeSlide(1);
        }, 5000);
    }
    
    changeSlide(direction) {
        if (this.landingAnnouncements.length <= 1) return;
        
        this.currentSlide += direction;
        if (this.currentSlide >= this.landingAnnouncements.length) {
            this.currentSlide = 0;
        } else if (this.currentSlide < 0) {
            this.currentSlide = this.landingAnnouncements.length - 1;
        }
        
        this.goToSlide(this.currentSlide);
    }
    
    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlideshow();
    }
    
    updateSlideshow() {
        const slidesTrack = document.getElementById('landingSlidesTrack');
        const dots = document.querySelectorAll('.slideshow-dot');
        
        if (!slidesTrack) return;
        
        slidesTrack.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }
    
    // ==============================================
    // DASHBOARD SLIDESHOW FUNCTIONS
    // ==============================================
    
    startDashboardSlideshow() {
        if (this.dashboardAnnouncements.length <= 1) return;
        
        clearInterval(this.dashboardInterval);
        this.dashboardInterval = setInterval(() => {
            this.changeDashboardSlide(1);
        }, 6000); // 6 seconds per slide for dashboard
        
        // Update pause button icon
        const pauseIcon = document.getElementById('dashboardPauseIcon');
        if (pauseIcon) {
            pauseIcon.className = 'fas fa-pause';
        }
    }
    
    stopDashboardSlideshow() {
        clearInterval(this.dashboardInterval);
        this.dashboardInterval = null;
        
        // Update pause button icon
        const pauseIcon = document.getElementById('dashboardPauseIcon');
        if (pauseIcon) {
            pauseIcon.className = 'fas fa-play';
        }
    }
    
    toggleDashboardSlideshow() {
        if (this.dashboardInterval) {
            this.stopDashboardSlideshow();
        } else {
            this.startDashboardSlideshow();
        }
    }
    
    changeDashboardSlide(direction) {
        if (this.dashboardAnnouncements.length <= 1) return;
        
        const oldSlide = this.dashboardSlide;
        this.dashboardSlide += direction;
        
        if (this.dashboardSlide >= this.dashboardAnnouncements.length) {
            this.dashboardSlide = 0;
        } else if (this.dashboardSlide < 0) {
            this.dashboardSlide = this.dashboardAnnouncements.length - 1;
        }
        
        this.updateDashboardSlideshow(oldSlide);
    }
    
    goToDashboardSlide(index) {
        if (this.dashboardAnnouncements.length <= 1) return;
        
        const oldSlide = this.dashboardSlide;
        this.dashboardSlide = index;
        this.updateDashboardSlideshow(oldSlide);
    }
    
    updateDashboardSlideshow(oldSlide = null) {
        const slidesTrack = document.getElementById('dashboardSlidesTrack');
        const dots = document.querySelectorAll('#dashboardSlidesDots .slideshow-dot');
        const counter = document.getElementById('dashboardSlideCounter');
        
        if (!slidesTrack) return;
        
        // Remove active class from old slide
        if (oldSlide !== null) {
            const oldSlides = document.querySelectorAll('.dashboard-slide');
            if (oldSlides[oldSlide]) {
                oldSlides[oldSlide].classList.remove('active');
            }
        }
        
        // Add active class to current slide
        const slides = document.querySelectorAll('.dashboard-slide');
        if (slides[this.dashboardSlide]) {
            slides[this.dashboardSlide].classList.add('active');
        }
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.dashboardSlide);
        });
        
        // Update counter
        if (counter) {
            counter.textContent = `${this.dashboardSlide + 1} of ${this.dashboardAnnouncements.length}`;
        }
        
        // Auto-start slideshow if it was running
        if (this.dashboardInterval) {
            clearInterval(this.dashboardInterval);
            this.startDashboardSlideshow();
        }
    }
    
    // ==============================================
    // UI HELPER FUNCTIONS
    // ==============================================
    
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(tabName + 'Tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Update tab buttons
        document.querySelectorAll('.modal-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetBtn = document.querySelector(`.modal-tab[onclick*="switchTab('${tabName}')"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }
    
    switchMediaTab(tabName, clickedTab = null) {
        this.currentMediaType = tabName;
        
        if (!clickedTab) {
            clickedTab = document.querySelector(`.media-tab[data-target="${tabName}"]`);
        }
        
        // Update tab styles
        document.querySelectorAll('.media-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        if (clickedTab) clickedTab.classList.add('active');
        
        // Show selected section
        document.querySelectorAll('.media-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(tabName + 'Section').classList.add('active');
        
        // Reset file selection when switching from gallery
        if (tabName !== 'gallery') {
            this.removePreview();
        }
    }
    
    previewMediaURL(url, mediaType) {
        const urlPreview = document.getElementById('urlPreview');
        if (!urlPreview) return;
        
        if (!this.isValidURL(url)) {
            urlPreview.innerHTML = '<div class="url-error"><i class="fas fa-exclamation-circle"></i> Invalid URL format</div>';
            urlPreview.style.display = 'block';
            return;
        }
        
        urlPreview.innerHTML = '<div class="loading-preview"><i class="fas fa-spinner fa-spin"></i> Loading preview...</div>';
        urlPreview.style.display = 'block';
        
        setTimeout(() => {
            try {
                switch (mediaType) {
                    case 'image':
                        urlPreview.innerHTML = `
                            <div class="url-preview-content">
                                <img src="${url}" alt="URL Preview" 
                                     onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'url-error\\'><i class=\\'fas fa-exclamation-circle\\'></i> Failed to load image</div>';">
                                <div class="url-info">Image URL: ${url}</div>
                            </div>
                        `;
                        break;
                        
                    case 'video':
                        urlPreview.innerHTML = `
                            <div class="url-preview-content">
                                <video controls>
                                    <source src="${url}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                                <div class="url-info">Video URL: ${url}</div>
                            </div>
                        `;
                        break;
                        
                    case 'youtube':
                        const videoId = this.extractYouTubeId(url);
                        if (videoId) {
                            urlPreview.innerHTML = `
                                <div class="url-preview-content">
                                    <iframe src="https://www.youtube.com/embed/${videoId}" 
                                            frameborder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowfullscreen>
                                    </iframe>
                                    <div class="url-info">YouTube Video ID: ${videoId}</div>
                                </div>
                            `;
                        } else {
                            urlPreview.innerHTML = '<div class="url-error"><i class="fas fa-exclamation-circle"></i> Invalid YouTube URL</div>';
                        }
                        break;
                }
            } catch (error) {
                urlPreview.innerHTML = '<div class="url-error"><i class="fas fa-exclamation-circle"></i> Error loading preview</div>';
            }
        }, 500);
    }
    
    resetCreateForm() {
        this.editMode = false;
        this.currentEditId = null;
        this.selectedFile = null;
        
        const form = document.getElementById('enhancedAnnouncementForm');
        if (form) {
            form.reset();
            console.log('Form reset');
        }
        
        this.removePreview();
        
        const urlPreview = document.getElementById('urlPreview');
        if (urlPreview) {
            urlPreview.style.display = 'none';
            urlPreview.innerHTML = '';
        }
        
        const submitBtn = document.querySelector('#enhancedAnnouncementForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Announcement';
            submitBtn.disabled = false;
        }
        
        this.updateDateDisplay();
        
        // Reset to gallery tab
        const galleryTab = document.querySelector('.media-tab[data-target="gallery"]');
        if (galleryTab) {
            this.switchMediaTab('gallery', galleryTab);
        }
    }
    
    updateDateDisplay() {
        const dateInput = document.getElementById('postDate');
        const dateDisplay = document.getElementById('dateDisplay');
        
        if (!dateDisplay || !dateInput) return;
        
        if (dateInput.value) {
            try {
                const date = new Date(dateInput.value);
                dateDisplay.querySelector('span').textContent = 
                    `Will be posted on: ${date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}`;
            } catch (e) {
                dateDisplay.querySelector('span').textContent = 'Invalid date selected';
            }
        } else {
            dateDisplay.querySelector('span').textContent = 'Will be posted immediately';
        }
    }
    
    // ==============================================
    // UTILITY FUNCTIONS
    // ==============================================
    
    checkAdminStatus() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            this.isAdmin = user.role === 'admin' || user.role === 'super_admin';
        } catch (e) {
            this.isAdmin = false;
        }
    }
    
    getCurrentUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return user.id || 'admin';
        } catch (e) {
            return 'admin';
        }
    }
    
    detectMediaType(url) {
        if (!url) return null;
        
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'youtube';
        } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
            return 'video';
        } else if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
            return 'image';
        }
        
        return 'image'; // default
    }
    
    extractYouTubeId(url) {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    isValidURL(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDate(date) {
        if (!date) return 'Unknown date';
        try {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return 'Invalid date';
        }
    }
    
    formatFullDate(date) {
        if (!date) return 'Unknown date';
        try {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Invalid date';
        }
    }
    
    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // ==============================================
    // DASHBOARD SLIDESHOW CSS INJECTION
    // ==============================================
    
injectDashboardSlideshowCSS() {
    const style = document.createElement('style');
    style.textContent = `
        /* Dashboard Slideshow Styles - Mobile First */
        .dashboard-slideshow-container {
            width: 100%;
            overflow: hidden;
            position: relative;
            border-radius: 12px;
            background: var(--primary-dark);
            min-height: 250px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .dashboard-slides-track {
            display: flex;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            height: 100%;
        }
        
        .dashboard-slide {
            flex: 0 0 100%;
            min-height: 250px;
            display: none;
            flex-direction: column;
            padding: 20px;
            color: white;
        }
        
        .dashboard-slide.active {
            display: flex;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0.4; }
            to { opacity: 1; }
        }
        
        .dashboard-slide-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        
        .dashboard-slide .slide-media {
            flex: 1;
            margin-bottom: 15px;
            border-radius: 8px;
            overflow: hidden;
            max-height: 180px;
        }
        
        .dashboard-slide .slide-media img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        }
        
        .dashboard-slide .slide-media video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        }
        
        .dashboard-slide .slide-media iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
        }
        
        .dashboard-slide .slide-header {
            margin-bottom: 10px;
        }
        
        .dashboard-slide .slide-header h3 {
            font-size: 18px;
            margin: 8px 0;
            color: white;
            line-height: 1.3;
        }
        
        .dashboard-slide .slide-body {
            flex: 1;
            margin-bottom: 10px;
        }
        
        .dashboard-slide .slide-body p {
            font-size: 14px;
            line-height: 1.5;
            margin: 10px 0;
            opacity: 0.9;
        }
        
        .dashboard-slide .slide-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 15px;
            margin-top: auto;
        }
        
        .dashboard-slideshow-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .dashboard-slides-dots {
            display: flex;
            gap: 6px;
        }
        
        .dashboard-slides-dots .slideshow-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .dashboard-slides-dots .slideshow-dot.active {
            background: white;
            transform: scale(1.3);
        }
        
        .slideshow-btn {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: none;
            color: white;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all 0.3s;
            opacity: 0.8;
        }
        
        .slideshow-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            opacity: 1;
        }
        
        .dashboard-slideshow-info {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .dashboard-slideshow-info span {
            color: white;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .btn-pause {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            opacity: 0.8;
        }
        
        .btn-pause:hover {
            background: rgba(255, 255, 255, 0.3);
            opacity: 1;
        }
        
        .dashboard-single-announcement {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
            transition: transform 0.3s, box-shadow 0.3s;
            margin-bottom: 20px;
        }
        
        .dashboard-single-announcement:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        
        .dashboard-announcement-content {
            display: flex;
            flex-direction: column;
        }
        
        .dashboard-single-announcement .announcement-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .dashboard-single-announcement .announcement-header h3 {
            font-size: 18px;
            color: #2c3e50;
            margin: 0;
            flex: 1;
        }
        
        .dashboard-single-announcement .announcement-body {
            font-size: 14px;
            color: #34495e;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        
        .dashboard-single-announcement .announcement-footer {
            border-top: 1px solid #eee;
            padding-top: 15px;
            margin-top: auto;
        }
        
        .dashboard-announcement-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            flex-wrap: wrap;
        }
        
        .dashboard-announcement-actions .action-btn {
            padding: 8px 15px;
            font-size: 13px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            font-weight: 600;
            min-height: 36px;
        }
        
        .dashboard-announcement-actions .btn-edit {
            background: #3498db;
            color: white;
        }
        
        .dashboard-announcement-actions .btn-edit:hover {
            background: #2980b9;
        }
        
        .dashboard-announcement-actions .btn-toggle {
            background: #2ecc71;
            color: white;
        }
        
        .dashboard-announcement-actions .btn-toggle:hover {
            background: #27ae60;
        }
        
        .dashboard-announcement-actions .btn-delete {
            background: #e74c3c;
            color: white;
        }
        
        .dashboard-announcement-actions .btn-delete:hover {
            background: #c0392b;
        }
        
        /* Priority badges for dashboard */
        .priority-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 8px;
            color: white;
        }
        
        .priority-badge.priority-high {
            background: #ff4757;
        }
        
        .priority-badge.priority-medium {
            background: #ffa502;
        }
        
        .priority-badge.priority-low {
            background: #2ed573;
        }
        
        .priority-badge.priority-urgent {
            background: #ff3838;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        .announcement-timestamp {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 5px;
        }
        
        .center-date {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .dashboard-single-announcement .announcement-timestamp,
        .dashboard-single-announcement .center-date {
            color: #7f8c8d;
        }
        
        /* Tablet Styles */
        @media (min-width: 768px) {
            .dashboard-slideshow-container {
                min-height: 300px;
            }
            
            .dashboard-slide {
                min-height: 300px;
                padding: 30px;
                flex-direction: row;
            }
            
            .dashboard-slide .slide-media {
                flex: 1;
                margin-right: 30px;
                margin-bottom: 0;
                max-height: 240px;
            }
            
            .dashboard-slide .slide-header h3 {
                font-size: 22px;
            }
            
            .dashboard-slide .slide-body p {
                font-size: 15px;
            }
            
            .slideshow-btn {
                width: 40px;
                height: 40px;
                font-size: 18px;
            }
            
            .dashboard-slides-dots .slideshow-dot {
                width: 10px;
                height: 10px;
            }
            
            .dashboard-single-announcement {
                padding: 25px;
            }
            
            .dashboard-single-announcement .announcement-header h3 {
                font-size: 20px;
            }
            
            .dashboard-single-announcement .announcement-body {
                font-size: 15px;
            }
        }
        
        /* Desktop Styles */
        @media (min-width: 1024px) {
            .dashboard-slideshow-container {
                min-height: 350px;
            }
            
            .dashboard-slide {
                padding: 40px;
            }
            
            .dashboard-slide .slide-header h3 {
                font-size: 24px;
            }
            
            .dashboard-slide .slide-body p {
                font-size: 16px;
            }
            
            .dashboard-announcement-actions .action-btn {
                padding: 10px 18px;
                font-size: 14px;
            }
        }
        
        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            .dashboard-single-announcement {
                background: #2c3e50;
                color: #ecf0f1;
                border-left-color: #667eea;
            }
            
            .dashboard-single-announcement .announcement-header h3,
            .dashboard-single-announcement .announcement-body {
                color: #ecf0f1;
            }
            
            .dashboard-single-announcement .announcement-footer,
            .dashboard-announcement-actions {
                border-color: #4a6572;
            }
            
            .dashboard-single-announcement .announcement-timestamp,
            .dashboard-single-announcement .center-date {
                color: #bdc3c7;
            }
        }
        
        /* Accessibility Improvements */
        .slideshow-btn:focus,
        .btn-pause:focus,
        .dashboard-slides-dots .slideshow-dot:focus,
        .dashboard-announcement-actions .action-btn:focus {
            outline: 2px solid #667eea;
            outline-offset: 2px;
        }
        
        /* Touch-friendly improvements */
        .slideshow-btn,
        .btn-pause,
        .dashboard-slides-dots .slideshow-dot,
        .dashboard-announcement-actions .action-btn {
            min-height: 44px;
            min-width: 44px;
        }
        
        .dashboard-slides-dots .slideshow-dot {
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .dashboard-slides-dots .slideshow-dot::before {
            content: '';
            display: block;
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transition: all 0.3s;
        }
        
        .dashboard-slides-dots .slideshow-dot.active::before {
            background: white;
            transform: scale(1.3);
        }
    `;
    
    document.head.appendChild(style);
}
    
    // ==============================================
    // EVENT LISTENERS SETUP - FIXED FORM SUBMISSION
    // ==============================================
    
    setupEventListeners() {
        // Enhanced form submission - FIXED
        const enhancedForm = document.getElementById('enhancedAnnouncementForm');
        if (enhancedForm) {
            enhancedForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Form submitted');
                
                // Disable submit button
                const submitBtn = enhancedForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
                submitBtn.disabled = true;
                
                try {
                    // Get form values directly from elements
                    const title = document.getElementById('enhancedTitle').value.trim();
                    const content = document.getElementById('enhancedContent').value.trim();
                    const type = document.getElementById('enhancedType').value;
                    const priority = document.getElementById('enhancedPriority').value || 'medium';
                    
                    // DEBUG: Log all form values
                    console.log('Form values collected:');
                    console.log('Title:', title);
                    console.log('Content:', content);
                    console.log('Type:', type);
                    console.log('Priority:', priority);
                    
                    // Validate required fields
                    if (!title) {
                        throw new Error('Title is required');
                    }
                    if (!content) {
                        throw new Error('Content is required');
                    }
                    if (!type) {
                        throw new Error('Announcement type is required');
                    }
                    
                    // Create formData object
                    const formData = {
                        title: title,
                        content: content,
                        type: type, // This should be 'dashboard' or 'landing'
                        priority: priority
                    };
                    
                    console.log('Form data to be saved:', formData);
                    
                    if (this.editMode && this.currentEditId) {
                        console.log('Updating announcement:', this.currentEditId);
                        const success = await this.updateAnnouncement(this.currentEditId, formData);
                        if (success) {
                            this.showNotification('Announcement updated successfully!', 'success');
                        }
                    } else {
                        console.log('Creating new announcement');
                        const announcementId = await this.createAnnouncement(formData);
                        if (announcementId) {
                            this.showNotification('Announcement published successfully!', 'success');
                        }
                    }
                    
                } catch (error) {
                    console.error('Form submission error:', error);
                    this.showNotification(`Error: ${error.message}`, 'error');
                } finally {
                    // Re-enable submit button
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Media tabs
        const mediaTabs = document.querySelectorAll('.media-tab');
        mediaTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = tab.getAttribute('data-target');
                this.switchMediaTab(target, tab);
            });
        });
        
        // URL checker
        const urlInput = document.getElementById('mediaUrlInput');
        const urlTypeRadios = document.querySelectorAll('input[name="urlType"]');
        
        if (urlInput) {
            const checkAndPreviewURL = () => {
                const url = urlInput.value.trim();
                const mediaType = document.querySelector('input[name="urlType"]:checked')?.value || 'image';
                
                if (url) {
                    this.previewMediaURL(url, mediaType);
                } else {
                    const urlPreview = document.getElementById('urlPreview');
                    if (urlPreview) {
                        urlPreview.style.display = 'none';
                        urlPreview.innerHTML = '';
                    }
                }
            };
            
            urlInput.addEventListener('input', checkAndPreviewURL);
            
            urlTypeRadios.forEach(radio => {
                radio.addEventListener('change', checkAndPreviewURL);
            });
        }
        
        // Post date display
        const postDateInput = document.getElementById('postDate');
        if (postDateInput) {
            postDateInput.addEventListener('change', () => {
                this.updateDateDisplay();
            });
        }
        
        // Search and filter
        const searchInput = document.getElementById('announcementSearch');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterAnnouncements();
            });
        }
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filterAnnouncements();
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterAnnouncements();
            });
        }
        
        // Setup gallery upload
        this.setupGalleryUpload();
    }
}

// ==============================================
// GLOBAL FUNCTIONS
// ==============================================

// Open enhanced modal
function openEnhancedModal() {
    const modal = document.getElementById('enhancedAnnouncementModal');
    if (modal) {
        modal.style.display = 'block';
        if (window.announcementManager) {
            window.announcementManager.loadAllAnnouncements();
            window.announcementManager.switchTab('create');
        }
    }
}

// Close enhanced modal
function closeEnhancedModal() {
    const modal = document.getElementById('enhancedAnnouncementModal');
    if (modal) {
        modal.style.display = 'none';
        if (window.announcementManager) {
            window.announcementManager.resetCreateForm();
        }
    }
}

// Change slide for landing announcements
function changeSlide(direction) {
    if (window.announcementManager) {
        window.announcementManager.changeSlide(direction);
    }
}

// Change slide for dashboard announcements
function changeDashboardSlide(direction) {
    if (window.announcementManager) {
        window.announcementManager.changeDashboardSlide(direction);
    }
}

// Go to specific dashboard slide
function goToDashboardSlide(index) {
    if (window.announcementManager) {
        window.announcementManager.goToDashboardSlide(index);
    }
}

// Toggle dashboard slideshow
function toggleDashboardSlideshow() {
    if (window.announcementManager) {
        window.announcementManager.toggleDashboardSlideshow();
    }
}

// Refresh dashboard announcements
function refreshDashboardAnnouncements() {
    if (window.announcementManager) {
        window.announcementManager.loadAllAnnouncements();
        window.announcementManager.showNotification('Announcements refreshed!', 'success');
    }
}

// Reset form
function resetForm() {
    if (window.announcementManager) {
        window.announcementManager.resetCreateForm();
    }
}

// Update date display
function updateDateDisplay() {
    if (window.announcementManager) {
        window.announcementManager.updateDateDisplay();
    }
}

// Switch tab
function switchTab(tabName) {
    if (window.announcementManager) {
        window.announcementManager.switchTab(tabName);
    }
}

// Switch media tab
function switchMediaTab(tabName) {
    if (window.announcementManager) {
        window.announcementManager.switchMediaTab(tabName);
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('enhancedAnnouncementModal');
    if (modal && e.target === modal) {
        closeEnhancedModal();
    }
});

// Close with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEnhancedModal();
    }
});

// Initialize the manager when the page loads
let announcementManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing announcement system...');
    
    // Create announcement manager
    announcementManager = new AnnouncementManager();
    
    // Make it globally available
    window.announcementManager = announcementManager;
    
    // Also make utility functions globally available
    window.openEnhancedModal = () => {
        const modal = document.getElementById('enhancedAnnouncementModal');
        if (modal) {
            modal.style.display = 'block';
            if (announcementManager) {
                announcementManager.loadAllAnnouncements();
                announcementManager.switchTab('create');
            }
        }
    };
    
    window.closeEnhancedModal = () => {
        const modal = document.getElementById('enhancedAnnouncementModal');
        if (modal) {
            modal.style.display = 'none';
            if (announcementManager) {
                announcementManager.resetCreateForm();
            }
        }
    };
    
    window.changeSlide = (direction) => {
        if (announcementManager) {
            announcementManager.changeSlide(direction);
        }
    };
    
    window.changeDashboardSlide = (direction) => {
        if (announcementManager) {
            announcementManager.changeDashboardSlide(direction);
        }
    };
    
    window.goToDashboardSlide = (index) => {
        if (announcementManager) {
            announcementManager.goToDashboardSlide(index);
        }
    };
    
    window.toggleDashboardSlideshow = () => {
        if (announcementManager) {
            announcementManager.toggleDashboardSlideshow();
        }
    };
    
    console.log('Announcement system initialization started');
});

