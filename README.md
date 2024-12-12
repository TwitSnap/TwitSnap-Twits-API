# Twits


- [Twits](#twits)
  - [Microservicios de Twits](#microservicios-de-twits)
    - [Arquitectura](#arquitectura)
  - [Prerequisitos](#prerequisitos)
    - [**Como instalar y correr**](#como-instalar-y-correr)
    - [**Environment variables**](#environment-variables)
    - [**Comandos para correr el servicio**](#comandos-para-correr-el-servicio)
  - [Documentacion](#documentacion)
  - [Tests](#tests)

## Microservicios de Twits

Este microservicio se encarga de todo lo relacionado con los twits, las interacciones con ellos (likes,comentarios,snapshares) utilizando una base de datos de grafos llamada Neo4j e implementado en Typescript.

### Arquitectura
  Para este microservicio se decidió seguir el modelo de capas controlador-servicio-repositorio-routeo.

## Prerequisitos

1) Docker
2) Docker Desktop
3) Node.js

### **Como instalar y correr**

Se provee un docker-compose.yml para poder facilitar la ejecucion del ambiente.
Se provee tambien un .env.example con lo necesario para correr este microservicio

### **Environment variables**

  Para poder correr el programa correctamente se deben setear las variables de entorno correspondientes en un .env
  PORT = Puerto en el que se va a abrir el servicio
NODE_ENV= Modo en el cual se abrira el servicio, test o dev

LOG_ROUTE= Ruta donde se guardará todos los logs
LOGGING= Si se deben logear mensajes en general 
LOG_INFO/ERROR/DEBUG= True si se quiere que se loguee ese nivel de log
AURA_URI= Path a la base de datos Neo4j en Aura
AURA_USER= Usuario de Neo4j
AURA_PASSWORD= Contraseña de la base de datos

AURA_TEST_URI=Path a la base de datos Neo4j en Aura para tests
AURA_TEST_USER= Usuario de Neo4j para tests
AURA_TEST_PASSWORD= Contraseña de la base de datos par tests

TEST_MATCH= Path al directorio donde se encuentran los tests

### **Comandos para correr el servicio**
```bash
    # Con Docker compose
    docker-compose up --build -d
    # y para cerrar el microservicio
    docker-compose down

    # Para correr docker solo
    docker build --tag "app" .
    docker run --detach --name "app" -it app
    # y para pararlo
    docker kill app
    docker container rm app

    #Se puede correr normalmente
    npm run install
    npm run dev
```

## Documentacion

La documentacion de la api se puede encontrar en /api-docs del servidor [API Docs](https://twitsnap-twits-api.onrender.com/api-docs)


## Tests

```bash
    # Para correr los test se utilizo la suite de test 'jest'
    # El comando para ejecutar dichos test es:
    npm run test

    # si se quire correr un test en particual se puede usar
    # comnado que busque test con nombres similares

    npm run test -t "nombre_del_test"

```