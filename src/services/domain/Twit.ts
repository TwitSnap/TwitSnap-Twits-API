import {Column, Entity, PrimaryColumn} from "typeorm";

@Entity("Twit")
export class Twit {
    @PrimaryColumn()
    private readonly id: string;

    @Column({ nullable: false })
    private readonly password: string;

    constructor(id: string, password: string) {
        this.id = id;
        this.password = password;
    }

    public getId = (): string => this.id;

    public getPassword = (): string => this.password;

}