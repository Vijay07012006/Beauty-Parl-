'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QuizStep } from '@/components/quiz/QuizStep';
import { ProductCard } from '@/components/products/ProductCard';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Sparkles, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Quiz {
  id: string;
  title: string;
  description: string;
}

interface Option {
  value: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale || 'en';

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch available quizzes list
    api.get('/quizzes')
      .then((res) => {
        setQuizzes(res.data);
        
        // Check if query params have a specific quiz preselected
        const queryQuizId = searchParams.get('id');
        if (queryQuizId) {
          handleSelectQuiz(queryQuizId);
        }
      })
      .catch((err) => console.error('Failed to load quizzes:', err))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleSelectQuiz = async (quizId: string) => {
    try {
      setLoading(true);
      setSelectedQuizId(quizId);
      const res = await api.get(`/quizzes/${quizId}/questions`);
      setQuestions(res.data);
      setCurrentStep(0);
      setAnswers({});
      setRecommendations([]);
    } catch (err) {
      toast.error('Failed to load quiz questions');
      setSelectedQuizId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      setSelectedQuizId(null);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      // Auth is carried by the HttpOnly bp_token cookie (withCredentials); guests use x-session-id.
      const sessionId = localStorage.getItem('guest_chat_room_id') || 'default';
      const headers = {
        'x-session-id': sessionId,
      };

      const res = await api.post(`/quizzes/${selectedQuizId}/submit`, { answers }, { headers });
      setRecommendations(res.data.recommendations || []);
      toast.success('Quiz submitted! We found the best products for you. ✨');
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    const query = Object.entries(answers)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const shareUrl = `${window.location.origin}/${locale}/quiz?id=${selectedQuizId}&submit=true&${query}`;
    
    navigator.clipboard.writeText(shareUrl);
    toast.success('Your results link copied to clipboard! 📋');
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-[85vh] flex items-center justify-center bg-secondary/10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading diagnostic quizzes...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Quiz list page
  if (!selectedQuizId) {
    return (
      <>
        <Header />
        <main className="min-h-[85vh] py-12 bg-secondary/10">
          <div className="container mx-auto px-4 max-w-4xl space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">Beauty Diagnostics</h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Take our quick questionnaires and get a customized cosmetic recommendation routine instantly!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm flex flex-col justify-between hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                      {quiz.id === 'skin-type' ? '🌸' : '💄'}
                    </div>
                    <h3 className="text-xl font-playfair font-bold text-foreground">{quiz.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{quiz.description}</p>
                  </div>
                  <button
                    onClick={() => handleSelectQuiz(quiz.id)}
                    className="mt-6 w-full py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition cursor-pointer flex items-center justify-center gap-2 text-xs"
                  >
                    Start Quiz <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Quiz completed & recommendations result screen
  if (recommendations.length > 0) {
    return (
      <>
        <Header />
        <main className="min-h-[85vh] py-12 bg-secondary/10">
          <div className="container mx-auto px-4 max-w-5xl space-y-10">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1 bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs">
                <Sparkles className="w-3.5 h-3.5" /> Your Matches Found
              </div>
              <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground">Recommended for You</h1>
              <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                These premium products match your answers to provide the best look and skin compatibility.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendations.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="flex justify-center gap-3 pt-6">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full hover:bg-neutral-850 font-bold transition text-xs cursor-pointer shadow-md shadow-black/20"
              >
                <Share2 className="w-4 h-4" /> Share Results
              </button>
              <button
                onClick={() => handleSelectQuiz(selectedQuizId)}
                className="flex items-center gap-2 px-6 py-3 border border-border bg-card hover:bg-secondary/40 rounded-full font-semibold transition text-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Retake Quiz
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Step-by-step visual questionnaire screen
  const question = questions[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);

  return (
    <>
      <Header />
      <main className="min-h-[85vh] py-12 bg-secondary/10 flex items-center">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="bg-card border border-border/40 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Step {currentStep + 1} of {questions.length}</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="w-full bg-secondary/30 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Transition steps container */}
            <AnimatePresence mode="wait">
              {question && (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <QuizStep
                    question={question}
                    selectedValue={answers[question.id]}
                    onSelect={(val) => handleSelectOption(question.id, val)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back & Next controls */}
            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                onClick={handleNext}
                disabled={!answers[question?.id] || submitting}
                className="px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition disabled:opacity-50 flex items-center gap-1 text-xs cursor-pointer shadow-md shadow-primary/15"
              >
                {currentStep === questions.length - 1 ? 'Get Results' : 'Next'}{' '}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
