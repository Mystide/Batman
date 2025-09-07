# Batman

## Projektübersicht
Ziel der Anwendung ist es, eine Übersicht über Batman-Comics zu bieten und den persönlichen Lesestatus zu verwalten.
Die App lädt Metadaten aus JSON-Dateien, bietet Filterfunktionen und speichert den Lesestatus optional in einem GitHub-Gist.

## GitHub-Gist Token-Konfiguration
Um den Lesestatus geräteübergreifend zu sichern, wird ein persönlicher GitHub-Token benötigt:
1. Auf GitHub unter Settings → Developer settings → Personal access tokens einen Token mit dem `gist`-Scope erzeugen.
2. In der Anwendung den Link „Token setzen“ verwenden und den Token einfügen.
Ohne Token bleibt der Lesestatus nur lokal im Browser gespeichert.

## Datenablage
Die Comic-Daten liegen als mehrere Dateien im Verzeichnis `data/` und werden über `data/list.json` eingebunden.
Ein zusammengefasster Export kann optional als `comics.json` erzeugt werden, wird jedoch nicht versioniert.

## Development server

Install dependencies and launch:

```bash
npm install
npm start
```

## Tests & Linting
Before committing, ensure that tests and linters run without errors:

```bash
npm test
npm run lint
```
