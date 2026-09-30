document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = '/index.html';
        return;
    }

    document.getElementById('user-display-name').textContent = user.fullName;
    document.getElementById('user-display-role').textContent = user.role;

    if (user.role === 'ADMIN') {
        document.getElementById('menu-user-mgmt').style.display = 'block';
        document.getElementById('menu-activity-log').style.display = 'block';
    } else if (user.role === 'SUPERVISOR') {
        document.getElementById('menu-activity-log').style.display = 'block';
    }

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);

    // Views and Elements
    const viewDashboard = document.getElementById('view-dashboard');
    const viewCatalog = document.getElementById('view-catalog');
    const viewUserMgmt = document.getElementById('view-user-mgmt');
    const viewActivityLog = document.getElementById('view-activity-log');
    const pageTitle = document.getElementById('page-title');

    // Navigation Switcher Helper
    function hideAllViews() {
        viewDashboard.style.display = 'none';
        viewCatalog.style.display = 'none';
        if (viewUserMgmt) viewUserMgmt.style.display = 'none';
        if (viewActivityLog) viewActivityLog.style.display = 'none';

        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    }

    // Navigation Event Listeners
    document.getElementById('menu-dashboard').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllViews();
        viewDashboard.style.display = 'block';
        pageTitle.textContent = 'Dashboard Overview';
        document.getElementById('menu-dashboard').classList.add('active');
    });

    document.getElementById('menu-register-form').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllViews();
        viewCatalog.style.display = 'block';
        pageTitle.textContent = 'Register New Form - Select Template';
        document.getElementById('menu-register-form').classList.add('active');
    });

    document.getElementById('menu-user-mgmt').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllViews();
        if (viewUserMgmt) viewUserMgmt.style.display = 'block';
        pageTitle.textContent = 'User Management';
        document.getElementById('menu-user-mgmt').classList.add('active');
        loadUserManagement();
    });

    document.getElementById('menu-activity-log').addEventListener('click', (e) => {
        e.preventDefault();
        hideAllViews();
        if (viewActivityLog) viewActivityLog.style.display = 'block';
        pageTitle.textContent = 'System Activity Logs';
        document.getElementById('menu-activity-log').classList.add('active');
        loadActivityLogs();
    });

    // Load Live Dashboard Counters
    async function loadStats() {
        try {
            const res = await fetch('/api/forms/stats');
            if (res.ok) {
                const data = await res.json();
                document.getElementById('stat-daily').textContent = data.today;
                document.getElementById('stat-weekly').textContent = data.weekly;
                document.getElementById('stat-monthly').textContent = data.monthly;

                if (data.starWorkerCount > 0) {
                    document.getElementById('star-worker-name').textContent = `@${data.starWorker}`;
                    document.getElementById('star-worker-stats').textContent = `Top agent with ${data.starWorkerCount} submissions this month!`;
                }
            }
        } catch (err) {}
    }
    loadStats();

    // Load User Management Table (Admin Only)
    async function loadUserManagement() {
        const container = document.getElementById('user-list-container');
        container.innerHTML = '<p>Loading system users...</p>';

        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const users = await res.json();
                if (users.length === 0) {
                    container.innerHTML = '<p>No users found.</p>';
                    return;
                }

                let html = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                users.forEach(u => {
                    html += `
                        <tr>
                            <td><strong>${u.username}</strong></td>
                            <td>${u.fullName || 'N/A'}</td>
                            <td><span class="badge role-${u.role.toLowerCase()}">${u.role}</span></td>
                            <td>${u.active ? '🟢 Active' : '🔴 Inactive'}</td>
                            <td>
                                <button class="btn-sm" onclick="toggleUserStatus('${u.username}', ${!u.active})">
                                    ${u.active ? 'Deactivate' : 'Activate'}
                                </button>
                            </td>
                        </tr>
                    `;
                });

                html += '</tbody></table>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<p style="color:red;">Failed to fetch users.</p>';
            }
        } catch (err) {
            container.innerHTML = '<p style="color:red;">Error connecting to server.</p>';
        }
    }

    // Load Activity Log Table (Supervisor / Admin)
    async function loadActivityLogs() {
        const container = document.getElementById('activity-log-container');
        container.innerHTML = '<p>Loading activity logs...</p>';

        try {
            const res = await fetch('/api/logs');
            if (res.ok) {
                const logs = await res.json();
                if (logs.length === 0) {
                    container.innerHTML = '<p>No activity logs recorded yet.</p>';
                    return;
                }

                let html = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Agent</th>
                                <th>Action / Policy</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                logs.forEach(log => {
                    const date = new Date(log.timestamp).toLocaleString();
                    html += `
                        <tr>
                            <td>${date}</td>
                            <td><strong>@${log.username}</strong></td>
                            <td>${log.action}</td>
                            <td>${log.details || '-'}</td>
                        </tr>
                    `;
                });

                html += '</tbody></table>';
                container.innerHTML = html;
            } else {
                container.innerHTML = '<p style="color:red;">Failed to fetch activity logs.</p>';
            }
        } catch (err) {
            container.innerHTML = '<p style="color:red;">Error connecting to server.</p>';
        }
    }

    // Toggle user status global attachment
    window.toggleUserStatus = async function(username, enable) {
        try {
            const res = await fetch(`/api/users/${username}/status?enable=${enable}`, { method: 'PUT' });
            if (res.ok) {
                loadUserManagement();
            } else {
                alert('Failed to update user status.');
            }
        } catch (err) {
            alert('Server connection error.');
        }
    };

    // User Registration Modal Controllers Attached to Window (for inline HTML onclicks)
    window.openAddUserModal = function() {
        const addUserModal = document.getElementById('addUserModal');
        if (addUserModal) {
            addUserModal.style.display = 'flex';
        }
    };

    window.closeAddUserModal = function() {
        const addUserModal = document.getElementById('addUserModal');
        if (addUserModal) {
            addUserModal.style.display = 'none';
        }
        const form = document.getElementById('addUserForm');
        if (form) form.reset();
    };

    window.handleCreateUser = async function(event) {
        event.preventDefault();

        const userData = {
            fullName: document.getElementById('newFullName').value,
            username: document.getElementById('newUsername').value,
            email: document.getElementById('newEmail').value,
            password: document.getElementById('newPassword').value,
            role: document.getElementById('newRole').value
        };

        try {
            const res = await fetch('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (res.ok) {
                alert('User account created successfully!');
                closeAddUserModal();
                loadUserManagement();
            } else {
                const errorMsg = await res.text();
                alert('Failed to create user: ' + errorMsg);
            }
        } catch (err) {
            alert('Server connection error while registering user.');
        }
    };

    // Modal Control & Template Rendering
    const modal = document.getElementById('formModal');
    const modalTitle = document.getElementById('modal-form-title');
    const modalBody = document.getElementById('modal-form-body');

    document.querySelectorAll('.open-form-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const formType = e.target.getAttribute('data-form');
            renderFormTemplate(formType);
            modal.style.display = 'flex';
        });
    });

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    function renderFormTemplate(type) {
        if (type === 'endowment') {
            modalTitle.textContent = 'Guaranteed Endowment Plan Proposal Form';
            modalBody.innerHTML = `
                <form id="activeProposalForm">
                    <div class="form-section-title">SOURCE OF IDENTIFICATION</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>ID Type</label>
                            <select id="idType">
                                <option value="Ghana Card">Ghana Card</option>
                                <option value="Voter's ID">Voter's ID</option>
                                <option value="Passport">Passport</option>
                                <option value="Driver's License">Driver's License</option>
                                <option value="NHIS">NHIS</option>
                                <option value="SSNIT Biometric">SSNIT Biometric</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Card No.</label><input type="text" id="cardNo" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Date of Issue</label><input type="date" id="idIssueDate"></div>
                        <div class="form-group"><label>Expiry Date</label><input type="date" id="idExpiryDate"></div>
                    </div>

                    <div class="form-section-title">1-6. POLICY HOLDER DETAILS</div>
                    <div class="form-row">
                        <div class="form-group" style="flex:0 0 100px;">
                            <label>Title</label>
                            <select id="title">
                                <option value="Mr.">Mr.</option>
                                <option value="Mrs.">Mrs.</option>
                                <option value="Miss">Miss</option>
                                <option value="Dr.">Dr.</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Surname</label><input type="text" id="surname" required></div>
                        <div class="form-group"><label>First / Middle Name</label><input type="text" id="firstNames" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Marital Status</label><input type="text" id="maritalStatus"></div>
                        <div class="form-group"><label>Date of Birth</label><input type="date" id="dob" required></div>
                        <div class="form-group"><label>Age</label><input type="number" id="age"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Place of Birth</label><input type="text" id="placeOfBirth"></div>
                        <div class="form-group"><label>Occupation & Duration</label><input type="text" id="occupation"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Phone Number(s)</label><input type="tel" id="clientPhone" required></div>
                        <div class="form-group"><label>E-mail Address</label><input type="email" id="clientEmail"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Mailing Address</label><input type="text" id="mailingAddress"></div>
                        <div class="form-group"><label>Residential Address</label><input type="text" id="resAddress"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Height</label><input type="text" id="height"></div>
                        <div class="form-group"><label>Weight</label><input type="text" id="weight"></div>
                    </div>

                    <div class="form-section-title">7-12. POLICY TERMS & PREMIUM</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Sum Assured (GH₵)</label>
                            <select id="sumAssured">
                                <option value="3000">GH₵ 3,000</option>
                                <option value="5000">GH₵ 5,000</option>
                                <option value="10000">GH₵ 10,000</option>
                                <option value="15000">GH₵ 15,000</option>
                                <option value="20000">GH₵ 20,000</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Policy Duration (Years)</label>
                            <select id="policyDuration">
                                <option value="5">5 Years</option>
                                <option value="10">10 Years</option>
                                <option value="15">15 Years</option>
                                <option value="20">20 Years</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Premium GH₵</label><input type="number" id="premiumAmount" step="0.01" required></div>
                        <div class="form-group">
                            <label>Payable Mode</label>
                            <select id="payableMode">
                                <option value="Monthly">Monthly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Payment Mode</label>
                            <select id="paymentMode">
                                <option value="Payroll">Payroll</option>
                                <option value="Direct Debit">Direct Debit</option>
                                <option value="Out of Pocket">Out of Pocket</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Automatic Premium Increment</label>
                            <select id="increment">
                                <option value="0%">None (0%)</option>
                                <option value="10%">10%</option>
                                <option value="20%">20%</option>
                                <option value="25%">25%</option>
                                <option value="50%">50%</option>
                                <option value="100%">100%</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-section-title">13-14. BENEFICIARIES & TRUSTEE</div>
                    <div class="form-row">
                        <div class="form-group"><label>Beneficiary Full Name</label><input type="text" id="benName"></div>
                        <div class="form-group"><label>Gender / Age</label><input type="text" id="benGenderAge" placeholder="M/F, Age"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Share (%)</label><input type="number" id="benShare"></div>
                        <div class="form-group"><label>Relationship</label><input type="text" id="benRel"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Trustee Full Name</label><input type="text" id="trusteeName"></div>
                        <div class="form-group"><label>Trustee Phone & Address</label><input type="text" id="trusteeContact"></div>
                    </div>

                    <div class="form-section-title">15. MEDICAL DETAILS</div>
                    <div class="form-group">
                        <label>a. Hospitalized at any time during last 6 months?</label>
                        <select id="medQ1"><option value="NO">NO</option><option value="YES">YES</option></select>
                    </div>
                    <div class="form-group">
                        <label>d. Chest Pain, High BP, Heart, Kidney, Diabetes, or Immune Disorders?</label>
                        <select id="medQ2"><option value="NO">NO</option><option value="YES">YES</option></select>
                    </div>
                    <div class="form-group">
                        <label>h. Give details of YES answers (if any):</label>
                        <textarea id="medDetails" rows="2" style="width:100%; border:1px solid #cbd5e1; border-radius:6px; padding:0.5rem;"></textarea>
                    </div>

                    <div class="form-section-title">AGENT INFORMATION</div>
                    <div class="form-group"><label>Name of Authorised Agent and Number</label><input type="text" id="agentDetails" value="${user.fullName} (${user.username})"></div>

                    <button type="submit" class="btn-primary" style="margin-top:1rem;">Submit Endowment Proposal</button>
                </form>
            `;
        } else if (type === 'education') {
            modalTitle.textContent = 'Education Plan Plus Proposal Form';
            modalBody.innerHTML = `
                <form id="activeProposalForm">
                    <div class="form-row">
                        <div class="form-group"><label>Doc. No.</label><input type="text" id="docNo" placeholder="Document Number"></div>
                    </div>

                    <div class="form-section-title">A. PERSONAL DETAILS</div>
                    <div class="form-row">
                        <div class="form-group" style="flex:0 0 100px;">
                            <label>Title</label>
                            <select id="title">
                                <option value="Mr">Mr</option>
                                <option value="Mrs">Mrs</option>
                                <option value="Ms">Ms</option>
                                <option value="Dr">Dr</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Surname</label><input type="text" id="surname" required></div>
                        <div class="form-group"><label>First Names</label><input type="text" id="firstNames" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Gender</label>
                            <select id="gender"><option value="Male">Male</option><option value="Female">Female</option></select>
                        </div>
                        <div class="form-group"><label>Date of Birth</label><input type="date" id="dob" required></div>
                        <div class="form-group">
                            <label>Marital Status</label>
                            <select id="maritalStatus">
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Height (Ft/m)</label><input type="text" id="height"></div>
                        <div class="form-group"><label>Weight (Kg)</label><input type="text" id="weight"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Existing Policy with us?</label>
                            <select id="hasExistingPolicy"><option value="No">No</option><option value="Yes">Yes</option></select>
                        </div>
                        <div class="form-group"><label>If YES, Policy No.</label><input type="text" id="existingPolicyNo"></div>
                        <div class="form-group"><label>Client ID No.</label><input type="text" id="clientIDNo"></div>
                    </div>

                    <div class="form-section-title">B. CONTACT INFORMATION</div>
                    <div class="form-row">
                        <div class="form-group"><label>Telephone/Mobile</label><input type="tel" id="clientPhone" required></div>
                        <div class="form-group"><label>Email</label><input type="email" id="clientEmail"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Birth Place (Town/Country)</label><input type="text" id="birthPlace"></div>
                        <div class="form-group"><label>Postal/Digital Address</label><input type="text" id="postalAddress"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Nationality</label><input type="text" id="nationality"></div>
                        <div class="form-group"><label>Suburb/Town</label><input type="text" id="suburbTown"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>ID Type & No.</label><input type="text" id="idInfo" placeholder="Ghana Card / Passport No."></div>
                        <div class="form-group"><label>Region & TIN</label><input type="text" id="regionTin" placeholder="Region / TIN Number"></div>
                    </div>

                    <div class="form-section-title">C. EMPLOYMENT DETAILS</div>
                    <div class="form-row">
                        <div class="form-group"><label>Occupation & Position</label><input type="text" id="occPos"></div>
                        <div class="form-group"><label>Staff ID</label><input type="text" id="staffId"></div>
                    </div>
                    <div class="form-group"><label>Employer's Address</label><input type="text" id="employerAddress"></div>

                    <div class="form-section-title">D. BENEFICIARY & TRUSTEE DETAILS</div>
                    <div class="form-row">
                        <div class="form-group"><label>Beneficiary Full Name</label><input type="text" id="ben1Name"></div>
                        <div class="form-group"><label>DOB / Relationship / Share (%)</label><input type="text" id="ben1Details"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Trustee Full Name</label><input type="text" id="trusteeName"></div>
                        <div class="form-group"><label>Trustee Address / Contact</label><input type="text" id="trusteeContact"></div>
                    </div>

                    <div class="form-section-title">E. COVER DETAILS</div>
                    <div class="form-row">
                        <div class="form-group"><label>Initial Life Cover (GH₵)</label><input type="number" id="initialLifeCover" step="0.01"></div>
                        <div class="form-group"><label>Premium Amount (GH₵)</label><input type="number" id="premiumAmount" step="0.01" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Term (Years)</label><input type="number" id="termYears"></div>
                        <div class="form-group">
                            <label>Premium Frequency</label>
                            <select id="premiumFrequency">
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Semi-Annual">Semi-Annual</option>
                                <option value="Annual">Annual</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Annual Inflation Protector</label>
                            <select id="inflationProtector">
                                <option value="0%">None (0%)</option>
                                <option value="5%">5%</option>
                                <option value="10%">10%</option>
                                <option value="15%">15%</option>
                                <option value="20%">20%</option>
                                <option value="25%">25%</option>
                                <option value="30%">30%</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Mode of Payment</label>
                            <select id="paymentMode">
                                <option value="Cheque">Cheque</option>
                                <option value="Bank">Bank</option>
                                <option value="Pay Source">Pay Source</option>
                                <option value="Mobile Money">Mobile Money</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-section-title">F. HEALTH STATUS</div>
                    <div class="form-group">
                        <label>1. Are you actively working and able to perform usual occupation duties?</label>
                        <select id="healthQ1"><option value="YES">YES</option><option value="NO">NO</option></select>
                    </div>
                    <div class="form-group">
                        <label>2. Are you receiving any medical treatment/medication or treated for illness?</label>
                        <select id="healthQ2"><option value="NO">NO</option><option value="YES">YES</option></select>
                    </div>

                    <button type="submit" class="btn-primary" style="margin-top:1rem;">Submit Education Plan Plus</button>
                </form>
            `;
        } else if (type === 'directdebit') {
            modalTitle.textContent = 'Fixed / Variable Direct Debit Authorization Form';
            modalBody.innerHTML = `
                <form id="activeProposalForm">
                    <div class="form-row">
                        <div class="form-group"><label>REF #</label><input type="text" id="refNumber"></div>
                        <div class="form-group"><label>OIN</label><input type="text" id="oinNumber"></div>
                    </div>

                    <div class="form-section-title">PREMIUM PAYER</div>
                    <div class="form-row">
                        <div class="form-group"><label>Surname</label><input type="text" id="payerSurname" required></div>
                        <div class="form-group"><label>Other Names</label><input type="text" id="payerOtherNames" required></div>
                    </div>
                    <div class="form-group"><label>Address</label><input type="text" id="payerAddress"></div>
                    <div class="form-row">
                        <div class="form-group"><label>Mobile Number</label><input type="tel" id="clientPhone" required></div>
                        <div class="form-group"><label>Email</label><input type="email" id="payerEmail"></div>
                    </div>

                    <div class="form-section-title">PREMIUM DETAILS</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Deduction Type</label>
                            <select id="deductionType"><option value="FIXED">Fixed</option><option value="VARIABLE">Variable</option></select>
                        </div>
                        <div class="form-group"><label>Premiums (GH₵)</label><input type="number" id="premiumAmount" step="0.01" required></div>
                    </div>
                    <div class="form-group"><label>Amount in Words</label><input type="text" id="amountInWords" required></div>
                    <div class="form-row">
                        <div class="form-group"><label>Date of First Deduction</label><input type="date" id="firstDeductionDate" required></div>
                        <div class="form-group">
                            <label>Subsequent Deduction</label>
                            <select id="subsequentFrequency">
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY" selected>Monthly</option>
                                <option value="QUARTERLY">Quarterly</option>
                                <option value="YEARLY">Yearly</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group"><label>Policy Number</label><input type="text" id="policyNumber" required></div>

                    <div class="form-section-title">INSTRUCTION TO BANK</div>
                    <div class="form-row">
                        <div class="form-group"><label>Name of Bank</label><input type="text" id="bankName" required></div>
                        <div class="form-group"><label>Branch</label><input type="text" id="bankBranch" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Type of Account</label>
                            <select id="accountType"><option value="CURRENT">Current</option><option value="SAVINGS">Savings</option><option value="OTHER">Other</option></select>
                        </div>
                        <div class="form-group"><label>Sort Code</label><input type="text" id="sortCode"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Bank Account Name</label><input type="text" id="accountName" required></div>
                        <div class="form-group"><label>Bank Account No.</label><input type="text" id="accountNo" required></div>
                    </div>

                    <button type="submit" class="btn-primary" style="margin-top:1rem;">Submit Direct Debit Authorization</button>
                </form>
            `;
        } else if (type === 'beneficiary') {
            modalTitle.textContent = 'Request for Change of Beneficiary Form';
            modalBody.innerHTML = `
                <form id="activeProposalForm">
                    <div class="form-section-title">POLICYHOLDER INFORMATION</div>
                    <div class="form-row">
                        <div class="form-group"><label>Policyholder Name (I, ...)</label><input type="text" id="clientFullName" required></div>
                        <div class="form-group"><label>Policy No.</label><input type="text" id="policyNo" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Employer</label><input type="text" id="employerName"></div>
                        <div class="form-group"><label>Staff ID</label><input type="text" id="staffId"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Phone No.</label><input type="tel" id="clientPhone" required></div>
                        <div class="form-group"><label>Agent's No.</label><input type="text" id="agentNo"></div>
                    </div>

                    <div class="form-section-title">(A) NEW SET OF BENEFICIARIES</div>
                    <div style="font-size:0.8rem; color:#64748b; margin-bottom:0.5rem;">FROM (Previous Beneficiaries):</div>
                    <div class="form-row">
                        <div class="form-group"><input type="text" placeholder="(1) Previous Beneficiary Name"></div>
                        <div class="form-group"><input type="text" placeholder="(2) Previous Beneficiary Name"></div>
                    </div>
                    
                    <div style="font-size:0.8rem; color:#64748b; margin:0.5rem 0;">TO (New Beneficiaries):</div>
                    <div class="form-row">
                        <div class="form-group"><label>(1) Name</label><input type="text" id="newBen1"></div>
                        <div class="form-group"><label>Relationship & Age</label><input type="text" id="newBen1RelAge" placeholder="e.g. Spouse / 35"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>(2) Name</label><input type="text" id="newBen2"></div>
                        <div class="form-group"><label>Relationship & Age</label><input type="text" id="newBen2RelAge" placeholder="e.g. Son / 12"></div>
                    </div>
                    <div class="form-group"><label>Address for New Set of Beneficiaries</label><input type="text" id="newBenAddress"></div>

                    <div class="form-section-title">(B) ADDITIONAL BENEFICIARY</div>
                    <div class="form-row">
                        <div class="form-group"><label>(1) Name</label><input type="text" id="addBen1"></div>
                        <div class="form-group"><label>Relationship & Age</label><input type="text" id="addBen1RelAge"></div>
                    </div>
                    <div class="form-group"><label>Address for Additional Beneficiaries</label><input type="text" id="addBenAddress"></div>

                    <div class="form-group"><label>Remarks</label><input type="text" id="remarks"></div>

                    <input type="hidden" id="premiumAmount" value="0.00">

                    <button type="submit" class="btn-primary" style="margin-top:1rem;">Submit Change Request</button>
                </form>
            `;
        }

        // Form Submit Handler
        document.getElementById('activeProposalForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            let clientFullName = '';
            const surnameElem = document.getElementById('surname');
            const firstNamesElem = document.getElementById('firstNames');
            const payerSurnameElem = document.getElementById('payerSurname');
            const payerOtherNamesElem = document.getElementById('payerOtherNames');
            const clientFullNameElem = document.getElementById('clientFullName');

            if (surnameElem && firstNamesElem) {
                clientFullName = `${surnameElem.value.trim()} ${firstNamesElem.value.trim()}`;
            } else if (payerSurnameElem && payerOtherNamesElem) {
                clientFullName = `${payerSurnameElem.value.trim()} ${payerOtherNamesElem.value.trim()}`;
            } else if (clientFullNameElem) {
                clientFullName = clientFullNameElem.value.trim();
            }

            if (!clientFullName) {
                clientFullName = 'N/A';
            }

            const clientPhoneElem = document.getElementById('clientPhone');
            const clientEmailElem = document.getElementById('clientEmail') || document.getElementById('payerEmail');
            const premiumAmountElem = document.getElementById('premiumAmount');

            const payload = {
                policyType: modalTitle.textContent,
                clientFullName: clientFullName,
                clientPhone: clientPhoneElem ? clientPhoneElem.value.trim() : 'N/A',
                clientEmail: clientEmailElem ? clientEmailElem.value.trim() : '',
                premiumAmount: parseFloat(premiumAmountElem ? premiumAmountElem.value : 0) || 0.0,
                agentUsername: user.username
            };

            try {
                const response = await fetch('/api/forms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    alert('Form submitted successfully!');
                    modal.style.display = 'none';
                    loadStats();
                } else {
                    const errorData = await response.json().catch(() => null);
                    console.error('Server response error:', errorData);
                    alert('Failed to submit form. Please verify the input values.');
                }
            } catch (err) {
                console.error('Network submission error:', err);
                alert('Server connection error.');
            }
        });
    }

    // Logout Action
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch(`/api/auth/logout?username=${user.username}`, { method: 'POST' });
        } catch (e) {}
        localStorage.removeItem('currentUser');
        window.location.href = '/index.html';
    });
});