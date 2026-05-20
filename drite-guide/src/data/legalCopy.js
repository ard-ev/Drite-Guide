const LEGAL_CONTACT = [
  'Ard Sadiki',
  'support@driteguide.com',
  '+41 78 727 92 30',
].join('\n');

const EFFECTIVE_DATE = '20.05.2026';

export const legalCopy = {
  privacy: {
    icon: 'shield-checkmark-outline',
    en: {
      title: 'Privacy Policy',
      heroTitle: 'Privacy Policy',
      heroSubtitle:
        'How Drite Guide collects, uses, stores, shares, and protects personal data.',
      sections: [
        {
          title: 'Effective date',
          body: [EFFECTIVE_DATE],
        },
        {
          title: '1. Controller and contact',
          body: [
            `Drite Guide is operated by Ard Sadiki. Unless stated otherwise, Ard Sadiki is the controller responsible for the personal data processed through Drite Guide.`,
            `Legal and privacy contact:\n${LEGAL_CONTACT}`,
          ],
        },
        {
          title: '2. Scope',
          body: [
            'This Privacy Policy applies to the Drite Guide mobile application, website, backend services, account features, support channels, and related services.',
            'If a third-party service linked from Drite Guide has its own privacy notice, that notice applies to the third-party service.',
          ],
        },
        {
          title: '3. Personal data we process',
          body: [
            'We may process account data such as name, username, email address, password hash, email verification status, profile picture, preferred language, and notification settings.',
            'We may process app activity such as saved places, trips, invited users, follows, reviews, search history, favorites, preferences, support messages, and settings.',
            'If you grant permission, we may process location data to show nearby places, maps, directions, and location-based recommendations.',
            'We may process technical data such as device type, operating system, app version, IP address, logs, security events, diagnostics, and crash information.',
          ],
        },
        {
          title: '4. Purposes',
          body: [
            'We process personal data to create and secure accounts, provide the app, save preferences, show places and maps, manage trips, enable social and saved-place features, send account and notification emails, answer support requests, prevent abuse, improve reliability, and comply with legal obligations.',
            'Email notifications and content updates are sent only where enabled and may come from info@driteguide.com.',
          ],
        },
        {
          title: '5. Legal bases',
          body: [
            'Where applicable, we rely on performance of a contract to provide requested app features, your consent for optional permissions and non-essential technologies, legitimate interests in security and service improvement, and legal obligations where we must keep or disclose data.',
            'You can withdraw consent for optional permissions such as location through your device settings or app settings where available.',
          ],
        },
        {
          title: '6. Sharing of data',
          body: [
            'We do not sell personal data. We share data only where needed with service providers such as hosting, database, email delivery, authentication, maps, analytics, crash reporting, customer support, legal advisors, authorities, or successors in a business transfer.',
            'Service providers may process data only for the purposes needed to provide their services to us, unless they act as independent controllers under their own terms.',
          ],
        },
        {
          title: '7. International transfers',
          body: [
            'Your data may be processed in Switzerland, the European Economic Area, Albania, the United States, or other countries where our providers operate.',
            'Where required, we use appropriate safeguards such as contractual commitments, adequacy decisions, or other legally recognized transfer mechanisms.',
          ],
        },
        {
          title: '8. Retention',
          body: [
            'We keep personal data only as long as needed for the purposes described in this Privacy Policy. Account data is generally kept while your account exists. Some records may be kept longer for security, legal, tax, dispute, backup, or abuse-prevention reasons.',
            'When data is no longer needed, we delete it or anonymize it where reasonably possible.',
          ],
        },
        {
          title: '9. Your rights',
          body: [
            'Depending on applicable law, you may have the right to request access, correction, deletion, restriction, objection, portability, withdrawal of consent, and information about recipients or international transfers.',
            `To exercise your rights, contact us at:\n${LEGAL_CONTACT}`,
            'We may need to verify your identity before responding. You may also have the right to contact the competent data protection authority, including the Swiss Federal Data Protection and Information Commissioner where applicable.',
          ],
        },
        {
          title: '10. Security',
          body: [
            'We use reasonable technical and organizational measures to protect personal data against unauthorized access, loss, misuse, alteration, and disclosure.',
            'No app, network, or storage system can be guaranteed to be completely secure.',
          ],
        },
        {
          title: '11. Children',
          body: [
            'Drite Guide is not intended for children under 16 or under the age required by local law to use digital services without parental consent.',
            'If you believe a child has provided personal data unlawfully, contact us so we can review and delete it where appropriate.',
          ],
        },
        {
          title: '12. Changes',
          body: [
            'We may update this Privacy Policy when our services, laws, or processing activities change. The updated version applies from the effective date shown in the app unless mandatory law requires otherwise.',
          ],
        },
      ],
    },
    de: {
      title: 'Datenschutzerklaerung',
      heroTitle: 'Datenschutzerklaerung',
      heroSubtitle:
        'Wie Drite Guide personenbezogene Daten erhebt, nutzt, speichert, teilt und schuetzt.',
      sections: [
        {
          title: 'Gueltig ab',
          body: [EFFECTIVE_DATE],
        },
        {
          title: '1. Verantwortlicher und Kontakt',
          body: [
            'Drite Guide wird von Ard Sadiki betrieben. Sofern nicht anders angegeben, ist Ard Sadiki der Verantwortliche fuer die Verarbeitung personenbezogener Daten ueber Drite Guide.',
            `Kontakt fuer Datenschutz und Rechtliches:\n${LEGAL_CONTACT}`,
          ],
        },
        {
          title: '2. Geltungsbereich',
          body: [
            'Diese Datenschutzerklaerung gilt fuer die mobile App Drite Guide, die Website, Backend-Dienste, Kontofunktionen, Supportkanaele und verbundene Dienste.',
            'Wenn ein verlinkter Drittanbieter eine eigene Datenschutzerklaerung hat, gilt diese fuer den jeweiligen Drittanbieterdienst.',
          ],
        },
        {
          title: '3. Verarbeitete Daten',
          body: [
            'Wir koennen Kontodaten wie Name, Benutzername, E-Mail-Adresse, Passwort-Hash, E-Mail-Verifizierungsstatus, Profilbild, bevorzugte Sprache und Benachrichtigungseinstellungen verarbeiten.',
            'Wir koennen App-Aktivitaeten wie gespeicherte Orte, Reisen, eingeladene Nutzer, Follows, Bewertungen, Suchverlauf, Favoriten, Praeferenzen, Supportnachrichten und Einstellungen verarbeiten.',
            'Wenn du die Erlaubnis erteilst, koennen wir Standortdaten verarbeiten, um Orte in der Naehe, Karten, Navigation und standortbasierte Empfehlungen anzuzeigen.',
            'Wir koennen technische Daten wie Geraetetyp, Betriebssystem, App-Version, IP-Adresse, Logs, Sicherheitsereignisse, Diagnose- und Absturzinformationen verarbeiten.',
          ],
        },
        {
          title: '4. Zwecke',
          body: [
            'Wir verarbeiten personenbezogene Daten, um Konten zu erstellen und zu schuetzen, die App bereitzustellen, Praeferenzen zu speichern, Orte und Karten anzuzeigen, Reisen zu verwalten, soziale Funktionen und gespeicherte Orte zu ermoeglichen, Konto- und Benachrichtigungs-E-Mails zu senden, Supportanfragen zu beantworten, Missbrauch zu verhindern, Zuverlaessigkeit zu verbessern und gesetzliche Pflichten zu erfuellen.',
            'E-Mail-Benachrichtigungen und Inhaltsupdates werden nur gesendet, wenn sie aktiviert sind, und koennen von info@driteguide.com kommen.',
          ],
        },
        {
          title: '5. Rechtsgrundlagen',
          body: [
            'Soweit anwendbar, stuetzen wir uns auf Vertragserfuellung fuer angeforderte App-Funktionen, deine Einwilligung fuer optionale Berechtigungen und nicht notwendige Technologien, berechtigte Interessen an Sicherheit und Verbesserung des Dienstes sowie gesetzliche Pflichten.',
            'Einwilligungen fuer optionale Berechtigungen wie Standort kannst du ueber deine Geraeteeinstellungen oder verfuegbare App-Einstellungen widerrufen.',
          ],
        },
        {
          title: '6. Weitergabe',
          body: [
            'Wir verkaufen keine personenbezogenen Daten. Wir geben Daten nur weiter, soweit dies erforderlich ist, etwa an Anbieter fuer Hosting, Datenbank, E-Mail-Versand, Authentifizierung, Karten, Analyse, Absturzberichte, Kundensupport, Rechtsberatung, Behoerden oder Nachfolger bei einer Geschaeftsuebertragung.',
            'Dienstleister duerfen Daten nur fuer die erforderlichen Dienstleistungszwecke verarbeiten, sofern sie nicht als eigene Verantwortliche nach eigenen Bedingungen handeln.',
          ],
        },
        {
          title: '7. Internationale Uebermittlungen',
          body: [
            'Deine Daten koennen in der Schweiz, im Europaeischen Wirtschaftsraum, in Albanien, den USA oder anderen Laendern verarbeitet werden, in denen unsere Anbieter taetig sind.',
            'Soweit erforderlich, nutzen wir geeignete Schutzmassnahmen wie vertragliche Verpflichtungen, Angemessenheitsbeschluesse oder andere rechtlich anerkannte Mechanismen.',
          ],
        },
        {
          title: '8. Speicherdauer',
          body: [
            'Wir speichern personenbezogene Daten nur so lange, wie es fuer die beschriebenen Zwecke notwendig ist. Kontodaten werden in der Regel gespeichert, solange dein Konto besteht. Manche Daten koennen aus Sicherheits-, Rechts-, Steuer-, Streitbeilegungs-, Backup- oder Missbrauchspraeventionsgruenden laenger aufbewahrt werden.',
            'Wenn Daten nicht mehr benoetigt werden, loeschen oder anonymisieren wir sie, soweit dies vernuenftig moeglich ist.',
          ],
        },
        {
          title: '9. Deine Rechte',
          body: [
            'Je nach anwendbarem Recht kannst du Auskunft, Berichtigung, Loeschung, Einschraenkung, Widerspruch, Datenuebertragbarkeit, Widerruf einer Einwilligung sowie Informationen zu Empfaengern oder internationalen Uebermittlungen verlangen.',
            `Zur Ausuebung deiner Rechte kontaktiere uns unter:\n${LEGAL_CONTACT}`,
            'Wir muessen gegebenenfalls deine Identitaet pruefen. Du kannst dich ausserdem an die zustaendige Datenschutzbehoerde wenden, soweit anwendbar auch an den Eidgenoessischen Datenschutz- und Oeffentlichkeitsbeauftragten.',
          ],
        },
        {
          title: '10. Sicherheit',
          body: [
            'Wir nutzen angemessene technische und organisatorische Massnahmen, um personenbezogene Daten vor unbefugtem Zugriff, Verlust, Missbrauch, Veraenderung und Offenlegung zu schuetzen.',
            'Keine App, kein Netzwerk und kein Speichersystem kann vollstaendig sicher sein.',
          ],
        },
        {
          title: '11. Kinder',
          body: [
            'Drite Guide richtet sich nicht an Kinder unter 16 Jahren oder unter dem Alter, ab dem digitale Dienste nach lokalem Recht ohne elterliche Einwilligung genutzt werden duerfen.',
            'Wenn du glaubst, dass ein Kind personenbezogene Daten unrechtmaessig bereitgestellt hat, kontaktiere uns, damit wir dies pruefen und die Daten gegebenenfalls loeschen koennen.',
          ],
        },
        {
          title: '12. Aenderungen',
          body: [
            'Wir koennen diese Datenschutzerklaerung aktualisieren, wenn sich unsere Dienste, Gesetze oder Verarbeitungstaetigkeiten aendern. Die aktualisierte Fassung gilt ab dem in der App genannten Datum, sofern zwingendes Recht nichts anderes verlangt.',
          ],
        },
      ],
    },
  },
  terms: {
    icon: 'document-text-outline',
    en: {
      title: 'Terms and Conditions',
      heroTitle: 'Terms and Conditions',
      heroSubtitle: 'Rules for using Drite Guide and its related services.',
      sections: [
        { title: 'Effective date', body: [EFFECTIVE_DATE] },
        {
          title: '1. Operator',
          body: [
            `Drite Guide is operated by Ard Sadiki. Legal contact:\n${LEGAL_CONTACT}`,
          ],
        },
        {
          title: '2. Acceptance',
          body: [
            'By accessing or using Drite Guide, you agree to these Terms and Conditions. If you do not agree, you must not use the app.',
          ],
        },
        {
          title: '3. Service',
          body: [
            'Drite Guide is a travel and discovery app for exploring places, cities, maps, saved places, trips, recommendations, reviews, and related content.',
            'The app is for general information and planning. It is not professional travel, safety, legal, medical, financial, or emergency advice.',
          ],
        },
        {
          title: '4. Accounts',
          body: [
            'You must provide accurate account information, keep it up to date, and keep your login credentials confidential.',
            'You are responsible for activity under your account unless caused by our failure to apply reasonable security measures.',
          ],
        },
        {
          title: '5. Lawful use',
          body: [
            'You may use Drite Guide only for lawful purposes and in a way that does not harm us, users, places, businesses, providers, or third parties.',
            'You must not attempt unauthorized access, disrupt the service, scrape data, upload malicious code, impersonate others, infringe rights, or submit unlawful, misleading, abusive, or harmful content.',
          ],
        },
        {
          title: '6. User content',
          body: [
            'You remain responsible for content you submit, including reviews, profile information, trip notes, and other user-generated content.',
            'You grant us a non-exclusive, worldwide, royalty-free license to host, store, display, reproduce, adapt, and use that content as needed to operate, improve, and promote Drite Guide.',
            'We may remove or restrict content that we reasonably believe violates these Terms or applicable law.',
          ],
        },
        {
          title: '7. Place information',
          body: [
            'Place descriptions, categories, locations, ratings, opening hours, contact details, prices, and travel information may be incomplete, outdated, or incorrect.',
            'You should verify important information directly with the relevant place, provider, authority, or map service before relying on it.',
          ],
        },
        {
          title: '8. Third-party services',
          body: [
            'Drite Guide may use or link to third-party services such as maps, hosting, authentication, analytics, email delivery, payment providers if introduced, or external websites.',
            'We are not responsible for third-party content, availability, terms, privacy practices, prices, bookings, routes, or services.',
          ],
        },
        {
          title: '9. Intellectual property',
          body: [
            'Drite Guide, including its software, design, brand, logo, layout, text, databases, and original content, is owned by us or licensed to us.',
            'You may not copy, distribute, modify, reverse engineer, sell, lease, or exploit any part of the app except as permitted by law or with our written permission.',
          ],
        },
        {
          title: '10. Availability and changes',
          body: [
            'We may update, change, suspend, or discontinue any part of Drite Guide at any time. We do not guarantee uninterrupted or error-free availability.',
          ],
        },
        {
          title: '11. Disclaimer and liability',
          body: [
            'Drite Guide is provided on an "as is" and "as available" basis. To the extent permitted by law, we exclude warranties regarding accuracy, availability, fitness for a particular purpose, and non-infringement.',
            'To the extent permitted by law, we are not liable for indirect, incidental, special, consequential, punitive, or business losses, including lost profits, lost data, or lost opportunities.',
            'Nothing in these Terms limits liability that cannot legally be limited, including liability for intent or gross negligence where applicable.',
          ],
        },
        {
          title: '12. Suspension and termination',
          body: [
            'We may suspend or terminate access if you violate these Terms, create risk, misuse the app, infringe rights, or if we must do so for legal, security, or operational reasons.',
          ],
        },
        {
          title: '13. Governing law',
          body: [
            'These Terms are governed by Swiss law, unless mandatory consumer protection law gives you additional rights or requires another law.',
            'Mandatory legal venues and consumer rights remain unaffected.',
          ],
        },
        {
          title: '14. App stores and platform rules',
          body: [
            'If you download Drite Guide through an app store or platform, the store operator may apply additional terms. Those terms are between you and the store operator.',
            'To the extent of any conflict, these Terms apply to your relationship with us and the store terms apply to your relationship with the store operator.',
          ],
        },
        {
          title: '15. Changes to these Terms',
          body: [
            'We may update these Terms to reflect legal, technical, or business changes. If changes are material, we will provide reasonable notice where required.',
            'Continued use after updated Terms become effective means you accept the updated Terms, unless mandatory law requires a different process.',
          ],
        },
        {
          title: '16. Assignment',
          body: [
            'You may not assign or transfer your rights or obligations under these Terms without our prior written consent.',
            'We may assign or transfer our rights and obligations if Drite Guide changes ownership, structure, service providers, or operating entity, provided your mandatory rights remain protected.',
          ],
        },
        {
          title: '17. Force majeure',
          body: [
            'We are not responsible for delays or failures caused by events outside our reasonable control, including outages, cyber incidents, provider failures, natural events, government action, labor disputes, or internet and infrastructure disruptions.',
          ],
        },
        {
          title: '18. Severability and no waiver',
          body: [
            'If any part of these Terms is invalid or unenforceable, the remaining parts remain in effect to the fullest extent permitted by law.',
            'If we do not enforce a right immediately, this does not mean that we waive that right.',
          ],
        },
        {
          title: '19. Contact',
          body: [`Questions about these Terms can be sent to:\n${LEGAL_CONTACT}`],
        },
      ],
    },
    de: {
      title: 'AGB',
      heroTitle: 'Allgemeine Geschaeftsbedingungen',
      heroSubtitle: 'Regeln fuer die Nutzung von Drite Guide und verbundenen Diensten.',
      sections: [
        { title: 'Gueltig ab', body: [EFFECTIVE_DATE] },
        {
          title: '1. Betreiber',
          body: [
            `Drite Guide wird von Ard Sadiki betrieben. Kontakt fuer Rechtliches:\n${LEGAL_CONTACT}`,
          ],
        },
        {
          title: '2. Annahme',
          body: [
            'Durch Zugriff auf oder Nutzung von Drite Guide akzeptierst du diese AGB. Wenn du nicht einverstanden bist, darfst du die App nicht nutzen.',
          ],
        },
        {
          title: '3. Dienst',
          body: [
            'Drite Guide ist eine Reise- und Entdeckungs-App zum Erkunden von Orten, Staedten, Karten, gespeicherten Orten, Reisen, Empfehlungen, Bewertungen und verwandten Inhalten.',
            'Die App dient allgemeinen Informations- und Planungszwecken. Sie ist keine professionelle Reise-, Sicherheits-, Rechts-, Medizin-, Finanz- oder Notfallberatung.',
          ],
        },
        {
          title: '4. Konten',
          body: [
            'Du musst richtige Kontodaten angeben, sie aktuell halten und deine Zugangsdaten vertraulich behandeln.',
            'Du bist fuer Aktivitaeten unter deinem Konto verantwortlich, sofern sie nicht durch unser Versaeumnis angemessener Sicherheitsmassnahmen verursacht wurden.',
          ],
        },
        {
          title: '5. Rechtmaessige Nutzung',
          body: [
            'Du darfst Drite Guide nur rechtmaessig und so nutzen, dass uns, Nutzern, Orten, Unternehmen, Anbietern oder Dritten kein Schaden entsteht.',
            'Du darfst keinen unbefugten Zugriff versuchen, den Dienst stoeren, Daten auslesen, Schadcode hochladen, dich als andere ausgeben, Rechte verletzen oder rechtswidrige, irrefuehrende, beleidigende oder schaedliche Inhalte einstellen.',
          ],
        },
        {
          title: '6. Nutzerinhalte',
          body: [
            'Du bleibst fuer Inhalte verantwortlich, die du einreichst, etwa Bewertungen, Profilinformationen, Reisenotizen und andere nutzergenerierte Inhalte.',
            'Du gewaehrst uns eine nicht-exklusive, weltweite, lizenzgebuehrenfreie Lizenz, diese Inhalte zu hosten, zu speichern, anzuzeigen, zu vervielfaeltigen, anzupassen und zu nutzen, soweit dies fuer Betrieb, Verbesserung und Bewerbung von Drite Guide erforderlich ist.',
            'Wir koennen Inhalte entfernen oder einschraenken, wenn wir vernuenftig annehmen, dass sie gegen diese AGB oder geltendes Recht verstossen.',
          ],
        },
        {
          title: '7. Ortsinformationen',
          body: [
            'Beschreibungen, Kategorien, Standorte, Bewertungen, Oeffnungszeiten, Kontaktdaten, Preise und Reiseinformationen koennen unvollstaendig, veraltet oder falsch sein.',
            'Wichtige Informationen solltest du direkt beim jeweiligen Ort, Anbieter, der zustaendigen Behoerde oder dem Kartendienst pruefen.',
          ],
        },
        {
          title: '8. Drittanbieter',
          body: [
            'Drite Guide kann Drittanbieter-Dienste nutzen oder verlinken, etwa Karten, Hosting, Authentifizierung, Analyse, E-Mail-Versand, bei Einfuehrung Zahlungsanbieter oder externe Websites.',
            'Wir sind nicht verantwortlich fuer Inhalte, Verfuegbarkeit, Bedingungen, Datenschutzpraktiken, Preise, Buchungen, Routen oder Leistungen Dritter.',
          ],
        },
        {
          title: '9. Geistiges Eigentum',
          body: [
            'Drite Guide einschliesslich Software, Design, Marke, Logo, Layout, Texten, Datenbanken und Originalinhalten gehoert uns oder ist an uns lizenziert.',
            'Du darfst ohne gesetzliche Erlaubnis oder unsere schriftliche Zustimmung keine Teile der App kopieren, verbreiten, veraendern, reverse engineeren, verkaufen, vermieten oder verwerten.',
          ],
        },
        {
          title: '10. Verfuegbarkeit und Aenderungen',
          body: [
            'Wir koennen Drite Guide jederzeit aktualisieren, aendern, aussetzen oder einstellen. Wir garantieren keine unterbrechungsfreie oder fehlerfreie Verfuegbarkeit.',
          ],
        },
        {
          title: '11. Gewaehrleistung und Haftung',
          body: [
            'Drite Guide wird "wie besehen" und "wie verfuegbar" bereitgestellt. Soweit gesetzlich zulaessig, schliessen wir Gewaehrleistungen zu Richtigkeit, Verfuegbarkeit, Eignung fuer einen bestimmten Zweck und Nichtverletzung aus.',
            'Soweit gesetzlich zulaessig, haften wir nicht fuer indirekte, zufaellige, besondere, Folge-, Straf- oder Geschaeftsschaeden, einschliesslich entgangener Gewinne, Daten oder Chancen.',
            'Nichts in diesen AGB beschraenkt eine Haftung, die gesetzlich nicht beschraenkt werden darf, einschliesslich Haftung fuer Vorsatz oder grobe Fahrlaessigkeit, soweit anwendbar.',
          ],
        },
        {
          title: '12. Sperrung und Beendigung',
          body: [
            'Wir koennen den Zugriff sperren oder beenden, wenn du gegen diese AGB verstoesst, Risiken verursachst, die App missbrauchst, Rechte verletzt oder dies aus rechtlichen, Sicherheits- oder Betriebsgruenden erforderlich ist.',
          ],
        },
        {
          title: '13. Anwendbares Recht',
          body: [
            'Diese AGB unterliegen schweizerischem Recht, sofern zwingender Verbraucherschutz dir keine zusaetzlichen Rechte gibt oder ein anderes Recht vorschreibt.',
            'Zwingende Gerichtsstaende und Verbraucherrechte bleiben unberuehrt.',
          ],
        },
        {
          title: '14. App Stores und Plattformregeln',
          body: [
            'Wenn du Drite Guide ueber einen App Store oder eine Plattform herunterlaedst, koennen zusaetzliche Bedingungen des Store-Betreibers gelten. Diese gelten zwischen dir und dem Store-Betreiber.',
            'Bei Widerspruechen regeln diese AGB dein Verhaeltnis zu uns und die Store-Bedingungen dein Verhaeltnis zum Store-Betreiber.',
          ],
        },
        {
          title: '15. Aenderungen dieser AGB',
          body: [
            'Wir koennen diese AGB aktualisieren, um rechtliche, technische oder geschaeftliche Aenderungen abzubilden. Bei wesentlichen Aenderungen informieren wir angemessen, soweit dies erforderlich ist.',
            'Die weitere Nutzung nach Inkrafttreten aktualisierter AGB bedeutet, dass du sie akzeptierst, sofern zwingendes Recht kein anderes Verfahren verlangt.',
          ],
        },
        {
          title: '16. Abtretung',
          body: [
            'Du darfst Rechte oder Pflichten aus diesen AGB ohne unsere vorherige schriftliche Zustimmung nicht abtreten oder uebertragen.',
            'Wir duerfen Rechte und Pflichten uebertragen, wenn sich Eigentum, Struktur, Dienstleister oder Betreibereinheit von Drite Guide aendern, sofern deine zwingenden Rechte geschuetzt bleiben.',
          ],
        },
        {
          title: '17. Hoehere Gewalt',
          body: [
            'Wir sind nicht verantwortlich fuer Verzoegerungen oder Ausfaelle durch Ereignisse ausserhalb unserer zumutbaren Kontrolle, einschliesslich Ausfaelle, Cybervorfaelle, Providerfehler, Naturereignisse, Behoerdenmassnahmen, Arbeitskonflikte oder Internet- und Infrastrukturstoerungen.',
          ],
        },
        {
          title: '18. Salvatorische Klausel und kein Verzicht',
          body: [
            'Wenn ein Teil dieser AGB unwirksam oder undurchsetzbar ist, bleiben die uebrigen Teile im gesetzlich zulaessigen Umfang wirksam.',
            'Wenn wir ein Recht nicht sofort durchsetzen, bedeutet das keinen Verzicht auf dieses Recht.',
          ],
        },
        {
          title: '19. Kontakt',
          body: [`Fragen zu diesen AGB kannst du senden an:\n${LEGAL_CONTACT}`],
        },
      ],
    },
  },
  cookies: {
    icon: 'analytics-outline',
    en: {
      title: 'Cookie Policy',
      heroTitle: 'Cookies and similar technologies',
      heroSubtitle:
        'How Drite Guide uses cookies, local storage, SDKs, permissions, and similar technologies.',
      sections: [
        { title: 'Effective date', body: [EFFECTIVE_DATE] },
        {
          title: '1. Scope',
          body: [
            'This Cookie Policy applies to Drite Guide websites, web views, mobile app storage, device permissions, SDKs, identifiers, analytics, and similar technologies.',
            'In a mobile app, similar technologies may include local storage, secure token storage, SDKs, device identifiers, push tokens, pixels, and analytics tools.',
          ],
        },
        {
          title: '2. Categories we may use',
          body: [
            'Essential technologies: required for login, authentication, security, language settings, account sessions, saved preferences, and basic app operation.',
            'Functional technologies: remember preferences such as language, notification settings, saved places on device, or interface choices.',
            'Analytics and diagnostics: help us understand usage, performance, crashes, and reliability, where enabled and lawful.',
            'Maps and location technologies: support maps, nearby places, directions, and location-based features when you grant permission.',
            'Marketing or advertising technologies: we do not currently describe advertising cookies as part of the core app. If introduced, we will update this Policy and request consent where required.',
          ],
        },
        {
          title: '3. Consent',
          body: [
            'Where applicable law requires consent for non-essential cookies or similar technologies, we will request it before using them.',
            'Strictly necessary technologies may be used without separate consent where they are required to provide a service you request, secure the app, or remember your privacy choices.',
          ],
        },
        {
          title: '4. Managing choices',
          body: [
            'You can manage app permissions such as location, notifications, camera, photos, and storage in your device settings.',
            'You can manage some preferences inside Drite Guide, such as language and notification settings. Browser cookies can usually be managed in your browser settings.',
            'Disabling essential technologies may affect login, saved preferences, maps, or other app features.',
          ],
        },
        {
          title: '5. Third-party technologies',
          body: [
            'Third-party providers may operate technologies for hosting, authentication, email delivery, maps, analytics, diagnostics, or notifications.',
            'Where third parties act independently, their own policies may also apply.',
          ],
        },
        {
          title: '6. Contact',
          body: [`Questions about cookies or similar technologies can be sent to:\n${LEGAL_CONTACT}`],
        },
      ],
    },
    de: {
      title: 'Cookie-Richtlinie',
      heroTitle: 'Cookies und aehnliche Technologien',
      heroSubtitle:
        'Wie Drite Guide Cookies, lokalen Speicher, SDKs, Berechtigungen und aehnliche Technologien nutzt.',
      sections: [
        { title: 'Gueltig ab', body: [EFFECTIVE_DATE] },
        {
          title: '1. Geltungsbereich',
          body: [
            'Diese Cookie-Richtlinie gilt fuer Drite Guide Websites, Webviews, mobilen App-Speicher, Geraeteberechtigungen, SDKs, Kennungen, Analyse- und aehnliche Technologien.',
            'In einer mobilen App koennen aehnliche Technologien lokalen Speicher, sichere Token-Speicherung, SDKs, Geraetekennungen, Push-Token, Pixel und Analysewerkzeuge umfassen.',
          ],
        },
        {
          title: '2. Kategorien',
          body: [
            'Notwendige Technologien: erforderlich fuer Login, Authentifizierung, Sicherheit, Spracheinstellungen, Kontositzungen, gespeicherte Praeferenzen und grundlegenden App-Betrieb.',
            'Funktionale Technologien: merken Praeferenzen wie Sprache, Benachrichtigungseinstellungen, lokal gespeicherte Orte oder Oberflaechenauswahl.',
            'Analyse und Diagnose: helfen uns, Nutzung, Leistung, Abstuerze und Zuverlaessigkeit zu verstehen, soweit aktiviert und rechtlich zulaessig.',
            'Karten- und Standorttechnologien: unterstuetzen Karten, Orte in der Naehe, Navigation und standortbasierte Funktionen, wenn du die Erlaubnis erteilst.',
            'Marketing- oder Werbetechnologien: Wir beschreiben derzeit keine Werbe-Cookies als Teil der Kern-App. Wenn wir sie einfuehren, aktualisieren wir diese Richtlinie und holen erforderliche Einwilligungen ein.',
          ],
        },
        {
          title: '3. Einwilligung',
          body: [
            'Wenn anwendbares Recht eine Einwilligung fuer nicht notwendige Cookies oder aehnliche Technologien verlangt, holen wir sie vor deren Nutzung ein.',
            'Unbedingt notwendige Technologien koennen ohne separate Einwilligung genutzt werden, wenn sie fuer einen von dir angeforderten Dienst, die Sicherheit der App oder das Speichern deiner Datenschutzauswahl erforderlich sind.',
          ],
        },
        {
          title: '4. Auswahl verwalten',
          body: [
            'Du kannst App-Berechtigungen wie Standort, Benachrichtigungen, Kamera, Fotos und Speicher in deinen Geraeteeinstellungen verwalten.',
            'Einige Praeferenzen kannst du in Drite Guide verwalten, etwa Sprache und Benachrichtigungen. Browser-Cookies lassen sich meist in den Browser-Einstellungen verwalten.',
            'Das Deaktivieren notwendiger Technologien kann Login, gespeicherte Praeferenzen, Karten oder andere App-Funktionen beeintraechtigen.',
          ],
        },
        {
          title: '5. Drittanbieter-Technologien',
          body: [
            'Drittanbieter koennen Technologien fuer Hosting, Authentifizierung, E-Mail-Versand, Karten, Analyse, Diagnose oder Benachrichtigungen betreiben.',
            'Wenn Drittanbieter eigenstaendig handeln, koennen ihre eigenen Richtlinien zusaetzlich gelten.',
          ],
        },
        {
          title: '6. Kontakt',
          body: [`Fragen zu Cookies oder aehnlichen Technologien kannst du senden an:\n${LEGAL_CONTACT}`],
        },
      ],
    },
  },
  notice: {
    icon: 'briefcase-outline',
    en: {
      title: 'Legal Notice',
      heroTitle: 'Legal Notice',
      heroSubtitle: 'Provider, contact, copyright, and responsibility information.',
      sections: [
        { title: 'Effective date', body: [EFFECTIVE_DATE] },
        {
          title: '1. Provider',
          body: [
            'Drite Guide',
            'Responsible person: Ard Sadiki',
            'Country of operation/contact: Switzerland',
          ],
        },
        {
          title: '2. Legal contact',
          body: [LEGAL_CONTACT],
        },
        {
          title: '3. Support',
          body: [
            'For legal, privacy, and support requests, use support@driteguide.com. Please include enough information for us to identify your request and respond appropriately.',
          ],
        },
        {
          title: '4. Company and tax information',
          body: [
            'If a commercial register entry, legal form, VAT number, or full business address becomes legally required or available for the operating entity, this Legal Notice will be updated.',
            'If Drite Guide is operated as a sole-person project without register entry, the responsible person named above is the contact point for legal notices.',
          ],
        },
        {
          title: '5. Responsibility for content',
          body: [
            'We try to keep information in Drite Guide useful, accurate, and current. However, place information, descriptions, routes, prices, opening hours, contact details, and external content may change or contain errors.',
            'Users should verify important information directly with the relevant place, provider, authority, or third-party service.',
          ],
        },
        {
          title: '6. External links and services',
          body: [
            'Drite Guide may link to or display content from third-party websites, map services, booking providers, businesses, and other external services.',
            'We are not responsible for third-party content, availability, terms, privacy practices, or services.',
          ],
        },
        {
          title: '7. Copyright and trademarks',
          body: [
            'Texts, images, logos, branding, UI designs, databases, software, and other materials in Drite Guide are protected by copyright, trademark, database, and other intellectual property laws unless stated otherwise.',
            'Unauthorized copying, distribution, modification, scraping, or commercial use is prohibited.',
          ],
        },
        {
          title: '8. Dispute resolution',
          body: [
            'We prefer to resolve concerns directly. Contact us first at support@driteguide.com.',
            'Mandatory consumer rights and mandatory legal venues remain unaffected.',
          ],
        },
      ],
    },
    de: {
      title: 'Impressum',
      heroTitle: 'Impressum',
      heroSubtitle: 'Angaben zu Anbieter, Kontakt, Urheberrecht und Verantwortlichkeit.',
      sections: [
        { title: 'Gueltig ab', body: [EFFECTIVE_DATE] },
        {
          title: '1. Anbieter',
          body: [
            'Drite Guide',
            'Verantwortliche Person: Ard Sadiki',
            'Land des Betriebs/Kontakts: Schweiz',
          ],
        },
        {
          title: '2. Kontakt fuer Rechtliches',
          body: [LEGAL_CONTACT],
        },
        {
          title: '3. Support',
          body: [
            'Fuer rechtliche Anliegen, Datenschutz- und Supportanfragen nutze support@driteguide.com. Bitte gib genug Informationen an, damit wir deine Anfrage zuordnen und angemessen beantworten koennen.',
          ],
        },
        {
          title: '4. Unternehmens- und Steuerangaben',
          body: [
            'Wenn Handelsregistereintrag, Rechtsform, MWST-Nummer oder vollstaendige Geschaeftsadresse fuer die Betreibereinheit rechtlich erforderlich oder verfuegbar werden, wird dieses Impressum aktualisiert.',
            'Wenn Drite Guide als Einzelprojekt ohne Registereintrag betrieben wird, ist die oben genannte verantwortliche Person die Kontaktstelle fuer rechtliche Hinweise.',
          ],
        },
        {
          title: '5. Verantwortung fuer Inhalte',
          body: [
            'Wir bemuehen uns, Informationen in Drite Guide nuetzlich, richtig und aktuell zu halten. Ortsinformationen, Beschreibungen, Routen, Preise, Oeffnungszeiten, Kontaktdaten und externe Inhalte koennen sich jedoch aendern oder Fehler enthalten.',
            'Nutzer sollten wichtige Informationen direkt beim jeweiligen Ort, Anbieter, der zustaendigen Behoerde oder dem Drittanbieterdienst pruefen.',
          ],
        },
        {
          title: '6. Externe Links und Dienste',
          body: [
            'Drite Guide kann auf Drittanbieter-Websites, Kartendienste, Buchungsanbieter, Unternehmen und andere externe Dienste verlinken oder deren Inhalte anzeigen.',
            'Wir sind nicht verantwortlich fuer Inhalte, Verfuegbarkeit, Bedingungen, Datenschutzpraktiken oder Leistungen Dritter.',
          ],
        },
        {
          title: '7. Urheberrecht und Marken',
          body: [
            'Texte, Bilder, Logos, Branding, UI-Designs, Datenbanken, Software und andere Materialien in Drite Guide sind urheber-, marken-, datenbank- und sonstig immaterialgueterrechtlich geschuetzt, sofern nicht anders angegeben.',
            'Unbefugtes Kopieren, Verbreiten, Veraendern, Scraping oder kommerzielle Nutzung ist untersagt.',
          ],
        },
        {
          title: '8. Streitbeilegung',
          body: [
            'Wir moechten Anliegen bevorzugt direkt klaeren. Kontaktiere uns zuerst unter support@driteguide.com.',
            'Zwingende Verbraucherrechte und zwingende Gerichtsstaende bleiben unberuehrt.',
          ],
        },
      ],
    },
  },
};

export function getLegalCopy(documentKey, language) {
  const document = legalCopy[documentKey] || legalCopy.privacy;
  return {
    icon: document.icon,
    copy: document[language] || document.en,
  };
}
