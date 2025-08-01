// Configuration de Tailwind CSS pour le thème sombre
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
};

// Variables globales
let currentFile = null;
let compressedPdfBytes = null;

// Éléments DOM
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const downloadContainer = document.getElementById('download-container');
const downloadBtn = document.getElementById('download-btn');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    setupEventListeners();
    setupDragAndDrop();
});

/**
 * Initialise le thème sombre/clair
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        updateThemeIcons(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcons(false);
    }
}

/**
 * Met à jour les icônes du thème
 */
function updateThemeIcons(isDark) {
    if (isDark) {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Toggle du thème
    themeToggle.addEventListener('click', toggleTheme);
    
    // Sélection de fichier
    fileInput.addEventListener('change', handleFileSelect);
    
    // Téléchargement
    downloadBtn.addEventListener('click', downloadCompressedFile);
}

/**
 * Bascule entre thème clair et sombre
 */
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons(isDark);
}

/**
 * Configure le drag and drop
 */
function setupDragAndDrop() {
    // Empêcher le comportement par défaut du navigateur
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Gérer les événements de drag
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Gérer le drop
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Clic sur la zone de drop
    dropZone.addEventListener('click', () => fileInput.click());
}

/**
 * Empêche le comportement par défaut
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Met en surbrillance la zone de drop
 */
function highlight(e) {
    dropZone.classList.add('drag-over');
}

/**
 * Retire la surbrillance de la zone de drop
 */
function unhighlight(e) {
    dropZone.classList.remove('drag-over');
}

/**
 * Gère le drop de fichier
 */
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

/**
 * Gère la sélection de fichier via l'input
 */
function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

/**
 * Traite les fichiers sélectionnés
 */
function handleFiles(files) {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Vérifier le type de fichier
    if (file.type !== 'application/pdf') {
        showError('Veuillez sélectionner un fichier PDF valide.');
        return;
    }
    
    // Vérifier la taille (10 MB max)
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
        showError('Le fichier est trop volumineux. Taille maximale : 10 MB.');
        return;
    }
    
    currentFile = file;
    startCompression(file);
}

/**
 * Affiche une erreur
 */
function showError(message) {
    // Créer une notification d'erreur
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Démarre la compression du PDF
 */
async function startCompression(file) {
    try {
        // Afficher la barre de progression
        progressContainer.classList.remove('hidden');
        downloadContainer.classList.add('hidden');
        
        // Simuler la progression
        simulateProgress();
        
        // Lire le fichier
        const arrayBuffer = await file.arrayBuffer();
        
        // Compresser le PDF
        const compressedBytes = await compressPDF(arrayBuffer);
        
        // Stocker le résultat
        compressedPdfBytes = compressedBytes;
        
        // Afficher le bouton de téléchargement
        showDownloadButton();
        
    } catch (error) {
        console.error('Erreur lors de la compression:', error);
        showError('Une erreur est survenue lors de la compression. Veuillez réessayer.');
        hideProgress();
    }
}

/**
 * Simule la progression de la compression
 */
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        
        progressBar.style.width = `${progress}%`;
        
        if (progress < 30) {
            progressText.textContent = 'Analyse du fichier...';
        } else if (progress < 60) {
            progressText.textContent = 'Compression des images...';
        } else if (progress < 90) {
            progressText.textContent = 'Optimisation du PDF...';
        } else {
            progressText.textContent = 'Finalisation...';
        }
    }, 200);
}

/**
 * Compresse le PDF en utilisant pdf-lib
 */
async function compressPDF(arrayBuffer) {
    try {
        // Charger le PDF
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        
        // Obtenir toutes les pages
        const pages = pdfDoc.getPages();
        
        // Pour une vraie compression, on pourrait :
        // 1. Réduire la qualité des images
        // 2. Supprimer les métadonnées inutiles
        // 3. Optimiser les polices
        
        // Pour l'instant, on simule une compression en sauvegardant avec des options de compression
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 20,
        });
        
        return compressedBytes;
        
    } catch (error) {
        console.error('Erreur lors de la compression PDF:', error);
        throw new Error('Impossible de compresser le fichier PDF');
    }
}

/**
 * Affiche le bouton de téléchargement
 */
function showDownloadButton() {
    progressContainer.classList.add('hidden');
    downloadContainer.classList.remove('hidden');
    
    // Calculer la réduction de taille
    const originalSize = currentFile.size;
    const compressedSize = compressedPdfBytes.length;
    const reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    // Mettre à jour le texte
    const sizeText = document.createElement('p');
    sizeText.className = 'text-sm text-gray-600 dark:text-gray-300 mt-2';
    sizeText.textContent = `Taille réduite de ${reduction}% (${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)})`;
    
    const downloadText = downloadContainer.querySelector('p');
    downloadText.parentNode.insertBefore(sizeText, downloadText.nextSibling);
}

/**
 * Cache la barre de progression
 */
function hideProgress() {
    progressContainer.classList.add('hidden');
    progressBar.style.width = '0%';
}

/**
 * Télécharge le fichier compressé
 */
function downloadCompressedFile() {
    if (!compressedPdfBytes) {
        showError('Aucun fichier compressé disponible.');
        return;
    }
    
    // Créer un blob et télécharger
    const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${currentFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Nettoyer l'URL
    URL.revokeObjectURL(url);
    
    // Nettoyer les données
    cleanupAfterDownload();
}

/**
 * Nettoie les données après téléchargement
 */
function cleanupAfterDownload() {
    // Supprimer le fichier du navigateur
    fileInput.value = '';
    currentFile = null;
    compressedPdfBytes = null;
    
    // Cacher les conteneurs
    downloadContainer.classList.add('hidden');
    
    // Réinitialiser la zone de drop
    dropZone.innerHTML = `
        <div class="space-y-4">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="text-gray-600 dark:text-gray-300">
                <label for="file-input" class="cursor-pointer">
                    <span class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">Cliquez pour sélectionner</span>
                    <span class="text-gray-500 dark:text-gray-400"> ou glissez-déposez votre fichier PDF</span>
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Taille maximale : 10 MB
                </p>
            </div>
        </div>
    `;
}

/**
 * Formate la taille de fichier en format lisible
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    showError('Une erreur inattendue s\'est produite. Veuillez recharger la page.');
});

// Gestion des erreurs de promesses non gérées
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesse rejetée:', e.reason);
    showError('Une erreur s\'est produite lors du traitement. Veuillez réessayer.');
}); 