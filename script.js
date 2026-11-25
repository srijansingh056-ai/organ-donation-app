/** Returns age in whole years for a YYYY-MM-DD date, or null if invalid. */
function calcAge(dobStr) {
    if (!dobStr) return null;
    const d = new Date(dobStr + 'T00:00:00');
    if (isNaN(d)) return null;
    const t = new Date();
    let a = t.getFullYear() - d.getFullYear();
    if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
    return a >= 0 ? a : null;
}

/**
 * LifePledge - Organ Donation Awareness & Official Donor Card Generator
 * script.js - Interactive client logic, form processing, dynamic card generation, and printing.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const pledgeForm = document.getElementById('pledgeForm');
    const cardPreviewSection = document.getElementById('card-preview');
    const navCardItem = document.getElementById('navCardItem');
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');
    
    const organAllCheckbox = document.getElementById('organAll');
    const individualOrgans = Array.from(document.querySelectorAll('input[name="organs"]'));
    
    const btnPrintCard = document.getElementById('btnPrintCard');
    const btnEditPledge = document.getElementById('btnEditPledge');
    const btnShareWhatsApp = document.getElementById('btnShareWhatsApp');

    // Photo Upload DOM Elements
    const photoInput = document.getElementById('photoInput');
    const photoDropzone = document.getElementById('photoDropzone');
    const dropzoneEmpty = document.getElementById('dropzoneEmpty');
    const dropzonePreview = document.getElementById('dropzonePreview');
    const formPhotoPreview = document.getElementById('formPhotoPreview');
    const previewFileName = document.getElementById('previewFileName');
    const previewFileSize = document.getElementById('previewFileSize');
    const btnBrowsePhoto = document.getElementById('btnBrowsePhoto');
    const btnChangePhoto = document.getElementById('btnChangePhoto');
    const btnRemovePhoto = document.getElementById('btnRemovePhoto');
    const btnShapeSquare = document.getElementById('btnShapeSquare');
    const btnShapeCircle = document.getElementById('btnShapeCircle');

    // Donor Card Top-Right Photo Elements
    const cardPhotoFrame = document.getElementById('cardPhotoFrame');
    const cardPhotoImg = document.getElementById('cardPhotoImg');
    const cardPhotoPlaceholder = document.getElementById('cardPhotoPlaceholder');

    // Medical Certificate Upload DOM Elements
    const medicalCertInput = document.getElementById('medicalCertInput');
    const medicalDropzone = document.getElementById('medicalDropzone');
    const medicalDropzoneEmpty = document.getElementById('medicalDropzoneEmpty');
    const medicalDropzonePreview = document.getElementById('medicalDropzonePreview');
    const medicalFileName = document.getElementById('medicalFileName');
    const medicalFileSize = document.getElementById('medicalFileSize');
    const docTypeIcon = document.getElementById('docTypeIcon');
    const btnBrowseMedical = document.getElementById('btnBrowseMedical');
    const btnChangeMedical = document.getElementById('btnChangeMedical');
    const btnRemoveMedical = document.getElementById('btnRemoveMedical');
    const cardMedicalBadge = document.getElementById('cardMedicalBadge');

    // State to hold uploaded photo Data URL & Frame shape preference
    let uploadedPhotoData = null;
    let selectedFrameShape = 'square'; // 'square' or 'circle'

    // State to hold attached medical certificate file
    let attachedMedicalFile = null;
    
    // State to hold active pledge data for WhatsApp sharing
    let currentPledgeData = {
        pledgeId: 'ODP-2026-894210',
        fullName: 'Dr. Jane Doe',
        bloodGroup: 'O+',
        organsDisplayText: 'All Viable Organs & Tissues'
    };

    // -------------------------------------------------------------------------
    // 1. Mobile Navigation Toggle
    // -------------------------------------------------------------------------
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close mobile nav when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // -------------------------------------------------------------------------
    // 2. Organ Checkboxes Synchronisation Logic
    // -------------------------------------------------------------------------
    if (organAllCheckbox && individualOrgans.length > 0) {
        // Toggle all when Master "All Organs & Tissues" is clicked
        organAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            individualOrgans.forEach(cb => {
                cb.checked = isChecked;
            });
            clearFieldError('organsError');
        });

        // Sync Master checkbox when individual organs are toggled
        individualOrgans.forEach(cb => {
            cb.addEventListener('change', () => {
                const allChecked = individualOrgans.every(item => item.checked);
                const someChecked = individualOrgans.some(item => item.checked);
                
                organAllCheckbox.checked = allChecked;
                if (someChecked) {
                    clearFieldError('organsError');
                }
            });
        });
    }

    // -------------------------------------------------------------------------
    // 3. Validation Helpers
    // -------------------------------------------------------------------------
    function showFieldError(id, message) {
        const errElem = document.getElementById(id);
        if (errElem) {
            errElem.textContent = message;
        }
    }

    function clearFieldError(id) {
        const errElem = document.getElementById(id);
        if (errElem) {
            errElem.textContent = '';
        }
    }

    function clearAllErrors() {
        const errorIds = [
            'fullNameError', 'dobError', 'bloodGroupError', 
            'emailError', 'phoneError', 'emergencyError', 
            'organsError', 'consentError', 'photoError', 'medicalError'
        ];
        errorIds.forEach(clearFieldError);
    }

    // -------------------------------------------------------------------------
    // 3b. Passport Photo Upload & Frame Shape Logic
    // -------------------------------------------------------------------------
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function renderCardPhoto() {
        if (!cardPhotoFrame || !cardPhotoImg || !cardPhotoPlaceholder) return;

        // Apply Frame Shape (Square with smooth corners or Circular)
        if (selectedFrameShape === 'circle') {
            cardPhotoFrame.classList.remove('frame-square');
            cardPhotoFrame.classList.add('frame-circle');
            if (formPhotoPreview) {
                formPhotoPreview.classList.remove('frame-square');
                formPhotoPreview.classList.add('frame-circle');
            }
        } else {
            cardPhotoFrame.classList.remove('frame-circle');
            cardPhotoFrame.classList.add('frame-square');
            if (formPhotoPreview) {
                formPhotoPreview.classList.remove('frame-circle');
                formPhotoPreview.classList.add('frame-square');
            }
        }

        // Dynamically render uploaded photo or clean default avatar placeholder
        if (uploadedPhotoData) {
            cardPhotoImg.src = uploadedPhotoData;
            cardPhotoImg.classList.remove('hidden');
            cardPhotoPlaceholder.classList.add('hidden');
        } else {
            cardPhotoImg.src = '';
            cardPhotoImg.classList.add('hidden');
            cardPhotoPlaceholder.classList.remove('hidden');
        }
    }

    function handlePhotoFile(file) {
        clearFieldError('photoError');
        if (!file) return;

        // Validate image mime type
        if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/i) && !file.type.startsWith('image/')) {
            showFieldError('photoError', 'Please select a valid image file (JPG, PNG, or WEBP).');
            return;
        }

        // Validate file size limit (5MB)
        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            showFieldError('photoError', 'Photograph size exceeds 5MB limit. Please choose a smaller image.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedPhotoData = e.target.result;

            // Update form preview elements
            if (formPhotoPreview) {
                formPhotoPreview.src = uploadedPhotoData;
            }
            if (previewFileName) {
                previewFileName.textContent = file.name;
            }
            if (previewFileSize) {
                previewFileSize.textContent = formatBytes(file.size);
            }
            if (dropzoneEmpty && dropzonePreview) {
                dropzoneEmpty.classList.add('hidden');
                dropzonePreview.classList.remove('hidden');
            }

            // Dynamically render on the Donor Card's top-right photo frame
            renderCardPhoto();
        };

        reader.onerror = () => {
            showFieldError('photoError', 'Failed to read photograph file. Please try again.');
        };

        reader.readAsDataURL(file);
    }

    function removePhoto() {
        uploadedPhotoData = null;
        if (photoInput) {
            photoInput.value = '';
        }
        clearFieldError('photoError');
        if (dropzoneEmpty && dropzonePreview) {
            dropzoneEmpty.classList.remove('hidden');
            dropzonePreview.classList.add('hidden');
        }
        if (formPhotoPreview) {
            formPhotoPreview.src = '';
        }
        // Dynamically revert card to clean default avatar placeholder
        renderCardPhoto();
    }

    // Photo Upload Event Bindings
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handlePhotoFile(e.target.files[0]);
            }
        });
    }

    if (btnBrowsePhoto) {
        btnBrowsePhoto.addEventListener('click', (e) => {
            e.stopPropagation();
            if (photoInput) photoInput.click();
        });
    }

    if (btnChangePhoto) {
        btnChangePhoto.addEventListener('click', (e) => {
            e.stopPropagation();
            if (photoInput) photoInput.click();
        });
    }

    if (btnRemovePhoto) {
        btnRemovePhoto.addEventListener('click', (e) => {
            e.stopPropagation();
            removePhoto();
        });
    }

    if (photoDropzone) {
        // Clicking dropzone opens file picker if empty
        photoDropzone.addEventListener('click', () => {
            if (!uploadedPhotoData && photoInput) {
                photoInput.click();
            }
        });

        // Keyboard accessibility
        photoDropzone.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !uploadedPhotoData && photoInput) {
                e.preventDefault();
                photoInput.click();
            }
        });

        // Drag and Drop
        ['dragenter', 'dragover'].forEach(eventName => {
            photoDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                photoDropzone.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            photoDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                photoDropzone.classList.remove('drag-active');
            });
        });

        photoDropzone.addEventListener('drop', (e) => {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                handlePhotoFile(e.dataTransfer.files[0]);
            }
        });
    }

    // Shape Toggle Buttons (Square vs Circular)
    if (btnShapeSquare) {
        btnShapeSquare.addEventListener('click', () => {
            selectedFrameShape = 'square';
            btnShapeSquare.classList.add('active');
            if (btnShapeCircle) btnShapeCircle.classList.remove('active');
            renderCardPhoto();
        });
    }

    if (btnShapeCircle) {
        btnShapeCircle.addEventListener('click', () => {
            selectedFrameShape = 'circle';
            btnShapeCircle.classList.add('active');
            if (btnShapeSquare) btnShapeSquare.classList.remove('active');
            renderCardPhoto();
        });
    }

    // Initialize Card Photo Frame state
    renderCardPhoto();

    // -------------------------------------------------------------------------
    // 3c. Health Fitness Certificate / Medical Report Upload Logic
    // -------------------------------------------------------------------------
    function renderMedicalBadge() {
        if (!cardMedicalBadge) return;
        if (attachedMedicalFile) {
            cardMedicalBadge.classList.remove('hidden');
        } else {
            cardMedicalBadge.classList.add('hidden');
        }
    }

    function handleMedicalFile(file) {
        clearFieldError('medicalError');
        if (!file) return;

        // Check file extension / MIME type (PDF or Image)
        const fileNameLower = file.name.toLowerCase();
        const isPdf = file.type === 'application/pdf' || fileNameLower.endsWith('.pdf');
        const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(fileNameLower);

        if (!isPdf && !isImage) {
            showFieldError('medicalError', 'Please select a valid PDF report or image file (PDF, JPG, PNG, WEBP).');
            return;
        }

        // Maximum size: 10MB
        const maxBytes = 10 * 1024 * 1024;
        if (file.size > maxBytes) {
            showFieldError('medicalError', 'Document size exceeds 10MB limit. Please choose a smaller file.');
            return;
        }

        attachedMedicalFile = file;

        // Update preview details
        if (medicalFileName) {
            medicalFileName.textContent = file.name;
        }
        if (medicalFileSize) {
            medicalFileSize.textContent = formatBytes(file.size);
        }
        if (docTypeIcon) {
            if (isPdf) {
                docTypeIcon.className = 'fa-solid fa-file-pdf icon-pdf';
            } else {
                docTypeIcon.className = 'fa-solid fa-file-image icon-img';
            }
        }
        if (medicalDropzoneEmpty && medicalDropzonePreview) {
            medicalDropzoneEmpty.classList.add('hidden');
            medicalDropzonePreview.classList.remove('hidden');
        }

        // Dynamically update status badge on the Donor Card
        renderMedicalBadge();
    }

    function removeMedicalFile() {
        attachedMedicalFile = null;
        if (medicalCertInput) {
            medicalCertInput.value = '';
        }
        clearFieldError('medicalError');
        if (medicalDropzoneEmpty && medicalDropzonePreview) {
            medicalDropzoneEmpty.classList.remove('hidden');
            medicalDropzonePreview.classList.add('hidden');
        }
        // Dynamically hide status badge from the Donor Card
        renderMedicalBadge();
    }

    // Medical Document Event Bindings
    if (medicalCertInput) {
        medicalCertInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleMedicalFile(e.target.files[0]);
            }
        });
    }

    if (btnBrowseMedical) {
        btnBrowseMedical.addEventListener('click', (e) => {
            e.stopPropagation();
            if (medicalCertInput) medicalCertInput.click();
        });
    }

    if (btnChangeMedical) {
        btnChangeMedical.addEventListener('click', (e) => {
            e.stopPropagation();
            if (medicalCertInput) medicalCertInput.click();
        });
    }

    if (btnRemoveMedical) {
        btnRemoveMedical.addEventListener('click', (e) => {
            e.stopPropagation();
            removeMedicalFile();
        });
    }

    if (medicalDropzone) {
        // Click to open file picker when empty
        medicalDropzone.addEventListener('click', () => {
            if (!attachedMedicalFile && medicalCertInput) {
                medicalCertInput.click();
            }
        });

        // Accessibility
        medicalDropzone.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !attachedMedicalFile && medicalCertInput) {
                e.preventDefault();
                medicalCertInput.click();
            }
        });

        // Drag & Drop
        ['dragenter', 'dragover'].forEach(eventName => {
            medicalDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                medicalDropzone.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            medicalDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                medicalDropzone.classList.remove('drag-active');
            });
        });

        medicalDropzone.addEventListener('drop', (e) => {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleMedicalFile(e.dataTransfer.files[0]);
            }
        });
    }

    // Initialize Medical Certificate Badge state (hidden initially)
    renderMedicalBadge();

    // -------------------------------------------------------------------------
    // 4. Form Submission & Donor Card Generation
    // -------------------------------------------------------------------------
    pledgeForm.addEventListener('submit', (event) => {
        event.preventDefault();
        clearAllErrors();

        let isValid = true;

        // Retrieve field values
        const fullNameInput = document.getElementById('fullName');
        const dobInput = document.getElementById('dob');
        const bloodGroupInput = document.getElementById('bloodGroup');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const emergencyInput = document.getElementById('emergencyContact');
        const consentInput = document.getElementById('consentCheck');

        const fullName = fullNameInput.value.trim();
        const dob = dobInput.value;
        const bloodGroup = bloodGroupInput.value;
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const emergency = emergencyInput.value.trim();
        const consentChecked = consentInput.checked;

        // Validate Full Name
        if (!fullName || fullName.length < 2) {
            showFieldError('fullNameError', 'Please enter your full legal name.');
            isValid = false;
        }

        // Validate DOB and minimum age
        const ageYears = calcAge(dob);
        if (!dob || ageYears === null) {
            showFieldError('dobError', 'Please select a valid date of birth.');
            isValid = false;
        } else if (ageYears < 18) {
            showFieldError('dobError', 'You must be at least 18 years old to take the pledge.');
            isValid = false;
        }

        // Validate Blood Group
        if (!bloodGroup) {
            showFieldError('bloodGroupError', 'Please select your blood group.');
            isValid = false;
        }

        // Validate Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showFieldError('emailError', 'Please enter a valid email address.');
            isValid = false;
        }

        // Validate Phone
        if (!phone || phone.length < 7) {
            showFieldError('phoneError', 'Please enter a valid contact phone number.');
            isValid = false;
        }

        // Validate Emergency Contact
        if (!emergency || emergency.length < 4) {
            showFieldError('emergencyError', 'Please provide an emergency contact name and phone.');
            isValid = false;
        }

        // Validate Pledged Organs
        const selectedOrgans = individualOrgans
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (selectedOrgans.length === 0 && !organAllCheckbox.checked) {
            showFieldError('organsError', 'Please select at least one organ/tissue to pledge.');
            isValid = false;
        }

        // Validate Legal Consent
        if (!consentChecked) {
            showFieldError('consentError', 'You must affirm the donation pledge declaration.');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // ---------------------------------------------------------------------
        // 5. Generate Dynamic Data & Populate Donor Card
        // ---------------------------------------------------------------------

        // Generate unique Pledge ID: e.g. ODP-2026-783921
        const currentYear = new Date().getFullYear();
        const randomCode = Math.floor(100000 + Math.random() * 900000);
        const pledgeId = `ODP-${currentYear}-${randomCode}`;

        // Format Date of Birth for clean display (e.g. YYYY-MM-DD to DD/MM/YYYY or readable string)
        let formattedDob = dob;
        try {
            const parts = dob.split('-');
            if (parts.length === 3) {
                const year = parts[0];
                const month = parts[1];
                const day = parts[2];
                formattedDob = `${day}/${month}/${year}`;
            }
        } catch (e) {
            formattedDob = dob;
        }

        // Format Issue Date (Today)
        const today = new Date();
        const issueDateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedIssueDate = today.toLocaleDateString('en-US', issueDateOptions);

        // Compute initials for the card avatar (e.g. "Jane Doe" -> "JD")
        const nameParts = fullName.replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.)\s+/i, '').trim().split(/\s+/);
        let initials = 'OD';
        if (nameParts.length >= 2) {
            initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1 && nameParts[0].length > 0) {
            initials = nameParts[0].substring(0, 2).toUpperCase();
        }

        // Prepare Organs display text
        let organsDisplayText = '';
        if (organAllCheckbox.checked || selectedOrgans.length === individualOrgans.length) {
            organsDisplayText = 'All Viable Organs & Tissues';
        } else {
            organsDisplayText = selectedOrgans.join(', ');
        }

        // Populate Card DOM elements
        document.getElementById('cardPledgeId').textContent = pledgeId;
        document.getElementById('cardName').textContent = fullName;
        document.getElementById('cardInitials').textContent = initials;
        document.getElementById('cardBlood').textContent = bloodGroup;
        document.getElementById('cardDob').textContent = formattedDob;
        document.getElementById('cardAge').textContent = calcAge(dob) + ' years';
        document.getElementById('cardIssueDate').textContent = formattedIssueDate;
        document.getElementById('cardEmergency').textContent = emergency;
        document.getElementById('cardOrgans').textContent = organsDisplayText;

        // Render photo or clean default avatar inside top-right photo frame
        renderCardPhoto();

        // Render verified medical certificate confirmation tag if file attached
        renderMedicalBadge();

        // Save state for WhatsApp share
        currentPledgeData = {
            pledgeId,
            fullName,
            bloodGroup,
            organsDisplayText,
            hasMedicalCert: !!attachedMedicalFile
        };

        // Tell the rest of the site a pledge was created (used for the verification page)
        document.dispatchEvent(new CustomEvent('pledge:created', { detail: { pledgeId, fullName, bloodGroup, organsDisplayText, issued: formattedIssueDate, file: attachedMedicalFile } }));

        // Generate functional QR Code containing the Pledge ID & verification summary
        const qrContainer = document.getElementById('cardQrCode');
        if (qrContainer) {
            qrContainer.innerHTML = '';
            const qrPayload = `LifePledge Donor Registry | ID: ${pledgeId} | Donor: ${fullName} | Blood: ${bloodGroup} | Organs: ${organsDisplayText}`;
            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: qrPayload,
                    width: 68,
                    height: 68,
                    colorDark: '#0f172a',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } else {
                qrContainer.innerHTML = `<span style="font-size:0.55rem; color:#0f172a; font-weight:700;">${pledgeId}</span>`;
            }
        }

        // Reveal the Donor Card preview section
        cardPreviewSection.classList.remove('hidden');
        if (navCardItem) {
            navCardItem.classList.remove('hidden');
        }

        // Smooth scroll to the newly generated card
        cardPreviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // -------------------------------------------------------------------------
    // 6. Action Button Handlers
    // -------------------------------------------------------------------------
    if (btnShareWhatsApp) {
        btnShareWhatsApp.addEventListener('click', () => {
            const id = currentPledgeData.pledgeId || 'ODP-2026';
            const name = currentPledgeData.fullName || 'Organ Donor';
            const blood = currentPledgeData.bloodGroup || 'Not specified';
            const organs = currentPledgeData.organsDisplayText || 'All Viable Organs & Tissues';
            const medCertText = currentPledgeData.hasMedicalCert ? `\n📑 *Medical Document:* Attached` : '';

            const message = `❤️ *Organ Donation Pledge Announcement*\n\n` +
                `Dear family,\n\n` +
                `I want to share an important humanitarian decision with you. I have officially pledged to donate my organs and tissues upon death to save and restore lives.\n\n` +
                `📋 *Pledge ID:* ${id}\n` +
                `👤 *Registered Donor:* ${name}\n` +
                `🩸 *Blood Group:* ${blood}\n` +
                `🫀 *Pledged Organs:* ${organs}${medCertText}\n\n` +
                `Please keep this decision in mind and support my wish to give the gift of life. You can learn more and take the pledge too at: ${window.location.href.split('#')[0]}`;

            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        });
    }

    if (btnPrintCard) {
        btnPrintCard.addEventListener('click', () => {
            window.print();
        });
    }

    if (btnEditPledge) {
        btnEditPledge.addEventListener('click', () => {
            const pledgeSection = document.getElementById('pledge');
            if (pledgeSection) {
                pledgeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const fullNameInput = document.getElementById('fullName');
                if (fullNameInput) {
                    setTimeout(() => fullNameInput.focus(), 600);
                }
            }
        });
    }
});
/**
 * LifePledge extras: login, age, myths accordion, family guide, card download,
 * and the verification page (card check + document screening).
 */
document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);

    // ---------- Small helpers: storage, hashing ----------
    const store = {
        get(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } },
        set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ } }
    };
    const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    const subtle = window.crypto && window.crypto.subtle;
    const textBytes = (s) => new TextEncoder().encode(s);

    // Fallback hash, used only when the browser has no crypto.subtle (not secure)
    function fallbackHash(bytes) {
        let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (let i = 0; i < bytes.length; i++) {
            h1 = Math.imul(h1 ^ bytes[i], 2654435761);
            h2 = Math.imul(h2 ^ bytes[i], 1597334677);
        }
        return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
    }
    async function sha256(buffer) {
        return subtle ? toHex(await crypto.subtle.digest('SHA-256', buffer)) : fallbackHash(new Uint8Array(buffer));
    }
    async function hashPassword(password, salt) {
        if (!subtle) return fallbackHash(textBytes(salt + password));
        const key = await crypto.subtle.importKey('raw', textBytes(password), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: textBytes(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
        return toHex(bits);
    }
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const readLocal = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const currentUser = () => sessionStorage.getItem('lp_session') || readLocal('lp_session');

    // ---------- 1. Login / Sign up ----------
    const authForm = $('authForm');
    const authError = $('authError');
    const authSubmit = $('authSubmit');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Only auto-focus on devices with a mouse, so phones don't pop the keyboard open on page load
    const canAutofocus = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
    let authMode = 'login';

    const fields = {
        name: { input: $('authName'), error: $('authNameError') },
        email: { input: $('authEmail'), error: $('authEmailError') },
        password: { input: $('authPassword'), error: $('authPasswordError') },
        confirm: { input: $('authConfirm'), error: $('authConfirmError') }
    };

    const COPY = {
        login: {
            title: 'Welcome back 👋',
            sub: 'Log in to continue your pledge and get your donor card.',
            submit: '<i class="fa-solid fa-right-to-bracket"></i> Log in',
            switchText: 'New to LifePledge?',
            switchBtn: 'Create an account',
            passwordHint: 'Enter your password'
        },
        signup: {
            title: 'Join LifePledge ❤️',
            sub: 'Create a free account in under a minute.',
            submit: '<i class="fa-solid fa-user-plus"></i> Create account',
            switchText: 'Already have an account?',
            switchBtn: 'Log in',
            passwordHint: 'Create a password'
        }
    };

    // --- small UI helpers ---
    function showAlert(message, type) {
        authError.textContent = message || '';
        authError.className = 'auth-alert' + (type ? ' ' + type : '');
    }
    function setFieldError(key, message) {
        const f = fields[key];
        f.error.textContent = message || '';
        f.input.classList.toggle('invalid', !!message);
        f.input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    function clearAuthErrors() {
        Object.keys(fields).forEach((k) => setFieldError(k, ''));
        showAlert('');
    }
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>' + esc(message) + '</span>';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('out'), 3200);
        setTimeout(() => toast.remove(), 3800);
    }

    // --- show / hide password (eye button) ---
    function setPasswordVisible(btn, show) {
        const input = $(btn.dataset.target);
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        btn.title = show ? 'Hide password' : 'Show password';
        btn.querySelector('i').className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    }
    function resetPasswordVisibility() {
        document.querySelectorAll('.toggle-pass').forEach((btn) => setPasswordVisible(btn, false));
    }
    document.querySelectorAll('.toggle-pass').forEach((btn) => {
        // Keep the cursor in the field when the eye is clicked
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => setPasswordVisible(btn, $(btn.dataset.target).type === 'password'));
    });

    // --- Caps Lock warning ---
    const capsWarn = $('capsWarn');
    const checkCaps = (e) => capsWarn.classList.toggle('hidden', !(e.getModifierState && e.getModifierState('CapsLock')));
    fields.password.input.addEventListener('keydown', checkCaps);
    fields.password.input.addEventListener('keyup', checkCaps);
    fields.password.input.addEventListener('blur', () => capsWarn.classList.add('hidden'));

    // --- password strength meter (sign up) ---
    const passwordChecks = (pw) => ({
        length: pw.length >= 8,
        mix: /[A-Za-z]/.test(pw) && /\d/.test(pw),
        extra: (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) || /[^A-Za-z0-9]/.test(pw)
    });
    function strengthOf(pw) {
        if (!pw) return 0;
        const c = passwordChecks(pw);
        if (!c.length) return 1;
        let score = 1;
        if (c.mix) score++;
        if (c.extra) score++;
        if (pw.length >= 12) score++;
        return Math.min(score, 4);
    }
    function updateStrength() {
        const pw = fields.password.input.value;
        const level = authMode === 'signup' ? strengthOf(pw) : 0;
        $('pwMeter').dataset.level = level;
        $('pwStrengthLabel').textContent = ['', 'Weak', 'Fair', 'Good', 'Strong'][level];
        const c = passwordChecks(pw);
        document.querySelectorAll('#pwRules li').forEach((li) => {
            const met = !!c[li.dataset.rule];
            li.classList.toggle('met', met);
            li.querySelector('i').className = met ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
        });
    }

    // --- switching between Log in and Sign up ---
    function setAuthMode(mode, opts) {
        authMode = mode;
        const signup = mode === 'signup';
        const c = COPY[mode];
        document.querySelectorAll('.auth-tabs button').forEach((b) => {
            const on = b.dataset.mode === mode;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', String(on));
        });
        $('authTitle').textContent = c.title;
        $('authSub').textContent = c.sub;
        $('authNameGroup').classList.toggle('hidden', !signup);
        $('authConfirmGroup').classList.toggle('hidden', !signup);
        $('pwHelp').classList.toggle('hidden', !signup);
        $('authSubmitLabel').innerHTML = c.submit;
        $('authSwitchText').textContent = c.switchText;
        $('authSwitchBtn').textContent = c.switchBtn;
        fields.password.input.placeholder = c.passwordHint;
        fields.password.input.autocomplete = signup ? 'new-password' : 'current-password';
        clearAuthErrors();
        resetPasswordVisibility();
        updateStrength();
        if (canAutofocus && !(opts && opts.focus === false)) (signup ? fields.name.input : fields.email.input).focus();
    }
    document.querySelectorAll('.auth-tabs button').forEach((b) => b.addEventListener('click', () => setAuthMode(b.dataset.mode)));
    $('authSwitchBtn').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'signup' : 'login'));

    // --- live feedback while typing ---
    Object.keys(fields).forEach((key) => {
        fields[key].input.addEventListener('input', () => {
            if (fields[key].input.classList.contains('invalid')) setFieldError(key, '');
            showAlert('');
        });
    });
    fields.password.input.addEventListener('input', updateStrength);
    fields.email.input.addEventListener('blur', () => {
        const v = fields.email.input.value.trim();
        if (v && !EMAIL_RE.test(v)) setFieldError('email', 'That email doesn\u2019t look right. Example: name@example.com');
    });
    fields.confirm.input.addEventListener('blur', () => {
        const v = fields.confirm.input.value;
        if (authMode === 'signup' && v && v !== fields.password.input.value) setFieldError('confirm', 'Passwords don\u2019t match yet.');
    });

    // --- validation (runs on submit) ---
    function validateAuth(values) {
        let ok = true;
        const fail = (key, message) => { setFieldError(key, message); ok = false; };
        Object.keys(fields).forEach((k) => setFieldError(k, ''));

        if (authMode === 'signup' && values.name.length < 2) fail('name', 'Please enter your full name.');

        if (!values.email) fail('email', 'Enter your email address.');
        else if (!EMAIL_RE.test(values.email)) fail('email', 'That email doesn\u2019t look right. Example: name@example.com');

        if (!values.password) fail('password', 'Enter your password.');
        else if (authMode === 'signup') {
            const c = passwordChecks(values.password);
            if (!c.length) fail('password', 'Use at least 8 characters.');
            else if (!c.mix) fail('password', 'Include at least one letter and one number.');
        }

        if (authMode === 'signup') {
            if (!values.confirm) fail('confirm', 'Re-enter your password to confirm it.');
            else if (values.confirm !== values.password) fail('confirm', 'Passwords don\u2019t match.');
        }

        if (!ok) {
            const firstBad = authForm.querySelector('input.invalid');
            if (firstBad) firstBad.focus();
        }
        return ok;
    }

    // --- unlock / lock the site ---
    // remember === true  -> stay logged in after the tab closes
    // remember === false -> log out when the tab closes
    // remember undefined -> leave the saved choice as it is (used when restoring a session)
    function unlockSite(user, remember) {
        sessionStorage.setItem('lp_session', user.email);
        try {
            if (remember === true) localStorage.setItem('lp_session', user.email);
            else if (remember === false) localStorage.removeItem('lp_session');
        } catch (e) { /* storage blocked */ }
        document.body.classList.remove('locked');
        const nameField = $('fullName');
        if (nameField && !nameField.value) nameField.value = user.name;
        window.scrollTo(0, 0);
    }

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showAlert('');
        const values = {
            name: fields.name.input.value.trim(),
            email: fields.email.input.value.trim().toLowerCase(),
            password: fields.password.input.value,
            confirm: fields.confirm.input.value
        };
        if (!validateAuth(values)) return;

        const remember = $('authRemember').checked;
        authSubmit.disabled = true;
        authSubmit.classList.add('loading');
        try {
            const users = store.get('lp_users');
            if (authMode === 'signup') {
                if (users[values.email]) {
                    // Friendly redirect: they already have an account, so switch to Log in
                    setAuthMode('login', { focus: false });
                    showAlert('You already have an account with this email. Enter your password to log in.', 'info');
                    if (canAutofocus) fields.password.input.focus();
                    return;
                }
                const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
                users[values.email] = { name: values.name, salt, hash: await hashPassword(values.password, salt) };
                store.set('lp_users', users);
                unlockSite({ email: values.email, name: values.name }, remember);
                showToast('Welcome to LifePledge, ' + values.name.split(/\s+/)[0] + '! 🎉');
            } else {
                const user = users[values.email];
                if (!user || (await hashPassword(values.password, user.salt)) !== user.hash) {
                    showAlert('Email or password is incorrect. Please check and try again.');
                    fields.password.input.select();
                    return;
                }
                unlockSite({ email: values.email, name: user.name }, remember);
                showToast('Welcome back, ' + user.name.split(/\s+/)[0] + '! 👋');
            }
            authForm.reset();
            setAuthMode('login', { focus: false });
        } finally {
            authSubmit.disabled = false;
            authSubmit.classList.remove('loading');
        }
    });

    setAuthMode('login', { focus: false });

    // Keep the person logged in while the tab stays open (or longer, if they ticked "Keep me logged in")
    const savedUsers = store.get('lp_users');
    const savedEmail = currentUser();
    if (savedEmail && savedUsers[savedEmail]) unlockSite({ email: savedEmail, name: savedUsers[savedEmail].name });
    else if (canAutofocus) fields.email.input.focus();

    $('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('lp_session');
        try { localStorage.removeItem('lp_session'); } catch (e) { /* storage blocked */ }
        document.body.classList.add('locked');
        setAuthMode('login');
    });

    // ---------- 2. Date of birth -> Age ----------
    const dobInput = $('dob');
    const t = new Date();
    dobInput.max = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    dobInput.addEventListener('change', () => {
        const a = calcAge(dobInput.value);
        $('age').value = a === null ? '' : `${a} years`;
    });

    // ---------- 3. Myths vs Facts accordion ----------
    document.querySelectorAll('.myth-card').forEach((card) => {
        const head = card.querySelector('.myth-side');
        head.setAttribute('role', 'button');
        head.setAttribute('aria-expanded', 'false');
        head.tabIndex = 0;
        const toggle = () => head.setAttribute('aria-expanded', String(card.classList.toggle('open')));
        head.addEventListener('click', toggle);
        head.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
    });

    // ---------- 4. Family guide: copy the conversation starter ----------
    const copyBtn = $('btnCopyStarter');
    const copyLabel = copyBtn.innerHTML;
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText($('conversationStarter').textContent.trim());
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        } catch (e) {
            copyBtn.textContent = 'Select the text and copy it';
        }
        setTimeout(() => { copyBtn.innerHTML = copyLabel; }, 2500);
    });

    // ---------- 5. Download the donor card as an image ----------
    $('btnDownloadCard').addEventListener('click', async () => {
        if (typeof html2canvas === 'undefined') {
            alert('Download needs an internet connection. Use "Print / Save as PDF" instead.');
            return;
        }
        const canvas = await html2canvas($('donorCard'), { scale: 2, backgroundColor: null, useCORS: true });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `donor-card-${$('cardPledgeId').textContent}.png`;
        link.click();
    });

    // ---------- 6. Document screening ----------
    const EDITORS = /photoshop|gimp|canva|pixlr|picsart|illustrator|inkscape|paint\.net/i;
    const pdfDate = (s) => {
        const m = s && s.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
        return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) : null;
    };

    /** Runs automated checks on a file. meta (issuer, number, date) is optional. */
    async function analyzeDocument(file, meta) {
        const checks = [];
        const add = (label, status, detail) => checks.push({ label, status, detail });
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const ascii = (from, to) => String.fromCharCode(...bytes.slice(from, to));

        // 1) Real file type from the first bytes, not the file name
        let kind = 'unknown';
        if (ascii(0, 5) === '%PDF-') kind = 'pdf';
        else if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') kind = 'png';
        else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) kind = 'jpg';
        else if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') kind = 'webp';
        const ext = (file.name.split('.').pop() || '').toLowerCase().replace('jpeg', 'jpg');
        if (kind === 'unknown') add('File type', 'fail', 'The contents are not a real PDF, JPG, PNG or WEBP file.');
        else if (kind !== ext) add('File type', 'warn', `The name ends in .${ext} but the contents are ${kind.toUpperCase()}.`);
        else add('File type', 'ok', `Valid ${kind.toUpperCase()} file structure.`);

        // 2) Size
        add('File size', file.size < 5 * 1024 ? 'warn' : 'ok',
            file.size < 5 * 1024 ? 'Very small file. Real reports are usually larger.' : 'Normal size.');

        // 3) Editing traces
        const text = new TextDecoder('latin1').decode(kind === 'pdf' ? bytes : bytes.slice(0, 100000));
        if (kind === 'pdf') {
            const producer = (text.match(/\/Producer\s*\(([^)]*)\)/) || [])[1] || '';
            const creator = (text.match(/\/Creator\s*\(([^)]*)\)/) || [])[1] || '';
            if (EDITORS.test(producer + ' ' + creator)) add('Editing software', 'warn', `Made with an image editor (${(producer || creator).trim()}).`);
            else add('Editing software', 'ok', producer || creator ? `Created with ${(producer || creator).trim()}.` : 'No editing software recorded.');
            const created = pdfDate((text.match(/\/CreationDate\s*\(([^)]*)\)/) || [])[1]);
            const modified = pdfDate((text.match(/\/ModDate\s*\(([^)]*)\)/) || [])[1]);
            if (created && created > new Date()) add('PDF dates', 'fail', 'The PDF says it was created in the future.');
            else if (created && modified && modified - created > 864e5) add('PDF dates', 'warn', 'The PDF was changed more than a day after it was created.');
            else add('PDF dates', 'ok', created ? 'Creation and modification dates look consistent.' : 'No dates recorded.');
        } else if (kind !== 'unknown') {
            add('Editing software', EDITORS.test(text) ? 'warn' : 'ok',
                EDITORS.test(text) ? 'The image data mentions an image editor.' : 'No image-editor traces found.');
        }

        // 4) Details typed in by the person
        if (meta) {
            add('Issuer', meta.issuer.length >= 3 ? 'ok' : 'fail', meta.issuer.length >= 3 ? 'Issuer name provided.' : 'Enter the doctor or hospital that issued it.');
            const numOk = /^[A-Za-z0-9][A-Za-z0-9\/\-\s]{3,29}$/.test(meta.number);
            add('Certificate number', numOk ? 'ok' : 'fail', numOk ? 'Format looks plausible.' : 'Enter a certificate number (4 to 30 letters, numbers, / or -).');
            const d = meta.date ? new Date(meta.date) : null;
            if (!d || isNaN(d)) add('Issue date', 'fail', 'Enter the issue date.');
            else if (d > new Date()) add('Issue date', 'fail', 'The issue date is in the future.');
            else if ((Date.now() - d) / 864e5 > 365) add('Issue date', 'warn', 'Older than 12 months. Many hospitals expect a recent certificate.');
            else add('Issue date', 'ok', 'Within the last 12 months.');
        }

        // 5) Duplicate check: same file already used by another account?
        const hash = await sha256(buffer);
        const seen = store.get('lp_docs')[hash];
        if (seen && seen.owner !== currentUser()) add('Duplicate', 'fail', 'This exact file was already submitted by a different account.');
        else add('Duplicate', 'ok', seen ? 'Same file you submitted before.' : 'Not submitted by anyone else on this device.');

        const verdict = checks.some((c) => c.status === 'fail') ? 'fail' : checks.some((c) => c.status === 'warn') ? 'review' : 'pass';
        return { checks, verdict, hash };
    }

    const icons = { ok: 'fa-circle-check', warn: 'fa-triangle-exclamation', fail: 'fa-circle-xmark' };
    function renderResult(box, verdict, headline, checks, footer) {
        box.innerHTML = `<div class="vr-verdict ${verdict}">${esc(headline)}</div><ul class="vr-list">` +
            checks.map((c) => `<li class="vr-${c.status}"><i class="fa-solid ${icons[c.status]}"></i><span><strong>${esc(c.label)}:</strong> ${esc(c.detail)}</span></li>`).join('') +
            `</ul>${footer ? `<p class="vr-foot">${esc(footer)}</p>` : ''}`;
    }

    // Save each new pledge so the card checker can find it, and screen the attached document
    document.addEventListener('pledge:created', async (e) => {
        const p = e.detail;
        const registry = store.get('lp_registry');
        registry[p.pledgeId] = { name: p.fullName, blood: p.bloodGroup, organs: p.organsDisplayText, issued: p.issued, owner: currentUser() };
        store.set('lp_registry', registry);
        if (!p.file) return;
        const result = await analyzeDocument(p.file, null);
        const docs = store.get('lp_docs');
        if (!docs[result.hash]) { docs[result.hash] = { owner: currentUser(), pledgeId: p.pledgeId }; store.set('lp_docs', docs); }
        const label = document.querySelector('#cardMedicalBadge span');
        if (label) label.textContent = result.verdict === 'pass'
            ? 'Medical document attached · automated checks passed'
            : 'Medical document attached · needs manual review';
    });

    $('cardVerifyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = $('vId').value.trim();
        const found = raw.match(/ODP-\d{4}-\d{6}/i);
        const id = (found ? found[0] : raw).toUpperCase();
        const name = $('vName').value.trim().toLowerCase();
        const record = store.get('lp_registry')[id];
        const checks = [];
        const formatOk = /^ODP-\d{4}-\d{6}$/.test(id);
        checks.push({ label: 'ID format', status: formatOk ? 'ok' : 'fail', detail: formatOk ? 'Looks like a LifePledge ID.' : 'Pledge IDs look like ODP-2026-123456.' });
        checks.push({ label: 'Pledge record', status: record ? 'ok' : 'fail', detail: record ? `Found. Issued ${record.issued}.` : 'No pledge with this ID was made in this browser.' });
        if (record) {
            const match = name && record.name.trim().toLowerCase() === name;
            checks.push({ label: 'Donor name', status: match ? 'ok' : 'fail', detail: match ? 'Matches the pledge record.' : 'Does not match the name on the pledge record.' });
            checks.push({ label: 'Blood group and organs', status: 'ok', detail: `${record.blood}. ${record.organs}. Compare with the card.` });
        }
        const verdict = checks.some((c) => c.status === 'fail') ? 'fail' : 'pass';
        renderResult($('cardResult'), verdict, verdict === 'pass' ? 'Card matches a pledge made in this browser.' : 'No matching pledge found.', checks);
    });

    $('docVerifyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const box = $('docResult');
        const file = $('vFile').files[0];
        if (!file) { box.innerHTML = '<span class="field-error">Choose a PDF or image first.</span>'; return; }
        if (file.size > 10 * 1024 * 1024) { box.innerHTML = '<span class="field-error">File is over 10 MB. Choose a smaller one.</span>'; return; }
        box.textContent = 'Running checks...';
        const result = await analyzeDocument(file, { issuer: $('vIssuer').value.trim(), number: $('vCert').value.trim(), date: $('vDate').value });
        const headlines = {
            pass: 'Passed automated checks. Still confirm with the issuer.',
            review: 'Needs manual review. Contact the issuer before relying on it.',
            fail: 'Failed automated checks. Do not rely on this document.'
        };
        renderResult(box, result.verdict, headlines[result.verdict], result.checks, `SHA-256: ${result.hash}`);
    });
});

/**
 * LifePledge: Organ guide in the information section.
 * Shows exactly which part of each organ is donated, plus quick facts.
 */
document.addEventListener('DOMContentLoaded', () => {
    const tabsEl = document.getElementById('organTabs');
    const detailEl = document.getElementById('organDetail');
    if (!tabsEl || !detailEl) return;

    // `parts` = the exact parts that are donated. `values` match the pledge form checkboxes.
    const ORGANS = {
        Heart: {
            label: 'Heart', icon: 'fa-heart', values: ['Heart'],
            part: 'The whole heart is removed as one organ and given to one person. The heart valves can also be donated separately as tissue.',
            parts: ['Whole heart', 'Heart valves (as tissue)'],
            recipients: '1 person', keeps: 'About 4 to 6 hours', living: 'No, after death only',
            facts: [
                'A heart is matched by blood group and body size, so the recipient needs a heart that fits.',
                'It has to be transplanted within hours, so the whole process is a race against time.',
                'It is the only chance for many people with end-stage heart failure.',
                'A donated heart beats around 100,000 times a day in its new body.'
            ]
        },
        Kidneys: {
            label: 'Kidneys', icon: 'fa-bacteria', values: ['Kidneys'],
            part: 'Both kidneys. Each kidney works on its own, so they usually go to two different people.',
            parts: ['Left kidney', 'Right kidney'],
            recipients: 'Up to 2 people', keeps: 'About 24 to 36 hours', living: 'Yes, one kidney',
            facts: [
                'A transplant can free a person from dialysis.',
                'A living person can donate one kidney and stay healthy with the other.',
                'Kidneys are the most commonly transplanted organ.',
                'Most people on the transplant waiting list are waiting for a kidney.'
            ]
        },
        Liver: {
            label: 'Liver', icon: 'fa-shield-virus', values: ['Liver'],
            part: 'The whole liver, or a part of it. A deceased donor\u2019s liver can be split so two people, often an adult and a child, each get a part.',
            parts: ['Whole liver', 'Right lobe (larger part)', 'Left lobe (smaller part)'],
            recipients: '1 or 2 people', keeps: 'About 8 to 12 hours', living: 'Yes, a part of the liver',
            facts: [
                'The liver can regrow. A living donor\u2019s liver returns close to full size within weeks to months.',
                'Splitting a liver is one way a single donor can help more than one patient.',
                'Transplant is often the only treatment for acute or end-stage liver failure.'
            ]
        },
        Lungs: {
            label: 'Lungs', icon: 'fa-lungs', values: ['Lungs'],
            part: 'One or both lungs. Each lung can go to a different person, or both can go to one person (a double lung transplant).',
            parts: ['Left lung', 'Right lung'],
            recipients: '1 or 2 people', keeps: 'About 4 to 8 hours', living: 'Rare, a lobe of a lung',
            facts: [
                'Lungs are easily damaged, so only some donors\u2019 lungs are suitable for transplant.',
                'They are matched mainly by blood group and chest size.',
                'A transplant can help people with severe conditions such as pulmonary fibrosis or cystic fibrosis.'
            ]
        },
        Pancreas: {
            label: 'Pancreas', icon: 'fa-dna', values: ['Pancreas'],
            part: 'The pancreas, or sometimes only its insulin-making islet cells. It is often given to one person together with a kidney.',
            parts: ['Whole pancreas', 'Islet cells (insulin-making cells)'],
            recipients: '1 person', keeps: 'About 12 to 18 hours', living: 'Very rare, a segment',
            facts: [
                'It is used mainly for people with type 1 diabetes.',
                'A successful transplant can greatly reduce, or end, the need for insulin injections.',
                'Pancreas and kidney are commonly transplanted together when diabetes has damaged the kidneys.'
            ]
        },
        Intestines: {
            label: 'Intestines', icon: 'fa-capsules', values: [],
            part: 'A section of the small intestine, sometimes with other nearby organs. It is used for people whose own intestine can no longer absorb food.',
            parts: ['Small intestine (a section or the whole)'],
            recipients: '1 person', keeps: 'About 6 to 10 hours', living: 'Rare, a segment',
            facts: [
                'It is mainly for people with intestinal failure who cannot be fed by mouth.',
                'Many recipients depend on intravenous nutrition before the transplant.',
                'It is one of the less common transplants, so donors are especially needed.'
            ]
        },
        Corneas: {
            label: 'Corneas (Eyes)', icon: 'fa-eye', values: ['Corneas'],
            part: 'Only the cornea, the clear dome at the front of the eye. The whole eye is never transplanted, and the face looks natural afterwards.',
            parts: ['Left cornea', 'Right cornea'],
            recipients: 'Up to 2 people', keeps: 'Up to about 2 weeks in storage', living: 'No, after death only',
            facts: [
                'One donor can restore sight to two people, one for each cornea.',
                'Blood group matching is not needed for a corneal transplant.',
                'Corneas should be recovered soon after death, ideally within about 6 hours.',
                'Wearing glasses or being older usually does not rule you out.'
            ]
        },
        Tissues: {
            label: 'Bone & Skin Tissues', icon: 'fa-bone', values: ['Tissues'],
            part: 'A thin layer of skin, bone, tendons and ligaments, heart valves and blood vessels. Where bone is taken, supports are placed so the body keeps its shape.',
            parts: ['Skin (thin top layer)', 'Bone', 'Tendons & ligaments', 'Heart valves', 'Blood vessels'],
            recipients: 'Many people', keeps: 'Months to years in storage', living: 'No, after death only',
            facts: [
                'Skin grafts protect burn patients from infection and fluid loss.',
                'Donated heart valves can repair serious heart defects, including in babies.',
                'Bone and tendon grafts help people to walk again after injury or disease.',
                'Tissue can usually be recovered up to about a day after death.'
            ]
        }
    };

    const keys = Object.keys(ORGANS);
    let active = 'Heart';

    function render() {
        tabsEl.innerHTML = keys.map((k) => {
            const o = ORGANS[k];
            const cls = 'organ-tab' + (k === active ? ' active' : '');
            return `<button type="button" class="${cls}" role="tab" data-organ="${k}" aria-selected="${k === active}">` +
                `<i class="fa-solid ${o.icon}"></i><span>${o.label}</span></button>`;
        }).join('');

        const o = ORGANS[active];
        detailEl.innerHTML =
            `<div class="od-top">` +
                `<div class="od-title"><span class="od-icon"><i class="fa-solid ${o.icon}"></i></span>${o.label}</div>` +
                `<button type="button" class="od-toggle" data-pledge="${active}"><i class="fa-solid fa-hand-holding-heart"></i> Pledge this</button>` +
            `</div>` +
            `<div class="od-part"><span class="od-label">Exactly what is donated</span><p>${o.part}</p>` +
                `<div class="od-chips">${o.parts.map((p) => `<span class="od-chip">${p}</span>`).join('')}</div></div>` +
            `<div class="od-stats">` +
                `<div class="od-stat"><span class="od-label">Can help</span><strong>${o.recipients}</strong></div>` +
                `<div class="od-stat"><span class="od-label">Usable for</span><strong>${o.keeps}</strong></div>` +
                `<div class="od-stat"><span class="od-label">Living donation?</span><strong>${o.living}</strong></div>` +
            `</div>` +
            `<span class="od-label od-facts-title">Facts</span>` +
            `<ul class="od-facts">${o.facts.map((f) => `<li><i class="fa-solid fa-circle-check"></i><span>${f}</span></li>`).join('')}</ul>`;
    }

    tabsEl.addEventListener('click', (e) => {
        const tab = e.target.closest('.organ-tab');
        if (!tab) return;
        active = tab.dataset.organ;
        render();
    });

    // "Pledge this" ticks the matching box in the pledge form and scrolls there
    detailEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.od-toggle');
        if (!btn) return;
        ORGANS[btn.dataset.pledge].values.forEach((v) => {
            const b = document.querySelector(`input[name="organs"][value="${v}"]`);
            if (b && !b.checked) {
                b.checked = true;
                b.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        const pledge = document.getElementById('pledge');
        if (pledge) pledge.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    render();
});