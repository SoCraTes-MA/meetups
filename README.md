# Moroccan Software Crafters · site des meetups

Site statique (HTML, CSS, JavaScript, sans build) qui présente les meetups de la communauté et collecte les demandes des entreprises qui veulent en accueillir un.

- `index.html` : présentation, format, historique des 21 événements, galerie, hôtes et partenaires, SoCraTes Maroc, formules, FAQ.
- `accueillir.html` : funnel en 4 étapes (formule, événement, entreprise, contact).

## Structure

```
index.html
accueillir.html
assets/
  css/style.css
  js/config.js    ← endpoint du formulaire, e-mail de contact, formules et tarifs
  js/data.js      ← événements, hôtes, partenaires, chiffres clés
  js/main.js      ← rendu de la page d'accueil
  js/funnel.js    ← logique du formulaire
  img/            ← logo, favicon, photos des meetups (EXIF supprimées)
```

## Tester en local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Publier sur GitHub Pages

1. Créer un dépôt dans l'organisation `SoCraTes-MA`, par exemple `meetups`.
2. Pousser le contenu de ce dossier sur la branche `main`.
3. Dans le dépôt : Settings → Pages → Source « Deploy from a branch », branche `main`, dossier `/ (root)`.
4. Le site est servi sur `https://socrates-ma.github.io/meetups/`. Les chemins sont relatifs, il fonctionne aussi sur un domaine personnalisé.

Les balises `og:image` et `og:url` pointent vers `https://socrates-ma.github.io/meetups/` : à mettre à jour en cas de changement de domaine.

## Brancher le formulaire

GitHub Pages ne sert que des fichiers statiques : les demandes partent vers un service tiers. Renseigner `form.endpoint` dans `assets/js/config.js`.

| Service | Endpoint | Réglage |
|---|---|---|
| Formspree (gratuit jusqu'à 50 envois/mois) | `https://formspree.io/f/<id>` | rien de plus |
| Web3Forms (gratuit, 250 envois/mois) | `https://api.web3forms.com/submit` | `extraFields: { access_key: "<clé>" }` |
| Google Apps Script vers Google Sheets | URL de l'application web publiée | le script lit `e.postData.contents` (JSON) |

Sans endpoint, le formulaire ouvre un e-mail pré-rempli vers `contactEmail`. Sans aucun des deux, il renvoie vers la page LinkedIn.

Chaque envoi contient : formule, dates, fourchette de participants, capacité, ville, équipements, sujets, entreprise, secteur, taille de l'équipe tech, site, contact (nom, fonction, e-mail, téléphone, préférence), message, et les paramètres `utm_*` et le référent s'ils existent. Un champ caché bloque les robots simples.

## Ajouter un meetup

Ajouter une entrée en tête de `window.MSC_EVENTS` dans `assets/js/data.js`, déposer les photos dans `assets/img/meetups/` au format `AAAA-MM-hote-N.jpg`, puis mettre à jour `MSC_STATS` et `MSC_PARTNERS` si besoin.

Les photos doivent être redimensionnées (1600 px de large au plus) et débarrassées de leurs métadonnées, qui contiennent souvent la position GPS :

```bash
python3 -c "from PIL import Image, ImageOps; im = ImageOps.exif_transpose(Image.open('in.jpg')).convert('RGB'); im.thumbnail((1600, 1600)); im.save('out.jpg', quality=80, optimize=True, progressive=True)"
```

## Sources des données

Base Notion « Events » de l'association et posts de la page LinkedIn, au 27 octobre 2026. Les inscriptions Luma ne sont connues que depuis 2025.
