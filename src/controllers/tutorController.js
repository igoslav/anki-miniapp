const crypto = require('crypto');
const { User, TutorStudent, Lesson, Card, LanguagePair } = require('../models');
const { serializeCard } = require('../services/serializers');

// --- Tutor endpoints ---

async function getStudents(req, res) {
  try {
    const tutorId = req.params.userId;
    const links = await TutorStudent.find({ tutorId, status: { $in: ['pending', 'active'] } });

    const students = [];
    for (const link of links) {
      let profile = null;
      if (link.studentId) {
        const user = await User.findOne({ telegramId: link.studentId });
        if (user) profile = { firstName: user.firstName, lastName: user.lastName, username: user.username };
      }
      students.push({
        id: String(link._id),
        studentId: link.studentId,
        inviteCode: link.inviteCode,
        status: link.status,
        profile
      });
    }

    res.json({ students });
  } catch (err) {
    console.error('getStudents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateInvite(req, res) {
  try {
    const tutorId = req.params.userId;
    const inviteCode = crypto.randomBytes(4).toString('hex');

    const link = await TutorStudent.create({ tutorId, inviteCode });
    res.json({ inviteCode: link.inviteCode, id: String(link._id) });
  } catch (err) {
    console.error('generateInvite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function removeStudent(req, res) {
  try {
    const tutorId = req.params.userId;
    const { linkId } = req.params;

    const result = await TutorStudent.updateOne(
      { _id: linkId, tutorId },
      { status: 'revoked' }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Link not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('removeStudent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createLesson(req, res) {
  try {
    const tutorId = req.params.userId;
    const { title, description, languagePairId, cards } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const lesson = await Lesson.create({
      tutorId,
      title,
      description: description || '',
      languagePairId: languagePairId || null,
      cards: cards || []
    });

    res.json({
      id: String(lesson._id),
      title: lesson.title,
      description: lesson.description,
      cards: lesson.cards,
      assignedTo: lesson.assignedTo,
      createdAt: lesson.createdAt.toISOString()
    });
  } catch (err) {
    console.error('createLesson error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function addCardsToLesson(req, res) {
  try {
    const tutorId = req.params.userId;
    const { lessonId } = req.params;
    const { cards } = req.body;
    if (!Array.isArray(cards)) return res.status(400).json({ error: 'cards array required' });

    const lesson = await Lesson.findOne({ _id: lessonId, tutorId });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    lesson.cards.push(...cards);
    await lesson.save();

    res.json({ cardCount: lesson.cards.length });
  } catch (err) {
    console.error('addCardsToLesson error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLessons(req, res) {
  try {
    const tutorId = req.params.userId;
    const lessons = await Lesson.find({ tutorId }).sort({ createdAt: -1 });

    res.json({
      lessons: lessons.map(l => ({
        id: String(l._id),
        title: l.title,
        description: l.description,
        cardCount: l.cards.length,
        assignedCount: l.assignedTo.length,
        createdAt: l.createdAt.toISOString()
      }))
    });
  } catch (err) {
    console.error('getLessons error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendLesson(req, res) {
  try {
    const tutorId = req.params.userId;
    const { lessonId } = req.params;
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'studentIds array required' });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, tutorId });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Verify all students are actively linked
    const activeLinks = await TutorStudent.find({
      tutorId,
      studentId: { $in: studentIds },
      status: 'active'
    });
    const activeStudentIds = new Set(activeLinks.map(l => l.studentId));

    const invalid = studentIds.filter(id => !activeStudentIds.has(id));
    if (invalid.length > 0) {
      return res.status(400).json({ error: 'Some students are not actively linked', invalid });
    }

    // Add assignments
    const now = new Date();
    for (const studentId of studentIds) {
      const alreadyAssigned = lesson.assignedTo.some(a => a.studentId === studentId);
      if (!alreadyAssigned) {
        lesson.assignedTo.push({ studentId, assignedAt: now });
      }
    }
    await lesson.save();

    // Send bot notifications
    const bot = require('../bot/bot');
    const tutor = await User.findOne({ telegramId: tutorId });
    const tutorName = tutor ? (tutor.firstName || tutor.username || 'Your tutor') : 'Your tutor';

    for (const studentId of studentIds) {
      try {
        await bot.sendMessage(studentId,
          `${tutorName} sent you a new lesson: "${lesson.title}" (${lesson.cards.length} cards).\nOpen the app to accept it!`,
          {
            reply_markup: {
              inline_keyboard: [[{
                text: 'Open App',
                web_app: { url: `${process.env.MINIAPP_URL}?user_id=${studentId}` }
              }]]
            }
          }
        );
      } catch (e) {
        console.error(`Failed to notify student ${studentId}:`, e.message);
      }
    }

    res.json({ success: true, assignedCount: lesson.assignedTo.length });
  } catch (err) {
    console.error('sendLesson error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- Student endpoints ---

async function getInvitations(req, res) {
  try {
    const studentId = req.params.userId;
    const links = await TutorStudent.find({ studentId, status: 'pending' });

    const invitations = [];
    for (const link of links) {
      const tutor = await User.findOne({ telegramId: link.tutorId });
      invitations.push({
        id: String(link._id),
        tutorId: link.tutorId,
        tutorProfile: tutor ? { firstName: tutor.firstName, lastName: tutor.lastName, username: tutor.username } : null
      });
    }

    res.json({ invitations });
  } catch (err) {
    console.error('getInvitations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function respondToInvitation(req, res) {
  try {
    const studentId = req.params.userId;
    const { linkId } = req.params;
    const { accept } = req.body;

    const link = await TutorStudent.findOne({ _id: linkId, studentId, status: 'pending' });
    if (!link) return res.status(404).json({ error: 'Invitation not found' });

    link.status = accept ? 'active' : 'revoked';
    await link.save();

    res.json({ success: true, status: link.status });
  } catch (err) {
    console.error('respondToInvitation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getStudentLessons(req, res) {
  try {
    const studentId = req.params.userId;
    const lessons = await Lesson.find({ 'assignedTo.studentId': studentId });

    res.json({
      lessons: lessons.map(l => {
        const assignment = l.assignedTo.find(a => a.studentId === studentId);
        return {
          id: String(l._id),
          title: l.title,
          description: l.description,
          tutorId: l.tutorId,
          cardCount: l.cards.length,
          accepted: assignment ? assignment.accepted : false,
          assignedAt: assignment ? assignment.assignedAt.toISOString() : null
        };
      })
    });
  } catch (err) {
    console.error('getStudentLessons error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function acceptLesson(req, res) {
  try {
    const studentId = req.params.userId;
    const { lessonId } = req.params;
    const { languagePairId } = req.body;

    const lesson = await Lesson.findOne({ _id: lessonId, 'assignedTo.studentId': studentId });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const assignment = lesson.assignedTo.find(a => a.studentId === studentId);
    if (assignment.accepted) return res.status(400).json({ error: 'Lesson already accepted' });

    // Determine language pair
    const pairId = languagePairId || lesson.languagePairId;
    if (pairId) {
      const pair = await LanguagePair.findOne({ _id: pairId, userId: studentId });
      if (!pair) return res.status(400).json({ error: 'Language pair not found' });
    }

    // Create cards from lesson templates
    const cardDocs = lesson.cards.map(c => ({
      userId: studentId,
      languagePairId: pairId,
      front: { word: c.front.word, imageUrl: c.front.imageUrl || '' },
      back: { translation: c.back.translation, example: c.back.example || '', pronunciation: c.back.pronunciation || '' },
      source: 'tutor',
      sourceTutorId: lesson.tutorId,
      lessonId: lesson._id
    }));

    const created = await Card.insertMany(cardDocs);

    // Mark assignment as accepted
    assignment.accepted = true;
    await lesson.save();

    res.json({ success: true, cardsCreated: created.length });
  } catch (err) {
    console.error('acceptLesson error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getStudents, generateInvite, removeStudent,
  createLesson, addCardsToLesson, getLessons, sendLesson,
  getInvitations, respondToInvitation, getStudentLessons, acceptLesson
};
