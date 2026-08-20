import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPgVectorExtension1786963000000 implements MigrationInterface {
  name = 'AddPgVectorExtension1786963000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enable pgvector extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    // 2. Create product_embeddings table
    await queryRunner.query(`
      CREATE TABLE "product_embeddings" (
        "product_id" integer NOT NULL,
        "embedding" vector(768) NOT NULL,
        CONSTRAINT "PK_product_embeddings" PRIMARY KEY ("product_id"),
        CONSTRAINT "FK_product_embeddings_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_embeddings";`);
  }
}
