import { AURA_TEST_URI, AURA_TEST_USER, AURA_TEST_PASSWORD, AURA_URI, AURA_USER, AURA_PASSWORD } from './../../utils/config';
import * as neo4j from "neo4j-driver";
/**
 * The data source for TypeORM, configured with the database connection settings.
 */


export let AuraDataSource: neo4j.Driver;
if (process.env.NODE_ENV === "test"){
    console.log("Son pruebas");
    const URI = AURA_TEST_URI;
    const USER = AURA_TEST_USER;
    const PASSWORD = AURA_TEST_PASSWORD;
    const newAuraDriver = neo4j.driver(URI,  neo4j.auth.basic(USER, PASSWORD));
    AuraDataSource = neo4j.driver(URI,  neo4j.auth.basic(USER, PASSWORD));
}
else{
    const URI = AURA_URI;
    const USER = AURA_USER
    const PASSWORD = AURA_PASSWORD;
    console.log("No son pruebas");
    AuraDataSource = neo4j.driver(URI,  neo4j.auth.basic(USER, PASSWORD));

}
