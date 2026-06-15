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

const isClassInstructor = async (classId, userId) => {
  const m = await prisma.classMember.findUnique({
    where: { classId_userId: { classId, userId } },
  });
  return m?.role === 'instructor' && m?.status === 'approved';
};

// ── User Search ────────────────────────────────────────────────────────────

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName:  { contains: q, mode: 'insensitive' } },
          { email:     { contains: q, mode: 'insensitive' } },
        ],
        NOT: { id: req.user.id },
      },
      select: userSelect,
      take: 8,
    });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Courses ───────────────────────────────────────────────────────────────

const listCourses = async (req, res) => {
  try {
    const admin = req.user.role === 'admin';
    const courses = await prisma.course.findMany({
      where: admin ? {} : {
        OR: [
          { published: true },
          { enrollments: { some: { userId: req.user.id } } },
        ],
      },
      include: { _count: { select: { lessons: true, resources: true, quizzes: true, enrollments: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    if (!admin) {
      const myEnrollments = await prisma.courseEnrollment.findMany({
        where: { userId: req.user.id },
        select: { courseId: true, role: true, status: true, invitedById: true },
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
    if (!admin && !course.published) {
      const enroll = await prisma.courseEnrollment.findUnique({
        where: { courseId_userId: { courseId: course.id, userId: req.user.id } },
      });
      if (!enroll) return res.status(403).json({ error: 'Cours non disponible' });
    }

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
        title: title.trim(), description, courseId: courseId || null,
        questions: {
          create: questions.map((q, i) => ({
            question: q.question, options: JSON.stringify(q.options),
            correct: q.correct, explanation: q.explanation || null, order: i,
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
        title, description,
        questions: {
          create: questions.map((q, i) => ({
            question: q.question, options: JSON.stringify(q.options),
            correct: q.correct, explanation: q.explanation || null, order: i,
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
        questionId: q.id, question: q.question, options: JSON.parse(q.options),
        userAnswer, correct: q.correct, isCorrect: correct, explanation: q.explanation,
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

// ── Course Enrollments ────────────────────────────────────────────────────

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

const inviteToCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { userId, role = 'member' } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId requis' });
    if (req.user.role !== 'admin' && !await isInstructor(courseId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });

    const target = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const enrollment = await prisma.courseEnrollment.upsert({
      where: { courseId_userId: { courseId, userId } },
      create: { courseId, userId, role, status: 'invited', invitedById: req.user.id },
      update: { status: 'invited', role, invitedById: req.user.id },
      include: { user: { select: userSelect } },
    });
    res.status(201).json({ enrollment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const respondToInvitation = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { accept } = req.body;

    const enroll = await prisma.courseEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enroll) return res.status(404).json({ error: 'Invitation introuvable' });
    if (enroll.userId !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (enroll.status !== 'invited') return res.status(400).json({ error: 'Cette invitation n\'est plus en attente' });

    const updated = await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: { status: accept ? 'approved' : 'rejected' },
    });
    res.json({ enrollment: updated });
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

// ── My Invitations ─────────────────────────────────────────────────────────

const myInvitations = async (req, res) => {
  try {
    const [courseInvites, classInvites] = await Promise.all([
      prisma.courseEnrollment.findMany({
        where: { userId: req.user.id, status: 'invited' },
        include: {
          course: { select: { id: true, title: true, description: true, emoji: true, category: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.classMember.findMany({
        where: { userId: req.user.id, status: 'invited' },
        include: {
          class: { select: { id: true, name: true, description: true, emoji: true, year: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json({ courseInvites, classInvites });
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

// ── Classes / Promos ──────────────────────────────────────────────────────

const listClasses = async (req, res) => {
  try {
    const admin = req.user.role === 'admin';
    const classes = await prisma.classGroup.findMany({
      where: admin ? {} : {
        members: { some: { userId: req.user.id, status: 'approved' } },
      },
      include: {
        _count: { select: { members: true, messages: true, courses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!admin) {
      const myMemberships = await prisma.classMember.findMany({
        where: { userId: req.user.id },
        select: { classId: true, role: true, status: true },
      });
      const mm = Object.fromEntries(myMemberships.map(m => [m.classId, m]));
      return res.json({ classes: classes.map(c => ({ ...c, myMembership: mm[c.id] || null })) });
    }

    res.json({ classes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getClass = async (req, res) => {
  try {
    const admin = req.user.role === 'admin';
    const cls = await prisma.classGroup.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          where: { status: 'approved' },
          include: { user: { select: userSelect } },
          orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        },
        courses: {
          include: {
            course: {
              select: {
                id: true, title: true, emoji: true, category: true, level: true,
                description: true, published: true,
                _count: { select: { lessons: true } },
              },
            },
          },
        },
      },
    });
    if (!cls) return res.status(404).json({ error: 'Classe introuvable' });

    const myMembership = await prisma.classMember.findUnique({
      where: { classId_userId: { classId: cls.id, userId: req.user.id } },
    });
    if (!admin && (!myMembership || myMembership.status !== 'approved'))
      return res.status(403).json({ error: 'Accès refusé' });

    res.json({ class: { ...cls, myMembership } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, description, emoji = '🏫', year } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nom requis' });
    const cls = await prisma.classGroup.create({
      data: { name: name.trim(), description, emoji, year },
      include: { _count: { select: { members: true, messages: true, courses: true } } },
    });
    res.status(201).json({ class: cls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateClass = async (req, res) => {
  try {
    const { name, description, emoji, year, archived } = req.body;
    const cls = await prisma.classGroup.update({
      where: { id: req.params.id },
      data: { name, description, emoji, year, archived },
    });
    res.json({ class: cls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteClass = async (req, res) => {
  try {
    await prisma.classGroup.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Class Members ─────────────────────────────────────────────────────────

const listClassMembers = async (req, res) => {
  try {
    const { id: classId } = req.params;
    if (req.user.role !== 'admin' && !await isClassInstructor(classId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });

    const members = await prisma.classMember.findMany({
      where: { classId },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const inviteToClass = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { userId, role = 'student' } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId requis' });
    if (req.user.role !== 'admin' && !await isClassInstructor(classId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });

    const target = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const member = await prisma.classMember.upsert({
      where: { classId_userId: { classId, userId } },
      create: { classId, userId, role, status: 'invited', invitedById: req.user.id },
      update: { status: 'invited', role, invitedById: req.user.id },
      include: { user: { select: userSelect } },
    });
    res.status(201).json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const addClassMember = async (req, res) => {
  try {
    const { id: classId } = req.params;
    if (req.user.role !== 'admin' && !await isClassInstructor(classId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });

    const { email, role = 'student' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const target = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!target) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const member = await prisma.classMember.upsert({
      where: { classId_userId: { classId, userId: target.id } },
      create: { classId, userId: target.id, role, status: 'approved' },
      update: { status: 'approved', role },
      include: { user: { select: userSelect } },
    });
    res.json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateClassMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status, role } = req.body;

    const m = await prisma.classMember.findUnique({ where: { id: memberId } });
    if (!m) return res.status(404).json({ error: 'Membre introuvable' });
    if (req.user.role !== 'admin' && !await isClassInstructor(m.classId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });

    const updated = await prisma.classMember.update({
      where: { id: memberId },
      data: {
        ...(status !== undefined && { status }),
        ...(role   !== undefined && { role }),
      },
      include: { user: { select: userSelect } },
    });
    res.json({ member: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const respondToClassInvitation = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { accept } = req.body;

    const m = await prisma.classMember.findUnique({ where: { id: memberId } });
    if (!m) return res.status(404).json({ error: 'Invitation introuvable' });
    if (m.userId !== req.user.id) return res.status(403).json({ error: 'Accès refusé' });
    if (m.status !== 'invited') return res.status(400).json({ error: 'Cette invitation n\'est plus en attente' });

    const updated = await prisma.classMember.update({
      where: { id: memberId },
      data: { status: accept ? 'approved' : 'rejected' },
    });
    res.json({ member: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const requestJoinClass = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const existing = await prisma.classMember.findUnique({
      where: { classId_userId: { classId, userId: req.user.id } },
    });
    if (existing) return res.json({ member: existing });
    const member = await prisma.classMember.create({
      data: { classId, userId: req.user.id, role: 'student', status: 'pending' },
    });
    res.status(201).json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const removeClassMember = async (req, res) => {
  try {
    const { id: classId, userId } = req.params;
    if (req.user.role !== 'admin' && !await isClassInstructor(classId, req.user.id))
      return res.status(403).json({ error: 'Accès refusé' });
    await prisma.classMember.deleteMany({ where: { classId, userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Class Courses ─────────────────────────────────────────────────────────

const addCourseToClass = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: 'courseId requis' });

    await prisma.classGroupCourse.upsert({
      where: { classId_courseId: { classId, courseId } },
      create: { classId, courseId },
      update: {},
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const removeCourseFromClass = async (req, res) => {
  try {
    const { id: classId, courseId } = req.params;
    await prisma.classGroupCourse.deleteMany({ where: { classId, courseId } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Class Messages ────────────────────────────────────────────────────────

const getClassMessages = async (req, res) => {
  try {
    const { id: classId } = req.params;
    if (req.user.role !== 'admin') {
      const m = await prisma.classMember.findUnique({
        where: { classId_userId: { classId, userId: req.user.id } },
      });
      if (!m || m.status !== 'approved') return res.status(403).json({ error: 'Accès refusé' });
    }
    const messages = await prisma.classGroupMessage.findMany({
      where: { classId },
      include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const sendClassMessage = async (req, res) => {
  try {
    const { id: classId } = req.params;
    if (req.user.role !== 'admin') {
      const m = await prisma.classMember.findUnique({
        where: { classId_userId: { classId, userId: req.user.id } },
      });
      if (!m || m.status !== 'approved') return res.status(403).json({ error: 'Accès refusé' });
    }

    const { content } = req.body;
    if (!content?.trim() && !req.file) return res.status(400).json({ error: 'Message ou fichier requis' });

    let filePath = null, fileName = null;
    if (req.file) {
      const r = await uploadToCloudinary(req.file.buffer, { folder: 'aegl/class-chat', type: 'upload' });
      filePath = r.secure_url;
      fileName = req.file.originalname;
    }

    const message = await prisma.classGroupMessage.create({
      data: { classId, userId: req.user.id, content: content?.trim() || null, filePath, fileName },
      include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteClassMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await prisma.classGroupMessage.findUnique({ where: { id: messageId } });
    if (!msg) return res.status(404).json({ error: 'Message introuvable' });
    if (req.user.role !== 'admin' && msg.userId !== req.user.id)
      return res.status(403).json({ error: 'Accès refusé' });
    await prisma.classGroupMessage.delete({ where: { id: messageId } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ── Public class list (for joining) ───────────────────────────────────────

const listPublicClasses = async (req, res) => {
  try {
    const classes = await prisma.classGroup.findMany({
      where: { archived: false },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const myMemberships = await prisma.classMember.findMany({
      where: { userId: req.user.id },
      select: { classId: true, role: true, status: true },
    });
    const mm = Object.fromEntries(myMemberships.map(m => [m.classId, m]));
    res.json({ classes: classes.map(c => ({ ...c, myMembership: mm[c.id] || null })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  searchUsers,
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
  createLesson, updateLesson, deleteLesson, completeLesson,
  listResources, createResource, uploadResource, deleteResource,
  createQuiz, updateQuiz, deleteQuiz, submitQuiz,
  myStats,
  requestEnrollment, inviteToCourse, respondToInvitation,
  listEnrollments, updateEnrollment, addMember, removeMember,
  myInvitations,
  getCourseMessages, sendCourseMessage, deleteCourseMessage,
  listClasses, getClass, createClass, updateClass, deleteClass,
  listPublicClasses,
  listClassMembers, inviteToClass, addClassMember, updateClassMember,
  respondToClassInvitation, requestJoinClass, removeClassMember,
  addCourseToClass, removeCourseFromClass,
  getClassMessages, sendClassMessage, deleteClassMessage,
};
