# Présentation du Devoir 5

## 1. Concepteur
**Nom :** Ryan Beland
**Numéro d'étudiant :** [XXX<Numéro d'étudiant>XXX]

## 2. Tableau de bord - Objectif + données

### a. Domaine et jeu de données
**Domaine choisi :** Vente d'œuvres d'art (Art Shop) / Tableau de bord analytique.
**Jeu de données :** Données synthétiques générées par l'IA (générateur JavaScript), simulant 10 000 produits et leurs statistiques de vente, d'inventaire et de tendances.
**Modifications apportées :** Les données sont générées dynamiquement côté client avec un seed fixe (dans `productGenerator.js`) pour assurer la consistance des informations présentées dans les graphiques et les interfaces de filtrage. Les données sont ensuite regroupées et filtrées dynamiquement en fonction des sélections de l'utilisateur (par artiste, ville, année et catégorie).

### b. Tableaux de bord d'inspiration
* [XXX<Lien d'inspiration 1>XXX]
* [XXX<Lien d'inspiration 2>XXX]

## 3. Réflexion/Conception

### (A) Graphiques
**Graphique 1 : Graphique linéaire (LineChart)**
* **Description :** Il affiche l'évolution temporelle (de 1990 à 2026) d'une métrique choisie (ex: volume des ventes, valeur de l'inventaire, prix moyen).
* **Choix du type :** Le graphique linéaire est parfait pour illustrer une tendance ou une évolution temporelle, permettant à l'utilisateur de repérer rapidement les pics et les creux au fil des années.

**Graphique 2 : Graphique à barres (BarChart)**
* **Description :** Il compare une métrique choisie entre plusieurs entités (soit par ville, soit par artiste).
* **Choix du type :** Le graphique à barres est idéal pour comparer des quantités distinctes entre plusieurs catégories, ce qui permet de classer facilement les artistes ou les villes les plus performants.

### (B) Les 3C (Contexte, Clutter-free, Contraste)
* **Contexte :** Les graphiques sont présentés dans deux sections distinctes (« Tendances Temporelles » et « Comparaison des Métriques »). Des filtres adjacents permettent de contextualiser les données (ex: limiter à une catégorie spécifique ou à une devise particulière). Des infobulles détaillées fournissent un contexte supplémentaire lors du survol.
* **Clutter-free (Sans encombrement) :** J'ai supprimé les lignes de grille superflues et simplifié les axes. Les graphiques n'affichent que les points ou les barres essentiels, avec des étiquettes minimalistes pour éviter de surcharger visuellement la zone de dessin.
* **Contraste :** J'ai utilisé une palette de couleurs avec une forte couleur d'accent (bleu/vert) sur un fond sombre (ou clair). Les infobulles utilisent un fond très contrasté pour garantir une excellente lisibilité.

### (C) Mise en page, titre et interactions
* **Mise en page :** Le tableau de bord utilise une disposition asymétrique à deux colonnes pour chaque section. La colonne de gauche contient les contrôles interactifs et les filtres, tandis que la colonne de droite (plus large) met en valeur les graphiques.
* **Titre :** Analytics Dashboard / Tableau de Bord Analytique.
* **Interactions :** L'utilisateur peut modifier les métriques affichées, filtrer par catégorie, artiste, ville ou devise, et ajuster la plage d'années avec un curseur interactif. Une interaction avancée (*cross-chart interaction*) permet également de cliquer sur un point du graphique linéaire pour cibler automatiquement cette année précise dans le graphique à barres.

### (D) Internationalisation
* **Langues choisies :** Anglais et Français.
* **Obtention des traductions :** J'ai configuré un dictionnaire de traduction local combinant les données du magasin (`ECOMMERCE_TRANSLATIONS`) et du tableau de bord (`DASHBOARD_TRANSLATIONS`). 
* **Difficultés de traduction :** Le texte en français est souvent plus long que l'anglais, ce qui a nécessité d'ajuster les marges et l'espacement dans les infobulles et les boutons pour éviter les débordements visuels. Le formatage des devises a également nécessité une gestion distincte (`toLocaleString('fr-FR')` vs `toLocaleString('en-US')`).
* **Processus de localisation :** L'entièreté de l'interface (boutons, filtres, sélecteurs) ainsi que tous les éléments textuels à l'intérieur des graphiques (axes, infobulles) ont été localisés.

## 4. Prototype haute-fidélité

### a. Choix de conception visuelle
J'ai réutilisé l'esthétique minimaliste et le neumorphisme développés dans mes travaux précédents. Le tableau de bord intègre un mode clair et sombre, avec des éléments en relief subtils et une couleur d'accent vibrante pour guider l'œil de l'utilisateur vers les données clés et les éléments interactifs. La disposition garantit que les contrôles restent toujours accessibles tout en laissant un maximum d'espace pour la visualisation des données.

### b. Lien vers le portfolio
[https://ryanbeland.netlify.app](https://ryanbeland.netlify.app)
*(Le tableau de bord y est accessible via : [XXX<Lien vers le tableau de bord>XXX])*

## 5. Code
[https://github.com/Beryshadow/SEG3525Website](https://github.com/Beryshadow/SEG3525Website)

## 6. Reconnaissance de l'IA générative
Pour la programmation, j’ai utilisé un modèle local d'autocomplétion pendant l’écriture ; vous pouvez consulter la configuration de mon IDE ici : [https://github.com/Beryshadow/SEG3525Website/blob/master/.helix/languages.toml](https://github.com/Beryshadow/SEG3525Website/blob/master/.helix/languages.toml). 

J'ai utilisé Google de manière approfondie pour trouver des solutions aux défis techniques rencontrés lors du développement. Par conséquent, les résultats de recherche m'ont parfois fourni des extraits de code que j'ai adaptés et intégrés. Une partie de la logique de mon code s'inspire donc de ressources en ligne.

Cependant, je tiens à souligner que toutes les décisions relatives au design, à l'esthétique générale et à la mise en page (layout) du site sont entièrement les miennes.

Ce rapport a aussi été corrigé avec Grammarly.

