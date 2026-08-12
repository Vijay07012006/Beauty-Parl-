import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizResponse } from './quiz-response.entity';
import { Product } from '../products/product.entity';

const QUIZZES = [
  {
    id: 'skin-type',
    title: 'Skin Care Diagnostic Quiz',
    description: 'Find the perfect skincare routine tailored to your skin type and concerns.',
    questions: [
      {
        id: 'skin_feel',
        text: 'How does your skin feel in the afternoon?',
        options: [
          { value: 'oily', text: 'Shiny and greasy all over' },
          { value: 'dry', text: 'Tight, flaky, or rough' },
          { value: 'combination', text: 'Oily in the T-zone, dry on the cheeks' },
          { value: 'normal', text: 'Comfortable, balanced and smooth' },
        ],
      },
      {
        id: 'concern',
        text: 'What is your primary skin concern?',
        options: [
          { value: 'acne', text: 'Breakouts and clogged pores' },
          { value: 'aging', text: 'Fine lines, wrinkles, or loss of firmness' },
          { value: 'dryness', text: 'Dehydration and lack of moisture' },
          { value: 'dullness', text: 'Dark spots and uneven skin tone' },
        ],
      },
      {
        id: 'sensitivity',
        text: 'Does your skin react easily to new cosmetics?',
        options: [
          { value: 'yes', text: 'Yes, easily turns red or stings' },
          { value: 'no', text: 'No, handles most products fine' },
        ],
      },
    ],
  },
  {
    id: 'makeup-style',
    title: 'Makeup Style Quiz',
    description: 'Discover the makeup look that speaks your visual aesthetic.',
    questions: [
      {
        id: 'look_preference',
        text: 'What is your ideal daily makeup aesthetic?',
        options: [
          { value: 'natural', text: 'Clean girl look, subtle glow, "no makeup" feel' },
          { value: 'glam', text: 'Bold lips, smoky eyes, contoured cheeks' },
          { value: 'vintage', text: 'Classic winged eyeliner, matte red lip' },
          { value: 'bold', text: 'Vibrant colors, dramatic shadows, expressive shimmers' },
        ],
      },
      {
        id: 'lip_preference',
        text: 'Which lipstick texture do you prefer?',
        options: [
          { value: 'glossy', text: 'Dewy, wet-shine glosses or lip oils' },
          { value: 'matte', text: 'Velvety, long-wear matte liquids or bullets' },
          { value: 'satin', text: 'Creamy, moisturizing satin sticks' },
        ],
      },
    ],
  },
];

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(QuizResponse)
    private readonly qrRepo: Repository<QuizResponse>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  getQuizzes() {
    return QUIZZES.map(({ id, title, description }) => ({ id, title, description }));
  }

  getQuizQuestions(quizId: string) {
    const quiz = QUIZZES.find((q) => q.id === quizId);
    return quiz ? quiz.questions : null;
  }

  async submitAnswers(
    quizId: string,
    answers: Record<string, string>,
    userId?: number,
    sessionId?: string,
  ): Promise<{ recommendations: Product[]; id: number }> {
    const recommendations = await this.getRecommendations(quizId, answers);

    const savedResponse = this.qrRepo.create({
      userId,
      sessionId,
      answers,
      recommendedProducts: recommendations.map((p) => ({ id: p.id, name: p.name })),
    });

    const saved = await this.qrRepo.save(savedResponse);

    // M-11: cap stored quiz responses per user/session (keeps rows bounded even under
    // anonymous-session spam) — retain only the 5 most recent submissions.
    try {
      const where = userId ? { userId } : { sessionId: sessionId || '' };
      const recent = await this.qrRepo.find({ where, order: { createdAt: 'DESC' }, take: 10 });
      const stale = recent.slice(5).map((r) => r.id);
      if (stale.length > 0) {
        await this.qrRepo.delete(stale);
      }
    } catch (err) {
      console.warn('⚠️ [Quizzes] Failed to prune old quiz responses:', (err as Error).message);
    }

    return {
      recommendations,
      id: saved.id,
    };
  }

  private async getRecommendations(quizId: string, answers: Record<string, string>): Promise<Product[]> {
    const products = await this.productRepo.find();
    const scored = products.map((product) => {
      let score = 0;
      const textToSearch = `${product.name} ${product.description} ${product.category}`.toLowerCase();

      if (quizId === 'skin-type') {
        const concern = answers['concern'];
        const skinFeel = answers['skin_feel'];

        if (skinFeel === 'dry' || concern === 'dryness') {
          if (
            textToSearch.includes('dry') ||
            textToSearch.includes('hydrate') ||
            textToSearch.includes('moistur') ||
            textToSearch.includes('cream')
          ) {
            score += 5;
          }
        }
        if (skinFeel === 'oily' || concern === 'acne') {
          if (
            textToSearch.includes('acne') ||
            textToSearch.includes('clear') ||
            textToSearch.includes('matte') ||
            textToSearch.includes('salicylic') ||
            textToSearch.includes('oil')
          ) {
            score += 5;
          }
        }
        if (concern === 'aging') {
          if (
            textToSearch.includes('anti-aging') ||
            textToSearch.includes('wrinkle') ||
            textToSearch.includes('firm') ||
            textToSearch.includes('retinol') ||
            textToSearch.includes('serum')
          ) {
            score += 5;
          }
        }
        if (answers['sensitivity'] === 'yes') {
          if (
            textToSearch.includes('gentle') ||
            textToSearch.includes('sensitive') ||
            textToSearch.includes('sooth') ||
            textToSearch.includes('organic')
          ) {
            score += 3;
          }
        }
      } else if (quizId === 'makeup-style') {
        const look = answers['look_preference'];
        const lip = answers['lip_preference'];

        if (lip === 'glossy') {
          if (
            textToSearch.includes('gloss') ||
            textToSearch.includes('oil') ||
            textToSearch.includes('shine')
          ) {
            score += 4;
          }
        }
        if (lip === 'matte') {
          if (
            textToSearch.includes('matte') ||
            textToSearch.includes('velvet') ||
            textToSearch.includes('long-wear')
          ) {
            score += 4;
          }
        }

        if (look === 'natural') {
          if (
            textToSearch.includes('natural') ||
            textToSearch.includes('nude') ||
            textToSearch.includes('tint') ||
            textToSearch.includes('glow')
          ) {
            score += 5;
          }
        }
        if (look === 'glam' || look === 'bold') {
          if (
            textToSearch.includes('bold') ||
            textToSearch.includes('intense') ||
            textToSearch.includes('glam') ||
            textToSearch.includes('red') ||
            textToSearch.includes('shimmer')
          ) {
            score += 5;
          }
        }
        if (look === 'vintage') {
          if (textToSearch.includes('classic') || textToSearch.includes('red') || textToSearch.includes('retro')) {
            score += 5;
          }
        }
      }

      return { product, score };
    });

    // If no matching scores, return the most popular products as fallbacks
    const matched = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score);

    if (matched.length === 0) {
      return products.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 4);
    }

    return matched.map((item) => item.product).slice(0, 4);
  }
}
