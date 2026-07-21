export const TRANSLATIONS = {
  FR: {
    appTitle: "NeuroDeck",
    streakLabel: "Série",
    loadingAi: "Chargement de l'IA...",
    aiReady: "IA Prête",
    aiError: "Erreur IA",
    waiting: "En attente",
    noQuestions: "Aucune question disponible. Allez dans les paramètres pour en ajouter !",
    typeAnswerPlaceholder: "Tapez votre réponse ici...",
    analyzing: "Analyse en cours",
    submitRevision: "Soumettre la révision",
    submitAnswer: "Soumettre la réponse",
    loadingEngine: "Chargement du moteur neuronal...",
    conceptuallyClose: "Conceptuellement proche !",
    notQuiteRight: "Pas tout à fait ça.",
    closeFeedback: "Développez ou utilisez une terminologie plus spécifique. Modifiez votre réponse ci-dessus.",
    wrongFeedback: "Votre réponse n'a pas atteint le seuil. Modifiez votre texte ci-dessus, ou choisissez une option ci-dessous.",
    aiHintLabel: "Indice IA :",
    getAiHint: "Obtenir un indice IA",
    showChoices: "Afficher les choix",
    showMultipleChoice: "Afficher le choix multiple",
    overrideTune: "J'avais en fait raison ! (Forcer et ajuster l'IA)",
    correct: "Correct !",
    scoreLabel: "Score :",
    nextQuestion: "Question suivante",
    gradedTooEasily: "L'IA a noté trop facilement ? Marquer comme faux.",
    typedRight: "Ma réponse tapée était en fait correcte !",
    pressNumber: "Appuyez sur 1-{count} sur le clavier",
    dataBackup: "Gestion des paquets",
    dataBackupDesc: "Gérez vos paquets en les exportant, ou en les partageant via le cloud.",
    exportBackup: "Exporter JSON (Progression)",
    exportBackupClean: "Exporter JSON (Propre)",
    exportAnki: "Exporter Anki (CSV)",
    shareProgress: "Partager (Progression)",
    shareClean: "Partager (Propre)",
    importFile: "Importer Fichier (JSON/CSV)",
    importCodeBtn: "Importer Code",
    exportShareTitle: "Exporter & Partager",
    importLoadTitle: "Importer & Charger",
    importBackup: "Importer la sauvegarde",
    hintEngine: "Moteur d'indices",
    blankCoreWords: "Mots clés masqués",
    blankCoreWordsDesc: "Utilise l'ablation WebGPU pour trouver et masquer les mots sémantiquement importants.",
    relatedConcept: "Concept associé",
    relatedConceptDesc: "Trouve le mot le plus important et fournit un concept associé via l'API du dictionnaire.",
    aiModelTitle: "Modèle IA",
    embeddingModelTitle: "Modèle de Plongement (Focus Sémantique & Graphe)",
    fastLightweight: "Rapide & Léger (~22MB)",
    moreAccurate: "Plus Précis (~133MB)",
    highQuality: "Haute Qualité (~438MB)",
    embeddingFast: "Très rapide, léger (22MB)",
    embeddingBalanced: "Meilleure précision, légèrement plus lent (120MB)",
    embeddingHQ: "Précision de pointe (438MB)",
    generatingEmbeddingsDesc: "Génération de plongements neuronaux pour votre graphe de connaissances. Cela ne se produit qu'une seule fois.",
    downloadingAiModel: "Téléchargement du Modèle IA...",
    extractingData: "Extraction de données...",
    rawDeckImport: "Importation brute du paquet",
    rawDeckImportDesc: "Fournissez un tableau d'objets JSON contenant `question`, `correctAnswer` et un tableau `choices`.",
    importResetDeck: "Importer et réinitialiser le paquet",
    dashboardTitle: "Tableau de bord",
    strictness: "Sévérité :",
    average: "Moyenne :",
    questionCol: "Question",
    attemptsCol: "Tentatives",
    scoreCol: "Score",
    newStatus: "Nouveau",
    mastery: "Maîtrise :",
    match: "Correspondance :",
    alertLoading: "Le modèle IA est toujours en chargement. Veuillez patienter un instant.",
    alertError: "Une erreur s'est produite lors de l'évaluation.",
    alertRestored: "Progression restaurée avec succès !",
    alertInvalidFormat: "Format de fichier de progression invalide.",
    alertFailedRestore: "Échec de la restauration de la progression : ",
    alertJsonArray: "Le JSON doit être un tableau",
    alertInvalidIndex: "Format invalide à l'index",
    alertDeckImported: "Paquet importé avec succès !",
    shortHintError: "Réponse trop courte pour un indice structurel.",
    dictError: "Échec du chargement du synonyme depuis le dictionnaire.",
    aiHintError: "Erreur lors de la génération de l'indice IA.",
    relatedConceptHint: "Un concept associé à un terme manquant est :",
    stronglyRelatedHint: "Un terme clé est fortement associé à :",
    llmGeneratorTitle: "Générateur de Deck IA",
    llmGeneratorDesc: "Copiez le modèle de prompt pour générer automatiquement des cartes mémoire JSON à partir de vos notes d'étude à l'aide de ChatGPT, Claude ou d'autres LLM.",
    copyPromptBtn: "Copier le Modèle",
    promptCopiedBtn: "Copié !",
    llmPromptTemplate: "Vous êtes un assistant éducatif expert. Je vais vous fournir un document ou un texte d'étude. Votre tâche est d'extraire les informations les plus importantes et de générer un paquet de cartes-éclair/quiz formaté sous forme de tableau JSON strict.\n\n### Exigences du Schéma JSON\nChaque objet du tableau JSON DOIT comporter les champs suivants :\n1. `id` : Un identifiant de chaîne unique pour la question (ex : \"q1\", \"q2\").\n2. `question` : Le texte de la question (Chaîne). La question DOIT pouvoir être répondue sans voir les choix (évitez \"Lequel des éléments suivants...\" ou \"Parmi ces options...\").\n3. `correctAnswers` : Un tableau de chaînes contenant la/les bonne(s) réponse(s). S'il n'y a qu'une seule bonne réponse, cela doit être un tableau avec une seule chaîne.\n4. `choices` : Un tableau de chaînes représentant les options à choix multiples. **CRITIQUE :** Ce tableau DOIT inclure la/les chaîne(s) exacte(s) de `correctAnswers` plus 3 à 4 distracteurs plausibles (options incorrectes).\n5. `hint` : Une courte chaîne contenant un indice utile (Chaîne).\n\n### Lignes Directrices\n* Formulez les questions pour qu'elles soient indépendantes et puissent être répondues sans voir les choix. Évitez les formulations comme \"Lequel des éléments suivants...\" ou \"Parmi ces options...\".\n* Gardez les choix concis.\n* Mélangez les questions à réponse unique avec les questions à choix multiples (\"sélectionnez toutes les réponses applicables\") si le texte le permet.\n* Assurez-vous que le texte exact de `correctAnswers` correspond parfaitement aux bons éléments dans `choices`.\n* Ne produisez aucun formatage markdown autour le JSON, juste le tableau JSON brut.\n\n### Exemple de Sortie\n[\n  {\n    \"id\": \"bio-001\",\n    \"question\": \"Quel organite est principalement responsable de la production d'énergie cellulaire (ATP) ?\",\n    \"correctAnswers\": [\n      \"Mitochondria\"\n    ],\n    \"choices\": [\n      \"Noyau\",\n      \"Ribosome\",\n      \"Mitochondria\",\n      \"Appareil de Golgi\"\n    ],\n    \"hint\": \"C'est souvent appelé la centrale énergétique de la cellule.\"\n  }\n]\n\n### Texte d'Entrée :\n[COLLEZ VOTRE DOCUMENT OU TEXTE ICI]",
    leaningWrong: "Tendance fausse",
    leaningWrongFeedback: "Attention ! Votre réponse se rapproche plus d'un choix incorrect.",
    showChoicesDirect: "Choix",
    skipKnowIt: "Passer (+1)",
    submitSelection: "Soumettre la sélection",
    pressNumberSingle: "Sélectionnez 1 des {n} choix.",
    iWasRight: "J'avais raison",
    cardOrder: "Ordre de livraison des cartes",
    orderSpaced: "Répétition espacée",
    orderSequential: "Séquentiel",
    orderRandom: "Aléatoire",
    prevCard: "Préc.",
    nextCard: "Suiv.",
    cardLabel: "Carte",
    ofLabel: "sur",
    mcqSelectedIncorrect: "Vous avez sélectionné des options incorrectes. ",
    mcqMissedCorrect: "Vous avez manqué certaines options correctes.",
    myDecksTitle: "Mes Paquets",
    deckNamePlaceholder: "Nom du paquet...",
    saveDeckBtn: "Sauvegarder",
    cardsLabel: "cartes",
    loadBtn: "Charger",
    deleteBtn: "Supprimer",
    noSavedDecks: "Aucun paquet sauvegardé.",
    alertDeckSaved: "Paquet sauvegardé dans Mes Paquets !",
    alertDeckLoaded: "Paquet chargé !",
    confirmDeleteDeck: "Voulez-vous vraiment supprimer ce paquet ?",
    all: "Tous",
    completed: "Terminé",
    inProgress: "En cours",
    sortByName: "Trier par nom",
    sortByAvg: "Trier par moyenne",
    sortByProgress: "Trier par progression",
    searchDecksPrompt: "Chercher les paquets...",
    loadedDeck: "Déjà chargé",
    llmGeneratorLongTitle: "Générateur de Deck IA (Questions Longues)",
    llmGeneratorLongDesc: "Générez des questions longues (sans choix multiples) pour une auto-évaluation.",
    copyLongPromptBtn: "Copier le Modèle Long",
    llmPromptLongTemplate: "Vous êtes un assistant éducatif expert. Je vais vous fournir un document ou un texte d'étude. Votre tâche est d'extraire les informations les plus importantes et de générer un paquet de cartes mémoire formaté sous forme de tableau JSON strict. CES QUESTIONS SONT DES QUESTIONS LONGUES SANS CHOIX MULTIPLES.\n\n### Exigences du Schéma JSON\nChaque objet DOIT comporter :\n1. `id` : Identifiant unique.\n2. `question` : La question longue. La question DOIT être autonome (ex: \"Écrivez le code pour...\", \"Dessinez un diagramme...\", \"Expliquez...\").\n3. `type` : \"long\"\n4. `hint` : Une solution possible ou la réponse attendue pour vérifier (ex: l'extrait de code exact, le calcul final). Ceci DOIT être fourni pour que l'utilisateur puisse vérifier son travail.\nNe pas inclure de tableau `choices` ni `correctAnswers`.\n\n### Exemple de Sortie\n[\n  {\n    \"id\": \"algo-001\",\n    \"question\": \"Écrivez le code pour effectuer une recherche binaire sur un tableau trié.\",\n    \"type\": \"long\",\n    \"hint\": \"function binarySearch(arr, target) { ... }\"\n  }\n]\n\n### Texte d'Entrée :\n[COLLEZ VOTRE DOCUMENT OU TEXTE ICI]",
    longFinished: "Je l'ai terminé",
    longWorkedOn: "J'y ai travaillé",
    longGaveUp: "J'ai abandonné",
    longSkip: "Passer",
    deckAppendPrompt: "Voulez-vous créer un nouveau paquet ou ajouter ces questions au paquet actuel ?",
    deckCreateNew: "Nouveau Paquet",
    deckAppend: "Ajouter",
    servingModeLabel: "Mode de présentation",
    servingModeFull: "Complet (Réponse tapée puis choix)",
    servingModeMCQ: "Choix Multiple Direct",
    servingModePass: "Mode Révision (Réponses affichées)",
    servingModeDesc: "Choisissez comment les cartes vous sont présentées.",
    cloudSyncTitle: "Synchronisation Cloud",
    syncCodeLabel: "Code de Sync :",
    generateCode: "Générer",
    connectBtn: "Connecter",
    syncUpload: "Envoyer au Cloud",
    syncDownload: "Récupérer du Cloud",
    focusModeActive: "Mode Focus Actif",
    thresholdLabel: "Seuil de similarité",
    topNLabel: "Nombre de cartes",
    onlyThisCard: "Seulement cette carte",
    allCards: "Toutes les cartes",
    broadAll: "Large (Toutes)",
    strictSelf: "Strict (Seule)",
    justThis: "Juste celle-ci",
    everything: "Tout",
    studyCluster: "ÉTUDIER LE GROUPE",
    clearSelection: "EFFACER LA SÉLECTION",
    focusPreview: "Aperçu du Focus",
    cardsPreview: "Cartes",
    clearBtn: "EFFACER",
    thresholdMode: "Seuil",
    topNMode: "Top N",
    knowledgeGraphTitle: "Neuro-Carte",
    recenter: "Recalculer",
    questionTypesLabel: "Types de Questions",
    typeLong: "Questions Longues",
    typeMcc: "Choix Unique (MCC)",
    typeMulti: "Choix Multiple (Multi-MCC)",
    proportionalLabel: "Distribution Proportionnelle des Types",
    proportionalDesc: "Sert dynamiquement les questions pour correspondre parfaitement au ratio de votre paquet (ex: 10% longues, 90% MCC) basé sur vos réponses à vie.",
    dangerZone: "Zone de Danger",
    clearCloudData: "Effacer Toutes les Données Cloud (Effacement à Distance)",
    syncDescActive: "La synchronisation automatique est activée. Les modifications seront appliquées en arrière-plan.",
    syncDescInactive: "Entrez un code pour activer la synchronisation automatique (expire après 5 minutes d'inactivité). Les codes de partage expirent après 3 jours.",
    scanToSync: "Scanner pour Synchroniser",
    syncStreamConnected: "Synchronisation Cloud : Connecté au flux.",
    syncUpToDate: "Connecté ! Vous êtes déjà à jour.",
    syncNetError: "Échec de la connexion réseau.",
    syncError: "Une erreur inattendue s'est produite.",
    shareSuccess: "Partagé avec succès ! Code :",
    linkCopied: "Lien copié dans le presse-papiers !",
    enterSyncOrShareCode: "ENTRER LE CODE DE SYNCHRONISATION OU DE PARTAGE",
    stopSyncBtn: "Arrêter la synchro",
    failedToParse: "Échec de l'analyse",
    unsupportedFormat: "Format de fichier non pris en charge",
    shareCodeIs: "Code de partage :",
    scanCodeOrOpenLink: "Scannez ce code ou ouvrez le lien pour importer les cartes partagées.",
    generatingCode: "Génération de votre nouveau code...",
    clipboardFailed: "Échec de la copie. Accès au presse-papiers refusé.",
    importedFile: "Importé",
    shareHierarchyProgress: "Partager la hiérarchie (Progression)",
    shareHierarchyClean: "Partager la hiérarchie (Propre)",
    networkFailedSharing: "Échec de la connexion réseau lors du partage.",
    errorWhileSharing: "Une erreur inattendue s'est produite lors du partage.",
    syncCodeExpiredNew: "Le code de synchronisation a expiré. Veuillez en générer un nouveau.",
    syncDisabled: "Synchronisation désactivée.",
    syncSessionConnected: "Connecté avec succès à la session de synchronisation !",
    syncSessionConnectFailed: "Échec de la connexion à la session de synchronisation.",
    remoteServerReset: "Réinitialisation du serveur distant détectée. Re-transfert de l'état local...",
    detectedSyncCodeImporting: "Code de synchronisation détecté dans l'importation. Connexion...",
    hierarchyImportedSaved: "Hiérarchie importée et sauvegardée dans Mes Paquets !",
    cardsAppended: "Cartes ajoutées au paquet actuel !",
    savedAsNewDeck: "Sauvegardé comme nouveau paquet dans Mes Paquets !",
    codeNotSharedDeck: "Le code ne contient pas de paquet partagé.",
    networkFailedImport: "Échec de la connexion réseau pendant l'importation.",
    errorDuringImport: "Une erreur inattendue s'est produite pendant l'importation.",
    syncCodeExpiredNotFound: "Code de synchronisation expiré ou introuvable.",
    failedToPullSync: "Échec de l'extraction des données de synchronisation :",
    connectingSecureChannel: "Connexion au canal sécurisé...",
    syncSessionMoved: "La session de synchronisation a été déplacée ! Reconnexion...",
    detectedShareCodeImporting: "Code de partage détecté. Importation...",
    cloudSyncPulled: "Synchro Cloud : Données récupérées avec succès.",
    cloudSyncPushed: "Synchro Cloud : Données poussées initialement.",
    cloudSyncFailed: "Échec de la synchronisation cloud :",
    cloudSyncFailedNetwork: "Échec de la synchronisation cloud : Erreur réseau",
    cloudSyncFailedUnexpected: "Échec de la synchronisation cloud : Erreur inattendue",
    highDemand: "Veuillez réessayer plus tard, nous connaissons une forte demande.",
    failedConnectSyncServer: "Échec de la connexion au serveur de synchronisation.",
    failedGeneratePairingCode: "Échec de la génération d'un code d'appairage. Réessayez.",
    cloudDataWiped: "Données cloud effacées avec succès",
    failedClearCloudData: "Échec de l'effacement des données cloud.",
    networkErrorClearingCloudData: "Erreur réseau lors de l'effacement des données cloud.",
    noLoadedDeckToShare: "Aucun paquet chargé trouvé pour partager la hiérarchie.",
    deckExported: "Paquet exporté.",
    deckSaved: "Paquet sauvegardé.",
    deckDeleted: "Paquet supprimé.",
    deckMoved: "Paquet déplacé.",
    cannotMoveDeckInsideSelf: "Impossible de déplacer un paquet dans son propre sous-dossier.",
    nliEngine: "Moteur NLI",
    semanticAi: "IA Sémantique",
    engineError: "Erreur Moteur",
    embeddingsStatus: "Plongements",
    modelErrorStatus: "Erreur Modèle",
    autoSyncFailedSize: "Échec auto-synchro : Données trop volumineuses",
    shareCodeExpiredInvalid: "Code de partage expiré ou invalide.",
    rateLimitedTryAgain: "Limite de débit atteinte, réessayez plus tard.",
    items: "éléments",
    cannotSaveEmptyDeck: "Impossible de sauvegarder un paquet vide.",
    deckSavedSuccessfully: "Paquet sauvegardé avec succès !",
    noDeckLoadedToOverwrite: "Aucun paquet chargé à écraser.",
    deckUpdatedSuccessfully: "Paquet mis à jour avec succès !",
    loadedDeckName: "Paquet chargé :",
    decksDeleted: "Paquet(s) supprimé(s).",
    cannotMoveFolderInsideSelf: "Impossible de déplacer un dossier dans son propre sous-dossier.",
    cardsUpdated: "Cartes mises à jour !",
    cardsDeleted: "Cartes supprimées !",
    successfullyImported: "Importé avec succès",
    decksDeletedMsg: "Paquets supprimés.",
    decksMovedMsg: "Paquets déplacés.",
    cloudDataWipedRemotely: "Les données cloud ont été effacées à distance. Synchronisation désactivée.",
    deckAlreadyImported: "Paquet déjà importé. Chargé depuis la bibliothèque !",
    confirmDeleteDeckTitle: "Supprimer le Paquet",
    confirmDeleteDeckMessage: "Êtes-vous sûr de vouloir supprimer ce paquet ?",
    delete: "Supprimer",
    cancel: "Annuler",
    confirmDeleteCardsTitle: "Supprimer les Cartes",
    confirmDeleteDecksTitle: "Supprimer les Paquets",
    importDeckTitle: "Importer un Paquet Partagé",
    importDeckMessage: "Voulez-vous ajouter ces cartes partagées à votre paquet actuel ou les sauvegarder comme un nouveau paquet dans 'Mes Paquets' ?",
    append: "Ajouter",
    newDeck: "Nouveau Paquet",
    confirmClearCloudDataTitle: "Effacer les Données Cloud",
    confirmClearCloudDataMessage: "Êtes-vous sûr de vouloir effacer complètement toutes vos données de synchronisation cloud ? Cela supprimera définitivement tous les codes associés à votre appareil.",
    wipeData: "Effacer les Données",
    jumpToPriorityCard: "Aller à la question prioritaire",
    jumpToPriorityCardDesc: "Sautez de façon déterministe vers la prochaine question prioritaire selon l'algorithme pour démarrer au même endroit entre appareils synchronisés.",
    syncTokenHashLabel: "Hash du Token :",
    footerCourse: "Créé pour le cours SEG3525",
    footerSubtitle: "Moteur de Cartes Mémoire Cognitif",
    syncActive: "SYNCHRO ACTIVE",
    syncOffline: "SYNCHRO LOCALE (HORS LIGNE)"
  },
  EN: {
    appTitle: "NeuroDeck",
    streakLabel: "Streak",
    loadingAi: "Loading AI...",
    aiReady: "AI Ready",
    aiError: "AI Error",
    waiting: "Waiting",
    noQuestions: "No questions available. Go to settings to add some!",
    typeAnswerPlaceholder: "Type your answer here...",
    analyzing: "Analyzing",
    submitRevision: "Submit Revision",
    submitAnswer: "Submit Answer",
    loadingEngine: "Loading Neural Engine...",
    conceptuallyClose: "Conceptually close!",
    notQuiteRight: "Not quite right.",
    closeFeedback: "Expand on it or use more specific terminology. Modify your answer above.",
    wrongFeedback: "Your answer didn't hit the threshold. Modify your text above, or choose an option below.",
    aiHintLabel: "AI Hint:",
    getAiHint: "Get AI Hint",
    showChoices: "Show Choices",
    showMultipleChoice: "Show Multiple Choice",
    overrideTune: "Wait, my typed answer was right! (Tune AI)",
    correct: "Correct!",
    scoreLabel: "Score:",
    nextQuestion: "Next Question",
    gradedTooEasily: "AI graded too easily? Mark as missed.",
    typedRight: "My typed answer was actually right!",
    pressNumber: "Press 1-{count} on keyboard",
    dataBackup: "Deck Management",
    dataBackupDesc: "Manage your decks by exporting them or sharing via the cloud.",
    exportBackup: "Export JSON (With Progress)",
    exportBackupClean: "Export JSON (Clean)",
    exportAnki: "Export Anki (CSV)",
    shareProgress: "Share (With Progress)",
    shareClean: "Share (Clean)",
    importFile: "Import File (JSON/CSV)",
    importCodeBtn: "Import Code",
    exportShareTitle: "Export & Share",
    importLoadTitle: "Import & Load",
    importBackup: "Import Backup",
    hintEngine: "Hint Engine",
    blankCoreWords: "Blank Core Words",
    blankCoreWordsDesc: "Uses WebGPU ablation to find and hide semantically important words.",
    relatedConcept: "Related Concept",
    relatedConceptDesc: "Finds the most important word and provides a related concept via dictionary API.",
    aiModelTitle: "AI Model",
    embeddingModelTitle: "Embedding Model (Semantic Focus & Graph)",
    fastLightweight: "Fast & Lightweight (~22MB)",
    moreAccurate: "More Accurate (~133MB)",
    highQuality: "High Quality (~438MB)",
    embeddingFast: "Very fast, lightweight (22MB)",
    embeddingBalanced: "Better accuracy, slightly slower (120MB)",
    embeddingHQ: "State of the art accuracy (438MB)",
    generatingEmbeddingsDesc: "Generating neural embeddings for your knowledge graph. This only happens once.",
    downloadingAiModel: "Downloading AI Model...",
    extractingData: "Extracting Data...",
    rawDeckImport: "Raw Deck Import",
    rawDeckImportDesc: "Provide an array of JSON objects containing `question`, `correctAnswer`, and `choices` array.",
    importResetDeck: "Import & Reset Deck",
    dashboardTitle: "Dashboard",
    strictness: "Strictness:",
    average: "Average:",
    questionCol: "Question",
    attemptsCol: "Attempts",
    scoreCol: "Score",
    newStatus: "New",
    mastery: "Mastery:",
    match: "Match:",
    alertLoading: "AI Model is still loading. Please wait a moment.",
    alertError: "An error occurred during evaluation.",
    alertRestored: "Progress successfully restored!",
    alertInvalidFormat: "Invalid progress file format.",
    alertFailedRestore: "Failed to restore progress: ",
    alertJsonArray: "JSON must be an array",
    alertInvalidIndex: "Invalid format at index",
    alertDeckImported: "Deck imported successfully!",
    shortHintError: "Answer is too short for a structural hint.",
    dictError: "Failed to load synonym from dictionary.",
    aiHintError: "Error generating AI hint.",
    relatedConceptHint: "A related concept to a missing key term is:",
    stronglyRelatedHint: "A key term is strongly related to:",
    llmGeneratorTitle: "AI Deck Generator",
    llmGeneratorDesc: "Copy the prompt template to automatically generate JSON flashcards from your study notes using ChatGPT, Claude, or other LLMs.",
    copyPromptBtn: "Copy Prompt Template",
    promptCopiedBtn: "Copied!",
    llmPromptTemplate: "You are an expert educational assistant. I will provide you with a study document or text. Your task is to extract the most important information and generate a flashcard/quiz deck formatted as a strict JSON array.\n\n### JSON Schema Requirements\nEach object in the JSON array MUST have the following fields:\n1. `id`: A unique string identifier for the question (e.g., \"q1\", \"q2\").\n2. `question`: The question text (String). The question MUST be answerable without seeing the choices (avoid \"Which of the following...\" or \"Among these options...\").\n3. `correctAnswers`: An array of strings containing the correct answer(s). If there is only one right answer, it should be an array with a single string.\n4. `choices`: An array of strings representing the multiple-choice options. **CRITICAL:** This array MUST include the exact string(s) from `correctAnswers` plus 3 to 4 plausible distractors (incorrect options).\n5. `hint`: A short string containing a helpful hint (String).\n\n### Guidelines\n* Formulate questions so they are self-contained and can be answered without seeing the choices. Avoid phrasing like \"Which of the following...\" or \"Among these options...\".\n* Keep choices concise.\n* Mix single-answer questions with multi-answer questions (\"select all that apply\") if the text supports it.\n* Ensure the exact text from `correctAnswers` perfectly matches the correct items in `choices`.\n* Do not output any markdown formatting around the JSON, just the raw JSON array.\n\n### Example Output\n[\n  {\n    \"id\": \"bio-001\",\n    \"question\": \"Which organelle is primarily responsible for producing cellular energy (ATP)?\",\n    \"correctAnswers\": [\n      \"Mitochondria\"\n    ],\n    \"choices\": [\n      \"Nucleus\",\n      \"Ribosome\",\n      \"Mitochondria\",\n      \"Golgi Apparatus\"\n    ],\n    \"hint\": \"It is often called the powerhouse of the cell.\"\n  }\n]\n\n### Input Text:\n[PASTE YOUR DOCUMENT OR TEXT HERE]",
    leaningWrong: "Leaning Wrong",
    leaningWrongFeedback: "Careful! Your answer is closer to an incorrect choice.",
    showChoicesDirect: "Choices",
    skipKnowIt: "Skip (+1)",
    submitSelection: "Submit Selection",
    pressNumberSingle: "Select 1 of the {n} choices.",
    iWasRight: "I was right",
    cardOrder: "Card Delivery Order",
    orderSpaced: "Spaced Repetition",
    orderSequential: "Sequential",
    orderRandom: "Randomized",
    prevCard: "Prev",
    nextCard: "Next",
    cardLabel: "Card",
    ofLabel: "of",
    mcqSelectedIncorrect: "You selected incorrect options. ",
    mcqMissedCorrect: "You missed some correct options.",
    myDecksTitle: "My Decks",
    deckNamePlaceholder: "Enter deck name...",
    saveDeckBtn: "Save Current",
    cardsLabel: "cards",
    loadBtn: "Load",
    deleteBtn: "Delete",
    noSavedDecks: "No saved decks yet.",
    alertDeckSaved: "Deck saved to My Decks!",
    alertDeckLoaded: "Deck loaded!",
    confirmDeleteDeck: "Are you sure you want to delete this deck?",
    all: "All",
    completed: "Completed",
    inProgress: "In Progress",
    sortByName: "Sort by Name",
    sortByAvg: "Sort by Average",
    sortByProgress: "Sort by Progress",
    searchDecksPrompt: "Search decks...",
    loadedDeck: "Already loaded",
    llmGeneratorLongTitle: "AI Deck Generator (Long Form)",
    llmGeneratorLongDesc: "Generate long-form questions (no multiple choice) for self-grading.",
    copyLongPromptBtn: "Copy Long Prompt",
    llmPromptLongTemplate: "You are an expert educational assistant. I will provide you with a study document or text. Your task is to extract the most important information and generate a flashcard deck formatted as a strict JSON array. THESE ARE LONG FORM QUESTIONS WITH NO MULTIPLE CHOICES.\n\n### JSON Schema Requirements\nEach object MUST have:\n1. `id`: A unique string identifier.\n2. `question`: The long form question text. The question MUST be self-contained (e.g., \"Write the code for...\", \"Draw a diagram...\", \"Explain...\").\n3. `type`: \"long\"\n4. `hint`: A possible solution or expected answer to check against (e.g., the actual code snippet, the final calculation). This MUST be provided so the user can verify their work.\nDo NOT include a `choices` array or `correctAnswers` array.\n\n### Example Output\n[\n  {\n    \"id\": \"algo-001\",\n    \"question\": \"Write the code to perform a binary search on a sorted array.\",\n    \"type\": \"long\",\n    \"hint\": \"function binarySearch(arr, target) { ... }\"\n  }\n]\n\n### Input Text:\n[PASTE YOUR DOCUMENT OR TEXT HERE]",
    longFinished: "I finished it",
    longWorkedOn: "I worked on it",
    longGaveUp: "I gave up",
    longSkip: "Skip",
    deckAppendPrompt: "Would you like to create a new deck or append these questions to the current working deck?",
    deckCreateNew: "New Deck",
    deckAppend: "Append",
    servingModeLabel: "Serving Mode",
    servingModeFull: "Full (Type answer then choices)",
    servingModeMCQ: "Multiple Choice Direct",
    servingModePass: "Passthrough (Answers revealed)",
    servingModeDesc: "Choose how cards are presented to you.",
    cloudSyncTitle: "Cloud Sync",
    syncCodeLabel: "Sync Code:",
    generateCode: "Generate",
    connectBtn: "Connect",
    syncUpload: "Upload to Cloud",
    syncDownload: "Download from Cloud",
    focusModeActive: "Focus Mode Active",
    thresholdLabel: "Similarity Threshold",
    topNLabel: "Number of Cards",
    onlyThisCard: "Only This Card",
    allCards: "All Cards",
    broadAll: "Broad (All)",
    strictSelf: "Strict (Self)",
    justThis: "Just This",
    everything: "Everything",
    studyCluster: "STUDY CLUSTER",
    clearSelection: "CLEAR SELECTION",
    focusPreview: "Focus Preview",
    cardsPreview: "Cards",
    clearBtn: "CLEAR",
    thresholdMode: "Threshold",
    topNMode: "Top N",
    knowledgeGraphTitle: "Neuro-Map",
    recenter: "Recalculate",
    questionTypesLabel: "Question Types",
    typeLong: "Long Form Questions",
    typeMcc: "Single Choice (MCC)",
    typeMulti: "Multiple Choice (Multi-MCC)",
    proportionalLabel: "Proportional Type Distribution",
    proportionalDesc: "Dynamically serves questions to perfectly match the ratio of your deck (e.g. 10% long, 90% MCC) based on your lifetime answers.",
    dangerZone: "Danger Zone",
    clearCloudData: "Clear All Cloud Data (Remote Wipe)",
    syncDescActive: "Auto-sync is enabled. Changes will be pushed and pulled automatically in the background.",
    syncDescInactive: "Enter a code to enable automatic cross-device sync (expires after 5 minutes of inactivity). Share codes expire after 3 days.",
    scanToSync: "Scan to Sync",
    syncStreamConnected: "Cloud sync: Connected to stream.",
    syncUpToDate: "Connected! You are already up to date.",
    syncNetError: "Network connection failed.",
    syncError: "An unexpected error occurred.",
    shareSuccess: "Shared successfully! Code:",
    linkCopied: "Link copied to clipboard!",
    enterSyncOrShareCode: "ENTER SYNC OR SHARE CODE",
    stopSyncBtn: "Stop Sync",
    failedToParse: "Failed to parse",
    unsupportedFormat: "Unsupported file format",
    shareCodeIs: "Share Code:",
    scanCodeOrOpenLink: "Scan this code or open the link to import the shared cards.",
    generatingCode: "Generating your new code...",
    clipboardFailed: "Failed to copy. Clipboard access denied.",
    importedFile: "Imported",
    shareHierarchyProgress: "Share Hierarchy (With Progress)",
    shareHierarchyClean: "Share Hierarchy (Clean)",
    networkFailedSharing: "Network connection failed while sharing.",
    errorWhileSharing: "An unexpected error occurred while sharing.",
    syncCodeExpiredNew: "Sync code expired. Please generate a new one.",
    syncDisabled: "Sync disabled.",
    syncSessionConnected: "Successfully connected to sync session!",
    syncSessionConnectFailed: "Failed to connect to sync session.",
    remoteServerReset: "Remote server reset detected. Re-pushing local state to cloud...",
    detectedSyncCodeImporting: "Detected sync code in import input. Connecting...",
    hierarchyImportedSaved: "Hierarchy imported and saved to My Decks!",
    cardsAppended: "Cards appended to current deck!",
    savedAsNewDeck: "Saved as new deck in My Decks!",
    codeNotSharedDeck: "Code does not contain a shared deck.",
    networkFailedImport: "Network connection failed during import.",
    errorDuringImport: "An unexpected error occurred during import.",
    syncCodeExpiredNotFound: "Sync code expired or not found.",
    failedToPullSync: "Failed to pull sync data:",
    connectingSecureChannel: "Connecting to secure channel...",
    syncSessionMoved: "Sync session moved! Reconnecting...",
    detectedShareCodeImporting: "Detected share code in sync input. Importing...",
    cloudSyncPulled: "Cloud sync: Data pulled successfully.",
    cloudSyncPushed: "Cloud sync: Data pushed initially.",
    cloudSyncFailed: "Cloud sync failed:",
    cloudSyncFailedNetwork: "Cloud sync failed: Network error",
    cloudSyncFailedUnexpected: "Cloud sync failed: Unexpected error",
    highDemand: "Try again later, we are experiencing high demand.",
    failedConnectSyncServer: "Failed to connect to sync server.",
    failedGeneratePairingCode: "Failed to generate a unique pairing code. Try again.",
    cloudDataWiped: "Cloud data wiped successfully",
    failedClearCloudData: "Failed to clear cloud data.",
    networkErrorClearingCloudData: "Network error while clearing cloud data.",
    noLoadedDeckToShare: "No loaded deck found to share hierarchy.",
    deckExported: "Deck exported.",
    deckSaved: "Deck saved.",
    deckDeleted: "Deck deleted.",
    deckMoved: "Deck moved.",
    cannotMoveDeckInsideSelf: "Cannot move a deck inside its own subfolder.",
    nliEngine: "NLI Engine",
    semanticAi: "Semantic AI",
    engineError: "Engine Error",
    embeddingsStatus: "Embeddings",
    modelErrorStatus: "Model Error",
    autoSyncFailedSize: "Auto-sync failed: Data too large",
    shareCodeExpiredInvalid: "Share code expired or invalid.",
    rateLimitedTryAgain: "Rate limited, try again later.",
    items: "items",
    cannotSaveEmptyDeck: "Cannot save an empty deck.",
    deckSavedSuccessfully: "Deck saved successfully!",
    noDeckLoadedToOverwrite: "No deck loaded to overwrite.",
    deckUpdatedSuccessfully: "Deck updated successfully!",
    loadedDeckName: "Loaded deck:",
    decksDeleted: "Deck(s) deleted.",
    cannotMoveFolderInsideSelf: "Cannot move a folder into its own subfolder.",
    cardsUpdated: "Cards updated!",
    cardsDeleted: "Cards deleted!",
    successfullyImported: "Successfully imported",
    decksDeletedMsg: "Decks deleted.",
    decksMovedMsg: "Decks moved.",
    cloudDataWipedRemotely: "Cloud data was remotely wiped. Sync disabled.",
    deckAlreadyImported: "Deck already imported. Loaded from library!",
    confirmDeleteDeckTitle: "Delete Deck",
    confirmDeleteDeckMessage: "Are you sure you want to delete this deck?",
    delete: "Delete",
    cancel: "Cancel",
    confirmDeleteCardsTitle: "Delete Cards",
    confirmDeleteDecksTitle: "Delete Decks",
    importDeckTitle: "Import Shared Deck",
    importDeckMessage: "Would you like to append these shared cards to your current deck, or save as a new deck in 'My Decks'?",
    append: "Append",
    newDeck: "New Deck",
    confirmClearCloudDataTitle: "Clear Cloud Data",
    confirmClearCloudDataMessage: "Are you sure you want to completely wipe all your cloud sync data? This will permanently delete all codes associated with your dataset.",
    wipeData: "Wipe Data",
    jumpToPriorityCard: "Jump to Priority Question",
    jumpToPriorityCardDesc: "Deterministically jump to the algorithm's next priority card to easily start at the exact same spot across synced devices.",
    syncTokenHashLabel: "Token Hash:",
    footerCourse: "Created for the SEG3525 course",
    footerSubtitle: "Cognitive Flashcard Engine",
    syncActive: "SYNC ACTIVE",
    syncOffline: "SYNC LOCAL (OFFLINE)"
  }
};

// export const DEFAULT_DECK = [
//   {
//     id: 1,
//     question: "What is the primary function of mitochondria in a cell?",
//     correctAnswer: "It generates most of the chemical energy needed to power the cell's biochemical reactions.",
//     choices: [
//       "It stores genetic information.",
//       "It generates most of the chemical energy needed to power the cell's biochemical reactions.",
//       "It synthesizes proteins from amino acids.",
//       "It controls the movement of substances in and out of the cell.",
//     ],
//   },
//   {
//     id: 2,
//     question: "In object-oriented programming, what does 'polymorphism' refer to?",
//     correctAnswer: "The ability of different classes to be treated as instances of the same class through a common interface.",
//     choices: [
//       "The ability to hide the internal state of an object.",
//       "The ability of different classes to be treated as instances of the same class through a common interface.",
//       "The process of creating a new class from an existing class.",
//       "A variable that is shared among all instances of a class.",
//     ],
//   },
//   {
//     id: 3,
//     question: "Explain the concept of 'opportunity cost' in economics.",
//     correctAnswer: "The potential benefit that is lost when you choose one alternative over another.",
//     choices: [
//       "The direct financial cost of producing a good.",
//       "The reduction in value of an asset over time.",
//       "The potential benefit that is lost when you choose one alternative over another.",
//       "The total revenue minus total expenses.",
//     ],
//   },
//   {
//     id: 4,
//     question: "What does the Theory of General Relativity primarily describe?",
//     correctAnswer: "It describes gravity as a geometric property of space and time, or spacetime.",
//     choices: [
//       "The behavior of subatomic particles.",
//       "The relationship between electricity and magnetism.",
//       "It describes gravity as a geometric property of space and time, or spacetime.",
//       "The laws of thermodynamics.",
//     ],
//   },
// ];
//
export const DEFAULT_DECK =
  [
    {
      "id": 1,
      "question": "What is the main role of HTML in a web page?",
      "correctAnswer": "To define the structure and content of the page, such as headings, buttons, inputs, and lists",
      "choices": [
        "To define how elements visually appear, including colors, spacing, fonts, and animations",
        "To define the structure and content of the page, such as headings, buttons, inputs, and lists",
        "To execute interactive behavior when users click, type, submit forms, or move sliders",
        "To store temporary program variables that control the logic while the page is running"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 2,
      "question": "What does CSS mainly control in the HTML-CSS-JavaScript model?",
      "correctAnswer": "The presentation and visual appearance of elements, including layout, color, spacing, and motion",
      "choices": [
        "The logic that decides what happens after a button is clicked by the user",
        "The creation and modification of DOM nodes while the page is already running",
        "The presentation and visual appearance of elements, including layout, color, spacing, and motion",
        "The selection of HTML elements and the attachment of event listeners to those elements"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 3,
      "question": "What is the DOM?",
      "correctAnswer": "A live object tree created by the browser from the HTML document and accessible to JavaScript",
      "choices": [
        "A CSS styling rule that allows the browser to apply colors and spacing to selected elements",
        "A live object tree created by the browser from the HTML document and accessible to JavaScript",
        "A JavaScript variable that automatically stores the last event triggered by the user",
        "A special HTML tag used to connect external CSS and JavaScript files to a web page"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 4,
      "question": "Which JavaScript method is commonly used to select an element from the DOM?",
      "correctAnswer": "document.querySelector(), because it finds an element using a CSS-style selector",
      "choices": [
        "document.createStyle(), because it creates a style rule and attaches it to an element",
        "document.querySelector(), because it finds an element using a CSS-style selector",
        "document.listenToElement(), because it directly connects an event to an element",
        "document.openCSS(), because it loads the stylesheet before JavaScript is executed"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 5,
      "question": "In JavaScript, what does addEventListener(\"click\", handler) do?",
      "correctAnswer": "It attaches a function that runs when the selected element receives a click event",
      "choices": [
        "It permanently changes the original HTML file whenever the user clicks the selected element",
        "It creates a new CSS class and applies that class automatically after the first click",
        "It attaches a function that runs when the selected element receives a click event",
        "It reloads the web page and then executes the JavaScript file from the beginning"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 6,
      "question": "When a click event handler is bound to a button to alter a heading, what usually happens when that button is clicked?",
      "correctAnswer": "The heading text and heading color are changed dynamically using JavaScript and the DOM",
      "choices": [
        "The browser reloads the page and replaces the original heading with a newly loaded page title",
        "The heading text and heading color are changed dynamically using JavaScript and the DOM",
        "The CSS file is disconnected and all styles are removed from the current HTML document",
        "The button creates a new input field and moves the original heading into that input field"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 7,
      "question": "What does the textContent property change?",
      "correctAnswer": "The visible text stored inside an HTML element without replacing the whole element",
      "choices": [
        "The CSS selector that is used to find an element inside the DOM tree",
        "The event listener that is attached to a button, input, or other interactive element",
        "The visible text stored inside an HTML element without replacing the whole element",
        "The external file path used by the browser to load a stylesheet or JavaScript file"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 8,
      "question": "In sandboxed environments like CodePen, why are <link> and <script> tags usually optional?",
      "correctAnswer": "CodePen automatically connects the HTML, CSS, and JavaScript panels behind the scenes",
      "choices": [
        "CodePen does not support external CSS or JavaScript files when testing small examples",
        "CodePen automatically connects the HTML, CSS, and JavaScript panels behind the scenes",
        "CodePen requires all JavaScript code to be written directly inside the HTML panel",
        "CodePen only runs examples after the user manually adds all file-linking tags"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 9,
      "question": "In a simple counter example, why does the variable 'count' keep its value between click events?",
      "correctAnswer": "It is declared outside the event handlers, so both handlers can access the same variable",
      "choices": [
        "It is stored in the CSS file and then reused whenever the button is clicked again",
        "It is automatically saved inside the browser's local storage after the first click",
        "It is declared outside the event handlers, so both handlers can access the same variable",
        "It is written directly inside the HTML span and updated without using JavaScript memory"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 10,
      "question": "What is the typical programmatic purpose of a Reset button in a simple click counter interface?",
      "correctAnswer": "To set the JavaScript counter variable back to zero and update the displayed value",
      "choices": [
        "To remove the counter paragraph from the DOM and create a new counter element afterward",
        "To set the JavaScript counter variable back to zero and update the displayed value",
        "To change the page theme by toggling a class on the document body element",
        "To add one extra click to the counter and then immediately refresh the whole page"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 11,
      "question": "What does classList.toggle(\"dark\") do?",
      "correctAnswer": "It adds the class if it is missing and removes the class if it is already present",
      "choices": [
        "It always removes the class named dark, even when the class is not present on the element",
        "It creates a new HTML file called dark and links that file to the current document",
        "It adds the class if it is missing and removes the class if it is already present",
        "It permanently renames every class in the document so that all elements use dark"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 12,
      "question": "Why is toggling a CSS class often better than directly writing many individual inline styles in JavaScript?",
      "correctAnswer": "It keeps visual design in CSS while JavaScript only controls the active state",
      "choices": [
        "It prevents JavaScript from selecting DOM elements or responding to user events",
        "It keeps visual design in CSS while JavaScript only controls the active state",
        "It removes the need to write HTML structure because CSS creates the page automatically",
        "It forces the page to reload, which makes the visual change easier for the browser"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 13,
      "question": "In a standard class-toggled theme switcher example, where is the dark theme style actually defined?",
      "correctAnswer": "In the CSS rule for body.dark, which overrides the normal body colors",
      "choices": [
        "Inside the JavaScript click handler as several separate background and text color commands",
        "Inside the button label, because the button text controls which theme is currently active",
        "In the CSS rule for body.dark, which overrides the normal body colors",
        "In the browser's address bar, which stores the selected visual theme for the page"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 14,
      "question": "What is a CSS custom property?",
      "correctAnswer": "A CSS variable such as --hue that can be reused in CSS with the var() function",
      "choices": [
        "A JavaScript-only variable that can be accessed only inside an event listener function",
        "A CSS variable such as --hue that can be reused in CSS with the var() function",
        "An HTML attribute that is used only to describe images, links, and form elements",
        "A browser setting that automatically changes all colors on a web page at runtime"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 15,
      "question": "Which JavaScript method can dynamically update a CSS custom property?",
      "correctAnswer": "style.setProperty(), because it can assign a new value to a CSS custom property",
      "choices": [
        "classList.removeProperty(), because classes and custom properties are updated together",
        "document.writeVariable(), because CSS variables are written directly into the document",
        "style.setProperty(), because it can assign a new value to a CSS custom property",
        "addEventListener.setCSS(), because event listeners can directly change style variables"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 16,
      "question": "In a dynamically styled color picker dashboard, what does a slider input typically control via JavaScript?",
      "correctAnswer": "The hue value stored in a CSS custom property and used to recolor the swatch",
      "choices": [
        "The number of buttons shown on the page and the order in which they are displayed",
        "The hue value stored in a CSS custom property and used to recolor the swatch",
        "The font family applied to the whole document and all nested child elements",
        "The language setting of the HTML document and the direction of the text layout"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 17,
      "question": "What does hsl(var(--hue), 70%, 45%) mean in CSS?",
      "correctAnswer": "It computes a color using the CSS variable --hue as the hue component",
      "choices": [
        "It creates a JavaScript event listener that automatically responds to slider movement",
        "It loads an external stylesheet named hue and applies its color rules to the element",
        "It computes a color using the CSS variable --hue as the hue component",
        "It disables JavaScript updates so that the background color stays fixed permanently"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 18,
      "question": "Which DOM event fires every time a user types in, deletes from, or edits a text input?",
      "correctAnswer": "input, because it fires whenever the value of the input changes while typing",
      "choices": [
        "click, because the user must click inside the input before typing any text",
        "submit, because text input is processed only when a form is submitted",
        "input, because it fires whenever the value of the input changes while typing",
        "load, because the browser reloads the input field after every typed character"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 19,
      "question": "In a live form preview, what does input.value represent?",
      "correctAnswer": "The current text entered by the user inside the selected input field",
      "choices": [
        "The CSS class currently applied to the input element by the stylesheet",
        "The current text entered by the user inside the selected input field",
        "The browser's default visual size for displaying text input elements",
        "The file name of the HTML document that contains the input element"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 20,
      "question": "What does the expression 'text || \"stranger\"' evaluate to in a live dynamic greeting?",
      "correctAnswer": "It displays the typed text when available, or stranger when the text is empty",
      "choices": [
        "It always displays the typed text, even when the input field contains no characters",
        "It displays the typed text when available, or stranger when the text is empty",
        "It deletes the input field whenever the user clears all text from the form",
        "It converts the input field from a text box into a number-only form control"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 21,
      "question": "What is the exact behavioral outcome of calling classList.toggle(\"over\", text.length > MAX)?",
      "correctAnswer": "It adds or removes the class over depending on whether the condition is true",
      "choices": [
        "It always adds the class over, regardless of how many characters were typed",
        "It always removes the class over after the user types more than the maximum",
        "It adds or removes the class over depending on whether the condition is true",
        "It creates a new HTML element named over and inserts it after the input field"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 22,
      "question": "In a live input length-warning system, which module/rule defines the visual red border?",
      "correctAnswer": "The CSS rule for input.over, because CSS controls the visual border style",
      "choices": [
        "The HTML placeholder text, because it describes what the user should type",
        "The JavaScript constant MAX, because it stores the maximum number of characters",
        "The CSS rule for input.over, because CSS controls the visual border style",
        "The browser reload process, because the page updates after every keystroke"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 23,
      "question": "What does document.createElement(\"li\") do?",
      "correctAnswer": "It creates a new list item element in memory before it is inserted into the DOM",
      "choices": [
        "It selects the first existing list item already written inside the HTML document",
        "It creates a new list item element in memory before it is inserted into the DOM",
        "It deletes all list items currently displayed and replaces them with one empty item",
        "It changes the CSS style of every list item already present on the page"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 24,
      "question": "What does parentElement.appendChild(li) do in a dynamic task manager?",
      "correctAnswer": "It inserts the newly created list item as a child of the selected list element",
      "choices": [
        "It removes the entire unordered list from the document and clears all tasks",
        "It copies the text input field into the stylesheet as a new CSS selector",
        "It inserts the newly created list item as a child of the selected list element",
        "It resets all event listeners so that new list items can receive click events"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 25,
      "question": "Why does a dynamic task list typically bind a single click listener to the parent <ul> rather than individual <li> items?",
      "correctAnswer": "Because event delegation allows the parent list to handle clicks on current and future items",
      "choices": [
        "Because individual list items cannot receive click events after they are created dynamically",
        "Because event delegation allows the parent list to handle clicks on current and future items",
        "Because CSS requires one click listener on a parent before child styles can be applied",
        "Because JavaScript cannot create a separate function for each list item in a document"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 26,
      "question": "In event delegation, what does e.target usually refer to?",
      "correctAnswer": "The actual element that triggered the event, such as the clicked list item",
      "choices": [
        "The CSS file that provides the visual style for the clicked element",
        "The JavaScript function name that was used to register the listener",
        "The actual element that triggered the event, such as the clicked list item",
        "The first HTML element found by document.querySelector() on the page"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 27,
      "question": "What is the primary role of a CSS transition?",
      "correctAnswer": "To animate a change in a CSS property smoothly over a specified duration",
      "choices": [
        "To create new HTML elements dynamically while the page is running",
        "To animate a change in a CSS property smoothly over a specified duration",
        "To prevent JavaScript from modifying text, classes, or inline style values",
        "To count how many times the user has interacted with an element"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 28,
      "question": "In a robust dynamic progress bar example, what role does JavaScript execute vs CSS?",
      "correctAnswer": "JavaScript updates the width of the progress bar, while CSS animates the change smoothly",
      "choices": [
        "The height of the full page body and the position of the button below it",
        "The text inside the button so that it changes from Load to Loaded",
        "JavaScript updates the width of the progress bar, while CSS animates the change smoothly",
        "The number of CSS files loaded by the browser before rendering the page"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 29,
      "question": "In an interactive stateful element (like a card layout), what changes when clicked?",
      "correctAnswer": "A boolean state changes, a class is toggled, and the label text is updated",
      "choices": [
        "The browser opens a new HTML document and replaces the current card page",
        "A boolean state changes, a class is toggled, and the label text is updated",
        "The CSS variable is removed from the root element and cannot be reused later",
        "The slider is removed from the DOM and the card color becomes fixed forever"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 30,
      "question": "Which statement best summarizes the web standard model's main design principle?",
      "correctAnswer": "HTML defines structure, CSS defines presentation, and JavaScript defines behavior",
      "choices": [
        "JavaScript should contain all structure, style, and behavior so that HTML and CSS stay minimal",
        "CSS should directly handle all user input events without using JavaScript event listeners",
        "HTML defines structure, CSS defines presentation, and JavaScript defines behavior",
        "HTML should be avoided when building interactive pages because the DOM replaces it completely"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 31,
      "question": "When a client sends an HTTP/1.1 request to a server, which protocol at the Transport Layer is responsible for ensuring the message is broken into segments, delivered reliably, and reassembled in the correct order?",
      "correctAnswer": "Transmission Control Protocol (TCP)",
      "choices": [
        "Internet Protocol (IP)",
        "Transmission Control Protocol (TCP)",
        "User Datagram Protocol (UDP)",
        "HyperText Transfer Protocol (HTTP)"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 32,
      "question": "In modern web architecture, the HTTP/3 protocol introduced a major shift in transport architecture. Which underlying technology does HTTP/3 use to provide faster handshakes and better resilience to packet loss compared to its predecessors?",
      "correctAnswer": "QUIC over UDP",
      "choices": [
        "Binary Framing over TCP",
        "Header Compression (HPACK)",
        "QUIC over UDP",
        "Layer 2 Tunneling Protocol"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 33,
      "question": "If a web developer wants to ensure that a browser only re-downloads an image if the content on the server has actually changed, which HTTP response header provides a unique \"hash\" or identifier for that specific version of the resource?",
      "correctAnswer": "ETag",
      "choices": [
        "Last-Modified",
        "Cache-Control",
        "ETag",
        "Expires"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 34,
      "question": "A Uniform Resource Locator (URL) consists of several parts. Which specific component is used by the browser to jump to a specific section within a document but is strictly not sent to the web server during the HTTP request?",
      "correctAnswer": "Fragment identifier (#)",
      "choices": [
        "Query string",
        "Resource path",
        "Fragment identifier (#)",
        "Authority (Host)"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 35,
      "question": "According to the HTTP standard, status codes are divided into classes. If a client receives a 307 Temporary Redirect code, what is the expected behavior of the user agent?",
      "correctAnswer": "Repeat the request to the new URI provided in the Location header.",
      "choices": [
        "Treat the resource as permanently moved and update all bookmarks.",
        "Display a \"Not Found\" error page to the user.",
        "Repeat the request to the new URI provided in the Location header.",
        "Prompt the user for a username and password to access the resource."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 36,
      "question": "Web servers must distinguish between different types of requests. What is the fundamental difference in how a server handles a request for a static \"file\" versus a request for a \"program\" (such as a Java Servlet)?",
      "correctAnswer": "Files are sent as-is, while programs are executed to generate a dynamic body.",
      "choices": [
        "Files are sent using ASCII while programs are sent using Binary.",
        "Files are handled by the IP layer while programs are handled by TCP.",
        "Files are sent as-is, while programs are executed to generate a dynamic body.",
        "Files require port 80 while programs require port 443."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 37,
      "question": "In modern web architecture, Progressive Web Apps (PWAs) aim to provide a native-like experience. Which component runs in the background to intercept network requests and enable offline functionality?",
      "correctAnswer": "Service Worker",
      "choices": [
        "WebAssembly (Wasm)",
        "JSON Web Token (JWT)",
        "Service Worker",
        "Virtual DOM"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 38,
      "question": "When configuring a Tomcat web server, the \"Coyote\" component is used to manage external communication. Which of the following is a typical task performed within this configuration?",
      "correctAnswer": "Setting the maximum number of simultaneous threads for connections.",
      "choices": [
        "Setting the maximum number of simultaneous threads for connections.",
        "Mapping specific URIs to internal folder structures.",
        "Defining password-protected areas of the website.",
        "Enabling logging for specific virtual hosts."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 39,
      "question": "The Domain Name Service (DNS) is critical for mapping human-readable names to IP addresses. Why does DNS primarily use the User Datagram Protocol (UDP) on port 53 rather than TCP?",
      "correctAnswer": "UDP is faster for short, single-packet name-to-IP queries.",
      "choices": [
        "UDP provides higher security and data encryption.",
        "UDP is faster for short, single-packet name-to-IP queries.",
        "UDP guarantees that every request will be eventually delivered.",
        "TCP is incapable of handling port 53 communications."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 40,
      "question": "Web standards and protocols have evolved. What is the current browser/industry stance regarding plain HTTP (unencrypted) websites?",
      "correctAnswer": "Browsers now flag them as \"Not secure\" to warn the user.",
      "choices": [
        "They are recommended for faster performance on mobile devices.",
        "They are still the standard for all non-banking information.",
        "Browsers now flag them as \"Not secure\" to warn the user.",
        "They are no longer supported by any modern DNS providers."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 41,
      "question": "The HTTP \"HEAD\" method is often used by caches and crawlers. What is the defining characteristic of a response to a HEAD request?",
      "correctAnswer": "It returns the same headers as a GET request but with no message body.",
      "choices": [
        "It returns only the body of the resource to save header space.",
        "It returns a 404 error if the resource is too large to process.",
        "It returns the same headers as a GET request but with no message body.",
        "It forces the server to delete the resource after the headers are sent."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 42,
      "question": "Modern front-end development often uses \"Meta-frameworks\" like Next.js or Nuxt. What is a primary reason for using these instead of a basic library like React or Vue?",
      "correctAnswer": "They provide built-in Server-Side Rendering (SSR) and routing.",
      "choices": [
        "They are the only way to write valid HTML5 code.",
        "They provide built-in Server-Side Rendering (SSR) and routing.",
        "They allow the browser to run without a TCP/IP connection.",
        "They replace the need for JavaScript in the browser."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 43,
      "question": "Character sets are essential for displaying global content. Which encoding is currently the \"Web default\" because it is variable-length and backward-compatible with ASCII?",
      "correctAnswer": "UTF-8",
      "choices": [
        "ISO-8859-1 (Latin-1)",
        "UTF-16",
        "US-ASCII (7-bit)",
        "UTF-8"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 44,
      "question": "Virtual Hosting allows a single physical server with one IP address to host hundreds of different websites. How does the server know which specific website to serve when a request arrives?",
      "correctAnswer": "By reading the \"Host\" header provided in the HTTP request.",
      "choices": [
        "By checking the source IP address of the client.",
        "By assigning a different UDP port to every website.",
        "By reading the \"Host\" header provided in the HTTP request.",
        "By analyzing the \"Accept-Language\" header."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 45,
      "question": "APIs (Application Programming Interfaces) have shifted from simple form-posts to complex data exchanges. What is a key advantage of GraphQL compared to traditional REST APIs?",
      "correctAnswer": "It allows the client to request only the specific fields needed.",
      "choices": [
        "It requires no server-side processing to function.",
        "It is limited to binary data for maximum security.",
        "It allows the client to request only the specific fields needed.",
        "It only works over the older HTTP/1.0 protocol."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 46,
      "question": "For real-time applications like live sports updates or chat systems, which technology provides a persistent, bidirectional connection between the client and server?",
      "correctAnswer": "WebSockets",
      "choices": [
        "RESTful GET requests",
        "WebSockets",
        "Server-Side Rendering (SSR)",
        "Static Site Generation (SSG)"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 47,
      "question": "In the structure of an HTTP/1.1 Request Message, which header is mandatory to include for the request to be considered valid?",
      "correctAnswer": "Host",
      "choices": [
        "User-Agent",
        "Host",
        "Referer",
        "Content-Length"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 48,
      "question": "In TLS 1.3, which is highlighted for its performance benefits, what does \"1-RTT\" or \"0-RTT\" refer to in the context of secure connections?",
      "correctAnswer": "The number of round-trips required to complete a handshake.",
      "choices": [
        "The number of physical cables required for the connection.",
        "The total number of errors allowed before a connection drops.",
        "The number of round-trips required to complete a handshake.",
        "The version of the IP protocol being used (IPv1 or IPv0)."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 49,
      "question": "Modern \"DevOps\" practices include \"Infrastructure as Code\" (IaC). What is the primary goal of using IaC tools like Terraform in web development?",
      "correctAnswer": "To manage and deploy servers and networks using configuration files.",
      "choices": [
        "To automatically write the CSS for a website.",
        "To replace the need for human developers in the build process.",
        "To manage and deploy servers and networks using configuration files.",
        "To encrypt the message body of every HTTP request."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 50,
      "question": "Which modern browser capability allows for native-speed execution of code written in languages like C++ or Rust, enabling complex apps like Photoshop to run in the web browser?",
      "correctAnswer": "WebAssembly (Wasm)",
      "choices": [
        "JavaScript ES2024",
        "WebAssembly (Wasm)",
        "CSS Flexbox",
        "HTML5 Semantic Tags"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 51,
      "question": "What is the main purpose of HTML markup?",
      "correctAnswer": "To describe document structure and meaning.",
      "choices": [
        "To make every web page look the same.",
        "To describe document structure and meaning.",
        "To store private data inside the page.",
        "To replace browsers with static files."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 52,
      "question": "What does the browser mainly do with HTML markup?",
      "correctAnswer": "It renders the structured document.",
      "choices": [
        "It permanently changes the source file.",
        "It converts all elements into images.",
        "It renders the structured document.",
        "It removes all attributes before display."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 53,
      "question": "In HTML, a document can be understood as what kind of structure?",
      "correctAnswer": "A tree of elements and text.",
      "choices": [
        "A flat list of isolated commands.",
        "A tree of elements and text.",
        "A database with rows only.",
        "A collection of CSS declarations."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 54,
      "question": "Why did XHTML introduce stricter authoring rules than normal HTML?",
      "correctAnswer": "To make parsing more consistent.",
      "choices": [
        "To remove support for web images.",
        "To make CSS unnecessary.",
        "To make parsing more consistent.",
        "To force all pages to use frames."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 55,
      "question": "Which example shows correct XHTML-style nesting?",
      "correctAnswer": "<p>Hello <strong>class</strong></p>",
      "choices": [
        "<p>Hello <strong>class</p></strong>",
        "<p>Hello <strong>class</strong></p>",
        "<p><strong>Hello</p> class</strong>",
        "<strong><p>Hello</strong></p>"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 56,
      "question": "What is the role of a document type declaration (DOCTYPE)?",
      "correctAnswer": "It tells validators which grammar to use.",
      "choices": [
        "It adds a visible title to the page.",
        "It defines the visual color theme.",
        "It tells validators which grammar to use.",
        "It prevents links from being used."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 57,
      "question": "In normal HTML rendering, what usually happens to extra white spaces?",
      "correctAnswer": "They are collapsed into one space.",
      "choices": [
        "They are always preserved exactly.",
        "They are collapsed into one space.",
        "They automatically create tables.",
        "They make the document invalid."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 58,
      "question": "Which element is used when spacing must be preserved exactly as typed?",
      "correctAnswer": "<pre>",
      "choices": [
        "<span>",
        "<pre>",
        "<strong>",
        "<title>"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 59,
      "question": "Why are character entities such as &amp;lt; useful?",
      "correctAnswer": "To display special characters safely.",
      "choices": [
        "They create hidden browser comments.",
        "They validate all links automatically.",
        "To display special characters safely.",
        "They replace the need for attributes."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 60,
      "question": "What does the href attribute usually specify in an anchor (<a>) element?",
      "correctAnswer": "The destination URL of the link.",
      "choices": [
        "The font size of the link.",
        "The destination URL of the link.",
        "The heading level of the page.",
        "The table header of a column."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 61,
      "question": "Which element is best for marking important text semantically?",
      "correctAnswer": "<strong>",
      "choices": [
        "<br>",
        "<strong>",
        "<table>",
        "<frameset>"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 62,
      "question": "What is a good practice when writing link text?",
      "correctAnswer": "Name the destination clearly.",
      "choices": [
        "Use \"click here\" for all links.",
        "Leave the anchor text empty.",
        "Name the destination clearly.",
        "Use numbers as link labels."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 63,
      "question": "What should the alt attribute of an image provide?",
      "correctAnswer": "Alternative text for the image.",
      "choices": [
        "A CSS class for the image.",
        "Alternative text for the image.",
        "The exact image file size.",
        "A password for loading images."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 64,
      "question": "Why should markup comments not contain secrets?",
      "correctAnswer": "Comments are visible in source.",
      "choices": [
        "Comments are shown as headings.",
        "Comments are visible in source.",
        "Comments become form fields.",
        "Comments submit data automatically."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 65,
      "question": "What does the \"last opened, first closed\" idea describe in markup authoring?",
      "correctAnswer": "Correct nesting of tags.",
      "choices": [
        "Browser color selection.",
        "Correct nesting of tags.",
        "HTTP method selection.",
        "Image dimension calculation."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 66,
      "question": "Which list type is appropriate when the order of items matters?",
      "correctAnswer": "<ol>",
      "choices": [
        "<ul>",
        "<ol>",
        "<dl>",
        "<table>"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 67,
      "question": "What are HTML tables mainly intended for?",
      "correctAnswer": "Showing row-column relationships.",
      "choices": [
        "Creating all page layouts.",
        "Showing row-column relationships.",
        "Replacing forms and links.",
        "Defining browser settings."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 68,
      "question": "In a form, what is the purpose of the name attribute on an input?",
      "correctAnswer": "It names submitted form data.",
      "choices": [
        "It defines the browser title.",
        "It names submitted form data.",
        "It changes the document type.",
        "It makes the input invisible."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 69,
      "question": "What is a key difference between GET and POST in forms?",
      "correctAnswer": "GET sends data in the URL.",
      "choices": [
        "GET encrypts data automatically.",
        "POST works only with images.",
        "GET sends data in the URL.",
        "GET removes the need for servers."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 70,
      "question": "What is the durable, primary structural lesson of Chapter 2 (XHTML 1.0)?",
      "correctAnswer": "Disciplined structure matters.",
      "choices": [
        "XHTML should replace all HTML.",
        "Frames should organize all pages.",
        "Disciplined structure matters.",
        "CSS should be inside every tag."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 71,
      "question": "Of the three CSS integration methods, which has the highest specificity contribution?",
      "correctAnswer": "Inline style attribute applied directly to the element",
      "choices": [
        "External stylesheet linked from the HTML head section",
        "Internal styles placed in a style block in the head",
        "Inline style attribute applied directly to the element",
        "Browser user-agent default rules for the element type"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 72,
      "question": "How is an external CSS file linked to an HTML document?",
      "correctAnswer": "<link rel=\"stylesheet\" href=\"style.css\"> in the head",
      "choices": [
        "<style src=\"style.css\"></style> inside the body",
        "<link rel=\"stylesheet\" href=\"style.css\"> in the head",
        "<import file=\"style.css\" /> at the top of the file",
        "<css href=\"style.css\" type=\"text/css\"> in the head"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 73,
      "question": "What does the selector p { color: gray; } match?",
      "correctAnswer": "Every <p> element in the entire document",
      "choices": [
        "Every <p> element in the entire document",
        "Only the first <p> element on the page",
        "Only <p> elements that carry a class or id",
        "Only <p> elements nested directly inside body"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 74,
      "question": "What prefix is used to select an element by its class attribute in CSS?",
      "correctAnswer": "The dot symbol . before the name",
      "choices": [
        "The hash symbol # before the name",
        "The colon symbol : before the name",
        "The at-sign symbol @ before the name",
        "The dot symbol . before the name"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 75,
      "question": "Which statement about ID selectors is correct?",
      "correctAnswer": "An ID should identify exactly one unique element per page",
      "choices": [
        "An ID may be reused for any number of sibling elements",
        "An ID has lower specificity than any class selector",
        "An ID should identify exactly one unique element per page",
        "An ID can only be used to style form input elements"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 76,
      "question": "When two rules have the same specificity, how does the cascade decide the winner?",
      "correctAnswer": "The rule that appears later in the stylesheet wins",
      "choices": [
        "The rule that appears later in the stylesheet wins",
        "The rule that appears earlier in the stylesheet wins",
        "The browser averages the conflicting property values",
        "The browser picks one rule at random per page load"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 77,
      "question": "What is the correct order of the four cascade criteria?",
      "correctAnswer": "origin, importance, specificity, source order",
      "choices": [
        "origin, source order, specificity, importance",
        "specificity, origin, importance, source order",
        "origin, importance, specificity, source order",
        "importance, source order, specificity, origin"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 78,
      "question": "In the specificity tuple (a, b, c, d), what does position a count?",
      "correctAnswer": "Inline styles set via the style attribute",
      "choices": [
        "Inline styles set via the style attribute",
        "IDs introduced in the stylesheet with #",
        "Classes, attributes, and pseudo-classes together",
        "Element types and pseudo-elements together"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 79,
      "question": "What is the specificity of the selector: #nav .item a?",
      "correctAnswer": "(0, 1, 1, 1)",
      "choices": [
        "(0, 0, 1, 2)",
        "(0, 1, 1, 1)",
        "(0, 1, 2, 0)",
        "(1, 1, 0, 1)"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 80,
      "question": "How are two specificity tuples compared to pick a winner?",
      "correctAnswer": "By comparing positions from left to right",
      "choices": [
        "By computing the sum of all four positions",
        "By comparing positions from right to left",
        "By taking the average of the four positions",
        "By comparing positions from left to right"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 81,
      "question": "What is the effect of adding !important to a CSS declaration?",
      "correctAnswer": "It lifts the declaration into a higher cascade bucket",
      "choices": [
        "It adds 1 to position a of the specificity tuple",
        "It doubles the specificity score for that rule",
        "It lifts the declaration into a higher cascade bucket",
        "It triggers the rule before any selector matches"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 82,
      "question": "Which CSS property is naturally inherited by descendants?",
      "correctAnswer": "The text color from the parent element",
      "choices": [
        "The background color from the parent element",
        "The text color from the parent element",
        "The border width from the parent element",
        "The element width from the parent element"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 83,
      "question": "Which property does NOT inherit by default from parent to children?",
      "correctAnswer": "The background-color property is not inherited",
      "choices": [
        "The background-color property is not inherited",
        "The text color property is not inherited",
        "The font-family property is not inherited",
        "The line-height property is not inherited"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 84,
      "question": "What does text-align: center do?",
      "correctAnswer": "It centers inline content within the element's box",
      "choices": [
        "It centers a block element inside its parent container",
        "It vertically centers text within the element's height",
        "It centers an image relative to surrounding text",
        "It centers inline content within the element's box"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 85,
      "question": "Which line correctly describes the color and background-color properties?",
      "correctAnswer": "color sets the text color; background-color sets the fill area",
      "choices": [
        "color sets the background; background-color sets the text color",
        "color and background-color name the same underlying property",
        "color affects borders only; background-color affects the fill",
        "color sets the text color; background-color sets the fill area"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 86,
      "question": "How is the px unit best described in CSS?",
      "correctAnswer": "An absolute unit with the same size regardless of context",
      "choices": [
        "Relative to the parent element's font-size at compute time",
        "An absolute unit with the same size regardless of context",
        "Relative to the viewport width at the current zoom level",
        "Relative to the html root font-size for accessibility"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 87,
      "question": "How do em and rem units differ?",
      "correctAnswer": "em is relative to parent font-size; rem is relative to html",
      "choices": [
        "em is absolute; rem is relative to the viewport height",
        "em and rem are exact aliases kept for legacy reasons",
        "em is relative to parent font-size; rem is relative to html",
        "em is relative to html; rem is relative to the parent element"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 88,
      "question": "What does 1vh represent in CSS?",
      "correctAnswer": "1% of the browser viewport height",
      "choices": [
        "1% of the browser viewport height",
        "1% of the parent element's own height",
        "1 pixel multiplied by screen density",
        "1% of the document body height"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 89,
      "question": "Which calc() expression is syntactically valid?",
      "correctAnswer": "calc(100% - 20px) with spaces around the minus",
      "choices": [
        "calc(100%-20px) with no spaces between operands",
        "calc(100% -20px) with a space before but not after",
        "calc(100% - 20px) with spaces around the minus",
        "calc(100% -- 20px) with a doubled minus operator"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 90,
      "question": "In the CSS box model, what is the order from inside to outside?",
      "correctAnswer": "content, padding, border, margin",
      "choices": [
        "margin, border, padding, content",
        "padding, content, margin, border",
        "content, margin, padding, border",
        "content, padding, border, margin"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 91,
      "question": "Without box-sizing: border-box configured, what does width: 300px set?",
      "correctAnswer": "The content area only; padding and border add on top",
      "choices": [
        "The total visible width including padding and border",
        "The content area only; padding and border add on top",
        "The content plus padding only; border is added on top",
        "The outer dimension including the surrounding margin"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 92,
      "question": "What is the physical structural effect of box-sizing: border-box?",
      "correctAnswer": "The width includes content, padding, and border together",
      "choices": [
        "The border is removed from the visible rendering of the box",
        "Padding and border are excluded entirely from the layout",
        "The element width refers to the parent container instead",
        "The width includes content, padding, and border together"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 93,
      "question": "How is margin defined in the CSS box model?",
      "correctAnswer": "Transparent space placed outside the border from neighbours",
      "choices": [
        "Transparent space placed between content and the border",
        "Coloured space drawn with the element's background color",
        "Coloured space placed inside the border on each side",
        "Transparent space placed outside the border from neighbours"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 94,
      "question": "Which describes the :hover pseudo-class?",
      "correctAnswer": "A state that matches while the pointer is over the element",
      "choices": [
        "A virtual child element generated above the matched element",
        "A state that matches while the pointer is over the element",
        "A state that matches once the user has clicked the element",
        "A media query that only activates on devices with a mouse"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 95,
      "question": "What does the child combinator selector A > B match?",
      "correctAnswer": "B elements that are direct children of an A element",
      "choices": [
        "B elements that are direct children of an A element",
        "B elements nested anywhere inside an A element",
        "B elements that are the next sibling of an A element",
        "B elements appearing before A in the document order"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 96,
      "question": "What does the descendant combinator selector A B select?",
      "correctAnswer": "B elements nested anywhere inside A, at any depth",
      "choices": [
        "B elements that are direct children of A only",
        "B elements that are immediately preceded by A",
        "B elements nested anywhere inside A, at any depth",
        "A elements that contain at least one B descendant"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 97,
      "question": "What does the group selector h1, h2, p do?",
      "correctAnswer": "Applies the same declarations to h1, h2, and p elements",
      "choices": [
        "Applies the same declarations to h1, h2, and p elements",
        "Selects only h1 elements followed by h2 followed by p",
        "Selects the first occurrence of any of h1, h2, or p",
        "Applies the rule only when h1, h2, and p are siblings"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 98,
      "question": "What does the universal selector * match?",
      "correctAnswer": "Every element in the document, regardless of type",
      "choices": [
        "Elements without any class, id, or attribute selectors",
        "Elements directly inside the body of the document",
        "Every element in the document, regardless of type",
        "The root element of the page and its immediate children"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 99,
      "question": "Which elements does a[href^=\"https\"] match?",
      "correctAnswer": "Anchors whose href starts with \"https\"",
      "choices": [
        "Anchors whose href ends with \"https\"",
        "Anchors whose href contains \"https\" anywhere",
        "Anchors whose href exactly equals \"https\"",
        "Anchors whose href starts with \"https\""
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 100,
      "question": "What does the adjacent sibling selector h2 + p match?",
      "correctAnswer": "The first p immediately after each h2 at the same level",
      "choices": [
        "Every p that appears anywhere after an h2 sibling",
        "Every p that comes before an h2 in the same parent",
        "Every p that is nested directly inside an h2 element",
        "The first p immediately after each h2 at the same level"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 101,
      "question": "What does the selector li:nth-child(odd) target?",
      "correctAnswer": "li elements at odd positions (1st, 3rd, 5th) among siblings",
      "choices": [
        "li elements at odd positions (1st, 3rd, 5th) among siblings",
        "li elements whose class name contains the word \"odd\"",
        "li elements where the total sibling count is an odd number",
        "li elements that are children of an element with id \"odd\""
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 102,
      "question": "What does the selector :not(.active) match?",
      "correctAnswer": "Elements that do not carry the active class on them",
      "choices": [
        "Elements that come right after a .active element",
        "Elements that do not carry the active class on them",
        "Elements placed before .active in document order",
        "Elements that remove .active from their class list"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 103,
      "question": "Which statement about the pseudo-element ::before is correct?",
      "correctAnswer": "It generates a virtual child at the start of the element",
      "choices": [
        "It selects the element placed just before the matched one",
        "It triggers a rule only before the page finishes loading",
        "It generates a virtual child at the start of the element",
        "It inserts a real sibling tag before the matched element"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 104,
      "question": "How are CSS custom properties (variables) declared and read?",
      "correctAnswer": "Declared with the -- prefix; read with the var(--name) function",
      "choices": [
        "Declared with var(--name); read with the -- prefix in values",
        "Declared with the -- prefix; read with the var(--name) function",
        "Declared inside @media; read only within that same query",
        "Declared with the @var rule; read with the @ symbol in values"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 105,
      "question": "Which is an accessibility best practice for focused elements?",
      "correctAnswer": "Preserve a visible focus indicator so keyboard users see it",
      "choices": [
        "Set outline: none everywhere to keep the design clean",
        "Use a hover effect instead, since mouse users dominate",
        "Replace the focus outline with cursor: pointer for clarity",
        "Preserve a visible focus indicator so keyboard users see it"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 106,
      "question": "What is the default value of the position property for all HTML elements in standard CSS?",
      "correctAnswer": "static",
      "choices": [
        "relative",
        "absolute",
        "static",
        "fixed"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 107,
      "question": "When applying 'position: relative' to an element, how does the browser calculate its final rendered location?",
      "correctAnswer": "It shifts the element from its normal place without moving its neighbors.",
      "choices": [
        "It positions the element relative to its nearest positioned ancestor.",
        "It positions the element relative to the initial containing viewport.",
        "It shifts the element from its normal place without moving its neighbors.",
        "It moves the element directly to the top-left corner of the page."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 108,
      "question": "Which CSS positioning property removes an element entirely from the normal document flow and positions it relative to its nearest ancestor that has a position value other than 'static'?",
      "correctAnswer": "position: absolute",
      "choices": [
        "position: absolute",
        "position: relative",
        "position: static",
        "position: sticky"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 109,
      "question": "If an element inside a webpage layout is given the property 'position: absolute', what happens to the space it originally occupied in the normal flow?",
      "correctAnswer": "The element is removed from the flow and neighbor elements reflow into its space.",
      "choices": [
        "The original space remains reserved and neighbor elements stay in place.",
        "The original space expands dynamically to fill the container's width.",
        "The element is removed from the flow and neighbor elements reflow into its space.",
        "The original space is duplicated directly below the parent element."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 110,
      "question": "Which CSS positioning property should be used to anchor a navigation header to the top of the browser viewport so that it remains visible in the exact same spot while the user scrolls down the page?",
      "correctAnswer": "position: fixed",
      "choices": [
        "position: relative",
        "position: absolute",
        "position: sticky",
        "position: fixed"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 111,
      "question": "How does an element configured with 'position: sticky' behave before it reaches the specified scroll threshold within its parent container?",
      "correctAnswer": "It behaves exactly like a relative element.",
      "choices": [
        "It behaves exactly like a fixed element.",
        "It behaves exactly like a relative element.",
        "It behaves exactly like an absolute element.",
        "It remains completely hidden from the user view."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 112,
      "question": "Which of the following sets of values represents all the valid core directions accepted by the flex-direction property?",
      "correctAnswer": "row, row-reverse, column, column-reverse",
      "choices": [
        "row, row-reverse, column, column-reverse",
        "horizontal, vertical, standard, reverse",
        "left, right, top, bottom",
        "start, end, center, stretch"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 113,
      "question": "What is the default layout direction of the main axis when a container is initialized using the 'display: flex' property?",
      "correctAnswer": "row",
      "choices": [
        "column",
        "row",
        "grid",
        "block"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 114,
      "question": "Which CSS Flexbox property is explicitly used by developers to distribute alignment and extra space among flex items along the horizontal main axis of a row container?",
      "correctAnswer": "justify-content",
      "choices": [
        "align-items",
        "align-content",
        "justify-content",
        "flex-wrap"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 115,
      "question": "When styling a flex container, what specific distribution effect is achieved by applying the utility value 'justify-content: space-between'?",
      "correctAnswer": "It distributes leftover space equally between items, leaving none at the edges.",
      "choices": [
        "It adds an equal amount of padding around the outer edges of all items.",
        "It distributes leftover space equally between items, leaving none at the edges.",
        "It centers all items together and adds a fixed margin between them.",
        "It forces items to stretch vertically to fill the entire cross axis."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 116,
      "question": "Which CSS Flexbox property is designed to control how individual layout items are aligned and positioned along the perpendicular cross axis inside a container?",
      "correctAnswer": "align-items",
      "choices": [
        "justify-content",
        "flex-direction",
        "flex-grow",
        "align-items"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 117,
      "question": "If a developer sets up a flex row container that is 200 pixels tall but does not explicitly specify a value for the 'align-items' property, how will child items of varying heights behave?",
      "correctAnswer": "They will stretch vertically to fill the cross-axis size.",
      "choices": [
        "They will align to the vertical center of the container.",
        "They will align to the top edge of the container.",
        "They will stretch vertically to fill the cross-axis size.",
        "They will align their text baselines automatically."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 118,
      "question": "When the property 'flex-direction: column' is added to a flex container, how are the layout responsibilities of the alignment properties altered?",
      "correctAnswer": "justify-content controls vertical placement, and align-items controls horizontal placement.",
      "choices": [
        "justify-content controls vertical placement, and align-items controls horizontal placement.",
        "justify-content controls horizontal placement, and align-items controls vertical placement.",
        "Both justify-content and align-items control horizontal alignment simultaneously.",
        "Both justify-content and align-items control vertical alignment simultaneously."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 119,
      "question": "What is the default layout behavior of a flex container when the combined width of its child items exceeds the total available width of the main axis line?",
      "correctAnswer": "The items shrink or overflow on a single continuous line.",
      "choices": [
        "The container wraps items onto multiple new lines automatically.",
        "The container clips and hides the overflowing items implicitly.",
        "The items shrink or overflow on a single continuous line.",
        "The items convert into a two-dimensional grid format."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 120,
      "question": "In modern CSS development, the shorthand property declaration 'flex: 1' is equivalent to which combination of individual flex properties?",
      "correctAnswer": "flex-grow: 1; flex-shrink: 1; flex-basis: 0;",
      "choices": [
        "flex-direction: row; flex-wrap: wrap; gap: 1px;",
        "flex-grow: 1; flex-shrink: 1; flex-basis: 0;",
        "grid-template-columns: repeat(1, 1fr);",
        "position: relative; top: 0; left: 0;"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 121,
      "question": "If a child element inside a horizontal flex row retains the default factor of 'flex-grow: 0', how does it respond to extra unallocated space along the main axis line?",
      "correctAnswer": "The item remains at its natural size based on its explicit width or content.",
      "choices": [
        "The item shrinks proportionally to make room for its surrounding neighbors.",
        "The item expands dynamically to capture all remaining leftover space.",
        "The item remains at its natural size based on its explicit width or content.",
        "The item is compressed and becomes completely invisible on the layout."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 122,
      "question": "Which modern native CSS layout system is explicitly engineered to handle complex web interfaces requiring two-dimensional alignment across both simultaneous rows and columns?",
      "correctAnswer": "Grid Layout System",
      "choices": [
        "Absolute Positioning Layout",
        "Flexbox Layout System",
        "Grid Layout System",
        "Block Flow Layout Model"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 123,
      "question": "When setting up a multi-column track definition using CSS Grid, what does the fractional unit measure '1fr' explicitly represent to the browser?",
      "correctAnswer": "One fraction of the remaining free space left after fixed tracks are allocated.",
      "choices": [
        "One fraction of the remaining free space left after fixed tracks are allocated.",
        "One physical pixel calculated relative to the mobile hardware viewport screen.",
        "One percent of the parent container absolute maximum total computed width.",
        "One typography unit measured relative to the root element default font size."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 124,
      "question": "When building interfaces with Flexbox or Grid layouts, where does the shorthand layout property 'gap' insert spacing?",
      "correctAnswer": "Exclusively between the adjacent layout tracks or internal items.",
      "choices": [
        "On the outer boundaries of the container element only.",
        "Around all four individual sides of every single child element.",
        "Exclusively between the adjacent layout tracks or internal items.",
        "Between the outer border edge and the internal content bounding box."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 125,
      "question": "If a specific child item inside a CSS Grid container is assigned the property rule 'grid-column: span 2', what layout behavior will the browser enforce?",
      "correctAnswer": "The designated grid item will stretch to occupy two column tracks.",
      "choices": [
        "The grid container will create two additional column tracks globally.",
        "The designated grid item will stretch to occupy two column tracks.",
        "The designated grid item will copy its content down into two rows.",
        "The cell will split its internal text into two isolated side panels."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 126,
      "question": "Which explicit CSS Grid property allows developers to map out an entire structural page design (containing a header, sidebar, main area, and footer) visually using plain English names?",
      "correctAnswer": "grid-template-areas",
      "choices": [
        "grid-template-columns",
        "repeat(auto-fit, minmax())",
        "grid-template-areas",
        "media query breakpoints"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 127,
      "question": "What structural layout objective is achieved by applying the advanced CSS Grid property rule 'grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))'?",
      "correctAnswer": "It builds a responsive multi-column grid that adapts without media queries.",
      "choices": [
        "It forces every column track to remain frozen at a width of 180 pixels.",
        "It mandates a media query breakpoint to change layout columns on mobile.",
        "It builds a responsive multi-column grid that adapts without media queries.",
        "It caps the absolute maximum size of the outer grid container to 180 pixels."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 128,
      "question": "Why is including the '<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">' HTML tag considered a mandatory first step for modern responsive web development?",
      "correctAnswer": "It prevents mobile browsers from rendering at a generic desktop width and zooming out.",
      "choices": [
        "It prevents mobile browsers from rendering at a generic desktop width and zooming out.",
        "It automatically increases the pixel font size of paragraphs on small viewports.",
        "It enables developers to use absolute positioning relative to structural grid tracks.",
        "It instructs the rendering engine to download external layout sheets faster."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 129,
      "question": "Which CSS rule is utilized by web developers to apply specific blocks of layout styles only when a precise device width condition or media environment is verified as true?",
      "correctAnswer": "@media",
      "choices": [
        "@supports",
        "@media",
        "@keyframes",
        "@import"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 130,
      "question": "If a stylesheet includes the responsive condition '@media (max-width: 600px) { .box { background: coral; } }', when will the browser render the 'box' element with a coral background?",
      "correctAnswer": "Whenever the current viewport width is measured at 600 pixels or narrower.",
      "choices": [
        "Only when the viewport width is measured at exactly 600 pixels wide.",
        "Whenever the current viewport width is measured at 600 pixels or narrower.",
        "Whenever the current viewport width expands to 600 pixels or wider.",
        "Only on high-definition device screens that feature a minimum of 600 DPI."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 131,
      "question": "What is the fundamental design workflow philosophy when a developer builds a web application using a strict mobile-first breakpoint strategy?",
      "correctAnswer": "Coding simple small-screen styles as the baseline, then layering complexity for large screens.",
      "choices": [
        "Creating elaborate desktop views first, then hiding crowded layout columns for mobile.",
        "Coding simple small-screen styles as the baseline, then layering complexity for large screens.",
        "Relying entirely on fluid page width percentages while omitting viewport meta tags.",
        "Sizing all interface margins and grids using absolute hardware pixel specs exclusively."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 132,
      "question": "Which specific media query feature is universally relied upon to progressively layer structural layout enhancements as part of a mobile-first responsive architecture?",
      "correctAnswer": "min-width",
      "choices": [
        "max-width",
        "min-width",
        "orientation",
        "device-pixel-ratio"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 133,
      "question": "According to industry best practices and core architectural definitions, when should a web developer primarily choose to implement Flexbox over alternative layout options?",
      "correctAnswer": "When items need to be arranged linearly along a single layout axis.",
      "choices": [
        "When items need to be arranged linearly along a single layout axis.",
        "When a complex structural grid must control rows and columns together.",
        "When elements must be stacked layer by layer using absolute view coordinates.",
        "When mapping out the master structural layout wireframes of a website."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 134,
      "question": "According to industry layout guidelines, under what design scenario is it ideal to choose a native CSS Grid system over Flexbox?",
      "correctAnswer": "When both horizontal rows and vertical columns must be controlled simultaneously.",
      "choices": [
        "When organizing a simple, linear single-row horizontal navigation bar.",
        "When centering a single block of text content cleanly within a hero banner.",
        "When both horizontal rows and vertical columns must be controlled simultaneously.",
        "When forcing a single background graphic to stretch fluidly with the window."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 135,
      "question": "If a media query block redefines a class property that matches a default layout property with identical selector specificity, how does the browser resolve the conflict?",
      "correctAnswer": "The media query rules win because they appear later in the cascade order.",
      "choices": [
        "Properties declared inside a media query automatically have higher default specificity.",
        "The media query rules win because they appear later in the cascade order.",
        "The matching rules are treated as high-priority inline styles by the browser engine.",
        "The media query block bypasses and ignores standard rules of CSS inheritance."
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 136,
      "question": "A student writes the following JavaScript code: console.log(\"Welcome to JavaScript\"); Where is the text output printed?",
      "correctAnswer": "In the browser console",
      "choices": [
        "In the HTML page title",
        "In the browser console",
        "In the browser address bar",
        "In the CSS stylesheet"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 137,
      "question": "A developer includes this line in an HTML file: <script type=\"module\" src=\"app.js\"></script> What does the module attribute do?",
      "correctAnswer": "It gives the file its own module scope",
      "choices": [
        "It prevents the use of variables",
        "It executes the script as CSS",
        "It gives the file its own module scope",
        "It disables all browser functions"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 138,
      "question": "Consider the following code: \"use strict\"; total = 100; console.log(total); What will happen?",
      "correctAnswer": "An error will occur because total is not declared",
      "choices": [
        "100 will be printed",
        "total will become a global variable",
        "An error will occur because total is not declared",
        "JavaScript will convert total to undefined"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 139,
      "question": "What will happen in this code? const rate = 0.13; rate = 0.15; console.log(rate);",
      "correctAnswer": "An error will occur because rate cannot be reassigned",
      "choices": [
        "0.15 will be printed",
        "0.13 will be printed",
        "An error will occur because rate cannot be reassigned",
        "JavaScript will automatically create a second variable"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 140,
      "question": "What is printed after the loop completes in the following code? for (var i = 0; i < 4; i++) { } console.log(i);",
      "correctAnswer": "4",
      "choices": [
        "0",
        "3",
        "4",
        "ReferenceError"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 141,
      "question": "What will happen in this code? { let score = 90; } console.log(score);",
      "correctAnswer": "A ReferenceError will occur",
      "choices": [
        "90 will be printed",
        "undefined will be printed",
        "A ReferenceError will occur",
        "null will be printed"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 142,
      "question": "A developer wants to store a very large integer safely in JavaScript. Which value uses the appropriate modern type?",
      "correctAnswer": "12345678901234567890n",
      "choices": [
        "\"12345678901234567890\"",
        "12345678901234567890n",
        "Symbol(\"12345678901234567890\")",
        "{number: 12345678901234567890}"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 143,
      "question": "What will be printed? console.log(typeof null);",
      "correctAnswer": "object",
      "choices": [
        "\"null\"",
        "\"undefined\"",
        "\"object\"",
        "\"boolean\""
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 144,
      "question": "What will be printed? console.log(5 === \"5\");",
      "correctAnswer": "false",
      "choices": [
        "true",
        "false",
        "\"5\"",
        "NaN"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 145,
      "question": "What will be printed? console.log(\"10\" - 4);",
      "correctAnswer": "6",
      "choices": [
        "\"104\"",
        "6",
        "\"6\"",
        "NaN"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 146,
      "question": "What will be printed? console.log(\"10\" + 4);",
      "correctAnswer": "\"104\"",
      "choices": [
        "14",
        "\"104\"",
        "6",
        "NaN"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 147,
      "question": "A student wants to check whether a variable value is really NaN. Which expression is the best and safest choice?",
      "correctAnswer": "Object.is(value, NaN)",
      "choices": [
        "value === NaN",
        "value == NaN",
        "Object.is(value, NaN)",
        "typeof value === NaN"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 148,
      "question": "What will be printed? const user = {}; console.log(user.profile?.email);",
      "correctAnswer": "undefined",
      "choices": [
        "null",
        "undefined",
        "false",
        "ReferenceError"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 149,
      "question": "What will be printed? const pageSize = 0; console.log(pageSize ?? 20);",
      "correctAnswer": "0",
      "choices": [
        "20",
        "0",
        "null",
        "undefined"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 150,
      // eslint-disable-next-line no-template-curly-in-string
      "question": "What will be printed? const name = \"Sam\"; console.log(`Hello, ${name}`);",
      "correctAnswer": "Hello, Sam",
      "choices": [
        "Hello, name",
        "Hello, Sam",
        // eslint-disable-next-line no-template-curly-in-string
        "Hello, ${name}",
        "Hello + Sam"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 151,
      "question": "What will be printed? console.log(square(5)); function square(x) { return x * x; }",
      "correctAnswer": "25",
      "choices": [
        "5",
        "25",
        "undefined",
        "ReferenceError"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 152,
      "question": "What will be printed? const double = x => x * 2; console.log(double(7));",
      "correctAnswer": "14",
      "choices": [
        "7",
        "14",
        "undefined",
        "x*2"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 153,
      "question": "What concept is demonstrated by this code?\n\nfunction makeCounter() {\n  let count = 0;\n  return function () {\n    count++;\n    return count;\n  };\n}\nconst next = makeCounter();\nconsole.log(next());\nconsole.log(next());",
      "correctAnswer": "Closure",
      "choices": [
        "Inheritance",
        "Destructuring",
        "Closure",
        "JSON parsing"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 154,
      "question": "What will be printed? function countValues(...values) { return values.length; } console.log(countValues(2, 4, 6, 8));",
      "correctAnswer": "4",
      "choices": [
        "2",
        "8",
        "4",
        "20"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 155,
      "question": "What will be printed? const nums = [3, 8, 2]; console.log(Math.max(...nums));",
      "correctAnswer": "8",
      "choices": [
        "[3, 8, 2]",
        "3",
        "8",
        "undefined"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 156,
      "question": "What will be printed? const a = { value: 10 }; const b = a; b.value = 50; console.log(a.value);",
      "correctAnswer": "50",
      "choices": [
        "10",
        "50",
        "undefined",
        "ReferenceError"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 157,
      "question": "What will be printed? const user = { name: \"Ada\" }; const copy = { ...user, city: \"Ottawa\" }; console.log(copy.name);",
      "correctAnswer": "Ada",
      "choices": [
        "Ottawa",
        "Ada",
        "undefined",
        "city"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 158,
      "question": "What will be printed? const nums = [1, 2, 3]; const result = nums.map(n => n * 10); console.log(result);",
      "correctAnswer": "[10, 20, 30]",
      "choices": [
        "[1, 2, 3]",
        "[10, 20, 30]",
        "60",
        "[2, 4, 6]"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 159,
      "question": "What will be printed? const nums = [1, 2, 3, 4]; const result = nums.filter(n => n % 2 === 0); console.log(result);",
      "correctAnswer": "[2, 4]",
      "choices": [
        "[1, 3]",
        "[2, 4]",
        "[1, 2, 3, 4]",
        "10"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 160,
      "question": "What will be printed? const nums = [5, 10, 15]; const total = nums.reduce((sum, n) => sum + n, 2); console.log(total);",
      "correctAnswer": "32",
      "choices": [
        "30",
        "32",
        "17",
        "2"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 161,
      "question": "What will be printed? const letters = [\"a\", \"b\", \"c\"]; console.log(letters.at(-1));",
      "correctAnswer": "\"c\"",
      "choices": [
        "\"a\"",
        "\"b\"",
        "\"c\"",
        "-1"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 162,
      "question": "What will happen in this code? class Account { #balance = 0; deposit(amount) { this.#balance += amount; } } const acc = new Account(); console.log(acc.#balance);",
      "correctAnswer": "A syntax error will occur",
      "choices": [
        "0 will be printed",
        "undefined will be printed",
        "A syntax error will occur",
        "The balance will become global"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 163,
      "question": "What will be printed? const tags = new Set([\"js\", \"html\", \"js\", \"css\"]); console.log(tags.size);",
      "correctAnswer": "3",
      "choices": [
        "2",
        "3",
        "4",
        "0"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 164,
      "question": "What will be printed? const scores = new Map(); scores.set(\"Ali\", 75); scores.set(\"Sara\", 88); scores.set(\"Ali\", 95); console.log(scores.get(\"Ali\")); console.log(scores.size);",
      "correctAnswer": "95 and 2",
      "choices": [
        "75 and 3",
        "95 and 3",
        "95 and 2",
        "undefined and 2"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 165,
      "question": "In the following code, which message is printed first?\n\nasync function loadData() {\n  await fetch(\"/api/data\");\n  console.log(\"data loaded\");\n}\nloadData();\nconsole.log(\"request sent\");",
      "correctAnswer": "request sent",
      "choices": [
        "\"data loaded\"",
        "\"request sent\"",
        "Both messages print at the same time",
        "Nothing is printed because fetch is invalid"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 166,
      "question": "What will be printed? const grades = new Map(); grades.set(\"Maya\", 85); grades.set(\"Omar\", 92); grades.set(\"Maya\", 90); console.log(grades.get(\"Maya\")); console.log(grades.size);",
      "correctAnswer": "90 and 2",
      "choices": [
        "85 and 3",
        "90 and 3",
        "90 and 2",
        "undefined and 2"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 167,
      "question": "A web page displays a message immediately, starts a 2-second timer, and then displays another message before the timer finishes. Which idea does this demonstrate?",
      "correctAnswer": "Scheduled callbacks can run after synchronous code",
      "choices": [
        "JavaScript always blocks the browser during timers",
        "Scheduled callbacks can run after synchronous code",
        "Timers execute before all normal JavaScript code",
        "HTML elements must load after JavaScript timers"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 168,
      "question": "A student writes code that fetches data from an API while the user can still click buttons and scroll the page. What is the best explanation?",
      "correctAnswer": "The request was handled asynchronously in the browser",
      "choices": [
        "The browser stopped JavaScript execution completely",
        "The API request was converted into CSS rules",
        "The request was handled asynchronously in the browser",
        "The page reloaded before the request was completed"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 169,
      "question": "In a program, console.log(\"A\"), a timer callback, and console.log(\"B\") are executed in sequence. The timer delay is 500 ms. What will usually appear first?",
      "correctAnswer": "A, then B, then the timer callback result",
      "choices": [
        "A, then B, then the timer callback result",
        "A, then the timer callback result, then B",
        "The timer callback result, then A, then B",
        "B, then the timer callback result, then A"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 170,
      "question": "A function starts an operation and returns a Promise. What does the returned Promise allow the caller to do?",
      "correctAnswer": "Attach logic to handle the result when it arrives",
      "choices": [
        "Immediately access the final value as plain text",
        "Attach logic to handle the result when it arrives",
        "Stop the browser until the operation is complete",
        "Convert the HTML document into a JSON object"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 171,
      "question": "A Promise-based function eventually returns a list of course names. Which code pattern correctly handles the successful result?",
      "correctAnswer": "request().then(list => show(list));",
      "choices": [
        "request().catch(list => show(list));",
        "request().then(list => show(list));",
        "request().json(list => show(list));",
        "request().open(list => show(list));"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 172,
      "question": "A developer wants to avoid deeply nested asynchronous callbacks. Which JavaScript feature is most appropriate?",
      "correctAnswer": "Promises with chained handlers",
      "choices": [
        "Inline CSS declarations",
        "HTML form validation",
        "Promises with chained handlers",
        "Synchronous while loops"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 173,
      "question": "A page needs to request data from a server without refreshing the whole document. Which approach matches this requirement?",
      "correctAnswer": "Sending a background HTTP request",
      "choices": [
        "Reloading the page with a new URL",
        "Sending a background HTTP request",
        "Replacing JavaScript with static HTML",
        "Opening the response in a new browser tab"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 174,
      "question": "A legacy web application uses XMLHttpRequest to load a user profile. Which statement is correct?",
      "correctAnswer": "It can request data and update part of the page",
      "choices": [
        "It cannot receive data from a remote API",
        "It only works when the page is reloaded",
        "It can request data and update part of the page",
        "It automatically converts all data into HTML"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 175,
      "question": "A developer creates an XMLHttpRequest, configures the URL and method, defines handlers, but forgets one final call. The request never starts. Which call is missing?",
      "correctAnswer": "xhr.send()",
      "choices": [
        "xhr.parse()",
        "xhr.close()",
        "xhr.send()",
        "xhr.finish()"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 176,
      "question": "A server returns the text '{\"name\":\"Sara\",\"active\":true}'. What must JavaScript do before using name as an object property?",
      "correctAnswer": "Parse the JSON text into an object",
      "choices": [
        "Send the text again using POST",
        "Parse the JSON text into an object",
        "Convert the text into a CSS selector",
        "Store the text inside a script tag"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 177,
      "question": "A student sends a JavaScript object to an API using POST. Why is JSON.stringify() needed?",
      "correctAnswer": "The request body must be sent as text",
      "choices": [
        "HTTP requests require arrays only",
        "JavaScript objects cannot contain strings",
        "The request body must be sent as text",
        "JSON data cannot be sent with headers"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 178,
      "question": "A POST request sends JSON data to an API. Which header best describes the request body?",
      "correctAnswer": "\"Content-Type\": \"application/json\"",
      "choices": [
        "\"Accept\": \"text/html\"",
        "\"Content-Type\": \"application/json\"",
        "\"Method-Type\": \"POST/request\"",
        "\"Response-Type\": \"application/xml\""
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 179,
      "question": "A developer wants to read data from an API endpoint without creating a new resource. Which HTTP method is most appropriate?",
      "correctAnswer": "GET",
      "choices": [
        "GET",
        "POST",
        "PATCH",
        "DELETE"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 180,
      "question": "A developer wants to submit a new comment object to an API. Which HTTP method is generally most appropriate?",
      "correctAnswer": "POST",
      "choices": [
        "GET",
        "POST",
        "HEAD",
        "TRACE"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 181,
      "question": "A web application uses fetch() to request data from an API. What does fetch() return?",
      "correctAnswer": "A Promise for the HTTP response",
      "choices": [
        "The final JSON object immediately",
        "A CSS object representing the page",
        "A Promise for the HTTP response",
        "The HTML element that triggered it"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 182,
      "question": "Inside an async function, why is await useful when calling fetch()?",
      "correctAnswer": "It waits for the Promise result in readable code",
      "choices": [
        "It removes the need for HTTP status codes",
        "It forces the full page to reload first",
        "It waits for the Promise result in readable code",
        "It converts every response into valid JSON"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 183,
      "question": "A fetch() request receives a 404 response. Why should the code still check res.ok?",
      "correctAnswer": "Fetch may resolve even for HTTP error statuses",
      "choices": [
        "A 404 response always crashes the browser",
        "Fetch may resolve even for HTTP error statuses",
        "res.ok automatically fixes invalid URLs",
        "JSON parsing always detects HTTP failures"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 184,
      "question": "A developer writes 'const data = await res.json();'. What is the purpose of this line?",
      "correctAnswer": "To convert the response body into JavaScript data",
      "choices": [
        "To send a JavaScript object to the server",
        "To configure the request method and headers",
        "To convert the response body into JavaScript data",
        "To add query parameters to the request URL"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 185,
      "question": "A network cable is disconnected during an API request. Which structure helps display a friendly error message?",
      "correctAnswer": "A try/catch block",
      "choices": [
        "A CSS media query",
        "A try/catch block",
        "A static HTML table",
        "A JSON indentation value"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 186,
      "question": "A form sends {title: \"Lab\", userId: 4 } to an API using Fetch. Which Fetch option is required to indicate a POST operation?",
      "correctAnswer": "method: \"POST\"",
      "choices": [
        "status: \"POST\"",
        "method: \"POST\"",
        "type: \"POST\"",
        "request: \"POST\""
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 187,
      "question": "A student wants to display an object as nicely formatted JSON with indentation. Which call is best?",
      "correctAnswer": "JSON.stringify(obj, null, 2)",
      "choices": [
        "JSON.parse(obj, 2, null)",
        "JSON.text(obj, null, 2)",
        "JSON.stringify(obj, null, 2)",
        "JSON.object(obj, 2, null)"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 188,
      "question": "A JSON string is missing a closing brace. What will likely happen when JSON.parse() is called?",
      "correctAnswer": "It will throw an error that should be handled",
      "choices": [
        "It will silently remove the invalid part",
        "It will return an empty JavaScript object",
        "It will throw an error that should be handled",
        "It will automatically request the data again"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 189,
      "question": "A page has an input field where the user enters a user id. The program must add this value as ?userId=3 in the API URL. Which tool is safest?",
      "correctAnswer": "URL with searchParams",
      "choices": [
        "Manual string concatenation only",
        "CSS custom properties",
        "URL with searchParams",
        "JSON.stringify() directly"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 190,
      "question": "A developer writes url.searchParams.set(\"category\", \"books\"). What is the effect?",
      "correctAnswer": "It adds or updates a query parameter",
      "choices": [
        "It changes the page title to books",
        "It sends the HTTP request immediately",
        "It adds or updates a query parameter",
        "It converts the response into JSON data"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 191,
      "question": "An API request takes several seconds. What should the interface ideally show during that time?",
      "correctAnswer": "A loading message or visual loading state",
      "choices": [
        "Nothing until the request is complete",
        "A full reload of the original web page",
        "A loading message or visual loading state",
        "The raw JavaScript code being executed"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 192,
      "question": "A robust API consumer should handle which three operational UI situations?",
      "correctAnswer": "Loading, success, and failure states",
      "choices": [
        "CSS, layout, and font selection",
        "HTML, validation, and animation only",
        "Loading, success, and failure states",
        "Images, audio, and video formats only"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 193,
      "question": "A developer separates API logic into a function such as getUser(id) and UI logic into a click handler. Why is this useful?",
      "correctAnswer": "It makes the code easier to reuse and test",
      "choices": [
        "It prevents the API from returning JSON",
        "It makes the code easier to reuse and test",
        "It forces the request to become synchronous",
        "It removes the need to handle errors"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 194,
      "question": "A student uses fetch(url, { method: \"POST\", headers, body }). What does the second argument represent?",
      "correctAnswer": "The configuration options for the request",
      "choices": [
        "The parsed response returned by the server",
        "The HTML content displayed on the page",
        "The configuration options for the request",
        "The CSS rules applied to the output element"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 195,
      "question": "A page receives an array of users from an API and displays only the first three names. Which array operations are useful for this task?",
      "correctAnswer": "slice() and map()",
      "choices": [
        "parse() and open()",
        "send() and reload()",
        "slice() and map()",
        "style() and query()"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    },
    {
      "id": 196,
      "question": "A complete browser page uses index.html, style.css, and script.js. Why should the HTML link/include the CSS and JavaScript files correctly?",
      "correctAnswer": "Otherwise the page may not style or run the script",
      "choices": [
        "Otherwise the API server cannot store data",
        "Otherwise JSON.parse() changes the page layout",
        "Otherwise the page may not style or run the script",
        "Otherwise the browser disables all HTTP requests"
      ],
      "score": 0,
      "dueTurn": 0,
      "attempts": 0
    }
  ]
