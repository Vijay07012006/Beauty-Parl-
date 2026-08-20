import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('product_embeddings')
export class ProductEmbedding {
  @PrimaryColumn({ name: 'product_id' })
  productId!: number;

  @Column('text', {
    transformer: {
      to: (value: number[] | null) => {
        if (!value) return null;
        return `[${value.join(',')}]`;
      },
      from: (value: string | null) => {
        if (!value) return [];
        // Format returned by pgvector is: "[0.123,0.456,...]"
        return value.replace('[', '').replace(']', '').split(',').map(Number);
      },
    },
  })
  embedding!: number[];
}
