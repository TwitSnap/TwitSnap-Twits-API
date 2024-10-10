import { BadRequestError } from './../../../../api/errors/BadRequestError';
import { Comment } from './../../../../services/domain/Comment';
import { EagerResult } from "neo4j-driver";
import { Twit } from "../../../../services/domain/Twit";
import { StandardDatabaseError } from "../../../errors/StandardDatabaseError";
import { TwitRepository } from "../../interfaces/TwitRepository";
import { AuraRepository } from "./AuraRepository";
import { Post } from '../../../../services/domain/Post';



export class AuraTwitRepository extends AuraRepository implements TwitRepository{
    constructor(){
        super()
    }
        /**
     * @inheritDoc
     */
        getById = async (id: string): Promise<Post | null> => {
            const ans = await this.auraRepository.executeQuery('\
            MATCH (p:Post {id:$id})\
            RETURN p.id as post_id,p.message as message,p.created_by as created_by, p.tags as tags, p.created_at as created_at\
            ',{id:id})
            const record = ans.records.at(0);
            if (!record){
                throw new BadRequestError("");
            }
            return new Post(record.get("message"),record.get("tags"),record.get("created_by"),record.get("post_id"),record.get("created_at"))
        };
    
        /**
         * @inheritDoc
         */
        save = async (twit: Twit): Promise<EagerResult> => {
            return await this.auraRepository.executeQuery(
                'CREATE (p:Post {id:randomUUID(),\
                                created_by:$token,\
                                tags:$tags,\
                                message:$message, \
                                created_at: localdatetime()\
                })',
                {token:twit.getToken(),message:twit.getMessage(),tags:twit.getTags()}

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