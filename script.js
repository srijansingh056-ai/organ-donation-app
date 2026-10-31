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

        // Validate DOB
        if (!dob) {
            showFieldError('dobError', 'Please select a valid date of birth.');
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
            const medCertText = currentPledgeData.hasMedicalCert ? `\n📑 *Medical Fitness:* Verified Certificate Attached` : '';

            const message = `❤️ *Official Organ Donation Pledge Announcement*\n\n` +
                `Dear family,\n\n` +
                `I want to share an important humanitarian decision with you. I have officially pledged to donate my organs and tissues upon death to save and restore lives.\n\n` +
                `📋 *Official Pledge ID:* ${id}\n` +
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
