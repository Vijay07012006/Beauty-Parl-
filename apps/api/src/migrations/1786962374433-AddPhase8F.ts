import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhase8F1786962374433 implements MigrationInterface {
    name = 'AddPhase8F1786962374433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "flash_sales" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "discount_percentage" integer NOT NULL, "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_70299593044ffcba05cc30b97dc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blog_comments" ("id" SERIAL NOT NULL, "post_id" integer NOT NULL, "user_id" integer NOT NULL, "comment" text NOT NULL, "is_approved" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b478aaeecf38441a25739aa9610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blog_posts" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "slug" character varying NOT NULL, "excerpt" text, "content" text NOT NULL, "image_url" character varying, "category" character varying, "tags" jsonb, "author_id" integer, "is_published" boolean NOT NULL DEFAULT false, "view_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5b2818a2c45c3edb9991b1c7a51" UNIQUE ("slug"), CONSTRAINT "PK_dd2add25eac93daefc93da9d387" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "flash_sale_products" ("flash_sale_id" integer NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "PK_6b589ce78a7351aa87964d8e900" PRIMARY KEY ("flash_sale_id", "product_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_feed21927beb816dc903d910ef" ON "flash_sale_products" ("flash_sale_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f049f078782ea89f22e2dcbf34" ON "flash_sale_products" ("product_id") `);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "loyaltyTier"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "loyalty_tier" character varying(20) NOT NULL DEFAULT 'silver'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "tier_benefits" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "reward_claimed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "referrals" ADD "reward_amount" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "rating" SET DEFAULT '4.5'`);
        await queryRunner.query(`ALTER TABLE "blog_comments" ADD CONSTRAINT "FK_4e0b8959256b08ceb3d001f616b" FOREIGN KEY ("post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blog_comments" ADD CONSTRAINT "FK_c34a2a0bf1dcc3687871de1ff1e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blog_posts" ADD CONSTRAINT "FK_c3fc4a3a656aad74331acfcf2a9" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flash_sale_products" ADD CONSTRAINT "FK_feed21927beb816dc903d910ef5" FOREIGN KEY ("flash_sale_id") REFERENCES "flash_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "flash_sale_products" ADD CONSTRAINT "FK_f049f078782ea89f22e2dcbf34f" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flash_sale_products" DROP CONSTRAINT "FK_f049f078782ea89f22e2dcbf34f"`);
        await queryRunner.query(`ALTER TABLE "flash_sale_products" DROP CONSTRAINT "FK_feed21927beb816dc903d910ef5"`);
        await queryRunner.query(`ALTER TABLE "blog_posts" DROP CONSTRAINT "FK_c3fc4a3a656aad74331acfcf2a9"`);
        await queryRunner.query(`ALTER TABLE "blog_comments" DROP CONSTRAINT "FK_c34a2a0bf1dcc3687871de1ff1e"`);
        await queryRunner.query(`ALTER TABLE "blog_comments" DROP CONSTRAINT "FK_4e0b8959256b08ceb3d001f616b"`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "rating" SET DEFAULT 4.5`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "reward_amount"`);
        await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN "reward_claimed"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tier_benefits"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "loyalty_tier"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "loyaltyTier" character varying(20) NOT NULL DEFAULT 'silver'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f049f078782ea89f22e2dcbf34"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_feed21927beb816dc903d910ef"`);
        await queryRunner.query(`DROP TABLE "flash_sale_products"`);
        await queryRunner.query(`DROP TABLE "blog_posts"`);
        await queryRunner.query(`DROP TABLE "blog_comments"`);
        await queryRunner.query(`DROP TABLE "flash_sales"`);
    }

}
