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

const PRIVACY_COPY = {
    en: {
        title: 'Privacy Policy',
        heroTitle: 'Your privacy matters',
        heroSubtitle: 'Please read this Privacy Policy carefully to understand how Drite Guide handles personal data.',
        sections: [
            ['Effective date', '16.04.2026'],
            ['1. Who we are', 'Drite Guide is operated by Ard Sadiki, Fortan Zaimi, Deniz Zaimi ("Drite Guide", "we", "us", or "our"). We are the controller of the personal data described in this Privacy Policy unless stated otherwise.\n\nContact:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Scope of this Privacy Policy', 'This Privacy Policy applies to the Drite Guide mobile app, related websites, and related services, unless a separate privacy notice applies to a specific service.'],
            ['3. Personal data we may collect', 'Depending on how you use Drite Guide, we may collect account information, user content and preferences, location data if you grant permission, device and technical information, usage information, and communications you send to us.'],
            ['4. How we collect personal data', 'We collect personal data directly from you, automatically from your device and app usage, from permissions you choose to grant, and from service providers or third-party tools that help us operate the app.'],
            ['5. Why we use personal data', 'We use personal data to provide, maintain, and improve Drite Guide, enable maps and saved places, manage accounts, answer support requests, monitor performance, improve security, prevent abuse, and comply with legal obligations.'],
            ['6. Legal bases for processing', 'Where applicable, we process personal data based on performance of a contract, your consent, our legitimate interests, or compliance with legal obligations.'],
            ['7. Location data', 'If you grant permission, Drite Guide may access your device location to show nearby places, map features, and location-based recommendations. You can disable location access at any time in your device settings.'],
            ['8. Sharing of personal data', 'We do not sell your personal data. We share personal data only where necessary, such as with hosting, infrastructure, analytics, support, authentication, mapping, professional, legal, regulatory, or successor providers.'],
            ['9. Third-party services', 'Drite Guide may rely on third-party services, libraries, or SDKs for maps, location, hosting, authentication, analytics, diagnostics, or notifications. These may include Google Analytics, an authentication provider, and Google Maps.'],
            ['10. International data transfers', 'Your personal data may be processed in countries other than your own. Where required, we take appropriate safeguards to protect personal data.'],
            ['11. Data retention', 'We keep personal data only for as long as necessary for the purposes described in this Privacy Policy, including service delivery, legal obligations, disputes, agreements, security, and business records.'],
            ['12. Data security', 'We use reasonable technical and organizational measures to protect personal data. However, no storage, transmission, or electronic processing method is completely secure.'],
            ['13. Your rights', 'Depending on applicable law, you may request access, correction, deletion, restriction, objection, withdrawal of consent, portability, or lodge a complaint. To exercise your rights, contact driteguide@gmail.com.'],
            ['14. Children\'s privacy', 'Drite Guide is not directed to children under the age required by applicable law to provide valid consent on their own. If you believe a child has provided data unlawfully, please contact us.'],
            ['15. Changes to this Privacy Policy', 'We may update this Privacy Policy from time to time. When we do, we will update the effective date and may provide additional notice if changes are material.'],
            ['16. Contact us', 'If you have questions, requests, or concerns about this Privacy Policy, contact:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    de: {
        title: 'Datenschutzerklaerung',
        heroTitle: 'Deine Privatsphaere ist wichtig',
        heroSubtitle: 'Bitte lies diese Datenschutzerklaerung sorgfaeltig, damit du verstehst, wie Drite Guide personenbezogene Daten verarbeitet.',
        sections: [
            ['Gueltig ab', '16.04.2026'],
            ['1. Wer wir sind', 'Drite Guide wird von Ard Sadiki, Fortan Zaimi und Deniz Zaimi betrieben ("Drite Guide", "wir", "uns" oder "unser"). Wir sind Verantwortliche fuer die in dieser Datenschutzerklaerung beschriebenen personenbezogenen Daten, sofern nichts anderes angegeben ist.\n\nKontakt:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Geltungsbereich', 'Diese Datenschutzerklaerung gilt fuer die mobile App Drite Guide, zugehoerige Webseiten und verbundene Dienste, sofern fuer einen bestimmten Dienst keine separate Datenschutzerklaerung gilt.'],
            ['3. Personenbezogene Daten, die wir erheben koennen', 'Je nachdem, wie du Drite Guide nutzt, koennen wir Kontoinformationen, von dir bereitgestellte Inhalte und Praeferenzen, Standortdaten bei erteilter Erlaubnis, Geraete- und technische Informationen, Nutzungsdaten sowie Mitteilungen an uns verarbeiten.'],
            ['4. Wie wir Daten erheben', 'Wir erheben personenbezogene Daten direkt von dir, automatisch ueber dein Geraet und deine App-Nutzung, ueber von dir erteilte Berechtigungen sowie ueber Dienstleister und Drittanbieter-Tools, die uns beim Betrieb der App helfen.'],
            ['5. Warum wir Daten verwenden', 'Wir verwenden personenbezogene Daten, um Drite Guide bereitzustellen, zu warten und zu verbessern, Karten und gespeicherte Orte zu ermoeglichen, Konten zu verwalten, Supportanfragen zu beantworten, Leistung und Sicherheit zu verbessern, Missbrauch zu verhindern und rechtliche Pflichten zu erfuellen.'],
            ['6. Rechtsgrundlagen', 'Soweit anwendbar, verarbeiten wir personenbezogene Daten auf Grundlage der Vertragserfuellung, deiner Einwilligung, unserer berechtigten Interessen oder gesetzlicher Pflichten.'],
            ['7. Standortdaten', 'Wenn du die Erlaubnis erteilst, kann Drite Guide auf den Standort deines Geraets zugreifen, um Orte in der Naehe, Kartenfunktionen und standortbasierte Empfehlungen anzuzeigen. Du kannst den Zugriff jederzeit in den Geraeteeinstellungen deaktivieren.'],
            ['8. Weitergabe personenbezogener Daten', 'Wir verkaufen deine personenbezogenen Daten nicht. Wir geben Daten nur weiter, wenn es erforderlich ist, etwa an Hosting-, Infrastruktur-, Analyse-, Support-, Authentifizierungs-, Karten-, Beratungs-, Rechts-, Behoerden- oder Nachfolgeanbieter.'],
            ['9. Drittanbieter-Dienste', 'Drite Guide kann Drittanbieter-Dienste, Bibliotheken oder SDKs fuer Karten, Standort, Hosting, Authentifizierung, Analyse, Diagnose oder Benachrichtigungen nutzen. Dazu koennen Google Analytics, ein Authentifizierungsanbieter und Google Maps gehoeren.'],
            ['10. Internationale Datenuebermittlungen', 'Deine personenbezogenen Daten koennen in anderen Laendern verarbeitet werden. Wo erforderlich, setzen wir geeignete Schutzmassnahmen ein.'],
            ['11. Speicherdauer', 'Wir speichern personenbezogene Daten nur so lange, wie es fuer die in dieser Datenschutzerklaerung beschriebenen Zwecke notwendig ist, einschliesslich Dienstbereitstellung, rechtlicher Pflichten, Streitbeilegung, Vereinbarungen, Sicherheit und Geschaeftsunterlagen.'],
            ['12. Datensicherheit', 'Wir nutzen angemessene technische und organisatorische Massnahmen zum Schutz personenbezogener Daten. Keine Speicherung, Uebertragung oder elektronische Verarbeitung ist jedoch vollstaendig sicher.'],
            ['13. Deine Rechte', 'Je nach anwendbarem Recht kannst du Auskunft, Berichtigung, Loeschung, Einschraenkung, Widerspruch, Widerruf einer Einwilligung, Datenuebertragbarkeit oder eine Beschwerde verlangen. Kontaktiere uns dafuer unter driteguide@gmail.com.'],
            ['14. Datenschutz von Kindern', 'Drite Guide richtet sich nicht an Kinder unter dem Alter, in dem sie nach geltendem Recht selbst wirksam einwilligen koennen. Wenn du glaubst, dass ein Kind Daten unrechtmaessig bereitgestellt hat, kontaktiere uns bitte.'],
            ['15. Aenderungen', 'Wir koennen diese Datenschutzerklaerung von Zeit zu Zeit aktualisieren. Dabei aktualisieren wir das Datum und informieren gegebenenfalls zusaetzlich ueber wesentliche Aenderungen.'],
            ['16. Kontakt', 'Bei Fragen, Anfragen oder Bedenken zu dieser Datenschutzerklaerung kontaktiere:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    sq: {
        title: 'Politika e privatesise',
        heroTitle: 'Privatesia jote ka rendesi',
        heroSubtitle: 'Lexoje me kujdes kete politike per te kuptuar si Drite Guide trajton te dhenat personale.',
        sections: [
            ['Data e hyrjes ne fuqi', '16.04.2026'],
            ['1. Kush jemi', 'Drite Guide operohet nga Ard Sadiki, Fortan Zaimi dhe Deniz Zaimi ("Drite Guide", "ne", "na" ose "jona"). Ne jemi kontrolluesi i te dhenave personale te pershkruara ketu, pervec rasteve kur thuhet ndryshe.\n\nKontakt:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Fusha e zbatimit', 'Kjo politike vlen per aplikacionin Drite Guide, faqet e lidhura dhe sherbimet perkatese, pervec kur nje njoftim i vecante privatesie zbatohet per nje sherbim specifik.'],
            ['3. Te dhenat qe mund te mbledhim', 'Ne mund te mbledhim te dhena llogarie, permbajtje dhe preferenca, te dhena vendndodhjeje nese jep leje, informacione teknike te pajisjes, perdorim te aplikacionit dhe komunikime qe na dergon.'],
            ['4. Si i mbledhim te dhenat', 'Te dhenat i mbledhim direkt nga ti, automatikisht nga pajisja dhe perdorimi i aplikacionit, nga lejet qe jep dhe nga ofrues sherbimesh qe na ndihmojne te operojme aplikacionin.'],
            ['5. Pse i perdorim te dhenat', 'I perdorim te dhenat per te ofruar dhe permiresuar Drite Guide, per harta dhe vende te ruajtura, llogari, mbeshtetje, performance, siguri, parandalim abuzimi dhe detyrime ligjore.'],
            ['6. Bazat ligjore', 'Kur zbatohet, perpunimi bazohet ne kontrate, pelqimin tend, interesat tona legjitime ose detyrime ligjore.'],
            ['7. Vendndodhja', 'Me lejen tende, Drite Guide mund te perdore vendndodhjen e pajisjes per vende afer, harta dhe rekomandime. Mund ta caktivizosh ne cdo kohe nga cilesimet e pajisjes.'],
            ['8. Ndarja e te dhenave', 'Ne nuk i shesim te dhenat personale. I ndajme vetem kur eshte e nevojshme me ofrues hostimi, infrastrukture, analitike, mbeshtetjeje, autentikimi, hartash, keshilltare, autoritete ose pasardhes biznesi.'],
            ['9. Sherbime te treta', 'Drite Guide mund te perdore sherbime, biblioteka ose SDK te treta per harta, vendndodhje, hosting, autentikim, analitike, diagnostikim ose njoftime. Ketu mund te perfshihen Google Analytics, nje ofrues autentikimi dhe Google Maps.'],
            ['10. Transferime nderkombetare', 'Te dhenat e tua mund te perpunohen ne vende te tjera. Kur kerkohet, perdorim masa te pershtatshme mbrojtese.'],
            ['11. Ruajtja e te dhenave', 'I ruajme te dhenat vetem sa eshte e nevojshme per qellimet e kesaj politike, perfshire sherbimin, detyrimet ligjore, mosmarreveshjet, marreveshjet, sigurine dhe regjistrat e biznesit.'],
            ['12. Siguria', 'Perdorim masa teknike dhe organizative te arsyeshme, por asnje metode ruajtjeje, transmetimi ose perpunimi elektronik nuk eshte plotesisht e sigurt.'],
            ['13. Te drejtat e tua', 'Sipas ligjit te zbatueshem, mund te kerkosh akses, korrigjim, fshirje, kufizim, kundershtim, terheqje pelqimi, portabilitet ose ankese. Na kontakto ne driteguide@gmail.com.'],
            ['14. Privatesia e femijeve', 'Drite Guide nuk u drejtohet femijeve nen moshen qe kerkohet nga ligji per te dhene pelqim vete. Na kontakto nese beson se nje femije ka dhene te dhena ne menyre te paligjshme.'],
            ['15. Ndryshime', 'Mund ta perditesojme kete politike here pas here dhe do te ndryshojme daten efektive. Per ndryshime te rendesishme mund te japim njoftim shtese.'],
            ['16. Kontakt', 'Per pyetje ose kerkesa rreth kesaj politike, kontakto:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    fr: {
        title: 'Politique de confidentialite',
        heroTitle: 'Ta confidentialite compte',
        heroSubtitle: 'Lis attentivement cette politique pour comprendre comment Drite Guide traite les donnees personnelles.',
        sections: [
            ['Date d entree en vigueur', '16.04.2026'],
            ['1. Qui nous sommes', 'Drite Guide est exploite par Ard Sadiki, Fortan Zaimi et Deniz Zaimi ("Drite Guide", "nous", "notre"). Nous sommes responsables des donnees personnelles decrites ici, sauf indication contraire.\n\nContact:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Champ d application', 'Cette politique s applique a l application mobile Drite Guide, aux sites associes et aux services lies, sauf avis de confidentialite distinct.'],
            ['3. Donnees que nous pouvons collecter', 'Nous pouvons collecter des informations de compte, contenus et preferences, donnees de localisation si tu donnes l autorisation, informations techniques, donnees d utilisation et communications que tu nous envoies.'],
            ['4. Comment nous collectons les donnees', 'Nous collectons les donnees directement aupres de toi, automatiquement depuis ton appareil et l utilisation de l app, via les autorisations accordees et via des prestataires qui nous aident a exploiter l app.'],
            ['5. Pourquoi nous utilisons les donnees', 'Nous utilisons les donnees pour fournir et ameliorer Drite Guide, activer cartes et lieux enregistres, gerer les comptes, repondre au support, surveiller la performance, ameliorer la securite, prevenir les abus et respecter la loi.'],
            ['6. Bases legales', 'Lorsque applicable, nous traitons les donnees sur la base du contrat, de ton consentement, de nos interets legitimes ou d obligations legales.'],
            ['7. Donnees de localisation', 'Avec ton autorisation, Drite Guide peut acceder a la localisation de ton appareil pour afficher des lieux proches, cartes et recommandations. Tu peux la desactiver dans les reglages de l appareil.'],
            ['8. Partage des donnees', 'Nous ne vendons pas tes donnees personnelles. Nous les partageons seulement si necessaire avec des fournisseurs d hebergement, infrastructure, analyse, support, authentification, cartographie, conseil, autorites ou successeurs.'],
            ['9. Services tiers', 'Drite Guide peut utiliser des services, bibliotheques ou SDK tiers pour cartes, localisation, hebergement, authentification, analyse, diagnostic ou notifications, dont Google Analytics, un fournisseur d authentification et Google Maps.'],
            ['10. Transferts internationaux', 'Tes donnees peuvent etre traitees dans d autres pays. Si necessaire, nous mettons en place des garanties appropriees.'],
            ['11. Conservation', 'Nous conservons les donnees seulement aussi longtemps que necessaire pour les finalites de cette politique, y compris service, obligations legales, litiges, accords, securite et archives commerciales.'],
            ['12. Securite', 'Nous utilisons des mesures techniques et organisationnelles raisonnables, mais aucune methode de stockage, transmission ou traitement electronique n est totalement sure.'],
            ['13. Tes droits', 'Selon la loi applicable, tu peux demander acces, correction, suppression, limitation, opposition, retrait du consentement, portabilite ou deposer une plainte. Contacte driteguide@gmail.com.'],
            ['14. Confidentialite des enfants', 'Drite Guide ne vise pas les enfants n ayant pas l age legal pour consentir seuls. Contacte-nous si tu penses qu un enfant a fourni des donnees illicitement.'],
            ['15. Modifications', 'Nous pouvons mettre cette politique a jour. Nous modifierons la date d entree en vigueur et pourrons donner un avis supplementaire en cas de changement important.'],
            ['16. Contact', 'Pour toute question ou demande concernant cette politique, contacte:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    it: {
        title: 'Informativa privacy',
        heroTitle: 'La tua privacy conta',
        heroSubtitle: 'Leggi attentamente questa informativa per capire come Drite Guide tratta i dati personali.',
        sections: [
            ['Data di entrata in vigore', '16.04.2026'],
            ['1. Chi siamo', 'Drite Guide e gestita da Ard Sadiki, Fortan Zaimi e Deniz Zaimi ("Drite Guide", "noi", "nostro"). Siamo titolari dei dati personali descritti qui, salvo diversa indicazione.\n\nContatto:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Ambito', 'Questa informativa si applica all app mobile Drite Guide, ai siti collegati e ai servizi correlati, salvo diversa informativa specifica.'],
            ['3. Dati che possiamo raccogliere', 'Possiamo raccogliere dati account, contenuti e preferenze, posizione se autorizzata, informazioni tecniche del dispositivo, dati d uso e comunicazioni che ci invii.'],
            ['4. Come raccogliamo i dati', 'Raccogliamo dati direttamente da te, automaticamente dal dispositivo e dall uso dell app, dalle autorizzazioni concesse e da fornitori che ci aiutano a gestire l app.'],
            ['5. Perche usiamo i dati', 'Usiamo i dati per fornire e migliorare Drite Guide, abilitare mappe e luoghi salvati, gestire account, rispondere al supporto, monitorare prestazioni, migliorare sicurezza, prevenire abusi e rispettare obblighi legali.'],
            ['6. Basi giuridiche', 'Quando applicabile, trattiamo i dati sulla base di contratto, consenso, interessi legittimi o obblighi legali.'],
            ['7. Posizione', 'Con la tua autorizzazione, Drite Guide puo accedere alla posizione del dispositivo per luoghi vicini, mappe e raccomandazioni. Puoi disattivarla dalle impostazioni del dispositivo.'],
            ['8. Condivisione', 'Non vendiamo i tuoi dati personali. Li condividiamo solo se necessario con fornitori di hosting, infrastruttura, analisi, supporto, autenticazione, mappe, consulenti, autorita o successori.'],
            ['9. Servizi terzi', 'Drite Guide puo usare servizi, librerie o SDK terzi per mappe, posizione, hosting, autenticazione, analisi, diagnostica o notifiche, tra cui Google Analytics, un provider di autenticazione e Google Maps.'],
            ['10. Trasferimenti internazionali', 'I tuoi dati possono essere trattati in altri paesi. Quando richiesto, adottiamo garanzie adeguate.'],
            ['11. Conservazione', 'Conserviamo i dati solo per il tempo necessario alle finalita di questa informativa, inclusi servizio, obblighi legali, controversie, accordi, sicurezza e registri aziendali.'],
            ['12. Sicurezza', 'Usiamo misure tecniche e organizzative ragionevoli, ma nessun metodo di conservazione, trasmissione o trattamento elettronico e completamente sicuro.'],
            ['13. I tuoi diritti', 'Secondo la legge applicabile, puoi chiedere accesso, correzione, cancellazione, limitazione, opposizione, revoca del consenso, portabilita o presentare reclamo. Contatta driteguide@gmail.com.'],
            ['14. Privacy dei minori', 'Drite Guide non e destinata a minori sotto l eta richiesta dalla legge per dare consenso autonomamente. Contattaci se pensi che un minore abbia fornito dati illecitamente.'],
            ['15. Modifiche', 'Possiamo aggiornare questa informativa. Aggiorneremo la data e potremo fornire un avviso aggiuntivo per modifiche importanti.'],
            ['16. Contatto', 'Per domande o richieste su questa informativa, contatta:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
    es: {
        title: 'Politica de privacidad',
        heroTitle: 'Tu privacidad importa',
        heroSubtitle: 'Lee atentamente esta politica para entender como Drite Guide trata los datos personales.',
        sections: [
            ['Fecha de entrada en vigor', '16.04.2026'],
            ['1. Quienes somos', 'Drite Guide esta operada por Ard Sadiki, Fortan Zaimi y Deniz Zaimi ("Drite Guide", "nosotros" o "nuestro"). Somos responsables de los datos personales descritos aqui, salvo que se indique lo contrario.\n\nContacto:\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
            ['2. Alcance', 'Esta politica se aplica a la app movil Drite Guide, sitios relacionados y servicios vinculados, salvo que exista un aviso de privacidad separado.'],
            ['3. Datos que podemos recopilar', 'Podemos recopilar datos de cuenta, contenido y preferencias, ubicacion si das permiso, informacion tecnica del dispositivo, datos de uso y comunicaciones que nos envies.'],
            ['4. Como recopilamos datos', 'Recopilamos datos directamente de ti, automaticamente desde tu dispositivo y uso de la app, desde permisos que concedes y desde proveedores que nos ayudan a operar la app.'],
            ['5. Por que usamos datos', 'Usamos datos para proporcionar y mejorar Drite Guide, habilitar mapas y lugares guardados, gestionar cuentas, responder soporte, supervisar rendimiento, mejorar seguridad, prevenir abusos y cumplir obligaciones legales.'],
            ['6. Bases legales', 'Cuando aplica, tratamos datos sobre la base de contrato, consentimiento, intereses legitimos u obligaciones legales.'],
            ['7. Ubicacion', 'Con tu permiso, Drite Guide puede acceder a la ubicacion de tu dispositivo para lugares cercanos, mapas y recomendaciones. Puedes desactivarla en los ajustes del dispositivo.'],
            ['8. Compartir datos', 'No vendemos tus datos personales. Solo los compartimos cuando es necesario con proveedores de hosting, infraestructura, analitica, soporte, autenticacion, mapas, asesores, autoridades o sucesores.'],
            ['9. Servicios de terceros', 'Drite Guide puede usar servicios, bibliotecas o SDKs de terceros para mapas, ubicacion, hosting, autenticacion, analitica, diagnostico o notificaciones, incluidos Google Analytics, un proveedor de autenticacion y Google Maps.'],
            ['10. Transferencias internacionales', 'Tus datos pueden tratarse en otros paises. Cuando sea necesario, aplicamos salvaguardas adecuadas.'],
            ['11. Conservacion', 'Conservamos los datos solo durante el tiempo necesario para los fines de esta politica, incluidos servicio, obligaciones legales, disputas, acuerdos, seguridad y registros comerciales.'],
            ['12. Seguridad', 'Usamos medidas tecnicas y organizativas razonables, pero ningun metodo de almacenamiento, transmision o tratamiento electronico es completamente seguro.'],
            ['13. Tus derechos', 'Segun la ley aplicable, puedes solicitar acceso, correccion, eliminacion, limitacion, oposicion, retirada de consentimiento, portabilidad o presentar una queja. Contacta driteguide@gmail.com.'],
            ['14. Privacidad de menores', 'Drite Guide no esta dirigida a menores que no tengan la edad legal para consentir por si mismos. Contactanos si crees que un menor proporciono datos ilicitamente.'],
            ['15. Cambios', 'Podemos actualizar esta politica. Actualizaremos la fecha y podemos dar aviso adicional si los cambios son importantes.'],
            ['16. Contacto', 'Para preguntas o solicitudes sobre esta politica, contacta:\n\nArd Sadiki\ndriteguide@gmail.com\n+41 78 727 92 30'],
        ],
    },
};

export default function PrivacyPolicyScreen() {
    const navigation = useNavigation();
    const { language } = useTranslation();
    const copy = PRIVACY_COPY[language] || PRIVACY_COPY.en;

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
                            name="shield-checkmark-outline"
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
