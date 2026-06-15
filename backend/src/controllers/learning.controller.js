const { PrismaClient } = require('@prisma/client');
const { uploadToCloudinary } = require('../middlewares/upload.middleware');
const prisma = new PrismaClient();

const userSelect = { id: true, firstName: true, lastName: true, email: true, role: true };

// ── Helpers ───────────────────────────────────────────────────────────────

const isInstructor = async (courseId, userId) => {
  const e = await prisma.courseEnrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  return e?.role === 'instructor' && e?.status === 'approved';
};

// ── Courses ───────────────────────────────────────────────────────────────

const listCourses = async (req, res) => {
  try {
    const admin = req.user.role === 'admin';
    const courses = await prisma.course.findMany({
      where: admin ? {} : { published: true },
      include: { _count: { select: { lessons: true, resources: true, quizzes: true, enrollments: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    if (!admin) {
      const myEnrollments = await prisma.courseEnrollment.findMany({
        where: { userId: req.user.id },
        select: { courseId: true, role: true, status: true },
      });
      const em = Object.fromEntries(myEnrollments.map(e => [e.courseId, e]));
      return res.json({ courses: courses.map(c => ({ ...c, myEnrollment: em[c.id] || null })) });
    }

    res.json({ courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getCourse = async (req, res) => {
  try {
    const admin = req.user.role === 'admin';
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        lessons:   { orderBy: { order: 'asc' } },
        resources: { orderBy: { createdAt: 'desc' } },
        quizzes:   { include: { questions: { orderBy: { order: 'asc' } } } },
      },
    });
    if (!course) return res.status(404).json({ error: 'Cours introuvable' });
    if (!admin && !course.published) return res.status(403).json({ error: 'Cours non disponible' });

    let myEnrollment = null;
    if (!admin) {
      myEnrollment = await prisma.courseEnrollment.findUnique({
        where: { courseId_userId: { courseId: course.id, userId: req.user.id } },
      });
      if (course.restricted && (!myEnrollment || myEnrollment.status !== 'approved')) {
        return res.status(403).json({ error: 'Accès restreint', restricted: true, myEnrollment });
      }
    }

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

    const quizzes = admin
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
        myEnrollment,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, category = 'general', level = 'tous', emoji = '📚', restricted = false } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
    const course = await prisma.course.create({
      data: { title: title.trim(), description, category, level, emoji, restricted },
      include: { _count: { select: { lessons: true, resources: true, quizzes: true, enrollments: true } } },
    });
    res.status(201).json({ course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { title, description, category, level, emoji, published, order, restricted } = req.body;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { title, description, category, level, emoji, published, order, restricted },
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
    const { courseId } = req.params;
    if (req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });
    const { title, body, videoUrl, order = 0 } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
    const lesson = await prisma.lesson.create({
      data: { courseId, title: title.trim(), body, videoUrl, order },
    });
    res.status(201).json({ lesson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });
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
    const { courseId } = req.params;
    if (req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });
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
    if (courseId && req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });
    const resource = await prisma.resource.create({
      data: { title: title.trim(), description, type, url: url.trim(), courseId: courseId || null },
    });
    res.status(201).json({ resource });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const uploadResource = async (req, res) => {
  try {
    const { title, description, courseId } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Titre requis' });
    if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
    if (courseId && req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });

    const mime = req.file.mimetype;
    let type = 'pdf';
    if (mime.startsWith('video/')) type = 'video';
    else if (mime.startsWith('audio/')) type = 'audio';

    const r = await uploadToCloudinary(req.file.buffer, { folder: 'aegl/resources', type: 'upload' });

    const resource = await prisma.resource.create({
      data: {
        title: title.trim(),
        description: description || null,
        type,
        url: r.secure_url,
        filePath: r.public_id,
        fileName: req.file.originalname,
        courseId: courseId || null,
      },
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
    if (courseId && req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });
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
    const { answers = [] } = req.body;
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: { questions: true },
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' });

    let score = 0;
    const results = quiz.questions.map(q => {
      const userAnswer = answers.find(a => a.questionId === q.id)?.answer ?? -1;
      const correct = userAnswer === q.correct;
      if (correct) score++;
      return {
        questionId: q.id,
        question:   q.question,
        options:    JSON.parse(q.options),
        userAnswer,
        correct:    q.correct,
        isCorrect:  correct,
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
    const [completions, attempts] = await Promise.all([
      prisma.lessonCompletion.count({ where: { userId: req.user.id } }),
      prisma.quizAttempt.findMany({ where: { userId: req.user.id }, orderBy: { completedAt: 'desc' }, take: 20 }),
    ]);
    const passed = attempts.filter(a => a.total > 0 && (a.score / a.total) >= 0.5).length;
    res.json({ lessonsCompleted: completions, quizzesPassed: passed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Enrollments ───────────────────────────────────────────────────────────

const requestEnrollment = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { restricted: true, published: true } });
    if (!course || !course.published) return res.status(404).json({ error: 'Cours introuvable' });
    if (!course.restricted) return res.status(400).json({ error: 'Ce cours est ouvert à tous' });

    const existing = await prisma.courseEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId: req.user.id } },
    });
    if (existing) return res.json({ enrollment: existing });

    const enrollment = await prisma.courseEnrollment.create({
      data: { courseId, userId: req.user.id, role: 'member', status: 'pending' },
    });
    res.status(201).json({ enrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const listEnrollments = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    if (req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ enrollments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status, role } = req.body;

    const enroll = await prisma.courseEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enroll) return res.status(404).json({ error: 'Inscription introuvable' });

    if (req.user.role !== 'admin' && !await isInstructor(enroll.courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });

    const updated = await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        ...(status !== undefined && { status }),
        ...(role   !== undefined && { role }),
      },
      include: { user: { select: userSelect } },
    });
    res.json({ enrollment: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const addMember = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    if (req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });

    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const target = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const enrollment = await prisma.courseEnrollment.upsert({
      where: { courseId_userId: { courseId, userId: target.id } },
      create: { courseId, userId: target.id, role, status: 'approved' },
      update: { status: 'approved', role },
      include: { user: { select: userSelect } },
    });
    res.json({ enrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id: courseId, userId } = req.params;
    if (req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });
    await prisma.courseEnrollment.deleteMany({ where: { courseId, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Course Messages ────────────────────────────────────────────────────────

const checkCourseAccess = async (courseId, userId, role) => {
  if (role === 'admin') return true;
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { restricted: true, published: true } });
  if (!course || !course.published) return false;
  if (!course.restricted) return true;
  const enroll = await prisma.courseEnrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  return enroll?.status === 'approved';
};

const getCourseMessages = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    if (!await checkCourseAccess(courseId, req.user.id, req.user.role))
      return res.status(403).json({ error: 'Accès refusé' });

    const messages = await prisma.courseMessage.findMany({
      where: { courseId },
      include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 150,
    });
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const sendCourseMessage = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    if (!await checkCourseAccess(courseId, req.user.id, req.user.role))
      return res.status(403).json({ error: 'Accès refusé' });

    const { content } = req.body;
    if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Message ou fichier requis' });

    let filePath = null, fileName = null;
    if (req.file) {
      const r = await uploadToCloudinary(req.file.buffer, { folder: 'aegl/course-chat', type: 'upload' });
      filePath = r.secure_url;
      fileName = req.file.originalname;
    }

    const message = await prisma.courseMessage.create({
      data: { courseId, userId: req.user.id, content: content?.trim() || null, filePath, fileName },
      include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteCourseMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await prisma.courseMessage.findUnique({ where: { id: messageId } });
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });
    if (req.user.role !== 'admin' && msg.userId !== req.user.id)
      return res.status(403).json({ error: 'Accès refusé' });
    await prisma.courseMessage.delete({ where: { id: messageId } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
  createLesson, updateLesson, deleteLesson, completeLesson,
  listResources, createResource, uploadResource, deleteResource,
  createQuiz, updateQuiz, deleteQuiz, submitQuiz,
  myStats,
  requestEnrollment, listEnrollments, updateEnrollment, addMember, removeMember,
  getCourseMessages, sendCourseMessage, deleteCourseMessage,
};
