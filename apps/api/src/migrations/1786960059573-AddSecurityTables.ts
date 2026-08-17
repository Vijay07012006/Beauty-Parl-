import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSecurityTables1786960059573 implements MigrationInterface {
    name = 'AddSecurityTables1786960059573'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`TRUNCATE "user_sessions" CASCADE`);
        await queryRunner.query(`CREATE TABLE "deletion_requests" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "email" character varying(255) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "requested_at" TIMESTAMP NOT NULL DEFAULT now(), "completed_at" TIMESTAMP, CONSTRAINT "PK_f8ee986c713abeb93129e4bab0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "fraud_alerts" ("id" SERIAL NOT NULL, "order_id" integer NOT NULL, "user_id" integer, "reason" text NOT NULL, "confidence_score" numeric(5,2) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d1e5b58078239461d43d906f08e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "last_activity_at"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "token_hash"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "user_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "session_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "UQ_b6c41d19165af4c69eba9ecda46" UNIQUE ("session_id")`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "device_type" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "login_time" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "last_activity" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "rating" SET DEFAULT '4.5'`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "ip_address"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "ip_address" character varying(45)`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "user_agent"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "user_agent" text`);
        await queryRunner.query(`ALTER TABLE "deletion_requests" ADD CONSTRAINT "FK_b0424e6ba3a534e36f16ce65c65" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fraud_alerts" ADD CONSTRAINT "FK_c97cda37ce6c5b6c4f927e36ccf" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fraud_alerts" ADD CONSTRAINT "FK_c72bbae371a8bc163f38745afdc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`);
        await queryRunner.query(`ALTER TABLE "fraud_alerts" DROP CONSTRAINT "FK_c72bbae371a8bc163f38745afdc"`);
        await queryRunner.query(`ALTER TABLE "fraud_alerts" DROP CONSTRAINT "FK_c97cda37ce6c5b6c4f927e36ccf"`);
        await queryRunner.query(`ALTER TABLE "deletion_requests" DROP CONSTRAINT "FK_b0424e6ba3a534e36f16ce65c65"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "user_agent"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "user_agent" character varying`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "ip_address"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "ip_address" character varying`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "rating" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "last_activity"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "login_time"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "device_type"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "UQ_b6c41d19165af4c69eba9ecda46"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "session_id"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "token_hash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "last_activity_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "userId" integer NOT NULL`);
        await queryRunner.query(`DROP TABLE "fraud_alerts"`);
        await queryRunner.query(`DROP TABLE "deletion_requests"`);
    }

}
