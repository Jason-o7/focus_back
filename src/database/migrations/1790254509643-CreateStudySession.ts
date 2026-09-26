import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStudySession1790254509643 implements MigrationInterface {
    name = 'CreateStudySession1790254509643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "study_sessions" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "mode" character varying(10) NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ended_at" TIMESTAMP WITH TIME ZONE NOT NULL, "day" date NOT NULL, "focused_ms" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_6206551eb85e6efd9884e79e9f" CHECK ("focused_ms" >= 0), CONSTRAINT "CHK_5193f8eb15f13a3914b8a4651c" CHECK ("ended_at" <= "started_at" + interval '25 hours'), CONSTRAINT "CHK_646e11079ab40b28b0ff9d20ef" CHECK ("ended_at" >= "started_at"), CONSTRAINT "CHK_3c4d953d6a5c64d4e0b1f6aea9" CHECK ("mode" IN ('timer', 'stopwatch')), CONSTRAINT "PK_529b2be328c0a953f9bf0cf988e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d4c0a236fa5869c4cc929e2e23" ON "study_sessions"  ("user_id", "started_at") `);
        await queryRunner.query(`ALTER TABLE "study_sessions" ADD CONSTRAINT "FK_5ea09953d6fd1462a931a596e23" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_sessions" DROP CONSTRAINT "FK_5ea09953d6fd1462a931a596e23"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d4c0a236fa5869c4cc929e2e23"`);
        await queryRunner.query(`DROP TABLE "study_sessions"`);
    }

}
