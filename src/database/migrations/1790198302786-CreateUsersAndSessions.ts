import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersAndSessions1790198302786 implements MigrationInterface {
    name = 'CreateUsersAndSessions1790198302786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(254) NOT NULL, "password_hash" character varying(255) NOT NULL, "username" character varying(30) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "mode" character varying(10) NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ended_at" TIMESTAMP WITH TIME ZONE NOT NULL, "day" date NOT NULL, "focused_ms" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_7a8ea2607efb57c6176a181997" CHECK ("focused_ms" >= 0), CONSTRAINT "CHK_a39d2b0c607877137b51c719fb" CHECK ("ended_at" <= "started_at" + interval '25 hours'), CONSTRAINT "CHK_5c3dce1d685577cbc098cf2c1d" CHECK ("ended_at" >= "started_at"), CONSTRAINT "CHK_70b39a269dddecf57128c4d02d" CHECK ("mode" IN ('timer', 'stopwatch')), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_207f7cb3e3c24c875e0ac6b471" ON "sessions"  ("user_id", "started_at") `);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_207f7cb3e3c24c875e0ac6b471"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
