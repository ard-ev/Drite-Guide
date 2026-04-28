import { normalizeLanguageCode, translate } from './translations';

const CATEGORY_KEY_ALIASES = {
  historicalsites: 'historical',
  religioussites: 'religious_sites',
  religious_sites: 'religious_sites',
  hiddengems: 'hidden_gems',
  governmenthelp: 'government_help',
  governmentservices: 'government_help',
  mosques: 'religious_sites',
  churches: 'religious_sites',
};

const CITY_DESCRIPTIONS = {
  de: {
    tirana: 'Albaniens lebendige Hauptstadt mit Cafes, Kultur, Nachtleben und Ausfluegen in die Stadt.',
    shkoder: 'Historische Stadt im Norden, bekannt fuer Kultur, Radfahren und die Naehe zu den Albanischen Alpen.',
    vlore: 'Ein Kuestentor, an dem Adria und Ionisches Meer aufeinandertreffen.',
    durres: 'Eine Stadt am Meer mit langen Straenden, roemischer Geschichte und schneller Verbindung nach Tirana.',
    ksamil: 'Ein beruehmtes Strandziel im Sueden mit tuerkisfarbenem Wasser und kleinen Inseln.',
    dhermi: 'Ein Riviera-Hotspot, bekannt fuer Straende, Nachtleben und malerische Bergstrassen.',
    lin: 'Ein ruhiges Dorf am Ohridsee mit entspannten Uferblicken.',
    theth: 'Ein Bergdorf, beruehmt fuer Wanderungen, alpine Landschaften und traditionelle Gaestehaeuser.',
    gjirokaster: 'Eine UNESCO-Steinstadt mit osmanischer Architektur und Blick auf die Burg.',
    korca: 'Ein kulturelles Zentrum im Suedosten, bekannt fuer Essen, Serenaden und entspannten Stadtrhythmus.',
    berat: 'Die Stadt der tausend Fenster mit vielschichtiger Geschichte und Charme am Fluss.',
    lezhe: 'Eine Stadt im Norden, die Sehenswuerdigkeiten im Inland mit nahen Straenden und Lagunen verbindet.',
    shengjin: 'Ein wachsendes Strandziel an der Nordkueste.',
    velipoje: 'Ein breiter Sandstrand nahe Naturreservaten und der Grenze zu Montenegro.',
    saranda: 'Eine sonnige Stadt am Ionischen Meer, beliebt fuer Straende, Promenaden und Tagesausfluege in den Sueden.',
    kruja: 'Eine historische Stadt am Hang, bekannt fuer Skanderbeg, den Basar und die Burg.',
    himare: 'Ein Riviera-Ausgangspunkt fuer schoene Straende, Buchten und entspanntes Kuestenleben.',
  },
  sq: {
    tirana: 'Kryeqyteti i gjalle i Shqiperise me kafene, kulture, jete nate dhe dalje urbane.',
    shkoder: 'Qytet historik verior, i njohur per kulturen, bicikletat dhe afersine me Alpet Shqiptare.',
    vlore: 'Nje porte bregdetare ku Adriatiku takon Jonin.',
    durres: 'Qytet bregdetar me plazhe te gjata, histori romake dhe lidhje te lehte me Tiranen.',
    ksamil: 'Destinacion i famshem jugor me uje turkez dhe ishuj te vegjel.',
    dhermi: 'Pike e njohur e Rivieres per plazhe, jete nate dhe rruge malore piktoreske.',
    lin: 'Fshat i qete ne Liqenin e Ohrit me pamje te qeta buzeliqenore.',
    theth: 'Fshat malor i famshem per ecje, peizazhe alpine dhe bujtina tradicionale.',
    gjirokaster: 'Qytet guri i UNESCO-s me arkitekture osmane dhe pamje nga kalaja.',
    korca: 'Qender kulturore juglindore, e njohur per ushqimin, serenatat dhe ritmin e qete.',
    berat: 'Qyteti i nje mije dritareve me histori te shtresuar dhe hijeshi prane lumit.',
    lezhe: 'Qytet verior qe lidh monumentet e brendshme me plazhe dhe laguna te aferta.',
    shengjin: 'Destinacion plazhi ne rritje ne bregdetin verior.',
    velipoje: 'Zone e gjere ranore prane rezervateve natyrore dhe kufirit me Malin e Zi.',
    saranda: 'Qytet me diell ne Jon, i njohur per plazhe, shetitore dhe udhetime ditore ne jug.',
    kruja: 'Qytet historik kodrinor, i njohur per Skenderbeun, pazarin dhe kalane.',
    himare: 'Baze e Rivieres per plazhe te bukura, gjire dhe jete te qete bregdetare.',
  },
  fr: {
    tirana: 'La capitale animee de l Albanie, avec cafes, culture, vie nocturne et escapades urbaines.',
    shkoder: 'Ville historique du nord, connue pour sa culture, le velo et sa proximite avec les Alpes albanaises.',
    vlore: 'Une porte cotiere ou l Adriatique rencontre la mer Ionienne.',
    durres: 'Ville balneaire avec longues plages, histoire romaine et acces facile depuis Tirana.',
    ksamil: 'Destination balneaire celebre du sud avec eau turquoise et petites iles.',
    dhermi: 'Un hotspot de la Riviera, connu pour ses plages, sa vie nocturne et ses routes de montagne.',
    lin: 'Un village paisible sur le lac d Ohrid avec des vues calmes sur l eau.',
    theth: 'Village de montagne celebre pour la randonnee, les paysages alpins et les maisons d hotes traditionnelles.',
    gjirokaster: 'Ville de pierre UNESCO avec architecture ottomane et vues sur le chateau.',
    korca: 'Centre culturel du sud-est, connu pour sa cuisine, ses serenades et son rythme detendu.',
    berat: 'La ville aux mille fenetres avec une histoire riche et un charme au bord de la riviere.',
    lezhe: 'Ville du nord reliant les sites interieurs aux plages et lagunes voisines.',
    shengjin: 'Destination balneaire en plein essor sur la cote nord.',
    velipoje: 'Grande plage de sable pres de reserves naturelles et de la frontiere montenegrine.',
    saranda: 'Ville ionienne ensoleillee, populaire pour ses plages, promenades et excursions vers le sud.',
    kruja: 'Ville historique a flanc de colline, connue pour Skanderbeg, son bazar et son chateau.',
    himare: 'Base de la Riviera pour belles plages, baies et vie cotiere detendue.',
  },
  it: {
    tirana: 'La vivace capitale dell Albania, con caffe, cultura, vita notturna e fughe urbane.',
    shkoder: 'Storica citta del nord, nota per cultura, biciclette e vicinanza alle Alpi Albanesi.',
    vlore: 'Una porta costiera dove l Adriatico incontra lo Ionio.',
    durres: 'Citta di mare con lunghe spiagge, storia romana e facile accesso da Tirana.',
    ksamil: 'Famosa destinazione balneare del sud con acqua turchese e piccole isole.',
    dhermi: 'Hotspot della Riviera noto per spiagge, vita notturna e strade di montagna panoramiche.',
    lin: 'Villaggio tranquillo sul lago di Ohrid con viste rilassanti sull acqua.',
    theth: 'Villaggio di montagna famoso per trekking, paesaggi alpini e guesthouse tradizionali.',
    gjirokaster: 'Citta di pietra UNESCO con architettura ottomana e viste sul castello.',
    korca: 'Centro culturale sudorientale noto per cibo, serenate e ritmo cittadino rilassato.',
    berat: 'La citta dalle mille finestre con storia stratificata e fascino sul fiume.',
    lezhe: 'Citta del nord che collega attrazioni interne con spiagge e lagune vicine.',
    shengjin: 'Destinazione balneare in crescita sulla costa settentrionale.',
    velipoje: 'Ampia spiaggia sabbiosa vicino a riserve naturali e al confine montenegrino.',
    saranda: 'Citta ionica soleggiata, popolare per spiagge, lungomare e gite nel sud.',
    kruja: 'Storica citta collinare nota per Skanderbeg, il bazar e il castello.',
    himare: 'Base della Riviera per belle spiagge, baie e vita costiera rilassata.',
  },
  es: {
    tirana: 'La animada capital de Albania, con cafes, cultura, vida nocturna y escapadas urbanas.',
    shkoder: 'Ciudad historica del norte, conocida por su cultura, bicicletas y cercania a los Alpes albaneses.',
    vlore: 'Una puerta costera donde el Adriatico se encuentra con el mar Jonico.',
    durres: 'Ciudad costera con largas playas, historia romana y facil acceso desde Tirana.',
    ksamil: 'Famoso destino de playa del sur con agua turquesa e islas pequenas.',
    dhermi: 'Punto de la Riviera conocido por playas, vida nocturna y carreteras de montana.',
    lin: 'Pueblo tranquilo en el lago Ohrid con vistas relajadas al agua.',
    theth: 'Pueblo de montana famoso por senderismo, paisajes alpinos y casas de huespedes tradicionales.',
    gjirokaster: 'Ciudad de piedra UNESCO con arquitectura otomana y vistas al castillo.',
    korca: 'Centro cultural del sureste, conocido por comida, serenatas y ritmo relajado.',
    berat: 'La ciudad de las mil ventanas con historia por capas y encanto junto al rio.',
    lezhe: 'Ciudad del norte que conecta lugares interiores con playas y lagunas cercanas.',
    shengjin: 'Destino de playa en crecimiento en la costa norte.',
    velipoje: 'Amplia playa de arena cerca de reservas naturales y la frontera con Montenegro.',
    saranda: 'Ciudad jonica soleada, popular por playas, paseos y excursiones al sur.',
    kruja: 'Ciudad historica en la ladera, conocida por Skanderbeg, su bazar y castillo.',
    himare: 'Base de la Riviera para playas bonitas, bahias y vida costera relajada.',
  },
};

const PLACE_DESCRIPTIONS = {
  de: {
    re1: 'Mullixhiu bietet eine moderne Interpretation traditioneller albanischer Kueche mit lokalen Zutaten und saisonalen Rezepten. Ein Muss in Tirana fuer ein authentisches und raffiniertes Essen.',
    re2: 'Ein gemuetliches Gartenrestaurant mit traditionellen albanischen Gerichten aus frischen, lokalen Zutaten und einem authentischen, feinen Esserlebnis.',
    ca1: 'Ein einzigartiges Cafe mit albanischer Kultur, gutem Kaffee und auch Alkohol ;)',
    ba1: 'Beliebte Cocktailbar im Blloku mit lebendiger Atmosphaere.',
    ho1: 'Erlebe gehobenen Komfort im Herzen von Tirana, wo dieses Luxushotel elegantes Design, hochwertige Ausstattung und zentrale Lage verbindet.',
    ho3: 'Elegantes Hotel mit grossem Garten und Poolbereich.',
    re3: 'Authentische albanische Kueche in einem traditionellen Haus.',
    ca2: 'Entspanntes Cafe mit gutem Kaffee und Desserts.',
    ba2: 'Lockere Bar mit Musik und Drinks.',
    ho4: 'Elegantes Hotel im Stadtzentrum.',
    re4: 'Fischrestaurant mit schoenem Meerblick.',
    ca3: 'Perfekter Ort fuer Kaffee an der Promenade.',
    ho5: 'Hotel an der Klippe mit direktem Zugang zum Meer.',
    ho6: 'Modernes Hotel nahe der Promenade mit Rooftop-Pool.',
    ba3: 'Rooftop-Bar mit beeindruckendem Sonnenuntergangsblick.',
    ho7: 'Modernes Hotel in Strandnaehe.',
    be4: 'Klares Wasser und ruhige Atmosphaere direkt ausserhalb von Vlore.',
    be5: 'Breiter Strand mit einer Mischung aus Sand und Kieseln.',
    re5: 'Restaurant im italienischen Stil mit frischem Seafood.',
    ca4: 'Cafe am Strand mit entspannter Stimmung.',
    ba6: 'Trendige Beachbar mit Cocktails.',
    ho8: 'Klassisches Strandhotel mit privatem Strand.',
    ho9: 'Luxushotel mit Spa und Meerblick.',
    ho10: 'Komfortables Hotel in Strandnaehe in Shengjin.',
    be7: 'Der groesste Strand Albaniens mit vielen Resorts und Restaurants.',
    be8: 'Beliebter Sandstrand mit Hotels und Nachtleben.',
    be9: 'Entspannter Strand mit wachsender touristischer Infrastruktur.',
    be10: 'Breiter Sandstrand, umgeben von Natur.',
    re6: 'Beruehmtes Seafood-Restaurant nahe dem Strand.',
    ca5: 'Entspanntes Cafe mit Meerblick.',
    ba11: 'Beachbar mit Musik und Cocktails.',
    ho11: 'Modernes Hotel in Strandnaehe.',
    be12: 'Beruehmt fuer tuerkisfarbenes Wasser und kleine Inseln direkt vor der Kueste.',
    be13: 'Ein Geheimtipp mit kristallklarem Wasser und entspannterer Stimmung.',
    be14: 'Bekannt fuer spiegelndes Wasser und dramatische Klippen.',
    re7: 'Eines der bekanntesten Farm-to-Table-Restaurants Albaniens.',
    ca6: 'Einfaches Cafe mit gutem Kaffee.',
    ba15: 'Lokale Bar mit Musik und Drinks.',
    ho12: 'Komfortables Hotel nahe dem Zentrum.',
    re8: 'Seafood-Restaurant mit fantastischem Ausblick.',
    ca7: 'Schoenes Cafe mit Desserts und Kaffee.',
    ba16: 'Beruehmter Beachclub mit Partys und Drinks.',
    ho13: 'Hotel am Meer mit Apartments und privatem Strandzugang.',
    ho14: 'Stilvolles Strandresort mit Infinity-Pool.',
    be16: 'Einer der beliebtesten Straende Albaniens mit kristallklarem Wasser.',
    be17: 'Trendiger Strand mit Beachclubs und beeindruckenden Sonnenuntergaengen.',
    be18: 'Beruehmt fuer Nachtleben und Strandpartys.',
    be19: 'Ein abgelegenes Paradies, erreichbar durch eine Canyon-Wanderung.',
    ho15: 'Strandresort mit entspannter und trendiger Atmosphaere.',
    ho16: 'Elegantes Hotel mit Panoramablick auf das Meer.',
    ho17: 'Modernes Strandresort mit lebendiger Atmosphaere.',
  },
  sq: {
    re1: 'Mullixhiu ofron nje version modern te kuzhines tradicionale shqiptare me perberes lokale dhe receta sezonale. Nje vend qe duhet vizituar ne Tirane per nje pervoje autentike dhe te rafinuar.',
    re2: 'Restorant komod ne kopsht me gatime tradicionale shqiptare nga perberes te fresket lokale dhe pervoje te mirefillte ngrenieje.',
    ca1: 'Kafene unike me kulture shqiptare, kafe te mire dhe edhe alkool ;)',
    ba1: 'Bar koktejlesh i njohur ne Bllok me atmosfere te gjalle.',
    ho1: 'Perjeto rehati te rafinuar ne zemren e Tiranes, ku ky hotel luksoz bashkon dizajn elegant, sherbime cilesore dhe vendndodhje qendrore.',
    ho3: 'Hotel elegant me kopsht te madh dhe zone pishine.',
    re3: 'Kuzhine autentike shqiptare ne nje shtepi tradicionale.',
    ca2: 'Kafene e qete me kafe dhe embelsira te mira.',
    ba2: 'Bar i thjeshte me muzike dhe pije.',
    ho4: 'Hotel elegant ne qender te qytetit.',
    re4: 'Restorant peshku me pamje te bukur nga deti.',
    ca3: 'Vend perfekt per kafe prane shetitores.',
    ho5: 'Hotel mbi shkemb me dalje direkte ne det.',
    ho6: 'Hotel modern prane shetitores me pishine ne tarrace.',
    ba3: 'Bar ne tarrace me pamje te mrekullueshme te perendimit.',
    ho7: 'Hotel modern prane plazhit.',
    be4: 'Uje i kthjellet dhe atmosfere e qete pak jashte Vlores.',
    be5: 'Plazh i gjere me perzierje rere dhe guresh.',
    re5: 'Restorant ne stil italian me fruta deti te fresketa.',
    ca4: 'Kafene prane plazhit me atmosfere te relaksuar.',
    ba6: 'Bar plazhi modern me koktejle.',
    ho8: 'Hotel klasik ne breg me plazh privat.',
    ho9: 'Hotel luksoz me spa dhe pamje nga deti.',
    ho10: 'Hotel komod prane plazhit ne Shengjin.',
    be7: 'Plazhi me i madh ne Shqiperi me shume resorte dhe restorante.',
    be8: 'Plazh ranor i njohur me hotele dhe jete nate.',
    be9: 'Plazh i qete me infrastrukture turistike ne rritje.',
    be10: 'Plazh i gjere ranor i rrethuar nga natyra.',
    re6: 'Restorant i famshem peshku prane plazhit.',
    ca5: 'Kafene e qete me pamje nga deti.',
    ba11: 'Bar plazhi me muzike dhe koktejle.',
    ho11: 'Hotel modern prane plazhit.',
    be12: 'I njohur per ujin turkez dhe ishujt e vegjel prane bregut.',
    be13: 'Perle e fshehur me uje kristal dhe atmosfere me te qete.',
    be14: 'I njohur per ujin pasqyrues dhe shkembinj dramatike.',
    re7: 'Nje nga restorantet farm-to-table me te famshme ne Shqiperi.',
    ca6: 'Kafene e thjeshte me kafe te mire.',
    ba15: 'Bar lokal me muzike dhe pije.',
    ho12: 'Hotel komod prane qendres.',
    re8: 'Restorant peshku me pamje te mrekullueshme.',
    ca7: 'Kafene e kendshme me embelsira dhe kafe.',
    ba16: 'Beach club i famshem me festa dhe pije.',
    ho13: 'Hotel ne breg me apartamente dhe dalje private ne plazh.',
    ho14: 'Resort elegant prane plazhit me pishine infinity.',
    be16: 'Nje nga plazhet me te njohura te Shqiperise me uje kristal.',
    be17: 'Plazh modern me beach clubs dhe perendime te bukura.',
    be18: 'I famshem per jete nate dhe festa ne plazh.',
    be19: 'Parajse e larget qe arrihet me ecje permes kanionit.',
    ho15: 'Resort prane plazhit me atmosfere te relaksuar dhe moderne.',
    ho16: 'Hotel elegant me pamje panoramike nga deti.',
    ho17: 'Resort modern ne breg me atmosfere te gjalle.',
  },
  fr: {
    re1: 'Mullixhiu propose une approche moderne de la cuisine albanaise traditionnelle avec des ingredients locaux et des recettes de saison. Un incontournable a Tirana pour une experience authentique et raffinee.',
    re2: 'Restaurant de jardin chaleureux avec plats albanais traditionnels prepares avec des ingredients frais et locaux.',
    ca1: 'Cafe unique avec culture albanaise, excellent cafe et aussi de l alcool ;)',
    ba1: 'Bar a cocktails populaire a Blloku avec une ambiance animee.',
    ho1: 'Confort raffine au coeur de Tirana, avec design elegant, equipements haut de gamme et emplacement central.',
    ho3: 'Hotel elegant avec grand jardin et piscine.',
    re3: 'Cuisine albanaise authentique dans une maison traditionnelle.',
    ca2: 'Cafe detendu avec bon cafe et desserts.',
    ba2: 'Bar simple avec musique et boissons.',
    ho4: 'Hotel elegant au centre-ville.',
    re4: 'Restaurant de fruits de mer avec belle vue sur la mer.',
    ca3: 'Lieu parfait pour un cafe sur la promenade.',
    ho5: 'Hotel en falaise avec acces direct a la mer.',
    ho6: 'Hotel moderne pres de la promenade avec piscine sur le toit.',
    ba3: 'Bar sur le toit avec superbes vues au coucher du soleil.',
    ho7: 'Hotel moderne proche de la plage.',
    be4: 'Eaux claires et atmosphere calme juste en dehors de Vlore.',
    be5: 'Grande plage avec melange de sable et de galets.',
    re5: 'Restaurant de style italien avec fruits de mer frais.',
    ca4: 'Cafe en bord de plage avec ambiance detendue.',
    ba6: 'Bar de plage tendance avec cocktails.',
    ho8: 'Hotel classique en front de mer avec plage privee.',
    ho9: 'Hotel de luxe avec spa et vue mer.',
    ho10: 'Hotel confortable pres de la plage a Shengjin.',
    be7: 'La plus grande plage d Albanie avec de nombreux resorts et restaurants.',
    be8: 'Plage de sable populaire avec hotels et vie nocturne.',
    be9: 'Plage detendue avec infrastructure touristique en developpement.',
    be10: 'Grande plage de sable entouree par la nature.',
    re6: 'Restaurant de fruits de mer celebre pres de la plage.',
    ca5: 'Cafe tranquille avec vue sur la mer.',
    ba11: 'Bar de plage avec musique et cocktails.',
    ho11: 'Hotel moderne proche de la plage.',
    be12: 'Celebre pour son eau turquoise et ses petites iles au large.',
    be13: 'Pepite cachee avec eau cristalline et ambiance plus detendue.',
    be14: 'Connue pour son eau miroir et ses falaises spectaculaires.',
    re7: 'L un des restaurants farm-to-table les plus connus d Albanie.',
    ca6: 'Cafe simple avec bon cafe.',
    ba15: 'Bar local avec musique et boissons.',
    ho12: 'Hotel confortable pres du centre.',
    re8: 'Restaurant de fruits de mer avec vues superbes.',
    ca7: 'Joli cafe avec desserts et cafe.',
    ba16: 'Beach club celebre avec fetes et boissons.',
    ho13: 'Hotel en bord de mer avec appartements et acces plage prive.',
    ho14: 'Resort elegant en bord de plage avec piscine infinity.',
    be16: 'Une des plages les plus populaires d Albanie avec eau cristalline.',
    be17: 'Plage tendance avec beach clubs et superbes couchers de soleil.',
    be18: 'Celebre pour la vie nocturne et les fetes sur la plage.',
    be19: 'Paradis recule accessible par une randonnee dans le canyon.',
    ho15: 'Resort en bord de plage avec atmosphere detendue et tendance.',
    ho16: 'Hotel elegant avec vues panoramiques sur la mer.',
    ho17: 'Resort moderne en bord de mer avec ambiance vibrante.',
  },
  it: {
    re1: 'Mullixhiu offre una versione moderna della cucina tradizionale albanese con ingredienti locali e ricette stagionali. Una tappa imperdibile a Tirana per un esperienza autentica e raffinata.',
    re2: 'Accogliente ristorante in giardino con piatti albanesi tradizionali preparati con ingredienti freschi e locali.',
    ca1: 'Caffe unico con cultura albanese, ottimo caffe e anche alcol ;)',
    ba1: 'Popolare cocktail bar a Blloku con atmosfera vivace.',
    ho1: 'Comfort raffinato nel cuore di Tirana, con design elegante, servizi di alto livello e posizione centrale.',
    ho3: 'Hotel elegante con grande giardino e area piscina.',
    re3: 'Cucina albanese autentica in una casa tradizionale.',
    ca2: 'Caffe rilassato con ottimo caffe e dessert.',
    ba2: 'Bar informale con musica e drink.',
    ho4: 'Hotel elegante nel centro citta.',
    re4: 'Ristorante di pesce con splendida vista mare.',
    ca3: 'Luogo perfetto per un caffe sulla passeggiata.',
    ho5: 'Hotel sulla scogliera con accesso diretto al mare.',
    ho6: 'Hotel moderno vicino alla passeggiata con piscina rooftop.',
    ba3: 'Rooftop bar con splendide viste al tramonto.',
    ho7: 'Hotel moderno vicino alla spiaggia.',
    be4: 'Acque limpide e atmosfera calma appena fuori Vlore.',
    be5: 'Ampia spiaggia con mix di sabbia e ciottoli.',
    re5: 'Ristorante in stile italiano con pesce fresco.',
    ca4: 'Caffe sulla spiaggia con atmosfera rilassata.',
    ba6: 'Beach bar trendy con cocktail.',
    ho8: 'Classico hotel fronte mare con spiaggia privata.',
    ho9: 'Hotel di lusso con spa e vista mare.',
    ho10: 'Hotel confortevole vicino alla spiaggia a Shengjin.',
    be7: 'La spiaggia piu grande dell Albania con molti resort e ristoranti.',
    be8: 'Popolare spiaggia sabbiosa con hotel e vita notturna.',
    be9: 'Spiaggia rilassata con infrastruttura turistica in crescita.',
    be10: 'Ampia spiaggia sabbiosa circondata dalla natura.',
    re6: 'Famoso ristorante di pesce vicino alla spiaggia.',
    ca5: 'Caffe tranquillo con vista mare.',
    ba11: 'Beach bar con musica e cocktail.',
    ho11: 'Hotel moderno vicino alla spiaggia.',
    be12: 'Famosa per acqua turchese e piccole isole al largo.',
    be13: 'Gemma nascosta con acqua cristallina e atmosfera piu rilassata.',
    be14: 'Nota per l acqua riflettente e le scogliere spettacolari.',
    re7: 'Uno dei ristoranti farm-to-table piu famosi dell Albania.',
    ca6: 'Caffe semplice con buon caffe.',
    ba15: 'Bar locale con musica e drink.',
    ho12: 'Hotel confortevole vicino al centro.',
    re8: 'Ristorante di pesce con viste incredibili.',
    ca7: 'Bel caffe con dessert e caffe.',
    ba16: 'Famoso beach club con feste e drink.',
    ho13: 'Hotel sul mare con appartamenti e accesso privato alla spiaggia.',
    ho14: 'Elegante resort fronte spiaggia con piscina infinity.',
    be16: 'Una delle spiagge piu popolari dell Albania con acqua cristallina.',
    be17: 'Spiaggia trendy con beach club e tramonti spettacolari.',
    be18: 'Famosa per vita notturna e feste in spiaggia.',
    be19: 'Paradiso remoto raggiungibile con un escursione nel canyon.',
    ho15: 'Resort fronte spiaggia con atmosfera rilassata e trendy.',
    ho16: 'Hotel elegante con vista panoramica sul mare.',
    ho17: 'Resort moderno fronte spiaggia con atmosfera vivace.',
  },
  es: {
    re1: 'Mullixhiu ofrece una version moderna de la cocina tradicional albanesa con ingredientes locales y recetas de temporada. Una visita imprescindible en Tirana para una experiencia autentica y refinada.',
    re2: 'Acogedor restaurante jardin con platos tradicionales albaneses elaborados con ingredientes frescos y locales.',
    ca1: 'Cafe unico con cultura albanesa, gran cafe y tambien alcohol ;)',
    ba1: 'Popular bar de cocteles en Blloku con ambiente animado.',
    ho1: 'Comodidad refinada en el corazon de Tirana, con diseno elegante, servicios de alta gama y ubicacion central.',
    ho3: 'Hotel elegante con gran jardin y zona de piscina.',
    re3: 'Cocina albanesa autentica en una casa tradicional.',
    ca2: 'Cafe relajado con buen cafe y postres.',
    ba2: 'Bar informal con musica y bebidas.',
    ho4: 'Hotel elegante en el centro de la ciudad.',
    re4: 'Restaurante de mariscos con bonita vista al mar.',
    ca3: 'Lugar perfecto para cafe junto al paseo.',
    ho5: 'Hotel en acantilado con acceso directo al mar.',
    ho6: 'Hotel moderno cerca del paseo con piscina en la azotea.',
    ba3: 'Bar en la azotea con impresionantes vistas del atardecer.',
    ho7: 'Hotel moderno cerca de la playa.',
    be4: 'Aguas claras y ambiente tranquilo justo fuera de Vlore.',
    be5: 'Playa amplia con mezcla de arena y guijarros.',
    re5: 'Restaurante de estilo italiano con mariscos frescos.',
    ca4: 'Cafe junto a la playa con ambiente relajado.',
    ba6: 'Beach bar moderno con cocteles.',
    ho8: 'Hotel clasico frente al mar con playa privada.',
    ho9: 'Hotel de lujo con spa y vistas al mar.',
    ho10: 'Hotel comodo cerca de la playa en Shengjin.',
    be7: 'La playa mas grande de Albania con muchos resorts y restaurantes.',
    be8: 'Playa de arena popular con hoteles y vida nocturna.',
    be9: 'Playa relajada con infraestructura turistica en crecimiento.',
    be10: 'Amplia playa de arena rodeada de naturaleza.',
    re6: 'Famoso restaurante de mariscos cerca de la playa.',
    ca5: 'Cafe tranquilo con vista al mar.',
    ba11: 'Beach bar con musica y cocteles.',
    ho11: 'Hotel moderno cerca de la playa.',
    be12: 'Famosa por su agua turquesa y pequenas islas cerca de la costa.',
    be13: 'Joya oculta con agua cristalina y ambiente mas relajado.',
    be14: 'Conocida por su agua reflectante y acantilados dramaticos.',
    re7: 'Uno de los restaurantes farm-to-table mas famosos de Albania.',
    ca6: 'Cafe sencillo con buen cafe.',
    ba15: 'Bar local con musica y bebidas.',
    ho12: 'Hotel comodo cerca del centro.',
    re8: 'Restaurante de mariscos con vistas increibles.',
    ca7: 'Bonito cafe con postres y cafe.',
    ba16: 'Famoso beach club con fiestas y bebidas.',
    ho13: 'Hotel frente al mar con apartamentos y acceso privado a la playa.',
    ho14: 'Resort elegante frente a la playa con piscina infinity.',
    be16: 'Una de las playas mas populares de Albania con agua cristalina.',
    be17: 'Playa moderna con beach clubs y atardeceres impresionantes.',
    be18: 'Famosa por vida nocturna y fiestas en la playa.',
    be19: 'Paraiso remoto accesible mediante una caminata por el canon.',
    ho15: 'Resort frente a la playa con ambiente relajado y moderno.',
    ho16: 'Hotel elegante con vistas panoramicas al mar.',
    ho17: 'Resort moderno frente a la playa con ambiente vibrante.',
  },
};

function normalizeLookupKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function getCategoryKey(itemOrKey) {
  const rawKey =
    typeof itemOrKey === 'string'
      ? itemOrKey
      : itemOrKey?.legacyId || itemOrKey?.id || itemOrKey?.name;
  const normalizedKey = normalizeLookupKey(rawKey);
  return CATEGORY_KEY_ALIASES[normalizedKey] || normalizedKey;
}

export function getLocalizedCategoryName(categoryId, categoryName, languageCode) {
  const categoryKey = getCategoryKey(categoryId || categoryName);
  const language = normalizeLanguageCode(languageCode);

  if (!categoryKey || language === 'en') {
    return categoryName || categoryId;
  }

  const localizedName = translate(language, `categories.labels.${categoryKey}`, {
    category: categoryName || categoryId,
  });

  if (localizedName.startsWith('categories.labels.')) {
    return categoryName || categoryId;
  }

  return localizedName;
}

export function localizeAppDataSet(dataSet, languageCode) {
  const language = normalizeLanguageCode(languageCode);

  if (language === 'en') {
    return dataSet;
  }

  const categoryNameById = new Map();

  const categories = dataSet.categories.map((category) => {
    const categoryKey = getCategoryKey(category);
    const localizedName = translate(language, `categories.labels.${categoryKey}`);
    const nextCategory = {
      ...category,
      name: localizedName === `categories.labels.${categoryKey}` ? category.name : localizedName,
    };

    categoryNameById.set(String(category.id), nextCategory.name);
    categoryNameById.set(String(category.legacyId), nextCategory.name);

    return nextCategory;
  });

  const cities = dataSet.cities.map((city) => {
    const cityKey = normalizeLookupKey(city.legacyId || city.id || city.name);
    const localizedDescription = CITY_DESCRIPTIONS[language]?.[cityKey];

    return {
      ...city,
      description: localizedDescription || city.description,
    };
  });

  const places = dataSet.places.map((place) => {
    const placeKey = normalizeLookupKey(place.legacyId || place.id);
    const categoryKey = getCategoryKey(place.categoryId || place.categoryName);
    const localizedDescription = PLACE_DESCRIPTIONS[language]?.[placeKey];
    const localizedCategory =
      categoryNameById.get(String(place.categoryId)) ||
      translate(language, `categories.labels.${categoryKey}`);

    return {
      ...place,
      categoryName:
        localizedCategory === `categories.labels.${categoryKey}`
          ? place.categoryName
          : localizedCategory,
      description: localizedDescription || place.description,
    };
  });

  return {
    categories,
    cities,
    places,
  };
}
