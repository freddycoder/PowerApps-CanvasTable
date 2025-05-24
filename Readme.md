# Canvas Grid Control

doc: https://learn.microsoft.com/en-us/power-apps/developer/component-framework/tutorial-create-canvas-dataset-component?tabs=before

## Executer sur votre poste

```
npm start
```

ou pour le développement avec rafraichissement automatique

```
npm start watch
```

## Préparer à publier

1. Executer la commande suivante:
```
pac auth create --environment "Sales Trial"
```

Si la commande pac n'est pas trouvée, il faut l'installer le msi pour installer l'outil. Voir la document de microsoft: https://learn.microsoft.com/en-us/power-platform/developer/howto/install-cli-msi

## Publier une solution zip pour importation

1. Executer la commande suivante:
```
pac pcf push --publisher-prefix fred
```

2. Importer la solution généré dans sales

Versioning info: https://dianabirkelbach.wordpress.com/2020/12/23/all-about-pcf-versioning/

## Manifest schema reference

Property Set Element

https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/property-set