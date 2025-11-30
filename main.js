// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAn11I8UWwjtFByEZl7GQlHr5ArEADzs5A",
    authDomain: "tanzania-mining-investment.firebaseapp.com",
    projectId: "tanzania-mining-investment",
    storageBucket: "tanzania-mining-investment.firebasestorage.app",
    messagingSenderId: "952399697790",
    appId: "1:952399697790:web:a33ab8a1f73682e447052f"
};

// Database Class
class Database {
    constructor() {
        console.log('🔄 Database constructor called');
        
        this.currentUser = null;
        this.useFirestore = false;
        
        // Try to initialize Firebase
        try {
            if (typeof firebase !== 'undefined') {
                this.app = firebase.initializeApp(firebaseConfig);
                this.db = firebase.firestore(this.app);
                this.auth = firebase.auth(this.app);
                this.useFirestore = true;
                console.log('✅ Firebase initialized successfully');
            } else {
                console.log('⚠️ Firebase SDK not loaded');
            }
        } catch (error) {
            console.log('⚠️ Firebase initialization failed:', error);
        }
        
        // Currency formatting
        this.formatCurrency = (amount) => {
            if (typeof amount !== 'number') amount = parseFloat(amount) || 0;
            return new Intl.NumberFormat('en-TZ', {
                style: 'currency',
                currency: 'TZS'
            }).format(amount);
        };
        
        this.formatNumber = (number) => {
            if (typeof number !== 'number') number = parseFloat(number) || 0;
            return new Intl.NumberFormat('en-TZ').format(number);
        };

        // Initialize database
        this.initDatabase();
    }

    async initDatabase() {
        console.log('🔄 Initializing database...');
        
        if (this.useFirestore) {
            try {
                const usersSnapshot = await this.db.collection('users').get();
                
                if (usersSnapshot.empty) {
                    console.log('🚀 Creating initial admin users in Firestore...');
                    await this.createInitialAdmins();
                } else {
                    console.log('📁 Existing Firestore database found with', usersSnapshot.size, 'users');
                    await this.ensureSuperAdminExists();
                }
            } catch (error) {
                console.error('❌ Firestore initialization failed:', error);
                this.useFirestore = false;
                this.initLocalStorageDatabase();
            }
        } else {
            this.initLocalStorageDatabase();
        }
    }

    initLocalStorageDatabase() {
        console.log('🔄 Using localStorage database');
        let users = JSON.parse(localStorage.getItem('mining_users') || '[]');
        
        if (users.length === 0) {
            console.log('🚀 Creating initial admin users in localStorage...');
            users = this.getInitialAdmins();
            localStorage.setItem('mining_users', JSON.stringify(users));
            localStorage.setItem('mining_next_id', '4');
        }
        
        // Ensure super admin exists
        const kingHaruniExists = users.some(user => user.email === 'kingharuni420@gmail.com');
        if (!kingHaruniExists) {
            console.log('👑 Adding super admin user...');
            const superAdmin = this.createSuperAdminData(users.length + 1);
            users.push(superAdmin);
            localStorage.setItem('mining_users', JSON.stringify(users));
            localStorage.setItem('mining_next_id', (users.length + 1).toString());
        }
    }

    getInitialAdmins() {
        return [
            {
                id: 1,
                username: 'kingharuni',
                email: 'kingharuni420@gmail.com',
                password: 'Rehema@mam',
                admin_password: 'Rehema@mam',
                referral_code: 'KING001',
                referred_by: null,
                join_date: new Date().toISOString(),
                status: 'active',
                is_admin: true,
                is_super_admin: true,
                admin_role: 'super_admin',
                permissions: ['all'],
                balance: 10000000,
                investments: [],
                referrals: [],
                transactions: [],
                has_received_referral_bonus: false
            },
            {
                id: 2,
                username: 'halunihillison',
                email: 'mining.investment.tanzania@proton.me',
                password: 'user123',
                admin_password: 'Kalinga@25',
                referral_code: 'HALUNI002',
                referred_by: null,
                join_date: new Date().toISOString(),
                status: 'active',
                is_admin: true,
                is_super_admin: false,
                admin_role: 'admin',
                permissions: ['user_management', 'transaction_approval', 'chat_support'],
                balance: 5000000,
                investments: [],
                referrals: [],
                transactions: [],
                has_received_referral_bonus: false
            },
            {
                id: 3,
                username: 'mininginvestment',
                email: 'mining.investment.tanzania@proton.me',
                password: 'user123',
                admin_password: 'Kalinga@25',
                referral_code: 'MINING003',
                referred_by: null,
                join_date: new Date().toISOString(),
                status: 'active',
                is_admin: true,
                is_super_admin: false,
                admin_role: 'admin',
                permissions: ['user_management', 'transaction_approval', 'reports'],
                balance: 5000000,
                investments: [],
                referrals: [],
                transactions: [],
                has_received_referral_bonus: false
            }
        ];
    }

    createSuperAdminData(id) {
        return {
            id: id,
            username: 'kingharuni',
            email: 'kingharuni420@gmail.com',
            password: 'Rehema@mam',
            admin_password: 'Rehema@mam',
            referral_code: 'KING001',
            referred_by: null,
            join_date: new Date().toISOString(),
            status: 'active',
            is_admin: true,
            is_super_admin: true,
            admin_role: 'super_admin',
            permissions: ['all'],
            balance: 10000000,
            investments: [],
            referrals: [],
            transactions: [],
            has_received_referral_bonus: false
        };
    }

    async createInitialAdmins() {
        const initialAdmins = this.getInitialAdmins();
        
        for (const admin of initialAdmins) {
            await this.db.collection('users').doc(admin.id.toString()).set(admin);
        }
        
        await this.db.collection('counters').doc('next_id').set({ value: 4 });
        console.log('✅ Initial admin users created in Firestore');
    }

    async ensureSuperAdminExists() {
        try {
            const superAdminQuery = await this.db.collection('users')
                .where('email', '==', 'kingharuni420@gmail.com')
                .get();
                
            if (superAdminQuery.empty) {
                console.log('👑 Adding super admin user to Firestore...');
                const usersSnapshot = await this.db.collection('users').get();
                const nextId = usersSnapshot.size + 1;
                const superAdmin = this.createSuperAdminData(nextId);
                
                await this.db.collection('users').doc(nextId.toString()).set(superAdmin);
                await this.db.collection('counters').doc('next_id').set({ value: nextId + 1 });
            }
        } catch (error) {
            console.error('❌ Error ensuring super admin exists:', error);
        }
    }

    // User Management Methods
    async getUsers() {
        if (this.useFirestore) {
            try {
                const usersSnapshot = await this.db.collection('users').get();
                const users = [];
                usersSnapshot.forEach(doc => {
                    users.push({ id: doc.id, ...doc.data() });
                });
                return users;
            } catch (error) {
                console.error('❌ Firestore getUsers error:', error);
                this.useFirestore = false;
            }
        }
        
        return JSON.parse(localStorage.getItem('mining_users') || '[]');
    }

    async saveUsers(users) {
        if (!this.useFirestore) {
            localStorage.setItem('mining_users', JSON.stringify(users));
            return;
        }
        
        try {
            for (const user of users) {
                await this.db.collection('users').doc(user.id.toString()).set(user);
            }
        } catch (error) {
            console.error('❌ Firestore saveUsers error:', error);
            localStorage.setItem('mining_users', JSON.stringify(users));
        }
    }

    async getNextId() {
        if (!this.useFirestore) {
            const nextId = parseInt(localStorage.getItem('mining_next_id') || '1');
            localStorage.setItem('mining_next_id', (nextId + 1).toString());
            return nextId;
        }

        try {
            const counterDoc = await this.db.collection('counters').doc('next_id').get();
            if (counterDoc.exists) {
                const currentId = counterDoc.data().value;
                await this.db.collection('counters').doc('next_id').update({ value: currentId + 1 });
                return currentId;
            } else {
                await this.db.collection('counters').doc('next_id').set({ value: 2 });
                return 1;
            }
        } catch (error) {
            console.error('❌ Firestore getNextId error:', error);
            const nextId = parseInt(localStorage.getItem('mining_next_id') || '1');
            localStorage.setItem('mining_next_id', (nextId + 1).toString());
            return nextId;
        }
    }

    async findUserByEmailOrUsername(identifier) {
        const users = await this.getUsers();
        return users.find(user => 
            user.email.toLowerCase() === identifier.toLowerCase() || 
            user.username.toLowerCase() === identifier.toLowerCase()
        );
    }

    async findUserById(id) {
        if (this.useFirestore) {
            try {
                const userDoc = await this.db.collection('users').doc(id.toString()).get();
                return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
            } catch (error) {
                console.error('❌ Firestore findUserById error:', error);
                this.useFirestore = false;
            }
        }
        
        const users = await this.getUsers();
        return users.find(user => user.id == id);
    }

    async findUserByReferralCode(referralCode) {
        const users = await this.getUsers();
        return users.find(user => 
            user.referral_code && user.referral_code.toUpperCase() === referralCode.toUpperCase()
        );
    }

    async getUsersByReferrer(referralCode) {
        const users = await this.getUsers();
        return users.filter(user => user.referred_by === referralCode);
    }

    isSuperAdmin(user) {
        return user && user.email === 'kingharuni420@gmail.com' && user.is_super_admin === true;
    }

    isAdminEmail(email) {
        const adminEmails = [
            'kingharuni420@gmail.com',
            'mining.investment.tanzania@proton.me',
            'halunihillison@gmail.com',
            'mining.investment25@gmail.com',
            'chamahuru01@gmail.com',
            'fracozecompany@gmail.com',
            'harunihilson@gmail.com'
        ];
        return adminEmails.includes(email.toLowerCase());
    }

    isRegularAdminEmail(email) {
        const regularAdminEmails = [
            'mining.investment.tanzania@proton.me',
            'halunihillison@gmail.com',
            'mining.investment25@gmail.com',
            'chamahuru01@gmail.com',
            'fracozecompany@gmail.com',
            'harunihilson@gmail.com'
        ];
        return regularAdminEmails.includes(email.toLowerCase());
    }

    async createUser(userData) {
    try {
        const nextId = await this.getNextId();
        console.log('🎯 Creating user with ID:', nextId);
        
        const newUser = {
            id: nextId,
            username: userData.username,
            email: userData.email,
            password: userData.password,
            referral_code: userData.referral_code,
            referred_by: userData.referred_by,
            join_date: new Date().toISOString(),
            status: 'active',
            is_admin: false,
            is_super_admin: false,
            admin_role: 'user',
            permissions: [],
            balance: 0,
            investments: [],
            referrals: [],
            transactions: [],
            has_received_referral_bonus: false
        };

        console.log('💾 Saving user to database...');
        
        if (this.useFirestore && this.db) {
            try {
                await this.db.collection('users').doc(nextId.toString()).set(newUser);
                console.log('✅ User saved to Firestore');
            } catch (firestoreError) {
                console.error('❌ Firestore save failed:', firestoreError);
                // Fallback to localStorage
                this.useFirestore = false;
                throw new Error('Database connection failed. Please try again.');
            }
        } else {
            // Use localStorage
            const users = JSON.parse(localStorage.getItem('mining_users') || '[]');
            users.push(newUser);
            localStorage.setItem('mining_users', JSON.stringify(users));
            console.log('✅ User saved to localStorage');
        }
        
        return newUser;
    } catch (error) {
        console.error('❌ Create user error:', error);
        throw error;
    }
}
    // Authentication Methods
    async registerUser(userData) {
    try {
        console.log('🔄 Starting user registration...', userData);
        
        // Validate required fields
        if (!userData.username || !userData.email || !userData.password) {
            throw new Error('Missing required fields: username, email, and password are required');
        }

        // Check if user already exists
        const existingUser = await this.findUserByEmailOrUsername(userData.email) || 
                            await this.findUserByEmailOrUsername(userData.username);
        if (existingUser) {
            throw new Error('Username or email already exists');
        }

        // Generate referral code if not provided
        let referralCode = userData.referral_code;
        if (!referralCode) {
            let attempts = 0;
            do {
                referralCode = this.generateReferralCode();
                attempts++;
                if (attempts > 10) {
                    throw new Error('Failed to generate unique referral code');
                }
            } while (await this.findUserByReferralCode(referralCode));
        }

        // Create user object
        const userDoc = {
            username: userData.username,
            email: userData.email,
            password: userData.password,
            referral_code: referralCode,
            referred_by: userData.referred_by || null
        };

        console.log('📝 Creating user document:', userDoc);

        // Try to create user in Firebase Auth first (if available)
        let firebaseUser = null;
        if (this.auth && this.useFirestore) {
            try {
                console.log('🔥 Attempting Firebase Auth registration...');
                const userCredential = await this.auth.createUserWithEmailAndPassword(
                    userData.email, 
                    userData.password
                );
                firebaseUser = userCredential.user;
                console.log('✅ Firebase Auth user created:', firebaseUser.uid);
            } catch (authError) {
                console.log('⚠️ Firebase Auth registration failed, using database only:', authError.message);
                // Continue with database registration
            }
        }

        // Create user in database
        const newUser = await this.createUser(userDoc);
        this.currentUser = newUser;
        
        console.log('✅ User registered successfully in database:', userData.email);
        return newUser;
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        // Provide more specific error messages
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('Email is already registered');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Invalid email address');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('Password should be at least 6 characters');
        } else {
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    }
}   

// Add this method to your Database class
generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

    async loginUser(email, password) {
        try {
            // Try Firebase Auth first
            if (this.auth) {
                try {
                    const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
                    const firebaseUser = userCredential.user;
                    
                    // Find user in our database
                    const userDoc = await this.findUserByEmailOrUsername(email);
                    if (userDoc) {
                        this.currentUser = userDoc;
                        console.log('✅ User logged in via Firebase Auth:', email);
                        return this.currentUser;
                    }
                } catch (authError) {
                    console.log('🔄 Firebase Auth failed, trying database login...');
                }
            }
            
            // Database login fallback
            const user = await this.findUserByEmailOrUsername(email);
            
            if (!user) {
                throw new Error('User not found! Please check your email/username or contact support.');
            }
            
            if (user.status === 'inactive') {
                throw new Error('Your account has been deactivated. Please contact administrator.');
            }
            
            if (user.password !== password) {
                throw new Error('Invalid password!');
            }
            
            this.currentUser = user;
            console.log('✅ User logged in via database:', email);
            return this.currentUser;
            
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    async logoutUser() {
        try {
            if (this.auth) {
                await this.auth.signOut();
            }
            this.currentUser = null;
            console.log('✅ User logged out');
        } catch (error) {
            console.error('❌ Logout error:', error);
            throw error;
        }
    }

    // Transaction Methods
    async createTransaction(userId, type, amount, method, details = {}) {
        const user = await this.findUserById(userId);
        if (!user) return null;

        const transactionId = await this.getNextTransactionId();
        const transaction = {
            id: transactionId,
            userId: userId,
            username: user.username,
            type: type,
            amount: parseFloat(amount),
            method: method,
            status: 'pending',
            date: new Date().toISOString(),
            details: details,
            adminActionDate: null,
            adminId: null
        };

        const updatedTransactions = [...(user.transactions || []), transaction];
        await this.updateUser(userId, {
            transactions: updatedTransactions
        });

        console.log('✅ Transaction created:', transactionId);
        return transaction;
    }

    async getNextTransactionId() {
        if (!this.useFirestore) {
            let nextId = localStorage.getItem('mining_next_transaction_id');
            if (!nextId) {
                nextId = 1;
            } else {
                nextId = parseInt(nextId) + 1;
            }
            localStorage.setItem('mining_next_transaction_id', nextId.toString());
            return nextId;
        }

        try {
            const counterDoc = await this.db.collection('counters').doc('next_transaction_id').get();
            if (counterDoc.exists) {
                const currentId = counterDoc.data().value;
                await this.db.collection('counters').doc('next_transaction_id').update({ value: currentId + 1 });
                return currentId;
            } else {
                await this.db.collection('counters').doc('next_transaction_id').set({ value: 2 });
                return 1;
            }
        } catch (error) {
            console.error('❌ Firestore getNextTransactionId error:', error);
            let nextId = localStorage.getItem('mining_next_transaction_id');
            if (!nextId) {
                nextId = 1;
            } else {
                nextId = parseInt(nextId) + 1;
            }
            localStorage.setItem('mining_next_transaction_id', nextId.toString());
            return nextId;
        }
    }

    async getPendingTransactions() {
        const users = await this.getUsers();
        const pendingTransactions = [];
        
        users.forEach(user => {
            if (user.transactions) {
                user.transactions.forEach(transaction => {
                    if (transaction.status === 'pending') {
                        pendingTransactions.push({
                            ...transaction,
                            username: user.username,
                            email: user.email
                        });
                    }
                });
            }
        });
        
        return pendingTransactions;
    }

    async getAllTransactions() {
        const users = await this.getUsers();
        const allTransactions = [];
        
        users.forEach(user => {
            if (user.transactions) {
                user.transactions.forEach(transaction => {
                    allTransactions.push({
                        ...transaction,
                        username: user.username,
                        email: user.email
                    });
                });
            }
        });
        
        return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async updateTransactionStatus(userId, transactionId, status, adminId) {
        const user = await this.findUserById(userId);
        if (!user || !user.transactions) return false;

        const transactionIndex = user.transactions.findIndex(t => t.id == transactionId);
        if (transactionIndex === -1) return false;

        const oldStatus = user.transactions[transactionIndex].status;
        user.transactions[transactionIndex].status = status;
        user.transactions[transactionIndex].adminActionDate = new Date().toISOString();
        user.transactions[transactionIndex].adminId = adminId;

        if (user.transactions[transactionIndex].type === 'deposit' && status === 'approved') {
            user.balance += user.transactions[transactionIndex].amount;
        } else if (user.transactions[transactionIndex].type === 'withdrawal' && status === 'rejected' && oldStatus === 'pending') {
            user.balance += user.transactions[transactionIndex].amount;
        }

        await this.updateUser(userId, {
            transactions: user.transactions,
            balance: user.balance
        });

        return true;
    }

    async getUserTransactions(userId) {
        const user = await this.findUserById(userId);
        if (!user || !user.transactions) return [];
        
        return user.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async processWithdrawalRequest(userId, amount) {
        const user = await this.findUserById(userId);
        if (!user) return false;

        if (user.balance < amount) return false;

        user.balance -= amount;
        await this.updateUser(userId, { balance: user.balance });
        return true;
    }

    async hasWithdrawnToday(userId) {
        const user = await this.findUserById(userId);
        if (!user || !user.transactions) return false;

        const today = new Date().toDateString();
        return user.transactions.some(t => {
            if (t.type === 'withdrawal' && t.status === 'approved') {
                const transactionDate = new Date(t.date).toDateString();
                return transactionDate === today;
            }
            return false;
        });
    }

    isWithdrawalAllowed() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();

        if (day >= 1 && day <= 5) return true;
        if ((day === 0 || day === 6) && hour >= 14 && hour < 23) return true;
        
        return false;
    }

    async getTotalDeposits() {
        const users = await this.getUsers();
        let total = 0;
        
        users.forEach(user => {
            if (user.transactions) {
                user.transactions.forEach(transaction => {
                    if (transaction.type === 'deposit' && transaction.status === 'approved') {
                        total += transaction.amount;
                    }
                });
            }
        });
        
        return total;
    }

    async getTotalWithdrawals() {
        const users = await this.getUsers();
        let total = 0;
        
        users.forEach(user => {
            if (user.transactions) {
                user.transactions.forEach(transaction => {
                    if (transaction.type === 'withdrawal' && transaction.status === 'approved') {
                        total += transaction.amount;
                    }
                });
            }
        });
        
        return total;
    }

    async getTotalUsers() {
        const users = await this.getUsers();
        return users.length;
    }

    async getTodaySignups() {
        const users = await this.getUsers();
        const today = new Date().toDateString();
        return users.filter(user => {
            const userDate = new Date(user.join_date).toDateString();
            return userDate === today;
        }).length;
    }
}

// Initialize database
const db = new Database();

// UI Functions
function initLoginTabs() {
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginTab && signupTab && loginForm && signupForm) {
        loginTab.addEventListener('click', () => {
            loginForm.classList.add('active');
            signupForm.classList.remove('active');
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
        });
        
        signupTab.addEventListener('click', () => {
            signupForm.classList.add('active');
            loginForm.classList.remove('active');
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
        });
        
        // Check for admin email when typing
        const loginEmail = document.getElementById('login-email');
        if (loginEmail) {
            loginEmail.addEventListener('input', function() {
                const adminSection = document.getElementById('admin-password-section');
                if (adminSection) {
                    if (db.isAdminEmail(this.value)) {
                        adminSection.style.display = 'block';
                    } else {
                        adminSection.style.display = 'none';
                    }
                }
            });
        }
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const adminPassword = document.getElementById('admin-password')?.value || '';

    try {
        const user = await db.loginUser(email, password);
        
        if (!user) {
            alert('❌ User not found! Please check your email/username or contact support.');
            return;
        }

        // SUPER ADMIN LOGIN
        if (email.toLowerCase() === 'kingharuni420@gmail.com') {
            if (password === 'Rehema@mam') {
                db.currentUser = {
                    ...user,
                    is_super_admin: true,
                    is_admin: true,
                    permissions: ['all'],
                    admin_role: 'super_admin'
                };
                showSuperAdminDashboard();
                return;
            } else {
                alert('❌ Invalid super admin password!');
                return;
            }
        }

        // REGULAR ADMIN LOGIN
        if (user.is_admin || db.isAdminEmail(user.email)) {
            if (adminPassword === user.admin_password) {
                db.currentUser = user;
                showAdminDashboard();
            } else {
                alert('❌ Invalid admin password!');
            }
            return;
        }

        // REGULAR USER LOGIN
        db.currentUser = user;
        showUserDashboard();
        
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

async function signup() {
    // Get input values safely
    const usernameInput = document.getElementById('signup-username');
    const emailInput = document.getElementById('signup-email');
    const referralInput = document.getElementById('signup-referral');
    const passwordInput = document.getElementById('signup-password');
    const password2Input = document.getElementById('signup-password2');
    
    // Check if all inputs exist
    if (!usernameInput || !emailInput || !referralInput || !passwordInput || !password2Input) {
        alert('❌ Signup form not properly loaded. Please refresh the page.');
        return;
    }
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const referralCode = referralInput.value.trim().toUpperCase();
    const password = passwordInput.value;
    const password2 = password2Input.value;
    
    // Validate required fields
    if (!username || !email || !referralCode || !password) {
        alert('❌ Please fill all fields');
        return;
    }
    
    if (password !== password2) {
        alert('❌ Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('❌ Password must be at least 6 characters long');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('❌ Please enter a valid email address');
        return;
    }
    
    // Username validation
    if (username.length < 3) {
        alert('❌ Username must be at least 3 characters long');
        return;
    }
    
    try {
        console.log('🔄 Starting signup process...');
        
        // Check referral code
        console.log('🔍 Checking referral code:', referralCode);
        const referrer = await db.findUserByReferralCode(referralCode);
        
        if (!referrer) {
            alert('❌ Invalid referral code. Please use KING001, HALUNI002, or MINING003');
            return;
        }
        console.log('✅ Referral code valid. Referrer:', referrer.username);
        
        // Check if username already exists
        const existingUsername = await db.findUserByEmailOrUsername(username);
        if (existingUsername) {
            alert('❌ Username already exists. Please choose a different username.');
            return;
        }
        
        // Check if email already exists
        const existingEmail = await db.findUserByEmailOrUsername(email);
        if (existingEmail) {
            alert('❌ Email already exists. Please use a different email address.');
            return;
        }
        
        // Show loading state
        const signupBtn = document.querySelector('#signup-form button');
        const originalText = signupBtn.textContent;
        signupBtn.textContent = 'Creating Account...';
        signupBtn.disabled = true;
        
        // Create new user
        const newUser = await db.registerUser({
            username: username,
            email: email,
            password: password,
            referred_by: referralCode
        });
        
        console.log('✅ User created:', newUser.username);
        
        // Update referrer's referrals
        try {
            const updatedReferrer = await db.findUserByReferralCode(referralCode);
            if (updatedReferrer) {
                const updatedReferrals = [...(updatedReferrer.referrals || []), {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    join_date: newUser.join_date
                }];
                
                await db.updateUser(updatedReferrer.id, {
                    referrals: updatedReferrals
                });
                console.log('✅ Referrer updated:', updatedReferrer.username);
            }
        } catch (referralError) {
            console.log('⚠️ Could not update referrer referrals:', referralError.message);
            // Continue anyway - this is not critical
        }
        
        // Show success message
        alert('✅ Account created successfully! Welcome to Tanzania Mining Investment.');
        
        // Show user dashboard
        showUserDashboard();
        
    } catch (error) {
        console.error('❌ Registration failed:', error);
        
        // Reset button
        const signupBtn = document.querySelector('#signup-form button');
        signupBtn.textContent = 'Sign Up';
        signupBtn.disabled = false;
        
        // Show user-friendly error message
        alert('❌ ' + (error.message || 'Registration failed. Please try again.'));
    }
}














function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Dashboard Functions
function showUserDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    updateUserDashboard();
}

function showAdminDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    updateAdminDashboard();
}

function showSuperAdminDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'block';
    
    updateSuperAdminDashboard();
}

function showAuthSection() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'none';
}

function logout() {
    db.logoutUser();
    showAuthSection();
}

// Update Dashboard Data
async function updateUserDashboard() {
    if (!db.currentUser) return;

    // Update user info
    document.getElementById('user-name').textContent = db.currentUser.username;
    document.getElementById('user-email').textContent = db.currentUser.email;
    document.getElementById('user-balance').textContent = db.formatCurrency(db.currentUser.balance);
    document.getElementById('user-referral-code').textContent = db.currentUser.referral_code;
    
    // Load referrals
    await loadUserReferrals();
}

async function updateAdminDashboard() {
    if (!db.currentUser) return;

    // Update admin info
    document.getElementById('admin-name').textContent = db.currentUser.username;
    document.getElementById('admin-email').textContent = db.currentUser.email;
    document.getElementById('admin-referral-code').textContent = db.currentUser.referral_code;
    
    // Load admin data
    await loadAdminUsers();
    await loadAdminReferrals();
    await loadAdminInvestments();
    await loadPendingTransactions();
}

async function updateSuperAdminDashboard() {
    if (!db.currentUser) return;

    document.getElementById('super-admin-name').textContent = db.currentUser.username;
    
    // Load super admin data
    await loadAllUsers();
    await loadAllTransactions();
    await loadSystemStats();
}

// Data Loading Functions
async function loadUserReferrals() {
    const referralsList = document.getElementById('user-referrals-list');
    if (!referralsList) return;

    if (!db.currentUser.referrals || db.currentUser.referrals.length === 0) {
        referralsList.innerHTML = '<p>No referrals yet. Share your referral code to grow your network!</p>';
        return;
    }
    
    let html = '';
    db.currentUser.referrals.forEach(ref => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${ref.username || 'N/A'}</div>
                    <div class="referral-date">${new Date(ref.join_date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Email:</strong> ${ref.email || 'N/A'}</div>
                    <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                </div>
            </div>
        `;
    });
    
    referralsList.innerHTML = html;
}

async function loadAdminUsers() {
    const usersList = document.getElementById('admin-users-list');
    if (!usersList) return;

    const users = await db.getUsers();
    
    let html = '';
    users.forEach(user => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${user.username} ${user.is_admin ? '<span style="color: #dc3545;">(Admin)</span>' : ''}</div>
                    <div class="referral-date">${new Date(user.join_date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Email:</strong> ${user.email}</div>
                    <div><strong>Referral Code:</strong> ${user.referral_code}</div>
                    <div><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</div>
                    <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                </div>
            </div>
        `;
    });
    
    usersList.innerHTML = html;
}

async function loadAdminReferrals() {
    const referralsList = document.getElementById('admin-referrals-list');
    if (!referralsList) return;

    const referrals = await db.getUsersByReferrer(db.currentUser.referral_code);
    
    if (referrals.length === 0) {
        referralsList.innerHTML = '<p>No referrals yet. Share your referral code to grow your network!</p>';
        return;
    }
    
    let html = '';
    referrals.forEach(user => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${user.username}</div>
                    <div class="referral-date">${new Date(user.join_date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Email:</strong> ${user.email}</div>
                    <div><strong>Referral Code:</strong> ${user.referral_code}</div>
                    <div><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</div>
                    <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                </div>
            </div>
        `;
    });
    
    referralsList.innerHTML = html;
}

async function loadAdminInvestments() {
    const investmentsList = document.getElementById('admin-investments-list');
    if (!investmentsList) return;

    const users = await db.getUsers();
    const allInvestments = [];
    
    users.forEach(user => {
        if (user.investments) {
            user.investments.forEach(inv => {
                allInvestments.push({
                    username: user.username,
                    plan: inv.plan,
                    amount: inv.amount,
                    date: inv.date
                });
            });
        }
    });
    
    if (allInvestments.length === 0) {
        investmentsList.innerHTML = '<p>No investments yet.</p>';
        return;
    }
    
    allInvestments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    allInvestments.slice(0, 10).forEach(inv => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${inv.username}</div>
                    <div class="referral-date">${new Date(inv.date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Plan:</strong> ${inv.plan.toUpperCase()}</div>
                    <div><strong>Amount:</strong> ${db.formatCurrency(inv.amount)}</div>
                </div>
            </div>
        `;
    });
    
    investmentsList.innerHTML = html;
}

async function loadPendingTransactions() {
    const transactionsList = document.getElementById('pending-transactions-list');
    if (!transactionsList) return;

    const pendingTransactions = await db.getPendingTransactions();
    
    if (pendingTransactions.length === 0) {
        transactionsList.innerHTML = '<p>No pending transactions.</p>';
        return;
    }
    
    let html = '';
    pendingTransactions.forEach(transaction => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${transaction.username}</div>
                    <div class="referral-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Type:</strong> ${transaction.type}</div>
                    <div><strong>Amount:</strong> ${db.formatCurrency(transaction.amount)}</div>
                    <div><strong>Method:</strong> ${transaction.method}</div>
                    <div>
                        <button onclick="approveTransaction(${transaction.userId}, ${transaction.id})" class="btn-success">Approve</button>
                        <button onclick="rejectTransaction(${transaction.userId}, ${transaction.id})" class="btn-danger">Reject</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    transactionsList.innerHTML = html;
}

async function loadAllUsers() {
    const usersList = document.getElementById('all-users-list');
    if (!usersList) return;

    const users = await db.getUsers();
    
    let html = '';
    users.forEach(user => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${user.username} 
                        ${user.is_super_admin ? '<span style="color: #ff6b00;">(Super Admin)</span>' : ''}
                        ${user.is_admin && !user.is_super_admin ? '<span style="color: #dc3545;">(Admin)</span>' : ''}
                    </div>
                    <div class="referral-date">${new Date(user.join_date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Email:</strong> ${user.email}</div>
                    <div><strong>Referral Code:</strong> ${user.referral_code}</div>
                    <div><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</div>
                    <div><strong>Status:</strong> <span style="color: #28a745;">${user.status}</span></div>
                </div>
            </div>
        `;
    });
    
    usersList.innerHTML = html;
}

async function loadAllTransactions() {
    const transactionsList = document.getElementById('all-transactions-list');
    if (!transactionsList) return;

    const allTransactions = await db.getAllTransactions();
    
    if (allTransactions.length === 0) {
        transactionsList.innerHTML = '<p>No transactions yet.</p>';
        return;
    }
    
    let html = '';
    allTransactions.forEach(transaction => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${transaction.username}</div>
                    <div class="referral-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Type:</strong> ${transaction.type}</div>
                    <div><strong>Amount:</strong> ${db.formatCurrency(transaction.amount)}</div>
                    <div><strong>Method:</strong> ${transaction.method}</div>
                    <div><strong>Status:</strong> 
                        <span style="color: ${transaction.status === 'approved' ? '#28a745' : transaction.status === 'rejected' ? '#dc3545' : '#ffc107'}">
                            ${transaction.status}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    
    transactionsList.innerHTML = html;
}

async function loadSystemStats() {
    const totalUsers = await db.getTotalUsers();
    const totalDeposits = await db.getTotalDeposits();
    const totalWithdrawals = await db.getTotalWithdrawals();
    const todaySignups = await db.getTodaySignups();

    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('total-deposits').textContent = db.formatCurrency(totalDeposits);
    document.getElementById('total-withdrawals').textContent = db.formatCurrency(totalWithdrawals);
    document.getElementById('today-signups').textContent = todaySignups;
}

// Transaction Approval Functions
async function approveTransaction(userId, transactionId) {
    if (!db.currentUser || !db.currentUser.is_admin) {
        alert('Admin access required');
        return;
    }

    const success = await db.updateTransactionStatus(userId, transactionId, 'approved', db.currentUser.id);
    if (success) {
        alert('✅ Transaction approved successfully');
        loadPendingTransactions();
    } else {
        alert('❌ Failed to approve transaction');
    }
}

async function rejectTransaction(userId, transactionId) {
    if (!db.currentUser || !db.currentUser.is_admin) {
        alert('Admin access required');
        return;
    }

    const success = await db.updateTransactionStatus(userId, transactionId, 'rejected', db.currentUser.id);
    if (success) {
        alert('✅ Transaction rejected successfully');
        loadPendingTransactions();
    } else {
        alert('❌ Failed to reject transaction');
    }
}

// Utility Functions
function togglePassword(inputId, toggleElement) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;

    const eyeIcon = toggleElement.querySelector('i');
    const textSpan = toggleElement.querySelector('span');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
        if (textSpan) textSpan.textContent = 'Hide Password';
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
        if (textSpan) textSpan.textContent = 'Show Password';
    }
}

function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabId}-section`).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

function switchAdminTab(tabId) {
    document.querySelectorAll('#admin-dashboard .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('#admin-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(`${tabId}-section`).classList.add('active');
    event.target.classList.add('active');
}

function switchSuperAdminTab(tabId) {
    document.querySelectorAll('#super-admin-dashboard .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('#super-admin-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(`${tabId}-section`).classList.add('active');
    event.target.classList.add('active');
}

function copyReferralCode() {
    const referralCode = document.getElementById('user-referral-code').textContent;
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied to clipboard!');
}

function copyAdminReferralCode() {
    const referralCode = document.getElementById('admin-referral-code').textContent;
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied to clipboard!');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLoginTabs();
    console.log('✅ Application initialized successfully');
    
    // Check if user is already logged in (for page refresh)
    if (db.currentUser) {
        if (db.currentUser.is_super_admin) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
});

// Tab switching functionality
function switchTab(tab) {
    // Update tabs
    document.getElementById('login-tab').classList.toggle('active', tab === 'login');
    document.getElementById('signup-tab').classList.toggle('active', tab === 'signup');
    
    // Update forms
    document.getElementById('login-form').classList.toggle('active', tab === 'login');
    document.getElementById('signup-form').classList.toggle('active', tab === 'signup');
    
    // Reset form errors
    resetFormErrors();
}

// Password visibility toggle
function togglePassword(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    const icon = toggleElement.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleElement.querySelector('span').textContent = 'Hide Password';
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleElement.querySelector('span').textContent = 'Show Password';
    }
}

// Form validation functions
function validateLogin() {
    resetFormErrors();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    let isValid = true;
    
    // Email validation
    if (!email) {
        showFieldError('login-email', 'login-email-error');
        isValid = false;
    }
    
    // Password validation
    if (!password || password.length < 6) {
        showFieldError('login-password', 'login-password-error');
        isValid = false;
    }
    
    if (isValid) {
        // Simulate login process
        showError('Logging In', 'Please wait while we authenticate your credentials...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            if (email === 'admin' && password === 'password') {
                showError('Login Successful', 'Welcome to Tanzania Mining Investment Portal!', 'success');
                // In a real app, you would redirect to dashboard here
            } else {
                showError('Login Failed', 'Invalid email or password. Please try again.', 'error');
            }
        }, 1500);
    } else {
        showError('Validation Error', 'Please fix the errors in the form before submitting.', 'error');
    }
}

function validateSignup() {
    resetFormErrors();
    
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    let isValid = true;
    
    // Username validation
    if (!username || username.length < 3 || username.length > 20) {
        showFieldError('signup-username', 'signup-username-error');
        isValid = false;
    }
    
    // Email validation
    if (!email || !isValidEmail(email)) {
        showFieldError('signup-email', 'signup-email-error');
        isValid = false;
    }
    
    // Password validation
    if (!password || password.length < 8 || !hasUpperCase(password) || !hasLowerCase(password) || !hasNumber(password)) {
        showFieldError('signup-password', 'signup-password-error');
        isValid = false;
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
        showFieldError('signup-confirm-password', 'signup-confirm-password-error');
        isValid = false;
    }
    
    if (isValid) {
        showError('Account Creation', 'Your account is being created...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            showError('Account Created', 'Your account has been successfully created!', 'success');
            switchTab('login');
        }, 2000);
    } else {
        showError('Validation Error', 'Please fix the errors in the form before submitting.', 'error');
    }
}

// Helper functions for validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function hasUpperCase(str) {
    return /[A-Z]/.test(str);
}

function hasLowerCase(str) {
    return /[a-z]/.test(str);
}

function hasNumber(str) {
    return /\d/.test(str);
}

function showFieldError(fieldId, errorId) {
    document.getElementById(fieldId).classList.add('input-error');
    document.getElementById(errorId).classList.add('show');
}

function resetFormErrors() {
    // Remove error styling from all inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('input-error', 'input-success');
    });
    
    // Hide all error messages
    const errorMessages = document.querySelectorAll('.form-error');
    errorMessages.forEach(error => {
        error.classList.remove('show');
    });
}

// Demo: Show initial info message
setTimeout(() => {
    showError('Welcome', 'Welcome to Tanzania Mining Investment Portal. Use the demo buttons to test different notification types.', 'info');
}, 1000);

// Landing page functions
function skipLanding() {
    safeStorage.setItem('landingSeen', 'true');
    showLogin();
}

function showLogin() {
    const landing = document.querySelector('.landing-container');
    const login = document.querySelector('.login-container');
    
    if (landing) landing.style.display = 'none';
    if (login) login.style.display = 'flex';
}

function showLanding() {
    const landing = document.querySelector('.landing-container');
    const login = document.querySelector('.login-container');
    
    if (landing) landing.style.display = 'flex';
    if (login) login.style.display = 'none';
}

// Animated safe error display function
function showError(title, message, type = 'error', duration = 5000) {
    // Create error container if it doesn't exist
    let errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
        
        // Add styles if not already present
        if (!document.getElementById('error-styles')) {
            const styles = document.createElement('style');
            styles.id = 'error-styles';
            styles.textContent = `
                .error-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                }
                
                .error-message {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                    padding: 16px;
                    border-left: 4px solid #e74c3c;
                    transform: translateX(400px) scale(0.8);
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }
                
                .error-message.show {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
                
                .error-message.hide {
                    transform: translateX(400px) scale(0.8);
                    opacity: 0;
                }
                
                .error-message.success {
                    border-left-color: #2ecc71;
                    background: linear-gradient(135deg, #f8fff9, #ffffff);
                }
                
                .error-message.warning {
                    border-left-color: #f39c12;
                    background: linear-gradient(135deg, #fffbf0, #ffffff);
                }
                
                .error-message.info {
                    border-left-color: #3498db;
                    background: linear-gradient(135deg, #f0f8ff, #ffffff);
                }
                
                .error-message.error {
                    border-left-color: #e74c3c;
                    background: linear-gradient(135deg, #fff5f5, #ffffff);
                }
                
                .error-content {
                    flex: 1;
                    padding-right: 30px;
                }
                
                .error-title {
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 4px;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .error-details {
                    font-size: 14px;
                    color: #5a6c7d;
                    line-height: 1.4;
                }
                
                .error-close {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #95a5a6;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .error-close:hover {
                    background: rgba(0, 0, 0, 0.1);
                    color: #e74c3c;
                    transform: scale(1.1);
                }
                
                .error-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #e74c3c, #c0392b);
                    width: 100%;
                    transform: scaleX(1);
                    transform-origin: left;
                    animation: progressShrink ${duration}ms linear forwards;
                }
                
                .error-message.success .error-progress {
                    background: linear-gradient(90deg, #2ecc71, #27ae60);
                }
                
                .error-message.warning .error-progress {
                    background: linear-gradient(90deg, #f39c12, #e67e22);
                }
                
                .error-message.info .error-progress {
                    background: linear-gradient(90deg, #3498db, #2980b9);
                }
                
                @keyframes progressShrink {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                .error-message.important {
                    animation: pulse 2s infinite, shake 0.5s ease;
                }
                
                .error-icon {
                    font-size: 16px;
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = `error-message ${type}`;
    
    // Get icon based on type
    const icons = {
        error: '⛔',
        warning: '⚠️',
        success: '✅',
        info: 'ℹ️'
    };
    
    errorMessage.innerHTML = `
        <div class="error-content">
            <div class="error-title">
                <span class="error-icon">${icons[type] || icons.info}</span>
                ${title}
            </div>
            <div class="error-details">${message}</div>
        </div>
        <button class="error-close" onclick="removeErrorMessage(this.parentElement)">×</button>
        <div class="error-progress"></div>
    `;
    
    // Add to container
    errorContainer.appendChild(errorMessage);
    
    // Animate in
    setTimeout(() => {
        errorMessage.classList.add('show');
    }, 10);
    
    // Auto remove after duration
    const autoRemoveTimer = setTimeout(() => {
        removeErrorMessage(errorMessage);
    }, duration);
    
    // Pause progress bar on hover
    errorMessage.addEventListener('mouseenter', () => {
        errorMessage.querySelector('.error-progress').style.animationPlayState = 'paused';
    });
    
    errorMessage.addEventListener('mouseleave', () => {
        errorMessage.querySelector('.error-progress').style.animationPlayState = 'running';
    });
    
    // Store timer reference for manual removal
    errorMessage._autoRemoveTimer = autoRemoveTimer;
}

// Function to remove error message with animation
function removeErrorMessage(element) {
    if (!element || !element.parentElement) return;
    
    // Clear auto-remove timer if exists
    if (element._autoRemoveTimer) {
        clearTimeout(element._autoRemoveTimer);
    }
    
    // Add hide class for exit animation
    element.classList.remove('show');
    element.classList.add('hide');
    
    // Remove from DOM after animation
    setTimeout(() => {
        if (element.parentElement) {
            element.parentElement.removeChild(element);
        }
    }, 400);
}

// Enhanced version with additional features
function showEnhancedError(title, message, options = {}) {
    const {
        type = 'error',
        duration = 5000,
        important = false,
        actions = [],
        onClose = null
    } = options;
    
    let errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
    }
    
    const errorMessage = document.createElement('div');
    errorMessage.className = `error-message ${type} ${important ? 'important' : ''}`;
    
    const icons = {
        error: '⛔',
        warning: '⚠️',
        success: '✅',
        info: 'ℹ️'
    };
    
    let actionsHTML = '';
    if (actions.length > 0) {
        actionsHTML = `
            <div class="error-actions">
                ${actions.map(action => 
                    `<button class="error-action-btn" onclick="${action.onClick}">${action.label}</button>`
                ).join('')}
            </div>
        `;
    }
    
    errorMessage.innerHTML = `
        <div class="error-content">
            <div class="error-title">
                <span class="error-icon">${icons[type] || icons.info}</span>
                ${title}
            </div>
            <div class="error-details">${message}</div>
            ${actionsHTML}
        </div>
        <button class="error-close" onclick="removeErrorMessage(this.parentElement)">×</button>
        <div class="error-progress"></div>
    `;
    
    errorContainer.appendChild(errorMessage);
    
    setTimeout(() => {
        errorMessage.classList.add('show');
    }, 10);
    
    const autoRemoveTimer = setTimeout(() => {
        if (onClose) onClose();
        removeErrorMessage(errorMessage);
    }, duration);
    
    errorMessage._autoRemoveTimer = autoRemoveTimer;
    
    // Enhanced hover effects
    errorMessage.addEventListener('mouseenter', () => {
        const progress = errorMessage.querySelector('.error-progress');
        if (progress) progress.style.animationPlayState = 'paused';
    });
    
    errorMessage.addEventListener('mouseleave', () => {
        const progress = errorMessage.querySelector('.error-progress');
        if (progress) progress.style.animationPlayState = 'running';
    });
}

// Utility functions for different error types
const notify = {
    success: (title, message, duration = 3000) => {
        showError(title, message, 'success', duration);
    },
    
    error: (title, message, duration = 5000) => {
        showError(title, message, 'error', duration);
    },
    
    warning: (title, message, duration = 4000) => {
        showError(title, message, 'warning', duration);
    },
    
    info: (title, message, duration = 3000) => {
        showError(title, message, 'info', duration);
    },
    
    // Quick actions
    networkError: () => {
        showEnhancedError(
            'Network Error',
            'Unable to connect to the server. Please check your internet connection.',
            {
                type: 'error',
                important: true,
                actions: [
                    {
                        label: 'Retry',
                        onClick: 'window.location.reload()'
                    },
                    {
                        label: 'Check Connection',
                        onClick: 'notify.info("Connection", "Checking network status...")'
                    }
                ]
            }
        );
    },
    
    // Clear all notifications
    clearAll: () => {
        const container = document.getElementById('error-container');
        if (container) {
            const messages = container.querySelectorAll('.error-message');
            messages.forEach(msg => removeErrorMessage(msg));
        }
    }
};

// Add styles for enhanced version
if (!document.getElementById('enhanced-error-styles')) {
    const enhancedStyles = document.createElement('style');
    enhancedStyles.id = 'enhanced-error-styles';
    enhancedStyles.textContent = `
        .error-actions {
            margin-top: 12px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .error-action-btn {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .error-action-btn:hover {
            background: #f8f9fa;
            border-color: #3498db;
            transform: translateY(-1px);
        }
        
        .error-message.success .error-action-btn:hover {
            border-color: #2ecc71;
        }
        
        .error-message.error .error-action-btn:hover {
            border-color: #e74c3c;
        }
        
        .error-message.warning .error-action-btn:hover {
            border-color: #f39c12;
        }
    `;
    document.head.appendChild(enhancedStyles);
}

const element = document.getElementById('elementId');
if (element !== null) {
    element.style.someProperty = 'value';
}
document.addEventListener('DOMContentLoaded', function() {
    // Your code here
    const element = document.getElementById('someElement');
    if (element) {
        element.style.display = 'block';
    }
});

// Safe Dashboard Functions with Null Checks
function showUserDashboard() {
    const authSection = document.getElementById('auth-section');
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const superAdminDashboard = document.getElementById('super-admin-dashboard');
    
    if (authSection) authSection.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'block';
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (superAdminDashboard) superAdminDashboard.style.display = 'none';
    
    updateUserDashboard();
}

function showAdminDashboard() {
    const authSection = document.getElementById('auth-section');
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const superAdminDashboard = document.getElementById('super-admin-dashboard');
    
    if (authSection) authSection.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
    if (superAdminDashboard) superAdminDashboard.style.display = 'none';
    
    updateAdminDashboard();
}

function showSuperAdminDashboard() {
    const authSection = document.getElementById('auth-section');
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const superAdminDashboard = document.getElementById('super-admin-dashboard');
    
    if (authSection) authSection.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (superAdminDashboard) superAdminDashboard.style.display = 'block';
    
    updateSuperAdminDashboard();
}

function showAuthSection() {
    const authSection = document.getElementById('auth-section');
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const superAdminDashboard = document.getElementById('super-admin-dashboard');
    
    if (authSection) authSection.style.display = 'block';
    if (userDashboard) userDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (superAdminDashboard) superAdminDashboard.style.display = 'none';
}



// Generate referral code
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Copy referral code
function copyReferralCode() {
    const referralCode = document.getElementById('user-referral-code').textContent;
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied to clipboard!');
}

function copyAdminReferralCode() {
    const referralCode = document.getElementById('admin-referral-code').textContent;
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied to clipboard!');
}

// Hakuna JavaScript iliyojumuishwa - ongeza utendaji
function togglePassword(fieldId, toggleElement) {
    const field = document.getElementById(fieldId);
    if (field.type === 'password') {
        field.type = 'text';
        toggleElement.innerHTML = '<i class="far fa-eye-slash"></i> <span>Hide Password</span>';
    } else {
        field.type = 'password';
        toggleElement.innerHTML = '<i class="far fa-eye"></i> <span>Show Password</span>';
    }
}

// Toggle password visibility
function togglePassword(inputId, toggleElement) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = toggleElement.querySelector('i');
    const textSpan = toggleElement.querySelector('span');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
        textSpan.textContent = 'Hide Password';
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
        textSpan.textContent = 'Show Password'; 
    }
}

// Switch tabs for user dashboard
function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('#user-dashboard .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('#user-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabId}-section`).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Switch tabs for admin dashboard
function switchAdminTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('#admin-dashboard .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('#admin-dashboard .dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabId}-section`).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Load user referrals
async function loadUserReferrals() {
    const referralsList = document.getElementById('user-referrals-list');
    
    if (!referralsList) {
        return;
    }
    
    // Check if user data is available
    if (!db || !db.currentUser) {
        referralsList.innerHTML = '<p>User data not available</p>';
        return;
    }
    
    if (!db.currentUser.referrals || db.currentUser.referrals.length === 0) {
        referralsList.innerHTML = '<p>No referrals yet. Share your referral code to grow your network!</p>';
        return;
    }
    
    let html = '';
    db.currentUser.referrals.forEach(ref => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${ref.username || 'N/A'}</div>
                    <div class="referral-date">${new Date(ref.join_date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Email:</strong> ${ref.email || 'N/A'}</div>
                    <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                </div>
            </div>
        `;
    });
    
    referralsList.innerHTML = html;
}

// Call after DOM is ready
document.addEventListener('DOMContentLoaded', loadUserReferrals);

// Load admin users
async function loadAdminUsers() {
    const usersList = document.getElementById('admin-users-list');
    const users = await db.getUsers();
    
    let html = '';
    users.forEach(user => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${user.username} ${user.is_admin ? '<span style="color: #dc3545;">(Admin)</span>' : ''}</div>
                    <div class="referral-date">${new Date(user.join_date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Email:</strong> ${user.email}</div>
                    <div><strong>Referral Code:</strong> ${user.referral_code}</div>
                    <div><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</div>
                    <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                </div>
            </div>
        `;
    });
    
    usersList.innerHTML = html;
}

// Load admin referrals
async function loadAdminReferrals() {
    const referralsList = document.getElementById('admin-referrals-list');
    const referrals = await db.getUsersByReferrer(db.currentUser.referral_code);
    
    if (referrals.length === 0) {
        referralsList.innerHTML = '<p>No referrals yet. Share your referral code to grow your network!</p>';
        return;
    }
    
    let html = '';
    referrals.forEach(user => {
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${user.username}</div>
                    <div class="referral-date">${new Date(user.join_date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Email:</strong> ${user.email}</div>
                    <div><strong>Referral Code:</strong> ${user.referral_code}</div>
                    <div><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</div>
                    <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                </div>
            </div>
        `;
    });
    
    referralsList.innerHTML = html;
}

// Load admin investments
async function loadAdminInvestments() {
    const investmentsList = document.getElementById('admin-investments-list');
    const users = await db.getUsers();
    
    // Get all investments from all users
    const allInvestments = [];
    users.forEach(user => {
        if (user.investments) {
            user.investments.forEach(inv => {
                allInvestments.push({
                    username: user.username,
                    plan: inv.plan,
                    amount: inv.amount,
                    date: inv.date
                });
            });
        }
    });
    
    if (allInvestments.length === 0) {
        investmentsList.innerHTML = '<p>No investments yet.</p>';
        return;
    }
    
    // Sort by date (newest first)
    allInvestments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    allInvestments.slice(0, 10).forEach(inv => { // Show only 10 most recent
        html += `
            <div class="referral-item">
                <div class="referral-header">
                    <div class="referral-name">${inv.username}</div>
                    <div class="referral-date">${new Date(inv.date).toLocaleDateString()}</div>
                </div>
                <div class="referral-details">
                    <div><strong>Plan:</strong> ${inv.plan.toUpperCase()}</div>
                    <div><strong>Amount:</strong> ${db.formatCurrency(inv.amount)}</div>
                </div>
            </div>
        `;
    });
    
    investmentsList.innerHTML = html;
    
    // Update investment stats
    document.getElementById('admin-active-plans').textContent = allInvestments.length;
    document.getElementById('admin-completed-plans').textContent = Math.floor(allInvestments.length * 0.3); // Simulated completed plans
}

// Investment function with referral bonus
async function invest(plan) {
    let minAmount = 0;
    let roi = 0;
    let duration = 0;
    let planName = '';
    
    switch(plan) {
        case 'basic':
            minAmount = 10000;
            roi = 15;
            duration = 30;
            planName = 'Basic Plan (15% ROI)';
            break;
        case 'premium':
            minAmount = 100000;
            roi = 25;
            duration = 60;
            planName = 'Premium Plan (25% ROI)';
            break;
        case 'vip':
            minAmount = 500000;
            roi = 40;
            duration = 90;
            planName = 'VIP Plan (40% ROI)';
            break;
    }
    
    const amount = parseFloat(prompt(`Enter investment amount for ${planName} (Minimum: ${db.formatCurrency(minAmount)})`));
    
    if (!amount || amount < minAmount) {
        alert(`Minimum investment for this plan is ${db.formatCurrency(minAmount)}`);
        return;
    }
    
    if (amount > db.currentUser.balance) {
        alert('Insufficient balance');
        return;
    }
    
    // Create investment
    const investment = {
        id: Date.now(),
        plan: plan,
        amount: amount,
        roi: roi,
        duration: duration,
        date: new Date().toISOString(),
        status: 'active'
    };
    
    // Create transaction
    const transaction = {
        id: Date.now(),
        type: 'Investment',
        amount: amount,
        date: new Date().toISOString(),
        status: 'completed'
    };
    
    // Update user
    const users = await db.getUsers();
    const userIndex = users.findIndex(u => u.id === db.currentUser.id);
    
    if (userIndex !== -1) {
        if (!users[userIndex].investments) users[userIndex].investments = [];
        users[userIndex].investments.push(investment);
        
        if (!users[userIndex].transactions) users[userIndex].transactions = [];
        users[userIndex].transactions.push(transaction);
        
        users[userIndex].balance -= amount;
        
        // Check if this is user's first deposit and add referral bonus
        if (!users[userIndex].has_received_referral_bonus && users[userIndex].referred_by) {
            const referrer = users.find(u => u.referral_code === users[userIndex].referred_by);
            if (referrer) {
                // Calculate referral bonus (10% of first deposit, max 50,000 TZS)
                let referralBonus = amount * 0.1;
                if (referralBonus > 50000) referralBonus = 50000;
                
                // Add bonus to referrer's balance
                referrer.balance += referralBonus;
                
                // Add transaction for referrer
                if (!referrer.transactions) referrer.transactions = [];
                referrer.transactions.push({
                    id: Date.now(),
                    type: 'Referral Bonus',
                    amount: referralBonus,
                    date: new Date().toISOString(),
                    status: 'completed'
                });
                
                // Mark that user has received referral bonus
                users[userIndex].has_received_referral_bonus = true;
                
                // Save referrer changes
                await db.updateUser(referrer.id, {
                    balance: referrer.balance,
                    transactions: referrer.transactions
                });
                
                alert(`Referral bonus of ${db.formatCurrency(referralBonus)} added to your referrer's account!`);
            }
        }
        
        // Save user changes
        await db.updateUser(users[userIndex].id, {
            investments: users[userIndex].investments,
            transactions: users[userIndex].transactions,
            balance: users[userIndex].balance,
            has_received_referral_bonus: users[userIndex].has_received_referral_bonus
        });
        
        // Update current user
        db.currentUser = users[userIndex];
        
        // Refresh dashboard
        if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
        
        alert(`Successfully invested ${db.formatCurrency(amount)} in ${planName}`);
    }
}

// Update the logout function to handle super admin
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        db.currentUser = null;
        
        // Hide all dashboards
        document.getElementById('user-dashboard').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'none';
        document.getElementById('super-admin-dashboard').style.display = 'none';
        
        // Show login container
        document.getElementById('login-container').style.display = 'flex';
        
        // Clear form fields
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password-section').style.display = 'none';
    }
}

// Navigation
function initNavigation() {
    // User navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            // Update active tab
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(target).classList.add('active');
            
            // Load data if needed
            if (target === 'history-section') {
                loadTransactionHistory();
            } else if (target === 'admin-history') {
                loadAdminTransactionHistory();
            } else if (target === 'admin-stats') {
                loadAdminStats();
            }
        });
    });
}

// Main Navigation Functionality
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Function to switch between sections
    function switchSection(target) {
        // Remove active class from all nav items and sections
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to clicked nav item and corresponding section
        const activeNavItem = document.querySelector(`.nav-item[data-target="${target}"]`);
        const activeSection = document.getElementById(`${target}-section`);
        
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        if (activeSection) {
            activeSection.classList.add('active');
            
            // Load data for specific sections
            if (target === 'referrals') {
                loadEnhancedReferrals();
            } else if (target === 'history') {
                loadTransactionHistory();
            } else if (target === 'myinvestment') {
                loadUserInvestments();
            }
        }
    }
    
    // Add click event to all nav items
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            switchSection(target);
        });
    });
});

// Update the auto-detection in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initLoginTabs();
    initDepositSection();
    initWithdrawalSection();
    initNavigation();
    
    // Check if user is already logged in
    if (db.currentUser) {
        if (db.isSuperAdmin(db.currentUser)) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
    
    // Auto-detect admin email for admin password field
    document.getElementById('login-email').addEventListener('input', function() {
        const email = this.value;
        const adminPasswordSection = document.getElementById('admin-password-section');
        
        if (db.isAdminEmail(email)) {
            adminPasswordSection.style.display = 'block';
            
            // If it's super admin email, show special message
            if (email === 'kingharuni420@gmail.com') {
                adminPasswordSection.innerHTML = `
                    <div class="form-control">
                        <label for="admin-password">Super Admin Password</label>
                        <input type="password" id="admin-password" placeholder="Enter super admin password">
                        <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                            <i class="far fa-eye"></i> <span>Show Password</span>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: var(--success); margin-top: 10px;">
                        <i class="fas fa-crown"></i> Super Admin Access - Full System Control
                    </p>
                `;
            } else {
                // Regular admin
                adminPasswordSection.innerHTML = `
                    <div class="form-control">
                        <label for="admin-password">Admin Password</label>
                        <input type="password" id="admin-password" placeholder="Enter admin password">
                        <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                            <i class="far fa-eye"></i> <span>Show Password</span>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: var(--warning); margin-top: 10px;">
                        <i class="fas fa-user-shield"></i> Admin access requires special authorization
                    </p>
                `;
            }
        } else {
            adminPasswordSection.style.display = 'none';
        }
    });
});

// Update the admin management functions to protect super admin
async function loadAdminsList() {
    const users = await db.getUsers();
    const admins = users.filter(user => user.is_admin);
    const tbody = document.getElementById('admins-table-body');
    
    tbody.innerHTML = '';
    
    admins.forEach(admin => {
        const isSuperAdmin = admin.email === 'kingharuni420@gmail.com';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${admin.id}</td>
            <td>
                ${admin.username}
                ${isSuperAdmin ? '<span class="super-admin-badge">SUPER ADMIN</span>' : ''}
            </td>
            <td>${admin.email}</td>
            <td>
                <span class="admin-role-badge role-${admin.admin_role || 'admin'}">
                    ${isSuperAdmin ? 'SUPER ADMIN' : (admin.admin_role || 'ADMIN')}
                </span>
            </td>
            <td>${getAdminPermissions(admin)}</td>
            <td><span class="status-${admin.status}">${admin.status}</span></td>
            <td>${formatDate(admin.last_active)}</td>
            <td>
                <button class="btn-action view" onclick="viewAdminDetails(${admin.id})">View</button>
                ${!isSuperAdmin ? 
                    `<button class="btn-action edit" onclick="editAdmin(${admin.id})">Edit</button>
                     <button class="btn-action delete" onclick="deleteAdmin(${admin.id})">Remove</button>` : 
                    '<span style="color: #666; font-size: 12px;">Protected</span>'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update edit admin function to protect super admin
async function editAdmin(adminId) {
    const users = await db.getUsers();
    const admin = users.find(user => user.id === adminId);
    
    if (admin && admin.email !== 'kingharuni420@gmail.com') {
        const modalContent = `
            <h3>Edit Admin</h3>
            <div class="form-group">
                <label>Role</label>
                <select id="edit-admin-role">
                    <option value="support" ${admin.admin_role === 'support' ? 'selected' : ''}>Support Admin</option>
                    <option value="approval" ${admin.admin_role === 'approval' ? 'selected' : ''}>Approval Admin</option>
                    <option value="financial" ${admin.admin_role === 'financial' ? 'selected' : ''}>Financial Admin</option>
                    <option value="full" ${admin.admin_role === 'full' ? 'selected' : ''}>Full Admin</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select id="edit-admin-status">
                    <option value="active" ${admin.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${admin.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <div class="form-group">
                <label>Permissions</label>
                <div class="permissions-list">
                    <label><input type="checkbox" name="edit-admin-permissions" value="user_management" ${admin.permissions && admin.permissions.includes('user_management') ? 'checked' : ''}> User Management</label>
                    <label><input type="checkbox" name="edit-admin-permissions" value="transaction_approval" ${admin.permissions && admin.permissions.includes('transaction_approval') ? 'checked' : ''}> Transaction Approval</label>
                    <label><input type="checkbox" name="edit-admin-permissions" value="chat_support" ${admin.permissions && admin.permissions.includes('chat_support') ? 'checked' : ''}> Chat Support</label>
                    <label><input type="checkbox" name="edit-admin-permissions" value="reports" ${admin.permissions && admin.permissions.includes('reports') ? 'checked' : ''}> View Reports</label>
                    <label><input type="checkbox" name="edit-admin-permissions" value="settings" ${admin.permissions && admin.permissions.includes('settings') ? 'checked' : ''}> System Settings</label>
                </div>
            </div>
            <button class="btn btn-primary" onclick="saveAdminChanges(${adminId})">Save Changes</button>
        `;
        
        showCustomModal('Edit Admin', modalContent);
    } else {
        alert('Cannot edit super admin account');
    }
}

// Update save admin changes to handle permissions
async function saveAdminChanges(adminId) {
    const users = await db.getUsers();
    const admin = users.find(user => user.id === adminId);
    
    if (admin && admin.email !== 'kingharuni420@gmail.com') {
        admin.admin_role = document.getElementById('edit-admin-role').value;
        admin.status = document.getElementById('edit-admin-status').value;
        
        // Update permissions
        const permissionCheckboxes = document.querySelectorAll('input[name="edit-admin-permissions"]:checked');
        admin.permissions = Array.from(permissionCheckboxes).map(cb => cb.value);
        
        await db.updateUser(adminId, {
            admin_role: admin.admin_role,
            status: admin.status,
            permissions: admin.permissions
        });
        
        closeCustomModal();
        loadAdminsList();
        alert('Admin updated successfully!');
    }
}

// Update delete admin to protect super admin
async function deleteAdmin(adminId) {
    const users = await db.getUsers();
    const admin = users.find(user => user.id === adminId);
    
    if (admin && admin.email === 'kingharuni420@gmail.com') {
        alert('Cannot delete super admin account!');
        return;
    }
    
    if (confirm('Are you sure you want to remove this admin?')) {
        await db.updateUser(adminId, {
            is_admin: false,
            admin_role: null,
            permissions: []
        });
        
        loadAdminsList();
        updateSuperAdminStats();
        alert('Admin removed successfully!');
    }
}

// Update the super admin welcome message
function initSuperAdminDashboard() {
    loadSuperAdminData();
    setupSuperAdminEventListeners();
    startRealTimeUpdates();
    
    // Show special welcome message for super admin
    showNotification('Welcome, King Haruni! Super Admin Access Granted', 'success');
    
    // Update the header with super admin badge
    const header = document.querySelector('#super-admin-dashboard .dashboard-header');
    if (header) {
        header.classList.add('super-admin-header');
    }
}

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Function to switch between sections
    function switchSection(target) {
        // Remove active class from all nav items and sections
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to clicked nav item and corresponding section
        const activeNavItem = document.querySelector(`.nav-item[data-target="${target}"]`);
        const activeSection = document.getElementById(`${target}-section`);
        
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }
    
    // Add click event to all nav items
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            switchSection(target);
        });
    });
    
    // Add animation to cards on page load
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s, transform 0.5s';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Chart buttons functionality
    const chartBtns = document.querySelectorAll('.chart-btn');
    chartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            chartBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// Toggle between image and video upload sections
function toggleMediaInput() {
    const mediaType = document.getElementById('mediaType').value;
    const imageSection = document.getElementById('imageUploadSection');
    const videoSection = document.getElementById('videoUploadSection');
    const videoUrlSection = document.getElementById('videoUrlSection');
    
    if (mediaType === 'image') {
        imageSection.style.display = 'block';
        videoSection.style.display = 'none';
        videoUrlSection.style.display = 'none';
    } else {
        imageSection.style.display = 'none';
        videoSection.style.display = 'block';
        videoUrlSection.style.display = 'block';
    }
}

// Add new announcement
async function addAnnouncement() {
    const text = document.getElementById('announcementText').value;
    const mediaType = document.getElementById('mediaType').value;
    const imageFile = document.getElementById('imageUpload').files[0];
    const videoFile = document.getElementById('videoUpload').files[0];
    const videoUrl = document.getElementById('videoUrl').value;
    
    if (!text) {
        alert('Please enter announcement text');
        return;
    }
    
    let mediaData = null;
    
    if (mediaType === 'image' && imageFile) {
        // Handle image upload
        const reader = new FileReader();
        reader.onload = function(e) {
            mediaData = e.target.result;
            saveAnnouncement(text, mediaType, mediaData, null);
        };
        reader.readAsDataURL(imageFile);
    } else if (mediaType === 'video') {
        if (videoFile) {
            // Handle video file upload
            const reader = new FileReader();
            reader.onload = function(e) {
                mediaData = e.target.result;
                saveAnnouncement(text, mediaType, mediaData, null);
            };
            reader.readAsDataURL(videoFile);
        } else if (videoUrl) {
            // Handle video URL
            saveAnnouncement(text, mediaType, null, videoUrl);
        } else {
            alert('Please provide either a video file or URL');
            return;
        }
    } else {
        alert('Please select a media file');
        return;
    }
}

// Fixed saveAnnouncement function - make it async
async function saveAnnouncement(text, mediaType, mediaData, videoUrl) {
    try {
        // Get announcements from Firestore
        const announcementsRef = db.db.collection('announcements');
        const snapshot = await announcementsRef.get();
        let announcements = [];
        
        snapshot.forEach(doc => {
            announcements.push({ id: doc.id, ...doc.data() });
        });
        
        // Compress image data if it's too large
        let processedMediaData = mediaData;
        if (mediaType === 'image' && mediaData && mediaData.length > 1000000) {
            try {
                processedMediaData = await compressImage(mediaData);
            } catch (error) {
                processedMediaData = mediaData;
            }
        }
        
        const newAnnouncement = {
            text: text,
            mediaType: mediaType,
            mediaData: processedMediaData,
            videoUrl: videoUrl,
            timestamp: new Date().toISOString()
        };
        
        // Save to Firestore
        await announcementsRef.add(newAnnouncement);
        
        // Clear form
        document.getElementById('announcementForm').reset();
        toggleMediaInput();
        
        // Refresh announcements list and slideshow
        loadAnnouncements();
        updateSlideshow();
        
        alert('Announcement added successfully!');
    } catch (error) {
        alert('Error saving announcement: ' + error.message);
    }
}

// Load announcements from Firestore
async function loadAnnouncements() {
    try {
        const announcementsRef = db.db.collection('announcements');
        const snapshot = await announcementsRef.orderBy('timestamp', 'desc').get();
        const announcements = [];
        
        snapshot.forEach(doc => {
            announcements.push({ id: doc.id, ...doc.data() });
        });
        
        // Update your announcements display logic here
        // This depends on your existing loadAnnouncements implementation
        console.log('Announcements loaded:', announcements);
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

// Deposit Section Functionality
function initDepositSection() {
    const depositType = document.getElementById('deposit-type');
    const depositBtn = document.getElementById('deposit-btn');
    const verifyBtn = document.getElementById('verify-btn');
    const quickAmounts = document.querySelectorAll('.quick-amount[data-amount]');
    
    // Show account info and instructions based on deposit type
    depositType.addEventListener('change', function() {
        // Hide all account info
        document.querySelectorAll('.account-info').forEach(info => {
            info.style.display = 'none';
        });
        
        // Show selected account info
        const selectedType = this.value;
        if (selectedType) {
            document.getElementById(`${selectedType}-info`).style.display = 'block';
            
            // Update instructions
            document.getElementById('instructions-title').textContent = 'Jinsi Ya Kutuma Pesa';
            document.getElementById('instructions-content').innerHTML = bankInstructions[selectedType] || '<p>Chagua aina ya kuweka fedha ili kuona maelekezo maalum.</p>';
        }
    });
    
    // Quick amount buttons
    quickAmounts.forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            document.getElementById('amount').value = amount;
        });
    });
    
    // Deposit button click
    depositBtn.addEventListener('click', async function() {
        const amount = parseFloat(document.getElementById('amount').value);
        const depositType = document.getElementById('deposit-type').value;
        const senderName = document.getElementById('sender-name').value;
        const senderAccount = document.getElementById('sender-account').value;
        
        if (!amount || amount < 1000) {
            alert('Tafadhali weka kiasi sahihi cha kuweka fedha (kiwango cha chini ni TZS 1,000)');
            return;
        }
        
        if (!depositType) {
            alert('Tafadhali chagua aina ya kuweka fedha');
            return;
        }
        
        if (!senderName) {
            alert('Tafadhali weka jina kamili la mtumaji');
            return;
        }
        
        if (!senderAccount) {
            alert('Tafadhali weka namba ya akaunti au simu ya mtumaji');
            return;
        }
        
        // Show transaction code section
        document.getElementById('transaction-section').style.display = 'block';
        document.getElementById('deposit-amount-display').textContent = db.formatCurrency(amount);
        
        // Store deposit details temporarily
        window.currentDeposit = {
            amount: amount,
            type: depositType,
            senderName: senderName,
            senderAccount: senderAccount
        };
    });
    
    // Verify button click
    verifyBtn.addEventListener('click', async function() {
        const transactionCode = document.getElementById('transaction-code').value;
        
        if (!transactionCode) {
            alert('Tafadhali weka msimbo wa muamala');
            return;
        }
        
        if (!window.currentDeposit) {
            alert('Hitilafu imetokea. Tafadhali anza tena.');
            return;
        }
        
        // Create deposit transaction
        const transaction = await db.createTransaction(
            db.currentUser.id,
            'deposit',
            window.currentDeposit.amount,
            window.currentDeposit.type,
            { 
                senderName: window.currentDeposit.senderName,
                senderAccount: window.currentDeposit.senderAccount,
                transactionCode: transactionCode
            }
        );
        
        if (transaction) {
            // Show status section
            document.getElementById('status-section').style.display = 'block';
            document.getElementById('transaction-section').style.display = 'none';
            
            // Reset form
            document.getElementById('amount').value = '';
            document.getElementById('deposit-type').value = '';
            document.getElementById('sender-name').value = '';
            document.getElementById('sender-account').value = '';
            document.getElementById('transaction-code').value = '';
            
            // Clear temporary data
            window.currentDeposit = null;
            
            alert('Ombi lako la kuweka fedha limewasilishwa kwa mafanikio. Linasubiri idhini.');
        } else {
            alert('Hitilafu imetokea wakati wa kuwasilisha ombi lako. Tafadhali jaribu tena.');
        }
    });
}

// Withdrawal Section Functionality
function initWithdrawalSection() {
    const withdrawMethod = document.getElementById('withdraw-method');
    const withdrawAmount = document.getElementById('withdraw-amount');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const quickAmounts = document.querySelectorAll('#withdraw-section .quick-amount[data-amount]');
    
    // Show account info based on withdrawal method
    withdrawMethod.addEventListener('change', function() {
        const accountInfo = document.getElementById('withdraw-account-info');
        if (this.value) {
            accountInfo.style.display = 'block';
        } else {
            accountInfo.style.display = 'none';
        }
    });
    
    // Quick amount buttons
    quickAmounts.forEach(button => {
        button.addEventListener('click', function() {
            const amount = this.getAttribute('data-amount');
            document.getElementById('withdraw-amount').value = amount;
            updateWithdrawalCalculation();
        });
    });
    
    // Update withdrawal calculation when amount changes
    withdrawAmount.addEventListener('input', updateWithdrawalCalculation);
    
    // Withdrawal button click - UPDATED LOGIC
    withdrawBtn.addEventListener('click', async function() {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const method = document.getElementById('withdraw-method').value;
        const accountNumber = document.getElementById('account-number').value;
        const accountName = document.getElementById('account-name').value;
        const reason = document.getElementById('withdraw-reason').value;
        
        if (!amount || amount < 10000 || amount > 5000000) {
            alert('Tafadhali weka kiasi sahihi cha kutoa fedha (TZS 10,000 hadi TZS 5,000,000)');
            return;
        }
        
        // Check if withdrawal is allowed at this time
        if (!db.isWithdrawalAllowed()) {
            alert('Kutoa fedha kunaruhusiwa Jumatatu hadi Ijumaa (saa zote) au Jumamosi hadi Jumapili (14:00 - 23:00) pekee.');
            return;
        }
        
        // Check if user has already withdrawn today
        if (await db.hasWithdrawnToday(db.currentUser.id)) {
            alert('Umekwisha toa fedha leo. Unaweza kutoa fedha tena kesho.');
            return;
        }
        
        // Check if user has pending withdrawal
        if (await hasPendingWithdrawal(db.currentUser.id)) {
            alert('Una ombi la kutoa fedha linasubiri idhini. Huwezi kufanya ombi jingine mpaka ombi la kwanza litakapokamilika.');
            return;
        }
        
        // Check if amount is more than 50% of balance
        const maxWithdrawal = db.currentUser.balance * 0.5;
        if (amount > maxWithdrawal) {
            alert(`Kiasi cha juu unachoruhusiwa kutoa ni ${db.formatCurrency(maxWithdrawal)} (50% ya salio lako)`);
            return;
        }
        
        if (!method) {
            alert('Tafadhali chagua njia ya kutoa fedha');
            return;
        }
        
        if (!accountNumber) {
            alert('Tafadhali weka namba ya akaunti au simu');
            return;
        }
        
        if (!accountName) {
            alert('Tafadhali weka jina kamili la mlipokeaji');
            return;
        }
        
        // Check if user has sufficient balance
        if (db.currentUser.balance < amount) {
            alert('Salio lako halitoshi kwa kutoa fedha hii. Tafadhali angalia salio lako na ujaribu tena.');
            return;
        }
        
        // Process withdrawal (deduct amount immediately) - KEY FEATURE
        const success = await db.processWithdrawalRequest(db.currentUser.id, amount);
        
        if (!success) {
            alert('Hitilafu imetokea wakati wa kutoa fedha. Tafadhali jaribu tena.');
            return;
        }
        
        // Create withdrawal transaction
        const transaction = await db.createTransaction(
            db.currentUser.id,
            'withdrawal',
            amount,
            method,
            { 
                accountNumber: accountNumber,
                accountName: accountName,
                reason: reason,
                serviceCharge: amount * 0.1,
                netAmount: amount - (amount * 0.1)
            }
        );
        
        if (transaction) {
            // Show status section
            document.getElementById('withdraw-status-section').style.display = 'block';
            document.getElementById('withdraw-request-amount').textContent = db.formatCurrency(amount);
            
            // Reset form
            document.getElementById('withdraw-amount').value = '';
            document.getElementById('withdraw-method').value = '';
            document.getElementById('account-number').value = '';
            document.getElementById('account-name').value = '';
            document.getElementById('withdraw-reason').value = '';
            
            // Update balance display
            updateBalanceDisplay();
            
            alert('Ombi lako la kutoa fedha limewasilishwa kwa mafanikio. Kiasi kimetolewa kwenye salio lako na linachunguzwa.');
        } else {
            alert('Hitilafu imetokea wakati wa kuwasilisha ombi lako. Tafadhali jaribu tena.');
        }
    });
    
    // Initial calculation update
    updateWithdrawalCalculation();
}

// Check if user has pending withdrawal
async function hasPendingWithdrawal(userId) {
    const user = await db.getUserById(userId);
    if (!user || !user.transactions) return false;
    
    return user.transactions.some(t => 
        t.type === 'withdrawal' && t.status === 'pending'
    );
}

// Update withdrawal calculation
function updateWithdrawalCalculation() {
    const amount = parseFloat(document.getElementById('withdraw-amount').value) || 0;
    const serviceCharge = amount * 0.1;
    const netAmount = amount - serviceCharge;
    const currentUser = db.currentUser;
    const remainingBalance = currentUser ? (currentUser.balance - amount) : 0;
    
    document.getElementById('calc-withdraw').textContent = db.formatCurrency(amount);
    document.getElementById('calc-charge').textContent = db.formatCurrency(serviceCharge);
    document.getElementById('calc-receive').textContent = db.formatCurrency(netAmount);
    document.getElementById('calc-remaining').textContent = db.formatCurrency(remainingBalance);
}

// Update the showSuperAdminDashboard function
function showSuperAdminDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'block';
    
    // Update the username display
    document.getElementById('super-admin-username-display').textContent = db.currentUser.username;
    
    initSuperAdminDashboard();
}

// Update the navigation to handle super admin
function initNavigation() {
    // Add event listeners for navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Show target section and activate nav item
            document.getElementById(target).classList.add('active');
            this.classList.add('active');
        });
    });

    // Special handling for super admin dashboard navigation
    document.querySelectorAll('#super-admin-dashboard .nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            switchToSection(target);
        });
    });
}

// Add function to switch sections in super admin dashboard
function switchToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show target section and activate corresponding nav item
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initLoginTabs();
    initDepositSection();
    initWithdrawalSection();
    initNavigation();
    
    // Check if user is already logged in
    if (db.currentUser) {
        if (db.isSuperAdmin(db.currentUser)) {
            showSuperAdminDashboard();
        } else if (db.currentUser.is_admin) {
            showAdminDashboard();
        } else {
            showUserDashboard();
        }
    }
    
    // Auto-detect admin email for admin password field
    document.getElementById('login-email').addEventListener('input', function() {
        const email = this.value;
        const adminPasswordSection = document.getElementById('admin-password-section');
        
        if (db.isAdminEmail(email)) {
            adminPasswordSection.style.display = 'block';
            
            // If it's super admin email, show special message
            if (email === 'harunihilson@gmail.com') {
                adminPasswordSection.innerHTML = `
                    <div class="form-control">
                        <label for="admin-password">Super Admin Password</label>
                        <input type="password" id="admin-password" placeholder="Enter super admin password">
                        <div class="password-toggle" onclick="togglePassword('admin-password', this)">
                            <i class="far fa-eye"></i> <span>Show Password</span>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: var(--success); margin-top: 10px;">
                        <i class="fas fa-crown"></i> Super Admin access detected
                    </p>
                `;
            }
        } else {
            adminPasswordSection.style.display = 'none';
        }
    });
});

// Add helper function to check user permissions
function hasPermission(permission) {
    if (!db.currentUser) return false;
    
    // Super admin has all permissions
    if (db.isSuperAdmin(db.currentUser)) {
        return true;
    }
    
    // Check if user has the specific permission
    if (db.currentUser.permissions && db.currentUser.permissions.includes('all')) {
        return true;
    }
    
    return db.currentUser.permissions && db.currentUser.permissions.includes(permission);
}

// Add function to initialize super admin dashboard
async function initSuperAdminDashboard() {
    await loadSuperAdminData();
    setupSuperAdminEventListeners();
    startRealTimeUpdates();
    
    // Show welcome message for super admin
    showNotification('Welcome, Super Admin!', 'success');
}

// Add function to load super admin data
async function loadSuperAdminData() {
    await updateSuperAdminStats();
    await loadAdminsList();
    loadTasks();
    loadSystemActivities();
}

// Add function to update super admin statistics
async function updateSuperAdminStats() {
    const users = await db.getUsers();
    const admins = users.filter(user => user.is_admin);
    const activeAdmins = admins.filter(admin => admin.status === 'active');
    const pendingTransactions = await db.getPendingTransactions();
    
    // Update DOM elements
    const totalUsersElement = document.getElementById('super-total-users');
    const activeAdminsCountElement = document.getElementById('active-admins-count');
    const pendingApprovalsElement = document.getElementById('pending-approvals-count');
    const totalAdminsElement = document.getElementById('total-admins-count');
    const activeAdminsElement = document.getElementById('active-admins');
    
    if (totalUsersElement) totalUsersElement.textContent = users.length;
    if (activeAdminsCountElement) activeAdminsCountElement.textContent = activeAdmins.length;
    if (pendingApprovalsElement) pendingApprovalsElement.textContent = pendingTransactions.length;
    if (totalAdminsElement) totalAdminsElement.textContent = admins.length;
    if (activeAdminsElement) activeAdminsElement.textContent = activeAdmins.length;
}

// Add notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Add CSS for notifications
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.notification.success {
    background: #27ae60;
}

.notification.error {
    background: #e74c3c;
}

.notification.info {
    background: #3498db;
}

.notification.warning {
    background: #f39c12;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.super-admin-badge {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #333;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    margin-left: 8px;
}
</style>
`;

// Inject notification styles
document.head.insertAdjacentHTML('beforeend', notificationStyles);



















// Show user dashboard
async function showUserDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    
    // Update user info
    document.getElementById('username-display').textContent = db.currentUser.username;
    document.getElementById('profile-username').textContent = db.currentUser.username;
    document.getElementById('dropdown-username').textContent = db.currentUser.username;
    document.getElementById('dashboard-balance').textContent = db.formatCurrency(db.currentUser.balance);
    document.getElementById('withdraw-balance').textContent = db.formatCurrency(db.currentUser.balance);
    document.getElementById('profile-balance').textContent = `TZS ${db.currentUser.balance}`;
    document.getElementById('profile-balance-display').textContent = `TZS ${db.currentUser.balance}`;
    document.getElementById('dashboard-balance').textContent = `TZS ${db.currentUser.balance}`;

    // Update dashboard stats with investment data
    const userInvestments = await getCurrentUserInvestments();
    const activeInvestments = userInvestments.filter(inv => !inv.completed);
    
    document.getElementById('total-balance').textContent = db.formatNumber(db.currentUser.balance);
    document.getElementById('active-investments').textContent = activeInvestments.length;
    document.getElementById('active-investment-count').textContent = activeInvestments.length;
    document.getElementById('available-investments').textContent = activeInvestments.length;
    
    // Calculate total profit from investments
    let totalProfit = 0;
    userInvestments.forEach(investment => {
        if (investment.completed) {
            totalProfit += investment.finalProfit || 0;
        } else {
            totalProfit += calculateCurrentProfit(investment);
        }
        totalProfit += investment.collectedProfits || 0;
    });
    
    document.getElementById('total-profit').textContent = db.formatNumber(totalProfit);
    document.getElementById('today-profit').textContent = db.formatNumber(totalProfit);
    
    // Update referral code
    document.getElementById('user-referral-code').textContent = db.currentUser.referral_code;
    
    // Initialize investment system for the user
    initInvestmentSystem();
    
    // Load user data
    await loadUserReferrals();
    initRewardsSystem();
    
    // Load referrals when dashboard is shown
    await loadEnhancedReferrals();
    
    // Set up auto-refresh
    startReferralAutoRefresh();
            
    // Update withdrawal calculation with current balance
    updateWithdrawalCalculation();
    
    // Load transaction history if on history tab
    if (document.getElementById('history').classList.contains('active')) {
        await loadTransactionHistory();
    }
}

// Show admin dashboard
async function showAdminDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    document.getElementById('admin-username-display').textContent = db.currentUser.username;
    await loadPendingTransactions();
    await loadAdminStats();
    initRewardsSystem();
}

// Update balance display
function updateBalanceDisplay() {
    if (db.currentUser) {
        document.getElementById('dashboard-balance').textContent = db.formatCurrency(db.currentUser.balance);
        document.getElementById('withdraw-balance').textContent = db.formatCurrency(db.currentUser.balance);
        updateWithdrawalCalculation();
    }
}

// Load transaction history
async function loadTransactionHistory() {
    const historyBody = document.getElementById('transaction-history-body');
    historyBody.innerHTML = '';
    
    if (!db.currentUser) return;
    
    const transactions = await db.getUserTransactions(db.currentUser.id);
    
    if (transactions.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Hakuna historia ya miradi</td></tr>';
        return;
    }
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(transaction.date).toLocaleDateString('sw-TZ');
        
        // Format amount
        const amount = db.formatCurrency(transaction.amount);
        
        // Status with appropriate class
        let statusClass = '';
        let statusText = '';
        if (transaction.status === 'pending') {
            statusClass = 'status-pending';
            statusText = 'Inasubiri';
        } else if (transaction.status === 'approved') {
            statusClass = 'status-approved';
            statusText = 'Imekubaliwa';
        } else if (transaction.status === 'rejected') {
            statusClass = 'status-rejected';
            statusText = 'Imekataliwa';
        }
        
        // Details based on transaction type
        let details = '';
        if (transaction.type === 'deposit') {
            details = `Kutoka: ${transaction.details.senderName} (${transaction.details.senderAccount})`;
        } else if (transaction.type === 'withdrawal') {
            details = `Kwa: ${transaction.details.accountName} (${transaction.details.accountNumber})`;
        }
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${transaction.type === 'deposit' ? '📥 Kuweka' : '📤 Kutoa'}</td>
            <td>${amount}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>${details}</td>
            <td>
                <button class="btn" onclick="generateReceipt(${transaction.id})" 
                        style="width: auto; padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    👁️ Onyesha Risiti
                </button>
            </td>
        `;
        
        historyBody.appendChild(row);
    });
}

// Load admin transaction history
async function loadAdminTransactionHistory() {
    const historyBody = document.getElementById('admin-transactions-body');
    historyBody.innerHTML = '';
    
    const transactions = await db.getAllTransactions();
    
    if (transactions.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Hakuna historia ya miradi</td></tr>';
        return;
    }
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(transaction.date).toLocaleDateString('sw-TZ');
        
        // Format amount
        const amount = db.formatCurrency(transaction.amount);
        
        // Status with appropriate class
        let statusClass = '';
        let statusText = '';
        if (transaction.status === 'pending') {
            statusClass = 'status-pending';
            statusText = 'Inasubiri';
        } else if (transaction.status === 'approved') {
            statusClass = 'status-approved';
            statusText = 'Imekubaliwa';
        } else if (transaction.status === 'rejected') {
            statusClass = 'status-rejected';
            statusText = 'Imekataliwa';
        }
        
        // Details based on transaction type
        let details = '';
        if (transaction.type === 'deposit') {
            details = `Kutoka: ${transaction.details.senderName} (${transaction.details.senderAccount})`;
        } else if (transaction.type === 'withdrawal') {
            details = `Kwa: ${transaction.details.accountName} (${transaction.details.accountNumber})`;
        }
        
        row.innerHTML = `
            <td>${transaction.username}</td>
            <td>${transaction.type === 'deposit' ? 'Kuwaweka' : 'Kutoa'}</td>
            <td>${amount}</td>
            <td>${date}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>${details}</td>
        `;
        
        historyBody.appendChild(row);
    });
}

// Load admin stats
async function loadAdminStats() {
    const totalUsers = await db.getTotalUsers();
    const totalDeposits = await db.getTotalDeposits();
    const totalWithdrawals = await db.getTotalWithdrawals();
    const pendingTransactions = await db.getPendingTransactions();
    
    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('total-deposits').textContent = db.formatCurrency(totalDeposits);
    document.getElementById('total-withdrawals').textContent = db.formatCurrency(totalWithdrawals);
    document.getElementById('pending-transactions-count').textContent = pendingTransactions.length;
}

// Admin Functions
async function loadPendingTransactions() {
    const pendingBody = document.getElementById('pending-transactions-body');
    pendingBody.innerHTML = '';
    
    const pendingTransactions = await db.getPendingTransactions();
    
    if (pendingTransactions.length === 0) {
        pendingBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Hakuna miradi inayosubiri idhini</td></tr>';
        return;
    }
    
    pendingTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(transaction.date).toLocaleDateString('sw-TZ');
        
        // Format amount
        const amount = db.formatCurrency(transaction.amount);
        
        // Details based on transaction type - WITH ERROR HANDLING
        let details = '';
        if (transaction.type === 'deposit') {
            // Use optional chaining and default values
            const senderName = transaction.details?.senderName || 'Haijawekwa';
            const senderAccount = transaction.details?.senderAccount || 'Haijawekwa';
            const transactionCode = transaction.details?.transactionCode || 'Haijawekwa';
            details = `Kutoka: ${senderName} (${senderAccount}), Kodi: ${transactionCode}`;
        } else if (transaction.type === 'withdrawal') {
            // Use optional chaining and default values
            const accountName = transaction.details?.accountName || 'Haijawekwa';
            const accountNumber = transaction.details?.accountNumber || 'Haijawekwa';
            const reason = transaction.details?.reason ? `, Sababu: ${transaction.details.reason}` : '';
            details = `Kwa: ${accountName} (${accountNumber})${reason}`;
        }
        
        row.innerHTML = `
            <td>${transaction.username} (${transaction.email})</td>
            <td>${transaction.type === 'deposit' ? 'Kuwaweka' : 'Kutoa'}</td>
            <td>${amount}</td>
            <td>${date}</td>
            <td>${details}</td>
            <td>
                <button class="btn" onclick="approveTransaction(${transaction.id}, '${transaction.userId}')" style="margin-bottom: 5px; width: auto; padding: 5px 10px;">Idhinisha</button>
                <button class="btn" style="background: #e74c3c; width: auto; padding: 5px 10px;" onclick="rejectTransaction(${transaction.id}, '${transaction.userId}')">Kataa</button>
            </td>
        `;
        
        pendingBody.appendChild(row);
    });
}

// Enhanced Load transaction history for user
async function loadTransactionHistory() {
    const historyBody = document.getElementById('transaction-history-body');
    if (!historyBody) {
        return;
    }
    
    historyBody.innerHTML = '';
    
    if (!db.currentUser) {
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Sasisha</td></tr>';
        return;
    }
    
    const transactions = await db.getUserTransactions(db.currentUser.id);
    
    if (transactions.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hakuna historia ya miradi</h4>
                    <p style="color: #95a5a6;">Haujaanza muamala wowote bado</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.className = 'transaction-row';
        
        // Format date with time
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('sw-TZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format amount with better styling
        const amount = db.formatCurrency(transaction.amount);
        
        // Enhanced status with appropriate class and icons
        let statusClass = '';
        let statusText = '';
        let statusIcon = '';
        
        if (transaction.status === 'pending') {
            statusClass = 'status-pending';
            statusText = 'Inasubiri';
            statusIcon = '⏳';
        } else if (transaction.status === 'approved') {
            statusClass = 'status-approved';
            statusText = 'Imekubaliwa';
            statusIcon = '✅';
        } else if (transaction.status === 'rejected') {
            statusClass = 'status-rejected';
            statusText = 'Imekataliwa';
            statusIcon = '❌';
        } else {
            statusClass = 'status-unknown';
            statusText = transaction.status || 'Haijulikani';
            statusIcon = '❓';
        }
        
        // Enhanced details based on transaction type with better formatting
        let details = '';
        let transactionIcon = '';
        
        if (transaction.type === 'deposit') {
            transactionIcon = '📥';
            const senderName = transaction.details?.senderName || 'Haijawekwa';
            const senderAccount = transaction.details?.senderAccount || 'Haijawekwa';
            const method = transaction.details?.method || 'N/A';
            details = `
                <div><strong>${transactionIcon} Kuwaweka</strong></div>
                <div style="font-size: 12px; color: #666;">Kutoka: ${senderName}</div>
                <div style="font-size: 12px; color: #666;">Akaunti: ${senderAccount}</div>
                <div style="font-size: 12px; color: #666;">Njia: ${method}</div>
            `;
        } else if (transaction.type === 'withdrawal') {
            transactionIcon = '📤';
            const accountName = transaction.details?.accountName || 'Haijawekwa';
            const accountNumber = transaction.details?.accountNumber || 'Haijawekwa';
            const method = transaction.details?.method || 'N/A';
            details = `
                <div><strong>${transactionIcon} Kutoa</strong></div>
                <div style="font-size: 12px; color: #666;">Kwa: ${accountName}</div>
                <div style="font-size: 12px; color: #666;">Akaunti: ${accountNumber}</div>
                <div style="font-size: 12px; color: #666;">Njia: ${method}</div>
            `;
        }
        
        row.innerHTML = `
            <td>
                <div style="font-weight: bold;">${formattedDate}</div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">${transactionIcon}</span>
                    <span>${transaction.type === 'deposit' ? 'Kuwaweka' : 'Kutoa'}</span>
                </div>
            </td>
            <td>
                <div style="font-weight: bold; font-size: 16px; 
                           color: ${transaction.type === 'withdrawal' ? '#e74c3c' : '#27ae60'}">
                    ${transaction.type === 'withdrawal' ? '-' : '+'}${amount}
                </div>
            </td>
            <td>
                <span class="${statusClass}" style="display: inline-flex; align-items: center; gap: 4px;">
                    ${statusIcon} ${statusText}
                </span>
            </td>
            <td>${details}</td>
            <td>
                <button class="btn-receipt" onclick="generateReceipt(${transaction.id})" 
                        style="display: flex; align-items: center; gap: 5px; padding: 8px 12px;">
                    📄 Pakua Risiti
                </button>
            </td>
        `;
        
        historyBody.appendChild(row);
    });
}

// Make functions global for HTML onclick handlers
window.approveTransaction = async function(transactionId, userId) {
    if (confirm('Una uhakika unataka kuidhinisha muamala huu?')) {
        const success = await db.updateTransactionStatus(
            userId,
            transactionId, 
            'approved', 
            db.currentUser.id
        );
        
        if (success) {
            alert('Muamala umeidhinishwa kwa mafanikio');
            await loadPendingTransactions();
            await loadAdminStats();
        } else {
            alert('Hitilafu imetokea wakati wa kuidhinisha muamala');
        }
    }
};

window.rejectTransaction = async function(transactionId, userId) {
    if (confirm('Una uhakika unataka kukataa muamala huu?')) {
        const success = await db.updateTransactionStatus(
            userId,
            transactionId, 
            'rejected', 
            db.currentUser.id
        );
        
        if (success) {
            alert('Muamala umekataliwa kwa mafanikio');
            await loadPendingTransactions();
            await loadAdminStats();
        } else {
            alert('Hitilafu imetokea wakati wa kukataa muamala');
        }
    }
};

// Enhanced Referral System JavaScript
async function loadEnhancedReferrals() {
    if (!db.currentUser) return;
    
    // Get user's referrals
    const users = await db.getUsers();
    const userReferrals = users.filter(user => user.referred_by === db.currentUser.referral_code);
    
    // Update statistics
    updateReferralStats(userReferrals);
    
    // Update referral code display
    document.getElementById('user-referral-code-display').textContent = db.currentUser.referral_code;
    document.getElementById('referral-link-text').textContent = 
        `https://tanzania-mining.com/register?ref=${db.currentUser.referral_code}`;
    
    // Populate referrals table
    populateReferralsTable(userReferrals);
    
    // Update earnings summary
    updateEarningsSummary(userReferrals);
    
    // Update referral count badge
    const referralCountBadge = document.getElementById('referral-count-badge');
    const referralCountCard = document.getElementById('referral-count-card');
    const referralCount = document.getElementById('referral-count');
    if (userReferrals.length > 0) {
        referralCountBadge.textContent = userReferrals.length;
        referralCountCard.textContent = userReferrals.length;
        referralCount.textContent = userReferrals.length;
        referralCountBadge.style.display = 'flex';
        referralCount.style.display = 'flex';
        referralCountCard.style.display = 'flex';
    } else {
        referralCountBadge.style.display = 'none';
        referralCountCard.style.display = 'none';
        referralCount.style.display = 'none';
    }
}

// Update referral statistics
function updateReferralStats(referrals) {
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(user => user.status === 'active').length;
    
    // Calculate total earnings from referral bonuses
    let totalEarnings = 0;
    let pendingEarnings = 0;
    
    if (db.currentUser.transactions) {
        db.currentUser.transactions.forEach(transaction => {
            if (transaction.type === 'Referral Bonus') {
                if (transaction.status === 'completed') {
                    totalEarnings += transaction.amount;
                } else if (transaction.status === 'pending') {
                    pendingEarnings += transaction.amount;
                }
            }
        });
    }
    
    document.getElementById('total-referrals').textContent = totalReferrals;
    document.getElementById('active-referrals').textContent = activeReferrals;
    document.getElementById('total-earnings').textContent = `TZS ${db.formatNumber(totalEarnings)}`;
    document.getElementById('pending-earnings').textContent = `TZS ${db.formatNumber(pendingEarnings)}`;
}

// Populate referrals table
function populateReferralsTable(referrals) {
    const tableBody = document.getElementById('referrals-table-body');
    const noDataMessage = document.getElementById('no-referrals-message');
    
    if (referrals.length === 0) {
        tableBody.innerHTML = '';
        noDataMessage.style.display = 'block';
        return;
    }
    
    noDataMessage.style.display = 'none';
    
    let html = '';
    referrals.forEach(user => {
        // Calculate user's referral earnings
        const userEarnings = calculateReferralEarnings(user);
        
        // Determine status
        let statusClass, statusText;
        if (user.status === 'active') {
            statusClass = 'status-active';
            statusText = 'Active';
        } else if (user.balance > 0) {
            statusClass = 'status-pending';
            statusText = 'Pending';
        } else {
            statusClass = 'status-inactive';
            statusText = 'Inactive';
        }
        
        html += `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-name">${user.username}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                </td>
                <td>${new Date(user.join_date).toLocaleDateString()}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>TZS ${db.formatNumber(user.balance)}</td>
                <td>TZS ${db.formatNumber(userEarnings)}</td>
                <td>
                    <button class="btn-action view-details" onclick="viewReferralDetails(${user.id})">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Add this function to show the user management section
async function showUserManagement() {
    document.getElementById('admin-dashboard').classList.remove('active');
    document.getElementById('user-management').classList.add('active');
    
    await loadUserManagementTable();
}

// Add this function to load users into the management table
async function loadUserManagementTable() {
    const users = await db.getUsers();
    const tableBody = document.getElementById('user-management-table');
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    
    // Filter users based on search
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.referral_code.toLowerCase().includes(searchTerm)
    );
    
    tableBody.innerHTML = '';
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Status badge
        const statusBadge = user.status === 'active' ? 
            '<span class="status-badge active">Active</span>' : 
            '<span class="status-badge inactive">Inactive</span>';
        
        // Admin badge
        const adminBadge = user.is_admin ? '<span class="admin-badge">Admin</span>' : '';
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>
                <div class="user-info">
                    <strong>${user.username}</strong>
                    ${adminBadge}
                </div>
                <small>${user.email}</small>
            </td>
            <td>${user.referral_code}</td>
            <td>${db.formatCurrency(user.balance)}</td>
            <td>${user.investments ? user.investments.length : 0}</td>
            <td>${user.referrals ? user.referrals.length : 0}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="user-actions">
                    <button class="btn-action view-password" onclick="viewUserPassword(${user.id})" title="View Password">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn-action view-operations" onclick="viewUserOperations(${user.id})" title="View Operations">
                        <i class="fas fa-history"></i>
                    </button>
                    ${!user.is_admin ? `
                        <button class="btn-action ${user.status === 'active' ? 'deactivate' : 'activate'}" 
                                onclick="toggleUserStatus(${user.id})" 
                                title="${user.status === 'active' ? 'Deactivate User' : 'Activate User'}">
                            <i class="fas ${user.status === 'active' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                        </button>
                        <button class="btn-action delete-user" onclick="deleteUser(${user.id})" title="Delete User">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Add this function to toggle user status (active/inactive)
async function toggleUserStatus(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user && !user.is_admin) {
        user.status = user.status === 'active' ? 'inactive' : 'active';
        await db.updateUser(userId, { status: user.status });
        
        // Show notification
        showNotification(`User ${user.username} has been ${user.status === 'active' ? 'activated' : 'deactivated'}`, 'success');
        
        // Reload the table
        await loadUserManagementTable();
    }
}

// Add this function to delete user
async function deleteUser(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user && !user.is_admin) {
        if (confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone.`)) {
            // Note: In Firestore, you would delete the user document
            // For now, we'll filter the array and save
            const updatedUsers = users.filter(u => u.id !== userId);
            // You would need to implement db.deleteUser(userId) for Firestore
            showNotification(`User ${user.username} has been deleted`, 'success');
            await loadUserManagementTable();
        }
    }
}

// Simplified refresh functions
async function refreshUserTransactions() {
    await loadTransactionHistory();
}

async function refreshAdminTransactions() {
    await loadAdminTransactionHistory();
}

// Call this function immediately after successful login
async function initializeAfterLogin() {
    await refreshUserTransactions();
    await refreshAdminTransactions();
}

// Daily Rewards System - Updated with 10 TZS minimum
class DailyRewards {
    constructor() {
        this.initRewardsDatabase();
    }

    initRewardsDatabase() {
        if (!localStorage.getItem('mining_reward_codes')) {
            localStorage.setItem('mining_reward_codes', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('mining_reward_redemptions')) {
            localStorage.setItem('mining_reward_redemptions', JSON.stringify([]));
        }
    }

    getRewardCodes() {
        return JSON.parse(localStorage.getItem('mining_reward_codes') || '[]');
    }

    saveRewardCodes(codes) {
        localStorage.setItem('mining_reward_codes', JSON.stringify(codes));
    }

    getRewardRedemptions() {
        return JSON.parse(localStorage.getItem('mining_reward_redemptions') || '[]');
    }

    saveRewardRedemptions(redemptions) {
        localStorage.setItem('mining_reward_redemptions', JSON.stringify(redemptions));
    }

    generateRewardCode(amount, expiresAt = null, usageLimit = null) {
        const codes = this.getRewardCodes();
        
        // Generate a unique code
        let code;
        do {
            code = this.generateUniqueCode();
        } while (codes.find(c => c.code === code));
        
        const newCode = {
            id: Date.now(),
            code: code,
            amount: parseInt(amount),
            createdBy: db.currentUser.id,
            createdByUsername: db.currentUser.username,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            isActive: true,
            redeemedBy: [] // Track which users have redeemed this code
        };
        
        codes.push(newCode);
        this.saveRewardCodes(codes);
        
        return newCode;
    }

    generateUniqueCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    claimReward(code, userId, username) {
        const codes = this.getRewardCodes();
        const redemptions = this.getRewardRedemptions();
        
        // Find the reward code
        const rewardCode = codes.find(c => c.code === code.toUpperCase());
        
        if (!rewardCode) {
            return { success: false, message: '❌ Invalid reward code' };
        }
        
        if (!rewardCode.isActive) {
            return { success: false, message: '❌ This reward code is no longer active' };
        }
        
        // Check if code has expired
        if (rewardCode.expiresAt && new Date() > new Date(rewardCode.expiresAt)) {
            rewardCode.isActive = false; // Auto-deactivate expired codes
            this.saveRewardCodes(codes);
            return { success: false, message: '❌ This reward code has expired' };
        }
        
        // Check if user has already claimed this code
        const userRedemption = rewardCode.redeemedBy.find(redemption => redemption.userId === userId);
        if (userRedemption) {
            return { success: false, message: '❌ You have already claimed this reward code' };
        }
        
        // Check usage limit
        if (rewardCode.usageLimit && rewardCode.redeemedBy.length >= rewardCode.usageLimit) {
            rewardCode.isActive = false; // Auto-deactivate when limit reached
            this.saveRewardCodes(codes);
            return { success: false, message: '❌ This reward code has reached its usage limit' };
        }
        
        // Add user to redeemed list with timestamp
        const redemptionRecord = {
            userId: userId,
            username: username,
            redeemedAt: new Date().toISOString()
        };
        
        rewardCode.redeemedBy.push(redemptionRecord);
        
        // Create redemption history record
        const redemption = {
            id: Date.now(),
            userId: userId,
            username: username,
            codeId: rewardCode.id,
            code: rewardCode.code,
            amount: rewardCode.amount,
            redeemedAt: new Date().toISOString()
        };
        
        redemptions.push(redemption);
        
        // Save updates
        this.saveRewardCodes(codes);
        this.saveRewardRedemptions(redemptions);
        
        return { 
            success: true, 
            message: `🎉 Successfully claimed ${db.formatCurrency(rewardCode.amount)} reward! Amount added to your balance.`,
            amount: rewardCode.amount
        };
    }

    deactivateRewardCode(codeId) {
        const codes = this.getRewardCodes();
        const code = codes.find(c => c.id === codeId);
        
        if (code) {
            code.isActive = false;
            this.saveRewardCodes(codes);
            return true;
        }
        
        return false;
    }

    getActiveRewardCodes() {
        const codes = this.getRewardCodes();
        return codes.filter(code => code.isActive);
    }

    getUserClaimedRewards(userId) {
        const redemptions = this.getRewardRedemptions();
        return redemptions
            .filter(r => r.userId === userId)
            .sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
    }

    getAllRedemptions() {
        return this.getRewardRedemptions().sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
    }

    getRewardStats() {
        const codes = this.getRewardCodes();
        const redemptions = this.getRewardRedemptions();
        
        const activeCodes = codes.filter(code => code.isActive).length;
        const totalRedeemed = redemptions.reduce((sum, redemption) => sum + redemption.amount, 0);
        
        return {
            activeCodes: activeCodes,
            totalRedeemed: totalRedeemed
        };
    }
}

// Initialize rewards system
const dailyRewards = new DailyRewards();

// User Functions
function claimReward() {
    if (!db.currentUser) {
        showNotification('Please log in to claim rewards', true);
        return;
    }
    
    const codeInput = document.getElementById('reward-code-input');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code) {
        showRewardStatus('Please enter a reward code', 'error');
        return;
    }
    
    if (code.length !== 8) {
        showRewardStatus('Reward code must be 8 characters long', 'error');
        return;
    }
    
    const result = dailyRewards.claimReward(code, db.currentUser.id, db.currentUser.username);
    
    if (result.success) {
        // Add reward amount to user balance
        const oldBalance = db.currentUser.balance;
        db.currentUser.balance += result.amount;
        saveCurrentUserBalance();
        updateBalanceDisplays();
        
        showRewardStatus(result.message, 'success');
        codeInput.value = '';
        
        // Refresh claimed rewards list
        loadUserClaimedRewards();
        
        // Show notification with balance update
        showNotification(`🎉 Reward claimed! ${db.formatCurrency(result.amount)} added to your balance. New balance: ${db.formatCurrency(db.currentUser.balance)}`);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            const statusElement = document.getElementById('reward-status');
            statusElement.style.display = 'none';
        }, 5000);
    } else {
        showRewardStatus(result.message, 'error');
    }
}

function showRewardStatus(message, type) {
    const statusElement = document.getElementById('reward-status');
    statusElement.textContent = message;
    statusElement.className = `reward-status ${type}`;
    statusElement.style.display = 'block';
}

function loadUserClaimedRewards() {
    if (!db.currentUser) return;
    
    const claimedRewardsList = document.getElementById('claimed-rewards-list');
    const userRewards = dailyRewards.getUserClaimedRewards(db.currentUser.id);
    
    if (userRewards.length === 0) {
        claimedRewardsList.innerHTML = '<div class="no-rewards">No rewards claimed yet. Enter a code above to claim your first reward!</div>';
        return;
    }
    
    let html = '';
    userRewards.slice(0, 10).forEach(reward => {
        const date = new Date(reward.redeemedAt).toLocaleDateString('en-TZ');
        const time = new Date(reward.redeemedAt).toLocaleTimeString('en-TZ', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        html += `
            <div class="reward-item">
                <div>
                    <div class="reward-code-display">${reward.code}</div>
                    <div class="reward-date">${date} at ${time}</div>
                </div>
                <div class="reward-amount">+${db.formatCurrency(reward.amount)}</div>
            </div>
        `;
    });
    
    claimedRewardsList.innerHTML = html;
}

// Admin Functions
function generateRewardCode() {
    const amountInput = document.getElementById('reward-amount');
    const expiryInput = document.getElementById('reward-expiry');
    const usageLimitInput = document.getElementById('reward-usage-limit');
    
    const amount = parseInt(amountInput.value);
    const expiry = expiryInput.value ? new Date(expiryInput.value).toISOString() : null;
    const usageLimit = usageLimitInput.value ? parseInt(usageLimitInput.value) : null;
    
    if (!amount || amount < 10) {
        alert('Please enter a valid reward amount (minimum 10 TZS)');
        return;
    }
    
    const rewardCode = dailyRewards.generateRewardCode(amount, expiry, usageLimit);
    
    // Clear form
    amountInput.value = '1000'; // Reset to default value
    expiryInput.value = '';
    usageLimitInput.value = '';
    
    // Refresh reward codes display
    loadAdminRewardCodes();
    
    // Show success message with code
    alert(`🎉 Reward code generated successfully!\n\nCode: ${rewardCode.code}\nAmount: ${db.formatCurrency(amount)}\n\nCopy this code and share it with users!`);
}

function loadAdminRewardCodes() {
    const activeRewardCodes = document.getElementById('active-reward-codes');
    const codes = dailyRewards.getActiveRewardCodes();
    
    // Update stats
    const stats = dailyRewards.getRewardStats();
    document.getElementById('total-active-codes').textContent = stats.activeCodes;
    document.getElementById('total-redeemed-amount').textContent = db.formatCurrency(stats.totalRedeemed); 
    
    if (codes.length === 0) {
        activeRewardCodes.innerHTML = '<div class="no-rewards">No active reward codes. Create one using the form on the left.</div>';
        return;
    }
    
    let html = '';
    codes.forEach(code => {
        const createdDate = new Date(code.createdAt).toLocaleDateString('en-TZ');
        const expiryDate = code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('en-TZ') : 'No expiry';
        const usageCount = code.redeemedBy.length;
        const usageLimit = code.usageLimit || 'Unlimited';
        
        let statusBadge = '';
        if (code.expiresAt && new Date() > new Date(code.expiresAt)) {
            statusBadge = '<span class="expired-badge">Expired</span>';
        } else if (code.usageLimit && usageCount >= code.usageLimit) {
            statusBadge = '<span class="limit-reached-badge">Limit Reached</span>';
        }
        
        html += `
            <div class="reward-code-item">
                <div class="reward-code-header">
                    <div class="reward-code">${code.code}</div>
                    <div class="reward-amount-badge">${db.formatCurrency(code.amount)}</div>
                </div>
                <div class="reward-details">
                    <div><strong>Created:</strong> ${createdDate}</div>
                    <div><strong>Expires:</strong> ${expiryDate}</div>
                    <div><strong>Usage:</strong> ${usageCount}/${usageLimit}</div>
                    <div><strong>Created by:</strong> ${code.createdByUsername}</div>
                </div>
                ${statusBadge}
                ${code.redeemedBy.length > 0 ? `
                    <div class="redeemed-users">
                        <strong>Redeemed by (${code.redeemedBy.length} user(s)):</strong>
                        ${code.redeemedBy.map(redemption => {
                            const date = new Date(redemption.redeemedAt).toLocaleDateString('en-TZ');
                            return `
                                <div class="redeemed-user">
                                    <span class="redeemed-username">${redemption.username}</span>
                                    <span class="redeemed-date">${date}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : '<div style="margin-top: 10px; color: #7f8c8d; font-style: italic;">No redemptions yet</div>'}
                <div class="reward-actions">
                    <button class="btn" onclick="copyRewardCode('${code.code}')">
                        <i class="fas fa-copy"></i> Copy Code
                    </button>
                    <button class="btn" style="background: #e74c3c;" onclick="deactivateRewardCode(${code.id})">
                        <i class="fas fa-ban"></i> Deactivate
                    </button>
                </div>
            </div>
        `;
    });
    
    activeRewardCodes.innerHTML = html;
}

function loadRewardRedemptionHistory() {
    const rewardHistory = document.getElementById('reward-redemption-history');
    const redemptions = dailyRewards.getAllRedemptions();
    
    if (redemptions.length === 0) {
        rewardHistory.innerHTML = '<div class="no-rewards">No reward redemptions yet.</div>';
        return;
    }
    
    let html = '';
    redemptions.slice(0, 20).forEach(redemption => {
        const date = new Date(redemption.redeemedAt).toLocaleDateString('en-TZ');
        const time = new Date(redemption.redeemedAt).toLocaleTimeString('en-TZ', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        html += `
            <div class="reward-item">
                <div>
                    <div><strong>${redemption.username}</strong></div>
                    <div class="reward-code-display">${redemption.code}</div>
                    <div class="reward-date">${date} at ${time}</div>
                </div>
                <div class="reward-amount">${db.formatCurrency(redemption.amount)}</div>
            </div>
        `;
    });
    
    rewardHistory.innerHTML = html;
}

function copyRewardCode(code) {
    navigator.clipboard.writeText(code);
    showNotification('Reward code copied to clipboard!');
}

function deactivateRewardCode(codeId) {
    if (confirm('Are you sure you want to deactivate this reward code? Users will no longer be able to claim it.')) {
        const success = dailyRewards.deactivateRewardCode(codeId);
        
        if (success) {
            loadAdminRewardCodes();
            showNotification('Reward code deactivated successfully');
        } else {
            showNotification('Error deactivating reward code', true);
        }
    }
}

// Initialize rewards when dashboard loads
function initRewardsSystem() {
    if (db.currentUser) {
        if (db.currentUser.is_admin) {
            loadAdminRewardCodes();
            loadRewardRedemptionHistory();
        } else {
            loadUserClaimedRewards();
        }
    }
}


      
  // Announcement System
class AnnouncementSystem {
    constructor() {
        this.announcements = this.loadAnnouncements();
        this.currentSlide = 0;
        this.slideshowInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAdminAnnouncements();
        this.startSlideshow();
    }

    // Load announcements from localStorage
    loadAnnouncements() {
        const stored = localStorage.getItem('mining_announcements');
        if (stored) {
            return JSON.parse(stored);
        } else {
            // Create sample announcements
            const sampleAnnouncements = [
                {
                    id: 1,
                    title: "Welcome to Tanzania Mining Investment",
                    content: "We're excited to have you on board. Start your investment journey with us today!",
                    type: "none",
                    priority: "high",
                    active: true,
                    createdAt: new Date().toISOString(),
                    createdBy: "System"
                },
                {
                    id: 2,
                    title: "New Investment Plans Available",
                    content: "Check out our new premium investment plans with higher returns and better benefits.",
                    type: "none",
                    priority: "medium",
                    active: true,
                    createdAt: new Date().toISOString(),
                    createdBy: "System"
                }
            ];
            this.saveAnnouncements(sampleAnnouncements);
            return sampleAnnouncements;
        }
    }

    // Save announcements to localStorage
    saveAnnouncements(announcements) {
        localStorage.setItem('mining_announcements', JSON.stringify(announcements));
    }

    // Get next announcement ID
    getNextId() {
        const maxId = this.announcements.reduce((max, announcement) => 
            Math.max(max, announcement.id), 0);
        return maxId + 1;
    }

    // Setup event listeners
    setupEventListeners() {
        // Admin announcement form
        const newAnnouncementBtn = document.getElementById('new-announcement-btn');
        const announcementForm = document.getElementById('announcement-form');
        const cancelAnnouncement = document.getElementById('cancel-announcement');
        const saveAnnouncement = document.getElementById('save-announcement');
        const mediaTypeRadios = document.querySelectorAll('input[name="media-type"]');

        if (newAnnouncementBtn) {
            newAnnouncementBtn.addEventListener('click', () => {
                announcementForm.style.display = 'block';
                this.resetAnnouncementForm();
            });
        }

        if (cancelAnnouncement) {
            cancelAnnouncement.addEventListener('click', () => {
                announcementForm.style.display = 'none';
            });
        }

        if (saveAnnouncement) {
            saveAnnouncement.addEventListener('click', () => {
                this.saveNewAnnouncement();
            });
        }

        // Media type selection
        if (mediaTypeRadios.length > 0) {
            mediaTypeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.toggleMediaSections(e.target.value);
                });
            });
        }

        // Slideshow navigation
        const prevBtn = document.getElementById('slideshow-prev');
        const nextBtn = document.getElementById('slideshow-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.prevSlide();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextSlide();
            });
        }

        // Pause slideshow on hover
        const slideshow = document.getElementById('announcements-slideshow');
        if (slideshow) {
            slideshow.addEventListener('mouseenter', () => {
                this.pauseSlideshow();
            });

            slideshow.addEventListener('mouseleave', () => {
                this.resumeSlideshow();
            });
        }
    }

    // Toggle media sections based on selection
    toggleMediaSections(mediaType) {
        const imageSection = document.getElementById('image-upload-section');
        const videoSection = document.getElementById('video-upload-section');

        if (imageSection) imageSection.style.display = mediaType === 'image' ? 'block' : 'none';
        if (videoSection) videoSection.style.display = mediaType === 'video' ? 'block' : 'none';
    }

    // Reset announcement form
    resetAnnouncementForm() {
        document.getElementById('announcement-title').value = '';
        document.getElementById('announcement-content').value = '';
        document.getElementById('announcement-image').value = '';
        document.getElementById('announcement-video').value = '';
        document.getElementById('announcement-priority').value = 'medium';
        document.getElementById('announcement-active').checked = true;
        
        // Reset media type to none
        document.querySelector('input[name="media-type"][value="none"]').checked = true;
        this.toggleMediaSections('none');
    }

    // Save new announcement
    saveNewAnnouncement() {
        const title = document.getElementById('announcement-title').value.trim();
        const content = document.getElementById('announcement-content').value.trim();
        const mediaType = document.querySelector('input[name="media-type"]:checked').value;
        const priority = document.getElementById('announcement-priority').value;
        const active = document.getElementById('announcement-active').checked;

        if (!title) {
            alert('Please enter a title for the announcement');
            return;
        }

        if (!content) {
            alert('Please enter content for the announcement');
            return;
        }

        const newAnnouncement = {
            id: this.getNextId(),
            title,
            content,
            type: mediaType,
            priority,
            active,
            createdAt: new Date().toISOString(),
            createdBy: db.currentUser ? db.currentUser.username : 'Admin'
        };

        // Handle media based on type
        if (mediaType === 'image') {
            const imageFile = document.getElementById('announcement-image').files[0];
            if (imageFile) {
                // Convert image to base64 for storage
                const reader = new FileReader();
                reader.onload = (e) => {
                    newAnnouncement.mediaUrl = e.target.result;
                    this.finalizeAnnouncementSave(newAnnouncement);
                };
                reader.readAsDataURL(imageFile);
            } else {
                this.finalizeAnnouncementSave(newAnnouncement);
            }
        } else if (mediaType === 'video') {
            const videoUrl = document.getElementById('announcement-video').value.trim();
            if (videoUrl) {
                newAnnouncement.mediaUrl = videoUrl;
            }
            this.finalizeAnnouncementSave(newAnnouncement);
        } else {
            this.finalizeAnnouncementSave(newAnnouncement);
        }
    }

    // Finalize saving announcement
    finalizeAnnouncementSave(announcement) {
        this.announcements.push(announcement);
        this.saveAnnouncements(this.announcements);
        
        // Update UI
        this.loadAdminAnnouncements();
        this.updateSlideshow();
        
        // Hide form
        document.getElementById('announcement-form').style.display = 'none';
        
        // Show success message
        alert('Announcement saved successfully!');
    }

    // Load announcements in admin panel
    loadAdminAnnouncements() {
        const announcementsList = document.getElementById('announcements-list');
        if (!announcementsList) return;

        const activeAnnouncements = this.announcements.filter(a => a.active);
        const inactiveAnnouncements = this.announcements.filter(a => !a.active);

        let html = '';

        // Active announcements
        if (activeAnnouncements.length > 0) {
            html += '<h4>Active Announcements</h4>';
            activeAnnouncements.forEach(announcement => {
                html += this.createAnnouncementCard(announcement);
            });
        }

        // Inactive announcements
        if (inactiveAnnouncements.length > 0) {
            html += '<h4 style="margin-top: 30px;">Inactive Announcements</h4>';
            inactiveAnnouncements.forEach(announcement => {
                html += this.createAnnouncementCard(announcement);
            });
        }

        if (this.announcements.length === 0) {
            html = '<p>No announcements found. Create your first announcement!</p>';
        }

        announcementsList.innerHTML = html;
    }

    // Create announcement card for admin panel
    createAnnouncementCard(announcement    ) {
        const date = new Date(announcement.createdAt).toLocaleDateString();
        const priorityClass = `priority-${announcement.priority}`;
        
        let mediaPreview = '';    
        if (announcement.type === 'image' && announcement.mediaUrl) {
            mediaPreview = `
                <div class="announcement-media-preview">
                    <img src="${announcement.mediaUrl}" alt="Announcement image" style="width: 100%; border-radius: 5px;">
                </div>
            `;
        } else if (announcement.type === 'video' && announcement.mediaUrl) {
            mediaPreview = `
                <div class="announcement-media-preview">
                    <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">
                        <i class="fas fa-video" style="font-size: 2rem; color: #666;"></i>
                        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Video: ${announcement.mediaUrl}</p>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="announcement-card">
                <div class="announcement-header">
                    <h4 class="announcement-title">${announcement.title}</h4>
                    <div class="announcement-meta">
                        <span class="priority-badge ${priorityClass}">${announcement.priority}</span>
                        <span>${date}</span>
                    </div>
                </div>
                <div class="announcement-content">
                    <p>${announcement.content}</p>
                    ${mediaPreview}
                </div>
                <div class="announcement-actions">
                    <button class="btn btn-edit" onclick="announcementSystem.editAnnouncement(${announcement.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-toggle" onclick="announcementSystem.toggleAnnouncement(${announcement.id})">
                        <i class="fas ${announcement.active ? 'fa-eye-slash' : 'fa-eye'}"></i> 
                        ${announcement.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-delete" onclick="announcementSystem.deleteAnnouncement(${announcement.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Edit announcement
    editAnnouncement(id) {
        const announcement = this.announcements.find(a => a.id === id);
        if (!announcement) return;

        // Populate form with announcement data
        document.getElementById('announcement-title').value = announcement.title;
        document.getElementById('announcement-content').value = announcement.content;
        document.getElementById('announcement-priority').value = announcement.priority;
        document.getElementById('announcement-active').checked = announcement.active;
        
        // Set media type
        document.querySelector(`input[name="media-type"][value="${announcement.type}"]`).checked = true;
        this.toggleMediaSections(announcement.type);
        
        // Show form
        document.getElementById('announcement-form').style.display = 'block';
        
        // Store the ID for updating
        document.getElementById('announcement-form').dataset.editingId = id;
        
        // Change save button text
        document.getElementById('save-announcement').textContent = 'Update Announcement';
    }

    // Toggle announcement active status
    toggleAnnouncement(id) {
        const announcement = this.announcements.find(a => a.id === id);
        if (announcement) {
            announcement.active = !announcement.active;
            this.saveAnnouncements(this.announcements);
            this.loadAdminAnnouncements();
            this.updateSlideshow();
        }
    }

    // Delete announcement
    deleteAnnouncement(id) {
        if (confirm('Are you sure you want to delete this announcement?')) {
            this.announcements = this.announcements.filter(a => a.id !== id);
            this.saveAnnouncements(this.announcements);
            this.loadAdminAnnouncements();
            this.updateSlideshow();
        }
    }

    // Update slideshow with current announcements
    updateSlideshow() {
        const slideshowTrack = document.getElementById('slideshow-track');
        const dotsContainer = document.getElementById('slideshow-dots');
        
        if (!slideshowTrack) return;

        const activeAnnouncements = this.announcements.filter(a => a.active);
        
        if (activeAnnouncements.length === 0) {
            slideshowTrack.innerHTML = `
                <div class="announcement-slide">
                    <div class="slide-content">
                        <h3>No Announcements</h3>
                        <p>Check back later for updates</p>
                    </div>
                </div>
            `;
            if (dotsContainer) dotsContainer.innerHTML = '';
            return;
        }

        let slidesHtml = '';
        let dotsHtml = '';

        activeAnnouncements.forEach((announcement, index) => {
            let mediaHtml = '';
            
            if (announcement.type === 'image' && announcement.mediaUrl) {
                mediaHtml = `<div class="slide-media"><img src="${announcement.mediaUrl}" alt="${announcement.title}"></div>`;
            } else if (announcement.type === 'video' && announcement.mediaUrl) {
                // Check if it's a YouTube or Vimeo URL
                if (announcement.mediaUrl.includes('youtube') || announcement.mediaUrl.includes('youtu.be')) {
                    const videoId = this.extractYouTubeId(announcement.mediaUrl);
                    if (videoId) {
                        mediaHtml = `<div class="slide-media"><iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}" allow="autoplay"></iframe></div>`;
                    }
                } else if (announcement.mediaUrl.includes('vimeo')) {
                    const videoId = this.extractVimeoId(announcement.mediaUrl);
                    if (videoId) {
                        mediaHtml = `<div class="slide-media"><iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1" allow="autoplay"></iframe></div>`;
                    }
                }
            }

            slidesHtml += `
                <div class="announcement-slide">
                    ${mediaHtml}
                    <div class="slide-content">
                        <span class="priority-badge priority-${announcement.priority}">${announcement.priority.toUpperCase()}</span>
                        <h3>${announcement.title}</h3>
                        <p>${announcement.content}</p>
                        <small>Posted on ${new Date(announcement.createdAt).toLocaleDateString()}</small>
                    </div>
                </div>
            `;

            dotsHtml += `<div class="slideshow-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`;
        });

        slideshowTrack.innerHTML = slidesHtml;
        
        if (dotsContainer) {
            dotsContainer.innerHTML = dotsHtml;
            
            // Add click event to dots
            const dots = dotsContainer.querySelectorAll('.slideshow-dot');
            dots.forEach(dot => {
                dot.addEventListener('click', () => {
                    const slideIndex = parseInt(dot.getAttribute('data-slide'));
                    this.goToSlide(slideIndex);
                });
            });
        }

        // Reset current slide
        this.currentSlide = 0;
        this.updateSlidePosition();
    }

    // Extract YouTube video ID from URL
    extractYouTubeId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
    }

    // Extract Vimeo video ID from URL
    extractVimeoId(url) {
        const regExp = /(?:vimeo\.com\/)(\d+)/;
        const match = url.match(regExp);
        return match ? match[1] : false;
    }

    // Start slideshow
    startSlideshow() {
        this.updateSlideshow();
        this.slideshowInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Change slide every 5 seconds
    }

    // Go to next slide
    nextSlide() {
        const activeAnnouncements = this.announcements.filter(a => a.active);
        if (activeAnnouncements.length <= 1) return;
        
        this.currentSlide = (this.currentSlide + 1) % activeAnnouncements.length;
        this.updateSlidePosition();
    }

    // Go to previous slide
    prevSlide() {
        const activeAnnouncements = this.announcements.filter(a => a.active);
        if (activeAnnouncements.length <= 1) return;
        
        this.currentSlide = (this.currentSlide - 1 + activeAnnouncements.length) % activeAnnouncements.length;
        this.updateSlidePosition();
    }

    // Go to specific slide
    goToSlide(index) {
        const activeAnnouncements = this.announcements.filter(a => a.active);
        if (index >= 0 && index < activeAnnouncements.length) {
            this.currentSlide = index;
            this.updateSlidePosition();
        }
    }

    // Update slide position
    updateSlidePosition() {
        const slideshowTrack = document.getElementById('slideshow-track');
        if (slideshowTrack) {
            slideshowTrack.style.transform = `translateX(-${this.currentSlide * 100}%)`;
        }

        // Update active dot
        const dots = document.querySelectorAll('.slideshow-dot');
        dots.forEach((dot, index) => {
            if (index === this.currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Pause slideshow
    pauseSlideshow() {
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.slideshowInterval = null;
        }
    }

    // Resume slideshow
    resumeSlideshow() {
        if (!this.slideshowInterval) {
            this.slideshowInterval = setInterval(() => {
                this.nextSlide();
            }, 5000);
        }
    }
}

// Initialize announcement system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.announcementSystem = new AnnouncementSystem();
});

// Update the navigation to show announcements section
document.addEventListener('DOMContentLoaded', function() {
    // Add announcement navigation item click handler
    const announcementNav = document.querySelector('.nav-item[data-target="announcements"]');
    if (announcementNav) {
        announcementNav.addEventListener('click', function() {
            // Switch to announcements section
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById('announcements').classList.add('active');
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
        });
    }
});       

        // Password Reset Manager - Single Step Approach
        const PasswordResetManager = {
            // Initialize the password reset system
            init() {
                this.bindEvents();
                this.updateEmailPreview();
            },
            
            // Bind all event listeners
            bindEvents() {
                // Real-time validation and preview updates
                const emailInput = document.getElementById('reset-email');
                const usernameInput = document.getElementById('reset-username');
                const phoneInput = document.getElementById('reset-phone');
                
                if (emailInput) {
                    emailInput.addEventListener('input', this.debounce(() => {
                        this.validateEmail();
                        this.updateEmailPreview();
                    }, 300));
                }
                
                if (usernameInput) {
                    usernameInput.addEventListener('input', this.debounce(() => {
                        this.updateEmailPreview();
                    }, 300));
                }
                
                if (phoneInput) {
                    phoneInput.addEventListener('input', this.debounce(() => {
                        this.updateEmailPreview();
                    }, 300));
                }
                
                // Send request button
                const sendRequestBtn = document.getElementById('send-request-btn');
                if (sendRequestBtn) {
                    sendRequestBtn.addEventListener('click', () => {
                        this.sendResetRequest();
                    });
                }
                
                // Reset form button
                const resetFormBtn = document.getElementById('reset-form-btn');
                if (resetFormBtn) {
                    resetFormBtn.addEventListener('click', () => {
                        this.resetForm();
                    });
                }
                
                // New request button
                const newRequestBtn = document.getElementById('new-request-btn');
                if (newRequestBtn) {
                    newRequestBtn.addEventListener('click', () => {
                        this.showResetForm();
                    });
                }
                
                // Enter key support
                document.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.target.closest('#reset-form')) {
                        this.sendResetRequest();
                    }
                });
            },
            
            // Validate email
            validateEmail() {
                const emailInput = document.getElementById('reset-email');
                const emailError = document.getElementById('email-error');
                const sendButton = document.getElementById('send-request-btn');
                
                if (!emailInput) return false;
                
                const email = emailInput.value.trim();
                const isValid = this.isValidEmail(email);
                
                if (emailError) {
                    emailError.style.display = isValid ? 'none' : 'block';
                }
                
                if (sendButton) {
                    sendButton.disabled = !isValid;
                }
                
                return isValid;
            },
            
            // Update email preview
            updateEmailPreview() {
                const emailPreview = document.getElementById('email-preview-content');
                if (!emailPreview) return;
                
                // Get current values
                const email = document.getElementById('reset-email')?.value || '';
                const username = document.getElementById('reset-username')?.value || '';
                const phone = document.getElementById('reset-phone')?.value || '';
                
                // Generate email content
                const emailContent = this.generateEmailContent(email, username, phone);
                emailPreview.textContent = emailContent;
                
                // Show/hide preview based on whether email is valid
                const emailPreviewContainer = document.getElementById('email-preview');
                if (emailPreviewContainer) {
                    if (this.isValidEmail(email)) {
                        emailPreviewContainer.style.display = 'block';
                    } else {
                        emailPreviewContainer.style.display = 'none';
                    }
                }
            },
            
            // Generate email content
            generateEmailContent(email, username, phone) {
                return `Dear MINING INVESTMENT Customer Support Team,

I am writing to request a password reset for my account on your website. I have forgotten my password and am unable to log in.

The account is registered under the following details:
Email Address: ${email}
Username: ${username || 'Not provided'}

Could you please send a password reset link or instructions to the email address associated with my account?

Thank you for your assistance.

Sincerely,
${email}

Phone Number: ${phone || 'Not provided'}`;
            },
            
            // Send reset request via email
            async sendResetRequest() {
                if (!this.validateEmail()) {
                    this.showToast('Please enter a valid email address', 'error');
                    return;
                }
                
                // Get current values
                const email = document.getElementById('reset-email')?.value || '';
                const username = document.getElementById('reset-username')?.value || '';
                const phone = document.getElementById('reset-phone')?.value || '';
                
                // Generate email content
                const emailContent = this.generateEmailContent(email, username, phone);
                const userIdentifier = username || email || 'User';
                const subject = `Account Password Reset Request - ${userIdentifier}`;
                
                // Create mailto link
                const mailtoLink = `mailto:mining.investment.tanzania@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailContent)}`;
                
                // Show loading state
                this.setLoadingState(true);
                
                try {
                    // Simulate processing delay
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Open email client
                    window.location.href = mailtoLink;
                    
                    // Show success message
                    this.showSuccessMessage();
                    this.showToast('Email client opened with pre-written message', 'success');
                    
                } catch (error) {
                    this.showToast('Failed to open email client. Please try again.', 'error');
                } finally {
                    this.setLoadingState(false);
                }
            },
            
            // Show success message
            showSuccessMessage() {
                const resetForm = document.getElementById('reset-form');
                const successMessage = document.getElementById('success-message');
                
                if (resetForm) resetForm.style.display = 'none';
                if (successMessage) successMessage.style.display = 'block';
            },
            
            // Show reset form
            showResetForm() {
                const resetForm = document.getElementById('reset-form');
                const successMessage = document.getElementById('success-message');
                
                if (resetForm) resetForm.style.display = 'block';
                if (successMessage) successMessage.style.display = 'none';
                
                this.resetForm();
            },
            
            // Reset form
            resetForm() {
                // Reset form inputs
                document.getElementById('reset-email').value = '';
                document.getElementById('reset-username').value = '';
                document.getElementById('reset-phone').value = '';
                
                // Reset validation states
                document.getElementById('email-error').style.display = 'none';
                document.getElementById('send-request-btn').disabled = true;
                
                // Update email preview
                this.updateEmailPreview();
                
                // Show toast confirmation
                this.showToast('Form has been reset', 'info');
            },
            
            // Set loading state
            setLoadingState(isLoading) {
                const sendButton = document.getElementById('send-request-btn');
                if (sendButton) {
                    if (isLoading) {
                        sendButton.disabled = true;
                        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Email...';
                    } else {
                        sendButton.disabled = !this.validateEmail();
                        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Password Reset Request';
                    }
                }
            },
            
            // Utility functions
            isValidEmail(email) {
                const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(String(email).toLowerCase());
            },
            
            debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            },
            
            showToast(message, type = 'info') {
                // Create toast element
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.innerHTML = `
                    <div class="toast-content">
                        <i class="fas ${this.getToastIcon(type)}"></i>
                        <span>${message}</span>
                    </div>
                    <button class="toast-close" onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Add to container
                const container = document.getElementById('toast-container') || this.createToastContainer();
                container.appendChild(toast);
                
                // Auto remove after 5 seconds
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 5000);
            },
            
            getToastIcon(type) {
                const icons = {
                    success: 'fa-check-circle',
                    error: 'fa-exclamation-circle',
                    warning: 'fa-exclamation-triangle',
                    info: 'fa-info-circle'
                };
                return icons[type] || 'fa-info-circle';
            },
            
            createToastContainer() {
                const container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'toast-container';
                document.body.appendChild(container);
                return container;
            }
        };

        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            PasswordResetManager.init();
        });
        
        document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation items
    const navItems = document.querySelectorAll('.nav-item');
    // Get all content sections
    const contentSections = document.querySelectorAll('.content-section');
    
    // Function to switch between sections
    function switchSection(targetId) {
        // Remove active class from all nav items and content sections
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to clicked nav item and corresponding content section
        const activeNavItem = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        const activeContentSection = document.getElementById(targetId);
        
        if (activeNavItem && activeContentSection) {
            activeNavItem.classList.add('active');
            activeContentSection.classList.add('active');
        }
    }
    
    // Add click event listeners to all nav items
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            switchSection(targetId);
        });
    });
});

// Earnings Summary Functions
async function updateEarningsSummary() {
    if (!db.currentUser) return;
    
    try {
        console.log('🔄 Updating earnings summary...');
        
        const user = db.currentUser;
        const totalEarnings = await calculateTotalEarnings(user.id);
        const todayEarnings = await calculateTodayEarnings(user.id);
        const weeklyEarnings = await calculateWeeklyEarnings(user.id);
        const monthlyEarnings = await calculateMonthlyEarnings(user.id);
        
        // Update the earnings summary elements
        updateEarningsElements({
            totalEarnings,
            todayEarnings,
            weeklyEarnings,
            monthlyEarnings
        });
        
        console.log('✅ Earnings summary updated');
    } catch (error) {
        console.error('❌ Error updating earnings summary:', error);
    }
}

async function calculateTotalEarnings(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user || !user.transactions) return 0;
        
        // Calculate total earnings from approved deposits and investments
        let totalEarnings = 0;
        
        // Earnings from investment returns
        if (user.investments && user.investments.length > 0) {
            user.investments.forEach(investment => {
                if (investment.status === 'active' || investment.status === 'completed') {
                    totalEarnings += investment.earnings || 0;
                }
            });
        }
        
        // Earnings from referral bonuses
        if (user.referrals && user.referrals.length > 0) {
            user.referrals.forEach(referral => {
                // Add referral bonus logic here
                totalEarnings += referral.bonus || 0;
            });
        }
        
        return totalEarnings;
    } catch (error) {
        console.error('Error calculating total earnings:', error);
        return 0;
    }
}

async function calculateTodayEarnings(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user || !user.transactions) return 0;
        
        const today = new Date().toDateString();
        let todayEarnings = 0;
        
        // Calculate earnings from today's transactions
        if (user.transactions) {
            user.transactions.forEach(transaction => {
                if (transaction.status === 'approved') {
                    const transactionDate = new Date(transaction.date).toDateString();
                    if (transactionDate === today) {
                        // Add transaction-based earnings logic
                        if (transaction.type === 'investment_return') {
                            todayEarnings += transaction.amount || 0;
                        } else if (transaction.type === 'referral_bonus') {
                            todayEarnings += transaction.amount || 0;
                        }
                    }
                }
            });
        }
        
        return todayEarnings;
    } catch (error) {
        console.error('Error calculating today earnings:', error);
        return 0;
    }
}

async function calculateWeeklyEarnings(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user || !user.transactions) return 0;
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        let weeklyEarnings = 0;
        
        if (user.transactions) {
            user.transactions.forEach(transaction => {
                if (transaction.status === 'approved') {
                    const transactionDate = new Date(transaction.date);
                    if (transactionDate >= oneWeekAgo) {
                        if (transaction.type === 'investment_return' || transaction.type === 'referral_bonus') {
                            weeklyEarnings += transaction.amount || 0;
                        }
                    }
                }
            });
        }
        
        return weeklyEarnings;
    } catch (error) {
        console.error('Error calculating weekly earnings:', error);
        return 0;
    }
}

async function calculateMonthlyEarnings(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user || !user.transactions) return 0;
        
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        let monthlyEarnings = 0;
        
        if (user.transactions) {
            user.transactions.forEach(transaction => {
                if (transaction.status === 'approved') {
                    const transactionDate = new Date(transaction.date);
                    if (transactionDate >= oneMonthAgo) {
                        if (transaction.type === 'investment_return' || transaction.type === 'referral_bonus') {
                            monthlyEarnings += transaction.amount || 0;
                        }
                    }
                }
            });
        }
        
        return monthlyEarnings;
    } catch (error) {
        console.error('Error calculating monthly earnings:', error);
        return 0;
    }
}

function updateEarningsElements(earnings) {
    // Update total earnings
    const totalEarningsElement = document.getElementById('total-earnings');
    if (totalEarningsElement) {
        totalEarningsElement.textContent = db.formatCurrency(earnings.totalEarnings);
    }
    
    // Update today earnings
    const todayEarningsElement = document.getElementById('today-earnings');
    if (todayEarningsElement) {
        todayEarningsElement.textContent = db.formatCurrency(earnings.todayEarnings);
    }
    
    // Update weekly earnings
    const weeklyEarningsElement = document.getElementById('weekly-earnings');
    if (weeklyEarningsElement) {
        weeklyEarningsElement.textContent = db.formatCurrency(earnings.weeklyEarnings);
    }
    
    // Update monthly earnings
    const monthlyEarningsElement = document.getElementById('monthly-earnings');
    if (monthlyEarningsElement) {
        monthlyEarningsElement.textContent = db.formatCurrency(earnings.monthlyEarnings);
    }
    
    // Update earnings chart if available
    updateEarningsChart(earnings);
}

function updateEarningsChart(earnings) {
    // Simple earnings chart update
    const earningsChart = document.getElementById('earnings-chart');
    if (earningsChart) {
        // This is a placeholder for chart implementation
        // You can integrate with Chart.js or any other chart library
        earningsChart.innerHTML = `
            <div class="chart-placeholder">
                <h4>Earnings Overview</h4>
                <div class="chart-bar" style="height: ${(earnings.todayEarnings / Math.max(earnings.monthlyEarnings, 1)) * 100}%">
                    <span>Today: ${db.formatCurrency(earnings.todayEarnings)}</span>
                </div>
                <div class="chart-bar" style="height: ${(earnings.weeklyEarnings / Math.max(earnings.monthlyEarnings, 1)) * 100}%">
                    <span>Week: ${db.formatCurrency(earnings.weeklyEarnings)}</span>
                </div>
                <div class="chart-bar" style="height: 100%">
                    <span>Month: ${db.formatCurrency(earnings.monthlyEarnings)}</span>
                </div>
            </div>
        `;
    }
}

// Investment-related functions
async function loadUserInvestments() {
    const investmentsList = document.getElementById('user-investments-list');
    if (!investmentsList) return;

    if (!db.currentUser || !db.currentUser.investments || db.currentUser.investments.length === 0) {
        investmentsList.innerHTML = `
            <div class="no-investments">
                <h4>No Active Investments</h4>
                <p>Start investing to grow your earnings!</p>
                <button onclick="showInvestmentPlans()" class="btn-primary">View Investment Plans</button>
            </div>
        `;
        return;
    }

    let html = '';
    db.currentUser.investments.forEach(investment => {
        const progress = investment.progress || 0;
        const statusColor = investment.status === 'active' ? '#28a745' : 
                           investment.status === 'completed' ? '#17a2b8' : '#6c757d';
        
        html += `
            <div class="investment-item">
                <div class="investment-header">
                    <div class="investment-name">${investment.plan} Plan</div>
                    <div class="investment-status" style="color: ${statusColor}">
                        ${investment.status.toUpperCase()}
                    </div>
                </div>
                <div class="investment-details">
                    <div class="investment-amount">
                        <strong>Amount:</strong> ${db.formatCurrency(investment.amount)}
                    </div>
                    <div class="investment-returns">
                        <strong>Returns:</strong> ${db.formatCurrency(investment.earnings || 0)}
                    </div>
                    <div class="investment-duration">
                        <strong>Duration:</strong> ${investment.duration} days
                    </div>
                    <div class="investment-progress">
                        <strong>Progress:</strong>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span>${progress}%</span>
                    </div>
                </div>
                <div class="investment-actions">
                    ${investment.status === 'active' ? 
                        `<button onclick="withdrawInvestment('${investment.id}')" class="btn-warning">Withdraw</button>` : 
                        `<button disabled class="btn-disabled">Completed</button>`
                    }
                </div>
            </div>
        `;
    });

    investmentsList.innerHTML = html;
}

// Update the updateUserDashboard function to include earnings
async function updateUserDashboard() {
    if (!db.currentUser) return;

    // Update user info
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const userBalanceElement = document.getElementById('user-balance');
    const userReferralCodeElement = document.getElementById('user-referral-code');
    
    if (userNameElement) userNameElement.textContent = db.currentUser.username;
    if (userEmailElement) userEmailElement.textContent = db.currentUser.email;
    if (userBalanceElement) userBalanceElement.textContent = db.formatCurrency(db.currentUser.balance);
    if (userReferralCodeElement) userReferralCodeElement.textContent = db.currentUser.referral_code;
    
    // Load all user data
    await loadUserReferrals();
    await updateEarningsSummary();
    await loadUserInvestments();
    await loadUserTransactions();
    
    console.log('✅ User dashboard updated successfully');
}

// Add transaction loading for user
async function loadUserTransactions() {
    const transactionsList = document.getElementById('user-transactions-list');
    if (!transactionsList) return;

    try {
        const transactions = await db.getUserTransactions(db.currentUser.id);
        
        if (transactions.length === 0) {
            transactionsList.innerHTML = '<p>No transactions yet.</p>';
            return;
        }

        let html = '';
        transactions.slice(0, 10).forEach(transaction => { // Show last 10 transactions
            const statusColor = transaction.status === 'approved' ? '#28a745' : 
                              transaction.status === 'rejected' ? '#dc3545' : '#ffc107';
            
            const typeColor = transaction.type === 'deposit' ? '#17a2b8' : 
                            transaction.type === 'withdrawal' ? '#dc3545' : '#28a745';
            
            html += `
                <div class="transaction-item">
                    <div class="transaction-header">
                        <div class="transaction-type" style="color: ${typeColor}">
                            ${transaction.type.toUpperCase()}
                        </div>
                        <div class="transaction-date">
                            ${new Date(transaction.date).toLocaleDateString()}
                        </div>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-amount">
                            ${db.formatCurrency(transaction.amount)}
                        </div>
                        <div class="transaction-method">
                            ${transaction.method}
                        </div>
                        <div class="transaction-status" style="color: ${statusColor}">
                            ${transaction.status.toUpperCase()}
                        </div>
                    </div>
                </div>
            `;
        });

        transactionsList.innerHTML = html;
    } catch (error) {
        console.error('Error loading user transactions:', error);
        transactionsList.innerHTML = '<p>Error loading transactions.</p>';
    }
}

// Add these placeholder functions for UI actions
function showInvestmentPlans() {
    alert('Investment plans feature coming soon!');
    // You can implement a modal or new section for investment plans
}

function withdrawInvestment(investmentId) {
    if (confirm('Are you sure you want to withdraw this investment? Early withdrawal may incur fees.')) {
        console.log('Withdrawing investment:', investmentId);
        // Implement investment withdrawal logic
        alert('Withdrawal request submitted!');
    }
}

// Add CSS for the new elements (add this to your CSS)
const earningsCSS = `
.earnings-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.earning-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 16px;
}

.earning-item .value {
    font-weight: bold;
}

.investment-item {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    background: #f9f9f9;
}

.investment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.investment-name {
    font-weight: bold;
    font-size: 18px;
}

.investment-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 15px;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
    margin: 5px 0;
}

.progress-fill {
    height: 100%;
    background: #28a745;
    transition: width 0.3s ease;
}

.transaction-item {
    border-left: 4px solid #17a2b8;
    padding: 12px;
    margin-bottom: 10px;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.transaction-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.chart-placeholder {
    background: white;
    padding: 15px;
    border-radius: 8px;
    margin-top: 15px;
}

.chart-bar {
    background: #667eea;
    margin: 5px 0;
    padding: 8px;
    color: white;
    border-radius: 4px;
    transition: height 0.3s ease;
}
`;

// Inject the CSS
function injectEarningsCSS() {
    if (!document.getElementById('earnings-css')) {
        const style = document.createElement('style');
        style.id = 'earnings-css';
        style.textContent = earningsCSS;
        document.head.appendChild(style);
    }
}

// Update DOMContentLoaded to include CSS injection
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing application...');
    injectEarningsCSS(); // Add this line
    // ... rest of your existing DOMContentLoaded code
});

// Referral Earnings Calculation Functions
async function calculateReferralEarnings(userId) {
    try {
        console.log('💰 Calculating referral earnings for user:', userId);
        
        const user = await db.findUserById(userId);
        if (!user) return 0;

        let totalReferralEarnings = 0;

        // Calculate earnings from direct referrals
        if (user.referrals && user.referrals.length > 0) {
            const directReferralEarnings = await calculateDirectReferralEarnings(user);
            totalReferralEarnings += directReferralEarnings;
        }

        // Calculate earnings from referral bonuses
        const referralBonusEarnings = await calculateReferralBonusEarnings(userId);
        totalReferralEarnings += referralBonusEarnings;

        // Calculate earnings from referral transactions
        const referralTransactionEarnings = await calculateReferralTransactionEarnings(userId);
        totalReferralEarnings += referralTransactionEarnings;

        console.log('✅ Total referral earnings:', totalReferralEarnings);
        return totalReferralEarnings;
    } catch (error) {
        console.error('❌ Error calculating referral earnings:', error);
        return 0;
    }
}

async function calculateDirectReferralEarnings(user) {
    let earnings = 0;
    
    if (!user.referrals || user.referrals.length === 0) return 0;

    // Calculate earnings based on referral deposits
    for (const referral of user.referrals) {
        try {
            const referralUser = await db.findUserById(referral.id);
            if (referralUser && referralUser.transactions) {
                // Calculate 10% of referral's approved deposits
                const referralDeposits = referralUser.transactions.filter(t => 
                    t.type === 'deposit' && t.status === 'approved'
                );
                
                const totalReferralDeposits = referralDeposits.reduce((sum, transaction) => 
                    sum + (transaction.amount || 0), 0
                );
                
                // 10% commission on referral deposits
                const commission = totalReferralDeposits * 0.10;
                earnings += commission;
                
                console.log(`📊 Referral ${referral.username}: deposits=${totalReferralDeposits}, commission=${commission}`);
            }
        } catch (error) {
            console.error(`Error calculating earnings for referral ${referral.id}:`, error);
        }
    }

    return earnings;
}

async function calculateReferralBonusEarnings(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user || !user.transactions) return 0;

        // Sum all referral bonus transactions
        const referralBonuses = user.transactions.filter(transaction => 
            transaction.type === 'referral_bonus' && transaction.status === 'approved'
        );

        const totalBonus = referralBonuses.reduce((sum, transaction) => 
            sum + (transaction.amount || 0), 0
        );

        return totalBonus;
    } catch (error) {
        console.error('Error calculating referral bonus earnings:', error);
        return 0;
    }
}

async function calculateReferralTransactionEarnings(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user || !user.transactions) return 0;

        // Calculate earnings from referral-related transactions
        let earnings = 0;
        
        user.transactions.forEach(transaction => {
            if (transaction.status === 'approved') {
                // Check if transaction is related to referrals
                if (transaction.type === 'referral_commission' || 
                    transaction.type === 'referral_bonus' ||
                    (transaction.details && transaction.details.referralRelated)) {
                    earnings += transaction.amount || 0;
                }
            }
        });

        return earnings;
    } catch (error) {
        console.error('Error calculating referral transaction earnings:', error);
        return 0;
    }
}

// Update the calculateTotalEarnings function to include referral earnings
async function calculateTotalEarnings(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user) return 0;
        
        let totalEarnings = 0;
        
        // Earnings from investment returns
        if (user.investments && user.investments.length > 0) {
            user.investments.forEach(investment => {
                if (investment.status === 'active' || investment.status === 'completed') {
                    totalEarnings += investment.earnings || 0;
                }
            });
        }
        
        // Earnings from referral bonuses
        const referralEarnings = await calculateReferralEarnings(userId);
        totalEarnings += referralEarnings;
        
        return totalEarnings;
    } catch (error) {
        console.error('Error calculating total earnings:', error);
        return 0;
    }
}

// Add referral bonus awarding function
async function awardReferralBonus(referrerId, referredUserId, depositAmount) {
    try {
        console.log('🎁 Awarding referral bonus...', { referrerId, referredUserId, depositAmount });
        
        const referrer = await db.findUserById(referrerId);
        const referredUser = await db.findUserById(referredUserId);
        
        if (!referrer || !referredUser) {
            console.log('❌ Referrer or referred user not found');
            return false;
        }

        // Calculate bonus (10% of deposit)
        const bonusAmount = depositAmount * 0.10;
        
        // Create bonus transaction for referrer
        const bonusTransaction = {
            id: await db.getNextTransactionId(),
            userId: referrerId,
            username: referrer.username,
            type: 'referral_bonus',
            amount: bonusAmount,
            method: 'system',
            status: 'approved',
            date: new Date().toISOString(),
            details: {
                referredUser: referredUser.username,
                referredUserId: referredUserId,
                originalDeposit: depositAmount,
                bonusPercentage: '10%',
                description: `Referral bonus for ${referredUser.username}'s deposit`
            },
            adminActionDate: new Date().toISOString(),
            adminId: 'system'
        };

        // Add transaction to referrer
        const updatedTransactions = [...(referrer.transactions || []), bonusTransaction];
        await db.updateUser(referrerId, {
            transactions: updatedTransactions,
            balance: (referrer.balance || 0) + bonusAmount
        });

        console.log('✅ Referral bonus awarded:', bonusAmount);
        return true;
        
    } catch (error) {
        console.error('❌ Error awarding referral bonus:', error);
        return false;
    }
}

// Update the createTransaction function to handle referral bonuses
async function createTransactionWithReferralBonus(userId, type, amount, method, details = {}) {
    try {
        // Create the main transaction
        const transaction = await db.createTransaction(userId, type, amount, method, details);
        
        // If it's a deposit and user was referred by someone, award referral bonus
        if (type === 'deposit' && details.referredBy) {
            const user = await db.findUserById(userId);
            if (user && user.referred_by) {
                const referrer = await db.findUserByReferralCode(user.referred_by);
                if (referrer) {
                    // Award referral bonus to the referrer
                    await awardReferralBonus(referrer.id, userId, amount);
                }
            }
        }
        
        return transaction;
    } catch (error) {
        console.error('Error creating transaction with referral bonus:', error);
        throw error;
    }
}

// Enhanced referral system functions
async function getReferralStats(userId) {
    try {
        const user = await db.findUserById(userId);
        if (!user) return null;

        const stats = {
            totalReferrals: user.referrals ? user.referrals.length : 0,
            activeReferrals: 0,
            totalReferralEarnings: 0,
            pendingBonuses: 0,
            referralLevel: 'Beginner'
        };

        // Calculate active referrals and earnings
        if (user.referrals) {
            for (const referral of user.referrals) {
                const referralUser = await db.findUserById(referral.id);
                if (referralUser && referralUser.status === 'active') {
                    stats.activeReferrals++;
                }
            }
        }

        // Calculate total referral earnings
        stats.totalReferralEarnings = await calculateReferralEarnings(userId);

        // Determine referral level
        if (stats.totalReferrals >= 20) stats.referralLevel = 'Expert';
        else if (stats.totalReferrals >= 10) stats.referralLevel = 'Advanced';
        else if (stats.totalReferrals >= 5) stats.referralLevel = 'Intermediate';

        return stats;
    } catch (error) {
        console.error('Error getting referral stats:', error);
        return null;
    }
}

// Update the updateUserDashboard function to include referral stats
async function updateUserDashboard() {
    if (!db.currentUser) return;

    // Update user info
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const userBalanceElement = document.getElementById('user-balance');
    const userReferralCodeElement = document.getElementById('user-referral-code');
    
    if (userNameElement) userNameElement.textContent = db.currentUser.username;
    if (userEmailElement) userEmailElement.textContent = db.currentUser.email;
    if (userBalanceElement) userBalanceElement.textContent = db.formatCurrency(db.currentUser.balance);
    if (userReferralCodeElement) userReferralCodeElement.textContent = db.currentUser.referral_code;
    
    // Load referral stats
    await updateReferralStats();
    
    // Load all user data
    await loadUserReferrals();
    await updateEarningsSummary();
    await loadUserInvestments();
    await loadUserTransactions();
    
    console.log('✅ User dashboard updated successfully');
}

// Add referral stats update function
async function updateReferralStats() {
    if (!db.currentUser) return;

    try {
        const stats = await getReferralStats(db.currentUser.id);
        if (!stats) return;

        // Update referral stats elements
        const totalReferralsElement = document.getElementById('total-referrals');
        const activeReferralsElement = document.getElementById('active-referrals');
        const referralEarningsElement = document.getElementById('referral-earnings');
        const referralLevelElement = document.getElementById('referral-level');

        if (totalReferralsElement) totalReferralsElement.textContent = stats.totalReferrals;
        if (activeReferralsElement) activeReferralsElement.textContent = stats.activeReferrals;
        if (referralEarningsElement) referralEarningsElement.textContent = db.formatCurrency(stats.totalReferralEarnings);
        if (referralLevelElement) referralLevelElement.textContent = stats.referralLevel;

    } catch (error) {
        console.error('Error updating referral stats:', error);
    }
}

// Enhanced loadUserReferrals function with earnings
async function loadUserReferrals() {
    const referralsList = document.getElementById('user-referrals-list');
    if (!referralsList) return;

    if (!db.currentUser.referrals || db.currentUser.referrals.length === 0) {
        referralsList.innerHTML = `
            <div class="no-referrals">
                <h4>No Referrals Yet</h4>
                <p>Share your referral code to start earning commissions!</p>
                <div class="referral-code-section">
                    <strong>Your Referral Code:</strong>
                    <div class="referral-code-display">
                        <span id="user-referral-code">${db.currentUser.referral_code}</span>
                        <button onclick="copyReferralCode()" class="btn-copy">Copy</button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    for (const referral of db.currentUser.referrals) {
        try {
            const referralUser = await db.findUserById(referral.id);
            const referralEarnings = await calculateReferralEarningsForUser(db.currentUser.id, referral.id);
            
            html += `
                <div class="referral-item">
                    <div class="referral-header">
                        <div class="referral-name">${referral.username || 'N/A'}</div>
                        <div class="referral-date">${new Date(referral.join_date).toLocaleDateString()}</div>
                    </div>
                    <div class="referral-details">
                        <div><strong>Email:</strong> ${referral.email || 'N/A'}</div>
                        <div><strong>Status:</strong> <span style="color: #28a745;">Active</span></div>
                        <div><strong>Earned from referral:</strong> ${db.formatCurrency(referralEarnings)}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading referral:', referral.id, error);
        }
    }
    
    referralsList.innerHTML = html;
}

async function calculateReferralEarningsForUser(referrerId, referralId) {
    try {
        const referrer = await db.findUserById(referrerId);
        if (!referrer || !referrer.transactions) return 0;

        let earnings = 0;
        
        referrer.transactions.forEach(transaction => {
            if (transaction.type === 'referral_bonus' && 
                transaction.status === 'approved' &&
                transaction.details && 
                transaction.details.referredUserId == referralId) {
                earnings += transaction.amount || 0;
            }
        });

        return earnings;
    } catch (error) {
        console.error('Error calculating referral earnings for user:', error);
        return 0;
    }
}

// Update the signup function to handle referral tracking
async function signup() {
    // ... existing signup code ...

    try {
        // ... existing validation ...

        // Create new user
        const newUser = await db.registerUser({
            username: username,
            email: email,
            password: password,
            referred_by: referralCode // This tracks who referred them
        });

        console.log('✅ User created:', newUser.username);

        // Update referrer's referrals
        try {
            const updatedReferrer = await db.findUserByReferralCode(referralCode);
            if (updatedReferrer) {
                const updatedReferrals = [...(updatedReferrer.referrals || []), {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    join_date: newUser.join_date
                }];
                
                await db.updateUser(updatedReferrer.id, {
                    referrals: updatedReferrals
                });
                console.log('✅ Referrer updated:', updatedReferrer.username);
            }
        } catch (referralError) {
            console.log('⚠️ Could not update referrer referrals:', referralError.message);
        }

        // Show success message
        alert('✅ Account created successfully! Welcome to Tanzania Mining Investment.');
        
        // Show user dashboard
        showUserDashboard();
        
    } catch (error) {
        console.error('❌ Registration failed:', error);
        alert('❌ ' + (error.message || 'Registration failed. Please try again.'));
    }
}

// Add CSS for referral stats
const referralStatsCSS = `
.referral-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.stat-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
}

.stat-card h4 {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
}

.stat-card .value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
}

.referral-code-display {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0;
}

.referral-code-display span {
    background: #f8f9fa;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-weight: bold;
}

.btn-copy {
    background: #17a2b8;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
}

.btn-copy:hover {
    background: #138496;
}

.no-referrals {
    text-align: center;
    padding: 30px;
    background: #f8f9fa;
    border-radius: 8px;
}

.referral-tier {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
}

.tier-beginner { background: #e9ecef; color: #495057; }
.tier-intermediate { background: #d4edda; color: #155724; }
.tier-advanced { background: #cce7ff; color: #004085; }
.tier-expert { background: #fff3cd; color: #856404; }
`;

// Update the CSS injection function
function injectEarningsCSS() {
    if (!document.getElementById('earnings-css')) {
        const style = document.createElement('style');
        style.id = 'earnings-css';
        style.textContent = earningsCSS + referralStatsCSS; // Combine both CSS
        document.head.appendChild(style);
    }
}

// Referral Auto-Refresh Functions
let referralRefreshInterval = null;

function startReferralAutoRefresh() {
    console.log('🔄 Starting referral auto-refresh...');
    
    // Clear any existing interval
    if (referralRefreshInterval) {
        clearInterval(referralRefreshInterval);
    }
    
    // Load referrals immediately
    loadUserReferrals();
    
    // Set up auto-refresh every 30 seconds
    referralRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing referrals...');
        loadUserReferrals();
        updateReferralStats();
    }, 30000); // 30 seconds
    
    console.log('✅ Referral auto-refresh started');
}

function stopReferralAutoRefresh() {
    if (referralRefreshInterval) {
        clearInterval(referralRefreshInterval);
        referralRefreshInterval = null;
        console.log('🛑 Referral auto-refresh stopped');
    }
}

function updateReferralStats() {
    if (!db.currentUser) return;
    
    try {
        const user = db.currentUser;
        const totalReferrals = user.referrals ? user.referrals.length : 0;
        const activeReferrals = user.referrals ? user.referrals.filter(ref => ref.status !== 'inactive').length : 0;
        const referralEarnings = calculateReferralEarnings(user);
        
        // Update referral stats elements
        updateReferralStatsElements({
            totalReferrals,
            activeReferrals,
            referralEarnings
        });
        
    } catch (error) {
        console.error('❌ Error updating referral stats:', error);
    }
}

function calculateReferralEarnings(user) {
    if (!user || !user.referrals) return 0;
    
    let totalEarnings = 0;
    
    // Calculate earnings from referrals
    user.referrals.forEach(referral => {
        // Add referral bonus logic here
        // For example: 10% of referral's first deposit
        if (referral.bonus_earned) {
            totalEarnings += referral.bonus_earned;
        }
    });
    
    return totalEarnings;
}

function updateReferralStatsElements(stats) {
    // Update total referrals
    const totalReferralsElement = document.getElementById('total-referrals');
    if (totalReferralsElement) {
        totalReferralsElement.textContent = stats.totalReferrals;
    }
    
    // Update active referrals
    const activeReferralsElement = document.getElementById('active-referrals');
    if (activeReferralsElement) {
        activeReferralsElement.textContent = stats.activeReferrals;
    }
    
    // Update referral earnings
    const referralEarningsElement = document.getElementById('referral-earnings');
    if (referralEarningsElement) {
        referralEarningsElement.textContent = db.formatCurrency(stats.referralEarnings);
    }
    
    // Update referral progress
    updateReferralProgress(stats.totalReferrals);
}

function updateReferralProgress(totalReferrals) {
    const progressBar = document.getElementById('referral-progress-bar');
    const progressText = document.getElementById('referral-progress-text');
    
    if (!progressBar || !progressText) return;
    
    // Define referral milestones
    const milestones = [
        { count: 0, label: 'Beginner' },
        { count: 5, label: 'Starter' },
        { count: 10, label: 'Intermediate' },
        { count: 25, label: 'Advanced' },
        { count: 50, label: 'Expert' },
        { count: 100, label: 'Master' }
    ];
    
    // Find current and next milestone
    let currentMilestone = milestones[0];
    let nextMilestone = milestones[1];
    
    for (let i = milestones.length - 1; i >= 0; i--) {
        if (totalReferrals >= milestones[i].count) {
            currentMilestone = milestones[i];
            nextMilestone = milestones[i + 1] || milestones[milestones.length - 1];
            break;
        }
    }
    
    // Calculate progress percentage
    const progress = nextMilestone ? 
        Math.min(100, ((totalReferrals - currentMilestone.count) / (nextMilestone.count - currentMilestone.count)) * 100) : 
        100;
    
    // Update progress bar
    progressBar.style.width = `${progress}%`;
    
    // Update progress text
    if (nextMilestone) {
        progressText.textContent = `${currentMilestone.label} - ${totalReferrals}/${nextMilestone.count} referrals to ${nextMilestone.label}`;
    } else {
        progressText.textContent = `${currentMilestone.label} - Max Level Reached!`;
    }
}

// Enhanced loadUserReferrals function
async function loadUserReferrals() {
    const referralsList = document.getElementById('user-referrals-list');
    if (!referralsList) return;

    try {
        // Refresh user data to get latest referrals
        if (db.currentUser) {
            const updatedUser = await db.findUserById(db.currentUser.id);
            if (updatedUser) {
                db.currentUser.referrals = updatedUser.referrals;
            }
        }

        if (!db.currentUser.referrals || db.currentUser.referrals.length === 0) {
            referralsList.innerHTML = `
                <div class="no-referrals">
                    <h4>No Referrals Yet</h4>
                    <p>Share your referral code to start earning bonuses!</p>
                    <div class="referral-stats">
                        <div class="stat-item">
                            <span class="stat-number">0</span>
                            <span class="stat-label">Total Referrals</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">TZS 0</span>
                            <span class="stat-label">Referral Earnings</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        let activeCount = 0;
        
        db.currentUser.referrals.forEach((ref, index) => {
            const isActive = ref.status !== 'inactive';
            if (isActive) activeCount++;
            
            const joinDate = new Date(ref.join_date);
            const daysSinceJoin = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
            
            html += `
                <div class="referral-item ${isActive ? 'active' : 'inactive'}">
                    <div class="referral-header">
                        <div class="referral-name">
                            ${ref.username || 'Unknown User'}
                            ${isActive ? '<span class="status-badge active">Active</span>' : '<span class="status-badge inactive">Inactive</span>'}
                        </div>
                        <div class="referral-date">${joinDate.toLocaleDateString()}</div>
                    </div>
                    <div class="referral-details">
                        <div><strong>Email:</strong> ${ref.email || 'N/A'}</div>
                        <div><strong>Joined:</strong> ${daysSinceJoin} days ago</div>
                        <div><strong>Bonus Earned:</strong> ${db.formatCurrency(ref.bonus_earned || 0)}</div>
                    </div>
                    <div class="referral-actions">
                        <button onclick="sendReminder('${ref.email}')" class="btn-small">Send Reminder</button>
                    </div>
                </div>
            `;
        });

        // Add referral statistics
        const statsHtml = `
            <div class="referral-stats-summary">
                <h4>Referral Performance</h4>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${db.currentUser.referrals.length}</div>
                        <div class="stat-label">Total Referrals</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${activeCount}</div>
                        <div class="stat-label">Active Referrals</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${db.formatCurrency(calculateReferralEarnings(db.currentUser))}</div>
                        <div class="stat-label">Total Earnings</div>
                    </div>
                </div>
            </div>
        `;

        referralsList.innerHTML = statsHtml + html;
        
        // Update referral stats
        updateReferralStats();

    } catch (error) {
        console.error('❌ Error loading referrals:', error);
        referralsList.innerHTML = '<p>Error loading referrals. Please try again.</p>';
    }
}

// Update the showUserDashboard function
function showUserDashboard() {
    const authSection = document.getElementById('auth-section');
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const superAdminDashboard = document.getElementById('super-admin-dashboard');
    
    if (authSection) authSection.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'block';
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (superAdminDashboard) superAdminDashboard.style.display = 'none';
    
    updateUserDashboard();
    startReferralAutoRefresh(); // Start auto-refresh when dashboard is shown
}

// Update the logout function to stop auto-refresh
function logout() {
    stopReferralAutoRefresh(); // Stop auto-refresh when logging out
    db.logoutUser();
    showAuthSection();
}

// Update other dashboard functions to stop auto-refresh
function showAdminDashboard() {
    stopReferralAutoRefresh(); // Stop auto-refresh when switching to admin
    const authSection = document.getElementById('auth-section');
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const superAdminDashboard = document.getElementById('super-admin-dashboard');
    
    if (authSection) authSection.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
    if (superAdminDashboard) superAdminDashboard.style.display = 'none';
    
    updateAdminDashboard();
}

function showSuperAdminDashboard() {
    stopReferralAutoRefresh(); // Stop auto-refresh when switching to super admin
    const authSection = document.getElementById('auth-section');
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const superAdminDashboard = document.getElementById('super-admin-dashboard');
    
    if (authSection) authSection.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (superAdminDashboard) superAdminDashboard.style.display = 'block';
    
    updateSuperAdminDashboard();
}

// Add referral reminder function
function sendReminder(email) {
    if (confirm(`Send reminder email to ${email}?`)) {
        console.log('📧 Sending reminder to:', email);
        // Implement email sending logic here
        alert(`Reminder sent to ${email}!`);
    }
}



// Investment System
let investments = [];
let currentMineral = null;
let currentPrice = 0;
let profitIntervals = {};

// DOM Elements
const investmentModal = document.getElementById('investment-modal');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalBalance = document.getElementById('modal-balance');
const investmentGrams = document.getElementById('investment-grams');
const investmentDays = document.getElementById('investment-days');
const totalCost = document.getElementById('total-cost');
const dailyProfit = document.getElementById('daily-profit');
const insufficientFunds = document.getElementById('insufficient-funds');
const startInvestmentBtn = document.getElementById('start-investment-btn');
const investmentsContainer = document.getElementById('investments-container');

// ========== CORE CALCULATION FUNCTIONS ==========

// Get daily return rate based on day of week
function getDailyReturnRate(date) {
    const dayOfWeek = date.getDay();
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 0.04 : 0.03;
}

// Calculate profit for time period
function calculateProfitForPeriod(principal, startDate, endDate) {
    let currentAmount = principal;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
        const dailyRate = getDailyReturnRate(currentDate);
        const secondsInDay = 24 * 60 * 60;
        const perSecondRate = Math.pow(1 + dailyRate, 1 / secondsInDay) - 1;
        
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        const secondsToProcess = Math.min((end - currentDate) / 1000, (endOfDay - currentDate) / 1000);
        
        if (secondsToProcess > 0) {
            currentAmount = currentAmount * Math.pow(1 + perSecondRate, secondsToProcess);
        }
        
        currentDate = new Date(Math.min(endOfDay.getTime() + 1000, end.getTime()));
    }
    
    return currentAmount - principal;
}

// Calculate current profit
function calculateCurrentProfit(investment) {
    const now = new Date();
    const startDate = new Date(investment.startTime);
    return now >= startDate ? calculateProfitForPeriod(investment.cost, startDate, now) : 0;
}

// Calculate expected total profit at the end
function calculateExpectedTotalProfit(investment) {
    const startDate = new Date(investment.startTime);
    const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
    return calculateProfitForPeriod(investment.cost, startDate, endDate);
}

// ========== MODAL FUNCTIONS ==========

// Open investment modal
function openInvestmentModal(mineral, price) {
    if (!db.currentUser) {
        showNotification('Tafadhali ingia kwenye akaunti yako kwanza!', true);
        return;
    }
    
    currentMineral = mineral;
    currentPrice = price;
    
    modalTitle.textContent = `Wekeza kwenye ${mineral}`;
    modalPrice.textContent = `TZS ${price.toLocaleString()}/g`;
    modalBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    
    investmentGrams.value = '';
    investmentDays.value = '7';
    totalCost.textContent = 'TZS 0';
    dailyProfit.textContent = 'TZS 0';
    insufficientFunds.style.display = 'none';
    startInvestmentBtn.disabled = false;
    
    investmentModal.style.display = 'flex';
}

// Close modal
function closeInvestmentModal() {
    investmentModal.style.display = 'none';
}

// Calculate investment return - MOVED BEFORE IT'S USED
function calculateInvestmentReturn() {
    const grams = parseFloat(investmentGrams.value) || 0;
    const days = parseFloat(investmentDays.value) || 0;
    
    if (grams > 0 && days > 0) {
        const cost = grams * currentPrice;
        
        if (cost > db.currentUser.balance) {
            insufficientFunds.style.display = 'block';
            startInvestmentBtn.disabled = true;
        } else {
            insufficientFunds.style.display = 'none';
            startInvestmentBtn.disabled = false;
        }
        
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
        const totalReturn = cost + calculateProfitForPeriod(cost, startDate, endDate);
        const averageDailyProfit = (totalReturn - cost) / days;
        const totalProfit = totalReturn - cost;
        const profitPercentage = ((totalProfit / cost) * 100);
        
        totalCost.textContent = `TZS ${Math.round(cost).toLocaleString()}`;
        dailyProfit.textContent = `TZS ${Math.round(averageDailyProfit).toLocaleString()}/siku`;
        
        // Show expected profit information
        const expectedInfo = document.getElementById('expected-profit-info') || document.createElement('div');
        expectedInfo.id = 'expected-profit-info';
        expectedInfo.innerHTML = `
            <div class="expected-profit-breakdown">
                <h4>Makadirio ya Faida:</h4>
                <div class="expected-row">
                    <span>Faida Inayotarajiwa:</span>
                    <span>TZS ${Math.round(totalProfit).toLocaleString()} (${profitPercentage.toFixed(2)}%)</span>
                </div>
                <div class="expected-row">
                    <span>Jumla Inayotarajiwa:</span>
                    <span>TZS ${Math.round(totalReturn).toLocaleString()}</span>
                </div>
                <div class="expected-note">
                    <p><strong>Kumbuka:</strong> Faida yote na uwekezaji wako wa awali zitaongezwa kiotomatiki kwenye salio lako mwisho wa muda wa uwekezaji.</p>
                </div>
            </div>
        `;
        
        if (!document.getElementById('expected-profit-info')) {
            startInvestmentBtn.parentNode.insertBefore(expectedInfo, startInvestmentBtn);
        }
        
    } else {
        totalCost.textContent = 'TZS 0';
        dailyProfit.textContent = 'TZS 0';
        insufficientFunds.style.display = 'none';
        startInvestmentBtn.disabled = false;
        
        const expectedInfo = document.getElementById('expected-profit-info');
        if (expectedInfo) {
            expectedInfo.remove();
        }
    }
}

// Start investment
async function startInvestment() {
    if (!db.currentUser) {
        showNotification('Tafadhali ingia kwenye akaunti yako kwanza!', true);
        return;
    }
    
    const grams = parseFloat(investmentGrams.value);
    const days = parseFloat(investmentDays.value);
    
    if (!grams || grams <= 0) {
        showNotification('Tafadhali weka idadi halali ya gramu', true);
        return;
    }
    
    if (!days || days < 7) {
        showNotification('Tafadhali weka kipindi halali cha uwekezaji (angalau siku 7)', true);
        return;
    }
    
    const cost = grams * currentPrice;
    
    if (cost > db.currentUser.balance) {
        showNotification('Salio lako halitoshi kwa uwekezaji huu', true);
        return;
    }
    
    // Update user balance in Firestore
    db.currentUser.balance -= cost;
    await db.updateUser(db.currentUser.id, { balance: db.currentUser.balance });
    updateBalanceDisplays();
    
    const investment = {
        id: Date.now().toString(),
        userId: db.currentUser.id,
        mineral: currentMineral,
        grams: grams,
        days: days,
        startTime: new Date().toISOString(),
        cost: cost,
        completed: false
    };
    
    // Save investment to Firestore
    await db.db.collection('investments').doc(investment.id).set(investment);
    
    investments.push(investment);
    closeInvestmentModal();
    
    updateInvestmentsDisplay();
    updateInvestmentHistory();
    updateProfitBreakdown();
    
    showNotification('Uwekezaji umeanzishwa kikamilifu! Faida yote na uwekezaji wako zitaongezwa kiotomatiki mwisho wa muda.');
    startProfitCalculation(investment.id);
}

// ========== INVESTMENT MANAGEMENT FUNCTIONS ==========

// Get user investments from Firestore
async function getCurrentUserInvestments() {
    if (!db.currentUser) return [];
    
    try {
        const investmentsSnapshot = await db.db.collection('investments')
            .where('userId', '==', db.currentUser.id)
            .get();
        
        const userInvestments = [];
        investmentsSnapshot.forEach(doc => {
            userInvestments.push(doc.data());
        });
        return userInvestments;
    } catch (error) {
        console.error('Error getting investments from Firestore:', error);
        return [];
    }
}

// Save investment to Firestore
async function saveInvestmentToFirestore(investment) {
    try {
        await db.db.collection('investments').doc(investment.id).set(investment);
    } catch (error) {
        console.error('Error saving investment to Firestore:', error);
    }
}

// Delete investment from Firestore
async function deleteInvestmentFromFirestore(investmentId) {
    try {
        await db.db.collection('investments').doc(investmentId).delete();
    } catch (error) {
        console.error('Error deleting investment from Firestore:', error);
    }
}

// Delete investment - FOR ACTIVE INVESTMENTS ONLY
async function deleteInvestment(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment) return;
    
    if (investment.completed) {
        // For completed investments, just remove the record
        if (confirm("Unahakika unataka kufuta rekodi ya uwekezaji huu uliokamilika?")) {
            investments = investments.filter(inv => inv.id !== investmentId);
            await deleteInvestmentFromFirestore(investmentId);
            
            updateInvestmentsDisplay();
            updateInvestmentHistory();
            updateProfitBreakdown();
            
            showNotification('Rekodi ya uwekezaji imefutwa kikamilifu!');
        }
    } else {
        // For active investments, refund money
        if (confirm("Unahakika unataka kufuta uwekezaji huu? Uwekezaji wako wa awali na faida yote itaongezwa kwenye balansi yako.")) {
            const currentProfit = calculateCurrentProfit(investment);
            const totalAmountToRefund = investment.cost + currentProfit;
            
            if (profitIntervals[investmentId]) {
                clearInterval(profitIntervals[investmentId]);
                delete profitIntervals[investmentId];
            }
            
            db.currentUser.balance += totalAmountToRefund;
            await db.updateUser(db.currentUser.id, { balance: db.currentUser.balance });
            updateBalanceDisplays();
            
            investments = investments.filter(inv => inv.id !== investmentId);
            await deleteInvestmentFromFirestore(investmentId);
            
            updateInvestmentsDisplay();
            updateInvestmentHistory();
            updateProfitBreakdown();
            
            showNotification(`Uwekezaji umefutwa kikamilifu! TZS ${Math.round(totalAmountToRefund).toLocaleString()} zimeongezwa kwenye akaunti yako.`);
        }
    }
}

// Delete completed investment record only - NO MONEY TRANSACTION
async function deleteCompletedInvestment(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment || !investment.completed) return;
    
    if (confirm("Unahakika unataka kufuta rekodi ya uwekezaji huu uliokamilika? Hii itaondoa rekodi tu, hakuna fedha zitatoka kwenye akaunti yako.")) {
        investments = investments.filter(inv => inv.id !== investmentId);
        await deleteInvestmentFromFirestore(investmentId);
        
        updateInvestmentsDisplay();
        updateInvestmentHistory();
        updateProfitBreakdown();
        
        showNotification('Rekodi ya uwekezaji imefutwa kikamilifu!');
    }
}

// Complete investment automatically when end date is reached
async function completeInvestment(investment) {
    if (investment.completed) return;
    
    const now = new Date();
    const startDate = new Date(investment.startTime);
    const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
    
    if (now >= endDate) {
        investment.completed = true;
        investment.completionDate = new Date().toISOString();
        
        // Calculate total expected profit (not current profit)
        const totalProfit = calculateExpectedTotalProfit(investment);
        investment.finalProfit = totalProfit;
        
        // Add both original investment and total expected profit to user balance
        const totalAmount = investment.cost + totalProfit;
        db.currentUser.balance += totalAmount;
        await db.updateUser(db.currentUser.id, { balance: db.currentUser.balance });
        
        // Stop profit calculation for this investment
        if (profitIntervals[investment.id]) {
            clearInterval(profitIntervals[investment.id]);
            delete profitIntervals[investment.id];
        }
        
        // Update investment in Firestore
        await saveInvestmentToFirestore(investment);
        
        updateBalanceDisplays();
        updateInvestmentsDisplay();
        updateInvestmentHistory();
        updateProfitBreakdown();
        
        showNotification(`Uwekezaji wako wa ${investment.mineral} umekamilika! TZS ${Math.round(totalAmount).toLocaleString()} zimeongezwa kwenye salio lako.`);
    }
}

// ========== DISPLAY FUNCTIONS ==========

// Format date
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Update investments display
function updateInvestmentsDisplay() {
    if (!investmentsContainer) return;
    
    investmentsContainer.innerHTML = '';
    
    if (investments.length === 0) {
        investmentsContainer.innerHTML = '<p>Huna uwekezaji wowote unaoendelea.</p>';
        return;
    }
    
    investments.forEach(investment => {
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        const now = new Date();
        const totalTime = investment.days * 24 * 60 * 60 * 1000;
        const elapsedTime = now - startDate;
        const progress = Math.min(100, (elapsedTime / totalTime) * 100);
        const remainingTime = Math.max(0, endDate - now);
        const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
        
        // Calculate current profit for display only
        const currentProfit = calculateCurrentProfit(investment);
        const expectedTotalProfit = calculateExpectedTotalProfit(investment);
        const currentProfitPercentage = ((currentProfit / investment.cost) * 100);
        const expectedProfitPercentage = ((expectedTotalProfit / investment.cost) * 100);
        
        const investmentCard = document.createElement('div');
        investmentCard.className = 'investment-card';
        
        if (investment.completed) {
            investmentCard.innerHTML = `
                <div class="investment-header">
                    <div class="investment-mineral">${investment.mineral}</div>
                    <div class="investment-amount">${investment.grams} gramu</div>
                </div>
                <div class="investment-details">
                    <div class="investment-duration">
                        <span>Hali:</span>
                        <span class="status-completed">UMEMALIZIKA</span>
                    </div>
                    <div class="investment-duration">
                        <span>Uwekezaji wa Awali:</span>
                        <span>TZS ${Math.round(investment.cost).toLocaleString()}</span>
                    </div>
                    <div class="investment-profit-percentage">
                        <span>Faida ya Mwisho:</span>
                        <span class="percentage positive">
                            TZS ${Math.round(investment.finalProfit || 0).toLocaleString()}
                        </span>
                    </div>
                    <div class="investment-total-return">
                        <span>Jumla ya Mapato:</span>
                        <span class="total-return">TZS ${Math.round((investment.finalProfit || 0) + investment.cost).toLocaleString()}</span>
                    </div>
                    <div class="investment-completion-date">
                        <span>Tarehe ya Kukamilika:</span>
                        <span>${formatDate(new Date(investment.completionDate))}</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: 100%; background: #27ae60;"></div>
                </div>
                <div class="profit-display">
                    <div>Uwekezaji Umekamilika</div>
                    <div class="current-profit" style="color: #27ae60;">TZS ${Math.round((investment.finalProfit || 0) + investment.cost).toLocaleString()}</div>
                    <div class="countdown">Zimeongezwa kwenye salio lako</div>
                </div>
                <div class="investment-actions">
                    <button class="delete-btn" onclick="deleteCompletedInvestment('${investment.id}')">
                        Futa Rekodi
                    </button>
                </div>
                <div class="investment-note-completed">
                    <p><strong>Kumbuka:</strong> Uwekezaji wako umekamilika na fedha zote zimeongezwa kwenye salio lako. "Futa Rekodi" itaondoa rekodi tu, hakuna fedha zitatoka.</p>
                </div>
            `;
        } else {
            investmentCard.innerHTML = `
                <div class="investment-header">
                    <div class="investment-mineral">${investment.mineral}</div>
                    <div class="investment-amount">${investment.grams} gramu</div>
                </div>
                <div class="investment-details">
                    <div class="investment-duration">
                        <span>Muda wa Uwekezaji:</span>
                        <span>${investment.days} siku</span>
                    </div>
                    <div class="investment-rate">
                        <span>Kiwango cha Faida:</span>
                        <span>Jumatatu-Ijumaa: 3%, Jumamosi/Jumapili: 4%</span>
                    </div>
                    <div class="investment-duration">
                        <span>Uwekezaji wa Awali:</span>
                        <span>TZS ${Math.round(investment.cost).toLocaleString()}</span>
                    </div>
                    <div class="investment-profit-percentage">
                        <span>Faida ya Sasa:</span>
                        <span class="percentage ${currentProfit >= 0 ? 'positive' : 'negative'}">
                            TZS ${Math.round(currentProfit).toLocaleString()} (${currentProfitPercentage.toFixed(2)}%)
                        </span>
                    </div>
                    <div class="investment-expected-profit">
                        <span>Faida Inayotarajiwa Mwishoni:</span>
                        <span class="expected-profit">TZS ${Math.round(expectedTotalProfit).toLocaleString()} (${expectedProfitPercentage.toFixed(2)}%)</span>
                    </div>
                    <div class="investment-total-expected">
                        <span>Jumla Inayotarajiwa Mwishoni:</span>
                        <span class="total-expected">TZS ${Math.round(expectedTotalProfit + investment.cost).toLocaleString()}</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%;"></div>
                </div>
                <div class="profit-display">
                    <div>Faida Inakua Kilasiku</div>
                    <div class="current-profit">TZS ${Math.round(currentProfit).toLocaleString()}</div>
                    <div class="countdown">Siku ${remainingDays} zimebaki</div>
                </div>
                <div class="investment-actions">
                    <button class="delete-btn" onclick="deleteInvestment('${investment.id}')">
                        Futa Uwekezaji & Pokea Fedha
                    </button>
                </div>
                <div class="investment-note">
                    <p><strong>Kumbuka:</strong> Faida yote na uwekezaji wako wa awali zitaongezwa kiotomatiki kwenye salio lako mwisho wa muda wa uwekezaji.</p>
                </div>
            `;
        }
        
        investmentsContainer.appendChild(investmentCard);
    });
}

// Update investment history
function updateInvestmentHistory() {
    const investmentHistory = document.getElementById('investment-history');
    if (!investmentHistory) return;
    
    investmentHistory.innerHTML = '';
    
    if (investments.length === 0) {
        investmentHistory.innerHTML = '<p>Hakuna historia ya uwekezaji.</p>';
        return;
    }
    
    const sortedInvestments = [...investments].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    sortedInvestments.forEach(investment => {
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        const currentProfit = investment.completed ? (investment.finalProfit || 0) : calculateCurrentProfit(investment);
        const expectedTotalProfit = calculateExpectedTotalProfit(investment);
        const currentProfitPercentage = ((currentProfit / investment.cost) * 100);
        const expectedProfitPercentage = ((expectedTotalProfit / investment.cost) * 100);
        
        const historyCard = document.createElement('div');
        historyCard.className = `history-card ${investment.completed ? 'completed' : 'active'}`;
        
        historyCard.innerHTML = `
            <div class="history-header">
                <div class="history-mineral">${investment.mineral}</div>
                <div class="history-status ${investment.completed ? 'status-completed' : 'status-active'}">
                    ${investment.completed ? 'IMEMALIZIKA' : 'INAENDELEA'}
                </div>
            </div>
            <div class="history-details">
                <div class="history-amount">
                    <span>Kiasi:</span>
                    <span>${investment.grams}g (TZS ${Math.round(investment.cost).toLocaleString()})</span>
                </div>
                <div class="history-dates">
                    <div class="history-date">
                        <span>Tarehe ya Kuanza:</span>
                        <span>${formatDate(startDate)}</span>
                    </div>
                    <div class="history-date">
                        <span>Tarehe ya Kumaliza:</span>
                        <span>${formatDate(endDate)}</span>
                    </div>
                </div>
                <div class="history-duration">
                    <span>Muda:</span>
                    <span>${investment.days} siku</span>
                </div>
                ${investment.completed ? `
                <div class="history-profit">
                    <span>Faida ya Mwisho:</span>
                    <span class="profit-amount">TZS ${Math.round(investment.finalProfit || 0).toLocaleString()} (${expectedProfitPercentage.toFixed(2)}%)</span>
                </div>
                <div class="history-total-return">
                    <span>Jumla ya Mapato:</span>
                    <span class="total-return">TZS ${Math.round((investment.finalProfit || 0) + investment.cost).toLocaleString()}</span>
                </div>
                <div class="history-completion-date">
                    <span>Tarehe ya Kukamilika:</span>
                    <span>${formatDate(new Date(investment.completionDate))}</span>
                </div>
                ` : `
                <div class="history-current-profit">
                    <span>Faida ya Sasa:</span>
                    <span class="current-profit">TZS ${Math.round(currentProfit).toLocaleString()} (${currentProfitPercentage.toFixed(2)}%)</span>
                </div>
                <div class="history-expected-profit">
                    <span>Faida Inayotarajiwa Mwishoni:</span>
                    <span class="expected-profit">TZS ${Math.round(expectedTotalProfit).toLocaleString()} (${expectedProfitPercentage.toFixed(2)}%)</span>
                </div>
                <div class="history-total-expected">
                    <span>Jumla Inayotarajiwa Mwishoni:</span>
                    <span class="total-expected">TZS ${Math.round(expectedTotalProfit + investment.cost).toLocaleString()}</span>
                </div>
                `}
            </div>
            <div class="history-actions">
                ${!investment.completed ? `
                <button class="delete-btn" onclick="deleteInvestment('${investment.id}')">Futa Uwekezaji & Pokea Fedha</button>
                ` : `
                <button class="delete-btn" onclick="deleteCompletedInvestment('${investment.id}')">Futa Rekodi</button>
                `}
            </div>
        `;
        
        investmentHistory.appendChild(historyCard);
    });
}

// Update profit breakdown
function updateProfitBreakdown() {
    const profitBreakdown = document.getElementById('profit-breakdown');
    if (!profitBreakdown) return;
    
    let totalInvested = 0;
    let totalCurrentProfit = 0;
    let totalExpectedProfit = 0;
    let totalCompletedProfit = 0;
    let totalCompletedInvestment = 0;
    
    investments.forEach(investment => {
        totalInvested += investment.cost;
        if (investment.completed) {
            totalCompletedProfit += investment.finalProfit || 0;
            totalCompletedInvestment += investment.cost;
        } else {
            totalCurrentProfit += calculateCurrentProfit(investment);
            totalExpectedProfit += calculateExpectedTotalProfit(investment);
        }
    });
    
    const totalActiveExpected = totalInvested - totalCompletedInvestment + totalExpectedProfit;
    const totalCompletedAmount = totalCompletedInvestment + totalCompletedProfit;
    const overallProfitPercentage = totalInvested > 0 ? ((totalCurrentProfit + totalCompletedProfit) / totalInvested) * 100 : 0;
    
    profitBreakdown.innerHTML = `
        <div class="profit-summary">
            <div class="profit-card">
                <h4>Jumla ya Uwekezaji</h4>
                <div class="profit-amount">TZS ${Math.round(totalInvested).toLocaleString()}</div>
            </div>
            <div class="profit-card">
                <h4>Faida ya Sasa</h4>
                <div class="profit-amount current">TZS ${Math.round(totalCurrentProfit).toLocaleString()}</div>
            </div>
            <div class="profit-card">
                <h4>Faida Inayotarajiwa</h4>
                <div class="profit-amount expected">TZS ${Math.round(totalExpectedProfit).toLocaleString()}</div>
            </div>
            <div class="profit-card">
                <h4>Jumla Inayotarajiwa</h4>
                <div class="profit-amount total">TZS ${Math.round(totalActiveExpected + totalCompletedAmount).toLocaleString()}</div>
            </div>
        </div>
        <div class="percentage-breakdown">
            <h4>Asilimia ya Mafanikio ya Uwekezaji</h4>
            <div class="percentage-bar">
                <div class="percentage-fill" style="width: ${Math.min(100, overallProfitPercentage)}%"></div>
            </div>
            <div class="percentage-text">${overallProfitPercentage.toFixed(2)}% ya Faida (Jumla)</div>
        </div>
        <div class="profit-explanation">
            <h4>Maelezo ya Mfumo:</h4>
            <ul>
                <li><strong>Faida ya Sasa:</strong> Faida iliyokusanyika hadi sasa</li>
                <li><strong>Faida Inayotarajiwa:</strong> Faida inayotarajiwa kufikiwa mwisho wa uwekezaji</li>
                <li><strong>Jumla Inayotarajiwa:</strong> Uwekezaji wako wa awali + faida inayotarajiwa</li>
                <li><strong>Kumbuka:</strong> Faida yote na uwekezaji wako zitaongezwa kiotomatiki kwenye salio lako mwisho wa muda wa uwekezaji</li>
            </ul>
        </div>
    `;
}

// ========== SYSTEM FUNCTIONS ==========

// Start profit calculation
function startProfitCalculation(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment) return;
    
    profitIntervals[investmentId] = setInterval(() => {
        const now = new Date();
        const startDate = new Date(investment.startTime);
        const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
        
        // Check if investment period has ended
        if (now >= endDate) {
            completeInvestment(investment);
        } else {
            updateInvestmentsDisplay();
            updateInvestmentHistory();
            updateProfitBreakdown();
        }
    }, 1000);
}

// Update balance displays
function updateBalanceDisplays() {
    const profileBalance = document.getElementById('profile-balance');
    const profileBalanceDisplay = document.getElementById('profile-balance-display');
    const dashboardBalance = document.getElementById('dashboard-balance');
    const withdrawBalance = document.getElementById('withdraw-balance');
    
    if (profileBalance) profileBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (profileBalanceDisplay) profileBalanceDisplay.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (dashboardBalance) dashboardBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (withdrawBalance) withdrawBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    
    if (investmentModal && investmentModal.style.display === 'flex') {
        modalBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    }
}

// Show notification
function showNotification(message, isError = false) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            display: none;
            max-width: 300px;
            text-align: center;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Initialize investment system
async function initInvestmentSystem() {
    investments = await getCurrentUserInvestments();
    
    // Clear any existing intervals
    Object.values(profitIntervals).forEach(interval => clearInterval(interval));
    profitIntervals = {};
    
    // Check for completed investments and complete them
    investments.forEach(investment => {
        if (!investment.completed) {
            const now = new Date();
            const startDate = new Date(investment.startTime);
            const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
            
            if (now >= endDate) {
                completeInvestment(investment);
            } else {
                startProfitCalculation(investment.id);
            }
        }
    });
    
    updateBalanceDisplays();
    updateInvestmentsDisplay();
    updateInvestmentHistory();
    updateProfitBreakdown();
}

// Clear all intervals when user logs out
function clearInvestmentIntervals() {
    Object.values(profitIntervals).forEach(interval => clearInterval(interval));
    profitIntervals = {};
}

// ========== INITIALIZATION ==========

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for modal
    if (investmentGrams) {
        investmentGrams.addEventListener('input', calculateInvestmentReturn);
    }
    if (investmentDays) {
        investmentDays.addEventListener('input', calculateInvestmentReturn);
    }
    
    // Add event listeners for modal close
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeInvestmentModal);
    }
    
    // Close modal when clicking outside
    if (investmentModal) {
        investmentModal.addEventListener('click', function(e) {
            if (e.target === investmentModal) {
                closeInvestmentModal();
            }
        });
    }
});

// Export functions for global access
window.openInvestmentModal = openInvestmentModal;
window.closeInvestmentModal = closeInvestmentModal;
window.startInvestment = startInvestment;
window.calculateInvestmentReturn = calculateInvestmentReturn;
window.deleteInvestment = deleteInvestment;
window.deleteCompletedInvestment = deleteCompletedInvestment;
window.initInvestmentSystem = initInvestmentSystem;
window.clearInvestmentIntervals = clearInvestmentIntervals;

// User Management Functions - Enhanced Version
async function loadAdminUsers() {
    const users = await db.getUsers();
    const tableBody = document.getElementById('users-table-body');
    const searchTerm = document.getElementById('user-search') ? document.getElementById('user-search').value.toLowerCase() : '';
    
    // Auto-create table if it doesn't exist
    if (!tableBody) {
        createUsersTable();
        return;
    }
    
    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.referral_code && user.referral_code.toLowerCase().includes(searchTerm))
    );
    
    tableBody.innerHTML = '';
    
    let activeCount = 0;
    let inactiveCount = 0;
    let todaySignups = 0;
    const today = new Date().toDateString();
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Count stats
        if (user.status === 'active') activeCount++;
        else inactiveCount++;
        
        const userDate = new Date(user.join_date).toDateString();
        if (userDate === today) todaySignups++;
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>
                <span class="status-${user.status}">${user.status.toUpperCase()}</span>
            </td>
            <td>
                <span class="password-field">${user.password}</span>
                ${!user.is_admin ? `<button class="btn-action btn-view" onclick="resetPassword('${user.id}')">Reset</button>` : ''}
            </td>
            <td>${user.referral_code || 'N/A'}</td>
            <td>${db.formatCurrency(user.balance)}</td>
            <td>${new Date(user.join_date).toLocaleDateString()}</td>
            <td>
                <button class="btn-action btn-view" onclick="viewUserDetails('${user.id}')">View</button>
                <button class="btn-action btn-edit" onclick="editUser('${user.id}')">Edit</button>
                ${user.status === 'active' && !user.is_admin ? 
                    `<button class="btn-action btn-deactivate" onclick="toggleUserStatus('${user.id}', 'inactive')">Deactivate</button>` :
                    `<button class="btn-action btn-activate" onclick="toggleUserStatus('${user.id}', 'active')">Activate</button>`
                }
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update stats automatically
    updateUserStats(users.length, activeCount, inactiveCount, todaySignups);
}

// Auto-create users table if it doesn't exist
function createUsersTable() {
    const adminPanel = document.querySelector('.admin-panel') || document.getElementById('admin-panel');
    if (!adminPanel) {
        createAdminPanel();
        return;
    }
    
    const userManagementHTML = `
        <div class="user-management">
            <div class="management-header">
                <h2>User Management</h2>
                <div class="user-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="total-users-count">0</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="active-users-count">0</div>
                        <div class="stat-label">Active Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="inactive-users-count">0</div>
                        <div class="stat-label">Inactive Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="today-signups-count">0</div>
                        <div class="stat-label">Today's Signups</div>
                    </div>
                </div>
            </div>
            
            <div class="search-box">
                <input type="text" id="user-search" placeholder="Search users by username, email, or referral code..." onkeyup="loadAdminUsers()">
            </div>
            
            <div class="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Password</th>
                            <th>Referral Code</th>
                            <th>Balance</th>
                            <th>Join Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        <!-- Users will be loaded here automatically -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- User Details Modal -->
        <div id="user-details-modal" class="user-details-modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal" onclick="closeUserDetails()">&times;</span>
                <div id="user-details-content"></div>
            </div>
        </div>
        
        <!-- Edit User Modal -->
        <div id="edit-user-modal" class="user-details-modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal" onclick="closeEditUser()">&times;</span>
                <div id="edit-user-content"></div>
            </div>
        </div>
    `;
    
    adminPanel.innerHTML = userManagementHTML;
    
    // Load users immediately after creating table
    setTimeout(() => loadAdminUsers(), 100);
}

// Auto-create admin panel if it doesn't exist
function createAdminPanel() {
    const mainContent = document.querySelector('.dashboard-content') || document.querySelector('.content-section.active');
    if (!mainContent) {
        return;
    }
    
    const adminPanelHTML = `
        <div class="admin-panel" id="admin-panel">
            <div class="admin-header">
                <h2><i class="fas fa-crown"></i> Admin Panel</h2>
                <div class="admin-nav">
                    <button class="admin-nav-btn active" onclick="showAdminSection('users')">User Management</button>
                    <button class="admin-nav-btn" onclick="showAdminSection('investments')">Investments</button>
                    <button class="admin-nav-btn" onclick="showAdminSection('transactions')">Transactions</button>
                </div>
            </div>
            <div class="admin-content" id="admin-content">
                <!-- User management will be loaded here automatically -->
            </div>
        </div>
    `;
    
    mainContent.innerHTML = adminPanelHTML;
    
    // Create users table after admin panel is created
    setTimeout(() => createUsersTable(), 100);
}

// Auto-update user statistics
function updateUserStats(total, active, inactive, today) {
    const elements = {
        'total-users-count': total,
        'active-users-count': active,
        'inactive-users-count': inactive,
        'today-signups-count': today
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// Enhanced viewUserDetails with auto-investment loading
async function viewUserDetails(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('user-details-content');
    if (!modalContent) {
        return;
    }
    
    // Auto-load user investments from Firestore
    const userInvestments = await getUserInvestmentsForAdmin(user.id);
    const investmentStats = calculateUserInvestmentStats(user, userInvestments);
    
    modalContent.innerHTML = `
        <div class="user-info">
            <h4>Basic Information</h4>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> <span class="password-field">${user.password}</span></p>
            <p><strong>Status:</strong> <span class="status-${user.status}">${user.status.toUpperCase()}</span></p>
            <p><strong>Referral Code:</strong> ${user.referral_code || 'N/A'}</p>
            <p><strong>Referred By:</strong> ${user.referred_by || 'None'}</p>
            <p><strong>Join Date:</strong> ${new Date(user.join_date).toLocaleString()}</p>
            <p><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</p>
            <p><strong>Admin User:</strong> ${user.is_admin ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="admin-investment-section">
            <h4>Investment Portfolio (Auto-loaded)</h4>
            
            <div class="investment-summary">
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalInvested)}</div>
                    <div class="summary-label">Total Invested</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${investmentStats.activeInvestments}</div>
                    <div class="summary-label">Active Plans</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalProfit)}</div>
                    <div class="summary-label">Total Profit</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.availableProfit)}</div>
                    <div class="summary-label">Available Profit</div>
                </div>
            </div>

            <div class="quick-stats">
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.completedInvestments}</div>
                    <div class="quick-stat-label">Completed</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.pendingInvestments}</div>
                    <div class="quick-stat-label">Pending</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalReferrals}</div>
                    <div class="quick-stat-label">Referrals</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalTransactions}</div>
                    <div class="quick-stat-label">Transactions</div>
                </div>
            </div>
            
            ${userInvestments.length > 0 ? `
                <table class="admin-investment-table">
                    <thead>
                        <tr>
                            <th>Mineral</th>
                            <th>Grams</th>
                            <th>Amount</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Progress</th>
                            <th>Current Profit</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userInvestments.map((investment, index) => {
                            const profit = calculateCurrentProfit(investment);
                            const progress = calculateInvestmentProgress(investment);
                            const daysRemaining = getDaysRemaining(investment);
                            const totalValue = investment.cost + profit;
                            const profitPercentage = ((profit / investment.cost) * 100);
                            
                            return `
                                <tr>
                                    <td><strong>${investment.mineral}</strong></td>
                                    <td>${investment.grams}g</td>
                                    <td>${db.formatCurrency(investment.cost)}</td>
                                    <td>${new Date(investment.startTime).toLocaleDateString()}</td>
                                    <td>${new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                    <td class="progress-cell">
                                        <div class="progress-bar-container">
                                            <div class="progress-bar-fill" style="width: ${progress}%"></div>
                                        </div>
                                        <div class="progress-text">${progress}% (${daysRemaining}d left)</div>
                                    </td>
                                    <td>
                                        <div>${db.formatCurrency(profit)}</div>
                                        <div style="font-size: 11px; color: ${profitPercentage >= 0 ? '#27ae60' : '#e74c3c'}">
                                            ${profitPercentage.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td>
                                        <span class="investment-status-badge status-${investment.completed ? 'completed' : 'active'}">
                                            ${investment.completed ? 'COMPLETED' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="investment-actions-admin">
                                            ${!investment.completed ? `
                                                <button class="btn-admin-action btn-complete" onclick="adminCompleteInvestment('${user.id}', '${investment.id}')">Complete</button>
                                                <button class="btn-admin-action btn-cancel" onclick="adminCancelInvestment('${user.id}', '${investment.id}')">Cancel</button>
                                            ` : ''}
                                            <button class="btn-admin-action btn-view" onclick="adminViewInvestmentDetails('${user.id}', '${investment.id}')">View</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="no-investments-admin">
                    <div style="font-size: 48px; margin-bottom: 10px;">💼</div>
                    <h4>No Investments Found</h4>
                    <p>This user hasn't started any investments yet</p>
                </div>
            `}
        </div>
        
        <div class="user-operations">
            <h4>User Operations (Auto-loaded)</h4>
            
            <div class="operation-section">
                <h5>Referrals (${user.referrals ? user.referrals.length : 0})</h5>
                ${user.referrals && user.referrals.length > 0 ? 
                    user.referrals.map(ref => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Username:</strong> ${ref.username}</p>
                            <p><strong>Email:</strong> ${ref.email}</p>
                            <p><strong>Join Date:</strong> ${new Date(ref.join_date).toLocaleString()}</p>
                        </div>
                    `).join('') : 
                    '<p>No referrals</p>'
                }
            </div>
            
            <div class="operation-section">
                <h5>Transactions (${user.transactions ? user.transactions.length : 0})</h5>
                ${user.transactions && user.transactions.length > 0 ? 
                    user.transactions.map(trans => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Type:</strong> ${trans.type}</p>
                            <p><strong>Amount:</strong> ${db.formatCurrency(trans.amount)}</p>
                            <p><strong>Date:</strong> ${new Date(trans.date).toLocaleString()}</p>
                            <p><strong>Description:</strong> ${trans.description || 'N/A'}</p>
                        </div>
                    `).join('') : 
                    '<p>No transactions</p>'
                }
            </div>
        </div>
    `;
    
    document.getElementById('user-details-modal').style.display = 'block';
}

// Auto-initialize user management
function autoInitializeUserManagement() {
    // Check if admin panel button exists and add auto-load
    const adminBtn = document.getElementById('admin-panel-section');
    if (adminBtn) {
        adminBtn.addEventListener('click', function() {
            setTimeout(() => {
                loadAdminUsers();
            }, 1000);
        });
    }
    
    // Auto-load users if we're already in admin panel
    if (window.location.hash === '#admin' || document.querySelector('.admin-panel')) {
        setTimeout(() => {
            loadAdminUsers();
        }, 500);
    }
    
    // Auto-refresh users every 30 seconds when in admin panel
    setInterval(() => {
        if (document.querySelector('.admin-panel') && document.querySelector('.admin-panel').style.display !== 'none') {
            loadAdminUsers();
        }
    }, 30000);
}

// Enhanced editUser with auto-form population
async function editUser(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('edit-user-content');
    if (!modalContent) {
        return;
    }
    
    modalContent.innerHTML = `
        <div class="edit-form">
            <h3>Edit User: ${user.username}</h3>
            <div class="form-group">
                <label for="edit-username">Username:</label>
                <input type="text" id="edit-username" value="${user.username}">
            </div>
            
            <div class="form-group">
                <label for="edit-email">Email:</label>
                <input type="email" id="edit-email" value="${user.email}">
            </div>
            
            <div class="form-group">
                <label for="edit-password">Password:</label>
                <input type="text" id="edit-password" value="${user.password}">
            </div>
            
            <div class="form-group">
                <label for="edit-status">Status:</label>
                <select id="edit-status">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="edit-balance">Balance (TZS):</label>
                <input type="number" id="edit-balance" value="${user.balance}">
            </div>
            
            <div class="form-group">
                <label for="edit-referral-code">Referral Code:</label>
                <input type="text" id="edit-referral-code" value="${user.referral_code || ''}">
            </div>
            
            <div class="form-actions">
                <button class="btn-action btn-activate" onclick="saveUserChanges('${user.id}')">Save Changes</button>
                <button class="btn-action btn-deactivate" onclick="closeEditUser()">Cancel</button>
            </div>
        </div>
    `;
    
    document.getElementById('edit-user-modal').style.display = 'block';
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(autoInitializeUserManagement, 2000);
});

// Auto-refresh when coming back to the page
window.addEventListener('focus', function() {
    if (document.querySelector('.admin-panel') && document.querySelector('.admin-panel').style.display !== 'none') {
        loadAdminUsers();
    }
});

async function saveUserChanges(userId) {
    const users = await db.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        alert('User not found');
        return;
    }
    
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;
    const password = document.getElementById('edit-password').value;
    const status = document.getElementById('edit-status').value;
    const balance = parseFloat(document.getElementById('edit-balance').value);
    const referralCode = document.getElementById('edit-referral-code').value;
    
    // Validate inputs
    if (!username || !email || !password || !referralCode) {
        alert('Please fill all fields');
        return;
    }
    
    // Check if username or email already exists (excluding current user)
    const existingUser = users.find(u => 
        (u.username === username || u.email === email) && u.id !== userId
    );
    
    if (existingUser) {
        alert('Username or email already exists');
        return;
    }
    
    // Update user in Firestore
    await db.updateUser(userId, {
        username: username,
        email: email,
        password: password,
        status: status,
        balance: balance,
        referral_code: referralCode
    });
    
    closeEditUser();
    loadAdminUsers();
    alert('User updated successfully');
}

async function toggleUserStatus(userId, newStatus) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    if (user.is_admin) {
        alert('Cannot deactivate admin users');
        return;
    }
    
    if (confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this user?`)) {
        await db.updateUser(userId, { status: newStatus });
        loadAdminUsers();
        alert(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    }
}

async function resetPassword(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const newPassword = prompt('Enter new password for user:');
    if (newPassword && newPassword.length >= 4) {
        await db.updateUser(userId, { password: newPassword });
        loadAdminUsers();
        alert('Password reset successfully');
    } else if (newPassword) {
        alert('Password must be at least 4 characters long');
    }
}

function closeUserDetails() {
    document.getElementById('user-details-modal').style.display = 'none';
}

function closeEditUser() {
    document.getElementById('edit-user-modal').style.display = 'none';
}

// Add search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', loadAdminUsers);
    }
});

// Close modals when clicking outside
window.onclick = function(event) {
    const userModal = document.getElementById('user-details-modal');
    const editModal = document.getElementById('edit-user-modal');
    
    if (event.target === userModal) {
        closeUserDetails();
    }
    if (event.target === editModal) {
        closeEditUser();
    }
}

// Enhanced viewUserDetails function with investment tracking
async function viewUserDetails(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('user-details-content');
    if (!modalContent) {
        return;
    }
    
    // Get user's investments from Firestore
    const userInvestments = await getUserInvestmentsForAdmin(user.id);
    const investmentStats = calculateUserInvestmentStats(user, userInvestments);
    
    modalContent.innerHTML = `
        <div class="user-info">
            <h4>Basic Information</h4>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> <span class="password-field">${user.password}</span></p>
            <p><strong>Status:</strong> <span class="status-${user.status}">${user.status.toUpperCase()}</span></p>
            <p><strong>Referral Code:</strong> ${user.referral_code}</p>
            <p><strong>Referred By:</strong> ${user.referred_by || 'None'}</p>
            <p><strong>Join Date:</strong> ${new Date(user.join_date).toLocaleString()}</p>
            <p><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</p>
            <p><strong>Admin User:</strong> ${user.is_admin ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="admin-investment-section">
            <h4>Investment Portfolio</h4>
            
            <div class="investment-summary">
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalInvested)}</div>
                    <div class="summary-label">Total Invested</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${investmentStats.activeInvestments}</div>
                    <div class="summary-label">Active Plans</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalProfit)}</div>
                    <div class="summary-label">Total Profit</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.availableProfit)}</div>
                    <div class="summary-label">Available Profit</div>
                </div>
            </div>

            <div class="quick-stats">
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.completedInvestments}</div>
                    <div class="quick-stat-label">Completed</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.pendingInvestments}</div>
                    <div class="quick-stat-label">Pending</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalReferrals}</div>
                    <div class="quick-stat-label">Referrals</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalTransactions}</div>
                    <div class="quick-stat-label">Transactions</div>
                </div>
            </div>
            
            ${userInvestments.length > 0 ? `
                <table class="admin-investment-table">
                    <thead>
                        <tr>
                            <th>Mineral</th>
                            <th>Grams</th>
                            <th>Amount</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Progress</th>
                            <th>Current Profit</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userInvestments.map((investment, index) => {
                            const profit = calculateCurrentProfit(investment);
                            const progress = calculateInvestmentProgress(investment);
                            const daysRemaining = getDaysRemaining(investment);
                            const totalValue = investment.cost + profit;
                            const profitPercentage = ((profit / investment.cost) * 100);
                            
                            return `
                                <tr>
                                    <td><strong>${investment.mineral}</strong></td>
                                    <td>${investment.grams}g</td>
                                    <td>${db.formatCurrency(investment.cost)}</td>
                                    <td>${new Date(investment.startTime).toLocaleDateString()}</td>
                                    <td>${new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                    <td class="progress-cell">
                                        <div class="progress-bar-container">
                                            <div class="progress-bar-fill" style="width: ${progress}%"></div>
                                        </div>
                                        <div class="progress-text">${progress}% (${daysRemaining}d left)</div>
                                    </td>
                                    <td>
                                        <div>${db.formatCurrency(profit)}</div>
                                        <div style="font-size: 11px; color: ${profitPercentage >= 0 ? '#27ae60' : '#e74c3c'}">
                                            ${profitPercentage.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td>
                                        <span class="investment-status-badge status-${investment.completed ? 'completed' : 'active'}">
                                            ${investment.completed ? 'COMPLETED' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="investment-actions-admin">
                                            ${!investment.completed ? `
                                                <button class="btn-admin-action btn-complete" onclick="adminCompleteInvestment('${user.id}', '${investment.id}')">Complete</button>
                                                <button class="btn-admin-action btn-cancel" onclick="adminCancelInvestment('${user.id}', '${investment.id}')">Cancel</button>
                                            ` : ''}
                                            <button class="btn-admin-action btn-view" onclick="adminViewInvestmentDetails('${user.id}', '${investment.id}')">View</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="no-investments-admin">
                    <div style="font-size: 48px; margin-bottom: 10px;">💼</div>
                    <h4>No Investments Found</h4>
                    <p>This user hasn't started any investments yet</p>
                </div>
            `}
        </div>
        
        <div class="user-operations">
            <h4>User Operations</h4>
            
            <div class="operation-section">
                <h5>Referrals (${user.referrals ? user.referrals.length : 0})</h5>
                ${user.referrals && user.referrals.length > 0 ? 
                    user.referrals.map(ref => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Username:</strong> ${ref.username}</p>
                            <p><strong>Email:</strong> ${ref.email}</p>
                            <p><strong>Join Date:</strong> ${new Date(ref.join_date).toLocaleString()}</p>
                        </div>
                    `).join('') : 
                    '<p>No referrals</p>'
                }
            </div>
            
            <div class="operation-section">
                <h5>Transactions (${user.transactions ? user.transactions.length : 0})</h5>
                ${user.transactions && user.transactions.length > 0 ? 
                    user.transactions.map(trans => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Type:</strong> ${trans.type}</p>
                            <p><strong>Amount:</strong> ${db.formatCurrency(trans.amount)}</p>
                            <p><strong>Date:</strong> ${new Date(trans.date).toLocaleString()}</p>
                            <p><strong>Description:</strong> ${trans.description || 'N/A'}</p>
                        </div>
                    `).join('') : 
                    '<p>No transactions</p>'
                }
            </div>
        </div>
    `;
    
    document.getElementById('user-details-modal').style.display = 'block';
}

// Helper function to get user investments for admin view from Firestore
async function getUserInvestmentsForAdmin(userId) {
    try {
        const investmentsSnapshot = await db.db.collection('investments')
            .where('userId', '==', userId)
            .get();
        
        const investments = [];
        investmentsSnapshot.forEach(doc => {
            investments.push(doc.data());
        });
        return investments;
    } catch (error) {
        console.error('Error getting investments from Firestore:', error);
        return [];
    }
}

// Enhanced investment statistics calculation
function calculateUserInvestmentStats(user, userInvestments) {
    if (!userInvestments || userInvestments.length === 0) {
        return {
            totalInvested: 0,
            activeInvestments: 0,
            totalProfit: 0,
            availableProfit: 0,
            completedInvestments: 0,
            pendingInvestments: 0,
            totalReferrals: user.referrals ? user.referrals.length : 0,
            totalTransactions: user.transactions ? user.transactions.length : 0
        };
    }

    let totalInvested = 0;
    let activeInvestments = 0;
    let totalProfit = 0;
    let availableProfit = 0;
    let completedInvestments = 0;
    let pendingInvestments = 0;

    userInvestments.forEach(investment => {
        totalInvested += investment.cost;
        const profit = calculateCurrentProfit(investment);
        totalProfit += profit;

        if (investment.completed) {
            completedInvestments++;
        } else {
            activeInvestments++;
            availableProfit += profit;
        }
    });

    return {
        totalInvested,
        activeInvestments,
        totalProfit,
        availableProfit,
        completedInvestments,
        pendingInvestments,
        totalReferrals: user.referrals ? user.referrals.length : 0,
        totalTransactions: user.transactions ? user.transactions.length : 0
    };
}

// Admin investment management functions
async function adminCompleteInvestment(userId, investmentId) {
    if (!confirm('Mark this investment as completed? The user will receive any remaining profits.')) {
        return;
    }

    try {
        const investmentRef = db.db.collection('investments').doc(investmentId);
        const investmentDoc = await investmentRef.get();
        
        if (!investmentDoc.exists) {
            alert('Investment not found');
            return;
        }

        const investment = investmentDoc.data();
        const finalProfit = calculateCurrentProfit(investment);
        
        // Update investment status in Firestore
        await investmentRef.update({
            completed: true,
            finalProfit: finalProfit,
            completionDate: new Date().toISOString()
        });

        // Update user balance in Firestore
        const user = await db.getUserById(userId);
        if (user) {
            const totalAmount = investment.cost + finalProfit;
            await db.updateUser(userId, { 
                balance: user.balance + totalAmount 
            });
        }

        // Refresh the view
        viewUserDetails(userId);
        alert('Investment marked as completed successfully!');
    } catch (error) {
        console.error('Error completing investment:', error);
        alert('Error completing investment');
    }
}

async function adminCancelInvestment(userId, investmentId) {
    if (!confirm('Cancel this investment? The user will receive a refund of their principal amount and current profit.')) {
        return;
    }

    try {
        const investmentRef = db.db.collection('investments').doc(investmentId);
        const investmentDoc = await investmentRef.get();
        
        if (!investmentDoc.exists) {
            alert('Investment not found');
            return;
        }

        const investment = investmentDoc.data();
        const currentProfit = calculateCurrentProfit(investment);
        const totalRefund = investment.cost + currentProfit;
        
        // Update user balance in Firestore
        const user = await db.getUserById(userId);
        if (user) {
            await db.updateUser(userId, { 
                balance: user.balance + totalRefund 
            });
        }

        // Delete investment from Firestore
        await investmentRef.delete();

        // Refresh the view
        viewUserDetails(userId);
        alert(`Investment cancelled! TZS ${Math.round(totalRefund).toLocaleString()} refunded to user.`);
    } catch (error) {
        console.error('Error cancelling investment:', error);
        alert('Error cancelling investment');
    }
}

async function adminViewInvestmentDetails(userId, investmentId) {
    try {
        const investmentDoc = await db.db.collection('investments').doc(investmentId).get();
        
        if (!investmentDoc.exists) {
            alert('Investment not found');
            return;
        }

        const investment = investmentDoc.data();
        const profit = calculateCurrentProfit(investment);
        const progress = calculateInvestmentProgress(investment);
        const daysPassed = getDaysPassed(investment);
        const daysRemaining = getDaysRemaining(investment);
        const totalDays = getTotalDays(investment);
        const profitPercentage = ((profit / investment.cost) * 100);

        const detailsHtml = `
            <div class="user-info">
                <h4>Investment Details</h4>
                <p><strong>Investment ID:</strong> ${investment.id}</p>
                <p><strong>Mineral:</strong> ${investment.mineral}</p>
                <p><strong>Grams:</strong> ${investment.grams}g</p>
                <p><strong>Total Amount:</strong> ${db.formatCurrency(investment.cost)}</p>
                <p><strong>Status:</strong> <span class="status-${investment.completed ? 'completed' : 'active'}">${investment.completed ? 'COMPLETED' : 'ACTIVE'}</span></p>
                <p><strong>Duration:</strong> ${investment.days} days</p>
                <p><strong>Start Date:</strong> ${new Date(investment.startTime).toLocaleString()}</p>
                <p><strong>End Date:</strong> ${new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000).toLocaleString()}</p>
                <p><strong>Progress:</strong> ${progress}% (${daysPassed}/${totalDays} days)</p>
                <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
                <p><strong>Current Profit:</strong> ${db.formatCurrency(profit)}</p>
                <p><strong>Profit Percentage:</strong> <span style="color: ${profitPercentage >= 0 ? '#27ae60' : '#e74c3c'}">${profitPercentage.toFixed(2)}%</span></p>
                <p><strong>Total Value:</strong> ${db.formatCurrency(investment.cost + profit)}</p>
            </div>
        `;

        // Create a modal for investment details
        const modal = document.createElement('div');
        modal.className = 'user-details-modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
                ${detailsHtml}
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error viewing investment details:', error);
        alert('Error loading investment details');
    }
}

// Investment calculation functions (from your system)
function calculateCurrentProfit(investment) {
    const now = new Date();
    const startDate = new Date(investment.startTime);
    return now >= startDate ? calculateProfitForPeriod(investment.cost, startDate, now) : 0;
}

function calculateProfitForPeriod(principal, startDate, endDate) {
    let currentAmount = principal;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
        const dailyRate = getDailyReturnRate(currentDate);
        const secondsInDay = 24 * 60 * 60;
        const perSecondRate = Math.pow(1 + dailyRate, 1 / secondsInDay) - 1;
        
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        const secondsToProcess = Math.min((end - currentDate) / 1000, (endOfDay - currentDate) / 1000);
        
        if (secondsToProcess > 0) {
            currentAmount = currentAmount * Math.pow(1 + perSecondRate, secondsToProcess);
        }
        
        currentDate = new Date(Math.min(endOfDay.getTime() + 1000, end.getTime()));
    }
    
    return currentAmount - principal;
}

function getDailyReturnRate(date) {
    const dayOfWeek = date.getDay();
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 0.04 : 0.03;
}

function calculateInvestmentProgress(investment) {
    const daysPassed = getDaysPassed(investment);
    const totalDays = investment.days;
    const progress = (daysPassed / totalDays) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
}

function getDaysPassed(investment) {
    const startDate = new Date(investment.startTime);
    const currentDate = new Date();
    const diffTime = currentDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function getDaysRemaining(investment) {
    const currentDate = new Date();
    const endDate = new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000);
    const diffTime = endDate - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function getTotalDays(investment) {
    return investment.days;
}

// User Management Functions - Enhanced Version
async function loadAdminUsers() {
    const users = await db.getUsers();
    const tableBody = document.getElementById('users-table-body');
    const searchTerm = document.getElementById('user-search') ? document.getElementById('user-search').value.toLowerCase() : '';
    
    // Auto-create table if it doesn't exist
    if (!tableBody) {
        createUsersTable();
        return;
    }
    
    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.referral_code && user.referral_code.toLowerCase().includes(searchTerm))
    );
    
    tableBody.innerHTML = '';
    
    let activeCount = 0;
    let inactiveCount = 0;
    let todaySignups = 0;
    const today = new Date().toDateString();
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        
        // Count stats
        if (user.status === 'active') activeCount++;
        else inactiveCount++;
        
        const userDate = new Date(user.join_date).toDateString();
        if (userDate === today) todaySignups++;
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>
                <span class="status-${user.status}">${user.status.toUpperCase()}</span>
            </td>
            <td>
                <span class="password-field">${user.password}</span>
                ${!user.is_admin ? `<button class="btn-action btn-view" onclick="resetPassword('${user.id}')">Reset</button>` : ''}
            </td>
            <td>${user.referral_code || 'N/A'}</td>
            <td>${db.formatCurrency(user.balance)}</td>
            <td>${new Date(user.join_date).toLocaleDateString()}</td>
            <td>
                <button class="btn-action btn-view" onclick="viewUserDetails('${user.id}')">View</button>
                <button class="btn-action btn-edit" onclick="editUser('${user.id}')">Edit</button>
                ${user.status === 'active' && !user.is_admin ? 
                    `<button class="btn-action btn-deactivate" onclick="toggleUserStatus('${user.id}', 'inactive')">Deactivate</button>` :
                    `<button class="btn-action btn-activate" onclick="toggleUserStatus('${user.id}', 'active')">Activate</button>`
                }
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Update stats automatically
    updateUserStats(users.length, activeCount, inactiveCount, todaySignups);
}

// Auto-create users table if it doesn't exist
function createUsersTable() {
    const adminPanel = document.querySelector('.admin-panel') || document.getElementById('admin-panel');
    if (!adminPanel) {
        createAdminPanel();
        return;
    }
    
    const userManagementHTML = `
        <div class="user-management">
            <div class="management-header">
                <h2>User Management</h2>
                <div class="user-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="total-users-count">0</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="active-users-count">0</div>
                        <div class="stat-label">Active Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="inactive-users-count">0</div>
                        <div class="stat-label">Inactive Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="today-signups-count">0</div>
                        <div class="stat-label">Today's Signups</div>
                    </div>
                </div>
            </div>
            
            <div class="search-box">
                <input type="text" id="user-search" placeholder="Search users by username, email, or referral code..." onkeyup="loadAdminUsers()">
            </div>
            
            <div class="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Password</th>
                            <th>Referral Code</th>
                            <th>Balance</th>
                            <th>Join Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-table-body">
                        <!-- Users will be loaded here automatically -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- User Details Modal -->
        <div id="user-details-modal" class="user-details-modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal" onclick="closeUserDetails()">&times;</span>
                <div id="user-details-content"></div>
            </div>
        </div>
        
        <!-- Edit User Modal -->
        <div id="edit-user-modal" class="user-details-modal" style="display: none;">
            <div class="modal-content">
                <span class="close-modal" onclick="closeEditUser()">&times;</span>
                <div id="edit-user-content"></div>
            </div>
        </div>
    `;
    
    adminPanel.innerHTML = userManagementHTML;
    
    // Load users immediately after creating table
    setTimeout(() => loadAdminUsers(), 100);
}

// Auto-create admin panel if it doesn't exist
function createAdminPanel() {
    const mainContent = document.querySelector('.dashboard-content') || document.querySelector('.content-section.active');
    if (!mainContent) {
        return;
    }
    
    const adminPanelHTML = `
        <div class="admin-panel" id="admin-panel">
            <div class="admin-header">
                <h2><i class="fas fa-crown"></i> Admin Panel</h2>
                <div class="admin-nav">
                    <button class="admin-nav-btn active" onclick="showAdminSection('users')">User Management</button>
                    <button class="admin-nav-btn" onclick="showAdminSection('investments')">Investments</button>
                    <button class="admin-nav-btn" onclick="showAdminSection('transactions')">Transactions</button>
                </div>
            </div>
            <div class="admin-content" id="admin-content">
                <!-- User management will be loaded here automatically -->
            </div>
        </div>
    `;
    
    mainContent.innerHTML = adminPanelHTML;
    
    // Create users table after admin panel is created
    setTimeout(() => createUsersTable(), 100);
}

// Auto-update user statistics
function updateUserStats(total, active, inactive, today) {
    const elements = {
        'total-users-count': total,
        'active-users-count': active,
        'inactive-users-count': inactive,
        'today-signups-count': today
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// Enhanced viewUserDetails with auto-investment loading
async function viewUserDetails(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('user-details-content');
    if (!modalContent) {
        return;
    }
    
    // Auto-load user investments from Firestore
    const userInvestments = await getUserInvestmentsForAdmin(user.id);
    const investmentStats = calculateUserInvestmentStats(user, userInvestments);
    
    modalContent.innerHTML = `
        <div class="user-info">
            <h4>Basic Information</h4>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> <span class="password-field">${user.password}</span></p>
            <p><strong>Status:</strong> <span class="status-${user.status}">${user.status.toUpperCase()}</span></p>
            <p><strong>Referral Code:</strong> ${user.referral_code || 'N/A'}</p>
            <p><strong>Referred By:</strong> ${user.referred_by || 'None'}</p>
            <p><strong>Join Date:</strong> ${new Date(user.join_date).toLocaleString()}</p>
            <p><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</p>
            <p><strong>Admin User:</strong> ${user.is_admin ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="admin-investment-section">
            <h4>Investment Portfolio (Auto-loaded)</h4>
            
            <div class="investment-summary">
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalInvested)}</div>
                    <div class="summary-label">Total Invested</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${investmentStats.activeInvestments}</div>
                    <div class="summary-label">Active Plans</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalProfit)}</div>
                    <div class="summary-label">Total Profit</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.availableProfit)}</div>
                    <div class="summary-label">Available Profit</div>
                </div>
            </div>

            <div class="quick-stats">
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.completedInvestments}</div>
                    <div class="quick-stat-label">Completed</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.pendingInvestments}</div>
                    <div class="quick-stat-label">Pending</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalReferrals}</div>
                    <div class="quick-stat-label">Referrals</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalTransactions}</div>
                    <div class="quick-stat-label">Transactions</div>
                </div>
            </div>
            
            ${userInvestments.length > 0 ? `
                <table class="admin-investment-table">
                    <thead>
                        <tr>
                            <th>Mineral</th>
                            <th>Grams</th>
                            <th>Amount</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Progress</th>
                            <th>Current Profit</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userInvestments.map((investment, index) => {
                            const profit = calculateCurrentProfit(investment);
                            const progress = calculateInvestmentProgress(investment);
                            const daysRemaining = getDaysRemaining(investment);
                            const totalValue = investment.cost + profit;
                            const profitPercentage = ((profit / investment.cost) * 100);
                            
                            return `
                                <tr>
                                    <td><strong>${investment.mineral}</strong></td>
                                    <td>${investment.grams}g</td>
                                    <td>${db.formatCurrency(investment.cost)}</td>
                                    <td>${new Date(investment.startTime).toLocaleDateString()}</td>
                                    <td>${new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                    <td class="progress-cell">
                                        <div class="progress-bar-container">
                                            <div class="progress-bar-fill" style="width: ${progress}%"></div>
                                        </div>
                                        <div class="progress-text">${progress}% (${daysRemaining}d left)</div>
                                    </td>
                                    <td>
                                        <div>${db.formatCurrency(profit)}</div>
                                        <div style="font-size: 11px; color: ${profitPercentage >= 0 ? '#27ae60' : '#e74c3c'}">
                                            ${profitPercentage.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td>
                                        <span class="investment-status-badge status-${investment.completed ? 'completed' : 'active'}">
                                            ${investment.completed ? 'COMPLETED' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="investment-actions-admin">
                                            ${!investment.completed ? `
                                                <button class="btn-admin-action btn-complete" onclick="adminCompleteInvestment('${user.id}', '${investment.id}')">Complete</button>
                                                <button class="btn-admin-action btn-cancel" onclick="adminCancelInvestment('${user.id}', '${investment.id}')">Cancel</button>
                                            ` : ''}
                                            <button class="btn-admin-action btn-view" onclick="adminViewInvestmentDetails('${user.id}', '${investment.id}')">View</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="no-investments-admin">
                    <div style="font-size: 48px; margin-bottom: 10px;">💼</div>
                    <h4>No Investments Found</h4>
                    <p>This user hasn't started any investments yet</p>
                </div>
            `}
        </div>
        
        <div class="user-operations">
            <h4>User Operations (Auto-loaded)</h4>
            
            <div class="operation-section">
                <h5>Referrals (${user.referrals ? user.referrals.length : 0})</h5>
                ${user.referrals && user.referrals.length > 0 ? 
                    user.referrals.map(ref => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Username:</strong> ${ref.username}</p>
                            <p><strong>Email:</strong> ${ref.email}</p>
                            <p><strong>Join Date:</strong> ${new Date(ref.join_date).toLocaleString()}</p>
                        </div>
                    `).join('') : 
                    '<p>No referrals</p>'
                }
            </div>
            
            <div class="operation-section">
                <h5>Transactions (${user.transactions ? user.transactions.length : 0})</h5>
                ${user.transactions && user.transactions.length > 0 ? 
                    user.transactions.map(trans => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Type:</strong> ${trans.type}</p>
                            <p><strong>Amount:</strong> ${db.formatCurrency(trans.amount)}</p>
                            <p><strong>Date:</strong> ${new Date(trans.date).toLocaleString()}</p>
                            <p><strong>Description:</strong> ${trans.description || 'N/A'}</p>
                        </div>
                    `).join('') : 
                    '<p>No transactions</p>'
                }
            </div>
        </div>
    `;
    
    document.getElementById('user-details-modal').style.display = 'block';
}

// Auto-initialize user management
function autoInitializeUserManagement() {
    // Check if admin panel button exists and add auto-load
    const adminBtn = document.getElementById('admin-panel-section');
    if (adminBtn) {
        adminBtn.addEventListener('click', function() {
            setTimeout(() => {
                loadAdminUsers();
            }, 1000);
        });
    }
    
    // Auto-load users if we're already in admin panel
    if (window.location.hash === '#admin' || document.querySelector('.admin-panel')) {
        setTimeout(() => {
            loadAdminUsers();
        }, 500);
    }
    
    // Auto-refresh users every 30 seconds when in admin panel
    setInterval(() => {
        if (document.querySelector('.admin-panel') && document.querySelector('.admin-panel').style.display !== 'none') {
            loadAdminUsers();
        }
    }, 30000);
}

// Enhanced editUser with auto-form population
async function editUser(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('edit-user-content');
    if (!modalContent) {
        return;
    }
    
    modalContent.innerHTML = `
        <div class="edit-form">
            <h3>Edit User: ${user.username}</h3>
            <div class="form-group">
                <label for="edit-username">Username:</label>
                <input type="text" id="edit-username" value="${user.username}">
            </div>
            
            <div class="form-group">
                <label for="edit-email">Email:</label>
                <input type="email" id="edit-email" value="${user.email}">
            </div>
            
            <div class="form-group">
                <label for="edit-password">Password:</label>
                <input type="text" id="edit-password" value="${user.password}">
            </div>
            
            <div class="form-group">
                <label for="edit-status">Status:</label>
                <select id="edit-status">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="edit-balance">Balance (TZS):</label>
                <input type="number" id="edit-balance" value="${user.balance}">
            </div>
            
            <div class="form-group">
                <label for="edit-referral-code">Referral Code:</label>
                <input type="text" id="edit-referral-code" value="${user.referral_code || ''}">
            </div>
            
            <div class="form-actions">
                <button class="btn-action btn-activate" onclick="saveUserChanges('${user.id}')">Save Changes</button>
                <button class="btn-action btn-deactivate" onclick="closeEditUser()">Cancel</button>
            </div>
        </div>
    `;
    
    document.getElementById('edit-user-modal').style.display = 'block';
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(autoInitializeUserManagement, 2000);
});

// Auto-refresh when coming back to the page
window.addEventListener('focus', function() {
    if (document.querySelector('.admin-panel') && document.querySelector('.admin-panel').style.display !== 'none') {
        loadAdminUsers();
    }
});

async function saveUserChanges(userId) {
    const users = await db.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        alert('User not found');
        return;
    }
    
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;
    const password = document.getElementById('edit-password').value;
    const status = document.getElementById('edit-status').value;
    const balance = parseFloat(document.getElementById('edit-balance').value);
    const referralCode = document.getElementById('edit-referral-code').value;
    
    // Validate inputs
    if (!username || !email || !password || !referralCode) {
        alert('Please fill all fields');
        return;
    }
    
    // Check if username or email already exists (excluding current user)
    const existingUser = users.find(u => 
        (u.username === username || u.email === email) && u.id !== userId
    );
    
    if (existingUser) {
        alert('Username or email already exists');
        return;
    }
    
    // Update user in Firestore
    await db.updateUser(userId, {
        username: username,
        email: email,
        password: password,
        status: status,
        balance: balance,
        referral_code: referralCode
    });
    
    closeEditUser();
    loadAdminUsers();
    alert('User updated successfully');
}

async function toggleUserStatus(userId, newStatus) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    if (user.is_admin) {
        alert('Cannot deactivate admin users');
        return;
    }
    
    if (confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this user?`)) {
        await db.updateUser(userId, { status: newStatus });
        loadAdminUsers();
        alert(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    }
}

async function resetPassword(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const newPassword = prompt('Enter new password for user:');
    if (newPassword && newPassword.length >= 4) {
        await db.updateUser(userId, { password: newPassword });
        loadAdminUsers();
        alert('Password reset successfully');
    } else if (newPassword) {
        alert('Password must be at least 4 characters long');
    }
}

function closeUserDetails() {
    document.getElementById('user-details-modal').style.display = 'none';
}

function closeEditUser() {
    document.getElementById('edit-user-modal').style.display = 'none';
}

// Add search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', loadAdminUsers);
    }
});

// Close modals when clicking outside
window.onclick = function(event) {
    const userModal = document.getElementById('user-details-modal');
    const editModal = document.getElementById('edit-user-modal');
    
    if (event.target === userModal) {
        closeUserDetails();
    }
    if (event.target === editModal) {
        closeEditUser();
    }
}

// Enhanced viewUserDetails function with investment tracking
async function viewUserDetails(userId) {
    const users = await db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    const modalContent = document.getElementById('user-details-content');
    if (!modalContent) {
        return;
    }
    
    // Get user's investments from Firestore
    const userInvestments = await getUserInvestmentsForAdmin(user.id);
    const investmentStats = calculateUserInvestmentStats(user, userInvestments);
    
    modalContent.innerHTML = `
        <div class="user-info">
            <h4>Basic Information</h4>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> <span class="password-field">${user.password}</span></p>
            <p><strong>Status:</strong> <span class="status-${user.status}">${user.status.toUpperCase()}</span></p>
            <p><strong>Referral Code:</strong> ${user.referral_code}</p>
            <p><strong>Referred By:</strong> ${user.referred_by || 'None'}</p>
            <p><strong>Join Date:</strong> ${new Date(user.join_date).toLocaleString()}</p>
            <p><strong>Balance:</strong> ${db.formatCurrency(user.balance)}</p>
            <p><strong>Admin User:</strong> ${user.is_admin ? 'Yes' : 'No'}</p>
        </div>
        
        <div class="admin-investment-section">
            <h4>Investment Portfolio</h4>
            
            <div class="investment-summary">
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalInvested)}</div>
                    <div class="summary-label">Total Invested</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${investmentStats.activeInvestments}</div>
                    <div class="summary-label">Active Plans</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.totalProfit)}</div>
                    <div class="summary-label">Total Profit</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${db.formatCurrency(investmentStats.availableProfit)}</div>
                    <div class="summary-label">Available Profit</div>
                </div>
            </div>

            <div class="quick-stats">
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.completedInvestments}</div>
                    <div class="quick-stat-label">Completed</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.pendingInvestments}</div>
                    <div class="quick-stat-label">Pending</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalReferrals}</div>
                    <div class="quick-stat-label">Referrals</div>
                </div>
                <div class="quick-stat">
                    <div class="quick-stat-value">${investmentStats.totalTransactions}</div>
                    <div class="quick-stat-label">Transactions</div>
                </div>
            </div>
            
            ${userInvestments.length > 0 ? `
                <table class="admin-investment-table">
                    <thead>
                        <tr>
                            <th>Mineral</th>
                            <th>Grams</th>
                            <th>Amount</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Progress</th>
                            <th>Current Profit</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userInvestments.map((investment, index) => {
                            const profit = calculateCurrentProfit(investment);
                            const progress = calculateInvestmentProgress(investment);
                            const daysRemaining = getDaysRemaining(investment);
                            const totalValue = investment.cost + profit;
                            const profitPercentage = ((profit / investment.cost) * 100);
                            
                            return `
                                <tr>
                                    <td><strong>${investment.mineral}</strong></td>
                                    <td>${investment.grams}g</td>
                                    <td>${db.formatCurrency(investment.cost)}</td>
                                    <td>${new Date(investment.startTime).toLocaleDateString()}</td>
                                    <td>${new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
                                    <td class="progress-cell">
                                        <div class="progress-bar-container">
                                            <div class="progress-bar-fill" style="width: ${progress}%"></div>
                                        </div>
                                        <div class="progress-text">${progress}% (${daysRemaining}d left)</div>
                                    </td>
                                    <td>
                                        <div>${db.formatCurrency(profit)}</div>
                                        <div style="font-size: 11px; color: ${profitPercentage >= 0 ? '#27ae60' : '#e74c3c'}">
                                            ${profitPercentage.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td>
                                        <span class="investment-status-badge status-${investment.completed ? 'completed' : 'active'}">
                                            ${investment.completed ? 'COMPLETED' : 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="investment-actions-admin">
                                            ${!investment.completed ? `
                                                <button class="btn-admin-action btn-complete" onclick="adminCompleteInvestment('${user.id}', '${investment.id}')">Complete</button>
                                                <button class="btn-admin-action btn-cancel" onclick="adminCancelInvestment('${user.id}', '${investment.id}')">Cancel</button>
                                            ` : ''}
                                            <button class="btn-admin-action btn-view" onclick="adminViewInvestmentDetails('${user.id}', '${investment.id}')">View</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            ` : `
                <div class="no-investments-admin">
                    <div style="font-size: 48px; margin-bottom: 10px;">💼</div>
                    <h4>No Investments Found</h4>
                    <p>This user hasn't started any investments yet</p>
                </div>
            `}
        </div>
        
        <div class="user-operations">
            <h4>User Operations</h4>
            
            <div class="operation-section">
                <h5>Referrals (${user.referrals ? user.referrals.length : 0})</h5>
                ${user.referrals && user.referrals.length > 0 ? 
                    user.referrals.map(ref => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Username:</strong> ${ref.username}</p>
                            <p><strong>Email:</strong> ${ref.email}</p>
                            <p><strong>Join Date:</strong> ${new Date(ref.join_date).toLocaleString()}</p>
                        </div>
                    `).join('') : 
                    '<p>No referrals</p>'
                }
            </div>
            
            <div class="operation-section">
                <h5>Transactions (${user.transactions ? user.transactions.length : 0})</h5>
                ${user.transactions && user.transactions.length > 0 ? 
                    user.transactions.map(trans => `
                        <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
                            <p><strong>Type:</strong> ${trans.type}</p>
                            <p><strong>Amount:</strong> ${db.formatCurrency(trans.amount)}</p>
                            <p><strong>Date:</strong> ${new Date(trans.date).toLocaleString()}</p>
                            <p><strong>Description:</strong> ${trans.description || 'N/A'}</p>
                        </div>
                    `).join('') : 
                    '<p>No transactions</p>'
                }
            </div>
        </div>
    `;
    
    document.getElementById('user-details-modal').style.display = 'block';
}

// Helper function to get user investments for admin view from Firestore
async function getUserInvestmentsForAdmin(userId) {
    try {
        const investmentsSnapshot = await db.db.collection('investments')
            .where('userId', '==', userId)
            .get();
        
        const investments = [];
        investmentsSnapshot.forEach(doc => {
            investments.push(doc.data());
        });
        return investments;
    } catch (error) {
        console.error('Error getting investments from Firestore:', error);
        return [];
    }
}

// Enhanced investment statistics calculation
function calculateUserInvestmentStats(user, userInvestments) {
    if (!userInvestments || userInvestments.length === 0) {
        return {
            totalInvested: 0,
            activeInvestments: 0,
            totalProfit: 0,
            availableProfit: 0,
            completedInvestments: 0,
            pendingInvestments: 0,
            totalReferrals: user.referrals ? user.referrals.length : 0,
            totalTransactions: user.transactions ? user.transactions.length : 0
        };
    }

    let totalInvested = 0;
    let activeInvestments = 0;
    let totalProfit = 0;
    let availableProfit = 0;
    let completedInvestments = 0;
    let pendingInvestments = 0;

    userInvestments.forEach(investment => {
        totalInvested += investment.cost;
        const profit = calculateCurrentProfit(investment);
        totalProfit += profit;

        if (investment.completed) {
            completedInvestments++;
        } else {
            activeInvestments++;
            availableProfit += profit;
        }
    });

    return {
        totalInvested,
        activeInvestments,
        totalProfit,
        availableProfit,
        completedInvestments,
        pendingInvestments,
        totalReferrals: user.referrals ? user.referrals.length : 0,
        totalTransactions: user.transactions ? user.transactions.length : 0
    };
}

// Admin investment management functions
async function adminCompleteInvestment(userId, investmentId) {
    if (!confirm('Mark this investment as completed? The user will receive any remaining profits.')) {
        return;
    }

    try {
        const investmentRef = db.db.collection('investments').doc(investmentId);
        const investmentDoc = await investmentRef.get();
        
        if (!investmentDoc.exists) {
            alert('Investment not found');
            return;
        }

        const investment = investmentDoc.data();
        const finalProfit = calculateCurrentProfit(investment);
        
        // Update investment status in Firestore
        await investmentRef.update({
            completed: true,
            finalProfit: finalProfit,
            completionDate: new Date().toISOString()
        });

        // Update user balance in Firestore
        const user = await db.getUserById(userId);
        if (user) {
            const totalAmount = investment.cost + finalProfit;
            await db.updateUser(userId, { 
                balance: user.balance + totalAmount 
            });
        }

        // Refresh the view
        viewUserDetails(userId);
        alert('Investment marked as completed successfully!');
    } catch (error) {
        console.error('Error completing investment:', error);
        alert('Error completing investment');
    }
}

async function adminCancelInvestment(userId, investmentId) {
    if (!confirm('Cancel this investment? The user will receive a refund of their principal amount and current profit.')) {
        return;
    }

    try {
        const investmentRef = db.db.collection('investments').doc(investmentId);
        const investmentDoc = await investmentRef.get();
        
        if (!investmentDoc.exists) {
            alert('Investment not found');
            return;
        }

        const investment = investmentDoc.data();
        const currentProfit = calculateCurrentProfit(investment);
        const totalRefund = investment.cost + currentProfit;
        
        // Update user balance in Firestore
        const user = await db.getUserById(userId);
        if (user) {
            await db.updateUser(userId, { 
                balance: user.balance + totalRefund 
            });
        }

        // Delete investment from Firestore
        await investmentRef.delete();

        // Refresh the view
        viewUserDetails(userId);
        alert(`Investment cancelled! TZS ${Math.round(totalRefund).toLocaleString()} refunded to user.`);
    } catch (error) {
        console.error('Error cancelling investment:', error);
        alert('Error cancelling investment');
    }
}

async function adminViewInvestmentDetails(userId, investmentId) {
    try {
        const investmentDoc = await db.db.collection('investments').doc(investmentId).get();
        
        if (!investmentDoc.exists) {
            alert('Investment not found');
            return;
        }

        const investment = investmentDoc.data();
        const profit = calculateCurrentProfit(investment);
        const progress = calculateInvestmentProgress(investment);
        const daysPassed = getDaysPassed(investment);
        const daysRemaining = getDaysRemaining(investment);
        const totalDays = getTotalDays(investment);
        const profitPercentage = ((profit / investment.cost) * 100);

        const detailsHtml = `
            <div class="user-info">
                <h4>Investment Details</h4>
                <p><strong>Investment ID:</strong> ${investment.id}</p>
                <p><strong>Mineral:</strong> ${investment.mineral}</p>
                <p><strong>Grams:</strong> ${investment.grams}g</p>
                <p><strong>Total Amount:</strong> ${db.formatCurrency(investment.cost)}</p>
                <p><strong>Status:</strong> <span class="status-${investment.completed ? 'completed' : 'active'}">${investment.completed ? 'COMPLETED' : 'ACTIVE'}</span></p>
                <p><strong>Duration:</strong> ${investment.days} days</p>
                <p><strong>Start Date:</strong> ${new Date(investment.startTime).toLocaleString()}</p>
                <p><strong>End Date:</strong> ${new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000).toLocaleString()}</p>
                <p><strong>Progress:</strong> ${progress}% (${daysPassed}/${totalDays} days)</p>
                <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
                <p><strong>Current Profit:</strong> ${db.formatCurrency(profit)}</p>
                <p><strong>Profit Percentage:</strong> <span style="color: ${profitPercentage >= 0 ? '#27ae60' : '#e74c3c'}">${profitPercentage.toFixed(2)}%</span></p>
                <p><strong>Total Value:</strong> ${db.formatCurrency(investment.cost + profit)}</p>
            </div>
        `;

        // Create a modal for investment details
        const modal = document.createElement('div');
        modal.className = 'user-details-modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
                ${detailsHtml}
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error viewing investment details:', error);
        alert('Error loading investment details');
    }
}

// Investment calculation functions (from your system)
function calculateCurrentProfit(investment) {
    const now = new Date();
    const startDate = new Date(investment.startTime);
    return now >= startDate ? calculateProfitForPeriod(investment.cost, startDate, now) : 0;
}

function calculateProfitForPeriod(principal, startDate, endDate) {
    let currentAmount = principal;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate < end) {
        const dailyRate = getDailyReturnRate(currentDate);
        const secondsInDay = 24 * 60 * 60;
        const perSecondRate = Math.pow(1 + dailyRate, 1 / secondsInDay) - 1;
        
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        const secondsToProcess = Math.min((end - currentDate) / 1000, (endOfDay - currentDate) / 1000);
        
        if (secondsToProcess > 0) {
            currentAmount = currentAmount * Math.pow(1 + perSecondRate, secondsToProcess);
        }
        
        currentDate = new Date(Math.min(endOfDay.getTime() + 1000, end.getTime()));
    }
    
    return currentAmount - principal;
}

function getDailyReturnRate(date) {
    const dayOfWeek = date.getDay();
    return (dayOfWeek === 0 || dayOfWeek === 6) ? 0.04 : 0.03;
}

function calculateInvestmentProgress(investment) {
    const daysPassed = getDaysPassed(investment);
    const totalDays = investment.days;
    const progress = (daysPassed / totalDays) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
}

function getDaysPassed(investment) {
    const startDate = new Date(investment.startTime);
    const currentDate = new Date();
    const diffTime = currentDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function getDaysRemaining(investment) {
    const currentDate = new Date();
    const endDate = new Date(new Date(investment.startTime).getTime() + investment.days * 24 * 60 * 60 * 1000);
    const diffTime = endDate - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function getTotalDays(investment) {
    return investment.days;
}

// About Us Section Enhancement JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabs = document.querySelectorAll('.about-tab');
    const panes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            // Add active class to current tab and pane
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
    
    // Carousel functionality
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.mineral-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    let currentSlide = 0;
    
    function updateCarousel() {
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        // Update slides
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });
    }
    
    prevBtn.addEventListener('click', function() {
        currentSlide = currentSlide > 0 ? currentSlide - 1 : slides.length - 1;
        updateCarousel();
    });
    
    nextBtn.addEventListener('click', function() {
        currentSlide = currentSlide < slides.length - 1 ? currentSlide + 1 : 0;
        updateCarousel();
    });
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            currentSlide = index;
            updateCarousel();
        });
    });
    
    // Auto-advance carousel
    setInterval(() => {
        currentSlide = currentSlide < slides.length - 1 ? currentSlide + 1 : 0;
        updateCarousel();
    }, 5000);
    
    // Counter animation
    const counters = document.querySelectorAll('.counter-animation');
    
    function startCounterAnimation() {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const numberElement = counter.querySelector('.stat-number');
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                numberElement.textContent = target < 10 ? Math.floor(current) : 
                                           target === 98 ? Math.floor(current) + '%' :
                                           target === 2.5 ? current.toFixed(1) + 'B' :
                                           Math.floor(current);
            }, 20);
        });
    }
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.classList.contains('counter-animation')) {
                    startCounterAnimation();
                    observer.unobserve(entry.target);
                } else {
                    entry.target.style.animationPlayState = 'running';
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.counter-animation, .slide-in').forEach(el => {
        observer.observe(el);
    });
});

// Utility functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard: ' + text);
    });
}

function showLocation() {
    alert('Our office is located in Dar es Salaam, Tanzania. Contact us for specific directions.');
}

        // FAQ functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Toggle FAQ items
            const faqQuestions = document.querySelectorAll('.faq-question');
            
            faqQuestions.forEach(question => {
                question.addEventListener('click', () => {
                    const item = question.parentElement;
                    item.classList.toggle('active');
                });
            });
            
            // FAQ search functionality
            const faqSearch = document.getElementById('faq-search');
            const faqItems = document.querySelectorAll('.faq-item');
            
            faqSearch.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                
                faqItems.forEach(item => {
                    const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                    const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
                    
                    if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
            
            // FAQ category filtering
            const faqCategories = document.querySelectorAll('.faq-category');
            
            faqCategories.forEach(category => {
                category.addEventListener('click', function() {
                    // Remove active class from all categories
                    faqCategories.forEach(cat => cat.classList.remove('active'));
                    
                    // Add active class to clicked category
                    this.classList.add('active');
                    
                    const selectedCategory = this.getAttribute('data-category');
                    
                    // Show/hide FAQ items based on category
                    faqItems.forEach(item => {
                        const itemCategory = item.getAttribute('data-category');
                        
                        if (selectedCategory === 'all' || itemCategory === selectedCategory) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
            });
        });
        
        // Mineral Value Calculator Function
function calculateMineralValue() {
    // Get input values
    const grams = parseFloat(document.getElementById('mineral-grams').value);
    const mineralType = document.getElementById('mineral-type').value;
    const resultElement = document.getElementById('mineral-result');

    // Validate input
    if (!grams || grams <= 0) {
        resultElement.innerHTML = '<span style="color: #e74c3c;">Please enter a valid number of grams</span>';
        return;
    }

    // Calculate value based on mineral type
    const calculation = calculateMineralPrice(grams, mineralType);
    
    // Display result with formatting
    resultElement.innerHTML = `
        <div class="calc-result-content">
            <div class="calc-result-main">
                <strong>Value: TZS ${calculation.tzsValue.toLocaleString()} | $${calculation.usdValue.toLocaleString()}</strong>
            </div>
            <div class="calc-result-breakdown">
                <div class="breakdown-item">
                    <span>Mineral:</span>
                    <span>${calculation.mineralName}</span>
                </div>
                <div class="breakdown-item">
                    <span>Weight:</span>
                    <span>${grams}g</span>
                </div>
                <div class="breakdown-item">
                    <span>Price per gram:</span>
                    <span>TZS ${calculation.pricePerGramTZS.toLocaleString()} | $${calculation.pricePerGramUSD}</span>
                </div>
                <div class="breakdown-item">
                    <span>Total Value:</span>
                    <span class="total-value">TZS ${calculation.tzsValue.toLocaleString()} | $${calculation.usdValue.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;
}

// Calculate mineral price based on type and weight
function calculateMineralPrice(grams, mineralType) {
    // Mineral prices per gram (in TZS and USD)
    const mineralPrices = {
        diamond: {
            name: 'Diamond',
            tzsPerGram: 325000,  // TZS 325,000 per gram
            usdPerGram: 140      // $140 per gram
        },
        gold: {
            name: 'Gold',
            tzsPerGram: 125000,  // TZS 125,000 per gram
            usdPerGram: 54       // $54 per gram
        },
        tanzanite: {
            name: 'Tanzanite',
            tzsPerGram: 275000,  // TZS 275,000 per gram
            usdPerGram: 118      // $118 per gram
        },
        copper: {
            name: 'Copper',
            tzsPerGram: 12500,   // TZS 12,500 per gram
            usdPerGram: 5.4      // $5.40 per gram
        }
    };

    const mineral = mineralPrices[mineralType] || mineralPrices.diamond;
    
    // Calculate total values
    const tzsValue = grams * mineral.tzsPerGram;
    const usdValue = grams * mineral.usdPerGram;

    return {
        mineralName: mineral.name,
        pricePerGramTZS: mineral.tzsPerGram,
        pricePerGramUSD: mineral.usdPerGram,
        tzsValue: Math.round(tzsValue),
        usdValue: usdValue.toFixed(2)
    };
}

// Add real-time calculation as user types
function setupMineralCalculator() {
    const gramsInput = document.getElementById('mineral-grams');
    const mineralSelect = document.getElementById('mineral-type');
    
    if (gramsInput && mineralSelect) {
        // Real-time calculation on input change
        gramsInput.addEventListener('input', debounce(calculateMineralValue, 500));
        mineralSelect.addEventListener('change', calculateMineralValue);
        
        // Enter key support
        gramsInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateMineralValue();
            }
        });
    }
}

// Debounce function to prevent too many calculations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupMineralCalculator();
});

// Additional utility functions for the calculator

// Quick calculate functions for common amounts
function quickCalculate(grams) {
    document.getElementById('mineral-grams').value = grams;
    calculateMineralValue();
}

// Reset calculator
function resetCalculator() {
    document.getElementById('mineral-grams').value = '';
    document.getElementById('mineral-type').value = 'diamond';
    document.getElementById('mineral-result').innerHTML = 'Value: TZS 0.00 | $0.00';
}

// Get current mineral prices (could be extended to fetch from API)
function getCurrentMineralPrices() {
    return {
        diamond: { tzs: 325000, usd: 140 },
        gold: { tzs: 125000, usd: 54 },
        tanzanite: { tzs: 275000, usd: 118 },
        copper: { tzs: 12500, usd: 5.4 }
    };
}

// Update prices (for admin functionality)
function updateMineralPrices(newPrices) {
    // This would typically be an admin function to update prices
    
    // In a real implementation, this would save to database/localStorage
}

// Export calculation as CSV
function exportCalculation() {
    const grams = document.getElementById('mineral-grams').value;
    const mineralType = document.getElementById('mineral-type').value;
    
    if (!grams) {
        alert('Please enter a value to export');
        return;
    }
    
    const calculation = calculateMineralPrice(parseFloat(grams), mineralType);
    
    const csvContent = [
        'Mineral,Weight (g),Price per gram (TZS),Price per gram (USD),Total Value (TZS),Total Value (USD)',
        `${calculation.mineralName},${grams},${calculation.pricePerGramTZS},${calculation.pricePerGramUSD},${calculation.tzsValue},${calculation.usdValue}`
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mineral-calculation-${calculation.mineralName.toLowerCase()}-${grams}g.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Calculator functionality for admin dashboard
function calculatePercentage() {
    const originalAmount = parseFloat(document.getElementById('original-amount').value);
    const percentage = parseFloat(document.getElementById('percentage-value').value);
    
    if (isNaN(originalAmount) || isNaN(percentage)) {
        alert('Please enter valid numbers for both amount and percentage');
        return;
    }
    
    const percentageAmount = (originalAmount * percentage) / 100;
    const totalAmount = originalAmount + percentageAmount;
    
    document.getElementById('percentage-amount-result').textContent = `TZS ${percentageAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('percentage-result').textContent = `${percentage}%`;
    document.getElementById('total-amount-result').textContent = `TZS ${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    // Add to history
    addToHistory(`${originalAmount.toLocaleString()} TZS + ${percentage}% = ${percentageAmount.toLocaleString()} TZS`);
}

function calculatePercentageFromAmount() {
    const originalAmount = parseFloat(document.getElementById('original-amount').value);
    const resultAmount = parseFloat(document.getElementById('result-amount').value);
    
    if (isNaN(originalAmount) || isNaN(resultAmount)) {
        alert('Please enter valid numbers for both original amount and result amount');
        return;
    }
    
    if (originalAmount === 0) {
        alert('Original amount cannot be zero');
        return;
    }
    
    const percentage = ((resultAmount - originalAmount) / originalAmount) * 100;
    const percentageAmount = resultAmount - originalAmount;
    
    document.getElementById('percentage-amount-result').textContent = `TZS ${percentageAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('percentage-result').textContent = `${percentage.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
    document.getElementById('total-amount-result').textContent = `TZS ${resultAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    // Add to history
    addToHistory(`${originalAmount.toLocaleString()} TZS → ${resultAmount.toLocaleString()} TZS = ${percentage.toFixed(2)}%`);
}

function resetCalculator() {
    document.getElementById('original-amount').value = '';
    document.getElementById('percentage-value').value = '';
    document.getElementById('result-amount').value = '';
    document.getElementById('percentage-amount-result').textContent = 'TZS 0.00';
    document.getElementById('percentage-result').textContent = '0.00%';
    document.getElementById('total-amount-result').textContent = 'TZS 0.00';
}

function copyResults() {
    const percentageAmount = document.getElementById('percentage-amount-result').textContent;
    const percentage = document.getElementById('percentage-result').textContent;
    const totalAmount = document.getElementById('total-amount-result').textContent;
    
    const textToCopy = `Percentage Amount: ${percentageAmount}\nPercentage: ${percentage}\nTotal Amount: ${totalAmount}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Show success message
        showNotification('Results copied to clipboard!', 'success');
    }).catch(err => {
        
        showNotification('Failed to copy results', 'error');
    });
}

function addToHistory(calculation) {
    const historyList = document.getElementById('calculator-history');
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    historyItem.innerHTML = `
        <div class="history-calculation">${calculation}</div>
        <div class="history-time">${timeString}</div>
    `;
    
    // Add to top of history
    if (historyList.firstChild) {
        historyList.insertBefore(historyItem, historyList.firstChild);
    } else {
        historyList.appendChild(historyItem);
    }
    
    // Limit history to 10 items
    if (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
    
    // Save to localStorage
    saveCalculatorHistory();
}

function clearCalculatorHistory() {
    const historyList = document.getElementById('calculator-history');
    historyList.innerHTML = '<div class="no-history">No calculation history</div>';
    
    // Clear from localStorage
    localStorage.removeItem('calculatorHistory');
}

function saveCalculatorHistory() {
    const historyList = document.getElementById('calculator-history');
    const historyItems = [];
    
    for (let i = 0; i < historyList.children.length; i++) {
        const item = historyList.children[i];
        if (item.classList.contains('history-item')) {
            const calculation = item.querySelector('.history-calculation').textContent;
            const time = item.querySelector('.history-time').textContent;
            historyItems.push({ calculation, time });
        }
    }
    
    localStorage.setItem('calculatorHistory', JSON.stringify(historyItems));
}

function loadCalculatorHistory() {
    const historyList = document.getElementById('calculator-history');
    const savedHistory = localStorage.getItem('calculatorHistory');
    
    if (savedHistory) {
        const historyItems = JSON.parse(savedHistory);
        
        if (historyItems.length > 0) {
            historyList.innerHTML = '';
            
            historyItems.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="history-calculation">${item.calculation}</div>
                    <div class="history-time">${item.time}</div>
                `;
                historyList.appendChild(historyItem);
            });
        } else {
            historyList.innerHTML = '<div class="no-history">No calculation history</div>';
        }
    } else {
        historyList.innerHTML = '<div class="no-history">No calculation history</div>';
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadCalculatorHistory();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            calculatePercentage();
        }
    });
});

// JavaScript functions for referral earnings description
function goToSupport() {
    // Navigate to support section
    const supportSection = document.querySelector('[data-target="support"]');
    if (supportSection) {
        supportSection.click();
    } else {
        // Fallback: scroll to support section
        const supportElement = document.getElementById('support');
        if (supportElement) {
            supportElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function checkEarnings() {
    // Show available earnings modal or section
    const earningsElement = document.getElementById('available-earnings');
    if (earningsElement) {
        earningsElement.scrollIntoView({ behavior: 'smooth' });
        
        // Add highlight effect
        earningsElement.style.backgroundColor = '#fff3cd';
        earningsElement.style.transition = 'background-color 0.5s ease';
        
        setTimeout(() => {
            earningsElement.style.backgroundColor = '';
        }, 2000);
    }
    
    // You can also trigger a refresh of earnings data
    refreshReferralEarnings();
}

function refreshReferralEarnings() {
    // This function would typically make an API call to refresh earnings data
    
    
    // Show loading state
    const earningsElement = document.getElementById('available-earnings');
    if (earningsElement) {
        const originalText = earningsElement.textContent;
        earningsElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        
        // Simulate API call
        setTimeout(() => {
            earningsElement.textContent = originalText;
            showNotification('Earnings data updated successfully!', 'success');
        }, 1500);
    }
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set user's actual referral code in the example
    const userRefCode = localStorage.getItem('userReferralCode') || 'TMN-USER123';
    document.getElementById('user-referral-code').textContent = userRefCode;   
});

                // Toggle dropdown visibility
        document.getElementById('profileBtn').addEventListener('click', function() {
            document.getElementById('profileDropdown').classList.add('active');
            document.getElementById('overlay').classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        // Close dropdown when clicking close button
        document.getElementById('closeDropdown').addEventListener('click', function() {
            document.getElementById('profileDropdown').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        // Close dropdown when clicking outside
        document.getElementById('overlay').addEventListener('click', function() {
            document.getElementById('profileDropdown').classList.remove('active');
            document.getElementById('overlay').classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        // Bank instructions
        const bankInstructions = {
            vodacom: `
                <h4>Maelekezo ya Vodacom M-Pesa:</h4>
                <ol>
                    <li>Nenda kwenye M-Pesa kwenye simu yako</li>
                    <li>Chagua "Lipa kwa M-Pesa"</li>
                    <li>Chagua "Weka kiasi"</li>
                    <li>Weka namba ya simu: <strong>0753928102</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la M-Pesa</li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `,
            tigo: `
                <h4>Maelekezo ya Tigo Pesa:</h4>
                <ol>
                    <li>Nenda kwenye Tigo Pesa kwenye simu yako</li>
                    <li>Chagua "Send Money"</li>
                    <li>Weka namba ya simu: <strong>0657843291</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la Tigo Pesa</li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `,
            airtel: `
                <h4>Maelekezo ya Airtel Money:</h4>
                <ol>
                    <li>Nenda kwenye Airtel Money kwenye simu yako</li>
                    <li>Chagua "Send Money"</li>
                    <li>Weka namba ya simu: <strong>0784561230</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la Airtel Money</li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `,
            halotel: `
                <h4>Maelekezo ya Halotel Halopesa:</h4>
                <ol>
                    <li>Nenda kwenye menu ya Halopesa <strong>*150*88#</strong></li>
                    <li>Chagua <strong>05</strong> "Lipa bidhaa"</li>
                    <li>Chagua <strong>02</strong> kwenda halopesa</li>
                    <li>Weka lipa namba: <strong>23898109</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la Halopesa</li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `,
            crdb: `
                <h4>Maelekezo ya CRDB Bank:</h4>
                <ol>
                    <li>Nenda kwenye kituo cha CRDB Bank au tumia CRDB Mobile Banking</li>
                    <li>Chagua "Transfer Funds"</li>
                    <li>Chagua "To Another CRDB Account"</li>
                    <li>Weka namba ya akaunti: <strong>01520234567800</strong></li>
                    <li>Weka jina la akaunti: <strong>TANZANIA MINING INVESTMENT</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Kamilisha muamala</li>
                </ol>
            `,
            nmb: `
                <h4>Maelekezo ya NMB Bank:</h4>
                <ol>
                    <li>Nenda kwenye kituo cha NMB Bank au tumia NMB Mobile Banking</li>
                    <li>Chagua "Transfer"</li>
                    <li>Chagua "To NMB Account"</li>
                    <li>Weka namba ya akaunti: <strong>20910012345</strong></li>
                    <li>Weka jina la akaunti: <strong>TANZANIA MINING INVESTMENT</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Kamilisha muamala</li>
                </ol>
            `,
            ezy: `
                <h4>Maelekezo ya Ezy Pesa:</h4>
                <ol>
                    <li>Nenda kwenye Ezy Pesa kwenye simu yako</li>
                    <li>Chagua "Send Money"</li>
                    <li>Weka namba ya simu: <strong>0741122334</strong></li>
                    <li>Weka kiasi unachotaka kuweka</li>
                    <li>Weka nenosiri la Ezy Pesa</li>
                    <li>Subiri kupokea ujumbe wa uthibitisho</li>
                </ol>
            `
        };

        // DOM Content Loaded Event
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize UI elements
            initLoginTabs();
            initDepositSection();
            initWithdrawalSection();
            initNavigation();
            
            // Check if user is already logged in
            if (db.currentUser) {
                if (db.currentUser.is_admin) {
                    showAdminDashboard();
                } else {
                    showUserDashboard();
                }
            }
        });
        
        
class ChatSystem {
    constructor() {
        // Simple fix - don't use database for now
        this.db = null;
        this.chats = JSON.parse(localStorage.getItem('mining_chats')) || {};
        this.currentUserChat = null;
        this.adminViewingUser = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        await this.loadChatsFromFirestore();
        this.setupEventListeners();
        this.loadAdminChatList();
        this.startPolling();
        this.isInitialized = true;
    }

    // Load chats from Firestore
    async loadChatsFromFirestore() {
        try {
            const chatsSnapshot = await this.db.collection('chats').get();
            this.chats = {};
            
            chatsSnapshot.forEach(doc => {
                this.chats[doc.id] = doc.data();
            });
        } catch (error) {
            console.log('Using empty chats object');
            this.chats = {};
        }
    }

    // Save chats to Firestore
    async saveChats() {
        try {
            for (const [userId, chatData] of Object.entries(this.chats)) {
                await this.db.collection('chats').doc(userId.toString()).set(chatData);
            }
        } catch (error) {
            console.error('Error saving chats to Firestore:', error);
        }
    }

    // Initialize chat data for a user
    async initUserChat(userId) {
        if (!this.chats[userId]) {
            this.chats[userId] = {
                userId: userId,
                username: this.getUsername(userId),
                messages: [
                    {
                        id: 1,
                        sender: 'admin',
                        content: 'Hello! Welcome to Tanzania Mining Investment support. How can we help you today?',
                        timestamp: new Date().toISOString(),
                        read: false
                    }
                ],
                unreadCount: 0,
                lastActivity: new Date().toISOString(),
                status: 'online'
            };
            await this.saveChats();
        }
        return this.chats[userId];
    }

    // Get username from user ID
    getUsername(userId) {
        const users = db.getUsers();
        const user = users.find(u => u.id === userId);
        return user ? user.username : 'Unknown User';
    }

    // Setup event listeners for chat functionality
    setupEventListeners() {
        // User chat modal events
        const userMessageInput = document.getElementById('user-message-input');
        if (userMessageInput) {
            userMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendUserMessage();
                }
            });
        }

        // Admin chat modal events
        const adminMessageInput = document.getElementById('admin-message-input');
        if (adminMessageInput) {
            adminMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAdminMessage();
                }
            });
        }

        // File upload handling
        const userFileInput = document.getElementById('user-file-input');
        if (userFileInput) {
            userFileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e, 'user');
            });
        }

        // Quick responses
        document.querySelectorAll('.quick-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const onclickAttr = e.target.getAttribute('onclick');
                if (onclickAttr) {
                    const match = onclickAttr.match(/'([^']+)'/);
                    if (match) {
                        const message = match[1];
                        this.quickQuestion(message);
                    }
                }
            });
        });
    }

    // Send message from user
    async sendUserMessage() {
        const messageInput = document.getElementById('user-message-input');
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
        if (!message) return;

        const currentUser = db.currentUser;
        if (!currentUser) {
            alert('Please log in to send messages');
            return;
        }

        // Initialize chat if it doesn't exist
        await this.initUserChat(currentUser.id);
        
        // Add message to chat
        const userChat = this.chats[currentUser.id];
        const newMessage = {
            id: userChat.messages.length + 1,
            sender: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            read: false
        };

        userChat.messages.push(newMessage);
        userChat.lastActivity = new Date().toISOString();
        userChat.unreadCount++;
        await this.saveChats();

        // Clear input and update UI
        messageInput.value = '';
        this.displayUserMessages(currentUser.id);

        // Simulate admin response after a delay
        setTimeout(() => {
            this.generateAdminResponse(currentUser.id, message);
        }, 2000);
    }

    // Send message from admin
    async sendAdminMessage() {
        const messageInput = document.getElementById('admin-message-input');
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
        if (!message || !this.adminViewingUser) return;

        const userChat = this.chats[this.adminViewingUser];
        if (!userChat) return;

        const newMessage = {
            id: userChat.messages.length + 1,
            sender: 'admin',
            content: message,
            timestamp: new Date().toISOString(),
            read: true
        };

        userChat.messages.push(newMessage);
        userChat.lastActivity = new Date().toISOString();
        userChat.unreadCount = 0; // Reset unread count when admin sends message
        await this.saveChats();

        // Clear input and update UI
        messageInput.value = '';
        this.displayAdminMessages(this.adminViewingUser);
        this.loadAdminChatList();
    }

    // Generate automated admin response
    async generateAdminResponse(userId, userMessage) {
        const userChat = this.chats[userId];
        if (!userChat) return;

        let response = '';
        const lowerMessage = userMessage.toLowerCase();

        // Simple response logic based on keywords
        if (lowerMessage.includes('investment') || lowerMessage.includes('invest')) {
            response = 'Our investment plans offer competitive returns. You can choose from Basic (15% ROI), Premium (25% ROI), or VIP (40% ROI) plans. Minimum investment is TZS 10,000.';
        } else if (lowerMessage.includes('withdraw') || lowerMessage.includes('withdrawal')) {
            response = 'Withdrawals are processed once per week. Minimum withdrawal is TZS 10,000 with a 10% service fee. You can withdraw Monday-Friday anytime, and Saturday-Sunday from 2 PM to 11 PM.';
        } else if (lowerMessage.includes('password') || lowerMessage.includes('reset')) {
            response = 'To reset your password, please use the "Forgot Password" feature on the login page. An email will be sent to your registered email address with instructions.';
        } else if (lowerMessage.includes('referral') || lowerMessage.includes('bonus')) {
            response = 'Our referral program gives you 10% commission on your referrals\' first deposits. Share your unique referral code with friends to start earning!';
        } else if (lowerMessage.includes('balance') || lowerMessage.includes('money')) {
            response = 'You can check your current balance in the dashboard. Deposits are added to your balance after admin approval, which usually takes 1-2 hours during business days.';
        } else {
            response = 'Thank you for your message. Our support team will review your inquiry and respond shortly. For immediate assistance, you can also contact us at +255 624 666 402.';
        }

        const adminMessage = {
            id: userChat.messages.length + 1,
            sender: 'admin',
            content: response,
            timestamp: new Date().toISOString(),
            read: false
        };

        userChat.messages.push(adminMessage);
        userChat.lastActivity = new Date().toISOString();
        await this.saveChats();

        this.displayUserMessages(userId);
        this.loadAdminChatList();
    }

    // Display messages in user chat
    displayUserMessages(userId) {
        const chatMessages = document.getElementById('user-chat-messages');
        if (!chatMessages) return;

        const userChat = this.chats[userId];
        if (!userChat) return;

        chatMessages.innerHTML = '';
        
        userChat.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.sender === 'user' ? 'user-message' : 'support-message'}`;
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = message.content;
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = this.formatTime(message.timestamp);
            
            messageDiv.appendChild(messageContent);
            messageDiv.appendChild(messageTime);
            chatMessages.appendChild(messageDiv);
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Display messages in admin chat
    displayAdminMessages(userId) {
        const chatMessages = document.getElementById('admin-chat-messages');
        if (!chatMessages) return;

        const userChat = this.chats[userId];
        if (!userChat) return;

        chatMessages.innerHTML = '';
        
        userChat.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `admin-message ${message.sender}`;
            
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble';
            messageBubble.textContent = message.content;
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = this.formatTime(message.timestamp);
            
            messageDiv.appendChild(messageBubble);
            messageDiv.appendChild(messageTime);
            chatMessages.appendChild(messageDiv);
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Load admin chat list
    loadAdminChatList() {
        const chatUsersList = document.getElementById('admin-chat-users');
        if (!chatUsersList) return;

        chatUsersList.innerHTML = '';

        // Get all users with chats
        const users = db.getUsers();
        let totalUnread = 0;
        let totalConversations = 0;

        users.forEach(user => {
            const userChat = this.chats[user.id];
            if (userChat) {
                totalConversations++;
                const userItem = document.createElement('div');
                userItem.className = `chat-user-item ${this.adminViewingUser === user.id ? 'active' : ''}`;
                userItem.onclick = () => this.selectUserChat(user.id);

                const userInfo = document.createElement('div');
                userInfo.className = 'user-chat-info';

                const userName = document.createElement('div');
                userName.className = 'user-name';
                userName.textContent = user.username;

                const lastMessage = document.createElement('div');
                lastMessage.className = 'last-message';
                const lastMsg = userChat.messages[userChat.messages.length - 1];
                lastMessage.textContent = lastMsg ? lastMsg.content.substring(0, 30) + (lastMsg.content.length > 30 ? '...' : '') : 'No messages';

                userInfo.appendChild(userName);
                userInfo.appendChild(lastMessage);

                const chatMeta = document.createElement('div');
                chatMeta.className = 'chat-meta';

                const lastSeen = document.createElement('div');
                lastSeen.className = 'last-seen';
                lastSeen.textContent = this.formatTime(userChat.lastActivity);

                chatMeta.appendChild(lastSeen);

                if (userChat.unreadCount > 0) {
                    const unreadCount = document.createElement('div');
                    unreadCount.className = 'unread-count';
                    unreadCount.textContent = userChat.unreadCount;
                    chatMeta.appendChild(unreadCount);
                    totalUnread += userChat.unreadCount;
                }

                userItem.appendChild(userInfo);
                userItem.appendChild(chatMeta);
                chatUsersList.appendChild(userItem);
            }
        });

        // Update admin chat stats
        const totalConversationsEl = document.getElementById('total-conversations');
        const unreadConversationsEl = document.getElementById('unread-conversations');
        const unreadMassageEl = document.getElementById('unread-massage');
        const activeConversationsEl = document.getElementById('active-conversations');
        
        if (totalConversationsEl) totalConversationsEl.textContent = totalConversations;
        if (unreadConversationsEl) unreadConversationsEl.textContent = totalUnread;
        if (activeConversationsEl) activeConversationsEl.textContent = this.getActiveConversationsCount();

        // Update admin chat badge
        const adminChatBadge = document.getElementById('admin-chat-badge');
        if (adminChatBadge) {
            if (totalUnread > 0) {
                adminChatBadge.textContent = totalUnread;
                adminChatBadge.style.display = 'flex';
            } else {
                adminChatBadge.style.display = 'none';
            }
        }
    }

    // Get count of active conversations (today)
    getActiveConversationsCount() {
        const today = new Date().toDateString();
        let count = 0;
        
        Object.values(this.chats).forEach(chat => {
            const chatDate = new Date(chat.lastActivity).toDateString();
            if (chatDate === today) {
                count++;
            }
        });
        
        return count;
    }

    // Select user chat in admin panel
    async selectUserChat(userId) {
        this.adminViewingUser = userId;
        
        // Update UI to show selected user
        document.querySelectorAll('.chat-user-item').forEach(item => {
            item.classList.remove('active');
        });
        
        event.currentTarget.classList.add('active');

        // Show chat header
        const chatHeader = document.getElementById('admin-chat-header');
        const userChat = this.chats[userId];
        
        if (chatHeader && userChat) {
            chatHeader.innerHTML = `
                <div class="chat-title">
                    <i class="fas fa-user"></i>
                    <span>${userChat.username}</span>
                    <div class="chat-status">
                        <span class="status-indicator ${userChat.status}"></span>
                        <span>${userChat.status}</span>
                    </div>
                </div>
            `;
        }

        // Show messages and input - with null checks
        const noChatSelected = document.getElementById('no-chat-selected');
        const adminChatMessages = document.getElementById('admin-chat-messages');
        const adminChatInput = document.getElementById('admin-chat-input');
        
        if (noChatSelected) noChatSelected.style.display = 'none';
        if (adminChatMessages) adminChatMessages.style.display = 'block';
        if (adminChatInput) adminChatInput.style.display = 'block';

        // Display messages
        this.displayAdminMessages(userId);

        // Mark messages as read
        if (userChat.unreadCount > 0) {
            userChat.messages.forEach(message => {
                if (message.sender === 'user') {
                    message.read = true;
                }
            });
            userChat.unreadCount = 0;
            await this.saveChats();
            this.loadAdminChatList();
        }
    }

    // Quick question from user
    quickQuestion(question) {
        const messageInput = document.getElementById('user-message-input');
        if (messageInput) {
            messageInput.value = question;
            this.sendUserMessage();
        }
    }

    // Quick response from admin
    adminQuickResponse(response) {
        const messageInput = document.getElementById('admin-message-input');
        if (messageInput) {
            messageInput.value = response;
            this.sendAdminMessage();
        }
    }

    // Handle file upload
    handleFileUpload(event, sender) {
        const files = event.target.files;
        const fileList = document.getElementById(sender === 'user' ? 'user-file-list' : 'admin-file-list');
        
        if (!fileList) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileName = document.createElement('span');
            fileName.textContent = file.name;
            
            const fileRemove = document.createElement('span');
            fileRemove.className = 'file-remove';
            fileRemove.innerHTML = '<i class="fas fa-times"></i>';
            fileRemove.onclick = () => fileItem.remove();
            
            fileItem.appendChild(fileName);
            fileItem.appendChild(fileRemove);
            fileList.appendChild(fileItem);
        }
        
        // Reset file input
        event.target.value = '';
    }

    // Format timestamp
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Start polling for updates (simulates real-time)
    startPolling() {
        setInterval(async () => {
            // Refresh chats from Firestore
            await this.loadChatsFromFirestore();
            
            if (db.currentUser && !db.currentUser.is_admin) {
                // Update user's own chat
                this.displayUserMessages(db.currentUser.id);
            } else if (db.currentUser && db.currentUser.is_admin) {
                // Update admin chat list
                this.loadAdminChatList();
                if (this.adminViewingUser) {
                    this.displayAdminMessages(this.adminViewingUser);
                }
            }
        }, 3000);
    }

    // Open user chat modal
    async openUserChatModal() {
        if (!db.currentUser) {
            alert('Please log in to use chat');
            return;
        }
        
        // Initialize chat system if not already done
        await this.init();
        
        // Initialize user chat if it doesn't exist
        await this.initUserChat(db.currentUser.id);
        
        // Display messages
        this.displayUserMessages(db.currentUser.id);
        
        // Show modal
        openModal('user-chat-modal');
    }

    // Open admin chat modal
    async openAdminChatModal() {
        if (!db.currentUser || !db.currentUser.is_admin) {
            alert('Admin access required');
            return;
        }
        
        // Initialize chat system if not already done
        await this.init();
        
        // Load chat list
        this.loadAdminChatList();
        
        // Show modal
        openModal('admin-chat-modal');
    }
}

// Remove the ChatDatabase class since we're using Firestore now

// Initialize chat system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.chatSystem = new ChatSystem();
    
    // Update support options to use chat system
    const chatSupportOption = document.querySelector('.support-option[onclick="openSupportOption(\'chat\')"]');
    if (chatSupportOption) {
        chatSupportOption.setAttribute('onclick', 'chatSystem.openUserChatModal()');
    }
    
    // Update admin chat button
    const adminChatButton = document.querySelector('.btn[onclick*="openChatModal"]');
    if (adminChatButton) {
        adminChatButton.setAttribute('onclick', 'chatSystem.openAdminChatModal()');    
    }
}); 
 
// Update the openSupportOption function to handle chat
function openSupportOption(option) {
    switch(option) {
        case 'whatsapp':
            window.open('https://wa.me/255624666402', '_blank');
            break;
        case 'email':
            window.location.href = 'mailto:mining.investment.tanzania@proton.me';
            break;
        case 'phone':
            window.location.href = 'tel:+255624666402';
            break;
        case 'chat':
            if (window.chatSystem) {
                window.chatSystem.openUserChatModal();
            }
            break;
    }
}

// Make sure modal functions are available
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize immediately
document.addEventListener('DOMContentLoaded', function() {
    window.chatSystem = new ChatSystem();
});

// Tab switching functionality
function switchTab(tab) {
    // Update tabs
    document.getElementById('login-tab').classList.toggle('active', tab === 'login');
    document.getElementById('signup-tab').classList.toggle('active', tab === 'signup');
    
    // Update forms
    document.getElementById('login-form').classList.toggle('active', tab === 'login');
    document.getElementById('signup-form').classList.toggle('active', tab === 'signup');
    
    // Reset form errors
    resetFormErrors();
}

// Password visibility toggle
function togglePassword(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    const icon = toggleElement.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleElement.querySelector('span').textContent = 'Hide Password';
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleElement.querySelector('span').textContent = 'Show Password';
    }
}

// Form validation functions - UPDATED FOR FIREBASE AUTH
async function validateLogin() {
    resetFormErrors();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    let isValid = true;
    
    // Email validation
    if (!email) {
        showFieldError('login-email', 'login-email-error');
        isValid = false;
    }
    
    // Password validation
    if (!password || password.length < 6) {
        showFieldError('login-password', 'login-password-error');
        isValid = false;
    }
    
    if (isValid) {
        showError('Logging In', 'Please wait while we authenticate your credentials...', 'info');
        
        try {
            // Use Firebase Authentication
            await db.loginUser(email, password);
            showError('Login Successful', 'Welcome to Tanzania Mining Investment Portal!', 'success');
            // Redirect to dashboard or update UI
            setTimeout(() => {
                window.location.href = 'dashboard.html'; // or update current page
            }, 1000);
        } catch (error) {
            showError('Login Failed', error.message, 'error');
        }
    } else {
        showError('Validation Error', 'Please fix the errors in the form before submitting.', 'error');
    }
}

async function validateSignup() {
    resetFormErrors();
    
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    let isValid = true;
    
    // Username validation
    if (!username || username.length < 3 || username.length > 20) {
        showFieldError('signup-username', 'signup-username-error');
        isValid = false;
    }
    
    // Email validation
    if (!email || !isValidEmail(email)) {
        showFieldError('signup-email', 'signup-email-error');
        isValid = false;
    }
    
    // Password validation
    if (!password || password.length < 8 || !hasUpperCase(password) || !hasLowerCase(password) || !hasNumber(password)) {
        showFieldError('signup-password', 'signup-password-error');
        isValid = false;
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
        showFieldError('signup-confirm-password', 'signup-confirm-password-error');
        isValid = false;
    }
    
    if (isValid) {
        showError('Account Creation', 'Your account is being created...', 'info');
        
        try {
            // Use Firebase Authentication
            const userData = {
                username: username,
                email: email,
                password: password,
                referral_code: generateReferralCode(username),
                referred_by: getReferralFromURL() // If you have referral system
            };
            
            await db.registerUser(userData);
            showError('Account Created', 'Your account has been successfully created!', 'success');
            switchTab('login');
        } catch (error) {
            showError('Registration Failed', error.message, 'error');
        }
    } else {
        showError('Validation Error', 'Please fix the errors in the form before submitting.', 'error');
    }
}

// Helper functions for validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function hasUpperCase(str) {
    return /[A-Z]/.test(str);
}

function hasLowerCase(str) {
    return /[a-z]/.test(str);
}

function hasNumber(str) {
    return /\d/.test(str);
}

function showFieldError(fieldId, errorId) {
    document.getElementById(fieldId).classList.add('input-error');
    document.getElementById(errorId).classList.add('show');
}

function resetFormErrors() {
    // Remove error styling from all inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('input-error', 'input-success');
    });
    
    // Hide all error messages
    const errorMessages = document.querySelectorAll('.form-error');
    errorMessages.forEach(error => {
        error.classList.remove('show');
    });
}

// Generate referral code
function generateReferralCode(username) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${username.toUpperCase().substring(0, 4)}${randomNum}`;
}

function getReferralFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
}

// Firestore Storage Functions
const firestoreStorage = {
    // Save slides to Firestore
    async saveSlide(slideData) {
        try {
            const slideRef = db.db.collection('slides').doc(slideData.id.toString());
            await slideRef.set({
                ...slideData,
                createdAt: db.fieldValue.serverTimestamp(),
                updatedAt: db.fieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error saving slide:', error);
            return false;
        }
    },

    // Save announcement to Firestore
    async saveAnnouncement(announcementData) {
        try {
            const announcementRef = db.db.collection('announcements').doc(announcementData.id.toString());
            await announcementRef.set({
                ...announcementData,
                createdAt: db.fieldValue.serverTimestamp(),
                updatedAt: db.fieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error saving announcement:', error);
            return false;
        }
    },

    // Get all slides from Firestore
    async getSlides() {
        try {
            const slidesSnapshot = await db.db.collection('slides')
                .orderBy('createdAt', 'desc')
                .get();
            const slides = [];
            slidesSnapshot.forEach(doc => {
                slides.push({ id: doc.id, ...doc.data() });
            });
            return slides;
        } catch (error) {
            console.error('Error loading slides:', error);
            return [];
        }
    },

    // Get all announcements from Firestore
    async getAnnouncements() {
        try {
            const announcementsSnapshot = await db.db.collection('announcements')
                .orderBy('createdAt', 'desc')
                .get();
            const announcements = [];
            announcementsSnapshot.forEach(doc => {
                announcements.push({ id: doc.id, ...doc.data() });
            });
            return announcements;
        } catch (error) {
            console.error('Error loading announcements:', error);
            return [];
        }
    },

    // Update slide in Firestore
    async updateSlide(slideId, slideData) {
        try {
            await db.db.collection('slides').doc(slideId.toString()).update({
                ...slideData,
                updatedAt: db.fieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating slide:', error);
            return false;
        }
    },

    // Update announcement in Firestore
    async updateAnnouncement(announcementId, announcementData) {
        try {
            await db.db.collection('announcements').doc(announcementId.toString()).update({
                ...announcementData,
                updatedAt: db.fieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating announcement:', error);
            return false;
        }
    },

    // Delete slide from Firestore
    async deleteSlide(slideId) {
        try {
            await db.db.collection('slides').doc(slideId.toString()).delete();
            return true;
        } catch (error) {
            console.error('Error deleting slide:', error);
            return false;
        }
    },

    // Delete announcement from Firestore
    async deleteAnnouncement(announcementId) {
        try {
            await db.db.collection('announcements').doc(announcementId.toString()).delete();
            return true;
        } catch (error) {
            console.error('Error deleting announcement:', error);
            return false;
        }
    }
};

// DOM Elements for Slideshow System
const slideshowContainer = document.getElementById('slideshowContainer');
const announcementsContainer = document.getElementById('announcementsContainer');
const adminToggle = document.getElementById('adminToggle');
const adminPanel = document.getElementById('adminPanel');
const announcementType = document.getElementById('announcementType');
const announcementForm = document.getElementById('announcementForm');
const mediaForm = document.getElementById('mediaForm');
const mediaFile = document.getElementById('mediaFile');
const imagePreview = document.getElementById('imagePreview');
const videoPreview = document.getElementById('videoPreview');
const saveBtn = document.getElementById('saveBtn');
const updateBtn = document.getElementById('updateBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearBtn = document.getElementById('clearBtn');
const prevBtn = document.getElementById('prevBtn');
const pauseBtn = document.getElementById('pauseBtn');
const nextBtn = document.getElementById('nextBtn');
const logoutBtn = document.getElementById('logoutBtn');
const contentList = document.getElementById('contentList');

// State variables
let currentSlideIndex = 0;
let slideshowInterval;
let isPlaying = true;
let isEditing = false;
let currentEditId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadSlides();
    await loadAnnouncements();
    await loadContentList();
    startSlideshow();
    
    // Set up event listeners
    if (adminToggle) adminToggle.addEventListener('click', toggleAdminPanel);
    if (announcementType) announcementType.addEventListener('change', toggleFormType);
    if (mediaFile) mediaFile.addEventListener('change', previewMedia);
    if (saveBtn) saveBtn.addEventListener('click', saveContent);
    if (updateBtn) updateBtn.addEventListener('click', updateContent);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);
    if (clearBtn) clearBtn.addEventListener('click', clearForm);
    if (prevBtn) prevBtn.addEventListener('click', showPreviousSlide);
    if (pauseBtn) pauseBtn.addEventListener('click', toggleSlideshow);
    if (nextBtn) nextBtn.addEventListener('click', showNextSlide);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});

// Toggle admin panel visibility
function toggleAdminPanel() {
    adminPanel.classList.toggle('active');
    adminToggle.textContent = adminPanel.classList.contains('active') ? 
        'Hide Admin Panel' : 'Show Admin Panel';
}

// Toggle form based on content type
function toggleFormType() {
    const type = announcementType.value;
    
    if (type === 'announcement') {
        announcementForm.style.display = 'block';
        mediaForm.style.display = 'none';
    } else {
        announcementForm.style.display = 'none';
        mediaForm.style.display = 'block';
    }
}

// Preview selected media file
function previewMedia() {
    const file = mediaFile.files[0];
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    // Reset previews
    imagePreview.style.display = 'none';
    videoPreview.style.display = 'none';
    
    if (isImage) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else if (isVideo) {
        videoPreview.src = URL.createObjectURL(file);
        videoPreview.style.display = 'block';
    }
}

// Save content to Firestore
async function saveContent() {
    const type = announcementType.value;
    
    if (type === 'announcement') {
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        
        if (!title || !content) {
            alert('Please fill in all fields');
            return;
        }
        
        const announcement = {
            id: Date.now(),
            type: 'announcement',
            title,
            content,
            date: new Date().toLocaleDateString()
        };
        
        const success = await firestoreStorage.saveAnnouncement(announcement);
        if (success) {
            await loadAnnouncements();
            alert('Announcement saved successfully!');
        } else {
            alert('Failed to save announcement');
        }
        
    } else {
        const caption = document.getElementById('mediaCaption').value;
        const file = mediaFile.files[0];
        
        if (!file || !caption) {
            alert('Please select a file and enter a caption');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            const media = {
                id: Date.now(),
                type: type,
                caption,
                data: e.target.result,
                fileType: file.type
            };
            
            const success = await firestoreStorage.saveSlide(media);
            if (success) {
                await loadSlides();
                alert('Media saved successfully!');
            } else {
                alert('Failed to save media');
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    clearForm();
    await loadContentList();
}

// Update existing content in Firestore
async function updateContent() {
    const type = announcementType.value;
    
    if (type === 'announcement') {
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        
        if (!title || !content) {
            alert('Please fill in all fields');
            return;
        }
        
        const announcement = {
            id: currentEditId,
            type: 'announcement',
            title,
            content,
            date: new Date().toLocaleDateString()
        };
        
        const success = await firestoreStorage.updateAnnouncement(currentEditId, announcement);
        if (success) {
            await loadAnnouncements();
            alert('Announcement updated successfully!');
        } else {
            alert('Failed to update announcement');
        }
        
    } else {
        const caption = document.getElementById('mediaCaption').value;
        const file = mediaFile.files[0];
        
        if (!caption) {
            alert('Please enter a caption');
            return;
        }
        
        // If no new file is selected, keep the existing one
        if (!file) {
            const slides = await firestoreStorage.getSlides();
            const existingSlide = slides.find(slide => slide.id == currentEditId);
            
            if (existingSlide) {
                const media = {
                    id: currentEditId,
                    type: type,
                    caption,
                    data: existingSlide.data,
                    fileType: existingSlide.fileType
                };
                
                const success = await firestoreStorage.updateSlide(currentEditId, media);
                if (success) {
                    await loadSlides();
                    alert('Media updated successfully!');
                } else {
                    alert('Failed to update media');
                }
            }
        } else {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const media = {
                    id: currentEditId,
                    type: type,
                    caption,
                    data: e.target.result,
                    fileType: file.type
                };
                
                const success = await firestoreStorage.updateSlide(currentEditId, media);
                if (success) {
                    await loadSlides();
                    alert('Media updated successfully!');
                } else {
                    alert('Failed to update media');
                }
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    cancelEdit();
    await loadContentList();
}

// Cancel edit mode
function cancelEdit() {
    isEditing = false;
    currentEditId = null;
    saveBtn.style.display = 'block';
    updateBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    clearForm();
}

// Edit content
async function editContent(id, type) {
    isEditing = true;
    currentEditId = id;
    
    if (type === 'announcement') {
        const announcements = await firestoreStorage.getAnnouncements();
        const announcement = announcements.find(item => item.id == id);
        
        if (announcement) {
            announcementType.value = 'announcement';
            toggleFormType();
            document.getElementById('announcementTitle').value = announcement.title;
            document.getElementById('announcementContent').value = announcement.content;
        }
    } else {
        const slides = await firestoreStorage.getSlides();
        const slide = slides.find(item => item.id == id);
        
        if (slide) {
            announcementType.value = slide.type;
            toggleFormType();
            document.getElementById('mediaCaption').value = slide.caption;
            
            // Show preview of existing media
            if (slide.type === 'image') {
                imagePreview.src = slide.data;
                imagePreview.style.display = 'block';
            } else if (slide.type === 'video') {
                videoPreview.src = slide.data;
                videoPreview.style.display = 'block';
            }
        }
    }
    
    saveBtn.style.display = 'none';
    updateBtn.style.display = 'block';
    cancelBtn.style.display = 'block';
    
    // Scroll to form
    adminPanel.scrollIntoView({ behavior: 'smooth' });
}

// Delete content from Firestore
async function deleteContent(id, type) {
    if (confirm('Are you sure you want to delete this content?')) {
        let success = false;
        
        if (type === 'announcement') {
            success = await firestoreStorage.deleteAnnouncement(id);
            await loadAnnouncements();
        } else {
            success = await firestoreStorage.deleteSlide(id);
            await loadSlides();
        }
        
        if (success) {
            await loadContentList();
            alert('Content deleted successfully!');
        } else {
            alert('Failed to delete content');
        }
    }
}

// Load slides from Firestore
async function loadSlides() {
    const slides = await firestoreStorage.getSlides();
    slideshowContainer.innerHTML = '';
    
    if (slides.length === 0) {
        // Show empty state
        slideshowContainer.innerHTML = `
            <div class="slide active">
                <div class="no-content">
                    <i class="fas fa-images"></i>
                    <h3>No Slides Available</h3>
                    <p>Add some images or videos to get started</p>
                </div>
            </div>
        `;
        return;
    }
    
    slides.forEach((slide, index) => {
        const slideElement = document.createElement('div');
        slideElement.className = `slide ${index === 0 ? 'active' : ''}`;
        
        if (slide.type === 'image') {
            slideElement.innerHTML = `
                <img src="${slide.data}" alt="${slide.caption}">
                <div class="slide-caption">${slide.caption}</div>
            `;
        } else if (slide.type === 'video') {
            slideElement.innerHTML = `
                <video src="${slide.data}" controls></video>
                <div class="slide-caption">${slide.caption}</div>
            `;
        }
        
        slideshowContainer.appendChild(slideElement);
    });
    
    currentSlideIndex = 0;
}

// Load announcements from Firestore
async function loadAnnouncements() {
    const announcements = await firestoreStorage.getAnnouncements();
    announcementsContainer.innerHTML = '';
    
    if (announcements.length === 0) {
        // Show empty state
        announcementsContainer.innerHTML = `
            <div class="announcement">
                <div class="no-content">
                    <i class="fas fa-bullhorn"></i>
                    <h3>No Announcements</h3>
                    <p>Check back later for updates</p>
                </div>
            </div>
        `;
        return;
    }
    
    announcements.forEach(announcement => {
        const announcementElement = document.createElement('div');
        announcementElement.className = 'announcement';
        announcementElement.innerHTML = `
            <h3>${announcement.title}</h3>
            <div class="announcement-date">${announcement.date}</div>
            <footer>${announcement.content}</footer>
        `;
        announcementsContainer.appendChild(announcementElement);
    });
}

// Load content list for management from Firestore
async function loadContentList() {
    const announcements = await firestoreStorage.getAnnouncements();
    const slides = await firestoreStorage.getSlides();
    contentList.innerHTML = '';
    
    // Combine and sort all content by ID (newest first)
    const allContent = [...announcements, ...slides].sort((a, b) => b.id - a.id);
    
    if (allContent.length === 0) {
        contentList.innerHTML = '<div class="content-item">No content available</div>';
        return;
    }
    
    allContent.forEach(item => {
        const contentItem = document.createElement('div');
        contentItem.className = 'content-item';
        
        const title = item.type === 'announcement' ? item.title : item.caption;
        const type = item.type === 'announcement' ? 'Announcement' : 
                     item.type === 'image' ? 'Image Slide' : 'Video Slide';
        
        contentItem.innerHTML = `
            <div class="content-info">
                <div class="content-title">${title}</div>
                <div class="content-type">${type}</div>
            </div>
            <div class="content-actions">
                <button class="action-btn edit" onclick="editContent(${item.id}, '${item.type}')">Edit</button>
                <button class="action-btn delete" onclick="deleteContent(${item.id}, '${item.type}')">Delete</button>
            </div>
        `;
        
        contentList.appendChild(contentItem);
    });
}

// Clear form inputs
function clearForm() {
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementContent').value = '';
    document.getElementById('mediaCaption').value = '';
    document.getElementById('mediaFile').value = '';
    imagePreview.style.display = 'none';
    videoPreview.style.display = 'none';
}

// Slideshow functionality
function startSlideshow() {
    slideshowInterval = setInterval(showNextSlide, 5000);
}

function showNextSlide() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    slides[currentSlideIndex].classList.remove('active');
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    slides[currentSlideIndex].classList.add('active');
}

function showPreviousSlide() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    slides[currentSlideIndex].classList.remove('active');
    currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    slides[currentSlideIndex].classList.add('active');
}

function toggleSlideshow() {
    if (isPlaying) {
        clearInterval(slideshowInterval);
        pauseBtn.textContent = 'Play';
    } else {
        startSlideshow();
        pauseBtn.textContent = 'Pause';
    }
    isPlaying = !isPlaying;
}

function logout() {
    if (db && db.logoutUser) {
        db.logoutUser();
    }
    window.location.href = 'index.html';
}











// Safe localStorage functions with error handling - MOVED TO TOP
const safeStorage = {
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('localStorage set failed, trying sessionStorage:', e);
            // Fallback to sessionStorage
            try {
                sessionStorage.setItem(key, value);
                return true;
            } catch (e2) {
                console.error('Both storage methods failed:', e2);
                return false;
            }
        }
    },
    
    getItem: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage get failed, trying sessionStorage:', e);
            try {
                return sessionStorage.getItem(key);
            } catch (e2) {
                console.error('Both storage get methods failed:', e2);
                return null;
            }
        }
    },
    
    clearExpired: () => {
        try {
            // Clear old items to free up space - FIXED VERSION
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Only clear very old temporary items, not recent ones
                if (key && key.startsWith('temp_') && key.includes('old_')) {
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {
            console.warn('clearExpired failed:', e);
        }
    }
};

// Tab switching functionality
function switchTab(tab) {
    // Update tabs
    document.getElementById('login-tab').classList.toggle('active', tab === 'login');
    document.getElementById('signup-tab').classList.toggle('active', tab === 'signup');
    
    // Update forms
    document.getElementById('login-form').classList.toggle('active', tab === 'login');
    document.getElementById('signup-form').classList.toggle('active', tab === 'signup');
    
    // Reset form errors
    resetFormErrors();
}

// Password visibility toggle
function togglePassword(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    const icon = toggleElement.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleElement.querySelector('span').textContent = 'Hide Password';
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleElement.querySelector('span').textContent = 'Show Password';
    }
}

// Form validation functions
function validateLogin() {
    resetFormErrors();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    let isValid = true;
    
    // Email validation
    if (!email) {
        showFieldError('login-email', 'login-email-error');
        isValid = false;
    }
    
    // Password validation
    if (!password || password.length < 6) {
        showFieldError('login-password', 'login-password-error');
        isValid = false;
    }
    
    if (isValid) {
        // Simulate login process
        showError('Logging In', 'Please wait while we authenticate your credentials...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            if (email === 'admin' && password === 'password') {
                showError('Login Successful', 'Welcome to Tanzania Mining Investment Portal!', 'success');
                // In a real app, you would redirect to dashboard here
            } else {
                showError('Login Failed', 'Invalid email or password. Please try again.', 'error');
            }
        }, 1500);
    } else {
        showError('Validation Error', 'Please fix the errors in the form before submitting.', 'error');
    }
}

function validateSignup() {
    resetFormErrors();
    
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    let isValid = true;
    
    // Username validation
    if (!username || username.length < 3 || username.length > 20) {
        showFieldError('signup-username', 'signup-username-error');
        isValid = false;
    }
    
    // Email validation
    if (!email || !isValidEmail(email)) {
        showFieldError('signup-email', 'signup-email-error');
        isValid = false;
    }
    
    // Password validation
    if (!password || password.length < 8 || !hasUpperCase(password) || !hasLowerCase(password) || !hasNumber(password)) {
        showFieldError('signup-password', 'signup-password-error');
        isValid = false;
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
        showFieldError('signup-confirm-password', 'signup-confirm-password-error');
        isValid = false;
    }
    
    if (isValid) {
        showError('Account Creation', 'Your account is being created...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            showError('Account Created', 'Your account has been successfully created!', 'success');
            switchTab('login');
        }, 2000);
    } else {
        showError('Validation Error', 'Please fix the errors in the form before submitting.', 'error');
    }
}

// Helper functions for validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function hasUpperCase(str) {
    return /[A-Z]/.test(str);
}

function hasLowerCase(str) {
    return /[a-z]/.test(str);
}

function hasNumber(str) {
    return /\d/.test(str);
}

function showFieldError(fieldId, errorId) {
    document.getElementById(fieldId).classList.add('input-error');
    document.getElementById(errorId).classList.add('show');
}

function resetFormErrors() {
    // Remove error styling from all inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('input-error', 'input-success');
    });
    
    // Hide all error messages
    const errorMessages = document.querySelectorAll('.form-error');
    errorMessages.forEach(error => {
        error.classList.remove('show');
    });
}


// Landing page functions
function skipLanding() {
    safeStorage.setItem('landingSeen', 'true');
    showLogin();
}

function showLogin() {
    const landing = document.querySelector('.landing-container');
    const login = document.querySelector('.login-container');
    
    if (landing) landing.style.display = 'none';
    if (login) login.style.display = 'flex';
}

function showLanding() {
    const landing = document.querySelector('.landing-container');
    const login = document.querySelector('.login-container');
    
    if (landing) landing.style.display = 'flex';
    if (login) login.style.display = 'none';
}

// Animated safe error display function
function showError(title, message, type = 'error', duration = 5000) {
    // Create error container if it doesn't exist
    let errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
        
        // Add styles if not already present
        if (!document.getElementById('error-styles')) {
            const styles = document.createElement('style');
            styles.id = 'error-styles';
            styles.textContent = `
                .error-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                }
                
                .error-message {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                    padding: 16px;
                    border-left: 4px solid #e74c3c;
                    transform: translateX(400px) scale(0.8);
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }
                
                .error-message.show {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
                
                .error-message.hide {
                    transform: translateX(400px) scale(0.8);
                    opacity: 0;
                }
                
                .error-message.success {
                    border-left-color: #2ecc71;
                    background: linear-gradient(135deg, #f8fff9, #ffffff);
                }
                
                .error-message.warning {
                    border-left-color: #f39c12;
                    background: linear-gradient(135deg, #fffbf0, #ffffff);
                }
                
                .error-message.info {
                    border-left-color: #3498db;
                    background: linear-gradient(135deg, #f0f8ff, #ffffff);
                }
                
                .error-message.error {
                    border-left-color: #e74c3c;
                    background: linear-gradient(135deg, #fff5f5, #ffffff);
                }
                
                .error-content {
                    flex: 1;
                    padding-right: 30px;
                }
                
                .error-title {
                    font-weight: 600;
                    font-size: 16px;
                    margin-bottom: 4px;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .error-details {
                    font-size: 14px;
                    color: #5a6c7d;
                    line-height: 1.4;
                }
                
                .error-close {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #95a5a6;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .error-close:hover {
                    background: rgba(0, 0, 0, 0.1);
                    color: #e74c3c;
                    transform: scale(1.1);
                }
                
                .error-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #e74c3c, #c0392b);
                    width: 100%;
                    transform: scaleX(1);
                    transform-origin: left;
                    animation: progressShrink ${duration}ms linear forwards;
                }
                
                .error-message.success .error-progress {
                    background: linear-gradient(90deg, #2ecc71, #27ae60);
                }
                
                .error-message.warning .error-progress {
                    background: linear-gradient(90deg, #f39c12, #e67e22);
                }
                
                .error-message.info .error-progress {
                    background: linear-gradient(90deg, #3498db, #2980b9);
                }
                
                @keyframes progressShrink {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                .error-message.important {
                    animation: pulse 2s infinite, shake 0.5s ease;
                }
                
                .error-icon {
                    font-size: 16px;
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = `error-message ${type}`;
    
    // Get icon based on type
    const icons = {
        error: '⛔',
        warning: '⚠️',
        success: '✅',
        info: 'ℹ️'
    };
    
    errorMessage.innerHTML = `
        <div class="error-content">
            <div class="error-title">
                <span class="error-icon">${icons[type] || icons.info}</span>
                ${title}
            </div>
            <div class="error-details">${message}</div>
        </div>
        <button class="error-close" onclick="removeErrorMessage(this.parentElement)">×</button>
        <div class="error-progress"></div>
    `;
    
    // Add to container
    errorContainer.appendChild(errorMessage);
    
    // Animate in
    setTimeout(() => {
        errorMessage.classList.add('show');
    }, 10);
    
    // Auto remove after duration
    const autoRemoveTimer = setTimeout(() => {
        removeErrorMessage(errorMessage);
    }, duration);
    
    // Pause progress bar on hover
    errorMessage.addEventListener('mouseenter', () => {
        errorMessage.querySelector('.error-progress').style.animationPlayState = 'paused';
    });
    
    errorMessage.addEventListener('mouseleave', () => {
        errorMessage.querySelector('.error-progress').style.animationPlayState = 'running';
    });
    
    // Store timer reference for manual removal
    errorMessage._autoRemoveTimer = autoRemoveTimer;
}

// Function to remove error message with animation
function removeErrorMessage(element) {
    if (!element || !element.parentElement) return;
    
    // Clear auto-remove timer if exists
    if (element._autoRemoveTimer) {
        clearTimeout(element._autoRemoveTimer);
    }
    
    // Add hide class for exit animation
    element.classList.remove('show');
    element.classList.add('hide');
    
    // Remove from DOM after animation
    setTimeout(() => {
        if (element.parentElement) {
            element.parentElement.removeChild(element);
        }
    }, 400);
}

// Enhanced version with additional features
function showEnhancedError(title, message, options = {}) {
    const {
        type = 'error',
        duration = 5000,
        important = false,
        actions = [],
        onClose = null
    } = options;
    
    let errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
    }
    
    const errorMessage = document.createElement('div');
    errorMessage.className = `error-message ${type} ${important ? 'important' : ''}`;
    
    const icons = {
        error: '⛔',
        warning: '⚠️',
        success: '✅',
        info: 'ℹ️'
    };
    
    let actionsHTML = '';
    if (actions.length > 0) {
        actionsHTML = `
            <div class="error-actions">
                ${actions.map(action => 
                    `<button class="error-action-btn" onclick="${action.onClick}">${action.label}</button>`
                ).join('')}
            </div>
        `;
    }
    
    errorMessage.innerHTML = `
        <div class="error-content">
            <div class="error-title">
                <span class="error-icon">${icons[type] || icons.info}</span>
                ${title}
            </div>
            <div class="error-details">${message}</div>
            ${actionsHTML}
        </div>
        <button class="error-close" onclick="removeErrorMessage(this.parentElement)">×</button>
        <div class="error-progress"></div>
    `;
    
    errorContainer.appendChild(errorMessage);
    
    setTimeout(() => {
        errorMessage.classList.add('show');
    }, 10);
    
    const autoRemoveTimer = setTimeout(() => {
        if (onClose) onClose();
        removeErrorMessage(errorMessage);
    }, duration);
    
    errorMessage._autoRemoveTimer = autoRemoveTimer;
    
    // Enhanced hover effects
    errorMessage.addEventListener('mouseenter', () => {
        const progress = errorMessage.querySelector('.error-progress');
        if (progress) progress.style.animationPlayState = 'paused';
    });
    
    errorMessage.addEventListener('mouseleave', () => {
        const progress = errorMessage.querySelector('.error-progress');
        if (progress) progress.style.animationPlayState = 'running';
    });
}

// Add styles for enhanced version
if (!document.getElementById('enhanced-error-styles')) {
    const enhancedStyles = document.createElement('style');
    enhancedStyles.id = 'enhanced-error-styles';
    enhancedStyles.textContent = `
        .error-actions {
            margin-top: 12px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .error-action-btn {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .error-action-btn:hover {
            background: #f8f9fa;
            border-color: #3498db;
            transform: translateY(-1px);
        }
        
        .error-message.success .error-action-btn:hover {
            border-color: #2ecc71;
        }
        
        .error-message.error .error-action-btn:hover {
            border-color: #e74c3c;
        }
        
        .error-message.warning .error-action-btn:hover {
            border-color: #f39c12;
        }
    `;
    document.head.appendChild(enhancedStyles);
}