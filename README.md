## **1\. Concepteur**

**Nom :** Ryan Beland

## **2\. Tableau de bord \- Objectif \+ données**

**a. Domaine et jeu de données**  
**Domaine choisi :** Vente d'œuvres d'art (Art Shop) / Tableau de bord analytique.  
**Jeu de données :** Données synthétiques générées par un générateur JavaScript, simulant 10 000 produits et leurs statistiques de vente, d'inventaire et de tendances.  
**Modifications apportées :** Les données sont générées dynamiquement côté client avec une graine aléatoire (seed) fixe (dans productGenerator.js) pour assurer la consistance des informations présentées dans les graphiques et les interfaces de filtrage à chaque visite. Conformément aux exigences du devoir, une mention claire a été ajoutée directement sur l'interface du tableau de bord pour indiquer explicitement à l'utilisateur qu'il s'agit de données synthétiques. Les données sont ensuite regroupées et filtrées dynamiquement en fonction des sélections de l'utilisateur (par artiste, ville, année et catégorie).

**b. Tableaux de bord d'inspiration**  
Bien que je n'aie pas imité ces sites, ils m'ont fourni des pistes de réflexion essentielles pour la conception et l'expérience utilisateur:  
[Google Analytics](https://analytics.google.com/)  
J'ai beaucoup analysé Google Analytics pour sa capacité à présenter une quantité massive de données complexes de manière très épurée. Leur utilisation d'un panneau latéral gauche dédié aux filtres et aux options de contrôle, laissant tout l'espace principal aux grandes visualisations, a directement influencé ma propre mise en page asymétrique. Cela permet à l'utilisateur de manipuler les paramètres tout en se concentrant sur les résultats sans être distrait visuellement.  
[Graphiques boursiers (ex: TradingView)](https://fr.tradingview.com/)  
Les plateformes de suivi des marchés boursiers sont les parfaits exemples de l'importance du traitement visuel rapide (preattentive processing). Ce qui m'a le plus inspiré, c'est leur approche de l'interactivité et de l'épuration. Lorsqu'on analyse une tendance financière, on veut cibler un point précis sans être encombré par des lignes de grille inutiles. C'est de ces interfaces que j'ai tiré l'idée de simplifier drastiquement mes axes (pour un design *clutter-free*) et d'intégrer une interaction avancée de ciblage (*cross-chart interaction*), permettant à l'utilisateur de cliquer sur un point temporel précis pour isoler cette donnée.

## 

## **3\. Réflexion/Conception**

### **(A) Graphiques**

**Graphique 1 : Graphique linéaire (LineChart)**

* **Description :** Il affiche l'évolution temporelle (de 1990 à 2026\) d'une métrique choisie (ex: volume des ventes, valeur de l'inventaire, prix moyen).  
* **Choix du type :** Le graphique linéaire est parfait pour illustrer une tendance ou une évolution temporelle, permettant à l'utilisateur de repérer rapidement et intuitivement les pics et les creux au fil des années pour évaluer la santé financière de la galerie.

**Graphique 2 : Graphique à barres (BarChart)**

* **Description :** Il compare une métrique choisie entre plusieurs entités (soit par ville, soit par artiste).  
* **Choix du type :** Le graphique à barres est idéal pour comparer des quantités distinctes entre plusieurs catégories. Cela permet à l'utilisateur de classer facilement les artistes ou les marchés géographiques les plus performants, ce qui est essentiel pour orienter les stratégies de vente.

### **(B) Les 3C (Contexte, Clutter-free, Contraste)**

* **Contexte :** Les graphiques sont présentés dans deux sections distinctes (« Tendances Temporelles » et « Comparaison des Métriques »). Des filtres adjacents permettent de contextualiser immédiatement les données (ex: limiter à une catégorie spécifique comme la sculpture, ou à une devise particulière).  
* **Clutter-free (Sans encombrement) :** J'ai supprimé les lignes de grille superflues et simplifié drastiquement les axes. Les graphiques n'affichent que les points ou les barres essentiels, avec des étiquettes minimalistes pour éviter la surcharge cognitive et laisser l'espace négatif respirer, en accord avec l'esthétique générale de mon site.  
* **Contraste :** J'ai utilisé une palette de couleurs avec une forte couleur d'accent (bleu/vert) sur un fond sombre (ou clair, selon le thème choisi), garantissant une excellente lisibilité de l'information et dirigeant l'attention vers les données importantes.

### **(C) Mise en page, titre et interactions**

* **Mise en page :** Le tableau de bord utilise une disposition asymétrique à deux colonnes pour chaque section. La colonne de gauche contient les contrôles interactifs et les filtres, tandis que la colonne de droite (plus large) met en valeur les graphiques. Cela suit un flux de lecture naturel de gauche à droite (contrôle \-\> résultat).  
* **Titre :** Analytics Dashboard / Tableau de Bord Analytique.  
* **Interactions :** L'utilisateur peut modifier les métriques affichées, filtrer par catégorie, artiste, ville ou devise, et ajuster la plage d'années avec un curseur interactif. J'ai également intégré une interaction avancée (*cross-chart interaction*) qui permet de cliquer sur un point du graphique linéaire pour cibler automatiquement cette année précise dans le graphique à barres, reliant ainsi les deux visualisations.

### **(D) Internationalisation**

* **Langues choisies :** Anglais et Français. Un sélecteur de langue clair a été intégré à l'interface pour permettre à l'utilisateur de basculer facilement entre les deux.  
* **Obtention des traductions :** J'ai d'abord utilisé une IA pour obtenir une traduction initiale vers l'anglais. Étant bilingue, j'ai ensuite révisé et corrigé moi-même les traductions pour m'assurer que le ton et le vocabulaire étaient parfaitement adaptés. J'ai configuré un dictionnaire de traduction local combinant les données du magasin (ECOMMERCE\_TRANSLATIONS) et du tableau de bord (DASHBOARD\_TRANSLATIONS).  
* **Difficultés de traduction :** Le texte en français est souvent plus long que l'anglais, ce qui a nécessité d'ajuster les marges et l'espacement dans les boutons et les menus pour éviter les débordements visuels et préserver la structure neumorphique.  
* **Processus de localisation :** L'entièreté de l'interface (boutons, filtres, sélecteur de langue) ainsi que tous les éléments textuels à l'intérieur des graphiques (titres, axes) ont été localisés. J'ai pris soin de localiser les formats numériques (le formatage des devises utilise toLocaleString('fr-FR') vs toLocaleString('en-US')). Pour ce qui est des dates, aucune localisation n'a été nécessaire car le tableau de bord n'utilise que les années (ex: 2024), qui s'écrivent de la même manière dans les deux langues.

## **4\. Prototype haute-fidélité**

### **a. Choix de conception visuelle**

J'ai réutilisé l'esthétique minimaliste et le neumorphisme développés dans mes travaux précédents. Le tableau de bord intègre un mode clair et sombre, avec des éléments en relief subtils et une couleur d'accent vibrante pour guider l'œil de l'utilisateur vers les données clés.

* **Thème de couleur et Contraste :** La couleur d'accent établit une hiérarchie visuelle claire. Les éléments interactifs (filtres, sélecteurs) utilisent cette couleur pour indiquer qu'ils sont cliquables, respectant ainsi l'heuristique de visibilité du statut du système.  
* **Typographie :** L'interface utilise une police sans-serif moderne. L'utilisation stratégique du gras pour les titres des axes permet d'attirer l'attention rapidement.  
* **Espace négatif et Mise en page :** J'ai intégré beaucoup d'espace vide entre la colonne de contrôle et les graphiques pour éviter la surcharge cognitive. La disposition asymétrique guide naturellement l'œil des paramètres (à gauche) vers les résultats (à droite).  
* **Application des principes de Gestalt :** J'ai appliqué la loi de proximité en regroupant les filtres de données dans un panneau de contrôle distinct des graphiques. L'utilisation du neumorphisme applique également la loi de la figure-fond, faisant ressortir les conteneurs de graphiques de l'arrière-plan.  
* **Synergie (Visuelle/Verbale) :** Les graphiques (visuel) sont toujours accompagnés de titres descriptifs et d'étiquettes claires (verbal) pour s'assurer qu'il n'y a aucune ambiguïté sur ce qui est présenté.

### **b. Lien vers le portfolio**

Conformément aux exigences, le portfolio principal a été révisé. J'ai choisi de conserver mon esthétique minimaliste d'origine pour les études de cas : plutôt que d'utiliser des captures d'écran, j'ai mis à jour les cartes de projets en utilisant une iconographie spécifique (icônes) afin de maintenir la cohérence de mon design épuré, un choix de conception délibéré expliqué depuis le premier devoir.

[https://ryanbeland.ca](https://ryanbeland.ca)  
*(Le tableau de bord est accessible via : [https://ryanbeland.ca/aura-analytics](https://ryanbeland.ca/aura-analytics))*

## **5\. Code**

[https://github.com/Beryshadow/SEG3525Website](https://github.com/Beryshadow/SEG3525Website)

## **6\. Reconnaissance de l'IA générative**

Pour la programmation, j’ai utilisé un modèle local d'autocomplétion pendant l’écriture ; vous pouvez consulter la configuration de mon IDE ici : [https://github.com/Beryshadow/SEG3525Website/blob/master/.helix/language.toml](https://github.com/Beryshadow/SEG3525Website/blob/master/.helix/language.toml).

J'ai utilisé un assistant IA de manière approfondie pour m'aider à extraire et refactoriser les composants React, à écrire les algorithmes de filtrage complexes (useMemo croisés), à générer les graphiques interactifs (SVG) à partir des données synthétiques, ainsi que pour faire une première passe de traduction vers l'anglais. J'ai également utilisé Google pour trouver des solutions aux défis techniques rencontrés lors du développement. Par conséquent, les résultats de recherche m'ont parfois fourni des extraits de code que j'ai adaptés et intégrés. Une partie de la logique de mon code s'inspire donc de ressources en ligne.

Cependant, je tiens à souligner que toutes les décisions relatives au design, à l'esthétique générale et à la mise en page (layout) du site sont entièrement les miennes.

Ce rapport a aussi été corrigé avec Grammarly.