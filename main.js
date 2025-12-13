// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB2ZzKzKzKzKzKzKzKzKzKzKzKzKzKzKzK",
    authDomain: "tanzania-mining-investment.firebaseapp.com",
    databaseURL: "https://tanzania-mining-investment-default-rtdb.firebaseio.com",
    projectId: "tanzania-mining-investment",
    storageBucket: "tanzania-mining-investment.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase once globally
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// SINGLE Database instance - Global
let db = null;

// Navigation Link Click Handler
function setupNavigation() {
    // Sidebar navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            
            if (target) {
                // Close sidebar on mobile
                if (window.innerWidth < 768) {
                    closeSidebar('user');
                    closeSidebar('admin');
                    closeSidebar('super-admin');
                }
                
                // Switch to target section
                switchToSection(target);
            }
        });
    });
    
    // Bottom navigation items
    bottomItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            if (target) {
                switchToSection(target);
                
                // Update bottom navigation active state
                bottomItems.forEach(bottomItem => bottomItem.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });
}

// Switch to Section Function
function switchToSection(sectionId) {
    // Hide all content sections
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update URL hash
        window.location.hash = sectionId;
        
        // Update active state in sidebar
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === sectionId) {
                link.classList.add('active');
            }
        });
        
        // Update active state in bottom navigation
        bottomItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === sectionId) {
                item.classList.add('active');
            }
        });
    }
}

// Backdrop Click Handler
function setupBackdropClick() {
    Object.keys(backdrops).forEach(type => {
        const backdrop = backdrops[type];
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                closeSidebar(type);
            });
        }
    });
}

// Close Button Event Listeners
function setupCloseButtons() {
    Object.keys(closeButtons).forEach(type => {
        const closeBtn = closeButtons[type];
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeSidebar(type);
            });
        }
    });
}

// Keyboard Navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Close sidebar on Escape key
        if (e.key === 'Escape') {
            Object.keys(sidebars).forEach(type => {
                closeSidebar(type);
            });
        }
        
        // Navigate tabs with arrow keys
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const activeTab = document.querySelector('.dashboard-tab.active');
            if (activeTab) {
                const tabs = Array.from(dashboardTabs);
                const currentIndex = tabs.indexOf(activeTab);
                let nextIndex;
                
                if (e.key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % tabs.length;
                } else {
                    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                }
                
                const nextTab = tabs[nextIndex];
                const tabId = nextTab.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 
                             nextTab.getAttribute('data-target');
                
                if (tabId) {
                    switchTab(tabId);
                }
            }
        }
    });
}

// Update Database class to handle Firestore operations
class Database {
    constructor() {
        this.db = firebase.firestore();
        this.currentUser = null;
        
        this.formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-TZ', {
                style: 'currency',
                currency: 'TZS'
            }).format(amount);
        };
        
        this.formatNumber = (number) => {
            return new Intl.NumberFormat('en-TZ').format(number);
        };
    }
    
    // ========== USER MANAGEMENT WITH FIRESTORE ==========
    
    // Get all users from Firestore
    async getUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.docs.map(doc => ({
                id: parseInt(doc.id),
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }
    
    // Get user by ID from Firestore
    async findUserById(id) {
        try {
            const doc = await this.db.collection('users').doc(id.toString()).get();
            if (doc.exists) {
                return {
                    id: parseInt(doc.id),
                    ...doc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            return null;
        }
    }
    
    // Update user in Firestore
    async updateUser(userId, updates) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            
            // Add timestamp
            updates.updated_at = firebase.firestore.FieldValue.serverTimestamp();
            
            await userRef.update(updates);
            return true;
        } catch (error) {
            console.error('Error updating user:', error);
            return false;
        }
    }
    
    // Delete user from Firestore
    async deleteUser(userId) {
        try {
            await this.db.collection('users').doc(userId.toString()).delete();
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }
    
    // ========== INVESTMENT TRACKING FUNCTIONS ==========
    
    // Get user investments from Firestore
    async getUserInvestments(userId) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) return [];
            
            const userData = userDoc.data();
            return userData.investments || [];
        } catch (error) {
            console.error('Error getting user investments:', error);
            return [];
        }
    }
    
    // Update user investments in Firestore
    async updateUserInvestments(userId, investments) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            await userRef.update({
                investments: investments,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating user investments:', error);
            return false;
        }
    }
    
    // ========== HIGHEST INVESTOR DETECTION ==========
    
    // Get highest investors for a specific time period
    async getHighestInvestors(period = 'weekly') {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const investors = [];
            
            const now = new Date();
            let startDate;
            
            // Define date ranges
            switch (period.toLowerCase()) {
                case 'weekly':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'monthly':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
                case 'yearly':
                    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    break;
                default:
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }
            
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                const userId = parseInt(doc.id);
                
                if (!user.investments || !Array.isArray(user.investments)) return;
                
                let totalInvestedInPeriod = 0;
                let totalProfitInPeriod = 0;
                
                user.investments.forEach(investment => {
                    const investmentDate = new Date(investment.startTime || investment.date);
                    
                    // Check if investment is within the period
                    if (investmentDate >= startDate) {
                        totalInvestedInPeriod += investment.cost || investment.amount || 0;
                        
                        // Calculate profit for this investment
                        if (investment.completed) {
                            totalProfitInPeriod += investment.finalProfit || 0;
                        } else {
                            const profit = calculateCurrentProfit(investment);
                            totalProfitInPeriod += profit;
                        }
                    }
                });
                
                if (totalInvestedInPeriod > 0) {
                    investors.push({
                        id: userId,
                        username: user.username,
                        email: user.email,
                        totalInvested: totalInvestedInPeriod,
                        totalProfit: totalProfitInPeriod,
                        investmentCount: user.investments.length,
                        profileImage: user.profileImage || null
                    });
                }
            });
            
            // Sort by total invested (descending)
            investors.sort((a, b) => b.totalInvested - a.totalInvested);
            
            return investors;
            
        } catch (error) {
            console.error(`Error getting ${period} highest investors:`, error);
            return [];
        }
    }
    
    // Get top investors for all periods
    async getTopInvestors() {
        try {
            const [weekly, monthly, yearly] = await Promise.all([
                this.getHighestInvestors('weekly'),
                this.getHighestInvestors('monthly'),
                this.getHighestInvestors('yearly')
            ]);
            
            return {
                weekly: weekly.slice(0, 10), // Top 10 weekly
                monthly: monthly.slice(0, 10), // Top 10 monthly
                yearly: yearly.slice(0, 10) // Top 10 yearly
            };
        } catch (error) {
            console.error('Error getting top investors:', error);
            return { weekly: [], monthly: [], yearly: [] };
        }
    }
    
    // Get investment leaderboard
    async getInvestmentLeaderboard(limit = 20) {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const leaderboard = [];
            
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                const userId = parseInt(doc.id);
                
                if (!user.investments || !Array.isArray(user.investments)) return;
                
                let totalInvested = 0;
                let totalProfit = 0;
                let activeInvestments = 0;
                let completedInvestments = 0;
                
                user.investments.forEach(investment => {
                    totalInvested += investment.cost || investment.amount || 0;
                    
                    if (investment.completed) {
                        completedInvestments++;
                        totalProfit += investment.finalProfit || 0;
                    } else {
                        activeInvestments++;
                        const profit = calculateCurrentProfit(investment);
                        totalProfit += profit;
                    }
                });
                
                if (totalInvested > 0) {
                    leaderboard.push({
                        id: userId,
                        username: user.username,
                        email: user.email,
                        totalInvested: totalInvested,
                        totalProfit: totalProfit,
                        activeInvestments: activeInvestments,
                        completedInvestments: completedInvestments,
                        totalInvestments: user.investments.length,
                        profileImage: user.profileImage || null,
                        rank: 0 // Will be calculated after sorting
                    });
                }
            });
            
            // Sort by total profit (descending)
            leaderboard.sort((a, b) => b.totalProfit - a.totalProfit);
            
            // Add ranks
            leaderboard.forEach((item, index) => {
                item.rank = index + 1;
                item.position = index + 1;
            });
            
            return leaderboard.slice(0, limit);
            
        } catch (error) {
            console.error('Error getting investment leaderboard:', error);
            return [];
        }
    }
    
    // Record investment achievement
    async recordInvestmentAchievement(userId, achievementType, amount, details = {}) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            
            const achievement = {
                id: Date.now(),
                type: achievementType,
                amount: amount,
                date: new Date().toISOString(),
                details: details,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Add to user's achievements array
            await userRef.update({
                achievements: firebase.firestore.FieldValue.arrayUnion(achievement),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return achievement;
            
        } catch (error) {
            console.error('Error recording investment achievement:', error);
            return null;
        }
    }

    
    // Add this new method:
    async createRewardTransaction(userId, amount, rewardCode) {
        try {
            // Create a transaction for the reward
            const transaction = await this.createTransaction(
                userId,
                'reward',
                amount,
                'reward_code',
                {
                    description: `Reward claim using code: ${rewardCode}`,
                    rewardCode: rewardCode,
                    autoApproved: true
                }
            );
            
            // Auto-approve reward transactions
            await this.updateTransactionStatus(transaction.id, 'approved', 'system');
            
            return transaction;
        } catch (error) {
            console.error('Error creating reward transaction:', error);
            throw error;
        }
    }



    // Add this function to your Database class
async awardReferralBonus(depositingUserId, depositAmount) {
    try {
        const userDoc = await this.db.collection('users').doc(depositingUserId.toString()).get();
        if (!userDoc.exists) return false;
        
        const user = userDoc.data();
        const referrerCode = user.referred_by;
        
        if (!referrerCode) return false;
        
        // Find referrer
        const referrer = await this.findUserByReferralCode(referrerCode);
        if (!referrer) return false;
        
        // Check if this is the user's first deposit
        const userTransactions = user.transactions || [];
        const previousDeposits = userTransactions.filter(t =>
            t.type === 'deposit' && t.status === 'approved'
        );
        
        if (previousDeposits.length > 0) {
            // Not the first deposit
            return false;
        }
        
        // Calculate 10% bonus
        const referralBonus = depositAmount * 0.10;
        
        // Update referrer's balance
        await this.updateUserBalance(referrer.id, referralBonus);
        
        // Create bonus transaction
        await this.createTransaction(referrer.id, 'deposit', referralBonus, 'referral_bonus', {
            description: `10% referral bonus for ${user.username}'s first deposit`,
            referred_user_id: depositingUserId,
            referred_username: user.username,
            first_deposit_amount: depositAmount,
            bonus_percentage: 10
        });
        
        // Update referrer's referral record
        const referrerRef = this.db.collection('users').doc(referrer.id.toString());
        const referrerDoc = await referrerRef.get();
        const referrerData = referrerDoc.data();
        
        if (referrerData.referrals && Array.isArray(referrerData.referrals)) {
            const updatedReferrals = referrerData.referrals.map(ref => {
                if (ref.id === depositingUserId) {
                    return {
                        ...ref,
                        bonus_pending: false,
                        first_deposit_amount: depositAmount,
                        bonus_amount: referralBonus,
                        bonus_paid: true,
                        bonus_paid_date: new Date().toISOString()
                    };
                }
                return ref;
            });
            
            await referrerRef.update({
                referrals: updatedReferrals,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        return true;
    } catch (error) {
        console.error('Error awarding referral bonus:', error);
        return false;
    }
}

    async initDatabase() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            
            if (usersSnapshot.empty) {
                const initialUsers = [
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
                        has_received_referral_bonus: false,
                        created_at: firebase.firestore.FieldValue.serverTimestamp()
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
                        has_received_referral_bonus: false,
                        created_at: firebase.firestore.FieldValue.serverTimestamp()
                    }
                ];

                for (const user of initialUsers) {
                    await this.db.collection('users').doc(user.id.toString()).set(user);
                }

                await this.db.collection('counters').doc('global').set({
                    next_user_id: 3,
                    next_transaction_id: 1,
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }
    
    async initDatabase() {
    try {
        const usersSnapshot = await this.db.collection('users').get();
        const users = [];
        
        usersSnapshot.forEach(doc => {
            users.push({
                id: parseInt(doc.id),
                ...doc.data()
            });
        });
        
        // Check if kingharuni420 exists in Firebase, if not add it
        const kingHaruniExists = users.some(user => user.email === 'kingharuni420@gmail.com');
        
        if (!kingHaruniExists) {
            console.log('Creating super admin user in Firebase...');
            
            const superAdmin = {
                id: 1, // Fixed ID for super admin
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
                has_received_referral_bonus: false,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Add to Firebase
            await this.db.collection('users').doc('1').set(superAdmin);
            
            console.log('Super admin created successfully in Firebase');
        } else {
            console.log('Super admin already exists in Firebase');
        }
        
        // Also check and add regular admin if needed
        const regularAdminExists = users.some(user => user.email === 'mining.investment.tanzania@proton.me');
        
        if (!regularAdminExists) {
            console.log('Creating regular admin user in Firebase...');
            
            const regularAdmin = {
                id: 2, // Fixed ID for regular admin
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
                has_received_referral_bonus: false,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Add to Firebase
            await this.db.collection('users').doc('2').set(regularAdmin);
            
            console.log('Regular admin created successfully in Firebase');
        } else {
            console.log('Regular admin already exists in Firebase');
        }
        
        // Initialize counters
        const counterRef = this.db.collection('counters').doc('global');
        const counterDoc = await counterRef.get();
        
        if (!counterDoc.exists) {
            await counterRef.set({
                next_user_id: 3, // Start from 3 since we already have users 1 and 2
                next_transaction_id: 1,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Counters initialized in Firebase');
        } else {
            console.log('Counters already exist in Firebase');
        }
        
    } catch (error) {
        console.error('Error initializing Firebase database:', error);
        throw error;
    }
}

    async getUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.docs.map(doc => ({
                id: parseInt(doc.id),
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

async findUserByEmailOrUsername(identifier) {
    try {
        const identifierLower = identifier.toLowerCase();
        
        // Query for email
        const emailQuery = await this.db.collection('users')
            .where('email', '==', identifierLower)
            .limit(1)
            .get();
        
        if (!emailQuery.empty) {
            const doc = emailQuery.docs[0];
            return {
                id: parseInt(doc.id),
                ...doc.data()
            };
        }
        
        // Query for username
        const usernameQuery = await this.db.collection('users')
            .where('username', '==', identifierLower)
            .limit(1)
            .get();
        
        if (!usernameQuery.empty) {
            const doc = usernameQuery.docs[0];
            return {
                id: parseInt(doc.id),
                ...doc.data()
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error in findUserByEmailOrUsername:', error);
        return null;
    }
}

    async findUserById(id) {
        try {
            const doc = await this.db.collection('users').doc(id.toString()).get();
            if (doc.exists) {
                return {
                    id: parseInt(doc.id),
                    ...doc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            return null;
        }
    }

    async findUserByReferralCode(referralCode) {
        try {
            const snapshot = await this.db.collection('users')
                .where('referral_code', '==', referralCode.toUpperCase())
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                return null;
            }
            
            const doc = snapshot.docs[0];
            return {
                id: parseInt(doc.id),
                ...doc.data()
            };
        } catch (error) {
            console.error('Error finding user by referral code:', error);
            return null;
        }
    }

async getNextId() {
    try {
        console.log('Getting next user ID...');
        
        const counterRef = this.db.collection('counters').doc('global');
        const counterDoc = await counterRef.get();
        
        if (!counterDoc.exists) {
            console.log('Counters document not found, creating...');
            // Start from 3 since we have users 1 and 2 as admins
            await counterRef.set({
                next_user_id: 3,
                next_transaction_id: 1,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Created counters document, returning ID: 3');
            return 3;
        }
        
        const data = counterDoc.data();
        const currentId = data.next_user_id || 3;
        
        console.log('Current next ID:', currentId);
        
        // Increment and update
        await counterRef.update({
            next_user_id: currentId + 1,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Updated next ID to:', currentId + 1);
        return currentId;
        
    } catch (error) {
        console.error('Error getting next ID:', error);
        // Fallback: use timestamp-based ID
        const fallbackId = Math.floor(Date.now() / 1000);
        console.log('Using fallback ID:', fallbackId);
        return fallbackId;
    }
}

    async generateUniqueReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 20) {
            code = '';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            const existingUser = await this.findUserByReferralCode(code);
            if (!existingUser) {
                isUnique = true;
            }
            attempts++;
        }
        
        if (!isUnique) {
            code += Date.now().toString().slice(-4);
        }
        
        return code;
    }

async createUser(userData) {
    try {
        console.log('Creating user in database:', userData.username);
        
        // Get next user ID
        const nextId = await this.getNextId();
        console.log('Next user ID:', nextId);
        
        // Generate unique referral code
        const referralCode = await this.generateUniqueReferralCode();
        console.log('Generated referral code:', referralCode);
        
        // Create user object
        const newUser = {
            id: nextId,
            username: userData.username.toLowerCase(),
            email: userData.email.toLowerCase(),
            password: userData.password,
            admin_password: '',
            referral_code: referralCode,
            referred_by: userData.referred_by || null,
            join_date: new Date().toISOString(),
            status: 'active',
            is_admin: false,
            is_super_admin: false,
            admin_role: '',
            permissions: [],
            balance: 0,
            investments: [],
            referrals: [],
            transactions: [],
            has_received_referral_bonus: false,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('Saving user to Firestore:', newUser);
        
        // Save to Firestore
        await this.db.collection('users').doc(nextId.toString()).set(newUser);
        
        console.log('User saved successfully');
        return newUser;
        
    } catch (error) {
        console.error('Error in createUser:', error);
        throw new Error(`Failed to create user: ${error.message}`);
    }
}

    async addReferralToUser(userId, referralData) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            
            await userRef.update({
                referrals: firebase.firestore.FieldValue.arrayUnion(referralData),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return true;
        } catch (error) {
            console.error('Error adding referral to user:', error);
            return false;
        }
    }
    
// Add these separate methods to your Database class
async findUserByEmail(email) {
    try {
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return null;
        }
        
        const emailLower = email.toLowerCase();
        console.log('Searching for email:', emailLower);
        
        const emailSnapshot = await this.db.collection('users')
            .where('email', '==', emailLower)
            .limit(1)
            .get();
        
        if (emailSnapshot.empty) {
            console.log('Email not found:', emailLower);
            return null;
        }
        
        const doc = emailSnapshot.docs[0];
        const userData = doc.data();
        console.log('Email found:', userData.email);
        
        return {
            id: parseInt(doc.id),
            ...userData
        };
        
    } catch (error) {
        console.error('Error finding user by email:', error);
        return null;
    }
}

async findUserByUsername(username) {
    try {
        if (!username || typeof username !== 'string') {
            return null;
        }
        
        const usernameLower = username.toLowerCase();
        console.log('Searching for username:', usernameLower);
        
        const usernameSnapshot = await this.db.collection('users')
            .where('username', '==', usernameLower)
            .limit(1)
            .get();
        
        if (usernameSnapshot.empty) {
            console.log('Username not found:', usernameLower);
            return null;
        }
        
        const doc = usernameSnapshot.docs[0];
        const userData = doc.data();
        console.log('Username found:', userData.username);
        
        return {
            id: parseInt(doc.id),
            ...userData
        };
        
    } catch (error) {
        console.error('Error finding user by username:', error);
        return null;
    }
}

// Keep the combined method for login, but make it more reliable
async findUserByEmailOrUsername(identifier) {
    if (!identifier || typeof identifier !== 'string') {
        return null;
    }
    
    const identifierLower = identifier.toLowerCase();
    
    // Try email first
    if (identifierLower.includes('@')) {
        return await this.findUserByEmail(identifierLower);
    }
    
    // Try username
    return await this.findUserByUsername(identifierLower);
}


    async updateUserBalance(userId, amount) {
        try {
            const userRef = this.db.collection('users').doc(userId.toString());
            
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(amount),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return true;
        } catch (error) {
            console.error('Error updating user balance:', error);
            return false;
        }
    }

async getNextTransactionId() {
    try {
        const counterRef = this.db.collection('counters').doc('global');
        
        // Use transaction to ensure atomic update
        return await this.db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            
            let nextId;
            if (!counterDoc.exists) {
                nextId = 1;
                transaction.set(counterRef, {
                    next_transaction_id: 2,
                    next_user_id: 3,
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                const data = counterDoc.data();
                nextId = data.next_transaction_id || 1;
                transaction.update(counterRef, {
                    next_transaction_id: nextId + 1,
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            return nextId;
        });
        
    } catch (error) {
        console.error('Error getting next transaction ID:', error);
        // Fallback to timestamp-based ID
        return Date.now();
    }
}

async createTransaction(userId, type, amount, method, details = {}) {
    try {
        console.log('Creating transaction:', { userId, type, amount, method, details });
        
        const userRef = this.db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            console.error('User not found for ID:', userId);
            throw new Error('User not found');
        }
        
        const user = userDoc.data();
        
        // Get next transaction ID
        const transactionId = await this.getNextTransactionId();
        const currentTimestamp = new Date().toISOString();
        
        // Create transaction object WITHOUT FieldValue.serverTimestamp() inside arrays
        const transaction = {
            id: transactionId,
            userId: userId,
            username: user.username || '',
            email: user.email || '',
            type: type,
            amount: parseFloat(amount) || 0,
            method: method,
            status: 'pending',
            date: currentTimestamp, // Use string timestamp instead of FieldValue
            details: {
                ...details,
                createdBy: user.username || '',
                createdAt: currentTimestamp // Use string timestamp
            },
            adminActionDate: null,
            adminId: null,
            created_at: currentTimestamp // Use string timestamp
        };
        
        console.log('Transaction object created:', transaction);
        
        // Get current transactions or initialize empty array
        const currentTransactions = user.transactions || [];
        
        // Add new transaction to array
        currentTransactions.push(transaction);
        
        // Update user document with new transactions array
        await userRef.update({
            transactions: currentTransactions,
            updated_at: firebase.firestore.FieldValue.serverTimestamp() // This is OK - not inside array
        });
        
        console.log('Transaction saved successfully:', transactionId);
        
        return transaction;
        
    } catch (error) {
        console.error('Error creating transaction:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        
        throw new Error(`Failed to create transaction: ${error.message}`);
    }
}

    async getUserTransactions(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId.toString()).get();
            if (!userDoc.exists) return [];
            
            const user = userDoc.data();
            if (!user.transactions || !Array.isArray(user.transactions)) return [];
            
            return user.transactions.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });
        } catch (error) {
            console.error('Error getting user transactions:', error);
            return [];
        }
    }

    async getAllTransactions() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            const allTransactions = [];
            
            usersSnapshot.docs.forEach(userDoc => {
                const user = userDoc.data();
                if (user.transactions && Array.isArray(user.transactions)) {
                    user.transactions.forEach(transaction => {
                        allTransactions.push({
                            ...transaction,
                            username: user.username,
                            email: user.email,
                            userId: parseInt(userDoc.id)
                        });
                    });
                }
            });
            
            return allTransactions.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA;
            });
        } catch (error) {
            console.error('Error getting all transactions:', error);
            return [];
        }
    }

// In your Database class, update the getPendingTransactions method
async getPendingTransactions() {
    try {
        console.log('🔍 Fetching pending transactions from Firestore...');
        
        const usersSnapshot = await this.db.collection('users').get();
        const pendingTransactions = [];
        
        usersSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            const userId = parseInt(userDoc.id);
            
            if (userData.transactions && Array.isArray(userData.transactions)) {
                userData.transactions.forEach(transaction => {
                    // CRITICAL: Check for 'pending' status (lowercase)
                    if (transaction.status === 'pending') {
                        console.log('✅ Found pending transaction:', {
                            id: transaction.id,
                            userId: userId,
                            username: userData.username,
                            type: transaction.type,
                            amount: transaction.amount
                        });
                        
                        pendingTransactions.push({
                            id: transaction.id,
                            userId: userId,
                            username: userData.username || 'Unknown',
                            email: userData.email || '',
                            type: transaction.type,
                            amount: parseFloat(transaction.amount) || 0,
                            method: transaction.method || '',
                            status: transaction.status,
                            date: transaction.date || new Date().toISOString(),
                            details: transaction.details || {},
                            adminActionDate: transaction.adminActionDate || null,
                            adminId: transaction.adminId || null
                        });
                    }
                });
            }
        });
        
        console.log(`📊 Total pending transactions found: ${pendingTransactions.length}`);
        
        // Sort by date (newest first)
        return pendingTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
    } catch (error) {
        console.error('❌ Error fetching pending transactions:', error);
        return [];
    }
}

async updateTransactionStatus(transactionId, status, adminId) {
    try {
        console.log('Updating transaction status:', { transactionId, status, adminId });
        
        const usersSnapshot = await this.db.collection('users').get();
        let updated = false;
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const transactions = userData.transactions || [];
            const transactionIndex = transactions.findIndex(t => t.id === transactionId);
            
            if (transactionIndex !== -1) {
                const transaction = transactions[transactionIndex];
                const oldStatus = transaction.status;
                const currentTimestamp = new Date().toISOString();
                
                console.log('Found transaction:', {
                    id: transaction.id,
                    type: transaction.type,
                    oldStatus: oldStatus,
                    newStatus: status,
                    amount: transaction.amount
                });
                
                // Update transaction in array WITHOUT FieldValue.serverTimestamp()
                transactions[transactionIndex] = {
                    ...transaction,
                    status: status,
                    adminActionDate: currentTimestamp, // Use string timestamp
                    adminId: adminId,
                    updated_at: currentTimestamp // Add updated timestamp
                };
                
                // Calculate balance adjustment
                let balanceAdjustment = 0;
                
                if (transaction.type === 'deposit' && status === 'approved' && oldStatus !== 'approved') {
                    // Approve deposit: add to balance
                    balanceAdjustment = parseFloat(transaction.amount) || 0;
                    console.log('Deposit approved, adding to balance:', balanceAdjustment);
                } else if (transaction.type === 'withdrawal') {
                    if (status === 'rejected' && oldStatus === 'pending') {
                        // Reject withdrawal: add back to balance
                        balanceAdjustment = parseFloat(transaction.amount) || 0;
                        console.log('Withdrawal rejected, adding back to balance:', balanceAdjustment);
                    }
                    // Note: For withdrawal approval, amount was already deducted when requested
                }
                
                // Update user document
                const userRef = this.db.collection('users').doc(userDoc.id);
                const updateData = {
                    transactions: transactions, // This is the updated array WITHOUT FieldValue inside
                    updated_at: firebase.firestore.FieldValue.serverTimestamp() // This is OK - not inside array
                };
                
                // Only update balance if there's an adjustment
                if (balanceAdjustment !== 0) {
                    updateData.balance = firebase.firestore.FieldValue.increment(balanceAdjustment);
                    
                    // Update current user if it's the same user
                    if (this.currentUser && this.currentUser.id === parseInt(userDoc.id)) {
                        this.currentUser.balance += balanceAdjustment;
                        console.log('Updated current user balance:', this.currentUser.balance);
                    }
                }
                
                await userRef.update(updateData);
                console.log('Transaction status updated successfully');
                updated = true;
                break;
            }
        }
        
        return updated;
        
    } catch (error) {
        console.error('Error updating transaction status:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        return false;
    }
}

    async getTotalUsers() {
        try {
            const snapshot = await this.db.collection('users').get();
            return snapshot.size;
        } catch (error) {
            console.error('Error getting total users:', error);
            return 0;
        }
    }

    async getTotalDeposits() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            let total = 0;
            
            usersSnapshot.docs.forEach(userDoc => {
                const user = userDoc.data();
                if (user.transactions && Array.isArray(user.transactions)) {
                    user.transactions.forEach(transaction => {
                        if (transaction.type === 'deposit' && transaction.status === 'approved') {
                            total += parseFloat(transaction.amount) || 0;
                        }
                    });
                }
            });
            
            return total;
        } catch (error) {
            console.error('Error getting total deposits:', error);
            return 0;
        }
    }
   
    async getTotalWithdrawals() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            let total = 0;
            
            usersSnapshot.docs.forEach(userDoc => {
                const user = userDoc.data();
                if (user.transactions && Array.isArray(user.transactions)) {
                    user.transactions.forEach(transaction => {
                        if (transaction.type === 'withdrawal' && transaction.status === 'approved') {
                            total += parseFloat(transaction.amount) || 0;
                        }
                    });
                }
            });
            
            return total;
        } catch (error) {
            console.error('Error getting total withdrawals:', error);
            return 0;
        }
    }

    isSuperAdmin(user) {
        return user && user.email === 'kingharuni420@gmail.com' && user.is_super_admin === true;
    }

    // Add method to get super admin
    getSuperAdmin() {
        const users = this.getUsers();
        return users.find(user => user.email === 'kingharuni420@gmail.com');
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
}

// Initialize database only once
function initializeDatabase() {
    if (!db) {
        db = new Database();
        window.db = db; // Make it globally available
        
        // Initialize database
        db.initDatabase().then(() => {
            console.log('Database initialized successfully');
        });
    }
    return db;
}

        



// ===== HAMBURGER NAVIGATION FUNCTIONS =====

// Toggle sidebar function
function toggleSidebar(type) {
    const uiwrap = document.getElementById(`${type}-uiwrap`);
    const sidebar = document.getElementById(`${type}-side`);
    const hamburger = document.getElementById(`${type}-hamburger`);
    
    if (!uiwrap || !sidebar) return;
    
    uiwrap.classList.toggle('active');
    sidebar.classList.toggle('active');
    
    if (hamburger) {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
    }
    
    // Update hamburger icon
    if (hamburger && hamburger.querySelector('i')) {
        const icon = hamburger.querySelector('i');
        if (uiwrap.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}

// Close sidebar function
function closeSidebar(type) {
    const uiwrap = document.getElementById(`${type}-uiwrap`);
    const sidebar = document.getElementById(`${type}-side`);
    const hamburger = document.getElementById(`${type}-hamburger`);
    
    if (uiwrap) uiwrap.classList.remove('active');
    if (sidebar) sidebar.classList.remove('active');
    
    if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'false');
        const icon = hamburger.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}

// Function to determine which sidebar is currently open
function getActiveSidebarType() {
    if (document.getElementById('user-uiwrap')?.classList.contains('active')) return 'user';
    if (document.getElementById('admin-uiwrap')?.classList.contains('active')) return 'admin';
    if (document.getElementById('super-admin-uiwrap')?.classList.contains('active')) return 'super-admin';
    return null;
}

// Auto close hamburger after navigation link is clicked
function autoCloseHamburgerAfterNav() {
    const activeSidebar = getActiveSidebarType();
    if (activeSidebar) {
        closeSidebar(activeSidebar);
    }
}

// Initialize sidebar event listeners
function initializeSidebars() {
    // Close buttons
    document.getElementById('user-closeSide')?.addEventListener('click', () => closeSidebar('user'));
    document.getElementById('admin-closeSide')?.addEventListener('click', () => closeSidebar('admin'));
    document.getElementById('super-admin-closeSide')?.addEventListener('click', () => closeSidebar('super-admin'));
    
    // Backdrop clicks
    document.getElementById('user-back')?.addEventListener('click', () => closeSidebar('user'));
    document.getElementById('admin-back')?.addEventListener('click', () => closeSidebar('admin'));
    document.getElementById('super-admin-back')?.addEventListener('click', () => closeSidebar('super-admin'));
    
    // Navigation link clicks - AUTO CLOSE HAMBURGER
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target section from data-target attribute
            const target = this.getAttribute('data-target');
            if (target) {
                switchToSection(target);
            }
            
            // AUTO CLOSE HAMBURGER DROPDOWN
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Bottom bar item clicks - AUTO CLOSE HAMBURGER
    document.querySelectorAll('.bottom-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.bottom-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Get target section
            const target = this.getAttribute('data-target');
            if (target) {
                switchToSection(target);
            }
            
            // AUTO CLOSE HAMBURGER DROPDOWN
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Handle clicks on sidebar action buttons (deposit, withdraw, etc.)
    document.querySelectorAll('.sidebar-action-btn').forEach(button => {
        button.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Handle clicks on sidebar logout link
    document.querySelectorAll('.nav-link.logout').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
            autoCloseHamburgerAfterNav();
        });
    });
}

// ===== TAB NAVIGATION FUNCTIONALITY =====

function switchToSection(sectionId) {
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active nav links in sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-target') === sectionId) {
            link.classList.add('active');
        }
    });
    
    // Update active bottom bar items
    document.querySelectorAll('.bottom-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Update dashboard title
    updateDashboardTitle(sectionId);
    
    // Load section-specific data
    loadSectionData(sectionId);
    
    // Scroll to top of the section
    if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateDashboardTitle(sectionId) {
    const titleMap = {
        'dashboard': 'Investment Dashboard',
        'profile': 'Profile Settings',
        'marketplace': 'Mineral Marketplace',
        'myinvestment': 'My Investments',
        'referrals': 'Referral Network',
        'history': 'Transaction History',
        'rewards': 'Daily Rewards',
        'support': 'Contact Support',
        'about': 'About Us',
        'faq': 'Frequently Asked Questions',
        'admin-approvals': 'Admin Approvals',
        'admin-history': 'Transaction History',
        'admin-chat': 'Chat Support',
        'rewards-management': 'Rewards Management',
        'admin-announcements': 'announcement Management',
        'reports': 'Reports & Analytics',
        'admin-settings': 'Admin Settings',
        'admin-calculator': 'Admin Calculator',
        'super-admin-overview': 'System Overview',
        'admin-management': 'Admin Management',
        'user-management': 'User Management',
        'task-management': 'Task Management',
        'system-monitoring': 'System Monitoring',
        'super-admin-settings': 'System Settings',
        'super-admin-reports': 'Full Reports',
        'system-backup': 'Backup System'
    };
    
    // Update user dashboard title
    const userTitleElement = document.getElementById('user-dashboard-title');
    if (userTitleElement && titleMap[sectionId]) {
        userTitleElement.textContent = titleMap[sectionId];
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar functionality
    initializeSidebars();
    
    // Set default active section if none is active
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) {
        // Set dashboard as default
        switchToSection('dashboard');
    }
    
    // Add event listeners for other navigation elements that should close hamburger
    
    // Profile dropdown in header
    document.querySelector('.user-profile')?.addEventListener('click', function() {
        autoCloseHamburgerAfterNav();
    });
    
    // Dashboard tabs within profile section
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            if (target) {
                switchToSection(target);
            }
            autoCloseHamburgerAfterNav();
        });
    });
    
    // About page tabs
    document.querySelectorAll('.about-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            // Your about tab switching logic here
            autoCloseHamburgerAfterNav();
        });
    });
    
    // FAQ category buttons
    document.querySelectorAll('.faq-category').forEach(category => {
        category.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // FAQ question toggles
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Modal close buttons (they might be inside hamburger)
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Quick action buttons in profile dropdown
    document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', function() {
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Gamified nav items in profile dropdown
    document.querySelectorAll('.gamified-nav .nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('onclick')?.match(/switchToSection\('(\w+)'\)/)?.[1];
            if (target) {
                switchToSection(target);
            }
            autoCloseHamburgerAfterNav();
        });
    });
    
    // Close hamburger when clicking outside on mobile
    document.addEventListener('click', function(event) {
        // Check if hamburger is open and click is outside
        const activeSidebar = getActiveSidebarType();
        if (activeSidebar && window.innerWidth <= 768) {
            const sidebar = document.getElementById(`${activeSidebar}-side`);
            const hamburger = document.getElementById(`${activeSidebar}-hamburger`);
            
            if (sidebar && !sidebar.contains(event.target) && 
                hamburger && !hamburger.contains(event.target)) {
                closeSidebar(activeSidebar);
            }
        }
    });
});

// For backward compatibility with onclick handlers in HTML
// Update these functions to auto-close hamburger

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
            chatSystem.openUserChatModal();
            break;
    }
    autoCloseHamburgerAfterNav();
}

        // Copy referral code
        function copyReferralCode() {
            const referralCode = document.getElementById('user-referral-code').textContent;
            navigator.clipboard.writeText(referralCode);
            alert('Referral code copied to clipboard!');
        }

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    autoCloseHamburgerAfterNav();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    autoCloseHamburgerAfterNav();
}

function openInvestmentModal(mineral, priceTZS, priceUSD, roi) {
    // Your investment modal logic here
    autoCloseHamburgerAfterNav();
}

function calculateMineralValue() {
    // Your calculation logic here
    autoCloseHamburgerAfterNav();
}

async function claimReward(code) {
    try {
        // ... existing validation and checking code
        
        const result = await rewardSystem.claimReward(db.currentUser.id, code);
        
        if (result.success) {
            // Add reward amount to user balance
            const oldBalance = db.currentUser.balance;
            db.currentUser.balance += result.amount;
            
            // Create reward transaction - ADD THIS BLOCK
            try {
                await db.createRewardTransaction(db.currentUser.id, result.amount, code);
            } catch (error) {
                console.error('Error creating reward transaction:', error);
                // Still proceed even if transaction creation fails
            }
            
            // Save updated balance - EXISTING CODE
            saveCurrentUserBalance();
            updateBalanceDisplays();
            
            // Show success message - EXISTING CODE
            showRewardStatus('success', `Successfully claimed $${result.amount.toFixed(2)}!`);
            
            // ... rest of existing success handling
        } else {
            // ... existing error handling
        }
    } catch (error) {
        // ... existing error handling
    }
}

function claimReward() {
    // Your reward claim logic here
    autoCloseHamburgerAfterNav();
}

function logout() {
    localStorage.removeItem('currentUser');
    document.querySelector('.landing-container').style.display = 'block';
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'none';
}

// Placeholder functions
function showNotification(message) {
    // Implement notification display
    console.log('Notification:', message);
}

function showError(message) {
    // Implement error display
    console.error('Error:', message);
}

function loadSectionData(sectionId) {
    // Your data loading logic here
    console.log(`Loading data for: ${sectionId}`);
}


// Login Tabs Function
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
        
        const loginEmailInput = document.getElementById('login-email');
        const adminPasswordSection = document.getElementById('admin-password-section');
        
        if (loginEmailInput && adminPasswordSection) {
            loginEmailInput.addEventListener('input', function() {
                if (db && db.isAdminEmail && db.isAdminEmail(this.value)) {
                    adminPasswordSection.style.display = 'block';
                } else {
                    adminPasswordSection.style.display = 'none';
                }
            });
        }
    }
}

async function signup() {
    console.log('=== SIGNUP PROCESS STARTED ===');
    
    // Get form values
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const referralCode = document.getElementById('signup-referral').value.trim().toUpperCase();
    const password = document.getElementById('signup-password').value;
    const password2 = document.getElementById('signup-password2').value;
    
    // Debug logging
    console.log('Form values:', { username, email, referralCode, password: '***' });
    
    // Validate inputs
    if (!username || !email || !referralCode || !password || !password2) {
        alert('❌ Please fill in all fields');
        return;
    }
    
    if (password !== password2) {
        alert('❌ Passwords do not match');
        return;
    }
    
    try {
        console.log('Step 1: Checking database...');
        if (!db) {
            alert('❌ Database not initialized. Please refresh the page.');
            return;
        }
        
        console.log('Step 2: Checking referral code:', referralCode);
        const referrer = await db.findUserByReferralCode(referralCode);
        if (!referrer) {
            alert('❌ Invalid referral code. Please enter a valid referral code.');
            return;
        }
        console.log('Referrer found:', referrer.username);
        
        // SEPARATE CHECKS FOR USERNAME AND EMAIL
        console.log('Step 3: Checking username availability:', username);
        const existingUserByUsername = await db.findUserByUsername(username);
        
        if (existingUserByUsername) {
            console.log('Username already exists:', existingUserByUsername);
            console.log('Existing user details:', {
                id: existingUserByUsername.id,
                username: existingUserByUsername.username,
                email: existingUserByUsername.email
            });
            
            // Check if it's actually the same user trying to sign up again
            const isSameEmail = existingUserByUsername.email === email;
            if (isSameEmail) {
                alert('❌ You already have an account with this email. Please login instead.');
                return;
            } else {
                alert('❌ Username already taken. Please choose a different username.');
                return;
            }
        } else {
            console.log('Username is available');
        }
        
        console.log('Step 4: Checking email availability:', email);
        const existingUserByEmail = await db.findUserByEmail(email);
        
        if (existingUserByEmail) {
            console.log('Email already exists:', existingUserByEmail);
            alert('❌ Email already registered. Please use a different email or login.');
            return;
        } else {
            console.log('Email is available');
        }
        
        // Show loading state
        console.log('Step 5: Creating new user...');
        const signupBtn = document.querySelector('#signup-form button[type="submit"]');
        const originalBtnText = signupBtn?.textContent || 'Sign Up';
        if (signupBtn) {
            signupBtn.textContent = 'Creating Account...';
            signupBtn.disabled = true;
        }
        
        // Create new user
        const newUser = await db.createUser({
            username: username,
            email: email,
            password: password,
            referred_by: referralCode
        });
        
        console.log('Step 6: New user created:', newUser);
        
        // Add referral data to referrer
        console.log('Step 7: Adding referral to referrer');
        const referralData = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            join_date: newUser.join_date,
            bonus_pending: true,
            first_deposit_amount: 0,
            bonus_amount: 0,
            bonus_paid: false,
            bonus_paid_date: null
        };
        
        await db.addReferralToUser(referrer.id, referralData);
        console.log('Step 8: Referral added');
        
        // Set current user
        db.currentUser = newUser;
        
        // Reset button state
        if (signupBtn) {
            signupBtn.textContent = originalBtnText;
            signupBtn.disabled = false;
        }
        
        // Clear form
        document.getElementById('signup-form').reset();
        
        // Show success
        alert(`✅ Signup successful! Welcome ${username}`);
        console.log('=== SIGNUP COMPLETED SUCCESSFULLY ===');
        
        // Show dashboard
        showUserDashboard();
        
        // Switch to login tab
        setTimeout(() => {
            document.getElementById('login-tab')?.click();
        }, 100);
        
    } catch (error) {
        console.error('=== SIGNUP ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // Reset button
        const signupBtn = document.querySelector('#signup-form button[type="submit"]');
        if (signupBtn) {
            signupBtn.textContent = 'Sign Up';
            signupBtn.disabled = false;
        }
        
        alert(`❌ Signup failed: ${error.message || 'Please try again.'}`);
    }
}

// Login Function - FIXED VERSION
async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const adminPassword = document.getElementById('admin-password')?.value || '';
    
    try {
        // Check if database is initialized
        if (!db) {
            alert('❌ Database not initialized. Please refresh the page.');
            return;
        }
        
        console.log('Attempting login for:', email); // Debug log
        
        const user = await db.findUserByEmailOrUsername(email);
        
        if (user) {
            console.log('User found:', user); // Debug log
            
            if (user.status === 'inactive') {
                alert('❌ Your account has been deactivated. Please contact administrator.');
                return;
            }
            
            // SUPER ADMIN check
            if (email.toLowerCase() === 'kingharuni420@gmail.com') {
                if (password === 'Rehema@mam') {
                    db.currentUser = user;
                    console.log('Super admin login successful');
                    showSuperAdminDashboard();
                    return;
                } else {
                    alert('❌ Invalid password!');
                    return;
                }
            }
            
            // Password check for all users
            if (user.password === password) {
                // Check if regular admin
                if (db.isAdminEmail(user.email) || user.is_admin) {
                    if (adminPassword === user.admin_password) {
                        db.currentUser = user;
                        console.log('Admin login successful:', user.username);
                        
                        // Update last active timestamp
                        await updateLastActive(user.id);
                        
                        // Check admin permissions
                        checkAdminPermissions(user);
                        
                        showAdminDashboard();
                    } else {
                        alert('❌ Invalid admin password!');
                    }
                    
                    // Initialize investment system after login
                    setTimeout(() => {
                        initInvestmentSystem();
                        startInvestmentListener();
                    }, 1000);
                } else {
                    // Regular user
                    db.currentUser = user;
                    console.log('User login successful:', user.username);
                    showUserDashboard();
                }
            } else {
                alert('❌ Invalid password!');
            }
        } else {
            alert('❌ User not found!');
        }
    } catch (error) {
        console.error('Full login error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            fullError: error
        });
        
        // Show user-friendly error
        alert('Login failed. Please check your credentials and try again.');
        
        // Clear form fields on error
        document.getElementById('login-password').value = '';
        if (document.getElementById('admin-password')) {
            document.getElementById('admin-password').value = '';
        }
    }
}

// Update last active timestamp
async function updateLastActive(userId) {
    try {
        const userRef = db.db.collection('users').doc(userId.toString());
        await userRef.update({
            last_active: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating last active:', error);
    }
}

// Check admin permissions and setup dashboard accordingly
function checkAdminPermissions(admin) {
    console.log('Checking admin permissions:', admin.permissions);
    
    // Hide/show sections based on permissions
    const sections = {
        'admin-approvals': ['transaction_approval', 'deposit_approval', 'withdrawal_approval', 'all'],
        'admin-history': ['transaction_approval', 'all'],
        'admin-chat': ['chat_support', 'all'],
        'rewards-management': ['all'],
        'admin-announcements': ['announcements', 'all'],
        'reports': ['reports', 'all'],
        'admin-settings': ['settings', 'all']
    };
    
    Object.keys(sections).forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const requiredPerms = sections[sectionId];
            const hasPermission = requiredPerms.some(perm =>
                admin.permissions && admin.permissions.includes(perm)
            );
            
            // Find corresponding nav item
            const navItem = document.querySelector(`[data-target="${sectionId}"]`);
            if (navItem) {
                if (hasPermission) {
                    navItem.style.display = 'block';
                } else {
                    navItem.style.display = 'none';
                }
            }
        }
    });
    
    // Update welcome message with role
    const welcomeMessage = document.getElementById('admin-welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${admin.admin_role ? admin.admin_role.toUpperCase() : 'ADMIN'} ${admin.username}`;
    }
}
// Show User Dashboard - FIXED VERSION WITH INVESTMENT INITIALIZATION
function showUserDashboard() {
    console.log('Showing user dashboard...');
    
    // First hide all dashboards
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    // Check if user exists
    if (!db.currentUser) {
        console.error('No current user found!');
        return;
    }
    
    console.log('Current user:', db.currentUser);
    
    // Safely update user dashboard elements
    try {
        // Wait for DOM to be ready
        setTimeout(async () => {
            const usernameDisplay = document.getElementById('username-display');
            const profileBalance = document.getElementById('profile-balance');
            const profileBalanceDisplay = document.getElementById('profile-balance-display');
            const withdrawBalance = document.getElementById('withdraw-balance');
            const dashboardBalance = document.getElementById('dashboard-balance');
            const userReferralCode = document.getElementById('user-referral-code');
            
            if (usernameDisplay) {
                usernameDisplay.textContent = db.currentUser.username;
                console.log('Username set to:', db.currentUser.username);
            } else {
                console.warn('username-display element not found');
            }
            
            if (dashboardBalance && db.formatCurrency) {
                dashboardBalance.textContent = db.formatCurrency(db.currentUser.balance || 0);
                console.log('Balance set to:', db.currentUser.balance);
            } else {
                console.warn('dashboard-balance element not found or formatCurrency not available');
            }
            
            if (userReferralCode) {
                userReferralCode.textContent = db.currentUser.referral_code || '';
                console.log('Referral code set to:', db.currentUser.referral_code);
            } else {
                console.warn('user-referral-code element not found');
            }
            
            // Initialize investment system
            await initInvestmentSystem();
            
            // Start real-time listener
            startInvestmentFirebaseListener();
            
            // Load referrals if function exists
            if (typeof loadUserReferrals === 'function') {
                loadUserReferrals();
            }
        
        // Initialize stats
        initUserDashboardStats();
        updateReferralStats();
        updateInvestmentBadge();
        updateReferralBadge();
        
        // Start periodic updates
        setInterval(updateUserDashboardStats, 30000);
        setInterval(updateReferralStats, 30000);
        
       }, 100);
    } catch (error) {
        console.error('Error updating user dashboard:', error);
        alert('Error loading dashboard. Please refresh the page.');
    }
}

// Show User Dashboard - UPDATED VERSION
function showUserDashboard() {
    console.log('Showing user dashboard...');
    
    // First hide all dashboards
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    // Check if user exists
    if (!db.currentUser) {
        console.error('No current user found!');
        return;
    }
    
    console.log('Current user:', db.currentUser.username);
    
    // Wait for DOM to be ready then update all user info
    setTimeout(() => {
        updateUserInfo();
        
        // Initialize investment system
        if (typeof initInvestmentSystem === 'function') {
            initInvestmentSystem();
        }
        
        // Start real-time listener
        if (typeof startInvestmentFirebaseListener === 'function') {
            startInvestmentFirebaseListener();
        }
        
        // Load referrals if function exists
        if (typeof loadUserReferrals === 'function') {
            loadUserReferrals();
        }
        
    }, 300); // Increased delay for DOM stability
}

// Update user info - SAFELY with null checks
function updateUserInfo() {
    if (!db || !db.currentUser) return;
    
    // Update usernames
    updateElement('username-display', db.currentUser.username);
    updateElement('profile-username', db.currentUser.username);
    updateElement('dropdown-username', db.currentUser.username);
    
    // Format balance consistently
    const balance = db.currentUser.balance || 0;
    const formattedBalance = db.formatCurrency ? db.formatCurrency(balance) : `TZS ${balance.toLocaleString()}`;
    const plainBalance = `TZS ${Math.round(balance).toLocaleString()}`;
    
    // Update balances with appropriate formatting
    updateElement('dashboard-balance', formattedBalance); // Formatted with currency
    updateElement('withdraw-balance', plainBalance); // Plain format for withdrawal
    updateElement('profile-balance', plainBalance);
    updateElement('profile-balance-display', plainBalance);
}

// Helper function to safely update elements
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
        console.log(`Updated ${id}: ${content}`);
    } else {
        console.warn(`Element #${id} not found`);
    }
}

// Then call this function instead of the inline code:
updateUserInfo();

function debugUserInfoElements() {
    const elementIds = [
        'username-display',
        'profile-username',
        'dropdown-username',
        'dashboard-balance',
        'withdraw-balance',
        'profile-balance',
        'profile-balance-display'
    ];
    
    console.log('=== DEBUGGING USER INFO ELEMENTS ===');
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}: ${element ? 'FOUND' : 'NOT FOUND'}`, element);
    });
    console.log('====================================');
}

// Call it in showUserDashboard:
function showUserDashboard() {
    // ... existing code ...
    
    setTimeout(() => {
        debugUserInfoElements(); // Debug first
        updateUserInfo(); // Then update
        // ... rest of your code
    }, 300);
}

// Show Admin Dashboard - FIXED VERSION WITH FIREBASE
function showAdminDashboard() {
    console.log('Showing admin dashboard...');
    
    // Hide all containers first
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    if (!db.currentUser) {
        console.error('No current user found for admin!');
        return;
    }
    
    // Safely update admin elements
    setTimeout(() => {
        const adminUsernameDisplay = document.getElementById('admin-username-display');
        if (adminUsernameDisplay) {
            adminUsernameDisplay.textContent = db.currentUser.username;
        }
        
        console.log('🛠️ Initializing admin dashboard...');
        
        // Load admin data from Firebase
        if (typeof loadPendingTransactions === 'function') {
            loadPendingTransactions();
        }
        if (typeof loadAdminStats === 'function') {
            loadAdminStats();
        }
        
        // Set up auto-refresh every 30 seconds for real-time updates
        if (typeof loadPendingTransactions === 'function') {
            setInterval(loadPendingTransactions, 30000);
        }
        
        // Load admin stats
        loadAdminStats();
        updatePendingCountBadge();
        
        // Start periodic updates
        setInterval(loadAdminStats, 60000);
        setInterval(updatePendingCountBadge, 30000);
        
        console.log('✅ Admin dashboard initialized');
    }, 100);
}


// Logout Function
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
        if (document.getElementById('admin-password')) {
            document.getElementById('admin-password').value = '';
        }
        const adminPasswordSection = document.getElementById('admin-password-section');
        if (adminPasswordSection) {
            adminPasswordSection.style.display = 'none';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize database
    initializeDatabase();
    
    // Initialize login tabs
    initLoginTabs();
    
    // Set up form submissions
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            signup();
        });
    }
    
    // Check if user is already logged in (from session)
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

// Helper functions
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

// Navigation functions
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.dashboard-tab');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(`${tabId}-section`).classList.add('active');
    event.target.classList.add('active');
}

// Landing page functions
function skipLanding() {
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

// Add animation to the container on load
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
});

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

// Chat System Class with Firebase Firestore
class ChatSystem {
    constructor() {
        this.db = firebase.firestore();
        this.chatsCollection = this.db.collection('chats');
        this.usersCollection = this.db.collection('users');
        this.currentUserChat = null;
        this.adminViewingUser = null;
        this.isInitialized = false;
        this.unsubscribeListeners = [];
        this.currentUserId = null;
    }

    async init() {
        if (this.isInitialized) return;
        
        await this.setupAuth();
        this.setupEventListeners();
        this.isInitialized = true;
    }

    async setupAuth() {
        // Get current user from your existing db
        if (window.db && window.db.currentUser) {
            this.currentUserId = window.db.currentUser.id;
            this.currentUser = window.db.currentUser;
            
            if (this.currentUser.is_admin) {
                this.startAdminListeners();
                this.loadAdminChatList();
            } else {
                await this.initUserChat(this.currentUserId);
                this.startUserChatListeners(this.currentUserId);
            }
        }
    }

    // Initialize chat data for a user in Firestore
    async initUserChat(userId) {
        try {
            const chatRef = this.chatsCollection.doc(userId.toString());
            const chatDoc = await chatRef.get();
            
            if (!chatDoc.exists) {
                // Get user data for username
                const user = await this.getUserById(userId);
                const username = user ? user.username : 'User ' + userId;
                
                const initialChat = {
                    userId: userId,
                    username: username,
                    messages: [{
                        id: 1,
                        sender: 'admin',
                        content: 'Hello! Welcome to Tanzania Mining Investment support. How can we help you today?',
                        timestamp: new Date().toISOString(),
                        read: false
                    }],
                    unreadCount: 0,
                    lastActivity: new Date().toISOString(),
                    status: 'online',
                    createdAt: new Date().toISOString()
                };
                
                await chatRef.set(initialChat);
                return initialChat;
            }
            
            return chatDoc.data();
        } catch (error) {
            console.error('Error initializing user chat:', error);
            throw error;
        }
    }

    // Get user by ID from Firestore
    async getUserById(userId) {
        try {
            const userDoc = await this.usersCollection.doc(userId.toString()).get();
            if (userDoc.exists) {
                return {
                    id: parseInt(userDoc.id),
                    ...userDoc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    // Get username from user ID
    async getUsername(userId) {
        const user = await this.getUserById(userId);
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

        const currentUser = window.db.currentUser;
        if (!currentUser) {
            alert('Please log in to send messages');
            return;
        }

        try {
            const chatRef = this.chatsCollection.doc(currentUser.id.toString());
            const chatDoc = await chatRef.get();
            
            if (!chatDoc.exists) {
                await this.initUserChat(currentUser.id);
            }
            
            const chatData = chatDoc.data();
            const messages = chatData.messages || [];
            const newMessage = {
                id: messages.length + 1,
                sender: 'user',
                content: message,
                timestamp: new Date().toISOString(),
                read: false
            };

            // Update chat with new message
            await chatRef.update({
                messages: firebase.firestore.FieldValue.arrayUnion(newMessage),
                lastActivity: new Date().toISOString(),
                unreadCount: firebase.firestore.FieldValue.increment(1)
            });

            // Clear input
            messageInput.value = '';

            // Simulate admin response after a delay
            setTimeout(() => {
                this.generateAdminResponse(currentUser.id, message);
            }, 2000);
            
        } catch (error) {
            console.error('Error sending user message:', error);
            alert('Error sending message. Please try again.');
        }
    }

    // Send message from admin
    async sendAdminMessage() {
        const messageInput = document.getElementById('admin-message-input');
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
        if (!message || !this.adminViewingUser) return;

        try {
            const chatRef = this.chatsCollection.doc(this.adminViewingUser.toString());
            
            const adminMessage = {
                id: Date.now(),
                sender: 'admin',
                content: message,
                timestamp: new Date().toISOString(),
                read: true
            };

            // Update chat with new message
            await chatRef.update({
                messages: firebase.firestore.FieldValue.arrayUnion(adminMessage),
                lastActivity: new Date().toISOString(),
                unreadCount: 0  // Reset unread count when admin sends message
            });

            // Clear input
            messageInput.value = '';
            
        } catch (error) {
            console.error('Error sending admin message:', error);
            alert('Error sending message. Please try again.');
        }
    }

    // Generate automated admin response
    async generateAdminResponse(userId, userMessage) {
        try {
            const chatRef = this.chatsCollection.doc(userId.toString());
            
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
                response = 'Thank you for your message. Our support team will review your inquiry and respond shortly. For immediate assistance, you can also contact us at +255 753 928 102.';
            }

            const adminMessage = {
                id: Date.now(),
                sender: 'admin',
                content: response,
                timestamp: new Date().toISOString(),
                read: false
            };

            await chatRef.update({
                messages: firebase.firestore.FieldValue.arrayUnion(adminMessage),
                lastActivity: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error generating admin response:', error);
        }
    }

    // Start real-time listener for user chat
    startUserChatListeners(userId) {
        this.cleanupListeners();

        const chatRef = this.chatsCollection.doc(userId.toString());
        
        const unsubscribe = chatRef.onSnapshot((doc) => {
            if (doc.exists) {
                this.displayUserMessages(doc.data());
            }
        }, (error) => {
            console.error('Error listening to user chat:', error);
        });

        this.unsubscribeListeners.push(unsubscribe);
    }

    // Start real-time listener for admin chat list
    startAdminListeners() {
        this.cleanupListeners();

        const unsubscribe = this.chatsCollection
            .orderBy('lastActivity', 'desc')
            .onSnapshot((snapshot) => {
                this.loadAdminChatListFromSnapshot(snapshot);
            }, (error) => {
                console.error('Error listening to admin chats:', error);
            });

        this.unsubscribeListeners.push(unsubscribe);
    }

    // Display messages in user chat
    displayUserMessages(chatData) {
        const chatMessages = document.getElementById('user-chat-messages');
        if (!chatMessages) return;

        const messages = chatData.messages || [];

        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
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
    displayAdminMessages(chatData) {
        const chatMessages = document.getElementById('admin-chat-messages');
        if (!chatMessages) return;

        const messages = chatData.messages || [];

        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
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

    // Load admin chat list from Firestore snapshot
    loadAdminChatListFromSnapshot(snapshot) {
        const chatUsersList = document.getElementById('admin-chat-users');
        if (!chatUsersList) return;

        chatUsersList.innerHTML = '';

        let totalUnread = 0;
        let totalConversations = 0;
        const today = new Date().toDateString();

        snapshot.forEach(doc => {
            const chatData = doc.data();
            totalConversations++;
            
            const userItem = this.createChatUserItem(chatData, totalUnread);
            chatUsersList.appendChild(userItem);
        });

        this.updateAdminStats(totalConversations, totalUnread);
    }

    // Load admin chat list (initial load)
    async loadAdminChatList() {
        const chatUsersList = document.getElementById('admin-chat-users');
        if (!chatUsersList) return;

        chatUsersList.innerHTML = '';

        try {
            const snapshot = await this.chatsCollection
                .orderBy('lastActivity', 'desc')
                .get();
            
            let totalUnread = 0;
            let totalConversations = 0;

            snapshot.forEach(doc => {
                const chatData = doc.data();
                totalConversations++;
                
                const userItem = this.createChatUserItem(chatData, totalUnread);
                chatUsersList.appendChild(userItem);
            });

            this.updateAdminStats(totalConversations, totalUnread);
            
        } catch (error) {
            console.error('Error loading admin chat list:', error);
        }
    }

    // Create chat user item element
    createChatUserItem(chatData, totalUnread) {
        const userItem = document.createElement('div');
        userItem.className = `chat-user-item ${this.adminViewingUser === chatData.userId ? 'active' : ''}`;
        userItem.onclick = () => this.selectUserChat(chatData.userId);

        const userInfo = document.createElement('div');
        userInfo.className = 'user-chat-info';

        const userName = document.createElement('div');
        userName.className = 'user-name';
        userName.textContent = chatData.username || 'Unknown User';

        const lastMessage = document.createElement('div');
        lastMessage.className = 'last-message';
        const messages = chatData.messages || [];
        const lastMsg = messages[messages.length - 1];
        lastMessage.textContent = lastMsg ? 
            lastMsg.content.substring(0, 30) + (lastMsg.content.length > 30 ? '...' : '') : 
            'No messages';

        userInfo.appendChild(userName);
        userInfo.appendChild(lastMessage);

        const chatMeta = document.createElement('div');
        chatMeta.className = 'chat-meta';

        const lastSeen = document.createElement('div');
        lastSeen.className = 'last-seen';
        lastSeen.textContent = this.formatTime(chatData.lastActivity);

        chatMeta.appendChild(lastSeen);

        if (chatData.unreadCount > 0) {
            const unreadCount = document.createElement('div');
            unreadCount.className = 'unread-count';
            unreadCount.textContent = chatData.unreadCount;
            chatMeta.appendChild(unreadCount);
            totalUnread += chatData.unreadCount;
        }

        userItem.appendChild(userInfo);
        userItem.appendChild(chatMeta);
        
        return userItem;
    }

    // Update admin stats display
    updateAdminStats(totalConversations, totalUnread) {
        const totalConversationsEl = document.getElementById('total-conversations');
        const unreadConversationsEl = document.getElementById('unread-conversations');
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
        
        // This would need to be updated to query Firestore
        // For now, return a placeholder
        return count;
    }

    // Select user chat in admin panel
    async selectUserChat(userId) {
        this.adminViewingUser = userId;
        
        // Update UI to show selected user
        document.querySelectorAll('.chat-user-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }

        // Start real-time listener for this chat
        this.startAdminChatListener(userId);

        // Show chat header
        const chatHeader = document.getElementById('admin-chat-header');
        
        if (chatHeader) {
            const chatData = await this.getChatData(userId);
            const username = chatData ? chatData.username : 'Unknown User';
            const status = chatData ? chatData.status : 'offline';
            
            chatHeader.innerHTML = `
                <div class="chat-title">
                    <i class="fas fa-user"></i>
                    <span>${username}</span>
                    <div class="chat-status">
                        <span class="status-indicator ${status}"></span>
                        <span>${status}</span>
                    </div>
                </div>
            `;
        }

        // Show messages and input
        const noChatSelected = document.getElementById('no-chat-selected');
        const adminChatMessages = document.getElementById('admin-chat-messages');
        const adminChatInput = document.getElementById('admin-chat-input');
        
        if (noChatSelected) noChatSelected.style.display = 'none';
        if (adminChatMessages) adminChatMessages.style.display = 'block';
        if (adminChatInput) adminChatInput.style.display = 'block';

        // Mark messages as read
        await this.markMessagesAsRead(userId);
    }

    // Get chat data from Firestore
    async getChatData(userId) {
        try {
            const chatRef = this.chatsCollection.doc(userId.toString());
            const chatDoc = await chatRef.get();
            
            if (chatDoc.exists) {
                return chatDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting chat data:', error);
            return null;
        }
    }

    // Start real-time listener for specific admin chat
    startAdminChatListener(userId) {
        this.cleanupListeners();

        const chatRef = this.chatsCollection.doc(userId.toString());
        
        const unsubscribe = chatRef.onSnapshot((doc) => {
            if (doc.exists) {
                this.displayAdminMessages(doc.data());
            }
        }, (error) => {
            console.error('Error listening to admin chat:', error);
        });

        this.unsubscribeListeners.push(unsubscribe);
    }

    // Mark messages as read
    async markMessagesAsRead(userId) {
        try {
            const chatRef = this.chatsCollection.doc(userId.toString());
            const chatDoc = await chatRef.get();
            
            if (chatDoc.exists) {
                const chatData = chatDoc.data();
                const messages = chatData.messages || [];
                
                // Mark all user messages as read
                const updatedMessages = messages.map(msg => ({
                    ...msg,
                    read: msg.sender === 'user' ? true : msg.read
                }));
                
                await chatRef.update({
                    messages: updatedMessages,
                    unreadCount: 0
                });
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
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
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return 'Just now';
        }
    }

    // Clean up listeners
    cleanupListeners() {
        this.unsubscribeListeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.unsubscribeListeners = [];
    }

    // Open user chat modal
    async openUserChatModal() {
        if (!window.db || !window.db.currentUser) {
            alert('Please log in to use chat');
            return;
        }
        
        try {
            // Initialize chat system if not already done
            await this.init();
            
            // Initialize user chat if it doesn't exist
            await this.initUserChat(window.db.currentUser.id);
            
            // Display messages
            const chatData = await this.getChatData(window.db.currentUser.id);
            if (chatData) {
                this.displayUserMessages(chatData);
            }
            
            // Show modal
            openModal('user-chat-modal');
            
        } catch (error) {
            console.error('Error opening user chat modal:', error);
            alert('Error opening chat. Please try again.');
        }
    }

    // Open admin chat modal
    async openAdminChatModal() {
        if (!window.db || !window.db.currentUser || !window.db.currentUser.is_admin) {
            alert('Admin access required');
            return;
        }
        
        try {
            // Initialize chat system if not already done
            await this.init();
            
            // Load chat list
            await this.loadAdminChatList();
            
            // Show modal
            openModal('admin-chat-modal');
        } catch (error) {
            console.error('Error opening admin chat modal:', error);
            alert('Error opening admin chat. Please try again.');
        }
    }
}

// Initialize chat system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error('Firebase not initialized. Chat system will not work.');
        return;
    }
    
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
            window.open('https://wa.me/255753928102', '_blank');
            break;
        case 'email':
            window.location.href = 'mailto:mining.investment.tanzania@proton.me';
            break;
        case 'phone':
            window.location.href = 'tel:+255753928102';
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

// Copy referral link
function copyReferralLink() {
    const referralLink = document.getElementById('referral-link-text').textContent;
    navigator.clipboard.writeText(referralLink);
    showNotification('Referral link copied to clipboard!', 'success');
}

// Share via WhatsApp
function shareViaWhatsApp() {
    const referralCode = db.currentUser.referral_code;
    const message = `Join Tanzania Mining Investment using my referral code: ${referralCode}. Start investing in precious minerals today!`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Share via Email
function shareViaEmail() {
    const referralCode = db.currentUser.referral_code;
    const subject = 'Join Tanzania Mining Investment';
    const body = `Hi, I wanted to share this amazing investment opportunity with you. Join Tanzania Mining Investment using my referral code: ${referralCode}. Start investing in precious minerals today!`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
}

// Share via SMS
function shareViaSMS() {
    const referralCode = db.currentUser.referral_code;
    const message = `Join Tanzania Mining Investment using my referral code: ${referralCode}. Start investing in precious minerals today!`;
    const url = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = url;
}

// Filter referrals
function filterReferrals() {
    const filterValue = document.getElementById('referral-filter').value;
    // This would filter the displayed referrals based on the selected criteria
    console.log('Filtering referrals by:', filterValue);
    // Actual implementation would depend on your data structure
}

// Refresh referrals
function refreshReferrals() {
    loadEnhancedReferrals();
    showNotification('Referral data refreshed!', 'success');
}

// View referral details
function viewReferralDetails(userId) {
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (user) {
        const earnings = calculateReferralEarnings(user);
        const message = `
            Referral Details:
            Name: ${user.username}
            Email: ${user.email}
            Join Date: ${new Date(user.join_date).toLocaleDateString()}
            Status: ${user.status}
            Total Deposits: TZS ${db.formatNumber(user.balance)}
            Your Earnings: TZS ${db.formatNumber(earnings)}
        `;
        alert(message);
    }
}

// Deposit Section Functionality - FIREBASE VERSION
function initDepositSection() {
    const depositType = document.getElementById('deposit-type');
    const depositBtn = document.getElementById('deposit-btn');
    const verifyBtn = document.getElementById('verify-btn');
    const quickAmounts = document.querySelectorAll('.quick-amount[data-amount]');
    
    // Show account info and instructions based on deposit type
    if (depositType) {
        depositType.addEventListener('change', function() {
            // Hide all account info
            document.querySelectorAll('.account-info').forEach(info => {
                info.style.display = 'none';
            });
            
            // Show selected account info
            const selectedType = this.value;
            if (selectedType) {
                const infoElement = document.getElementById(`${selectedType}-info`);
                if (infoElement) {
                    infoElement.style.display = 'block';
                }
                
                // Update instructions
                const instructionsTitle = document.getElementById('instructions-title');
                const instructionsContent = document.getElementById('instructions-content');
                
                if (instructionsTitle) {
                    instructionsTitle.textContent = 'Jinsi Ya Kutuma Pesa';
                }
                
                if (instructionsContent) {
                    const bankInstructions = {
                        'vodacom': '<p>Jinsi ya kuweka fedha kwa M-Pesa...</p>',
                        'airtel': '<p>Jinsi ya kuweka fedha kwa Airtel Money...</p>',
                        'tigopesa': '<p>Jinsi ya kuweka fedha kwa Tigo Pesa...</p>',
                        'halopesa': '<p>Jinsi ya kuweka fedha kwa Halopesa...</p>',
                        'nmb': '<p>Jinsi ya kuweka fedha kwa NMB...</p>',
                        'crdb': '<p>Jinsi ya kuweka fedha kwa CRDB...</p>'
                    };
                    
                    instructionsContent.innerHTML = bankInstructions[selectedType] || '<p>Chagua aina ya kuweka fedha ili kuona maelekezo maalum.</p>';
                }
            }
        });
    }
    
    // Quick amount buttons
    if (quickAmounts.length > 0) {
        quickAmounts.forEach(button => {
            button.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                const amountInput = document.getElementById('amount');
                if (amountInput) {
                    amountInput.value = amount;
                }
            });
        });
    }
    
    // Deposit button click
    if (depositBtn) {
        depositBtn.addEventListener('click', async function() {
            const amountInput = document.getElementById('amount');
            const depositTypeSelect = document.getElementById('deposit-type');
            const senderNameInput = document.getElementById('sender-name');
            const senderAccountInput = document.getElementById('sender-account');
            
            if (!amountInput || !depositTypeSelect || !senderNameInput || !senderAccountInput) {
                alert('Hitilafu ya mfumo. Tafadhali jaribu tena.');
                return;
            }
            
            const amount = parseFloat(amountInput.value);
            const depositType = depositTypeSelect.value;
            const senderName = senderNameInput.value.trim();
            const senderAccount = senderAccountInput.value.trim();
            
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
            const transactionSection = document.getElementById('transaction-section');
            const depositAmountDisplay = document.getElementById('deposit-amount-display');
            
            if (transactionSection) {
                transactionSection.style.display = 'block';
            }
            
            if (depositAmountDisplay) {
                depositAmountDisplay.textContent = db.formatCurrency(amount);
            }
            
            // Store deposit details temporarily
            window.currentDeposit = {
                amount: amount,
                type: depositType,
                senderName: senderName,
                senderAccount: senderAccount
            };
        });
    }
    
    // Verify button click
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async function() {
            const transactionCodeInput = document.getElementById('transaction-code');
            if (!transactionCodeInput) return;
            
            const transactionCode = transactionCodeInput.value.trim();
            
            if (!transactionCode) {
                alert('Tafadhali weka msimbo wa muamala');
                return;
            }
            
            if (!window.currentDeposit) {
                alert('Hitilafu imetokea. Tafadhali anza tena.');
                return;
            }
            
            try {
                // Create deposit transaction using Firebase
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
                    const statusSection = document.getElementById('status-section');
                    const transactionSection = document.getElementById('transaction-section');
                    
                    if (statusSection) statusSection.style.display = 'block';
                    if (transactionSection) transactionSection.style.display = 'none';
                    
                    // Reset form
                    const amountInput = document.getElementById('amount');
                    const depositTypeSelect = document.getElementById('deposit-type');
                    const senderNameInput = document.getElementById('sender-name');
                    const senderAccountInput = document.getElementById('sender-account');
                    const transactionCodeInput = document.getElementById('transaction-code');
                    
                    if (amountInput) amountInput.value = '';
                    if (depositTypeSelect) depositTypeSelect.value = '';
                    if (senderNameInput) senderNameInput.value = '';
                    if (senderAccountInput) senderAccountInput.value = '';
                    if (transactionCodeInput) transactionCodeInput.value = '';
                    
                    // Hide all account info
                    document.querySelectorAll('.account-info').forEach(info => {
                        info.style.display = 'none';
                    });
                    
                    // Clear temporary data
                    window.currentDeposit = null;
                    
                    alert('Ombi lako la kuweka fedha limewasilishwa kwa mafanikio. Linasubiri idhini.');
                } else {
                    alert('Hitilafu imetokea wakati wa kuwasilisha ombi lako. Tafadhali jaribu tena.');
                }
            } catch (error) {
                console.error('Error creating deposit transaction:', error);
                alert('Hitilafu imetokea. Tafadhali jaribu tena.');
            }
        });
    }
}

// Withdrawal Section Functionality - FIREBASE VERSION
async function initWithdrawalSection() {
    const withdrawMethod = document.getElementById('withdraw-method');
    const withdrawAmount = document.getElementById('withdraw-amount');
    const withdrawBtn = document.getElementById('withdraw-btn');
    const quickAmounts = document.querySelectorAll('#withdraw-section .quick-amount[data-amount]');
    
    // Show account info based on withdrawal method
    if (withdrawMethod) {
        withdrawMethod.addEventListener('change', function() {
            const accountInfo = document.getElementById('withdraw-account-info');
            if (accountInfo) {
                if (this.value) {
                    accountInfo.style.display = 'block';
                } else {
                    accountInfo.style.display = 'none';
                }
            }
        });
    }
    
    // Quick amount buttons
    if (quickAmounts.length > 0) {
        quickAmounts.forEach(button => {
            button.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                const withdrawAmountInput = document.getElementById('withdraw-amount');
                if (withdrawAmountInput) {
                    withdrawAmountInput.value = amount;
                    updateWithdrawalCalculation();
                }
            });
        });
    }
    
    // Update withdrawal calculation when amount changes
    if (withdrawAmount) {
        withdrawAmount.addEventListener('input', updateWithdrawalCalculation);
    }
    
    // Withdrawal button click - UPDATED FOR FIREBASE
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', async function() {
            const amountInput = document.getElementById('withdraw-amount');
            const methodSelect = document.getElementById('withdraw-method');
            const accountNumberInput = document.getElementById('account-number');
            const accountNameInput = document.getElementById('account-name');
            const reasonInput = document.getElementById('withdraw-reason');
            
            if (!amountInput || !methodSelect || !accountNumberInput || !accountNameInput) {
                alert('Hitilafu ya mfumo. Tafadhali jaribu tena.');
                return;
            }
            
            const amount = parseFloat(amountInput.value);
            const method = methodSelect.value;
            const accountNumber = accountNumberInput.value.trim();
            const accountName = accountNameInput.value.trim();
            const reason = reasonInput ? reasonInput.value.trim() : '';
            
            if (!amount || amount < 10000 || amount > 5000000) {
                alert('Tafadhali weka kiasi sahihi cha kutoa fedha (TZS 10,000 hadi TZS 5,000,000)');
                return;
            }
            
            // Check if withdrawal is allowed at this time
            if (!isWithdrawalAllowed()) {
                alert('Kutoa fedha kunaruhusiwa Jumatatu hadi Ijumaa (saa zote) au Jumamosi hadi Jumapili (14:00 - 23:00) pekee.');
                return;
            }
            
            // Check if user has already withdrawn today
            const hasWithdrawn = await hasWithdrawnToday(db.currentUser.id);
            if (hasWithdrawn) {
                alert('Umekwisha toa fedha leo. Unaweza kutoa fedha tena kesho.');
                return;
            }
            
            // Check if user has pending withdrawal
            const hasPending = await hasPendingWithdrawal(db.currentUser.id);
            if (hasPending) {
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
            
            try {
                // Process withdrawal (deduct amount immediately) - KEY FEATURE
                const success = await processWithdrawalRequest(db.currentUser.id, amount);
                
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
                    const statusSection = document.getElementById('withdraw-status-section');
                    const requestAmountDisplay = document.getElementById('withdraw-request-amount');
                    
                    if (statusSection) statusSection.style.display = 'block';
                    if (requestAmountDisplay) requestAmountDisplay.textContent = db.formatCurrency(amount);
                    
                    // Reset form
                    amountInput.value = '';
                    methodSelect.value = '';
                    accountNumberInput.value = '';
                    accountNameInput.value = '';
                    if (reasonInput) reasonInput.value = '';
                    
                    // Hide account info
                    const accountInfo = document.getElementById('withdraw-account-info');
                    if (accountInfo) accountInfo.style.display = 'none';
                    
                    // Update balance display
                    updateBalanceDisplay();
                    
                    alert('Ombi lako la kutoa fedha limewasilishwa kwa mafanikio. Kiasi kimetolewa kwenye salio lako na linachunguzwa.');
                } else {
                    alert('Hitilafu imetokea wakati wa kuwasilisha ombi lako. Tafadhali jaribu tena.');
                }
            } catch (error) {
                console.error('Error processing withdrawal:', error);
                alert('Hitilafu imetokea. Tafadhali jaribu tena.');
            }
        });
    }
    
    // Initial calculation update
    updateWithdrawalCalculation();
}

// Process withdrawal request (deduct amount immediately) - FIREBASE VERSION
async function processWithdrawalRequest(userId, amount) {
    try {
        // Check if user has sufficient balance
        if (db.currentUser.balance < amount) {
            return false;
        }
        
        // Deduct amount immediately - KEY FEATURE
        const newBalance = db.currentUser.balance - amount;
        
        // Update user balance in Firebase
        const userRef = db.db.collection('users').doc(userId.toString());
        await userRef.update({
            balance: newBalance,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update current user balance
        db.currentUser.balance = newBalance;
        
        return true;
    } catch (error) {
        console.error('Error processing withdrawal request:', error);
        return false;
    }
}

// Check if user has pending withdrawal - FIREBASE VERSION
async function hasPendingWithdrawal(userId) {
    try {
        // Get user document
        const userRef = db.db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return false;
        }
        
        const userData = userDoc.data();
        const transactions = userData.transactions || [];
        
        // Check if there's any pending withdrawal transaction
        return transactions.some(t => 
            t.type === 'withdrawal' && t.status === 'pending'
        );
    } catch (error) {
        console.error('Error checking pending withdrawal:', error);
        return false;
    }
}

// Check if user has withdrawn today - FIREBASE VERSION
async function hasWithdrawnToday(userId) {
    try {
        // Get user document
        const userRef = db.db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return false;
        }
        
        const userData = userDoc.data();
        const transactions = userData.transactions || [];
        
        const today = new Date().toDateString();
        return transactions.some(t => {
            if (t.type === 'withdrawal' && t.status === 'approved') {
                const transactionDate = new Date(t.date).toDateString();
                return transactionDate === today;
            }
            return false;
        });
    } catch (error) {
        console.error('Error checking if user has withdrawn today:', error);
        return false;
    }
}

// Check if withdrawal is allowed at current time
function isWithdrawalAllowed() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hour + (minutes / 100);
    
    // Monday to Friday: all hours allowed
    if (day >= 1 && day <= 5) {
        return true;
    }
    // Saturday and Sunday: 14:00 to 23:00
    else if (day === 0 || day === 6) {
        return currentTime >= 14.00 && currentTime < 23.00;
    }
    
    return false;
}

// Update withdrawal calculation
function updateWithdrawalCalculation() {
    const amountInput = document.getElementById('withdraw-amount');
    const withdrawCalc = document.getElementById('calc-withdraw');
    const chargeCalc = document.getElementById('calc-charge');
    const receiveCalc = document.getElementById('calc-receive');
    const remainingCalc = document.getElementById('calc-remaining');
    
    if (!amountInput || !withdrawCalc || !chargeCalc || !receiveCalc || !remainingCalc) {
        return;
    }
    
    const amount = parseFloat(amountInput.value) || 0;
    const serviceCharge = amount * 0.1;
    const netAmount = amount - serviceCharge;
    const currentUser = db.currentUser;
    const remainingBalance = currentUser ? (currentUser.balance - amount) : 0;
    
    withdrawCalc.textContent = db.formatCurrency(amount);
    chargeCalc.textContent = db.formatCurrency(serviceCharge);
    receiveCalc.textContent = db.formatCurrency(netAmount);
    remainingCalc.textContent = db.formatCurrency(remainingBalance);
}

// Update Database transaction status method for Firebase - FIXED WITHDRAWAL LOGIC
Database.prototype.updateTransactionStatus = async function(transactionId, status, adminId) {
    try {
        // Get all users
        const usersSnapshot = await this.db.collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const transactions = userData.transactions || [];
            const transactionIndex = transactions.findIndex(t => t.id === transactionId);
            
            if (transactionIndex !== -1) {
                const transaction = transactions[transactionIndex];
                const oldStatus = transaction.status;
                
                // Update transaction status
                transactions[transactionIndex] = {
                    ...transaction,
                    status: status,
                    adminActionDate: new Date().toISOString(),
                    adminId: adminId
                };
                
                // Update user balance based on transaction type and status
                let balanceUpdate = 0;
                
                if (transaction.type === 'deposit' && status === 'approved') {
                    // For deposit: add amount when approved
                    balanceUpdate = transaction.amount;
                } else if (transaction.type === 'withdrawal') {
                    if (status === 'rejected' && oldStatus === 'pending') {
                        // For withdrawal rejection: add back the deducted amount + service charge
                        // Note: amount was already deducted when requested, so we add it back
                        balanceUpdate = transaction.amount;
                    }
                    // For withdrawal approval: do nothing (amount was already deducted when requested)
                }
                
                // Update user document in Firebase
                const userRef = this.db.collection('users').doc(userDoc.id);
                await userRef.update({
                    transactions: transactions,
                    balance: firebase.firestore.FieldValue.increment(balanceUpdate),
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Update current user if it's the same user
                if (this.currentUser && this.currentUser.id === parseInt(userDoc.id)) {
                    this.currentUser.balance += balanceUpdate;
                    this.currentUser.transactions = transactions;
                }
                
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error updating transaction status:', error);
        return false;
    }
};

// Update balance display function
function updateBalanceDisplay() {
    const profileBalance = document.getElementById('profile-balance');
    const profileBalanceDisplay = document.getElementById('profile-balance-display');
    const dashboardBalance = document.getElementById('dashboard-balance');
    const withdrawBalance = document.getElementById('withdraw-balance');
    
    if (profileBalance) profileBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (profileBalanceDisplay) profileBalanceDisplay.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (dashboardBalance) dashboardBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    if (withdrawBalance) withdrawBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    
    // Update modal balance if modal is open
    const modalBalance = document.getElementById('modal-balance');
    const investmentModal = document.getElementById('investment-modal');
    if (modalBalance && investmentModal && investmentModal.style.display === 'flex') {
        modalBalance.textContent = `TZS ${Math.round(db.currentUser.balance).toLocaleString()}`;
    }
}

// Update the showSuperAdminDashboard function
function showSuperAdminDashboard() {
    const loginContainer = document.getElementById('login-container');
    const userDashboard = document.getElementById('user-dashboard');
    const adminDashboard = document.getElementById('admin-dashboard');
    const superAdminDashboard = document.getElementById('super-admin-dashboard');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';
    if (superAdminDashboard) superAdminDashboard.style.display = 'block';
    
    // Update the username display
    const usernameDisplay = document.getElementById('super-admin-username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = db.currentUser.username;
    }
    
    initSuperAdminDashboard();
}

// Update the navigation to handle super admin
function initNavigation() {
    // Add event listeners for navigation items
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length > 0) {
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                if (!target) return;
                
                // Hide all sections
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active');
                });
                
                // Remove active class from all nav items
                navItems.forEach(navItem => {
                    navItem.classList.remove('active');
                });
                
                // Show target section and activate nav item
                const targetSection = document.getElementById(target);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
                this.classList.add('active');
            });
        });
    }

    // Special handling for super admin dashboard navigation
    const superAdminNavItems = document.querySelectorAll('#super-admin-dashboard .nav-item');
    if (superAdminNavItems.length > 0) {
        superAdminNavItems.forEach(item => {
            item.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                if (target) {
                    switchToSection(target);
                }
            });
        });
    }
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
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    const targetNavItem = document.querySelector(`[data-target="${sectionId}"]`);
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing sections...');
    
    // Initialize UI elements with delays to ensure elements exist
    setTimeout(() => {
        // Initialize login tabs
        if (typeof initLoginTabs === 'function') {
            initLoginTabs();
        }
        
        // Initialize deposit section
        if (typeof initDepositSection === 'function') {
            initDepositSection();
        }
        
        // Initialize withdrawal section
        if (typeof initWithdrawalSection === 'function') {
            initWithdrawalSection();
        }
        
        // Initialize navigation
        if (typeof initNavigation === 'function') {
            initNavigation();
        }
    }, 500);
    
    // Check if user is already logged in
    if (db && db.currentUser) {
        console.log('User already logged in:', db.currentUser.username);
        setTimeout(() => {
            if (db.isSuperAdmin(db.currentUser)) {
                showSuperAdminDashboard();
            } else if (db.currentUser.is_admin) {
                showAdminDashboard();
            } else {
                showUserDashboard();
            }
        }, 1000);
    }
    
    // Auto-detect admin email for admin password field
    const loginEmailInput = document.getElementById('login-email');
    const adminPasswordSection = document.getElementById('admin-password-section');
    
    if (loginEmailInput && adminPasswordSection) {
        loginEmailInput.addEventListener('input', function() {
            const email = this.value;
            
            if (db && db.isAdminEmail(email)) {
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
                            <i class="fas fa-crown"></i> Super Admin access detected
                        </p>
                    `;
                }
            } else {
                adminPasswordSection.style.display = 'none';
            }
        });
    }
});

// Add helper function to check user permissions
function hasPermission(permission) {
    if (!db || !db.currentUser) return false;
    
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
function initSuperAdminDashboard() {
    console.log('Initializing Super Admin Dashboard...');
    
    // Load super admin data
    if (typeof loadSuperAdminData === 'function') {
        loadSuperAdminData();
    }
    
    // Setup event listeners
    if (typeof setupSuperAdminEventListeners === 'function') {
        setupSuperAdminEventListeners();
    }
    
    // Start real-time updates
    if (typeof startRealTimeUpdates === 'function') {
        startRealTimeUpdates();
    }
    
    // Show welcome message for super admin
    showNotification('Welcome, Super Admin!', 'success');
}

// Add function to load super admin data (placeholder)
function loadSuperAdminData() {
    console.log('Loading super admin data...');
    // This should be implemented based on your specific super admin requirements
    if (typeof updateSuperAdminStats === 'function') {
        updateSuperAdminStats();
    }
}

// Add function to update super admin statistics (placeholder)
function updateSuperAdminStats() {
    console.log('Updating super admin statistics...');
    // This should be implemented based on your specific super admin requirements
}

// Add notification function
function showNotification(message, type = 'info') {
    // Check if notification styles are already added
    if (!document.getElementById('notification-styles')) {
        // Add CSS for notifications
        const notificationStyles = `
        <style id="notification-styles">
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
            font-family: Arial, sans-serif;
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
        </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', notificationStyles);
    }
    
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
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// CSS for super admin badge (if needed)
const superAdminBadgeCSS = `
<style>
.super-admin-badge {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #333;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    margin-left: 8px;
    display: inline-block;
}
</style>
`;

// Inject super admin badge styles
if (!document.getElementById('super-admin-badge-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'super-admin-badge-styles';
    styleElement.textContent = superAdminBadgeCSS;
    document.head.appendChild(styleElement);
}

// ========== SUPER ADMIN DASHBOARD FUNCTIONS ==========

// Initialize super admin dashboard
function initSuperAdminDashboard() {
    updateSuperAdminUI();
    loadSuperAdminData();
    setupSuperAdminEventListeners();
    startRealTimeUpdates();
}

// Update super admin UI elements
function updateSuperAdminUI() {
    const username = db.currentUser?.username || 'Super Admin';
    
    document.querySelectorAll('#super-admin-username-display').forEach(el => {
        el.textContent = username;
    });
    
    const sidebarName = document.getElementById('super-admin-sidebar-name');
    if (sidebarName) {
        sidebarName.textContent = username;
    }
}

// Load super admin data
async function loadSuperAdminData() {
    try {
        await Promise.all([
            loadAdminsList(),
            loadUsersList(),
            loadSystemStats(),
            loadRecentActivities(),
            loadPendingTasks(),
            loadSystemLogs()
        ]);
        
    } catch (error) {
        console.error('Error loading super admin data:', error);
    }
}

// Load system statistics
async function loadSystemStats() {
    try {
        const users = await db.getUsers();
        const admins = users.filter(user => user.is_admin);
        const activeAdmins = admins.filter(admin => admin.status === 'active');
        const pendingTransactions = await db.getPendingTransactions();
        
        const totalDeposits = await db.getTotalDeposits();
        const totalWithdrawals = await db.getTotalWithdrawals();
        const systemRevenue = totalDeposits - totalWithdrawals;
        
        updateElement('#super-total-users', users.length);
        updateElement('#active-admins-count', activeAdmins.length);
        updateElement('#pending-approvals-count', pendingTransactions.length);
        updateElement('#system-revenue', db.formatCurrency ? db.formatCurrency(systemRevenue) : `TZS ${Math.round(systemRevenue).toLocaleString()}`);
        
        updateElement('#total-admins-count', admins.length);
        updateElement('#active-admins', activeAdmins.length);
        
        const onlineAdmins = activeAdmins.filter(admin => {
            if (!admin.last_active) return false;
            const lastActive = new Date(admin.last_active);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            return lastActive > fiveMinutesAgo;
        });
        updateElement('#online-admins', onlineAdmins.length);
        
        const activeUsers = users.filter(user => user.status === 'active' && !user.is_admin);
        const inactiveUsers = users.filter(user => user.status === 'inactive');
        const today = new Date().toDateString();
        const todaySignups = users.filter(user => {
            const joinDate = new Date(user.join_date).toDateString();
            return joinDate === today && !user.is_admin;
        });
        
        updateElement('#total-users-count', users.length);
        updateElement('#active-users-count', activeUsers.length);
        updateElement('#inactive-users-count', inactiveUsers.length);
        updateElement('#today-signups-count', todaySignups.length);
        
    } catch (error) {
        console.error('Error loading system stats:', error);
    }
}

// Update element helper function
function updateElement(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

// Toggle user password visibility
function toggleUserPassword(userId, button) {
    const row = button.closest('tr');
    const passwordCell = row.querySelector('.password-cell');
    const maskedSpan = passwordCell.querySelector('.password-masked');
    
    if (maskedSpan.dataset.actual) {
        maskedSpan.textContent = '********';
        delete maskedSpan.dataset.actual;
        button.innerHTML = '<i class="fas fa-eye"></i>';
    } else {
        maskedSpan.textContent = 'Password hidden for security';
        maskedSpan.dataset.actual = 'true';
        button.innerHTML = '<i class="fas fa-eye-slash"></i>';
    }
}

// Toggle password visibility in modal
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Load recent activities
async function loadRecentActivities() {
    try {
        const container = document.getElementById('system-activities-list');
        if (!container) return;
        
        const transactions = await db.getAllTransactions();
        const recentTransactions = transactions.slice(0, 10);
        
        let html = '';
        
        if (recentTransactions.length === 0) {
            html = '<div class="no-activities">No recent activities found</div>';
        } else {
            recentTransactions.forEach(transaction => {
                const date = new Date(transaction.date);
                const timeAgo = getTimeAgo(date);
                
                html += `
                    <div class="activity-item">
                        <div class="activity-icon ${transaction.type === 'deposit' ? 'deposit' : 'withdrawal'}">
                            <i class="fas fa-${transaction.type === 'deposit' ? 'arrow-down' : 'arrow-up'}"></i>
                        </div>
                        <div class="activity-details">
                            <div class="activity-title">${transaction.username} - ${transaction.type.toUpperCase()}</div>
                            <div class="activity-info">
                                Amount: TZS ${Math.round(transaction.amount).toLocaleString()} | 
                                Status: <span class="status-${transaction.status}">${transaction.status}</span>
                            </div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
}

// Load pending tasks
async function loadPendingTasks() {
    try {
        const pendingTasks = 0;
        updateElement('#pending-tasks-count', pendingTasks);
        
        const users = await db.getUsers();
        const admins = users.filter(user => user.is_admin);
        const assigneeFilter = document.getElementById('task-assignee-filter');
        
        if (assigneeFilter) {
            assigneeFilter.innerHTML = '<option value="all">All Assignees</option>';
            admins.forEach(admin => {
                const option = document.createElement('option');
                option.value = admin.id;
                option.textContent = admin.username;
                assigneeFilter.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading pending tasks:', error);
    }
}

// Load system logs
async function loadSystemLogs() {
    try {
        const container = document.getElementById('system-logs');
        if (!container) return;
        
        const html = '';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading system logs:', error);
    }
}

// Setup super admin event listeners
function setupSuperAdminEventListeners() {
    const adminSearch = document.getElementById('admin-search');
    if (adminSearch) {
        adminSearch.addEventListener('input', filterAdminsTable);
    }
    
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.addEventListener('input', filterUsersTable);
    }
    
    const addAdminBtn = document.querySelector('button[onclick="openAddAdminModal()"]');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', openAddAdminModal);
    }
    
    const createTaskBtn = document.querySelector('button[onclick="openCreateTaskModal()"]');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', openCreateTaskModal);
    }
    
    const viewAllTransactionsBtn = document.querySelector('button[onclick="viewAllTransactions()"]');
    if (viewAllTransactionsBtn) {
        viewAllTransactionsBtn.addEventListener('click', viewAllTransactions);
    }
    
    const adminChatBtn = document.querySelector('button[onclick="switchToSection(\'super-admin-chat\')"]');
    if (adminChatBtn) {
        adminChatBtn.addEventListener('click', () => switchToSection('super-admin-chat'));
    }
    
    const saveSecurityBtn = document.querySelector('button[onclick="saveSecuritySettings()"]');
    if (saveSecurityBtn) {
        saveSecurityBtn.addEventListener('click', saveSecuritySettings);
    }
    
    const saveSystemConfigBtn = document.querySelector('button[onclick="saveSystemConfig()"]');
    if (saveSystemConfigBtn) {
        saveSystemConfigBtn.addEventListener('click', saveSystemConfig);
    }
    
    const updateRolePermsBtn = document.querySelector('button[onclick="updateRolePermissions()"]');
    if (updateRolePermsBtn) {
        updateRolePermsBtn.addEventListener('click', updateRolePermissions);
    }
}

// Start real-time updates
function startRealTimeUpdates() {
    setInterval(() => {
        loadSystemStats();
        loadRecentActivities();
    }, 30000);
    
    if (db && db.db) {
        const usersRef = db.db.collection('users');
        
        usersRef.onSnapshot((snapshot) => {
            loadUsersList();
            loadAdminsList();
            loadSystemStats();
        });
    }
}

// Filter admins table
function filterAdminsTable() {
    const searchTerm = document.getElementById('admin-search').value.toLowerCase();
    const rows = document.querySelectorAll('#admins-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filter users table
function filterUsersTable() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Open add admin modal
function openAddAdminModal() {
    showCustomModal('Add New Admin', getAddAdminModalContent());
}

// Initialize when super admin dashboard is shown
function showSuperAdminDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'block';
    
    setTimeout(() => {
        initSuperAdminDashboard();
    }, 100);
}

// Hamburger Menu System
class HamburgerSystem {
    constructor() {
        this.currentDashboard = null;
        this.init();
    }
    
    init() {
        // Set up event listeners for all hamburger buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.hambtn')) {
                const btn = e.target.closest('.hambbtn');
                const dashboard = btn.getAttribute('data-dashboard');
                this.toggleSidebar(dashboard);
            }
            
            if (e.target.closest('.closebtn')) {
                const dashboard = this.currentDashboard;
                this.closeSidebar(dashboard);
            }
            
            if (e.target.classList.contains('backdrop')) {
                const dashboard = this.currentDashboard;
                this.closeSidebar(dashboard);
            }
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !e.target.closest('.sidebar') &&
                !e.target.closest('.hambbtn') && this.currentDashboard) {
                this.closeSidebar(this.currentDashboard);
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentDashboard) {
                this.closeSidebar(this.currentDashboard);
            }
        });
    }
    
    toggleSidebar(dashboard) {
        const sidebar = document.getElementById(`${dashboard}-side`);
        const backdrop = document.getElementById(`${dashboard}-back`);
        const hamburger = document.getElementById(`${dashboard}-hamburger`);
        
        if (sidebar.classList.contains('active')) {
            this.closeSidebar(dashboard);
        } else {
            this.openSidebar(dashboard);
        }
    }
    
    openSidebar(dashboard) {
        // Close any open sidebar first
        this.closeAllSidebars();
        
        const sidebar = document.getElementById(`${dashboard}-side`);
        const backdrop = document.getElementById(`${dashboard}-back`);
        const hamburger = document.getElementById(`${dashboard}-hamburger`);
        
        if (sidebar && backdrop && hamburger) {
            sidebar.classList.add('active');
            backdrop.classList.add('active');
            hamburger.classList.add('active');
            this.currentDashboard = dashboard;
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeSidebar(dashboard) {
        const sidebar = document.getElementById(`${dashboard}-side`);
        const backdrop = document.getElementById(`${dashboard}-back`);
        const hamburger = document.getElementById(`${dashboard}-hamburger`);
        
        if (sidebar && backdrop && hamburger) {
            sidebar.classList.remove('active');
            backdrop.classList.remove('active');
            hamburger.classList.remove('active');
            this.currentDashboard = null;
            document.body.style.overflow = '';
        }
    }
    
    closeAllSidebars() {
        const dashboards = ['user', 'admin', 'super-admin'];
        dashboards.forEach(dashboard => {
            this.closeSidebar(dashboard);
        });
    }
    
    // Update sidebar content when switching dashboards
    updateSidebarContent(dashboard, userData) {
        const sidebar = document.getElementById(`${dashboard}-side`);
        if (!sidebar) return;
        
        // Update user info
        if (userData) {
            const usernameEl = sidebar.querySelector('#sidebar-username');
            const balanceEl = sidebar.querySelector('#sidebar-balance');
            
            if (usernameEl) usernameEl.textContent = userData.username || 'User';
            if (balanceEl) balanceEl.textContent = `TZS ${userData.balance || 0}`;
        }
    }
}

// Initialize the hamburger system
const hamburgerSystem = new HamburgerSystem();

// Replace the old toggleSidebar function with this:
function toggleSidebar(dashboard) {
    hamburgerSystem.toggleSidebar(dashboard);
}

// Initialize sidebar when dashboard loads
function initializeDashboardSidebar(dashboard, userData = null) {
    // Set up close button event
    const closeBtn = document.getElementById(`${dashboard}-closeSide`);
    if (closeBtn) {
        closeBtn.onclick = () => hamburgerSystem.closeSidebar(dashboard);
    }
    
    // Set up backdrop click event
    const backdrop = document.getElementById(`${dashboard}-back`);
    if (backdrop) {
        backdrop.onclick = () => hamburgerSystem.closeSidebar(dashboard);
    }
    
    // Update content if user data provided
    if (userData) {
        hamburgerSystem.updateSidebarContent(dashboard, userData);
    }
    
    // Set up navigation links
    const navLinks = document.querySelectorAll(`#${dashboard}-side .nav-link`);
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (dashboard === 'user') {
                const target = link.getAttribute('data-target');
                if (target) {
                    e.preventDefault();
                    showSection(target);
                    // Close sidebar on mobile after clicking
                    if (window.innerWidth <= 768) {
                        hamburgerSystem.closeSidebar(dashboard);
                    }
                }
            }
        });
    });
}

// Call this when switching to a dashboard
function setupDashboard(dashboardType, userData) {
    // Close any open sidebars first
    hamburgerSystem.closeAllSidebars();
    
    // Initialize the sidebar for this dashboard
    initializeDashboardSidebar(dashboardType, userData);
}

// Add responsive behavior
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        // Auto-open sidebar on larger screens if needed
        if (hamburgerSystem.currentDashboard) {
            const sidebar = document.getElementById(`${hamburgerSystem.currentDashboard}-side`);
            if (sidebar && !sidebar.classList.contains('active')) {
                hamburgerSystem.openSidebar(hamburgerSystem.currentDashboard);
            }
        }
    } else {
        // Auto-close sidebar on mobile if open
        if (hamburgerSystem.currentDashboard) {
            hamburgerSystem.closeSidebar(hamburgerSystem.currentDashboard);
        }
    }
});








        


// Investment System - ENHANCED FIREBASE VERSION
let investments = [];
let currentMineral = null;
let currentPrice = 0;
let profitIntervals = {};
let isInvestmentSystemInitialized = false;
let investmentFirebaseUnsubscribe = null;
let isInvestmentButtonListenerSet = false;
let investmentCreationCounter = 0;

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

// ========== FIREBASE INTEGRATION FUNCTIONS ==========

// Get user investments from Firebase - IMPROVED VERSION
async function getCurrentUserInvestments() {
    try {
        if (!db || !db.currentUser || !db.currentUser.id) {
            console.log('No current user found');
            return [];
        }
        
        console.log('Fetching investments for user ID:', db.currentUser.id);
        
        // Get user document from Firestore
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            console.log('User document not found');
            return [];
        }
        
        const userData = userDoc.data();
        const userInvestments = userData.investments || [];
        
        console.log('Found investments in Firestore:', userInvestments.length);
        
        // Process investments to ensure they have proper types
        const processedInvestments = userInvestments.map(investment => ({
            id: parseInt(investment.id) || investment.id,
            mineral: investment.mineral || '',
            grams: parseFloat(investment.grams) || 0,
            days: parseInt(investment.days) || 0,
            startTime: investment.startTime || new Date().toISOString(),
            cost: parseFloat(investment.cost) || 0,
            completed: Boolean(investment.completed),
            completionDate: investment.completionDate || null,
            finalProfit: parseFloat(investment.finalProfit) || 0
        }));
        
        return processedInvestments;
        
    } catch (error) {
        console.error('Error getting user investments from Firebase:', error);
        return [];
    }
}

// Save user investments to Firebase - IMPROVED VERSION
async function saveCurrentUserInvestments() {
    try {
        if (!db || !db.currentUser || !db.currentUser.id) {
            console.error('No current user found for saving investments');
            return false;
        }
        
        console.log('Saving investments to Firebase for user:', db.currentUser.id);
        
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        
        // Create a clean version of investments without circular references
        const cleanInvestments = investments.map(investment => {
            return {
                id: investment.id,
                mineral: investment.mineral,
                grams: investment.grams,
                days: investment.days,
                startTime: investment.startTime,
                cost: investment.cost,
                completed: investment.completed || false,
                completionDate: investment.completionDate || null,
                finalProfit: investment.finalProfit || 0
            };
        });
        
        // Update the user document with new investments array
        await userRef.update({
            investments: cleanInvestments,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Investments saved successfully to Firebase:', cleanInvestments.length, 'investments');
        return true;
        
    } catch (error) {
        console.error('Error saving user investments to Firebase:', error);
        return false;
    }
}

// Save user balance to Firebase
async function saveCurrentUserBalance() {
    try {
        if (!db.currentUser) {
            console.error('No current user found for saving balance');
            return false;
        }
        
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        
        await userRef.update({
            balance: db.currentUser.balance,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('User balance updated in Firebase:', db.currentUser.balance);
        return true;
        
    } catch (error) {
        console.error('Error saving user balance to Firebase:', error);
        return false;
    }
}

// Force refresh investments from Firebase
async function refreshInvestmentsFromFirebase() {
    try {
        console.log('Refreshing investments from Firebase...');
        
        if (!db.currentUser || !db.currentUser.id) {
            console.error('No user logged in');
            return;
        }
        
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            investments = userData.investments || [];
            
            console.log('Refreshed investments from Firebase:', investments.length);
            
            // Restart profit calculations for active investments
            investments.forEach(investment => {
                if (!investment.completed && investment.id) {
                    // Clear existing interval if any
                    if (profitIntervals[investment.id]) {
                        clearInterval(profitIntervals[investment.id]);
                    }
                    // Start new profit calculation
                    startProfitCalculation(investment.id);
                }
            });
            
            // Update displays
            updateInvestmentsDisplay();
            updateInvestmentHistory();
            updateProfitBreakdown();
            
            return investments;
        }
        
        return [];
        
    } catch (error) {
        console.error('Error refreshing investments:', error);
        return [];
    }
}

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

// Setup investment button listener - PREVENTS DUPLICATES
function setupInvestmentButtonListener() {
    if (isInvestmentButtonListenerSet) {
        console.log('Investment button listener already set');
        return;
    }
    
    const startBtn = document.getElementById('start-investment-btn');
    if (!startBtn) {
        console.log('Start investment button not found yet, will retry...');
        setTimeout(setupInvestmentButtonListener, 500);
        return;
    }
    
    console.log('Setting up investment button listener...');
    
    // Remove any existing event listeners by cloning the button
    const newBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newBtn, startBtn);
    
    // Add single event listener to the new button
    document.getElementById('start-investment-btn').addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Investment button clicked');
        await startInvestment();
    });
    
    isInvestmentButtonListenerSet = true;
    console.log('✅ Investment button listener setup complete');
}

// Open investment modal - IMPROVED VERSION
function openInvestmentModal(mineral, price) {
    console.log('=== OPENING INVESTMENT MODAL ===');
    
    if (!db || !db.currentUser) {
        console.error('No user logged in');
        showNotification('Tafadhali ingia kwenye akaunti yako kwanza!', true);
        return;
    }
    
    currentMineral = mineral;
    currentPrice = price;
    
    // Get modal elements
    const modal = document.getElementById('investment-modal');
    const title = document.getElementById('modal-title');
    const priceEl = document.getElementById('modal-price');
    const balanceEl = document.getElementById('modal-balance');
    const gramsInput = document.getElementById('investment-grams');
    const daysInput = document.getElementById('investment-days');
    
    if (!modal || !title || !priceEl || !balanceEl || !gramsInput || !daysInput) {
        console.error('Missing modal elements');
        showNotification('Hitilafu ya mfumo. Tafadhali jaribu tena baada ya kupakia ukurasa tena.', true);
        return;
    }
    
    try {
        // Update modal content
        title.textContent = `Wekeza kwenye ${mineral}`;
        priceEl.textContent = `TZS ${price.toLocaleString()}/g`;
        balanceEl.textContent = `TZS ${Math.round(db.currentUser.balance || 0).toLocaleString()}`;
        gramsInput.value = '';
        daysInput.value = '7';
        
        // Reset calculation displays
        const totalCostEl = document.getElementById('total-cost');
        const dailyProfitEl = document.getElementById('daily-profit');
        const insufficientFundsEl = document.getElementById('insufficient-funds');
        
        if (totalCostEl) totalCostEl.textContent = 'TZS 0';
        if (dailyProfitEl) dailyProfitEl.textContent = 'TZS 0';
        if (insufficientFundsEl) insufficientFundsEl.style.display = 'none';
        
        // Setup investment button listener
        setupInvestmentButtonListener();
        
        // Enable start button
        const startBtn = document.getElementById('start-investment-btn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Anza Uwekezaji';
        }
        
        // Show the modal
        modal.style.display = 'flex';
        console.log('Modal displayed successfully');
        
    } catch (error) {
        console.error('Error updating modal:', error);
        showNotification('Hitilafu ilitokea wakati wa kufungua fomu ya uwekezaji.', true);
    }
}

// Close modal function
function closeInvestmentModal() {
    const modal = document.getElementById('investment-modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal closed');
    }
}

// Calculate investment return - IMPROVED VERSION
function calculateInvestmentReturn() {
    const gramsInput = document.getElementById('investment-grams');
    const daysInput = document.getElementById('investment-days');
    const totalCostEl = document.getElementById('total-cost');
    const dailyProfitEl = document.getElementById('daily-profit');
    const insufficientFundsEl = document.getElementById('insufficient-funds');
    const startBtn = document.getElementById('start-investment-btn');
    
    if (!gramsInput || !daysInput || !totalCostEl || !dailyProfitEl || !startBtn) {
        console.error('Missing modal elements in calculateInvestmentReturn');
        return;
    }
    
    const grams = parseFloat(gramsInput.value) || 0;
    const days = parseFloat(daysInput.value) || 0;
    
    if (grams > 0 && days > 0) {
        const cost = grams * currentPrice;
        
        // Check if user has sufficient funds
        if (cost > (db.currentUser?.balance || 0)) {
            if (insufficientFundsEl) {
                insufficientFundsEl.style.display = 'block';
            }
            startBtn.disabled = true;
        } else {
            if (insufficientFundsEl) {
                insufficientFundsEl.style.display = 'none';
            }
            startBtn.disabled = false;
        }
        
        // Calculate profits
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
        const totalReturn = cost + calculateProfitForPeriod(cost, startDate, endDate);
        const averageDailyProfit = (totalReturn - cost) / days;
        const totalProfit = totalReturn - cost;
        const profitPercentage = ((totalProfit / cost) * 100);
        
        // Update displays
        totalCostEl.textContent = `TZS ${Math.round(cost).toLocaleString()}`;
        dailyProfitEl.textContent = `TZS ${Math.round(averageDailyProfit).toLocaleString()}/siku`;
        
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
        
        const startBtnContainer = startBtn.parentNode;
        if (startBtnContainer && !document.getElementById('expected-profit-info')) {
            startBtnContainer.insertBefore(expectedInfo, startBtn);
        }
        
    } else {
        totalCostEl.textContent = 'TZS 0';
        dailyProfitEl.textContent = 'TZS 0';
        
        if (insufficientFundsEl) {
            insufficientFundsEl.style.display = 'none';
        }
        
        startBtn.disabled = false;
        
        const expectedInfo = document.getElementById('expected-profit-info');
        if (expectedInfo) {
            expectedInfo.remove();
        }
    }
}

// Start investment - IMPROVED VERSION
async function startInvestment() {
    investmentCreationCounter++;
    console.log(`=== STARTING INVESTMENT CHECK #${investmentCreationCounter} ===`);
    
    if (!db.currentUser) {
        showNotification('Tafadhali ingia kwenye akaunti yako kwanza!', true);
        return;
    }
    
    // Get modal elements
    const gramsInput = document.getElementById('investment-grams');
    const daysInput = document.getElementById('investment-days');
    const startBtn = document.getElementById('start-investment-btn');
    
    if (!gramsInput || !daysInput || !startBtn) {
        showNotification('Hitilafu ya mfumo. Tafadhali jaribu tena baada ya kupakia ukurasa tena.', true);
        return;
    }
    
    // Disable button to prevent multiple clicks
    startBtn.disabled = true;
    startBtn.textContent = 'Inaanzisha...';
    
    const grams = parseFloat(gramsInput.value);
    const days = parseFloat(daysInput.value);
    
    // Validate inputs
    if (!grams || grams <= 0 || isNaN(grams)) {
        showNotification('Tafadhali weka idadi halali ya gramu', true);
        startBtn.disabled = false;
        startBtn.textContent = 'Anza Uwekezaji';
        return;
    }
    
    if (!days || days < 7 || isNaN(days)) {
        showNotification('Tafadhali weka kipindi halali cha uwekezaji (angalau siku 7)', true);
        startBtn.disabled = false;
        startBtn.textContent = 'Anza Uwekezaji';
        return;
    }
    
    if (!currentMineral || !currentPrice) {
        showNotification('Hitilafu ilitokea. Tafadhali chagua madini tena.', true);
        startBtn.disabled = false;
        startBtn.textContent = 'Anza Uwekezaji';
        return;
    }
    
    const cost = grams * currentPrice;
    
    // Check balance
    if (cost > db.currentUser.balance) {
        showNotification('Salio lako halitoshi kwa uwekezaji huu', true);
        startBtn.disabled = false;
        startBtn.textContent = 'Anza Uwekezaji';
        return;
    }
    
    try {
        console.log('Creating new investment...');
        
        // Update user balance
        db.currentUser.balance -= cost;
        
        // Save balance to Firebase
        const balanceSaved = await saveCurrentUserBalance();
        
        if (!balanceSaved) {
            throw new Error('Failed to save user balance');
        }
        
        console.log('Balance updated successfully:', db.currentUser.balance);
        
        // Create investment object
        const investment = {
            id: Date.now(),
            mineral: currentMineral,
            grams: grams,
            days: days,
            startTime: new Date().toISOString(),
            cost: cost,
            completed: false,
            completionDate: null,
            finalProfit: 0
        };
        
        console.log('New investment created:', investment);
        
        // Add to investments array
        investments.push(investment);
        
        // Save investments to Firebase
        const investmentsSaved = await saveCurrentUserInvestments();
        
        if (!investmentsSaved) {
            // Rollback balance if investment save fails
            db.currentUser.balance += cost;
            await saveCurrentUserBalance();
            throw new Error('Failed to save investments');
        }
        
        console.log('Investment saved successfully');
        
        // Close modal and reset form
        closeInvestmentModal();
        gramsInput.value = '';
        daysInput.value = '7';
        
        // Update UI
        updateBalanceDisplays();
        updateInvestmentsDisplay();
        updateInvestmentHistory();
        updateProfitBreakdown();
        
        // Show success message
        showNotification('Uwekezaji umeanzishwa kikamilifu! Faida yote na uwekezaji wako zitaongezwa kiotomatiki mwisho wa muda.');
        
        // Start profit calculation for this investment
        startProfitCalculation(investment.id);
        
        console.log('=== INVESTMENT STARTED SUCCESSFULLY ===');
        
    } catch (error) {
        console.error('Error starting investment:', error);
        showNotification('Hitilafu ilitokea wakati wa kuanzisha uwekezaji. Tafadhali jaribu tena.', true);
        
        // Rollback balance on error
        db.currentUser.balance += cost;
        updateBalanceDisplays();
        
    } finally {
        // Re-enable button
        startBtn.disabled = false;
        startBtn.textContent = 'Anza Uwekezaji';
    }
}

// ========== INVESTMENT MANAGEMENT FUNCTIONS ==========

// Delete investment - FOR ACTIVE INVESTMENTS ONLY
async function deleteInvestment(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment) return;
    
    if (investment.completed) {
        // For completed investments, just remove the record
        if (confirm("Unahakika unataka kufuta rekodi ya uwekezaji huu uliokamilika?")) {
            investments = investments.filter(inv => inv.id !== investmentId);
            const saved = await saveCurrentUserInvestments();
            
            if (saved) {
                updateInvestmentsDisplay();
                updateInvestmentHistory();
                updateProfitBreakdown();
                showNotification('Rekodi ya uwekezaji imefutwa kikamilifu!');
            } else {
                showNotification('Hitilafu ilitokea wakati wa kufuta rekodi. Tafadhali jaribu tena.', true);
            }
        }
    } else {
        // For active investments, refund money
        if (confirm("Unahakika unataka kufuta uwekezaji huu? Uwekezaji wako wa awali na faida yote itaongezwa kwenye balansi yako.")) {
            try {
                const currentProfit = calculateCurrentProfit(investment);
                const totalAmountToRefund = investment.cost + currentProfit;
                
                if (profitIntervals[investmentId]) {
                    clearInterval(profitIntervals[investmentId]);
                    delete profitIntervals[investmentId];
                }
                
                // Update user balance in Firebase
                db.currentUser.balance += totalAmountToRefund;
                const balanceSaved = await saveCurrentUserBalance();
                
                if (!balanceSaved) {
                    throw new Error('Failed to save balance');
                }
                
                updateBalanceDisplays();
                
                // Remove investment
                investments = investments.filter(inv => inv.id !== investmentId);
                const investmentsSaved = await saveCurrentUserInvestments();
                
                if (!investmentsSaved) {
                    throw new Error('Failed to save investments');
                }
                
                updateInvestmentsDisplay();
                updateInvestmentHistory();
                updateProfitBreakdown();
                
                showNotification(`Uwekezaji umefutwa kikamilifu! TZS ${Math.round(totalAmountToRefund).toLocaleString()} zimeongezwa kwenye akaunti yako.`);
                
            } catch (error) {
                console.error('Error deleting investment:', error);
                showNotification('Hitilafu ilitokea wakati wa kufuta uwekezaji. Tafadhali jaribu tena.', true);
            }
        }
    }
}

// Delete completed investment record only - NO MONEY TRANSACTION
async function deleteCompletedInvestment(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment || !investment.completed) return;
    
    if (confirm("Unahakika unataka kufuta rekodi ya uwekezaji huu uliokamilika? Hii itaondoa rekodi tu, hakuna fedha zitatoka kwenye akaunti yako.")) {
        try {
            investments = investments.filter(inv => inv.id !== investmentId);
            await saveCurrentUserInvestments();
            
            updateInvestmentsDisplay();
            updateInvestmentHistory();
            updateProfitBreakdown();
            
            showNotification('Rekodi ya uwekezaji imefutwa kikamilifu!');
        } catch (error) {
            console.error('Error deleting completed investment:', error);
            showNotification('Hitilafu ilitokea wakati wa kufuta rekodi. Tafadhali jaribu tena.', true);
        }
    }
}

// Complete investment automatically when end date is reached
async function completeInvestment(investment) {
    if (investment.completed) return;
    
    const now = new Date();
    const startDate = new Date(investment.startTime);
    const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
    
    if (now >= endDate) {
        try {
            investment.completed = true;
            investment.completionDate = new Date().toISOString();
            
            // Calculate total expected profit
            const totalProfit = calculateExpectedTotalProfit(investment);
            investment.finalProfit = totalProfit;
            
            // Add both original investment and total expected profit to user balance
            const totalAmount = investment.cost + totalProfit;
            db.currentUser.balance += totalAmount;
            
            // Save balance update
            await saveCurrentUserBalance();
            
            // Stop profit calculation for this investment
            if (profitIntervals[investment.id]) {
                clearInterval(profitIntervals[investment.id]);
                delete profitIntervals[investment.id];
            }
            
            // Save updated investments to Firebase
            await saveCurrentUserInvestments();
            
            updateBalanceDisplays();
            updateInvestmentsDisplay();
            updateInvestmentHistory();
            updateProfitBreakdown();
            
            showNotification(`Uwekezaji wako wa ${investment.mineral} umekamilika! TZS ${Math.round(totalAmount).toLocaleString()} zimeongezwa kwenye salio lako.`);
            
        } catch (error) {
            console.error('Error completing investment:', error);
            showNotification('Hitilafu ilitokea wakati wa kukamilisha uwekezaji. Tafadhali jaribu tena.', true);
        }
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

// Update investments display - IMPROVED VERSION
function updateInvestmentsDisplay() {
    console.log('=== UPDATING INVESTMENTS DISPLAY ===');
    
    // Find investments container
    let investmentsContainer = document.getElementById('investments-container') || 
                               document.getElementById('myinvestment-container') ||
                               document.querySelector('.investments-grid');
    
    if (!investmentsContainer) {
        console.error('Investments container not found!');
        return;
    }
    
    console.log(`Displaying ${investments.length} investments`);
    
    // Clear container
    investmentsContainer.innerHTML = '';
    
    if (investments.length === 0) {
        investmentsContainer.innerHTML = `
            <div class="no-investments">
                <div class="no-investments-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3>Hakuna Uwekezaji</h3>
                <p>Huna uwekezaji wowote unaoendelea. Anza uwekezaji wako wa kwanza leo!</p>
                <button class="btn-primary" onclick="switchToSection('marketplace')">
                    <i class="fas fa-gem"></i> Anza Kuwekeza
                </button>
            </div>
        `;
        return;
    }
    
    // Group investments by status
    const activeInvestments = investments.filter(inv => !inv.completed);
    const completedInvestments = investments.filter(inv => inv.completed);
    
    let html = '';
    
    // Active Investments
    if (activeInvestments.length > 0) {
        html += '<h3 class="investments-subtitle">Uwekezaji Unaendelea</h3>';
        html += '<div class="investments-grid active">';
        
        activeInvestments.forEach(investment => {
            const startDate = new Date(investment.startTime);
            const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
            const now = new Date();
            const totalTime = investment.days * 24 * 60 * 60 * 1000;
            const elapsedTime = now - startDate;
            const progress = Math.min(100, (elapsedTime / totalTime) * 100);
            const remainingTime = Math.max(0, endDate - now);
            const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
            
            const currentProfit = calculateCurrentProfit(investment);
            const expectedTotalProfit = calculateExpectedTotalProfit(investment);
            const currentProfitPercentage = ((currentProfit / investment.cost) * 100);
            const expectedProfitPercentage = ((expectedTotalProfit / investment.cost) * 100);
            
            html += `
                <div class="investment-card active">
                    <div class="investment-header">
                        <div class="investment-mineral">
                            <i class="fas fa-gem"></i>
                            <span>${investment.mineral}</span>
                        </div>
                        <div class="investment-amount">${investment.grams}g</div>
                    </div>
                    
                    <div class="investment-details">
                        <div class="detail-row">
                            <span>Muda:</span>
                            <span>${investment.days} siku</span>
                        </div>
                        <div class="detail-row">
                            <span>Uwekezaji:</span>
                            <span class="amount">TZS ${Math.round(investment.cost).toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span>Faida ya Sasa:</span>
                            <span class="profit ${currentProfit >= 0 ? 'positive' : 'negative'}">
                                TZS ${Math.round(currentProfit).toLocaleString()} (${currentProfitPercentage.toFixed(2)}%)
                            </span>
                        </div>
                        <div class="detail-row">
                            <span>Faida Inayotarajiwa:</span>
                            <span class="expected">TZS ${Math.round(expectedTotalProfit).toLocaleString()} (${expectedProfitPercentage.toFixed(2)}%)</span>
                        </div>
                    </div>
                    
                    <div class="progress-section">
                        <div class="progress-label">
                            <span>Maendeleo:</span>
                            <span>${progress.toFixed(1)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    
                    <div class="investment-footer">
                        <div class="time-left">
                            <i class="far fa-clock"></i>
                            <span>Siku ${remainingDays} zimebaki</span>
                        </div>
                        <div class="total-expected">
                            <span>Jumla Inayotarajiwa:</span>
                            <span class="total">TZS ${Math.round(expectedTotalProfit + investment.cost).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="investment-actions">
                        <button class="btn-delete" onclick="deleteInvestment(${investment.id})">
                            <i class="fas fa-trash"></i> Futa Uwekezaji
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Completed Investments
    if (completedInvestments.length > 0) {
        html += '<h3 class="investments-subtitle">Uwekezaji Ulokamilika</h3>';
        html += '<div class="investments-grid completed">';
        
        completedInvestments.forEach(investment => {
            const startDate = new Date(investment.startTime);
            const completionDate = new Date(investment.completionDate || startDate);
            const finalProfit = investment.finalProfit || 0;
            const finalProfitPercentage = ((finalProfit / investment.cost) * 100);
            
            html += `
                <div class="investment-card completed">
                    <div class="investment-header">
                        <div class="investment-mineral">
                            <i class="fas fa-check-circle"></i>
                            <span>${investment.mineral}</span>
                        </div>
                        <div class="investment-status completed">IMEMALIZIKA</div>
                    </div>
                    
                    <div class="investment-details">
                        <div class="detail-row">
                            <span>Muda:</span>
                            <span>${investment.days} siku</span>
                        </div>
                        <div class="detail-row">
                            <span>Uwekezaji wa Awali:</span>
                            <span class="amount">TZS ${Math.round(investment.cost).toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span>Faida ya Mwisho:</span>
                            <span class="profit positive">
                                TZS ${Math.round(finalProfit).toLocaleString()} (${finalProfitPercentage.toFixed(2)}%)
                            </span>
                        </div>
                        <div class="detail-row">
                            <span>Jumla ya Mapato:</span>
                            <span class="total-received">TZS ${Math.round(finalProfit + investment.cost).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="completion-info">
                        <div class="date-info">
                            <i class="far fa-calendar-check"></i>
                            <span>${completionDate.toLocaleDateString()}</span>
                        </div>
                        <div class="success-note">
                            <i class="fas fa-check-circle"></i>
                            <span>Fedha zimeongezwa kwenye salio lako</span>
                        </div>
                    </div>
                    
                    <div class="investment-actions">
                        <button class="btn-delete" onclick="deleteCompletedInvestment(${investment.id})">
                            <i class="fas fa-trash"></i> Futa Rekodi
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    investmentsContainer.innerHTML = html;
    console.log('✅ Investments display updated');
}

// Load investments for display
async function loadInvestmentsForDisplay() {
    try {
        console.log('Loading investments for display...');
        investments = await getCurrentUserInvestments();
        console.log(`Loaded ${investments.length} investments from Firebase`);
        updateInvestmentsDisplay();
    } catch (error) {
        console.error('Error loading investments:', error);
    }
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
                <button class="delete-btn" onclick="deleteInvestment(${investment.id})">Futa Uwekezaji & Pokea Fedha</button>
                ` : `
                <button class="delete-btn" onclick="deleteCompletedInvestment(${investment.id})">Futa Rekodi</button>
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
    
    // Clear existing interval if any
    if (profitIntervals[investmentId]) {
        clearInterval(profitIntervals[investmentId]);
    }
    
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
    
    const modalBalance = document.getElementById('modal-balance');
    if (modalBalance && investmentModal && investmentModal.style.display === 'flex') {
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

// Initialize investment system - IMPROVED VERSION
async function initInvestmentSystem() {
    // Prevent multiple initializations
    if (isInvestmentSystemInitialized) {
        console.log('Investment system already initialized, skipping...');
        return;
    }
    
    console.log('=== INITIALIZING INVESTMENT SYSTEM ===');
    
    isInvestmentSystemInitialized = true;
    
    // Clear existing investments array
    investments = [];
    
    // Clear any existing intervals
    Object.values(profitIntervals).forEach(interval => clearInterval(interval));
    profitIntervals = {};
    
    try {
        // Load investments from Firebase
        console.log('Loading investments from Firebase...');
        const loadedInvestments = await getCurrentUserInvestments();
        console.log('Loaded investments from Firebase:', loadedInvestments.length);
        
        // Assign to investments array
        investments = loadedInvestments;
        
        // Initialize each investment
        for (const investment of investments) {
            if (!investment.completed && investment.id) {
                const now = new Date();
                const startDate = new Date(investment.startTime);
                const endDate = new Date(startDate.getTime() + investment.days * 24 * 60 * 60 * 1000);
                
                if (now >= endDate) {
                    await completeInvestment(investment);
                } else {
                    startProfitCalculation(investment.id);
                }
            }
        }
        
        updateBalanceDisplays();
        updateInvestmentsDisplay();
        updateInvestmentHistory();
        updateProfitBreakdown();
        
        console.log('✅ Investment system initialized with', investments.length, 'investments');
        
    } catch (error) {
        console.error('❌ Error initializing investment system:', error);
        showNotification('Hitilafu ilitokea wakati wa kuanzisha mfumo wa uwekezaji.', true);
        isInvestmentSystemInitialized = false; // Reset flag on error
    }
}

// Real-time listener for investments updates - IMPROVED VERSION
function startInvestmentFirebaseListener() {
    if (!db || !db.currentUser || !db.currentUser.id) {
        console.log('Cannot start Firebase listener: No user logged in');
        return;
    }
    
    // Clean up previous listener if exists
    if (investmentFirebaseUnsubscribe) {
        console.log('Cleaning up previous Firebase listener...');
        investmentFirebaseUnsubscribe();
        investmentFirebaseUnsubscribe = null;
    }
    
    console.log('Starting new Firebase listener for investments...');
    
    const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
    
    // Set up real-time listener
    investmentFirebaseUnsubscribe = userRef.onSnapshot((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            const updatedInvestments = userData.investments || [];
            
            // Deep compare to check if investments actually changed
            const currentInvestmentsStr = JSON.stringify(investments);
            const updatedInvestmentsStr = JSON.stringify(updatedInvestments);
            
            if (currentInvestmentsStr !== updatedInvestmentsStr) {
                console.log('Investments updated from Firebase real-time listener');
                investments = updatedInvestments;
                
                // Update displays
                updateInvestmentsDisplay();
                updateInvestmentHistory();
                updateProfitBreakdown();
            }
            
            // Check if balance has changed
            if (db.currentUser && db.currentUser.balance !== userData.balance) {
                console.log('Balance updated from Firebase:', userData.balance);
                db.currentUser.balance = userData.balance;
                updateBalanceDisplays();
            }
        }
    }, (error) => {
        console.error('❌ Error in real-time investments listener:', error);
        // Attempt to restart listener after delay
        setTimeout(startInvestmentFirebaseListener, 5000);
    });
    
    console.log('✅ Firebase investment listener started');
}

// Cleanup function for logout
function cleanupInvestmentSystem() {
    console.log('Cleaning up investment system...');
    
    // Clear all intervals
    Object.values(profitIntervals).forEach(interval => clearInterval(interval));
    profitIntervals = {};
    
    // Clear investments array
    investments = [];
    
    // Stop Firebase listener
    if (investmentFirebaseUnsubscribe) {
        investmentFirebaseUnsubscribe();
        investmentFirebaseUnsubscribe = null;
    }
    
    // Reset flags
    isInvestmentSystemInitialized = false;
    isInvestmentButtonListenerSet = false;
    
    console.log('✅ Investment system cleanup complete');
}

// Clear all intervals when user logs out
function clearInvestmentIntervals() {
    Object.values(profitIntervals).forEach(interval => clearInterval(interval));
    profitIntervals = {};
}

// Initialize My Investments section
function initMyInvestmentsSection() {
    console.log('Initializing My Investments section...');
    
    const myInvestmentSection = document.getElementById('myinvestment');
    if (!myInvestmentSection) {
        console.log('My Investments section not found, will try again later');
        return;
    }
    
    // Listen for when this section becomes active
    const observer = new MutationObserver(() => {
        if (myInvestmentSection.classList.contains('active')) {
            console.log('My Investments section is now active, loading data...');
            loadInvestmentsForDisplay();
        }
    });
    
    observer.observe(myInvestmentSection, { attributes: true, attributeFilter: ['class'] });
}

// ========== INITIALIZATION ==========

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing investment system event listeners...');
    
    // Add event listeners for modal inputs
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
    
    // Initialize My Investments section
    initMyInvestmentsSection();
    
    console.log('✅ Investment system event listeners initialized');
});

// Export functions for global access
window.openInvestmentModal = openInvestmentModal;
window.closeInvestmentModal = closeInvestmentModal;
window.startInvestment = startInvestment;
window.calculateInvestmentReturn = calculateInvestmentReturn;
window.deleteInvestment = deleteInvestment;
window.deleteCompletedInvestment = deleteCompletedInvestment;
window.initInvestmentSystem = initInvestmentSystem;
window.cleanupInvestmentSystem = cleanupInvestmentSystem;
window.clearInvestmentIntervals = clearInvestmentIntervals;
window.startInvestmentFirebaseListener = startInvestmentFirebaseListener;
window.loadInvestmentsForDisplay = loadInvestmentsForDisplay;

console.log('✅ Investment system loaded successfully');


// Profile Tab Switch Functionality
function switchTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId + '-section');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Initialize tab functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all dashboard tabs
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');
    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target tab from onclick attribute
            const onclickContent = this.getAttribute('onclick');
            const match = onclickContent.match(/switchTab\('([^']+)'\)/);
            
            if (match && match[1]) {
                switchTab(match[1]);
            }
        });
    });
});

// Simplified and fixed tab switching function
function setupAboutUsTabs() {
    const aboutTabs = document.querySelectorAll('.about-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    aboutTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            aboutTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab panes
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.style.display = 'none';
            });
            
            // Show the corresponding tab pane
            const tabId = this.getAttribute('data-tab');
            const targetPane = document.getElementById(`${tabId}-tab`);
            
            if (targetPane) {
                targetPane.classList.add('active');
                targetPane.style.display = 'block';
                
                // Trigger animations for new content
                setTimeout(() => {
                    animateCommitmentItems();
                }, 100);
            }
        });
    });
    
    // Initialize first tab
    const firstTab = document.querySelector('.about-tab.active');
    if (firstTab) {
        const firstTabId = firstTab.getAttribute('data-tab');
        const firstPane = document.getElementById(`${firstTabId}-tab`);
        if (firstPane) {
            firstPane.classList.add('active');
            firstPane.style.display = 'block';
        }
    }
}

// Animation for commitment items
function animateCommitmentItems() {
    const commitmentItems = document.querySelectorAll('.commitment-item');
    const commitmentCards = document.querySelectorAll('.commitment-card');
    
    commitmentItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('visible');
        }, index * 200);
    });
    
    commitmentCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('visible');
        }, (commitmentItems.length * 200) + (index * 200));
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupAboutUsTabs();
    animateCommitmentItems();
});

// Also add this to handle tab switching from navigation
function switchToSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // If it's the About Us section, reset to overview tab
        if (sectionId === 'about') {
            const overviewTab = document.querySelector('.about-tab[data-tab="overview"]');
            if (overviewTab) {
                overviewTab.click();
            }
        }
        
        // If it's the commitment tab, trigger animations
        if (sectionId === 'about') {
            setTimeout(() => {
                const activeTab = document.querySelector('.about-tab.active');
                if (activeTab && activeTab.getAttribute('data-tab') === 'commitment') {
                    animateCommitmentItems();
                }
            }, 300);
        }
    }
}

// Initialize counter animations for About Us stats
function triggerCounterAnimations() {
    const counters = document.querySelectorAll('.counter-animation');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                if (current > target) current = target;
                
                counter.querySelector('.stat-number').textContent = 
                    target >= 1000 ? Math.floor(current).toLocaleString() : current.toFixed(1);
                
                requestAnimationFrame(updateCounter);
            }
        };
        
        updateCounter();
    });
}

// Minerals carousel functionality
function setupMineralsCarousel() {
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.mineral-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    function updateCarousel() {
        // Move track
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            if (index === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
    
    // Next button click
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        });
    }
    
    // Previous button click
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        });
    }
    
    // Dot click
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });
    
    // Auto-rotate every 5 seconds
    let autoRotate = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000);
    
    // Pause on hover
    const carouselContainer = document.querySelector('.minerals-carousel');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            clearInterval(autoRotate);
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            autoRotate = setInterval(() => {
                currentSlide = (currentSlide + 1) % totalSlides;
                updateCarousel();
            }, 5000);
        });
    }
}

function resetMineralsCarousel() {
    const track = document.querySelector('.carousel-track');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    
    if (track) {
        track.style.transform = 'translateX(0%)';
        dots.forEach((dot, index) => {
            if (index === 0) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

// Contact action functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

function showLocation() {
    const location = "Dar es Salaam, Tanzania";
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(mapsUrl, '_blank');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}


// Make sure this function exists in your existing code or add it
function switchToSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));
        
        const activeLink = document.querySelector(`.nav-link[data-target="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Scroll to top of section
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Counter animation function
function triggerCounterAnimations() {
    const counters = document.querySelectorAll('.counter-animation');
    
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-target'));
        const numberElement = counter.querySelector('.stat-number');
        const currentText = numberElement.textContent;
        
        // Reset to 0 if needed
        if (currentText === '0' || currentText === '0%') {
            numberElement.textContent = target >= 1000 ? '0' : target % 1 !== 0 ? '0.0' : '0';
        }
        
        let current = 0;
        const increment = target / 50; // Adjust speed (50 steps)
        const duration = 1500; // 1.5 seconds
        const stepTime = duration / 50;
        
        const timer = setInterval(() => {
            current += increment;
            
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            // Format the number based on the target
            if (target >= 1000) {
                // For large numbers like 54678289
                numberElement.textContent = Math.floor(current).toLocaleString();
            } else if (target % 1 !== 0) {
                // For decimal numbers like 65.5
                numberElement.textContent = current.toFixed(1);
            } else if (counter.querySelector('.stat-number').textContent.includes('%')) {
                // For percentage like 98%
                numberElement.textContent = Math.floor(current) + '%';
            } else {
                // For whole numbers like 4
                numberElement.textContent = Math.floor(current);
            }
        }, stepTime);
    });
}

// Update your tab switching function to trigger animations
function setupAboutUsTabs() {
    const aboutTabs = document.querySelectorAll('.about-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    aboutTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            aboutTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab panes
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.style.display = 'none';
            });
            
            // Show the corresponding tab pane
            const tabId = this.getAttribute('data-tab');
            const targetPane = document.getElementById(`${tabId}-tab`);
            
            if (targetPane) {
                targetPane.classList.add('active');
                targetPane.style.display = 'block';
                
                // Trigger counter animations when overview tab is clicked
                if (tabId === 'overview') {
                    setTimeout(triggerCounterAnimations, 100);
                }
                
                // Trigger other animations
                setTimeout(() => {
                    animateCommitmentItems();
                }, 100);
            }
        });
    });
    
    // Initialize first tab (overview)
    const firstTab = document.querySelector('.about-tab.active');
    if (firstTab) {
        const firstTabId = firstTab.getAttribute('data-tab');
        const firstPane = document.getElementById(`${firstTabId}-tab`);
        if (firstPane) {
            firstPane.classList.add('active');
            firstPane.style.display = 'block';
            
            // Trigger counter animations on initial load if overview is active
            if (firstTabId === 'overview') {
                setTimeout(triggerCounterAnimations, 500);
            }
        }
    }
}

// Also update the switchToSection function
function switchToSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // If switching to About Us, trigger overview animations
        if (sectionId === 'about') {
            setTimeout(() => {
                // Reset to overview tab
                const overviewTab = document.querySelector('.about-tab[data-tab="overview"]');
                if (overviewTab && !overviewTab.classList.contains('active')) {
                    overviewTab.click();
                } else if (overviewTab && overviewTab.classList.contains('active')) {
                    // If already on overview, trigger animations
                    triggerCounterAnimations();
                }
            }, 300);
        }
    }
}

// Add Intersection Observer for counter animations when scrolling
function setupIntersectionObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3 // Trigger when 30% of element is visible
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                if (counter.classList.contains('counter-animation')) {
                    triggerCounterAnimations();
                    observer.unobserve(counter); // Only trigger once
                }
            }
        });
    }, observerOptions);
    
    // Observe all counter elements
    document.querySelectorAll('.counter-animation').forEach(counter => {
        observer.observe(counter);
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupAboutUsTabs();
    setupIntersectionObserver();
    
    // Also trigger animations if overview is visible on load
    if (document.querySelector('#about.content-section.active')) {
        setTimeout(triggerCounterAnimations, 1000);
    }
});











// FAQ Functionality
function initializeFAQ() {
    console.log('Initializing FAQ functionality...');
    
    // Get all FAQ elements
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqItems = document.querySelectorAll('.faq-item');
    const faqSearch = document.getElementById('faq-search');
    
    // Check if elements exist
    if (faqCategories.length === 0 || faqItems.length === 0) {
        console.warn('FAQ elements not found. Retrying in 500ms...');
        setTimeout(initializeFAQ, 500);
        return;
    }
    
    console.log(`Found ${faqCategories.length} categories and ${faqItems.length} FAQ items`);
    
    // Category Filtering
    faqCategories.forEach(category => {
        category.addEventListener('click', function() {
            // Remove active class from all categories
            faqCategories.forEach(cat => cat.classList.remove('active'));
            
            // Add active class to clicked category
            this.classList.add('active');
            
            // Get category filter
            const filter = this.getAttribute('data-category');
            
            // Filter FAQ items
            faqItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (filter === 'all' || filter === itemCategory) {
                    item.classList.remove('hidden');
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        item.classList.add('hidden');
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Search Functionality
    if (faqSearch) {
        faqSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
                
                if (searchTerm === '' || question.includes(searchTerm) || answer.includes(searchTerm)) {
                    item.classList.remove('hidden');
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        item.classList.add('hidden');
                        item.style.display = 'none';
                    }, 300);
                }
            });
            
            // Reset category filter when searching
            if (searchTerm !== '') {
                faqCategories.forEach(cat => {
                    if (cat.classList.contains('active') && cat.getAttribute('data-category') !== 'all') {
                        cat.classList.remove('active');
                    }
                });
                
                const allCategory = document.querySelector('.faq-category[data-category="all"]');
                if (allCategory && !allCategory.classList.contains('active')) {
                    allCategory.classList.add('active');
                }
            }
        });
    }
    
    // Accordion Functionality
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', function() {
            // Toggle active class
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                }
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            } else {
                item.classList.remove('active');
                answer.style.maxHeight = null;
            }
        });
        
        // Initialize all as closed
        answer.style.maxHeight = null;
    });
    
    // Initialize first category as active
    const firstCategory = document.querySelector('.faq-category.active');
    if (firstCategory) {
        firstCategory.click();
    }
    
    console.log('FAQ functionality initialized successfully');
}

// Update your switchToSection function to include FAQ initialization
function switchToSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === sectionId) {
                link.classList.add('active');
            }
        });
        
        // Update active bottom bar item
        document.querySelectorAll('.bottom-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === sectionId) {
                item.classList.add('active');
            }
        });
        
        // Initialize FAQ when section is shown
        if (sectionId === 'faq') {
            setTimeout(initializeFAQ, 100);
            
            // Reset search and show all items
            const faqSearch = document.getElementById('faq-search');
            if (faqSearch) {
                faqSearch.value = '';
            }
            
            // Show all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('hidden');
                item.style.display = 'block';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            });
            
            // Reset to "All Questions"
            const allCategory = document.querySelector('.faq-category[data-category="all"]');
            if (allCategory) {
                allCategory.click();
            }
        }
    }
}

// Initialize FAQ when page loads if FAQ is active
document.addEventListener('DOMContentLoaded', function() {
    // Check if FAQ section is active on load
    const faqSection = document.getElementById('faq');
    if (faqSection && faqSection.classList.contains('active')) {
        setTimeout(initializeFAQ, 500);
    }
    
    // Set up FAQ navigation links
    document.querySelectorAll('.nav-link[data-target="faq"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchToSection('faq');
        });
    });
    
    // Set up bottom bar FAQ link
    document.querySelectorAll('.bottom-item[data-target="faq"]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            switchToSection('faq');
        });
    });
});

// FAQ Functionality
function initializeFAQ() {
    console.log('Initializing FAQ functionality...');
    
    // Get all FAQ elements
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqItems = document.querySelectorAll('.faq-item');
    const faqSearch = document.getElementById('faq-search');
    
    // Check if elements exist
    if (faqCategories.length === 0) {
        console.warn('No FAQ categories found');
        return;
    }
    
    console.log(`Found ${faqCategories.length} categories and ${faqItems.length} FAQ items`);
    
    // Initialize all FAQ answers as collapsed
    faqItems.forEach(item => {
        const answer = item.querySelector('.faq-answer');
        if (answer) {
            answer.style.maxHeight = null;
        }
    });
    
    // Category Filtering
    faqCategories.forEach(category => {
        category.addEventListener('click', function() {
            console.log('Category clicked:', this.textContent);
            
            // Remove active class from all categories
            faqCategories.forEach(cat => cat.classList.remove('active'));
            
            // Add active class to clicked category
            this.classList.add('active');
            
            // Get category filter
            const filter = this.getAttribute('data-category');
            console.log('Filtering by:', filter);
            
            // Show/hide FAQ items based on category
            faqItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (filter === 'all' || filter === itemCategory) {
                    item.style.display = 'block';
                    // Force reflow for animation
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Search Functionality
    if (faqSearch) {
        faqSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            console.log('Searching for:', searchTerm);
            
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question span')?.textContent.toLowerCase() || '';
                const answer = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';
                
                if (searchTerm === '' || question.includes(searchTerm) || answer.includes(searchTerm)) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
            
            // Reset to "All Questions" when searching
            if (searchTerm !== '') {
                const allCategory = document.querySelector('.faq-category[data-category="all"]');
                if (allCategory && !allCategory.classList.contains('active')) {
                    faqCategories.forEach(cat => cat.classList.remove('active'));
                    allCategory.classList.add('active');
                }
            }
        });
    }
    
    // Accordion Functionality
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = question.querySelector('i');
        
        if (!question || !answer) {
            console.warn('FAQ item missing question or answer:', item);
            return;
        }
        
        question.addEventListener('click', function() {
            console.log('FAQ question clicked');
            
            // Check if this item is already active
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    const otherIcon = otherItem.querySelector('.faq-question i');
                    if (otherAnswer) otherAnswer.style.maxHeight = null;
                    if (otherIcon) {
                        otherIcon.classList.remove('fa-chevron-up');
                        otherIcon.classList.add('fa-chevron-down');
                    }
                }
            });
            
            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
                if (icon) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                }
            } else {
                item.classList.remove('active');
                answer.style.maxHeight = null;
                if (icon) {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            }
        });
        
        // Set initial icon state
        if (icon) {
            icon.classList.add('fa-chevron-down');
        }
    });
    
    // Initialize first category as active
    const activeCategory = document.querySelector('.faq-category.active');
    if (activeCategory) {
        // Trigger click to filter items
        activeCategory.click();
    } else {
        // If no active category, activate "All Questions"
        const allCategory = document.querySelector('.faq-category[data-category="all"]');
        if (allCategory) {
            allCategory.classList.add('active');
            allCategory.click();
        }
    }
    
    console.log('FAQ functionality initialized successfully');
}

// Update the switchToSection function
function switchToSection(sectionId) {
    console.log('Switching to section:', sectionId);
    
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Scroll to top of section
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === sectionId) {
                link.classList.add('active');
            }
        });
        
        // Initialize FAQ when section is shown
        if (sectionId === 'faq') {
            console.log('FAQ section activated, initializing...');
            setTimeout(() => {
                initializeFAQ();
            }, 100);
        }
    } else {
        console.error('Section not found:', sectionId);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Set up navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            console.log('Nav link clicked:', target);
            switchToSection(target);
        });
    });
    
    // Set up bottom bar links
    const bottomItems = document.querySelectorAll('.bottom-item');
    bottomItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            console.log('Bottom item clicked:', target);
            switchToSection(target);
        });
    });
    
    // Check if FAQ is active on page load
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection && activeSection.id === 'faq') {
        console.log('FAQ is active on load');
        setTimeout(initializeFAQ, 500);
    }
});

// Add this function to force FAQ display (for debugging)
function forceShowFAQ() {
    const faqSection = document.getElementById('faq');
    if (faqSection) {
        switchToSection('faq');
    }
}

// Landing Page Animated Counters
function animateLandingCounters() {
    console.log('Starting landing page counter animations...');
    
    const counters = [
        {
            element: document.getElementById('active-users'),
            target: 54678289,
            suffix: '',
            duration: 3000
        },
        {
            element: document.getElementById('total-invested'),
            target: 65.5,
            suffix: '',
            duration: 2500,
            isDecimal: true
        },
        {
            element: document.getElementById('minerals'),
            target: 4,
            suffix: '',
            duration: 1500
        },
        {
            element: document.getElementById('satisfaction-rate'),
            target: 98,
            suffix: '%',
            duration: 2000
        }
    ];
    
    // Check if all elements exist
    const missingElements = counters.filter(counter => !counter.element);
    if (missingElements.length > 0) {
        console.warn('Some counter elements not found:', missingElements);
        return;
    }
    
    counters.forEach(counter => {
        const { element, target, suffix, duration, isDecimal } = counter;
        let current = 0;
        const increment = target / (duration / 16); // 60fps
        const isPercentage = suffix === '%';
        
        // Reset to 0
        if (isDecimal) {
            element.textContent = '0.0' + suffix;
        } else if (isPercentage) {
            element.textContent = '0' + suffix;
        } else if (target >= 1000) {
            element.textContent = '0';
        } else {
            element.textContent = '0' + suffix;
        }
        
        const updateCounter = () => {
            current += increment;
            
            // If we've reached or passed the target
            if (current >= target) {
                current = target;
                
                // Format final number
                if (target >= 1000) {
                    element.textContent = target.toLocaleString() + suffix;
                } else if (isDecimal) {
                    element.textContent = target.toFixed(1) + suffix;
                } else if (isPercentage) {
                    element.textContent = target + suffix;
                } else {
                    element.textContent = target + suffix;
                }
                
                // Add animation class when complete
                element.classList.add('counter-complete');
                return;
            }
            
            // Update current value
            if (target >= 1000) {
                element.textContent = Math.floor(current).toLocaleString() + suffix;
            } else if (isDecimal) {
                element.textContent = current.toFixed(1) + suffix;
            } else if (isPercentage) {
                element.textContent = Math.floor(current) + suffix;
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
            
            requestAnimationFrame(updateCounter);
        };
        
        // Start animation with a slight delay
        setTimeout(updateCounter, 100);
    });
    
    console.log('Landing page counters animation started');
}

// Intersection Observer for landing page counters
function setupLandingPageObserver() {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid) {
        console.log('Stats grid not found, retrying...');
        setTimeout(setupLandingPageObserver, 500);
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log('Stats grid is visible, starting animations...');
                animateLandingCounters();
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.3, // Trigger when 30% of element is visible
        rootMargin: '50px' // Start animation a bit earlier
    });
    
    observer.observe(statsGrid);
    console.log('Landing page observer set up');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up landing page counters...');
    
    // Setup intersection observer
    setTimeout(setupLandingPageObserver, 1000);
    
    // Also trigger on window load for good measure
    window.addEventListener('load', function() {
        console.log('Window loaded, checking for visible stats...');
        setTimeout(setupLandingPageObserver, 500);
    });
});

// Add a manual trigger function for testing
function testLandingCounters() {
    console.log('Manually testing landing counters...');
    animateLandingCounters();
}

// Update the openSupportOption function to handle chat - NO FIREBASE CHANGES NEEDED
function openSupportOption(option) {
    switch (option) {
        case 'whatsapp':
            window.open('https://wa.me/255753928102', '_blank');
            break;
        case 'email':
            window.location.href = 'mailto:mining.investment.tanzania@proton.me';
            break;
        case 'phone':
            window.location.href = 'tel:+255753928102';
            break;
        case 'chat':
            if (window.chatSystem) {
                window.chatSystem.openUserChatModal();
            }
            break;
    }
}

// ===== ADMIN APPROVAL FUNCTIONS =====

// Updated loadPendingTransactions for your template
async function loadPendingTransactions() {
    try {
        console.log('🔄 Loading pending transactions for admin...');
        
        // Check if admin is logged in
        if (!db.currentUser || !db.currentUser.is_admin) {
            console.error('❌ User is not an admin');
            return;
        }
        
        // Find elements specific to your template
        const pendingTableBody = document.getElementById('pending-transactions-body');
        const adminApprovalsSection = document.getElementById('admin-approvals');
        
        if (!pendingTableBody) {
            console.error('❌ Pending transactions table body not found. Looking for: #pending-transactions-body');
            
            // Try to find the section first
            if (adminApprovalsSection) {
                console.log('✅ Found admin approvals section');
                
                // Check if table exists within section
                const tables = adminApprovalsSection.querySelectorAll('table');
                console.log(`Found ${tables.length} tables in admin approvals section`);
                
                tables.forEach((table, index) => {
                    const tbody = table.querySelector('tbody');
                    console.log(`Table ${index + 1}:`, {
                        id: table.id,
                        className: table.className,
                        hasTbody: !!tbody,
                        tbodyId: tbody ? tbody.id : 'no id'
                    });
                });
            }
            
            return;
        }
        
        console.log('✅ Found pending transactions table body');
        
        // Show loading state
        pendingTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Inapakua miradi...</td></tr>';
        
        // Get pending transactions from Firebase
        const pendingTransactions = await db.getPendingTransactions();
        console.log('📋 Pending transactions received:', pendingTransactions.length);
        
        // Clear table
        pendingTableBody.innerHTML = '';
        
        if (pendingTransactions.length === 0) {
            pendingTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Hakuna miradi inayosubiri idhini.</td></tr>';
            console.log('📭 No pending transactions found');
            return;
        }
        
        // Populate table with transactions
        pendingTransactions.forEach((transaction, index) => {
            const row = document.createElement('tr');
            
            // Format amount
            const formattedAmount = db.formatCurrency ? db.formatCurrency(transaction.amount) : `TZS ${transaction.amount.toLocaleString()}`;
            
            // Format date
            let formattedDate = 'N/A';
            try {
                const date = new Date(transaction.date);
                formattedDate = date.toLocaleDateString();
            } catch (e) {
                formattedDate = transaction.date || 'N/A';
            }
            
            // Get transaction details based on type
            let details = '';
            let transactionType = '';
            
            if (transaction.type === 'deposit') {
                transactionType = 'Wekezo';
                details = `
                    <strong>Wekezo kwa ${transaction.method || 'N/A'}</strong><br>
                    Mtumaji: ${transaction.details?.senderName || 'N/A'}<br>
                    Akaunti: ${transaction.details?.senderAccount || 'N/A'}<br>
                    Msimbo: ${transaction.details?.transactionCode || 'N/A'}
                `;
            } else if (transaction.type === 'withdrawal') {
                transactionType = 'Utoaji';
                details = `
                    <strong>Utoaji kwa ${transaction.method || 'N/A'}</strong><br>
                    Akaunti: ${transaction.details?.accountNumber || 'N/A'}<br>
                    Jina: ${transaction.details?.accountName || 'N/A'}<br>
                    Sababu: ${transaction.details?.reason || 'N/A'}
                `;
            } else {
                transactionType = transaction.type || 'N/A';
                details = JSON.stringify(transaction.details || {});
            }
            
            // Create action buttons with Swahili text
            row.innerHTML = `
                <td>
                    <strong>${transaction.username}</strong><br>
                    <small>${transaction.email}</small>
                </td>
                <td>
                    <span class="badge ${transaction.type === 'deposit' ? 'deposit-badge' : 'withdrawal-badge'}">
                        ${transactionType}
                    </span>
                </td>
                <td><strong>${formattedAmount}</strong></td>
                <td>${formattedDate}</td>
                <td class="transaction-details">${details}</td>
                <td class="action-buttons">
                    <button class="btn-approve" onclick="approveTransaction(${transaction.id})" title="Idhinisha">
                        <i class="fas fa-check"></i> Idhinisha
                    </button>
                    <button class="btn-reject" onclick="rejectTransaction(${transaction.id})" title="Kataa">
                        <i class="fas fa-times"></i> Kataa
                    </button>
                </td>
            `;
            
            pendingTableBody.appendChild(row);
        });
        
        console.log('✅ Pending transactions loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading pending transactions:', error);
        
        // Show error in table
        const pendingTableBody = document.getElementById('pending-transactions-body');
        if (pendingTableBody) {
            pendingTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red; padding: 20px;">Hitilafu ilitokea wakati wa kupakia miradi. Tafadhali jaribu tena.</td></tr>';
        }
    }
}

// Update approveTransaction for Swahili messages
async function approveTransaction(transactionId) {
    if (!confirm('Una hakika unataka kuidhinisha muamala huu?')) {
        return;
    }
    
    try {
        console.log(`✅ Inaidhinisha muamala ${transactionId}...`);
        
        const adminId = db.currentUser ? db.currentUser.id : 'admin';
        const success = await db.updateTransactionStatus(transactionId, 'approved', adminId);
        
        if (success) {
            alert('✅ Muamala umeidhinishwa kikamilifu!');
            
            // Refresh the pending transactions list
            loadPendingTransactions();
            
            // Update admin stats if function exists
            if (typeof loadAdminStats === 'function') {
                loadAdminStats();
            }
        } else {
            alert('❌ Imeshindwa kuidhinisha muamala. Tafadhali jaribu tena.');
        }
    } catch (error) {
        console.error('❌ Hitilafu ya kuidhinisha muamala:', error);
        alert('❌ Hitilafu: ' + (error.message || 'Imeshindwa kuidhinisha muamala'));
    }
}

// Update rejectTransaction for Swahili messages
async function rejectTransaction(transactionId) {
    const reason = prompt('Tafadhali andika sababu ya kukataa:');
    if (!reason || reason.trim() === '') {
        alert('Tafadhali toa sababu ya kukataa');
        return;
    }
    
    if (!confirm('Una hakika unataka kukataa muamala huu?')) {
        return;
    }
    
    try {
        console.log(`❌ Inakataa muamala ${transactionId}...`);
        
        const adminId = db.currentUser ? db.currentUser.id : 'admin';
        const success = await db.updateTransactionStatus(transactionId, 'rejected', adminId);
        
        if (success) {
            alert('✅ Muamala umekataliwa kikamilifu!');
            
            // Refresh the pending transactions list
            loadPendingTransactions();
            
            // Update admin stats if function exists
            if (typeof loadAdminStats === 'function') {
                loadAdminStats();
            }
        } else {
            alert('❌ Imeshindwa kukataa muamala. Tafadhali jaribu tena.');
        }
    } catch (error) {
        console.error('❌ Hitilafu ya kukataa muamala:', error);
        alert('❌ Hitilafu: ' + (error.message || 'Imeshindwa kukataa muamala'));
    }
}

// Update showAdminDashboard to ensure admin-approvals section is visible
function showAdminDashboard() {
    console.log('Showing admin dashboard...');
    
    // Hide all containers first
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    if (!db.currentUser) {
        console.error('No current user found for admin!');
        return;
    }
    
    // Safely update admin elements
    setTimeout(() => {
        const adminUsernameDisplay = document.getElementById('admin-username-display');
        if (adminUsernameDisplay) {
            adminUsernameDisplay.textContent = db.currentUser.username;
        }
        
        console.log('🛠️ Inaanzisha dashibodi ya admin...');
        
        // First, show the admin-approvals section
        showSection('admin-approvals');
        
        // Load pending transactions
        if (typeof loadPendingTransactions === 'function') {
            loadPendingTransactions();
        }
        
        // Load admin stats if function exists
        if (typeof loadAdminStats === 'function') {
            loadAdminStats();
        }
        
        console.log('✅ Dashibodi ya admin imeanzishwa');
    }, 100);
}

// Helper function to show specific section
function showSection(sectionId) {
    // Hide all content sections
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        console.log(`✅ Showing section: ${sectionId}`);
    } else {
        console.error(`❌ Section not found: ${sectionId}`);
    }
}

// Add CSS styles for your template
function addAdminApprovalsStyles() {
    if (!document.getElementById('admin-approvals-styles')) {
        const styles = `
        <style id="admin-approvals-styles">
        /* Admin approvals table styles */
        .transaction-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .transaction-table th {
            background: #2c3e50;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .transaction-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
        }
        
        .transaction-table tr:hover {
            background: #f8f9fa;
        }
        
        .transaction-table .badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        }
        
        .deposit-badge {
            background: #27ae60;
            color: white;
        }
        
        .withdrawal-badge {
            background: #e74c3c;
            color: white;
        }
        
        .transaction-details {
            max-width: 250px;
            font-size: 13px;
            line-height: 1.5;
        }
        
        .action-buttons {
            display: flex;
            gap: 8px;
        }
        
        .btn-approve, .btn-reject {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .btn-approve {
            background: #27ae60;
            color: white;
        }
        
        .btn-reject {
            background: #e74c3c;
            color: white;
        }
        
        .btn-approve:hover {
            background: #219653;
            transform: translateY(-2px);
        }
        
        .btn-reject:hover {
            background: #c0392b;
            transform: translateY(-2px);
        }
        
        .btn-approve:active, .btn-reject:active {
            transform: translateY(0);
        }
        
        .admin-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .section-title {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 24px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        .pending-transactions h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 18px;
        }
        </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        console.log('✅ Added admin approvals styles');
    }
}

// Call this when admin dashboard loads
document.addEventListener('DOMContentLoaded', function() {
    // Add styles when page loads
    addAdminApprovalsStyles();
});

// Approve transaction
async function approveTransaction(transactionId) {
    if (!confirm('Are you sure you want to APPROVE this transaction?')) {
        return;
    }
    
    try {
        console.log(`✅ Approving transaction ${transactionId}...`);
        
        const adminId = db.currentUser ? db.currentUser.id : 'admin';
        const success = await db.updateTransactionStatus(transactionId, 'approved', adminId);
        
        if (success) {
            alert('✅ Transaction approved successfully!');
            
            // Refresh the pending transactions list
            loadPendingTransactions();
            
            // Update admin stats
            if (typeof loadAdminStats === 'function') {
                loadAdminStats();
            }
            
            // Update user balances display
            if (typeof updateAllBalanceDisplays === 'function') {
                updateAllBalanceDisplays();
            }
        } else {
            alert('❌ Failed to approve transaction. Please try again.');
        }
    } catch (error) {
        console.error('❌ Error approving transaction:', error);
        alert('❌ Error: ' + (error.message || 'Failed to approve transaction'));
    }
}

// Reject transaction
async function rejectTransaction(transactionId) {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason || reason.trim() === '') {
        alert('Please provide a reason for rejection');
        return;
    }
    
    if (!confirm('Are you sure you want to REJECT this transaction?')) {
        return;
    }
    
    try {
        console.log(`❌ Rejecting transaction ${transactionId}...`);
        
        const adminId = db.currentUser ? db.currentUser.id : 'admin';
        const success = await db.updateTransactionStatus(transactionId, 'rejected', adminId);
        
        if (success) {
            alert('✅ Transaction rejected successfully!');
            
            // Refresh the pending transactions list
            loadPendingTransactions();
            
            // Update admin stats
            if (typeof loadAdminStats === 'function') {
                loadAdminStats();
            }
        } else {
            alert('❌ Failed to reject transaction. Please try again.');
        }
    } catch (error) {
        console.error('❌ Error rejecting transaction:', error);
        alert('❌ Error: ' + (error.message || 'Failed to reject transaction'));
    }
}

// Update transaction status (Database method - ensure this exists)
Database.prototype.updateTransactionStatus = async function(transactionId, status, adminId) {
    try {
        console.log(`🔄 Updating transaction ${transactionId} to ${status} by admin ${adminId}`);
        
        const usersSnapshot = await this.db.collection('users').get();
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const transactions = userData.transactions || [];
            const transactionIndex = transactions.findIndex(t => t.id === transactionId);
            
            if (transactionIndex !== -1) {
                const transaction = transactions[transactionIndex];
                const oldStatus = transaction.status;
                const currentTimestamp = new Date().toISOString();
                
                console.log(`📝 Found transaction:`, {
                    id: transaction.id,
                    userId: parseInt(userDoc.id),
                    type: transaction.type,
                    oldStatus: oldStatus,
                    newStatus: status,
                    amount: transaction.amount
                });
                
                // Update transaction
                transactions[transactionIndex] = {
                    ...transaction,
                    status: status,
                    adminActionDate: currentTimestamp,
                    adminId: adminId
                };
                
                // Calculate balance adjustment
                let balanceAdjustment = 0;
                
                if (transaction.type === 'deposit' && status === 'approved' && oldStatus !== 'approved') {
                    balanceAdjustment = parseFloat(transaction.amount) || 0;
                    console.log(`💰 Deposit approved: Adding ${balanceAdjustment} to balance`);
                } else if (transaction.type === 'withdrawal') {
                    if (status === 'rejected' && oldStatus === 'pending') {
                        balanceAdjustment = parseFloat(transaction.amount) || 0;
                        console.log(`💸 Withdrawal rejected: Adding back ${balanceAdjustment} to balance`);
                    }
                }
                
                // Update user in Firestore
                const userRef = this.db.collection('users').doc(userDoc.id);
                const updateData = {
                    transactions: transactions,
                    updated_at: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (balanceAdjustment !== 0) {
                    updateData.balance = firebase.firestore.FieldValue.increment(balanceAdjustment);
                    
                    // Update current user object if it's the same user
                    if (this.currentUser && this.currentUser.id === parseInt(userDoc.id)) {
                        this.currentUser.balance += balanceAdjustment;
                        console.log(`📊 Updated current user balance: ${this.currentUser.balance}`);
                    }
                }
                
                await userRef.update(updateData);
                console.log(`✅ Transaction ${transactionId} updated to ${status}`);
                return true;
            }
        }
        
        console.log(`❌ Transaction ${transactionId} not found`);
        return false;
        
    } catch (error) {
        console.error('❌ Error updating transaction status:', error);
        return false;
    }
};

// Add this to your slideshow JavaScript
function initSlideshowTouchSupport() {
    const slideshowTrack = document.querySelector('.slideshow-track');
    if (!slideshowTrack) return;
    
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    
    slideshowTrack.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isSwiping = true;
    });
    
    slideshowTrack.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        
        // Prevent vertical scrolling when swiping horizontally
        if (Math.abs(diff) > 10) {
            e.preventDefault();
        }
    });
    
    slideshowTrack.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        
        const diff = startX - currentX;
        const threshold = 50; // Minimum swipe distance
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe left - next slide
                nextSlide();
            } else {
                // Swipe right - previous slide
                prevSlide();
            }
        }
        
        isSwiping = false;
    });
    
    // Your existing nextSlide and prevSlide functions
    function nextSlide() {
        // Your next slide logic
    }
    
    function prevSlide() {
        // Your previous slide logic
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initSlideshowTouchSupport);

// Enhanced Load transaction history for user - REMOVED SUMMARY, ADDED AUTO-SHOW
async function loadTransactionHistory() {
    const historyBody = document.getElementById('transaction-history-body');
    if (!historyBody) {
        console.error('Transaction history body element not found');
        return;
    }
    
    historyBody.innerHTML = '';
    
    if (!db.currentUser) {
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Sasisha</td></tr>';
        return;
    }
    
    try {
        // Show loading indicator
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Inapakia historia ya miradi...</h4>
                    <p style="color: #95a5a6;">Tafadhali subiri kidogo</p>
                </td>
            </tr>
        `;
        
        // Get transactions asynchronously
        const transactions = await db.getUserTransactions(db.currentUser.id);
        
        if (!Array.isArray(transactions)) {
            console.error('getUserTransactions did not return an array:', transactions);
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                        <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ya mfumo</h4>
                        <p style="color: #95a5a6;">Transaksi hazipatikani kwa sasa</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        if (transactions.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                        <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hakuna historia ya miradi</h4>
                        <p style="color: #95a5a6;">Haujaanza muamala wowote bado</p>
                        <button onclick="switchToSection('deposit')" style="margin-top: 15px; padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Anza Muamala wa Kwanza
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = transactions.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });
        
        historyBody.innerHTML = '';
        
        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = 'transaction-row';
            
            // Format date with time
            const date = transaction.date ? new Date(transaction.date) : new Date();
            const formattedDate = date.toLocaleDateString('sw-TZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Format amount with better styling
            const amount = db.formatCurrency ? db.formatCurrency(transaction.amount) : `TZS ${(transaction.amount || 0).toLocaleString()}`;
            
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
                const method = transaction.method || transaction.details?.method || 'N/A';
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
                const method = transaction.method || transaction.details?.method || 'N/A';
                details = `
                    <div><strong>${transactionIcon} Kutoa</strong></div>
                    <div style="font-size: 12px; color: #666;">Kwa: ${accountName}</div>
                    <div style="font-size: 12px; color: #666;">Akaunti: ${accountNumber}</div>
                    <div style="font-size: 12px; color: #666;">Njia: ${method}</div>
                `;
            } else if (transaction.type === 'investment') {
                transactionIcon = '💼';
                const plan = transaction.details?.plan || 'Standard';
                const duration = transaction.details?.duration || 'N/A';
                details = `
                    <div><strong>${transactionIcon} Uwekezaji</strong></div>
                    <div style="font-size: 12px; color: #666;">Mpango: ${plan}</div>
                    <div style="font-size: 12px; color: #666;">Muda: ${duration}</div>
                `;
            } else if (transaction.type === 'bonus') {
                transactionIcon = '🎁';
                const bonusType = transaction.details?.bonusType || 'Ziada';
                details = `
                    <div><strong>${transactionIcon} Ziada</strong></div>
                    <div style="font-size: 12px; color: #666;">Aina: ${bonusType}</div>
                `;
            } else {
                transactionIcon = '💳';
                details = transaction.description || `Muamala wa ${transaction.type || 'haijulikani'}`;
            }
            
            // Transaction ID for reference
            const transactionId = transaction.transaction_id || transaction.id || 'N/A';
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: bold;">${formattedDate}</div>
                    <div style="font-size: 11px; color: #95a5a6;">ID: ${transactionId}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px;">${transactionIcon}</span>
                        <span>${transaction.type === 'deposit' ? 'Kuwaweka' : 
                                transaction.type === 'withdrawal' ? 'Kutoa' : 
                                transaction.type === 'investment' ? 'Uwekezaji' :
                                transaction.type === 'bonus' ? 'Ziada' : 'Muamala'}</span>
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
                    <button class="btn-receipt" onclick="showReceiptModal(${transaction.id})" 
                            style="display: flex; align-items: center; gap: 5px; padding: 8px 12px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        📄 Risiti
                    </button>
                </td>
            `;
            
            historyBody.appendChild(row);
        });
        
        // Add filter and search functionality
        addTransactionFilters(transactions);
        
    } catch (error) {
        console.error('Error loading transaction history:', error);
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ilitokea</h4>
                    <p style="color: #95a5a6;">${error.message || 'Tafadhali jaribu tena baadae'}</p>
                    <button onclick="loadTransactionHistory()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Jaribu Tena
                    </button>
                </td>
            </tr>
        `;
    }
}

// Enhanced Load admin transaction history - REMOVED SUMMARY, ADDED AUTO-SHOW
async function loadAdminTransactionHistory() {
    const historyBody = document.getElementById('admin-transactions-body');
    if (!historyBody) {
        console.error('Admin transactions body element not found');
        return;
    }
    
    historyBody.innerHTML = '';
    
    try {
        // Show loading indicator
        historyBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Inapakia historia ya miradi...</h4>
                    <p style="color: #95a5a6;">Tafadhali subiri kidogo</p>
                </td>
            </tr>
        `;
        
        // Get all transactions asynchronously
        const transactions = await db.getAllTransactions();
        
        if (!Array.isArray(transactions)) {
            console.error('getAllTransactions did not return an array:', transactions);
            historyBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                        <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ya mfumo</h4>
                        <p style="color: #95a5a6;">Transaksi hazipatikani kwa sasa</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        if (transactions.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">👑</div>
                        <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hakuna historia ya miradi ya watumiaji</h4>
                        <p style="color: #95a5a6;">Hakuna muamala uliofanywa na watumiaji bado</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = transactions.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });
        
        historyBody.innerHTML = '';
        
        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = 'admin-transaction-row';
            
            // Format date with time
            const date = transaction.date ? new Date(transaction.date) : new Date();
            const formattedDate = date.toLocaleDateString('sw-TZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Format amount with better styling
            const amount = db.formatCurrency ? db.formatCurrency(transaction.amount) : `TZS ${(transaction.amount || 0).toLocaleString()}`;
            
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
                const method = transaction.method || transaction.details?.method || 'N/A';
                details = `
                    <div><strong>${transactionIcon} Kuwaweka</strong></div>
                    <div style="font-size: 11px; color: #666;">Kutoka: ${senderName}</div>
                    <div style="font-size: 11px; color: #666;">Akaunti: ${senderAccount}</div>
                    <div style="font-size: 11px; color: #666;">Njia: ${method}</div>
                `;
            } else if (transaction.type === 'withdrawal') {
                transactionIcon = '📤';
                const accountName = transaction.details?.accountName || 'Haijawekwa';
                const accountNumber = transaction.details?.accountNumber || 'Haijawekwa';
                const method = transaction.method || transaction.details?.method || 'N/A';
                details = `
                    <div><strong>${transactionIcon} Kutoa</strong></div>
                    <div style="font-size: 11px; color: #666;">Kwa: ${accountName}</div>
                    <div style="font-size: 11px; color: #666;">Akaunti: ${accountNumber}</div>
                    <div style="font-size: 11px; color: #666;">Njia: ${method}</div>
                `;
            } else {
                transactionIcon = '💳';
                details = transaction.description || `Muamala wa ${transaction.type || 'haijulikani'}`;
            }
            
            // Transaction ID for reference
            const transactionId = transaction.transaction_id || transaction.id || 'N/A';
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: bold;">${transaction.username || 'N/A'}</div>
                    <div style="font-size: 11px; color: #95a5a6;">${transaction.email || ''}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px;">${transactionIcon}</span>
                        <span>${transaction.type === 'deposit' ? 'Kuwaweka' : 
                                transaction.type === 'withdrawal' ? 'Kutoa' : 
                                transaction.type || 'Muamala'}</span>
                    </div>
                </td>
                <td>
                    <div style="font-weight: bold; font-size: 16px; 
                               color: ${transaction.type === 'withdrawal' ? '#e74c3c' : '#27ae60'}">
                        ${transaction.type === 'withdrawal' ? '-' : '+'}${amount}
                    </div>
                </td>
                <td>
                    <div style="font-weight: bold;">${formattedDate}</div>
                    <div style="font-size: 11px; color: #95a5a6;">ID: ${transactionId}</div>
                </td>
                <td>
                    <span class="${statusClass}" style="display: inline-flex; align-items: center; gap: 4px;">
                        ${statusIcon} ${statusText}
                    </span>
                </td>
                <td>${details}</td>
                <td>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${transaction.status === 'pending' ? `
                            <button class="btn-approve" onclick="approveTransaction(${transaction.id})" 
                                    style="background: #27ae60; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                                ✓ Kubali
                            </button>
                            <button class="btn-reject" onclick="rejectTransaction(${transaction.id})" 
                                    style="background: #e74c3c; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                                ✗ Kataa
                            </button>
                        ` : ''}
                        <button class="btn-receipt" onclick="showReceiptModal(${transaction.id})" 
                                style="background: #3498db; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                            📄 Risiti
                        </button>
                    </div>
                </td>
            `;
            
            historyBody.appendChild(row);
        });
        
        // Add filter and search functionality for admin
        addAdminTransactionFilters(transactions);
        
    } catch (error) {
        console.error('Error loading admin transaction history:', error);
        historyBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ilitokea</h4>
                    <p style="color: #95a5a6;">${error.message || 'Tafadhali jaribu tena baadae'}</p>
                    <button onclick="loadAdminTransactionHistory()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Jaribu Tena
                    </button>
                </td>
            </tr>
        `;
    }
}

// Add filter functionality for user transactions
function addTransactionFilters(transactions) {
    const tableContainer = document.querySelector('#history .table-container');
    if (!tableContainer) return;
    
    // Remove existing filter if any
    const existingFilter = document.getElementById('transaction-filter');
    if (existingFilter) existingFilter.remove();
    
    const filterHtml = `
        <div id="transaction-filter" style="margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Chagua Aina:</label>
                    <select id="filter-type" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        <option value="all">Miradi Yote</option>
                        <option value="deposit">Kuwaweka</option>
                        <option value="withdrawal">Kutoa</option>
                        <option value="investment">Uwekezaji</option>
                        <option value="bonus">Ziada</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Chagua Hali:</label>
                    <select id="filter-status" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        <option value="all">Hali Zote</option>
                        <option value="pending">Inasubiri</option>
                        <option value="approved">Imekubaliwa</option>
                        <option value="rejected">Imekataliwa</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Tafuta:</label>
                    <input type="text" id="search-transactions" placeholder="Tafuta muamala..." style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; width: 200px;">
                </div>
                <div style="align-self: flex-end;">
                    <button onclick="applyTransactionFilters()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Tafuta
                    </button>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #7f8c8d;">
                Jumla ya miradi: ${transactions.length}
            </div>
        </div>
    `;
    
    tableContainer.insertAdjacentHTML('beforebegin', filterHtml);
}

// Add filter functionality for admin transactions
function addAdminTransactionFilters(transactions) {
    const tableContainer = document.querySelector('#admin-history .table-container');
    if (!tableContainer) return;
    
    // Remove existing filter if any
    const existingFilter = document.getElementById('admin-transaction-filter');
    if (existingFilter) existingFilter.remove();
    
    const filterHtml = `
        <div id="admin-transaction-filter" style="margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Chagua Aina:</label>
                    <select id="admin-filter-type" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        <option value="all">Miradi Yote</option>
                        <option value="deposit">Kuwaweka</option>
                        <option value="withdrawal">Kutoa</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Chagua Hali:</label>
                    <select id="admin-filter-status" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                        <option value="all">Hali Zote</option>
                        <option value="pending">Inasubiri</option>
                        <option value="approved">Imekubaliwa</option>
                        <option value="rejected">Imekataliwa</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #7f8c8d;">Tafuta Kwa Jina:</label>
                    <input type="text" id="admin-search-user" placeholder="Jina la mtumiaji..." style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; width: 200px;">
                </div>
                <div style="align-self: flex-end;">
                    <button onclick="applyAdminTransactionFilters()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        Tafuta
                    </button>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #7f8c8d;">
                Jumla ya miradi: ${transactions.length}
            </div>
        </div>
    `;
    
    tableContainer.insertAdjacentHTML('beforebegin', filterHtml);
}

// Also update the refresh functions:
async function refreshUserTransactions() {
    await loadTransactionHistory();
    // Removed summary display
}

async function refreshAdminTransactions() {
    await loadAdminTransactionHistory();
    // Removed summary display
}

// AUTO-SHOW TRANSACTIONS ON LOGIN - ADD THIS FUNCTION
function setupAutoShowTransactions() {
    console.log('Setting up auto-show transactions...');
    
    // Check if user is logged in
    if (!db.currentUser) return;
    
    // Auto-load transactions based on user type
    if (db.currentUser.is_admin || db.currentUser.is_super_admin) {
        // Admin - show both pending and history
        setTimeout(() => {
            loadPendingTransactions();
            loadAdminTransactionHistory();
        }, 1000);
    } else {
        // Regular user - show their transactions
        setTimeout(() => {
            loadTransactionHistory();
        }, 1000);
    }
    
    // Set up real-time updates
    setupTransactionRealTimeUpdates();
}

// Set up real-time Firebase listener for transactions
function setupTransactionRealTimeUpdates() {
    if (!db.currentUser || !db.db) return;
    
    console.log('Setting up real-time transaction updates...');
    
    // For regular users
    if (!db.currentUser.is_admin && !db.currentUser.is_super_admin) {
        // Listen for user's own transactions
        const userRef = db.db.collection('users').doc(db.currentUser.id.toString());
        
        userRef.onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.transactions) {
                    console.log('Real-time update: User transactions changed');
                    // Only reload if we're on the transaction history page
                    if (document.getElementById('history') && 
                        document.getElementById('history').classList.contains('active')) {
                        loadTransactionHistory();
                    }
                }
            }
        });
    }
    
    // For admins
    if (db.currentUser.is_admin || db.currentUser.is_super_admin) {
        // Admin can listen to all users (optional)
        // This is a simplified version - you might want to optimize this
        setInterval(() => {
            if (document.getElementById('admin-approvals') && 
                document.getElementById('admin-approvals').classList.contains('active')) {
                loadPendingTransactions();
            }
            if (document.getElementById('admin-history') && 
                document.getElementById('admin-history').classList.contains('active')) {
                loadAdminTransactionHistory();
            }
        }, 10000); // Check every 10 seconds
    }
}

// ENHANCED RECEIPT MODAL FUNCTIONS - ADD THESE
// Create receipt modal HTML
function createReceiptModal() {
    if (document.getElementById('receipt-modal')) return;
    
    const modalHTML = `
        <div id="receipt-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7);">
            <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 0; width: 80%; max-width: 600px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; color: #2c3e50;">📄 Risiti Ya Muamala</h2>
                    <button onclick="closeReceiptModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #7f8c8d;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px; max-height: 60vh; overflow-y: auto;">
                    <div id="receipt-content"></div>
                </div>
                <div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee; text-align: center;">
                    <button onclick="printReceipt()" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 16px;">
                        🖨️ Print Risiti
                    </button>
                    <button onclick="downloadReceipt()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 16px;">
                        💾 Pakua Risiti
                    </button>
                    <button onclick="closeReceiptModal()" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                        ✕ Funga
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add receipt CSS
    addReceiptCSS();
}

// Add receipt styling CSS
function addReceiptCSS() {
    if (document.getElementById('receipt-styles')) return;
    
    const styleHTML = `
        <style id="receipt-styles">
        /* Receipt Modal Styles */
        .receipt {
            font-family: 'Courier New', monospace;
            max-width: 100%;
        }
        
        .receipt-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px dashed #ccc;
        }
        
        .receipt-header h2 {
            color: #2c3e50;
            font-size: 20px;
            margin: 0 0 10px 0;
        }
        
        .receipt-header p {
            margin: 5px 0;
            color: #7f8c8d;
        }
        
        .receipt-details {
            margin-bottom: 20px;
        }
        
        .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px dotted #eee;
        }
        
        .receipt-row strong {
            color: #2c3e50;
        }
        
        .receipt-footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px dashed #ccc;
        }
        
        .qr-code {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 15px auto;
            display: inline-block;
            border: 1px solid #ddd;
        }
        
        .instructions {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            font-size: 14px;
        }
        
        .instructions h4 {
            margin-top: 0;
            color: #2c3e50;
        }
        
        .instructions ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .instructions li {
            margin-bottom: 5px;
        }
        
        /* Status Colors */
        .status-approved {
            color: #27ae60;
            font-weight: bold;
        }
        
        .status-pending {
            color: #f39c12;
            font-weight: bold;
        }
        
        .status-rejected {
            color: #e74c3c;
            font-weight: bold;
        }
        
        /* Print Styles */
        @media print {
            body * {
                visibility: hidden;
            }
            #receipt-modal, #receipt-modal * {
                visibility: visible;
            }
            #receipt-modal {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
            }
            .modal-footer {
                display: none !important;
            }
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styleHTML);
}

// Show receipt modal
async function showReceiptModal(transactionId) {
    console.log('Showing receipt for transaction:', transactionId);
    
    // Create modal if it doesn't exist
    createReceiptModal();
    
    // Show loading in modal
    document.getElementById('receipt-content').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 10px;">⏳</div>
            <h4 style="color: #7f8c8d; margin-bottom: 10px;">Inapakia risiti...</h4>
        </div>
    `;
    
    // Show modal
    document.getElementById('receipt-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    try {
        // Get transaction details
        const users = await db.getUsers();
        let transaction = null;
        let user = null;
        
        // Find the transaction
        for (const u of users) {
            if (u.transactions && Array.isArray(u.transactions)) {
                const found = u.transactions.find(t => t.id === transactionId);
                if (found) {
                    transaction = found;
                    user = u;
                    break;
                }
            }
        }
        
        if (!transaction) {
            throw new Error('Muamala haupatikani');
        }
        
        // Format date and time
        const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
        const formattedDate = transactionDate.toLocaleDateString('sw-TZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const formattedTime = transactionDate.toLocaleTimeString('sw-TZ', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Determine status
        let statusText, statusClass, statusIcon;
        if (transaction.status === 'approved') {
            statusText = 'IMEFAULU';
            statusClass = 'status-approved';
            statusIcon = '✅';
        } else if (transaction.status === 'rejected') {
            statusText = 'IMEKATALIWA';
            statusClass = 'status-rejected';
            statusIcon = '❌';
        } else {
            statusText = 'INASUBIRI';
            statusClass = 'status-pending';
            statusIcon = '⏳';
        }
        
        // Build receipt HTML
        const receiptHTML = `
            <div class="receipt">
                <div class="receipt-header">
                    <h2>TANZANIA MINING INVESTMENT</h2>
                    <p><strong>Risiti Ya Muamala Rasmi</strong></p>
                    <p><em>Namba ya Risiti: #${transaction.id}</em></p>
                    <p><em>Tarehe ya Kutoa: ${new Date().toLocaleDateString('sw-TZ')}</em></p>
                </div>
                
                <div class="receipt-details">
                    <div class="receipt-row">
                        <span><strong>Tarehe ya Muamala:</strong></span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Muda wa Muamala:</strong></span>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Jina la Mteja:</strong></span>
                        <span>${user.username || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Barua Pepe:</strong></span>
                        <span>${user.email || 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Aina ya Muamala:</strong></span>
                        <span>${transaction.type === 'deposit' ? '📥 KUWAWEKA FEDHA' : 
                                 transaction.type === 'withdrawal' ? '📤 KUTOA FEDHA' : 
                                 transaction.type === 'investment' ? '💼 UWEKEZAJI' :
                                 '💳 MUAMALA'}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Kiasi cha Muamala:</strong></span>
                        <span style="font-size: 18px; font-weight: bold; color: #2c3e50;">${db.formatCurrency(transaction.amount)}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Njia ya Malipo:</strong></span>
                        <span>${getBankName(transaction.method || transaction.details?.method)}</span>
                    </div>
                    
                    ${transaction.type === 'deposit' ? `
                    <div class="receipt-row">
                        <span><strong>Jina la Mtumaji:</strong></span>
                        <span>${transaction.details?.senderName || 'Haijawekwa'}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Akaunti ya Mtumaji:</strong></span>
                        <span>${transaction.details?.senderAccount || 'Haijawekwa'}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Msimbo wa Muamala:</strong></span>
                        <span>${transaction.details?.transactionCode || 'Haijawekwa'}</span>
                    </div>
                    ` : transaction.type === 'withdrawal' ? `
                    <div class="receipt-row">
                        <span><strong>Jina la Mlipokeaji:</strong></span>
                        <span>${transaction.details?.accountName || 'Haijawekwa'}</span>
                    </div>
                    <div class="receipt-row">
                        <span><strong>Akaunti ya Mlipokeaji:</strong></span>
                        <span>${transaction.details?.accountNumber || 'Haijawekwa'}</span>
                    </div>
                    ${transaction.details?.reason ? `
                    <div class="receipt-row">
                        <span><strong>Sababu ya Kutoa:</strong></span>
                        <span>${transaction.details.reason}</span>
                    </div>
                    ` : ''}
                    ` : ''}
                    
                    <div class="receipt-row">
                        <span><strong>Hali ya Muamala:</strong></span>
                        <span class="${statusClass}">${statusIcon} ${statusText}</span>
                    </div>
                    
                    ${transaction.adminActionDate ? `
                    <div class="receipt-row">
                        <span><strong>Tarehe ya Idhini:</strong></span>
                        <span>${new Date(transaction.adminActionDate).toLocaleDateString('sw-TZ')}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="receipt-footer">
                    <div class="qr-code">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${statusText}</div>
                        <div style="background: white; padding: 10px; display: inline-block; border: 1px solid #ddd;">
                            <div style="width: 100px; height: 100px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">
                                QR Code<br>#${transaction.id}
                            </div>
                        </div>
                        <p style="margin-top: 5px; font-size: 10px;">Scan for Verification</p>
                    </div>
                    <p><strong>ASANTE KWA KUTUMIA HUDUMA ZETU</strong></p>
                    <p><strong>TANZANIA MINING INVESTMENT</strong></p>
                    <p>+255 753 928 102 | mining.investment.tanzania@proton.me</p>
                    <p style="font-size: 12px; color: #7f8c8d; margin-top: 10px;">
                        Risiti hii ni ushahidi rasmi wa muamala wako. Tafadhali hifadhi kwa usalama.
                    </p>
                </div>
                
                <div class="instructions">
                    <h4>📸 Maelekezo ya Kuhifadhi Risiti:</h4>
                    <ul>
                        <li><strong>Kuchukua Screenshot:</strong> Bonyeza pamoja Power + Volume Down (simu)</li>
                        <li><strong>Kupakua:</strong> Bonyeza "Pakua Risiti" hapo juu</li>
                        <li><strong>Kuchapisha:</strong> Bonyeza "Print Risiti" kwa nakala ya karatasi</li>
                        <li><strong>Kuhifadhi:</strong> Tuma kwenye barua pepe yako au hifadhi kwenye wavuti</li>
                    </ul>
                </div>
            </div>
        `;
        
        document.getElementById('receipt-content').innerHTML = receiptHTML;
        
    } catch (error) {
        console.error('Error loading receipt:', error);
        document.getElementById('receipt-content').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                <h4 style="color: #7f8c8d; margin-bottom: 10px;">Hitilafu ilitokea</h4>
                <p style="color: #95a5a6;">${error.message || 'Imeshindwa kupakia risiti'}</p>
                <button onclick="closeReceiptModal()" style="margin-top: 15px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Funga
                </button>
            </div>
        `;
    }
}

// Close receipt modal
function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Print receipt
function printReceipt() {
    window.print();
}

// Download receipt as PDF (simulated)
function downloadReceipt() {
    const receiptContent = document.getElementById('receipt-content');
    if (!receiptContent) return;
    
    // Create a downloadable link
    const content = receiptContent.innerHTML;
    const blob = new Blob([`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Risiti Ya Muamala - Tanzania Mining Investment</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt { max-width: 600px; margin: 0 auto; }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .receipt-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .status-approved { color: green; font-weight: bold; }
                .status-pending { color: orange; font-weight: bold; }
                .status-rejected { color: red; font-weight: bold; }
            </style>
        </head>
        <body>${content}</body>
        </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risiti-muamala-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Risiti imepakuliwa! Tafadhali fungua faili hii kwenye browser yako.');
}

// Update the login functions to auto-show transactions
function showUserDashboard() {
    console.log('Showing user dashboard...');
    
    // First hide all dashboards
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    // Check if user exists
    if (!db.currentUser) {
        console.error('No current user found!');
        return;
    }
    
    console.log('Current user:', db.currentUser);
    
    // Safely update user dashboard elements
    try {
        // Wait for DOM to be ready
        setTimeout(async () => {
            const usernameDisplay = document.getElementById('username-display');
            const dashboardBalance = document.getElementById('dashboard-balance');
            const profileBalance = document.getElementById('profile-balance');
            const profileBalanceDisplay = document.getElementById('profile-balance-display');
            const withdrawBalance = document.getElementById('withdraw-balance');
            const userReferralCode = document.getElementById('user-referral-code');
            
            if (usernameDisplay) {
                usernameDisplay.textContent = db.currentUser.username;
                console.log('Username set to:', db.currentUser.username);
            }
            
            if (dashboardBalance && db.formatCurrency) {
                dashboardBalance.textContent = db.formatCurrency(db.currentUser.balance || 0);
                console.log('Balance set to:', db.currentUser.balance);
            }
            
            if (userReferralCode) {
                userReferralCode.textContent = db.currentUser.referral_code || '';
                console.log('Referral code set to:', db.currentUser.referral_code);
            }
            
            // AUTO-SHOW TRANSACTIONS ON LOGIN
            setupAutoShowTransactions();
            
            // Initialize investment system
            await initInvestmentSystem();
            
            // Start real-time listener
            startInvestmentFirebaseListener();
            
            // Load referrals if function exists
            if (typeof loadUserReferrals === 'function') {
                loadUserReferrals();
            }
            
        }, 100); // Small delay to ensure DOM is ready
    } catch (error) {
        console.error('Error updating user dashboard:', error);
        alert('Error loading dashboard. Please refresh the page.');
    }
}

// Update admin login to auto-show transactions
function showAdminDashboard() {
    console.log('Showing admin dashboard...');
    
    // Hide all containers first
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('super-admin-dashboard').style.display = 'none';
    
    if (!db.currentUser) {
        console.error('No current user found for admin!');
        return;
    }
    
    // Safely update admin elements
    setTimeout(() => {
        const adminUsernameDisplay = document.getElementById('admin-username-display');
        if (adminUsernameDisplay) {
            adminUsernameDisplay.textContent = db.currentUser.username;
        }
        
        console.log('🛠️ Initializing admin dashboard...');
        
        // AUTO-SHOW TRANSACTIONS ON ADMIN LOGIN
        setupAutoShowTransactions();
        
        // Set up auto-refresh every 30 seconds for real-time updates
        setInterval(() => {
            if (document.getElementById('admin-approvals') && 
                document.getElementById('admin-approvals').classList.contains('active')) {
                loadPendingTransactions();
            }
            if (document.getElementById('admin-history') && 
                document.getElementById('admin-history').classList.contains('active')) {
                loadAdminTransactionHistory();
            }
        }, 30000);
        
        console.log('✅ Admin dashboard initialized');
    }, 100);
}

// Helper function to get bank name
function getBankName(method) {
    if (!method) return 'N/A';
    
    const bankNames = {
        'vodacom': 'Vodacom M-Pesa',
        'tigo': 'Tigo Pesa',
        'airtel': 'Airtel Money',
        'halotel': 'Halotel Halopesa',
        'crdb': 'CRDB Bank',
        'nmb': 'NMB Bank',
        'ezy': 'Ezy Pesa',
        'bank': 'Benki',
        'other': 'Nyingine',
        'mpesa': 'M-Pesa',
        'tigopesa': 'Tigo Pesa',
        'airtelmoney': 'Airtel Money',
        'halopesa': 'Halopesa'
    };
    
    return bankNames[method.toLowerCase()] || method;
}

// Make functions global
window.showReceiptModal = showReceiptModal;
window.closeReceiptModal = closeReceiptModal;
window.printReceipt = printReceipt;
window.downloadReceipt = downloadReceipt;

// Initialize auto-show on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (db && db.currentUser) {
        setTimeout(() => {
            setupAutoShowTransactions();
        }, 2000);
    }
});








// ===== SIMPLIFIED TRANSACTION HISTORY & RECEIPT SYSTEM =====

// Global variable for current receipt data
window.currentReceiptData = null;

// Load transaction history for user
async function loadTransactionHistory() {
    const historyBody = document.getElementById('transaction-history-body');
    if (!historyBody) {
        console.error('Transaction history body element not found');
        return;
    }
    
    historyBody.innerHTML = '';
    
    if (!db.currentUser) {
        historyBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Samahani, tafadhali ingia kwanza</td></tr>';
        return;
    }
    
    try {
        // Show loading indicator
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">Inapakia historia ya miradi...</h4>
                </td>
            </tr>
        `;
        
        // Get transactions
        const transactions = await db.getUserTransactions(db.currentUser.id);
        
        if (!Array.isArray(transactions)) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                        <h4 style="color: #e74c3c; margin-bottom: 10px;">Hitilafu ya Mfumo</h4>
                        <p style="color: #95a5a6;">Transaksi hazipatikani kwa sasa</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        if (transactions.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                        <h4 style="color: #2c3e50; margin-bottom: 10px;">Hakuna Historia ya Miradi</h4>
                        <p style="color: #7f8c8d;">Haujaanza muamala wowote bado</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = transactions.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });
        
        // Clear and populate table
        historyBody.innerHTML = '';
        
        sortedTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Format date
            const date = transaction.date ? new Date(transaction.date) : new Date();
            const formattedDate = date.toLocaleDateString('sw-TZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Format amount
            const amount = db.formatCurrency ? db.formatCurrency(transaction.amount) : `TZS ${(transaction.amount || 0).toLocaleString()}`;
            
            // Status
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
            
            // Transaction details
            let details = '';
            let transactionIcon = '';
            
            if (transaction.type === 'deposit') {
                transactionIcon = '📥';
                const senderName = transaction.details?.senderName || 'Haijawekwa';
                const senderAccount = transaction.details?.senderAccount || 'Haijawekwa';
                const method = transaction.method || transaction.details?.method || 'N/A';
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
                const method = transaction.method || transaction.details?.method || 'N/A';
                details = `
                    <div><strong>${transactionIcon} Kutoa</strong></div>
                    <div style="font-size: 12px; color: #666;">Kwa: ${accountName}</div>
                    <div style="font-size: 12px; color: #666;">Akaunti: ${accountNumber}</div>
                    <div style="font-size: 12px; color: #666;">Njia: ${method}</div>
                `;
            } else {
                transactionIcon = '💳';
                details = transaction.description || `Muamala wa ${transaction.type || 'haijulikani'}`;
            }
            
            // Transaction ID
            const transactionId = transaction.transaction_id || transaction.id || 'N/A';
            
            // Receipt button
            const receiptButton = `
                <button onclick="showReceiptModal(${transaction.id})" 
                        style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: all 0.3s;">
                    📄 Risiti
                </button>
            `;
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: bold; color: #2c3e50;">${formattedDate}</div>
                    <div style="font-size: 11px; color: #95a5a6;">ID: ${transactionId}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">${transactionIcon}</span>
                        <span style="font-weight: 500;">${transaction.type === 'deposit' ? 'Kuwaweka' : 
                                transaction.type === 'withdrawal' ? 'Kutoa' : 
                                transaction.type}</span>
                    </div>
                </td>
                <td>
                    <div style="font-weight: bold; font-size: 16px; 
                               color: ${transaction.type === 'withdrawal' ? '#e74c3c' : '#27ae60'}">
                        ${transaction.type === 'withdrawal' ? '-' : '+'}${amount}
                    </div>
                </td>
                <td>
                    <span class="${statusClass}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-weight: bold;">
                        ${statusIcon} ${statusText}
                    </span>
                </td>
                <td style="max-width: 200px;">${details}</td>
                <td>
                    ${receiptButton}
                </td>
            `;
            
            historyBody.appendChild(row);
        });
        
        // Add CSS if not present
        if (!document.getElementById('transaction-styles')) {
            const styleHTML = `
                <style id="transaction-styles">
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .status-pending { background: #fef5e7; color: #f39c12; }
                    .status-approved { background: #d5f4e6; color: #27ae60; }
                    .status-rejected { background: #fadbd8; color: #e74c3c; }
                    button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styleHTML);
        }
        
    } catch (error) {
        console.error('Error loading transaction history:', error);
        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h4 style="color: #e74c3c; margin-bottom: 10px;">Hitilafu Ilitokea</h4>
                    <p style="color: #95a5a6;">${error.message || 'Tafadhali jaribu tena baadae'}</p>
                </td>
            </tr>
        `;
    }
}

// ===== SIMPLE RECEIPT MODAL SYSTEM =====

// Create receipt modal
function createReceiptModal() {
    if (document.getElementById('receipt-modal')) return;
    
    const modalHTML = `
        <div id="receipt-modal" class="modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); overflow-y: auto;">
            <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 0; width: 90%; max-width: 600px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #2c3e50; color: white;">
                    <h2 style="margin: 0; font-size: 22px;">📄 RISITI YA MUAMALA</h2>
                    <button onclick="closeReceiptModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: white;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 30px; max-height: 70vh; overflow-y: auto;">
                    <div id="receipt-content"></div>
                </div>
                <div class="modal-footer" style="padding: 20px; border-top: 1px solid #eee; text-align: center;">
                    <button onclick="printReceipt()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 5px;">
                        🖨️ Chapisha
                    </button>
                    <button onclick="downloadReceipt()" style="padding: 12px 24px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 5px;">
                        📥 Pakua
                    </button>
                    <button onclick="closeReceiptModal()" style="padding: 12px 24px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; margin: 5px;">
                        ✕ Funga
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    addReceiptStyles();
}

// Add receipt styles
function addReceiptStyles() {
    if (document.getElementById('receipt-styles')) return;
    
    const styleHTML = `
        <style id="receipt-styles">
            /* Receipt Content Styles */
            .receipt-container {
                font-family: 'Courier New', monospace;
                max-width: 100%;
                background: white;
                padding: 20px;
            }
            
            .receipt-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px dashed #ccc;
            }
            
            .receipt-header h1 {
                color: #2c3e50;
                font-size: 24px;
                margin: 0 0 10px 0;
            }
            
            .receipt-details {
                margin: 20px 0;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding-bottom: 8px;
                border-bottom: 1px dotted #eee;
            }
            
            .detail-label {
                font-weight: bold;
                color: #2c3e50;
            }
            
            .detail-value {
                text-align: right;
                font-weight: 600;
            }
            
            .amount-display {
                background: #27ae60;
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-size: 20px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
            }
            
            /* QR Code Section */
            .qr-section {
                text-align: center;
                margin: 25px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 2px solid #3498db;
            }
            
            .fake-qr-code {
                width: 150px;
                height: 150px;
                background: white;
                margin: 15px auto;
                border: 2px solid #ddd;
                position: relative;
                overflow: hidden;
            }
            
            .qr-pattern {
                position: absolute;
                width: 100%;
                height: 100%;
                background-image: 
                    repeating-linear-gradient(0deg, transparent, transparent 5px, #2c3e50 5px, #2c3e50 6px),
                    repeating-linear-gradient(90deg, transparent, transparent 5px, #2c3e50 5px, #2c3e50 6px);
                opacity: 0.1;
            }
            
            .qr-corners {
                position: absolute;
                width: 100%;
                height: 100%;
            }
            
            .qr-corner {
                position: absolute;
                width: 30px;
                height: 30px;
                border: 4px solid #2c3e50;
            }
            
            .qr-corner:nth-child(1) {
                top: 8px;
                left: 8px;
                border-radius: 6px;
            }
            
            .qr-corner:nth-child(2) {
                top: 8px;
                right: 8px;
                border-radius: 6px;
            }
            
            .qr-corner:nth-child(3) {
                bottom: 8px;
                left: 8px;
                border-radius: 6px;
            }
            
            .qr-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40px;
                height: 40px;
                background: #2c3e50;
                opacity: 0.2;
                border-radius: 4px;
            }
            
            .qr-text {
                position: absolute;
                bottom: -20px;
                left: 0;
                right: 0;
                font-size: 10px;
                color: #666;
                font-weight: bold;
            }
            
            .receipt-footer {
                text-align: center;
                margin-top: 25px;
                padding-top: 15px;
                border-top: 2px dashed #ccc;
            }
            
            /* Status Styles */
            .status-approved {
                color: #27ae60;
                font-weight: bold;
            }
            
            .status-pending {
                color: #f39c12;
                font-weight: bold;
            }
            
            .status-rejected {
                color: #e74c3c;
                font-weight: bold;
            }
            
            /* Print Styles */
            @media print {
                body * {
                    visibility: hidden;
                }
                #receipt-modal, #receipt-modal * {
                    visibility: visible;
                }
                #receipt-modal {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white;
                    margin: 0;
                    padding: 0;
                }
                .modal-footer {
                    display: none !important;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styleHTML);
}

// Show receipt modal
async function showReceiptModal(transactionId) {
    console.log('Showing receipt for transaction:', transactionId);
    
    // Create modal if it doesn't exist
    createReceiptModal();
    
    // Show loading
    document.getElementById('receipt-content').innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <h4 style="color: #2c3e50; margin-bottom: 10px;">Inapakia risiti...</h4>
        </div>
    `;
    
    // Show modal
    document.getElementById('receipt-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    try {
        // Get transaction data
        const users = await db.getUsers();
        let transaction = null;
        let user = null;
        
        for (const u of users) {
            if (u.transactions) {
                const found = u.transactions.find(t => t.id === transactionId);
                if (found) {
                    transaction = found;
                    user = u;
                    break;
                }
            }
        }
        
        if (!transaction) throw new Error('Muamala haupatikani');
        
        // Format dates
        const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
        const formattedDate = transactionDate.toLocaleDateString('sw-TZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = transactionDate.toLocaleTimeString('sw-TZ', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Status
        let statusText, statusClass;
        if (transaction.status === 'approved') {
            statusText = 'IMEFAULU';
            statusClass = 'status-approved';
        } else if (transaction.status === 'rejected') {
            statusText = 'IMEKATALIWA';
            statusClass = 'status-rejected';
        } else {
            statusText = 'INASUBIRI';
            statusClass = 'status-pending';
        }
        
        // Transaction type
        let typeText = '';
        if (transaction.type === 'deposit') {
            typeText = 'KUWAWEKA FEDHA';
        } else if (transaction.type === 'withdrawal') {
            typeText = 'KUTOA FEDHA';
        } else {
            typeText = 'MUAMALA';
        }
        
        // Build receipt HTML
        const receiptHTML = `
            <div class="receipt-container">
                <div class="receipt-header">
                    <h1>TANZANIA MINING INVESTMENT</h1>
                    <p><strong>Huduma za Uwekezaji</strong></p>
                    <div style="background: #f8f9fa; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold;">
                        RISITI: #TMI${transaction.id.toString().padStart(6, '0')}
                    </div>
                </div>
                
                <div class="receipt-details">
                    <div class="detail-row">
                        <span class="detail-label">Tarehe ya Muamala:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Muda wa Muamala:</span>
                        <span class="detail-value">${formattedTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Namba ya Mteja:</span>
                        <span class="detail-value">#${user.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Jina la Mteja:</span>
                        <span class="detail-value">${user.username || 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Aina ya Muamala:</span>
                        <span class="detail-value">${typeText}</span>
                    </div>
                    
                    <div class="amount-display">
                        ${db.formatCurrency(transaction.amount)}
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Njia ya Malipo:</span>
                        <span class="detail-value">${getBankName(transaction.method || transaction.details?.method)}</span>
                    </div>
                    
                    ${transaction.type === 'deposit' ? `
                    <div class="detail-row">
                        <span class="detail-label">Jina la Mtumaji:</span>
                        <span class="detail-value">${transaction.details?.senderName || 'Haijawekwa'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Akaunti ya Mtumaji:</span>
                        <span class="detail-value">${transaction.details?.senderAccount || 'Haijawekwa'}</span>
                    </div>
                    ` : transaction.type === 'withdrawal' ? `
                    <div class="detail-row">
                        <span class="detail-label">Jina la Mlipokeaji:</span>
                        <span class="detail-value">${transaction.details?.accountName || 'Haijawekwa'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Akaunti ya Mlipokeaji:</span>
                        <span class="detail-value">${transaction.details?.accountNumber || 'Haijawekwa'}</span>
                    </div>
                    ` : ''}
                    
                    <div class="detail-row">
                        <span class="detail-label">Hali ya Muamala:</span>
                        <span class="detail-value ${statusClass}">${statusText}</span>
                    </div>
                </div>
                
                <!-- QR Code Section -->
                <div class="qr-section">
                    <div style="background: #3498db; color: white; padding: 5px 15px; border-radius: 15px; display: inline-block; font-weight: bold; margin-bottom: 15px;">
                        QR CODE YA UTHIBITISHO
                    </div>
                    <div class="fake-qr-code">
                        <div class="qr-pattern"></div>
                        <div class="qr-corners">
                            <div class="qr-corner"></div>
                            <div class="qr-corner"></div>
                            <div class="qr-corner"></div>
                        </div>
                        <div class="qr-center"></div>
                        <div class="qr-text">TMI${transaction.id}</div>
                    </div>
                    <p style="font-size: 12px; color: #666; margin-top: 15px;">
                        <strong>Skani kuthibitisha ukweli wa risiti hii</strong><br>
                        verify.tanzaniamining.co.tz
                    </p>
                </div>
                
                <div class="receipt-footer">
                    <p><strong>📞 Huduma za Wateja:</strong> +255 753 928 102</p>
                    <p><strong>📧 Barua Pepe:</strong> mining.investment.tanzania@proton.me</p>
                    <p style="font-size: 12px; color: #7f8c8d; margin-top: 15px;">
                        Risiti hii ni ushahidi rasmi. Tafadhali hifadhi kwa usalama.
                    </p>
                    <div style="background: #27ae60; color: white; padding: 10px; border-radius: 5px; margin-top: 15px;">
                        <strong>ASANTE KWA KUWEKEZA NA KUTUAMINI!</strong>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('receipt-content').innerHTML = receiptHTML;
        
        // Store transaction data
        window.currentReceiptData = {
            id: transaction.id,
            user: user,
            transaction: transaction
        };
        
    } catch (error) {
        console.error('Error loading receipt:', error);
        document.getElementById('receipt-content').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h4 style="color: #e74c3c; margin-bottom: 10px;">Hitilafu Ilitokea</h4>
                <p style="color: #95a5a6;">${error.message || 'Imeshindwa kupakia risiti'}</p>
            </div>
        `;
    }
}

// Close receipt modal
function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        window.currentReceiptData = null;
    }
}

// Print receipt
function printReceipt() {
    if (!window.currentReceiptData) {
        alert('Tafadhali subiri risiti ipakie kwanza');
        return;
    }
    window.print();
}

// Download receipt as HTML
function downloadReceipt() {
    if (!window.currentReceiptData) {
        alert('Tafadhali subiri risiti ipakie kwanza');
        return;
    }
    
    const receiptContent = document.getElementById('receipt-content').innerHTML;
    const data = window.currentReceiptData;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Risiti #TMI${data.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt-container { max-width: 600px; margin: 0 auto; }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                .amount-display { background: #27ae60; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; }
                .qr-section { text-align: center; margin: 20px 0; padding: 20px; border: 2px solid #3498db; }
                .receipt-footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px dashed #ccc; }
            </style>
        </head>
        <body>
            ${receiptContent}
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risiti_TMI${data.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Risiti imepakuliwa! Fungua faili hii kwenye browser yako.');
}

// Helper function to get bank name
function getBankName(method) {
    if (!method) return 'Haijawekwa';
    
    const banks = {
        'nmb': 'NMB Bank',
        'crdb': 'CRDB Bank',
        'airtel': 'Airtel Money',
        'tigo': 'Tigo Pesa',
        'mpesa': 'M-Pesa',
        'halopesa': 'Halopesa',
        'tpesa': 'T-Pesa',
        'vodacom': 'Vodacom M-Pesa',
        'bank': 'Benki',
        'mobile': 'Mkoba wa simu'
    };
    
    return banks[method.toLowerCase()] || method;
}

// Export functions
window.loadTransactionHistory = loadTransactionHistory;
window.showReceiptModal = showReceiptModal;
window.closeReceiptModal = closeReceiptModal;
window.printReceipt = printReceipt;
window.downloadReceipt = downloadReceipt;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if transaction history should be loaded
    if (db && db.currentUser && document.getElementById('transaction-history-body')) {
        setTimeout(loadTransactionHistory, 500);
    }
});

// ===== QUICK FIX - Hamburger Isolation =====
// Add this to your existing JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Track which dashboard is active
    let activeDashboard = 'user';
    
    // Function to determine active dashboard
    function getActiveDashboard() {
        // Check which dashboard is visible
        if (!document.getElementById('user-dashboard').classList.contains('hidden')) {
            return 'user';
        } else if (!document.getElementById('admin-dashboard').classList.contains('hidden')) {
            return 'admin';
        } else if (!document.getElementById('super-admin-dashboard').classList.contains('hidden')) {
            return 'super-admin';
        }
        return 'user';
    }
    
    // Override hamburger button clicks
    document.addEventListener('click', function(e) {
        // Check if clicked element is a hamburger button
        const hamburgerBtn = e.target.closest('.hamburger-btn');
        if (!hamburgerBtn) return;
        
        // Get the dashboard from button ID
        let dashboard = 'user';
        if (hamburgerBtn.id === 'admin-hamburger') {
            dashboard = 'admin';
        } else if (hamburgerBtn.id === 'super-admin-hamburger') {
            dashboard = 'super-admin';
        }
        
        // Update active dashboard
        activeDashboard = dashboard;
        console.log(`Active dashboard: ${activeDashboard}`);
        
        // Only toggle sidebar for active dashboard
        toggleSidebarForDashboard(activeDashboard);
        
        // Prevent default behavior
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Function to toggle sidebar for specific dashboard
    function toggleSidebarForDashboard(dashboard) {
        const sidebar = document.getElementById(`${dashboard}-sidebar`);
        const overlay = document.getElementById(`${dashboard}-sidebar-overlay`);
        
        if (!sidebar) return;
        
        if (sidebar.classList.contains('active')) {
            // Close sidebar
            sidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            // Close all other sidebars first
            ['user', 'admin', 'super-admin'].forEach(d => {
                if (d !== dashboard) {
                    const otherSidebar = document.getElementById(`${d}-sidebar`);
                    const otherOverlay = document.getElementById(`${d}-sidebar-overlay`);
                    if (otherSidebar) otherSidebar.classList.remove('active');
                    if (otherOverlay) otherOverlay.classList.remove('active');
                }
            });
            
            // Open requested sidebar
            sidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Override close button clicks
    document.addEventListener('click', function(e) {
        const closeBtn = e.target.closest('.sidebar-close');
        if (!closeBtn) return;
        
        // Find which sidebar to close
        const sidebarId = closeBtn.closest('.dashboard-sidebar')?.id;
        if (!sidebarId) return;
        
        const dashboard = sidebarId.replace('-sidebar', '');
        closeSidebarForDashboard(dashboard);
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    function closeSidebarForDashboard(dashboard) {
        const sidebar = document.getElementById(`${dashboard}-sidebar`);
        const overlay = document.getElementById(`${dashboard}-sidebar-overlay`);
        
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Overlay click
    document.querySelectorAll('.sidebar-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            const overlayId = this.id;
            const dashboard = overlayId.replace('-sidebar-overlay', '');
            closeSidebarForDashboard(dashboard);
        });
    });
    
    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close all sidebars
            ['user', 'admin', 'super-admin'].forEach(dashboard => {
                closeSidebarForDashboard(dashboard);
            });
        }
    });
});

// ===== AUTO-CLOSE ADDON =====
// Add this to your existing hamburger isolation code

// Add auto-close for navigation clicks
function addAutoCloseToNavigation() {
    // Listen for all navigation clicks
    document.addEventListener('click', function(e) {
        // Check if click is on any navigation element
        const isNavClick = e.target.closest('.nav-link') || 
                          e.target.closest('.dropdown-link') || 
                          e.target.closest('.action-btn') || 
                          e.target.closest('.logout-btn');
        
        if (!isNavClick) return;
        
        // Find which sidebar this click belongs to
        const sidebar = isNavClick.closest('.dashboard-sidebar');
        if (!sidebar) return;
        
        // Get dashboard name from sidebar ID
        const dashboard = sidebar.id.replace('-sidebar', '');
        
        // Close the sidebar after delay
        setTimeout(() => {
            closeSidebarForDashboard(dashboard);
        }, 300);
    });
}

// Make sure this function is available
function closeSidebarForDashboard(dashboard) {
    const sidebar = document.getElementById(`${dashboard}-sidebar`);
    const overlay = document.getElementById(`${dashboard}-sidebar-overlay`);
    
    if (sidebar) {
        sidebar.classList.remove('active');
        // Also close any open dropdowns
        const openDropdowns = sidebar.querySelectorAll('.nav-item.open');
        openDropdowns.forEach(item => {
            item.classList.remove('open');
        });
    }
    
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Initialize auto-close
document.addEventListener('DOMContentLoaded', addAutoCloseToNavigation);




















// Daily Rewards System - Firebase Firestore Version
class DailyRewards {
    constructor() {
        if (!firebase.apps.length) {
            throw new Error('Firebase not initialized');
        }
        this.db = firebase.firestore();
        this.rewardCodesCollection = this.db.collection('reward_codes');
        this.rewardRedemptionsCollection = this.db.collection('reward_redemptions');
        this.usersCollection = this.db.collection('users');
    }

    async initRewardsDatabase() {
        try {
            // Check if collection exists and initialize with empty if needed
            const codesSnapshot = await this.rewardCodesCollection.limit(1).get();
            const redemptionsSnapshot = await this.rewardRedemptionsCollection.limit(1).get();
            
            console.log('Rewards database initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing rewards database:', error);
            throw error;
        }
    }

    async getRewardCodes() {
        try {
            const snapshot = await this.rewardCodesCollection.get();
            const codes = [];
            snapshot.forEach(doc => {
                codes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return codes;
        } catch (error) {
            console.error('Error getting reward codes:', error);
            return [];
        }
    }

    async getRewardRedemptions() {
        try {
            const snapshot = await this.rewardRedemptionsCollection.get();
            const redemptions = [];
            snapshot.forEach(doc => {
                redemptions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return redemptions;
        } catch (error) {
            console.error('Error getting reward redemptions:', error);
            return [];
        }
    }

    async generateRewardCode(amount, expiresAt = null, usageLimit = null) {
        try {
            // Generate a unique code
            let code;
            let isUnique = false;
            let attempts = 0;
            
            while (!isUnique && attempts < 10) {
                code = this.generateUniqueCode();
                
                // Check if code exists in Firestore
                const existingCode = await this.rewardCodesCollection
                    .where('code', '==', code)
                    .limit(1)
                    .get();
                
                if (existingCode.empty) {
                    isUnique = true;
                }
                attempts++;
            }
            
            if (!isUnique) {
                throw new Error('Failed to generate unique reward code');
            }
            
            const newCode = {
                code: code,
                amount: parseInt(amount),
                createdBy: db.currentUser.id,
                createdByUsername: db.currentUser.username,
                createdAt: new Date().toISOString(),
                expiresAt: expiresAt,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                isActive: true,
                redeemedBy: [], // Track which users have redeemed this code
                totalRedemptions: 0,
                totalAmountRedeemed: 0
            };
            
            // Add to Firestore
            const docRef = await this.rewardCodesCollection.add(newCode);
            
            return {
                id: docRef.id,
                ...newCode
            };
            
        } catch (error) {
            console.error('Error generating reward code:', error);
            throw error;
        }
    }

    generateUniqueCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async claimReward(code, userId, username) {
        try {
            // Find the reward code in Firestore
            const rewardQuery = await this.rewardCodesCollection
                .where('code', '==', code.toUpperCase())
                .limit(1)
                .get();
            
            if (rewardQuery.empty) {
                return { success: false, message: '❌ Invalid reward code' };
            }
            
            const rewardDoc = rewardQuery.docs[0];
            const rewardCode = rewardDoc.data();
            
            if (!rewardCode.isActive) {
                return { success: false, message: '❌ This reward code is no longer active' };
            }
            
            // Check if code has expired
            if (rewardCode.expiresAt && new Date() > new Date(rewardCode.expiresAt)) {
                // Auto-deactivate expired codes
                await this.rewardCodesCollection.doc(rewardDoc.id).update({
                    isActive: false
                });
                return { success: false, message: '❌ This reward code has expired' };
            }
            
            // Check if user has already claimed this code
            const userRedemption = rewardCode.redeemedBy.find(redemption => 
                redemption.userId === userId
            );
            
            if (userRedemption) {
                return { success: false, message: '❌ You have already claimed this reward code' };
            }
            
            // Check usage limit
            if (rewardCode.usageLimit && rewardCode.redeemedBy.length >= rewardCode.usageLimit) {
                // Auto-deactivate when limit reached
                await this.rewardCodesCollection.doc(rewardDoc.id).update({
                    isActive: false
                });
                return { success: false, message: '❌ This reward code has reached its usage limit' };
            }
            
            // Create redemption record
            const redemptionRecord = {
                userId: userId,
                username: username,
                redeemedAt: new Date().toISOString()
            };
            
            // Create redemption history record
            const redemption = {
                userId: userId,
                username: username,
                codeId: rewardDoc.id,
                code: rewardCode.code,
                amount: rewardCode.amount,
                redeemedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            // Update reward code with new redemption
            const updatedRedeemedBy = [...rewardCode.redeemedBy, redemptionRecord];
            
            await this.rewardCodesCollection.doc(rewardDoc.id).update({
                redeemedBy: updatedRedeemedBy,
                totalRedemptions: rewardCode.totalRedemptions + 1,
                totalAmountRedeemed: rewardCode.totalAmountRedeemed + rewardCode.amount
            });
            
            // Add redemption to history
            await this.rewardRedemptionsCollection.add(redemption);
            
            return { 
                success: true, 
                message: `🎉 Successfully claimed ${db.formatCurrency(rewardCode.amount)} reward! Amount added to your balance.`,
                amount: rewardCode.amount
            };
            
        } catch (error) {
            console.error('Error claiming reward:', error);
            return { success: false, message: '❌ Error processing reward claim. Please try again.' };
        }
    }

    async deactivateRewardCode(codeId) {
        try {
            await this.rewardCodesCollection.doc(codeId).update({
                isActive: false,
                updatedAt: new Date().toISOString()
            });
            return true;
        } catch (error) {
            console.error('Error deactivating reward code:', error);
            return false;
        }
    }

    async getActiveRewardCodes() {
        try {
            const snapshot = await this.rewardCodesCollection
                .where('isActive', '==', true)
                .get();
            
            const codes = [];
            snapshot.forEach(doc => {
                codes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return codes;
        } catch (error) {
            console.error('Error getting active reward codes:', error);
            return [];
        }
    }

    async getUserClaimedRewards(userId) {
        try {
            const snapshot = await this.rewardRedemptionsCollection
                .where('userId', '==', userId)
                .orderBy('redeemedAt', 'desc')
                .get();
            
            const redemptions = [];
            snapshot.forEach(doc => {
                redemptions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return redemptions;
        } catch (error) {
            console.error('Error getting user claimed rewards:', error);
            return [];
        }
    }

    async getAllRedemptions() {
        try {
            const snapshot = await this.rewardRedemptionsCollection
                .orderBy('redeemedAt', 'desc')
                .get();
            
            const redemptions = [];
            snapshot.forEach(doc => {
                redemptions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return redemptions;
        } catch (error) {
            console.error('Error getting all redemptions:', error);
            return [];
        }
    }

    async getRewardStats() {
        try {
            // Get active codes count
            const activeCodesSnapshot = await this.rewardCodesCollection
                .where('isActive', '==', true)
                .get();
            const activeCodes = activeCodesSnapshot.size;
            
            // Get total redeemed amount from redemptions collection
            const redemptionsSnapshot = await this.rewardRedemptionsCollection.get();
            let totalRedeemed = 0;
            redemptionsSnapshot.forEach(doc => {
                const redemption = doc.data();
                totalRedeemed += redemption.amount || 0;
            });
            
            return {
                activeCodes: activeCodes,
                totalRedeemed: totalRedeemed
            };
        } catch (error) {
            console.error('Error getting reward stats:', error);
            return {
                activeCodes: 0,
                totalRedeemed: 0
            };
        }
    }
}

// Initialize rewards system
const dailyRewards = new DailyRewards();

// Initialize rewards database when app starts
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    dailyRewards.initRewardsDatabase().catch(console.error);
}

// User Functions - NO CHANGES NEEDED
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
    
    // Use async/await for Firebase
    (async () => {
        const result = await dailyRewards.claimReward(code, db.currentUser.id, db.currentUser.username);
        
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
    })();
}

function showRewardStatus(message, type) {
    const statusElement = document.getElementById('reward-status');
    statusElement.textContent = message;
    statusElement.className = `reward-status ${type}`;
    statusElement.style.display = 'block';
}

async function loadUserClaimedRewards() {
    if (!db.currentUser) return;
    
    const claimedRewardsList = document.getElementById('claimed-rewards-list');
    const userRewards = await dailyRewards.getUserClaimedRewards(db.currentUser.id);
    
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

// Admin Functions - Updated with async/await
async function generateRewardCode() {
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
    
    try {
        const rewardCode = await dailyRewards.generateRewardCode(amount, expiry, usageLimit);
        
        // Clear form
        amountInput.value = '1000'; // Reset to default value
        expiryInput.value = '';
        usageLimitInput.value = '';
        
        // Refresh reward codes display
        loadAdminRewardCodes();
        
        // Show success message with code
        alert(`🎉 Reward code generated successfully!\n\nCode: ${rewardCode.code}\nAmount: ${db.formatCurrency(amount)}\n\nCopy this code and share it with users!`);
    } catch (error) {
        alert('Error generating reward code: ' + error.message);
    }
}

async function loadAdminRewardCodes() {
    const activeRewardCodes = document.getElementById('active-reward-codes');
    
    try {
        const codes = await dailyRewards.getActiveRewardCodes();
        const stats = await dailyRewards.getRewardStats();
        
        // Update stats
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
            const usageCount = code.redeemedBy ? code.redeemedBy.length : 0;
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
                    ${code.redeemedBy && code.redeemedBy.length > 0 ? `
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
                        <button class="btn" style="background: #e74c3c;" onclick="deactivateRewardCode('${code.id}')">
                            <i class="fas fa-ban"></i> Deactivate
                        </button>
                    </div>
                </div>
            `;
        });
        
        activeRewardCodes.innerHTML = html;
    } catch (error) {
        console.error('Error loading admin reward codes:', error);
        activeRewardCodes.innerHTML = '<div class="error-message">Error loading reward codes. Please try again.</div>';
    }
}

async function loadRewardRedemptionHistory() {
    const rewardHistory = document.getElementById('reward-redemption-history');
    
    try {
        const redemptions = await dailyRewards.getAllRedemptions();
        
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
    } catch (error) {
        console.error('Error loading reward redemption history:', error);
        rewardHistory.innerHTML = '<div class="error-message">Error loading redemption history.</div>';
    }
}

function copyRewardCode(code) {
    navigator.clipboard.writeText(code);
    showNotification('Reward code copied to clipboard!');
}

async function deactivateRewardCode(codeId) {
    if (confirm('Are you sure you want to deactivate this reward code? Users will no longer be able to claim it.')) {
        const success = await dailyRewards.deactivateRewardCode(codeId);
        
        if (success) {
            loadAdminRewardCodes();
            showNotification('Reward code deactivated successfully');
        } else {
            showNotification('Error deactivating reward code', true);
        }
    }
}

// Initialize rewards when dashboard loads
async function initRewardsSystem() {
    if (db.currentUser) {
        try {
            if (db.currentUser.is_admin) {
                await loadAdminRewardCodes();
                await loadRewardRedemptionHistory();
            } else {
                await loadUserClaimedRewards();
            }
        } catch (error) {
            console.error('Error initializing rewards system:', error);
        }
    }
}

// Add these functions to update dashboard stats
async function updateUserDashboardStats() {
    try {
        if (!db.currentUser) return;
        
        // Update total balance
        const totalBalance = document.getElementById('total-balance');
        if (totalBalance) {
            totalBalance.textContent = db.formatCurrency(db.currentUser.balance);
        }
        
        // Update active investments count
        const activeInvestments = investments.filter(inv => !inv.completed);
        const activeInvestmentsEl = document.getElementById('active-investments');
        if (activeInvestmentsEl) {
            activeInvestmentsEl.textContent = activeInvestments.length;
        }
        
        // Update total profit
        const totalProfitEl = document.getElementById('total-profit');
        if (totalProfitEl) {
            let totalProfit = 0;
            investments.forEach(investment => {
                if (investment.completed) {
                    totalProfit += investment.finalProfit || 0;
                } else {
                    totalProfit += calculateCurrentProfit(investment);
                }
            });
            totalProfitEl.textContent = db.formatCurrency(totalProfit);
        }
        
        // Update referral count
        const referralCountEl = document.getElementById('referral-count-card');
        if (referralCountEl && db.currentUser.referrals) {
            referralCountEl.textContent = db.currentUser.referrals.length;
        }
        
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Call this function when dashboard loads
function initUserDashboardStats() {
    updateUserDashboardStats();
    // Update every 30 seconds
    setInterval(updateUserDashboardStats, 30000);
}

// Add these functions to update referral stats
async function updateReferralStats() {
    try {
        if (!db.currentUser) return;
        
        // Update total referrals count
        const totalReferralsEl = document.getElementById('total-referrals');
        if (totalReferralsEl && db.currentUser.referrals) {
            totalReferralsEl.textContent = db.currentUser.referrals.length;
        }
        
        // Update total earnings
        const totalEarningsEl = document.getElementById('total-earnings');
        if (totalEarningsEl) {
            let totalEarnings = 0;
            if (db.currentUser.referrals) {
                db.currentUser.referrals.forEach(ref => {
                    totalEarnings += ref.bonus_amount || 0;
                });
            }
            totalEarningsEl.textContent = db.formatCurrency(totalEarnings);
        }
        
        // Update active referrals count
        const activeReferralsEl = document.getElementById('active-referrals');
        if (activeReferralsEl && db.currentUser.referrals) {
            const activeReferrals = db.currentUser.referrals.filter(ref => 
                ref.status !== 'inactive' && ref.status !== 'suspended'
            );
            activeReferralsEl.textContent = activeReferrals.length;
        }
        
        // Update pending earnings
        const pendingEarningsEl = document.getElementById('pending-earnings');
        if (pendingEarningsEl && db.currentUser.referrals) {
            let pendingEarnings = 0;
            db.currentUser.referrals.forEach(ref => {
                if (ref.bonus_pending === true && !ref.bonus_paid) {
                    pendingEarnings += ref.bonus_amount || 0;
                }
            });
            pendingEarningsEl.textContent = db.formatCurrency(pendingEarnings);
        }
        
    } catch (error) {
        console.error('Error updating referral stats:', error);
    }
}

// Add to ChatSystem class or create separate functions
async function updateChatStats() {
    try {
        if (!window.chatSystem) return;
        
        // Update chat badge counts
        const pendingChats = await chatSystem.getPendingChatsCount();
        
        // Update admin sidebar badge
        const chatBadge = document.getElementById('chat-badge');
        if (chatBadge) {
            chatBadge.textContent = pendingChats > 0 ? pendingChats : '';
            chatBadge.style.display = pendingChats > 0 ? 'flex' : 'none';
        }
        
        // Update bottom bar badge
        const bottomChatBadge = document.getElementById('bottom-chat-badge');
        if (bottomChatBadge) {
            bottomChatBadge.textContent = pendingChats > 0 ? pendingChats : '';
            bottomChatBadge.style.display = pendingChats > 0 ? 'flex' : 'none';
        }
        
    } catch (error) {
        console.error('Error updating chat stats:', error);
    }
}

// Add to ChatSystem class
async function getPendingChatsCount() {
    try {
        if (!this.chatsCollection) return 0;
        
        const snapshot = await this.chatsCollection.get();
        let pendingCount = 0;
        
        snapshot.forEach(doc => {
            const chatData = doc.data();
            if (chatData.unreadCount > 0) {
                pendingCount++;
            }
        });
        
        return pendingCount;
    } catch (error) {
        console.error('Error getting pending chats count:', error);
        return 0;
    }
}

// Add function to load admin stats
async function loadAdminStats() {
    try {
        console.log('📊 Loading admin statistics...');
        
        // Get total users
        const totalUsers = await db.getTotalUsers();
        const totalUsersEl = document.getElementById('total-users');
        if (totalUsersEl) {
            totalUsersEl.textContent = totalUsers;
        }
        
        // Get total deposits
        const totalDeposits = await db.getTotalDeposits();
        const totalDepositsEl = document.getElementById('total-deposits');
        if (totalDepositsEl) {
            totalDepositsEl.textContent = db.formatCurrency(totalDeposits);
        }
        
        // Get total withdrawals
        const totalWithdrawals = await db.getTotalWithdrawals();
        const totalWithdrawalsEl = document.getElementById('total-withdrawals');
        if (totalWithdrawalsEl) {
            totalWithdrawalsEl.textContent = db.formatCurrency(totalWithdrawals);
        }
        
        // Get pending transactions count
        const pendingTransactions = await db.getPendingTransactions();
        const pendingTransactionsEl = document.getElementById('pending-transactions-count');
        if (pendingTransactionsEl) {
            pendingTransactionsEl.textContent = pendingTransactions.length;
        }
        
        console.log('✅ Admin statistics loaded');
        
    } catch (error) {
        console.error('❌ Error loading admin stats:', error);
    }
}

// Add function to update pending count badge
async function updatePendingCountBadge() {
    try {
        const pendingTransactions = await db.getPendingTransactions();
        const pendingCount = pendingTransactions.length;
        
        // Update sidebar badge
        const pendingBadge = document.getElementById('pending-count');
        if (pendingBadge) {
            pendingBadge.textContent = pendingCount > 0 ? pendingCount : '';
            pendingBadge.style.display = pendingCount > 0 ? 'flex' : 'none';
        }
        
    } catch (error) {
        console.error('Error updating pending count badge:', error);
    }
}

// Add function to load super admin data
async function loadSuperAdminData() {
    try {
        console.log('👑 Loading super admin data...');
        
        await Promise.all([
            loadAdminsList(),
            loadUsersList(),
            loadSystemStats(),
            loadRecentActivities()
        ]);
        
        console.log('✅ Super admin data loaded');
        
    } catch (error) {
        console.error('❌ Error loading super admin data:', error);
    }
}

// Add function to load admins list
async function loadAdminsList() {
    try {
        const users = await db.getUsers();
        const admins = users.filter(user => user.is_admin);
        
        // Update admin counts
        const totalAdminsEl = document.getElementById('total-admins-count');
        const superAdminsEl = document.getElementById('super-admins-count');
        const activeAdminsEl = document.getElementById('active-admins-count');
        const suspendedAdminsEl = document.getElementById('suspended-admins-count');
        
        if (totalAdminsEl) totalAdminsEl.textContent = admins.length;
        
        const superAdmins = admins.filter(admin => admin.is_super_admin);
        if (superAdminsEl) superAdminsEl.textContent = superAdmins.length;
        
        const activeAdmins = admins.filter(admin => admin.status === 'active');
        if (activeAdminsEl) activeAdminsEl.textContent = activeAdmins.length;
        
        const suspendedAdmins = admins.filter(admin => admin.status === 'suspended' || admin.status === 'inactive');
        if (suspendedAdminsEl) suspendedAdminsEl.textContent = suspendedAdmins.length;
        
    } catch (error) {
        console.error('Error loading admins list:', error);
    }
}

// Add function to update investment badge
function updateInvestmentBadge() {
    const activeInvestments = investments.filter(inv => !inv.completed);
    const investmentBadge = document.getElementById('sidebar-investments-badge');
    
    if (investmentBadge) {
        investmentBadge.textContent = activeInvestments.length > 0 ? activeInvestments.length : '';
        investmentBadge.style.display = activeInvestments.length > 0 ? 'flex' : 'none';
    }
}

// Add function to update referral badge
function updateReferralBadge() {
    const referralBadge = document.getElementById('sidebar-referral-badge');
    if (referralBadge && db.currentUser && db.currentUser.referrals) {
        const pendingReferrals = db.currentUser.referrals.filter(ref => 
            ref.bonus_pending === true && !ref.bonus_paid
        );
        referralBadge.textContent = pendingReferrals.length > 0 ? pendingReferrals.length : '';
        referralBadge.style.display = pendingReferrals.length > 0 ? 'flex' : 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Initialize all stats when page loads
    if (db.currentUser) {
        if (db.currentUser.is_super_admin) {
            loadSuperAdminData();
        } else if (db.currentUser.is_admin) {
            loadAdminStats();
            updatePendingCountBadge();
        } else {
            initUserDashboardStats();
            updateReferralStats();
        }
    }
    
    // Initialize chat system
    if (window.chatSystem) {
        setInterval(() => {
            updateChatStats();
        }, 30000);
    }
});