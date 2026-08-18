import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhase8D1786713845018 implements MigrationInterface {
  name = 'AddPhase8D1786713845018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "waitlist" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "productId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8fee1cb6b243186b785102b964e" UNIQUE ("userId", "productId"), CONSTRAINT "PK_973cfbedc6381485681d6a6916c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "returns" ("id" SERIAL NOT NULL, "orderId" integer NOT NULL, "userId" integer NOT NULL, "reason" text NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_27a2f1895a71519ebfec7850361" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "savedPaymentMethods" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "trackingLatitude" numeric(10,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "trackingLongitude" numeric(10,6)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "trackingHistory" jsonb NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "rating" SET DEFAULT '4.5'`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlist" ADD CONSTRAINT "FK_753fb4a7680054d90a68b243ae2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlist" ADD CONSTRAINT "FK_6333bf7c00c5deb8e49b04b7933" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "returns" ADD CONSTRAINT "FK_b3851bc6d0e2a7ddc7412806a0f" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "returns" ADD CONSTRAINT "FK_2cbd012253b843a98634386723d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "returns" DROP CONSTRAINT "FK_2cbd012253b843a98634386723d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "returns" DROP CONSTRAINT "FK_b3851bc6d0e2a7ddc7412806a0f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlist" DROP CONSTRAINT "FK_6333bf7c00c5deb8e49b04b7933"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlist" DROP CONSTRAINT "FK_753fb4a7680054d90a68b243ae2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "rating" SET DEFAULT 4.5`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "trackingHistory"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "trackingLongitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "trackingLatitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "savedPaymentMethods"`,
    );
    await queryRunner.query(`DROP TABLE "returns"`);
    await queryRunner.query(`DROP TABLE "waitlist"`);
  }
}
