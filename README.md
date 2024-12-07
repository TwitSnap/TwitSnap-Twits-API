# Twits


- [Twits](#twits)
  - [Microservicios de Twits](#microservicios-de-twits)
  - [Prerequisitos](#prerequisitos)
    - [**Como instalar y correr**](#como-instalar-y-correr)
  - [Tests](#tests)

## Microservicios de Twits

    Este microservicio se encarga de todo lo relacionado con los twits, las interacciones con ellos (likes,comentarios,snapshares). Utilizando una base de datos de grafos llamada Neo4j.

## Prerequisitos

1) Docker
2) Docker Desktop
3) Node.js

### **Como instalar y correr**

Se provee un docker-compose.yml para poder facilitar la ejecucion del ambiente.

```bash
    # Con Docker compose
    docker-compose up --build -d
    # y para cerrar el microservicio
    docker-compose down

    # Para correr docker solo
    docker build --tag "app"
    docker run --detach --name "app" -it app
    # y para pararlo
    docker kill app

    #Se puede correr normalmente tambien
    npm run install
    npm run start
```


## Tests

```bash
    # Para correr los test se utilizo la suite de test 'jest'
    # El comando para ejecutar dichos test es:
    npm run test

    # si se quire correr un test en particual se puede usar
    # comnado que busque test con nombres similares

    npm run test -t "nombre_del_test"

```