const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Courses ───────────────────────────────────────────────────────────────

const listCourses = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const courses = await prisma.course.findMany({
      where: isAdmin ? {} : { published: true },
      include: { _count: { select: { lessons: true, resources: true, quizzes: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getCourse = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        lessons:   { orderBy: { order: 'asc' } },
        resources: { orderBy: { createdAt: 'desc' } },
        quizzes:   { include: { questions: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!course) return res.status(404).json({ error: 'Cours introuvable' });
    if (!isAdmin && !course.published) return res.status(403).json({ error: 'Cours non disponible' });

    const completions = await prisma.lessonCompletion.findMany({
      where: { userId: req.user.id, lessonId: { in: course.lessons.map(l => l.id) } },
      select: { lessonId: true },
    });

    const attempts = course.quizzes.length > 0
      ? await prisma.quizAttempt.findMany({
          where: { userId: req.user.id, quizId: { in: course.quizzes.map(q => q.id) } },
          orderBy: { completedAt: 'desc' },
        })
      : [];

    // Ne pas envoyer les bonnes réponses aux non-admins
    const quizzes = isAdmin
      ? course.quizzes
      : course.quizzes.map(quiz => ({
          ...quiz,
          questions: quiz.questions.map(({ correct, explanation, ...q }) => q),
        }));

    res.json({
      course: {
        ...course,
        quizzes,
        completedLessonIds: completions.map(c => c.lessonId),
        myAttempts: attempts,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, category = 'general', level = 'tous', emoji = '📚' } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
    const course = await prisma.course.create({
      data: { title: title.trim(), description, category, level, emoji },
      include: { _count: { select: { lessons: true, resources: true, quizzes: true } } },
    });
    res.status(201).json({ course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { title, description, category, level, emoji, published, order } = req.body;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { title, description, category, level, emoji, published, order },
    });
    res.json({ course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Lessons ───────────────────────────────────────────────────────────────

const createLesson = async (req, res) => {
  try {
    const { title, body, videoUrl, order = 0 } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
    const lesson = await prisma.lesson.create({
      data: { courseId: req.params.courseId, title: title.trim(), body, videoUrl, order },
    });
    res.status(201).json({ lesson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { title, body, videoUrl, order } = req.body;
    const lesson = await prisma.lesson.update({
      where: { id: req.params.lessonId },
      data: { title, body, videoUrl, order },
    });
    res.json({ lesson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteLesson = async (req, res) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.lessonId } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const completeLesson = async (req, res) => {
  try {
    await prisma.lessonCompletion.upsert({
      where: { lessonId_userId: { lessonId: req.params.lessonId, userId: req.user.id } },
      create: { lessonId: req.params.lessonId, userId: req.user.id },
      update: {},
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Resources ─────────────────────────────────────────────────────────────

const listResources = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      where: { courseId: null },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ resources });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createResource = async (req, res) => {
  try {
    const { title, description, type = 'link', url, courseId } = req.body;
    if (!title?.trim() || !url?.trim()) return res.status(400).json({ error: 'Titre et URL requis' });
    const resource = await prisma.resource.create({
      data: { title: title.trim(), description, type, url: url.trim(), courseId: courseId || null },
    });
    res.status(201).json({ resource });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteResource = async (req, res) => {
  try {
    await prisma.resource.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Quizzes ───────────────────────────────────────────────────────────────

const createQuiz = async (req, res) => {
  try {
    const { title, description, courseId, questions = [] } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        description,
        courseId: courseId || null,
        questions: {
          create: questions.map((q, i) => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correct: q.correct,
            explanation: q.explanation || null,
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    res.status(201).json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const { title, description, questions = [] } = req.body;
    await prisma.quizQuestion.deleteMany({ where: { quizId: req.params.id } });
    const quiz = await prisma.quiz.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        questions: {
          create: questions.map((q, i) => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correct: q.correct,
            explanation: q.explanation || null,
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    res.json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    await prisma.quiz.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { answers = [] } = req.body; // [{ questionId, answer }]
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: { questions: true },
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' });

    let score = 0;
    const results = quiz.questions.map(q => {
      const userAnswer = answers.find(a => a.questionId === q.id)?.answer ?? -1;
      const isCorrect = userAnswer === q.correct;
      if (isCorrect) score++;
      return {
        questionId: q.id,
        question:   q.question,
        options:    JSON.parse(q.options),
        userAnswer,
        correct:    q.correct,
        isCorrect,
        explanation: q.explanation,
      };
    });

    await prisma.quizAttempt.create({
      data: { quizId: quiz.id, userId: req.user.id, score, total: quiz.questions.length },
    });

    res.json({ score, total: quiz.questions.length, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const myStats = async (req, res) => {
  try {
    const [completions, bestAttempts] = await Promise.all([
      prisma.lessonCompletion.count({ where: { userId: req.user.id } }),
      prisma.quizAttempt.findMany({
        where: { userId: req.user.id },
        orderBy: { completedAt: 'desc' },
        take: 20,
      }),
    ]);
    const passed = bestAttempts.filter(a => a.total > 0 && (a.score / a.total) >= 0.5).length;
    res.json({ lessonsCompleted: completions, quizzesPassed: passed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
  createLesson, updateLesson, deleteLesson, completeLesson,
  listResources, createResource, deleteResource,
  createQuiz, updateQuiz, deleteQuiz, submitQuiz,
  myStats,
};
