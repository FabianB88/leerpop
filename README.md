# Leerpop

Een Bubble Shooter waarmee je Duurzaamheid en Business Ethics oefent. Je kunt ook eigen begrippenmodules maken.

**Website:** https://fabianb88.github.io/leerpop/

## Gedeelde highscores

Vul een naam of bijnaam in, speel een cursus en kies **Score bewaren**. Ook **Cursussen** opent het bewaarvenster wanneer je punten hebt. Je kunt daar je naam invullen of wijzigen, verder spelen, of stoppen zonder bewaren.

De top 10 spelrondes per vaste cursus zijn voor alle bezoekers zichtbaar en worden live bijgewerkt. Een goed basisantwoord geeft 100 punten, een verdiepingsantwoord 200 en iedere verwijderde bubbel 10. Voortgang en eigen modules blijven op het apparaat staan; eigen modules doen niet mee aan het openbare scorebord.

## Onderwerpen en specials

Je speelt de onderwerpen op volgorde. Kies je een onderwerp in de lijst, dan ga je na die vragen automatisch verder met de volgende onderwerpen. Iedere vraag verschijnt één keer per ronde. Fout beantwoorde vragen blijven beschikbaar via **Alleen lastige vragen**; ze blokkeren de overgang naar het volgende onderwerp niet. Na de laatste vraag kun je je score bewaren of zelf een nieuwe ronde starten.

Na **drie goede antwoorden op rij** verdien je een **kleurknaller**: tijdens het schieten verwijdert die alle bubbels met de kleur van je huidige schot. Een goed beantwoorde **verdiepingsvraag** geeft ook een **rijveger**, waarmee je de onderste gevulde rij verwijdert. Losgeraakte bubbels verdwijnen mee. Een special kost geen normaal schot. Een fout antwoord onderbreekt je reeks; verdiende specials blijven beschikbaar binnen dezelfde spelsessie.

De optie **Ook verdiepingsvragen** voegt moeilijkere vragen toe na de basisvragen van elk onderwerp. De vraagbank volgt de twee [curriculum-e-learnings in de studentenhandleiding](https://fabianb88.github.io/minor-ce-studentenhandleiding/learnings.html): [Duurzaamheid, circulariteit en systeemdenken](https://fabianb88.github.io/minor-ce-elearnings/player.html?c=duurzaamheid-fundamenten) en [Business Ethics](https://fabianb88.github.io/minor-ce-elearnings/cursus.html?m=business-ethics). Vragen over het benoemen van aardsferen zijn vervangen door planetaire grenzen, risico’s en samenhang. Nieuwe vragen behandelen onder meer R-strategieën, geïntegreerde waardecreatie, dubbele materialiteit, systeemlussen, netcongestie, biomimicry en strategische afwegingen. Business Ethics bevat aanvullende kennisvragen uit de e-learning.

Het scorebord gebruikt het bestaande Firebase-project `portfolio-minor-ce`, met de aparte collectie `leerpop_scores/{course}/entries`. De studentengids blijft zijn eigen collectie `learninggame_scores` gebruiken. Scores kunnen via de website alleen worden toegevoegd, niet gewijzigd of verwijderd. De regels controleren velden, lengtes, scoregrenzen en de servertijd. Het is een informeel leerspel: scores worden in de browser berekend.

`score-config.js` bevat openbare Firebase-webconfiguratie, geen beheerwachtwoorden. De aanvullende regels staan in `firebase/leerpop.rules`. Deze zijn toegevoegd aan de bestaande projectregels. Dit fragment is geen compleet projectregelsbestand: voeg het bij toekomstige Firebase-deployments toe aan de regels van het gehele project, zodat de bestaande portfolio- en studentengidsregels behouden blijven.

## Publicatie

GitHub Pages publiceert de hoofdmap van de `main`-branch. `.nojekyll` zorgt dat de bestanden direct worden geserveerd. Er is geen buildstap nodig. Wijzig `index.html`, `style.css`, `app.js` of `questions.json`, commit en push naar `main` om de website bij te werken.

`leerpop.html` bevat dezelfde versie met de vormgeving, vragen en spelcode ingebouwd in één bestand. Voor het gedeelde scorebord blijft een internetverbinding nodig.

## Controle

`node --test tests/*.test.cjs` controleert onderwerpvolgorde, vraagfilters, beloningen, special-effecten, vraagbankvalidatie en scoreopslag. Het spel, het bewaarvenster en het gedeelde scorebord worden ook in de browser gecontroleerd.
