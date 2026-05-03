/**
 * 20 variantes de texte d'attestation d'hébergement.
 * Chaque variante est une fonction qui reçoit les données
 * et retourne le texte complet avec accords grammaticaux.
 */

/**
 * Accords selon le genre
 */
const accord = {
  hebergeur: (gender) => gender === 'F' ? 'hébergeuse' : 'hébergeur',
  leHebergeur: (gender) => gender === 'F' ? 'La soussignée' : 'Le soussigné',
  ilElle: (gender) => gender === 'F' ? 'elle' : 'il',
  etudiant: (gender) => gender === 'F' ? 'étudiante' : 'étudiant',
  lEtudiant: (gender) => gender === 'F' ? 'l\'étudiante' : 'l\'étudiant',
  duEtudiant: (gender) => gender === 'F' ? 'de l\'étudiante' : 'de l\'étudiant',
  accueilli: (gender) => gender === 'F' ? 'accueillie' : 'accueilli',
  heberge: (gender) => gender === 'F' ? 'hébergée' : 'hébergé',
  loge: (gender) => gender === 'F' ? 'logée' : 'logé',
  logataire: (gender) => gender === 'F' ? 'de la locataire' : 'du locataire',
};

/**
 * Sélectionner une variante par hash (stable pour un dossier donné)
 */
const selectVariant = (dossierId) => {
  let hash = 0;
  for (let i = 0; i < dossierId.length; i++) {
    hash = ((hash << 5) - hash) + dossierId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 20;
};

/**
 * Formater une date en français
 */
const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

/**
 * Les 20 variantes
 */
const variants = [
  ({ host, student, address, dossierId, date }) => `
Je soussigné(e), ${accord.leHebergeur(host.gender)} ${host.firstName} ${host.lastName}, ${accord.hebergeur(host.gender)}, demeurant au ${address}, atteste sur l'honneur héberger à mon domicile ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName}, inscrit(e) à l'Université de Limoges.

Cet hébergement est accordé à titre bénévole et s'inscrit dans le cadre de l'aide apportée aux membres de l'Association des Étudiants Guinéens de Limoges (AEGL).

${accord.leHebergeur(host.gender)} ${host.firstName} ${host.lastName} certifie que ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} réside effectivement à l'adresse susmentionnée depuis son arrivée à Limoges.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address, date }) => `
${accord.leHebergeur(host.gender)} ${host.firstName} ${host.lastName}, domicilié(e) au ${address}, déclare par la présente héberger gracieusement ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} à son adresse personnelle.

Cette attestation est délivrée à la demande de l'intéressé(e) dans le cadre de ses démarches administratives liées à ses études à l'Université de Limoges, et ce, grâce au dispositif de solidarité mis en place par l'Association des Étudiants Guinéens de Limoges (AEGL).

${accord.leHebergeur(host.gender)} soussigné(e) confirme l'exactitude de ces informations.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Attestation d'hébergement

Je soussigné(e) ${host.firstName} ${host.lastName}, en qualité d'${accord.hebergeur(host.gender)}, résidant au ${address}, atteste formellement que ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} est ${accord.heberge(student.gender)} à mon domicile.

Cet hébergement est proposé dans le cadre du programme de solidarité de l'Association des Étudiants Guinéens de Limoges (AEGL), visant à faciliter l'installation des nouveaux étudiants guinéens poursuivant leurs études à Limoges.

Je certifie l'exactitude de la présente déclaration.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Par la présente, ${accord.leHebergeur(host.gender)} ${host.firstName} ${host.lastName}, ${accord.hebergeur(host.gender)} résidant au ${address}, certifie avoir pris en charge l'hébergement ${duEtudiantCompat(student.gender)} ${student.firstName} ${student.lastName}, ${accord.etudiant(student.gender)} à l'Université de Limoges.

Cet accueil est réalisé dans un esprit de solidarité communautaire et sous l'égide de l'Association des Étudiants Guinéens de Limoges (AEGL), qui œuvre pour l'intégration réussie des étudiants guinéens en France.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Je soussigné(e), ${host.firstName} ${host.lastName}, propriétaire/locataire principal(e) du logement sis au ${address}, certifie héberger à mon domicile, à titre gracieux, ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName}.

${accord.lEtudiant(student.gender).charAt(0).toUpperCase() + accord.lEtudiant(student.gender).slice(1)} ${student.firstName} ${student.lastName} est ${accord.accueilli(student.gender)} dans le cadre du soutien que j'apporte aux membres de l'Association des Étudiants Guinéens de Limoges (AEGL).

Je déclare que les informations ci-dessus sont exactes et sincères.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Attestation sur l'honneur

${accord.leHebergeur(host.gender)} ${host.firstName} ${host.lastName}, demeurant au ${address}, atteste sur l'honneur que ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName}, ${accord.etudiant(student.gender)} guinéen(ne) inscrit(e) à l'Université de Limoges, est ${accord.loge(student.gender)} à ladite adresse.

Cet hébergement est fourni à titre bénévole dans le cadre des actions menées par l'Association des Étudiants Guinéens de Limoges (AEGL) pour faciliter l'accès au logement des nouveaux arrivants.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Je soussigné(e) ${host.firstName} ${host.lastName}, occupant(e) du logement situé au ${address}, déclare héberger bénévolement ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} dans mon domicile.

Ce geste s'inscrit dans la mission solidaire de l'Association des Étudiants Guinéens de Limoges (AEGL), qui coordonne les mises en relation entre hébergeurs bénévoles et étudiants guinéens nouvellement arrivés en France pour leurs études universitaires.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Par la présente déclaration, ${accord.leHebergeur(host.gender)} ${host.firstName} ${host.lastName}, résidant au ${address}, certifie mettre son logement à disposition ${duEtudiantCompat(student.gender)} ${student.firstName} ${student.lastName}, ${accord.etudiant(student.gender)} à l'Université de Limoges, et ce dans le cadre du dispositif d'hébergement solidaire géré par l'Association des Étudiants Guinéens de Limoges (AEGL).

Je confirme l'exactitude de l'ensemble des informations contenues dans la présente attestation.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Je soussigné(e) ${host.firstName} ${host.lastName}, titulaire du bail du logement situé au ${address}, certifie avoir accepté d'héberger ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} à titre gratuit et bénévole.

Cette disposition est prise en accord avec les valeurs de solidarité de l'Association des Étudiants Guinéens de Limoges (AEGL), dont le rôle est de soutenir l'installation des étudiants guinéens dans les meilleures conditions possibles.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Attestation d'hébergement à titre gratuit

${accord.leHebergeur(host.gender)} ${host.firstName} ${host.lastName}, domicilié(e) au ${address}, soussigné(e), atteste par la présente héberger à titre gracieux ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName}, ${accord.etudiant(student.gender)} inscrit(e) à l'Université de Limoges.

Cette attestation est établie à la demande de l'Association des Étudiants Guinéens de Limoges (AEGL) afin de permettre à l'intéressé(e) d'accomplir les formalités administratives nécessaires à son installation.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Je soussigné(e), ${host.firstName} ${host.lastName}, résidant au ${address}, certifie héberger gratuitement et de bonne foi ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} dans mon logement.

En tant que membre ${accord.hebergeur(host.gender)} partenaire de l'Association des Étudiants Guinéens de Limoges (AEGL), j'apporte mon soutien à cette ${accord.etudiant(student.gender)} pour faciliter son installation et ses démarches administratives à Limoges.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Déclaration d'hébergement

${accord.leHebergeur(host.gender)} ${host.firstName} ${host.lastName}, occupant(e) à titre principal le logement sis au ${address}, certifie héberger ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} à ladite adresse, dans le cadre d'un hébergement bénévole organisé par l'Association des Étudiants Guinéens de Limoges (AEGL).

Je reconnais l'exactitude des informations portées sur la présente déclaration.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Je soussigné(e) ${host.firstName} ${host.lastName}, titulaire d'un logement au ${address}, déclare accueillir ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} à mon domicile à titre entièrement gratuit.

Cette initiative s'inscrit dans le programme de solidarité de l'Association des Étudiants Guinéens de Limoges (AEGL), qui facilite l'accès au logement pour les étudiants guinéens débutant leur cursus à l'Université de Limoges.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Moi, ${host.firstName} ${host.lastName}, demeurant au ${address}, atteste solennellement héberger à titre bénévole ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName}, ${accord.etudiant(student.gender)} à l'Université de Limoges.

Cet hébergement est effectué dans le cadre des activités de l'Association des Étudiants Guinéens de Limoges (AEGL) et reflète les valeurs d'entraide et de solidarité de notre communauté.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Je soussigné(e), ${host.firstName} ${host.lastName}, résidant à l'adresse suivante : ${address}, certifie par la présente que ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} est ${accord.heberge(student.gender)} à titre gracieux dans mon logement.

Cette attestation est délivrée conformément aux exigences administratives et en appui aux démarches entreprises par l'Association des Étudiants Guinéens de Limoges (AEGL) pour faciliter l'intégration des étudiants guinéens à Limoges.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Attestation d'hébergement bénévole

Le présent document certifie que ${host.firstName} ${host.lastName}, ${accord.hebergeur(host.gender)}, dont le domicile est situé au ${address}, héberge à titre gratuit ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName}.

Cet hébergement est proposé dans le cadre du programme de solidarité de l'Association des Étudiants Guinéens de Limoges (AEGL), en soutien aux étudiants guinéens en cours d'installation dans la ville de Limoges.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Je soussigné(e) ${host.firstName} ${host.lastName}, propriétaire ou locataire principal(e) du bien immobilier situé au ${address}, confirme héberger bénévolement ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName}, ${accord.etudiant(student.gender)} inscrit(e) à l'Université de Limoges dans le cadre de son parcours académique.

Cet hébergement fait suite à la mise en relation effectuée par l'Association des Étudiants Guinéens de Limoges (AEGL).

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Je soussigné(e) ${host.firstName} ${host.lastName}, résidant au ${address}, certifie sur l'honneur héberger ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName} dans mon domicile, sans contrepartie financière.

Cette attestation est produite à la demande de l'Association des Étudiants Guinéens de Limoges (AEGL) pour permettre à l'intéressé(e) de justifier d'une adresse fixe auprès des services administratifs compétents.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Par la présente attestation, ${accord.leHebergeur(host.gender)} ${host.firstName} ${host.lastName}, occupant(e) du logement au ${address}, déclare mettre gratuitement à disposition son domicile pour loger ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName}.

Cette démarche bénévole est réalisée sous la coordination de l'Association des Étudiants Guinéens de Limoges (AEGL), qui oeuvre activement pour l'intégration et la réussite des étudiants guinéens dans les universités françaises.

La présente attestation est établie pour servir et valoir ce que de droit.`,

  ({ host, student, address }) => `
Attestation sur l'honneur d'hébergement

Je soussigné(e) ${host.firstName} ${host.lastName}, demeurant personnellement au ${address}, atteste héberger à titre entièrement bénévole ${accord.lEtudiant(student.gender)} ${student.firstName} ${student.lastName}, ${accord.etudiant(student.gender)} guinéen(ne) poursuivant des études à l'Université de Limoges.

Cet acte de solidarité est réalisé en partenariat avec l'Association des Étudiants Guinéens de Limoges (AEGL) et reflète les valeurs d'entraide qui caractérisent notre communauté.

La présente attestation est établie pour servir et valoir ce que de droit.`,
];

const duEtudiantCompat = (gender) => gender === 'F' ? "de l'étudiante" : "de l'étudiant";

module.exports = { variants, selectVariant, formatDate, accord };
