// Réglages du site. C'est le seul fichier à modifier pour brancher le formulaire.
window.MSC_CONFIG = {
  // Point d'envoi des demandes d'hébergement (POST JSON).
  // Compatible Formspree (https://formspree.io/f/xxxxxxx), Web3Forms (https://api.web3forms.com/submit),
  // Getform, ou un Google Apps Script publié en application web.
  form: {
    endpoint: "",
    // Champs ajoutés à chaque envoi, par ex. { access_key: "..." } pour Web3Forms.
    extraFields: {}
  },

  // Utilisé en secours si aucun endpoint n'est configuré : le formulaire ouvre un e-mail pré-rempli.
  contactEmail: "",

  linkedinUrl: "https://www.linkedin.com/company/moroccansoftwarecrafters/",
  socratesUrl: "https://socrates-ma.github.io/",

  // Formules proposées aux entreprises. "price" vide = affiché "Sur devis".
  offers: [
    {
      id: "communautaire",
      name: "Hôte communautaire",
      price: "Gratuit",
      tagline: "Le format historique : vous ouvrez vos portes, on s'occupe du reste.",
      youProvide: ["Une salle de 40 à 80 places, un samedi matin", "Wifi, écran ou projecteur", "Café et petit-déjeuner"],
      weProvide: [
        "Organisation, inscriptions Luma et accueil",
        "Annonce et récap sur LinkedIn (3 600+ abonnés)",
        "Facilitation : flash talks, marketplace, cercles",
        "Mot d'accueil de 10 min pour votre équipe"
      ]
    },
    {
      id: "partenaire",
      name: "Meetup partenaire",
      price: "À partir de 12 000 MAD",
      highlight: true,
      tagline: "Un meetup ouvert à la communauté, porté par votre marque employeur.",
      youProvide: ["Le financement de l'édition", "Une salle si vous en avez une (sinon on en trouve une)"],
      weProvide: [
        "Tout le format communautaire",
        "Co-branding de l'affiche, de la page Luma et du récap",
        "Un talk de 20 min pour un de vos experts",
        "Un espace recrutement pendant le networking",
        "Bilan post-événement : inscriptions, présence, thèmes discutés"
      ]
    },
    {
      id: "prive",
      name: "Craft session privée",
      price: "À partir de 25 000 MAD",
      tagline: "Le format meetup, animé pour vos équipes tech, sur vos sujets.",
      youProvide: ["Vos équipes (15 à 80 personnes)", "Une demi-journée en semaine ou le samedi"],
      weProvide: [
        "Préparation avec vos tech leads",
        "Animation par des crafters de la communauté",
        "Open space, coding dojo ou kata au choix (IA et qualité, TDD, legacy…)",
        "Synthèse écrite des cercles et des actions"
      ]
    }
  ]
};
