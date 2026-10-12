# Leerpop

Een Bubble Shooter waarmee je Duurzaamheid en Business Ethics oefent. Je kunt ook eigen begrippenmodules maken.

**Website:** https://fabianb88.github.io/leerpop/

## Gedeelde highscores

Vul een naam of bijnaam in, speel een cursus en kies **Score bewaren**. Ook **Cursussen** opent het bewaarvenster wanneer je punten hebt. Je kunt daar je naam invullen of wijzigen, verder spelen, of stoppen zonder bewaren.

De top 10 spelrondes per vaste cursus zijn voor alle bezoekers zichtbaar en worden live bijgewerkt. Een goed antwoord geeft 100 punten en iedere gepopte bubbel 10. Voortgang en eigen modules blijven op het apparaat staan; eigen modules doen niet mee aan het openbare scorebord.

Het scorebord gebruikt het bestaande Firebase-project `portfolio-minor-ce`, met de aparte collectie `leerpop_scores/{course}/entries`. De studentengids blijft zijn eigen collectie `learninggame_scores` gebruiken. Scores kunnen via de website alleen worden toegevoegd, niet gewijzigd of verwijderd. De regels controleren velden, lengtes, scoregrenzen en de servertijd. Het is een informeel leerspel: scores worden in de browser berekend.

`score-config.js` bevat openbare Firebase-webconfiguratie, geen beheerwachtwoorden. De aanvullende regels staan in `firebase/leerpop.rules`. Deze zijn toegevoegd aan de bestaande projectregels. Dit fragment is geen compleet projectregelsbestand: voeg het bij toekomstige Firebase-deployments toe aan de regels van het gehele project, zodat de bestaande portfolio- en studentengidsregels behouden blijven.

## Publicatie

GitHub Pages publiceert de hoofdmap van de `main`-branch. `.nojekyll` zorgt dat de bestanden direct worden geserveerd. Er is geen buildstap nodig. Wijzig `index.html`, `style.css`, `app.js` of `questions.json`, commit en push naar `main` om de website bij te werken.

`leerpop.html` bevat dezelfde versie met de vormgeving, vragen en spelcode ingebouwd in één bestand. Voor het gedeelde scorebord blijft een internetverbinding nodig.

## Controle

`node --test tests/scores.test.cjs` controleert naamvalidatie, scorevalidatie en het voorkomen van dubbele inzendingen bij opnieuw bewaren. Het spel, het bewaarvenster en het gedeelde scorebord zijn ook in de browser gecontroleerd.
