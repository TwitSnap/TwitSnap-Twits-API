import { Comment } from './../../../../services/domain/Comment';
import { EagerResult } from "neo4j-driver";
import { Twit } from "../../../../services/domain/Twit";
import { StandardDatabaseError } from "../../../errors/StandardDatabaseError";
import { TwitRepository } from "../../interfaces/TwitRepository";
import { AuraRepository } from "./AuraRepository";



export class AuraTwitRepository extends AuraRepository implements TwitRepository{
    constructor(){
        super()
    }
        /**
     * @inheritDoc
     */
        getById = async (id: string): Promise<Twit | null> => {
            return null;
        };
    
        /**
         * @inheritDoc
         */
        save = async (twit: Twit): Promise<EagerResult> => {
            return await this.auraRepository.executeQuery(
                'CREATE (p:Post {id:randomUUID(),\
                                created_by:$token,\
                                message:$message, \
                                created_at: localdatetime()\
                })',
                {token:twit.getToken(),message:twit.getMessage()}

            )
        };

        comment_post = async (comment: Comment): Promise<EagerResult> =>{
            return await this.auraRepository.executeQuery(
                'CREATE (c:Comment{id:randomUUID(),\
                                    created_by:$token,\
                                    message: $message,\
                                    created_at: localdatetime()\
                })\
                WITH c\
                MATCH (p:Post {id:$post_id})\
                CREATE (p)-[:COMMENTED_BY]->(c)\
                ',
                {token:comment.getToken(),
                message:comment.getMessage(),
                post_id:comment.getPostId()
                }
            )
        }
}