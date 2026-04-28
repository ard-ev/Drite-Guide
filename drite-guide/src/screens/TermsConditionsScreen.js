import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';
import { useTranslation } from '../context/TranslationContext';

const TERMS_COPY = {
    en: {
        title: 'Terms of Use',
        heroTitle: 'Terms of Use',
        heroSubtitle: 'Please read these terms carefully before using Drite Guide.',
        sections: [
            ['Effective date', '16.04.2026'],
            ['1. Operator', 'Drite Guide is operated by Ard Sadiki, Fortan Zaimi, Deniz Zaimi ("Drite Guide", "we", "us", or "our").\n\nContact:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Acceptance of these Terms', 'By accessing or using Drite Guide, you agree to be bound by these Terms of Use. If you do not agree to these Terms, you must not use the app.'],
            ['3. Description of the Service', 'Drite Guide is a travel and discovery application that helps users explore places, cities, and location-based information, including maps, saved places, recommendations, and related content.'],
            ['4. Eligibility and lawful use', 'You agree to use Drite Guide only for lawful purposes and in compliance with applicable laws. You must not misuse the app, interfere with its operation, attempt unauthorized access, or use it in a way that harms us, other users, or third parties.'],
            ['5. User accounts', 'If account creation is available, you are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must provide accurate information and keep it up to date.'],
            ['6. User content and saved data', 'Features such as saved places, preferences, and account-related data are provided for convenience. We aim to maintain reliable service, but we do not guarantee that saved content or app data will always remain available, complete, or error-free.'],
            ['7. Place information and accuracy', 'Drite Guide may display place descriptions, ratings, categories, contact details, opening information, map locations, or other content. We try to keep this useful and accurate, but we do not guarantee that all information is current, complete, accurate, or suitable for your needs.'],
            ['8. Third-party services', 'Drite Guide may rely on or link to third-party services, including mapping, hosting, analytics, authentication, or other external tools. We are not responsible for third-party services, content, availability, or policies.'],
            ['9. Intellectual property', 'All rights in Drite Guide, including software, branding, design, logos, text, graphics, layout, and original content, are owned by or licensed to us unless stated otherwise. You may not copy, reproduce, distribute, modify, reverse engineer, or exploit the app except as permitted by law or with our written consent.'],
            ['10. Prohibited conduct', 'You must not use the app for unlawful, harmful, or fraudulent purposes; interfere with security or technical operation; scrape or extract data without permission; upload malicious code; impersonate another person; or violate the rights of others.'],
            ['11. Availability and changes', 'We may update, modify, suspend, or discontinue any part of Drite Guide at any time. We do not guarantee uninterrupted availability or error-free operation.'],
            ['12. Disclaimer', 'Drite Guide is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, we disclaim all warranties, including merchantability, fitness for a particular purpose, non-infringement, and availability.'],
            ['13. Limitation of liability', 'To the fullest extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, revenue, data, goodwill, or business opportunities related to your use of Drite Guide.'],
            ['14. Indemnification', 'You agree to defend, indemnify, and hold harmless Drite Guide and its operators, affiliates, partners, and service providers from claims, liabilities, damages, losses, and expenses arising from your misuse of the app, violation of these Terms, or violation of third-party rights.'],
            ['15. Suspension and termination', 'We may suspend or terminate your access to Drite Guide if we reasonably believe that you have violated these Terms, caused risk or harm, or used the app unlawfully or abusively.'],
            ['16. Privacy', 'Your use of Drite Guide is also subject to our Privacy Policy, which explains how we collect, use, and protect personal data. Please review it carefully.'],
            ['17. Changes to these Terms', 'We may revise these Terms from time to time. Continued use of the app after updated Terms become effective means that you accept the revised Terms.'],
            ['18. Governing law', 'These Terms are governed by the laws of Albania, excluding conflict of law rules, unless mandatory consumer protection law provides otherwise.'],
            ['19. Contact us', 'If you have questions about these Terms of Use, contact:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    de: {
        title: 'Nutzungsbedingungen',
        heroTitle: 'Nutzungsbedingungen',
        heroSubtitle: 'Bitte lies diese Bedingungen sorgfaeltig, bevor du Drite Guide nutzt.',
        sections: [
            ['Gueltig ab', '16.04.2026'],
            ['1. Betreiber', 'Drite Guide wird von Ard Sadiki, Fortan Zaimi und Deniz Zaimi betrieben ("Drite Guide", "wir", "uns" oder "unser").\n\nKontakt:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Annahme dieser Bedingungen', 'Durch Zugriff auf oder Nutzung von Drite Guide akzeptierst du diese Nutzungsbedingungen. Wenn du nicht einverstanden bist, darfst du die App nicht nutzen.'],
            ['3. Beschreibung des Dienstes', 'Drite Guide ist eine Reise- und Entdeckungs-App, die Nutzer beim Erkunden von Orten, Staedten und standortbezogenen Informationen unterstuetzt, einschliesslich Karten, gespeicherter Orte, Empfehlungen und verwandter Inhalte.'],
            ['4. Berechtigung und rechtmaessige Nutzung', 'Du verpflichtest dich, Drite Guide nur rechtmaessig und im Einklang mit geltendem Recht zu nutzen. Du darfst die App nicht missbrauchen, ihren Betrieb stoeren, unbefugten Zugriff versuchen oder sie auf eine Weise nutzen, die uns, andere Nutzer oder Dritte schaedigt.'],
            ['5. Nutzerkonten', 'Wenn Konten verfuegbar sind, bist du fuer die Vertraulichkeit deiner Zugangsdaten und alle Aktivitaeten unter deinem Konto verantwortlich. Du musst richtige Angaben machen und sie aktuell halten.'],
            ['6. Nutzerinhalte und gespeicherte Daten', 'Funktionen wie gespeicherte Orte, Praeferenzen und kontobezogene Daten dienen der Bequemlichkeit. Wir bemuehen uns um einen zuverlaessigen Dienst, garantieren aber nicht, dass gespeicherte Inhalte oder App-Daten immer verfuegbar, vollstaendig oder fehlerfrei bleiben.'],
            ['7. Ortsinformationen und Genauigkeit', 'Drite Guide kann Beschreibungen, Bewertungen, Kategorien, Kontaktdaten, Oeffnungszeiten, Kartenpositionen oder andere Inhalte anzeigen. Wir versuchen, diese nuetzlich und korrekt zu halten, garantieren aber keine Aktualitaet, Vollstaendigkeit, Richtigkeit oder Eignung fuer deine Zwecke.'],
            ['8. Drittanbieter-Dienste', 'Drite Guide kann Drittanbieter-Dienste nutzen oder verlinken, darunter Karten, Hosting, Analyse, Authentifizierung oder externe Tools. Fuer deren Dienste, Inhalte, Verfuegbarkeit oder Richtlinien sind wir nicht verantwortlich.'],
            ['9. Geistiges Eigentum', 'Alle Rechte an Drite Guide, einschliesslich Software, Marke, Design, Logos, Text, Grafiken, Layout und Originalinhalten, gehoeren uns oder sind an uns lizenziert. Du darfst die App nicht kopieren, vervielfaeltigen, verbreiten, veraendern, reverse engineeren oder verwerten, ausser gesetzlich erlaubt oder mit unserer schriftlichen Zustimmung.'],
            ['10. Verbotenes Verhalten', 'Du darfst die App nicht fuer rechtswidrige, schaedliche oder betruegerische Zwecke nutzen, die Sicherheit oder Technik stoeren, Daten ohne Erlaubnis auslesen, Schadcode hochladen, dich als andere Person ausgeben oder Rechte Dritter verletzen.'],
            ['11. Verfuegbarkeit und Aenderungen', 'Wir koennen Teile von Drite Guide jederzeit aktualisieren, aendern, aussetzen oder einstellen. Wir garantieren keine unterbrechungsfreie Verfuegbarkeit oder fehlerfreie Funktion.'],
            ['12. Haftungsausschluss', 'Drite Guide wird "wie besehen" und "wie verfuegbar" bereitgestellt. Soweit gesetzlich zulaessig, schliessen wir alle Gewaehrleistungen aus, einschliesslich Marktgaengigkeit, Eignung fuer einen bestimmten Zweck, Nichtverletzung und Verfuegbarkeit.'],
            ['13. Haftungsbeschraenkung', 'Soweit gesetzlich zulaessig, haften wir nicht fuer indirekte, zufaellige, besondere, Folge- oder Strafschaeden oder fuer entgangene Gewinne, Umsaetze, Daten, Goodwill oder Geschaeftsmoeglichkeiten im Zusammenhang mit der Nutzung von Drite Guide.'],
            ['14. Freistellung', 'Du stimmst zu, Drite Guide und seine Betreiber, Partner und Dienstleister von Anspruechen, Haftungen, Schaeden, Verlusten und Kosten freizustellen, die aus deinem Missbrauch der App, einem Verstoss gegen diese Bedingungen oder der Verletzung von Rechten Dritter entstehen.'],
            ['15. Aussetzung und Beendigung', 'Wir koennen deinen Zugriff auf Drite Guide aussetzen oder beenden, wenn wir vernuenftig annehmen, dass du diese Bedingungen verletzt, Risiken oder Schaeden verursacht oder die App rechtswidrig oder missbraeuchlich genutzt hast.'],
            ['16. Datenschutz', 'Deine Nutzung von Drite Guide unterliegt auch unserer Datenschutzerklaerung, die erklaert, wie wir personenbezogene Daten erheben, nutzen und schuetzen. Bitte lies sie sorgfaeltig.'],
            ['17. Aenderungen dieser Bedingungen', 'Wir koennen diese Bedingungen von Zeit zu Zeit ueberarbeiten. Die weitere Nutzung der App nach Inkrafttreten aktualisierter Bedingungen bedeutet, dass du sie akzeptierst.'],
            ['18. Anwendbares Recht', 'Diese Bedingungen unterliegen dem Recht Albaniens unter Ausschluss des Kollisionsrechts, sofern zwingender Verbraucherschutz nichts anderes vorsieht.'],
            ['19. Kontakt', 'Bei Fragen zu diesen Nutzungsbedingungen kontaktiere:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    sq: {
        title: 'Kushtet e perdorimit',
        heroTitle: 'Kushtet e perdorimit',
        heroSubtitle: 'Lexoji me kujdes keto kushte para se te perdoresh Drite Guide.',
        sections: [
            ['Data e hyrjes ne fuqi', '16.04.2026'],
            ['1. Operatori', 'Drite Guide operohet nga Ard Sadiki, Fortan Zaimi dhe Deniz Zaimi ("Drite Guide", "ne", "na" ose "jona").\n\nKontakt:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Pranimi i kushteve', 'Duke hyre ose perdorur Drite Guide, pranon keto kushte perdorimi. Nese nuk pajtohesh, nuk duhet ta perdoresh aplikacionin.'],
            ['3. Pershkrimi i sherbimit', 'Drite Guide eshte aplikacion udhetimi dhe zbulimi qe ndihmon perdoruesit te eksplorojne vende, qytete dhe informacione te bazuara ne vendndodhje, perfshire harta, vende te ruajtura dhe rekomandime.'],
            ['4. Perdorim i ligjshem', 'Duhet ta perdoresh Drite Guide vetem per qellime te ligjshme dhe ne perputhje me ligjin. Nuk lejohet keqperdorimi, nderhyrja ne funksionim, qasja e paautorizuar ose perdorimi qe demton ne, perdoruesit ose palet e treta.'],
            ['5. Llogarite', 'Nese krijimi i llogarise eshte i disponueshem, je pergjegjes per ruajtjen e kredencialeve dhe per cdo aktivitet ne llogarine tende. Informacioni duhet te jete i sakte dhe i perditesuar.'],
            ['6. Permbajtja dhe te dhenat e ruajtura', 'Vendet e ruajtura, preferencat dhe te dhenat e llogarise ofrohen per lehtesi. Synojme sherbim te besueshem, por nuk garantojme qe permbajtja ose te dhenat do te jene gjithmone te disponueshme, te plota ose pa gabime.'],
            ['7. Informacioni per vendet', 'Drite Guide mund te shfaqe pershkrime, vleresime, kategori, kontakte, orare, vendndodhje ne harte ose permbajtje tjeter. Perpiqemi ta mbajme te dobishem dhe te sakte, por nuk garantojme aktualitet, plotesi ose pershtatshmeri.'],
            ['8. Sherbime te treta', 'Drite Guide mund te perdore ose lidhet me sherbime te treta si harta, hosting, analitike, autentikim ose mjete te jashtme. Ne nuk jemi pergjegjes per keto sherbime, permbajtje, disponueshmeri ose politika.'],
            ['9. Pronesia intelektuale', 'Te gjitha te drejtat ne Drite Guide, perfshire softuerin, marken, dizajnin, logot, tekstin, grafikat dhe permbajtjen origjinale, jane tone ose te licencuara per ne. Nuk lejohet kopjimi, shperndarja, modifikimi, reverse engineering ose shfrytezimi pa leje, pervec kur lejohet nga ligji.'],
            ['10. Sjellje e ndaluar', 'Nuk lejohet perdorimi i aplikacionit per qellime te paligjshme, te demshme ose mashtruese; nderhyrja ne sigurine ose tekniken; nxjerrja e te dhenave pa leje; ngarkimi i kodit keqdashes; imitimi i personave; ose shkelja e te drejtave te te tjereve.'],
            ['11. Disponueshmeria dhe ndryshimet', 'Mund te perditesojme, ndryshojme, pezullojme ose nderpresim cdo pjese te Drite Guide ne cdo kohe. Nuk garantojme disponueshmeri te pandalshme ose funksionim pa gabime.'],
            ['12. Mohim garancie', 'Drite Guide ofrohet "sic eshte" dhe "sic eshte i disponueshem". Ne masen maksimale te lejuar nga ligji, mohojme te gjitha garancite, perfshire pershtatshmerine tregtare, pershtatshmerine per nje qellim te caktuar, mos-shkeljen dhe disponueshmerine.'],
            ['13. Kufizim pergjegjesie', 'Ne masen e lejuar nga ligji, nuk mbajme pergjegjesi per deme indirekte, te rastit, te vecanta, pasuese ose ndeshkuese, apo humbje fitimi, te ardhurash, te dhenash, reputacioni ose mundesish biznesi nga perdorimi i Drite Guide.'],
            ['14. Demshperblim', 'Pranon te mbrosh dhe demshperblesh Drite Guide, operatoret, partneret dhe ofruesit e sherbimeve nga pretendime, pergjegjesi, deme, humbje dhe shpenzime qe vijne nga keqperdorimi i aplikacionit, shkelja e kushteve ose e te drejtave te paleve te treta.'],
            ['15. Pezullim dhe perfundim', 'Mund te pezullojme ose perfundojme qasjen tende ne Drite Guide nese besojme arsyeshem se ke shkelur keto kushte, ke shkaktuar rrezik ose dem, ose e ke perdorur aplikacionin ne menyre te paligjshme ose abuzive.'],
            ['16. Privatesia', 'Perdorimi i Drite Guide i nenshtrohet edhe Politikes se Privatesise, e cila shpjegon si mbledhim, perdorim dhe mbrojme te dhenat personale.'],
            ['17. Ndryshime te kushteve', 'Mund t i ndryshojme keto kushte here pas here. Perdorimi i vazhdueshem pas hyrjes ne fuqi te kushteve te reja do te thote se i pranon ato.'],
            ['18. Ligji i zbatueshem', 'Keto kushte rregullohen nga ligjet e Shqiperise, pa rregullat e konfliktit te ligjeve, pervec kur mbrojtja e detyrueshme e konsumatorit parashikon ndryshe.'],
            ['19. Kontakt', 'Per pyetje rreth ketyre kushteve, kontakto:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    fr: {
        title: 'Conditions d utilisation',
        heroTitle: 'Conditions d utilisation',
        heroSubtitle: 'Lis attentivement ces conditions avant d utiliser Drite Guide.',
        sections: [
            ['Date d entree en vigueur', '16.04.2026'],
            ['1. Operateur', 'Drite Guide est exploite par Ard Sadiki, Fortan Zaimi et Deniz Zaimi ("Drite Guide", "nous", "notre").\n\nContact:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Acceptation', 'En accedant a Drite Guide ou en l utilisant, tu acceptes ces conditions. Si tu ne les acceptes pas, tu ne dois pas utiliser l app.'],
            ['3. Description du service', 'Drite Guide est une application de voyage et de decouverte qui aide a explorer des lieux, villes et informations de localisation, avec cartes, lieux enregistres, recommandations et contenus associes.'],
            ['4. Utilisation licite', 'Tu dois utiliser Drite Guide uniquement a des fins licites et conformes a la loi. Tu ne dois pas abuser de l app, perturber son fonctionnement, tenter un acces non autorise ou l utiliser d une facon nuisible.'],
            ['5. Comptes utilisateur', 'Si les comptes sont disponibles, tu es responsable de tes identifiants et de toute activite sous ton compte. Les informations fournies doivent etre exactes et a jour.'],
            ['6. Contenu et donnees enregistrees', 'Les lieux enregistres, preferences et donnees de compte sont fournis pour faciliter l utilisation. Nous visons un service fiable, mais ne garantissons pas que ces donnees restent toujours disponibles, completes ou sans erreur.'],
            ['7. Informations sur les lieux', 'Drite Guide peut afficher descriptions, notes, categories, contacts, horaires, positions sur carte ou autres contenus. Nous essayons de les garder utiles et exacts, sans garantir leur actualite, exhaustivite ou adaptation a tes besoins.'],
            ['8. Services tiers', 'Drite Guide peut utiliser ou lier des services tiers comme cartographie, hebergement, analyse, authentification ou outils externes. Nous ne sommes pas responsables de leurs services, contenus, disponibilite ou politiques.'],
            ['9. Propriete intellectuelle', 'Tous les droits sur Drite Guide, y compris logiciel, marque, design, logos, textes, graphiques et contenus originaux, nous appartiennent ou nous sont licencies. Tu ne peux pas copier, distribuer, modifier, desassembler ou exploiter l app sauf autorisation legale ou accord ecrit.'],
            ['10. Conduite interdite', 'Tu ne dois pas utiliser l app a des fins illegales, nuisibles ou frauduleuses; perturber sa securite ou technique; extraire des donnees sans permission; envoyer du code malveillant; usurper une identite; ou violer les droits d autrui.'],
            ['11. Disponibilite et changements', 'Nous pouvons mettre a jour, modifier, suspendre ou arreter toute partie de Drite Guide a tout moment. Nous ne garantissons pas une disponibilite continue ni un fonctionnement sans erreur.'],
            ['12. Clause de non-garantie', 'Drite Guide est fourni "tel quel" et "selon disponibilite". Dans la limite permise par la loi, nous excluons toute garantie, y compris qualite marchande, aptitude a un usage particulier, absence de contrefacon et disponibilite.'],
            ['13. Limitation de responsabilite', 'Dans la limite permise par la loi, nous ne sommes pas responsables des dommages indirects, accessoires, speciaux, consecutifs ou punitifs, ni des pertes de profits, revenus, donnees, goodwill ou opportunites liees a l utilisation de Drite Guide.'],
            ['14. Indemnisation', 'Tu acceptes de defendre et indemniser Drite Guide, ses operateurs, partenaires et prestataires contre les reclamations, responsabilites, dommages, pertes et depenses provenant de ton mauvais usage de l app, de la violation des conditions ou des droits de tiers.'],
            ['15. Suspension et resiliation', 'Nous pouvons suspendre ou resilier ton acces a Drite Guide si nous pensons raisonnablement que tu as viole ces conditions, cause un risque ou dommage, ou utilise l app illicitement ou abusivement.'],
            ['16. Confidentialite', 'Ton utilisation de Drite Guide est aussi soumise a notre Politique de confidentialite, qui explique comment nous collectons, utilisons et protegeons les donnees personnelles.'],
            ['17. Modifications', 'Nous pouvons reviser ces conditions. Continuer a utiliser l app apres leur entree en vigueur signifie que tu les acceptes.'],
            ['18. Droit applicable', 'Ces conditions sont regies par le droit albanais, hors regles de conflit de lois, sauf protection obligatoire du consommateur contraire.'],
            ['19. Contact', 'Pour toute question sur ces conditions, contacte:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    it: {
        title: 'Termini di utilizzo',
        heroTitle: 'Termini di utilizzo',
        heroSubtitle: 'Leggi attentamente questi termini prima di usare Drite Guide.',
        sections: [
            ['Data di entrata in vigore', '16.04.2026'],
            ['1. Operatore', 'Drite Guide e gestita da Ard Sadiki, Fortan Zaimi e Deniz Zaimi ("Drite Guide", "noi", "nostro").\n\nContatto:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Accettazione', 'Accedendo o usando Drite Guide, accetti questi termini. Se non li accetti, non devi usare l app.'],
            ['3. Descrizione del servizio', 'Drite Guide e un app di viaggio e scoperta che aiuta a esplorare luoghi, citta e informazioni basate sulla posizione, inclusi mappe, luoghi salvati, raccomandazioni e contenuti collegati.'],
            ['4. Uso lecito', 'Devi usare Drite Guide solo per scopi leciti e conformi alla legge. Non devi abusare dell app, interferire con il funzionamento, tentare accessi non autorizzati o usarla in modo dannoso.'],
            ['5. Account utente', 'Se gli account sono disponibili, sei responsabile delle credenziali e di ogni attivita sotto il tuo account. Le informazioni devono essere accurate e aggiornate.'],
            ['6. Contenuti e dati salvati', 'Luoghi salvati, preferenze e dati account sono forniti per comodita. Puntiamo a un servizio affidabile, ma non garantiamo che contenuti o dati restino sempre disponibili, completi o privi di errori.'],
            ['7. Informazioni sui luoghi', 'Drite Guide puo mostrare descrizioni, valutazioni, categorie, contatti, orari, posizioni mappa o altri contenuti. Cerchiamo di mantenerli utili e accurati, senza garantire attualita, completezza o idoneita alle tue esigenze.'],
            ['8. Servizi terzi', 'Drite Guide puo usare o collegare servizi terzi come mappe, hosting, analisi, autenticazione o strumenti esterni. Non siamo responsabili dei loro servizi, contenuti, disponibilita o politiche.'],
            ['9. Proprieta intellettuale', 'Tutti i diritti su Drite Guide, inclusi software, marchio, design, loghi, testi, grafiche e contenuti originali, sono nostri o concessi in licenza. Non puoi copiare, distribuire, modificare, decodificare o sfruttare l app salvo consenso scritto o legge applicabile.'],
            ['10. Condotta vietata', 'Non devi usare l app per scopi illeciti, dannosi o fraudolenti; interferire con sicurezza o tecnica; estrarre dati senza permesso; caricare codice malevolo; impersonare altri; o violare diritti di terzi.'],
            ['11. Disponibilita e modifiche', 'Possiamo aggiornare, modificare, sospendere o interrompere qualsiasi parte di Drite Guide in ogni momento. Non garantiamo disponibilita continua o funzionamento senza errori.'],
            ['12. Esclusione di garanzie', 'Drite Guide e fornita "cosi com e" e "secondo disponibilita". Nella misura consentita dalla legge, escludiamo ogni garanzia, incluse commerciabilita, idoneita a uno scopo specifico, non violazione e disponibilita.'],
            ['13. Limitazione di responsabilita', 'Nella misura consentita dalla legge, non siamo responsabili per danni indiretti, incidentali, speciali, consequenziali o punitivi, ne per perdite di profitti, ricavi, dati, avviamento o opportunita legate all uso di Drite Guide.'],
            ['14. Manleva', 'Accetti di difendere e manlevare Drite Guide, operatori, partner e fornitori da reclami, responsabilita, danni, perdite e spese derivanti da uso improprio dell app, violazione dei termini o diritti di terzi.'],
            ['15. Sospensione e cessazione', 'Possiamo sospendere o terminare il tuo accesso a Drite Guide se riteniamo ragionevolmente che tu abbia violato questi termini, causato rischio o danno, o usato l app illegalmente o abusivamente.'],
            ['16. Privacy', 'L uso di Drite Guide e soggetto anche alla nostra Informativa privacy, che spiega come raccogliamo, usiamo e proteggiamo i dati personali.'],
            ['17. Modifiche', 'Possiamo modificare questi termini. Continuare a usare l app dopo l entrata in vigore dei termini aggiornati significa accettarli.'],
            ['18. Legge applicabile', 'Questi termini sono regolati dalle leggi dell Albania, escluse le regole sul conflitto di leggi, salvo diversa protezione obbligatoria del consumatore.'],
            ['19. Contatto', 'Per domande su questi termini, contatta:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    es: {
        title: 'Terminos de uso',
        heroTitle: 'Terminos de uso',
        heroSubtitle: 'Lee atentamente estos terminos antes de usar Drite Guide.',
        sections: [
            ['Fecha de entrada en vigor', '16.04.2026'],
            ['1. Operador', 'Drite Guide esta operada por Ard Sadiki, Fortan Zaimi y Deniz Zaimi ("Drite Guide", "nosotros" o "nuestro").\n\nContacto:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Aceptacion', 'Al acceder o usar Drite Guide, aceptas estos terminos. Si no los aceptas, no debes usar la app.'],
            ['3. Descripcion del servicio', 'Drite Guide es una app de viaje y descubrimiento que ayuda a explorar lugares, ciudades e informacion basada en ubicacion, incluyendo mapas, lugares guardados, recomendaciones y contenido relacionado.'],
            ['4. Uso legal', 'Debes usar Drite Guide solo para fines legales y conforme a la ley. No debes abusar de la app, interferir con su funcionamiento, intentar acceso no autorizado ni usarla de forma danina.'],
            ['5. Cuentas de usuario', 'Si las cuentas estan disponibles, eres responsable de tus credenciales y de toda actividad en tu cuenta. La informacion debe ser precisa y estar actualizada.'],
            ['6. Contenido y datos guardados', 'Lugares guardados, preferencias y datos de cuenta se ofrecen por conveniencia. Buscamos un servicio fiable, pero no garantizamos que el contenido o los datos esten siempre disponibles, completos o sin errores.'],
            ['7. Informacion de lugares', 'Drite Guide puede mostrar descripciones, valoraciones, categorias, contactos, horarios, ubicaciones en mapa u otros contenidos. Intentamos mantenerlos utiles y precisos, pero no garantizamos actualidad, integridad o adecuacion a tus necesidades.'],
            ['8. Servicios de terceros', 'Drite Guide puede usar o enlazar servicios de terceros como mapas, hosting, analitica, autenticacion u otras herramientas externas. No somos responsables de esos servicios, contenido, disponibilidad o politicas.'],
            ['9. Propiedad intelectual', 'Todos los derechos sobre Drite Guide, incluidos software, marca, diseno, logos, textos, graficos y contenido original, son nuestros o estan licenciados. No puedes copiar, distribuir, modificar, aplicar ingenieria inversa o explotar la app salvo permiso escrito o autorizacion legal.'],
            ['10. Conducta prohibida', 'No debes usar la app para fines ilegales, daninos o fraudulentos; interferir con seguridad o tecnologia; extraer datos sin permiso; cargar codigo malicioso; suplantar a otra persona; o violar derechos de terceros.'],
            ['11. Disponibilidad y cambios', 'Podemos actualizar, modificar, suspender o discontinuar cualquier parte de Drite Guide en cualquier momento. No garantizamos disponibilidad continua ni funcionamiento sin errores.'],
            ['12. Descargo de garantias', 'Drite Guide se proporciona "tal cual" y "segun disponibilidad". En la maxima medida permitida por la ley, rechazamos todas las garantias, incluidas comerciabilidad, idoneidad para un fin particular, no infraccion y disponibilidad.'],
            ['13. Limitacion de responsabilidad', 'En la maxima medida permitida por la ley, no somos responsables por danos indirectos, incidentales, especiales, consecuentes o punitivos, ni por perdidas de beneficios, ingresos, datos, reputacion u oportunidades relacionadas con Drite Guide.'],
            ['14. Indemnizacion', 'Aceptas defender e indemnizar a Drite Guide, operadores, socios y proveedores frente a reclamaciones, responsabilidades, danos, perdidas y gastos derivados del mal uso de la app, violacion de estos terminos o derechos de terceros.'],
            ['15. Suspension y terminacion', 'Podemos suspender o terminar tu acceso a Drite Guide si creemos razonablemente que violaste estos terminos, causaste riesgo o dano, o usaste la app de forma ilegal o abusiva.'],
            ['16. Privacidad', 'Tu uso de Drite Guide tambien esta sujeto a nuestra Politica de privacidad, que explica como recopilamos, usamos y protegemos datos personales.'],
            ['17. Cambios', 'Podemos revisar estos terminos. Seguir usando la app despues de que entren en vigor los terminos actualizados significa que los aceptas.'],
            ['18. Ley aplicable', 'Estos terminos se rigen por las leyes de Albania, excluyendo normas de conflicto de leyes, salvo que la proteccion obligatoria del consumidor disponga otra cosa.'],
            ['19. Contacto', 'Si tienes preguntas sobre estos terminos, contacta:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
};

export default function TermsConditionsScreen() {
    const navigation = useNavigation();
    const { language } = useTranslation();
    const copy = TERMS_COPY[language] || TERMS_COPY.en;

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <StatusBar style="dark" />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backButton}
                            activeOpacity={0.85}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={22} color="#222222" />
                        </TouchableOpacity>

                        <Text style={styles.title}>{copy.title}</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.heroCard}>
                        <Ionicons
                            name="document-text-outline"
                            size={42}
                            color={colors.primary}
                        />
                        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
                        <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
                    </View>

                    {copy.sections.map(([sectionTitle, sectionText]) => (
                        <View key={sectionTitle} style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                            <Text style={styles.sectionText}>{sectionText}</Text>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },

    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },

    content: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    headerSpacer: {
        width: 42,
        height: 42,
    },

    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#222222',
        textAlign: 'center',
    },

    heroCard: {
        backgroundColor: colors.primary + '12',
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 22,
        marginBottom: 24,
        alignItems: 'center',
    },

    heroTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#222222',
        marginTop: 12,
        marginBottom: 6,
        textAlign: 'center',
    },

    heroSubtitle: {
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
        textAlign: 'center',
    },

    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginBottom: 14,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#222222',
        marginBottom: 8,
    },

    sectionText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
        marginBottom: 10,
    },
});
